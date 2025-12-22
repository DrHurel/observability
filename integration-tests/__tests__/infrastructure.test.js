/**
 * Infrastructure Health Check Tests
 * Verifies that all Docker containers and services are running correctly
 */

const Docker = require('dockerode');

describe('Infrastructure Health Checks', () => {
    let docker;

    beforeAll(() => {
        docker = new Docker();
    });

    describe('Docker Environment', () => {
        test('Docker daemon is accessible', async () => {
            const info = await docker.info();
            expect(info).toBeDefined();
            expect(info.Containers).toBeGreaterThanOrEqual(0);
        });

        test('Required containers are running', async () => {
            const containers = await docker.listContainers();
            const containerNames = containers.map(c => c.Names[0].replace('/', ''));

            const requiredPatterns = [
                'mongo',
                'clickhouse',
                'kafka',
                'app',
                'frontend',
                'jaeger',
                'otel-collector'
            ];

            for (const pattern of requiredPatterns) {
                const found = containerNames.some(name =>
                    name.toLowerCase().includes(pattern.toLowerCase())
                );
                expect(found).toBe(true);
            }
        });
    });

    describe('Container Health Status', () => {
        const containerPatterns = [
            { pattern: 'mongo', description: 'MongoDB' },
            { pattern: 'clickhouse', description: 'ClickHouse' },
            { pattern: 'kafka', description: 'Kafka' },
            { pattern: 'app', description: 'Backend Application' },
            { pattern: 'frontend', description: 'Frontend Application' },
            { pattern: 'jaeger', description: 'Jaeger' },
            { pattern: 'otel-collector', description: 'OpenTelemetry Collector' }
        ];

        test.each(containerPatterns)(
            '$description container is running',
            async ({ pattern }) => {
                const containers = await docker.listContainers();
                const container = containers.find(c =>
                    c.Names[0].toLowerCase().includes(pattern.toLowerCase())
                );

                expect(container).toBeDefined();
                expect(container.State).toBe('running');
            }
        );
    });

    describe('Network Connectivity', () => {
        test('Docker network exists', async () => {
            const networks = await docker.listNetworks();
            const observabilityNetwork = networks.find(n =>
                n.Name.includes('observability')
            );
            expect(observabilityNetwork).toBeDefined();
        });
    });
});
