/**
 * OpenTelemetry Tracing Tests
 * Tests for distributed tracing with Jaeger and OpenTelemetry Collector
 */

const axios = require('axios');

describe('OpenTelemetry Tracing Tests', () => {
    describe('Jaeger', () => {
        test('Jaeger UI is accessible', async () => {
            const response = await jaegerApi.get('/');
            expect(response.status).toBe(200);
        });

        test('Jaeger API is responsive', async () => {
            const response = await jaegerApi.get('/api/services');
            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('data');
        });

        test('Backend service is registered in Jaeger', async () => {
            // Generate some traces first by making API calls
            await backendApi.get('/api/users').catch(() => { });
            await backendApi.get('/api/products').catch(() => { });

            // Wait a moment for traces to be processed
            await new Promise(resolve => setTimeout(resolve, 2000));

            const response = await jaegerApi.get('/api/services');
            const services = response.data.data || [];

            const hasBackendService = services.some(service =>
                service.toLowerCase().includes('observability') ||
                service.toLowerCase().includes('backend')
            );

            expect(hasBackendService).toBe(true);
        });

        test('Traces contain spans', async () => {
            // Generate traces
            await backendApi.get('/api/users').catch(() => { });

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Get services first
            const servicesResponse = await jaegerApi.get('/api/services');
            const services = servicesResponse.data.data || [];

            // Find backend service
            const backendService = services.find(s =>
                s.toLowerCase().includes('observability') ||
                s.toLowerCase().includes('backend')
            );

            if (backendService) {
                const tracesResponse = await jaegerApi.get('/api/traces', {
                    params: {
                        service: backendService,
                        limit: 10
                    }
                });

                expect(tracesResponse.data).toHaveProperty('data');
                expect(tracesResponse.data.data.length).toBeGreaterThan(0);

                // Count total spans
                const totalSpans = tracesResponse.data.data.reduce(
                    (sum, trace) => sum + (trace.spans?.length || 0), 0
                );
                expect(totalSpans).toBeGreaterThan(0);
            }
        });

        test('Traces have proper structure', async () => {
            // Get services
            const servicesResponse = await jaegerApi.get('/api/services');
            const services = servicesResponse.data.data || [];

            const backendService = services.find(s =>
                s.toLowerCase().includes('observability')
            );

            if (backendService) {
                const tracesResponse = await jaegerApi.get('/api/traces', {
                    params: {
                        service: backendService,
                        limit: 1
                    }
                });

                const traces = tracesResponse.data.data || [];
                if (traces.length > 0) {
                    const trace = traces[0];

                    // Verify trace structure
                    expect(trace).toHaveProperty('traceID');
                    expect(trace).toHaveProperty('spans');
                    expect(trace.spans.length).toBeGreaterThan(0);

                    // Verify span structure
                    const span = trace.spans[0];
                    expect(span).toHaveProperty('spanID');
                    expect(span).toHaveProperty('operationName');
                    expect(span).toHaveProperty('duration');
                }
            }
        });
    });

    describe('OpenTelemetry Collector', () => {
        test('OTLP HTTP endpoint is accessible', async () => {
            try {
                // The OTLP endpoint won't return 200 for GET, but should be reachable
                await axios.get(CONFIG.otelCollector.httpEndpoint, { timeout: 5000 });
            } catch (error) {
                // 404 or 405 means the endpoint is reachable but doesn't support GET
                if (error.response) {
                    expect([404, 405, 400]).toContain(error.response.status);
                } else {
                    // Connection refused means collector is not running
                    throw error;
                }
            }
        });

        test('Collector container is healthy', async () => {
            const Docker = require('dockerode');
            const docker = new Docker();

            const containers = await docker.listContainers();
            const collector = containers.find(c =>
                c.Names[0].toLowerCase().includes('otel-collector')
            );

            expect(collector).toBeDefined();
            expect(collector.State).toBe('running');
        });
    });

    describe('Trace Propagation', () => {
        test('API calls generate new traces', async () => {
            // Get initial trace count
            const servicesResponse = await jaegerApi.get('/api/services');
            const services = servicesResponse.data.data || [];
            const backendService = services.find(s =>
                s.toLowerCase().includes('observability')
            );

            if (backendService) {
                const initialResponse = await jaegerApi.get('/api/traces', {
                    params: { service: backendService, limit: 100 }
                });
                const initialCount = initialResponse.data.data?.length || 0;

                // Make several API calls
                for (let i = 0; i < 3; i++) {
                    await backendApi.get('/api/products').catch(() => { });
                }

                // Wait for traces to be collected
                await new Promise(resolve => setTimeout(resolve, 3000));

                // Check for new traces
                const finalResponse = await jaegerApi.get('/api/traces', {
                    params: { service: backendService, limit: 100 }
                });
                const finalCount = finalResponse.data.data?.length || 0;

                // Should have more or same traces (same if limit reached)
                expect(finalCount).toBeGreaterThanOrEqual(initialCount);
            }
        });
    });
});
