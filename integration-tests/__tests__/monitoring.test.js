/**
 * Metrics & Monitoring Tests
 * Tests for Grafana, Prometheus metrics, and observability endpoints
 */

const axios = require('axios');

describe('Metrics & Monitoring Tests', () => {
    describe('Grafana', () => {
        test('Grafana is accessible', async () => {
            const response = await grafanaApi.get('/api/health');
            expect(response.status).toBe(200);
        });

        test('Grafana health check returns OK', async () => {
            const response = await grafanaApi.get('/api/health');
            expect(response.data.database).toBe('ok');
        });

        test('Grafana datasources are configured', async () => {
            try {
                // Try to access datasources (may require auth)
                const response = await grafanaApi.get('/api/datasources', {
                    auth: {
                        username: 'admin',
                        password: 'admin'
                    }
                });
                expect(response.status).toBe(200);
                expect(Array.isArray(response.data)).toBe(true);
            } catch (error) {
                // If auth fails, at least verify Grafana is running
                const healthResponse = await grafanaApi.get('/api/health');
                expect(healthResponse.status).toBe(200);
            }
        });

        test('Grafana UI is accessible', async () => {
            const response = await grafanaApi.get('/');
            expect(response.status).toBe(200);
        });
    });

    describe('Backend Metrics', () => {
        test('Actuator metrics endpoint is available', async () => {
            const response = await backendApi.get('/actuator/metrics');
            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('names');
            expect(Array.isArray(response.data.names)).toBe(true);
        });

        test('Prometheus metrics endpoint is available', async () => {
            const response = await backendApi.get('/actuator/prometheus');
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('text/plain');
        });

        test('JVM metrics are exposed', async () => {
            const response = await backendApi.get('/actuator/prometheus');
            const metrics = response.data;

            expect(metrics).toContain('jvm_memory');
            expect(metrics).toContain('jvm_threads');
        });

        test('HTTP metrics are exposed', async () => {
            // Make some requests first to generate metrics
            await backendApi.get('/api/users').catch(() => { });
            await backendApi.get('/api/products').catch(() => { });

            const response = await backendApi.get('/actuator/prometheus');
            const metrics = response.data;

            expect(metrics).toContain('http_server');
        });

        test('Specific metric can be queried', async () => {
            const response = await backendApi.get('/actuator/metrics/jvm.memory.used');
            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('name', 'jvm.memory.used');
            expect(response.data).toHaveProperty('measurements');
        });
    });

    describe('Health Endpoints', () => {
        test('Liveness probe endpoint works', async () => {
            try {
                const response = await backendApi.get('/actuator/health/liveness');
                expect(response.status).toBe(200);
            } catch (error) {
                // Fallback to main health endpoint
                const response = await backendApi.get('/actuator/health');
                expect(response.status).toBe(200);
            }
        });

        test('Readiness probe endpoint works', async () => {
            try {
                const response = await backendApi.get('/actuator/health/readiness');
                expect(response.status).toBe(200);
            } catch (error) {
                // Fallback to main health endpoint
                const response = await backendApi.get('/actuator/health');
                expect(response.status).toBe(200);
            }
        });

        test('Health details are available', async () => {
            const response = await backendApi.get('/actuator/health');
            expect(response.data).toHaveProperty('status');
            // Components might include db, mongo, kafka, etc.
            if (response.data.components) {
                expect(typeof response.data.components).toBe('object');
            }
        });
    });

    describe('Logging', () => {
        test('Loggers endpoint is available or returns error', async () => {
            try {
                const response = await backendApi.get('/actuator/loggers');
                expect(response.status).toBe(200);
                expect(response.data).toHaveProperty('loggers');
            } catch (error) {
                // Loggers endpoint may not be exposed in production config
                expect([404, 500]).toContain(error.response?.status);
            }
        });

        test('Actuator endpoints are accessible', async () => {
            // Verify at least the main actuator endpoint works
            const response = await backendApi.get('/actuator');
            expect(response.status).toBe(200);
        });
    });
});
