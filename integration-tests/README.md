# Integration Tests

This directory contains the integration test suite for the Observability project, built with **Jest**.

## Quick Start

```bash
# Install dependencies
cd integration-tests
npm install

# Run all tests
npm test

# Run specific test suites
npm run test:infrastructure
npm run test:api
npm run test:frontend
npm run test:database
npm run test:tracing
npm run test:messaging
```

## Test Suites

| Suite | File | Description |
|-------|------|-------------|
| Infrastructure | `infrastructure.test.js` | Docker containers, networks, health checks |
| API | `api.test.js` | Backend REST API CRUD operations |
| Frontend | `frontend.test.js` | Angular application serving and assets |
| Database | `database.test.js` | MongoDB and ClickHouse connectivity |
| Tracing | `tracing.test.js` | Jaeger and OpenTelemetry Collector |
| Messaging | `messaging.test.js` | Kafka broker and topics |
| Monitoring | `monitoring.test.js` | Grafana, Prometheus metrics |

## Configuration

Environment variables for custom endpoints:

```bash
export API_URL=http://localhost:8080
export FRONTEND_URL=http://localhost:4200
export JAEGER_URL=http://localhost:16686
export GRAFANA_URL=http://localhost:3000
export MONGODB_URI=mongodb://localhost:27017/observability
export CLICKHOUSE_HOST=localhost
export CLICKHOUSE_PORT=8123
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run Integration Tests
  run: |
    cd integration-tests
    npm ci
    npm run test:ci
```

### JUnit Reports
Test results are output to `reports/junit.xml` for CI integration.

## Running with Coverage

```bash
npm run test:coverage
```

## Watch Mode (Development)

```bash
npm run test:watch
```

## Prerequisites

- Docker daemon running
- All containers started via `docker compose up`
- Node.js 18+ installed
