/**
 * Jest Setup - Global configuration and utilities for integration tests
 */

const axios = require('axios');

// Configuration
global.CONFIG = {
    backend: {
        baseUrl: process.env.API_URL || 'http://localhost:8080',
        healthEndpoint: '/actuator/health',
        timeout: 10000
    },
    frontend: {
        baseUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
        timeout: 10000
    },
    jaeger: {
        baseUrl: process.env.JAEGER_URL || 'http://localhost:16686',
        timeout: 10000
    },
    grafana: {
        baseUrl: process.env.GRAFANA_URL || 'http://localhost:3000',
        timeout: 10000
    },
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/observability'
    },
    clickhouse: {
        host: process.env.CLICKHOUSE_HOST || 'localhost',
        port: process.env.CLICKHOUSE_PORT || 8123
    },
    kafka: {
        broker: process.env.KAFKA_BROKER || 'localhost:9092'
    },
    otelCollector: {
        httpEndpoint: process.env.OTEL_COLLECTOR_HTTP || 'http://localhost:4318'
    }
};

// Create pre-configured axios instances
global.backendApi = axios.create({
    baseURL: global.CONFIG.backend.baseUrl,
    timeout: global.CONFIG.backend.timeout,
    headers: { 'Content-Type': 'application/json' }
});

global.frontendApi = axios.create({
    baseURL: global.CONFIG.frontend.baseUrl,
    timeout: global.CONFIG.frontend.timeout
});

global.jaegerApi = axios.create({
    baseURL: global.CONFIG.jaeger.baseUrl,
    timeout: global.CONFIG.jaeger.timeout
});

global.grafanaApi = axios.create({
    baseURL: global.CONFIG.grafana.baseUrl,
    timeout: global.CONFIG.grafana.timeout
});

// Utility function to wait for service availability
global.waitForService = async (url, maxRetries = 10, delayMs = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await axios.get(url, { timeout: 5000 });
            return true;
        } catch (error) {
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    return false;
};

// Utility function to generate unique test data
global.generateTestData = () => {
    const timestamp = Date.now();
    return {
        user: {
            name: `Test User ${timestamp}`,
            email: `test${timestamp}@example.com`,
            password: 'TestPass123!'
        },
        product: {
            name: `Test Product ${timestamp}`,
            description: `Integration test product created at ${new Date().toISOString()}`,
            price: Math.floor(Math.random() * 1000) + 1,
            expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
    };
};

// Extend Jest matchers
expect.extend({
    toBeHealthy(received) {
        const pass = received?.status === 'UP' || received?.status === 200;
        return {
            message: () => `expected service ${pass ? 'not ' : ''}to be healthy`,
            pass
        };
    },
    toContainSpans(received, minCount = 1) {
        const spans = received?.data?.length || 0;
        const pass = spans >= minCount;
        return {
            message: () => `expected ${spans} spans ${pass ? 'not ' : ''}to be >= ${minCount}`,
            pass
        };
    }
});

// Global test timeout
jest.setTimeout(30000);

// Console log test environment on startup
console.log('\n🧪 Integration Test Environment:');
console.log(`   Backend:  ${global.CONFIG.backend.baseUrl}`);
console.log(`   Frontend: ${global.CONFIG.frontend.baseUrl}`);
console.log(`   Jaeger:   ${global.CONFIG.jaeger.baseUrl}`);
console.log(`   Grafana:  ${global.CONFIG.grafana.baseUrl}\n`);
