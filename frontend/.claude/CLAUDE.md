# Claude AI Context - Observability Project

## Project Overview
Full-stack observability platform with Spring Boot backend, Angular 21 frontend, and real-time monitoring.

## Tech Stack
- **Frontend**: Angular 21 (standalone components, signals, SSR)
- **Backend**: Spring Boot 3.4.1, Kafka, MongoDB
- **Testing**: Cucumber 10.3.1, Selenium WebDriver 4.27.0
- **Monitoring**: Grafana 10.4.0, ClickHouse 24.1.8
- **Containerization**: Docker Compose

## Architecture
```
frontend:4200 → backend:8080 → MongoDB:27017
                           ↓
                      Kafka:9092 → ClickHouse:8123 → Grafana:3000
```

## Key Files
- `src/app/`: Angular components, services, models
- `e2e/`: Cucumber feature files, step definitions, page objects
- `docker-compose.yml`: Service orchestration
- `nginx.conf`: Production server config

## Development Commands
```bash
npm start              # Dev server (4200)
npm run build          # Production build
npm test               # Unit tests
npm run test:e2e       # E2E tests with Cucumber
docker compose up      # Start all services
```

## Testing Strategy
- **E2E**: Cucumber BDD with Selenium (Page Object Model)
- **Features**: User management, Product management, Navigation, Database verification
- **Headless Mode**: HEADLESS=true for CI/CD

## Important Patterns
- Standalone components (no NgModule)
- Signal-based state management
- SSR with hydration
- CORS enabled for localhost:4200
- ClickHouse event tracking

## Environment
- Development: http://localhost:4200
- Backend API: http://localhost:8080
- Grafana: http://localhost:3000 (admin/admin)
- MongoDB: localhost:27017
- ClickHouse: localhost:8123
