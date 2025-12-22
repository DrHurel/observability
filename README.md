# Observability Application

A full-stack microservices application demonstrating comprehensive observability with metrics, logs, and **distributed tracing** using OpenTelemetry, featuring user and product management with Angular frontend and Spring Boot backend.

## 🌟 Key Features

### Complete Observability Stack
- **📊 Metrics**: Prometheus metrics exposed via Spring Boot Actuator
- **📝 Logs**: Structured logging with Log4j2, stored in ClickHouse
- **🔍 Distributed Tracing**: End-to-end tracing with OpenTelemetry and Jaeger
- **📈 Visualization**: Grafana dashboards for metrics and logs
- **🎯 Real-time Monitoring**: Live trace visualization in Jaeger UI

### Application Features
- **User Management**: Create, read, and query users with validation
- **Product Management**: Full CRUD operations on products
- **Event Streaming**: Kafka-based event publishing
- **Modern Frontend**: Angular 21 with SSR support
- **RESTful API**: Spring Boot 3.4 backend with proper error handling

## Technical Stack

### Frontend
- **Framework**: Angular 21
- **Tracing**: OpenTelemetry Web SDK
- **State Management**: RxJS
- **Build Tool**: Angular CLI
- **Testing**: Cucumber with Selenium

### Backend
- **Language**: Java 21
- **Framework**: Spring Boot 3.4.1
- **Tracing**: OpenTelemetry Java Agent
- **Database**: MongoDB
- **Message Broker**: Apache Kafka
- **Metrics Storage**: ClickHouse

### Observability Infrastructure
- **Tracing Backend**: Jaeger
- **Trace Collection**: OpenTelemetry Collector
- **Metrics**: Prometheus + Micrometer
- **Visualization**: Grafana
- **Containerization**: Docker & Docker Compose

## 🚀 Quick Start

### **NEW: OpenTelemetry Distributed Tracing**

We've implemented complete end-to-end tracing! See the traces flow from browser interactions through the backend to database operations.

**Quick Start Guide**: [QUICKSTART.md](QUICKSTART.md)

**Full Documentation**: [OPENTELEMETRY_TRACING.md](OPENTELEMETRY_TRACING.md)

### 1. Install Dependencies

```bash
cd frontend
npm install
cd ..
```

### 2. Start All Services

```bash
cd docker
docker compose up --build
```

### 3. Access the Applications

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:4200 | Angular application |
| **Backend API** | http://localhost:8080/api | REST API |
| **🎯 Jaeger UI** | http://localhost:16686 | **View distributed traces** |
| **Grafana** | http://localhost:3000 | Metrics & logs dashboard |
| **Trace Test Page** | http://localhost:4200/trace-test.html | Interactive trace generator |

### 4. Generate and View Traces

**Option 1: Use the application**
- Navigate to http://localhost:4200
- Interact with users and products
- View traces in Jaeger UI

**Option 2: Run automated test script**
```bash
./Devtools/generate-traces.sh
```

**Option 3: Use the interactive test page**
- Open http://localhost:4200/trace-test.html
- Click scenario buttons to generate traces
- Watch traces appear in Jaeger UI

## 🔍 Distributed Tracing Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │────────▶│   Frontend   │────────▶│   Backend   │
│             │         │   (Angular)  │         │ (Spring Boot)│
└─────────────┘         └──────────────┘         └─────────────┘
                               │                         │
                               ▼                         ▼
                        ┌──────────────┐         ┌─────────────┐
                        │ OpenTelemetry│         │  MongoDB    │
                        │  Collector   │         │   Kafka     │
                        └──────────────┘         └─────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │    Jaeger    │
                        │      UI      │
                        └──────────────┘
```

### What Gets Traced

**Frontend (Automatic)**:
- Page loads and navigation
- User interactions (clicks, form submissions)
- HTTP requests to backend
- Timing information

**Backend (Automatic)**:
- HTTP request handling
- Controller and service methods
- Database queries (MongoDB)
- Kafka message production
- External API calls

**End-to-End**:
- Complete request flow from browser to database
- Trace context propagation via W3C Trace Context
- Single trace ID across all components
- Performance bottleneck identification

## Project Structure

```
src/
├── main/
│   ├── java/fr/umontpellier/observability/
│   │   ├── config/           # Kafka configuration
│   │   ├── controller/       # REST API controllers
│   │   ├── exception/        # Custom exceptions and handlers
│   │   ├── model/            # Domain entities (User, Product)
│   │   ├── repository/       # JPA repositories
│   │   └── service/          # Business logic services
│   └── resources/
│       ├── application.properties
│       └── log4j2.xml
└── test/
    └── java/fr/umontpellier/observability/
        └── integration/      # Integration tests with Testcontainers
```

## API Endpoints

### Users
- `POST /api/users` - Create a new user
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `GET /api/users/email/{email}` - Get user by email

### Products
- `GET /api/products` - Display all products
- `GET /api/products/{id}` - Get product by ID
- `POST /api/products` - Add new product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

## Running the Application

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ and npm (for frontend development)
- Java 21 (for backend development)
- At least 4GB RAM for Docker

### Using Docker Compose (Recommended)

1. Install frontend dependencies:
```bash
cd frontend && npm install && cd ..
```

2. Build and start all services:
```bash
cd docker
docker compose up --build
```

This will start:
- **Frontend** on http://localhost:4200
- **Backend** on http://localhost:8080
- **🎯 Jaeger UI** on http://localhost:16686 (view traces)
- **Grafana** on http://localhost:3000 (admin/admin)
- **OpenTelemetry Collector** on ports 4317, 4318
- **MongoDB** on localhost:27017
- **Kafka** on localhost:9092
- **ClickHouse** on localhost:8123

3. Access the services:
- Application: http://localhost:4200
- API: http://localhost:8080/api
- **Jaeger Traces**: http://localhost:16686
- Grafana: http://localhost:3000
- Trace Test Page: http://localhost:4200/trace-test.html

### Generate Traces

**Automated Script:**
```bash
chmod +x Devtools/generate-traces.sh
./Devtools/generate-traces.sh
```

**Manual Testing:**
1. Open http://localhost:4200
2. Create users and products
3. View traces at http://localhost:16686

### Local Development

1. Start infrastructure services:
```bash
docker compose up mongodb kafka clickhouse grafana jaeger otel-collector
```

2. Run backend locally:
```bash
./mvnw spring-boot:run \
  -Dspring-boot.run.javaagent=path/to/opentelemetry-javaagent.jar \
  -Dotel.service.name=observability-backend \
  -Dotel.exporter.otlp.endpoint=http://localhost:4317
```

3. Run frontend locally:
```bash
cd frontend
npm start
```

## Running Tests

Execute integration tests:
```bash
./mvnw test
```

The tests use Testcontainers to spin up Kafka instances automatically.

## SOLID Principles

The application follows SOLID principles:
- **Single Responsibility**: Each class has one responsibility
- **Open/Closed**: Services are open for extension via interfaces
- **Liskov Substitution**: Proper use of inheritance and interfaces
- **Interface Segregation**: Repositories follow specific interfaces
- **Dependency Inversion**: Dependencies injected via constructors

## Observability Features

### 🔍 Distributed Tracing (NEW!)
- **Frontend Instrumentation**: OpenTelemetry Web SDK
  - Document load tracking
  - User interaction tracing
  - HTTP request instrumentation
  - Automatic trace context propagation
- **Backend Instrumentation**: OpenTelemetry Java Agent
  - Spring MVC automatic instrumentation
  - MongoDB operation tracing
  - Kafka message tracing
  - HTTP client tracing
- **Trace Collection**: OpenTelemetry Collector with OTLP
- **Visualization**: Jaeger UI with search and filtering
- **End-to-End**: Complete traces from browser to database

### 📝 Logging
- Structured logging with Log4j2
- Logs sent to Kafka topic `application-logs`
- Stored in ClickHouse for analysis
- File-based logging in `/app/logs`
- Correlated with traces via trace IDs

### 📊 Metrics
- Prometheus metrics via Spring Boot Actuator
- Custom business metrics
- JVM and application metrics
- Exported through OpenTelemetry Collector
- Visualized in Grafana dashboards

### 📡 Events
- User creation events published to `user-events` topic
- Product CRUD events published to `product-events` topic
- Event streaming with Apache Kafka
- Event correlation with traces

## Exception Handling

Custom exceptions with appropriate HTTP status codes:
- `ProductNotFoundException` - 404 Not Found
- `ProductAlreadyExistsException` - 409 Conflict
- `UserAlreadyExistsException` - 409 Conflict
- Validation errors - 400 Bad Request

## Configuration

Configuration can be modified in:
- `application.properties` - Application settings
- `docker-compose.yml` - Container orchestration
- `log4j2.xml` - Logging configuration

## Stopping the Application

```bash
cd docker
docker compose down
```

To remove volumes as well:
```bash
docker compose down -v
```

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Step-by-step guide to get started
- **[OPENTELEMETRY_TRACING.md](OPENTELEMETRY_TRACING.md)** - Complete tracing documentation
- **[Devtools/generate-traces.sh](Devtools/generate-traces.sh)** - Automated trace generation script
- **[frontend/public/trace-test.html](frontend/public/trace-test.html)** - Interactive trace test page

## 🎯 Testing Scenarios

The application includes multiple test scenarios for trace generation:

1. **User Management Flow**: Create and query users
2. **Product Management Flow**: Full CRUD operations
3. **Search and Filter Operations**: Complex queries
4. **Error Handling**: 404 and validation errors
5. **Concurrent User Sessions**: Multiple simultaneous operations
6. **Complex Workflows**: Multi-step interconnected operations

Each scenario generates rich traces visible in Jaeger UI.

## 🔧 Configuration

### OpenTelemetry Configuration

**Frontend** (`frontend/src/app/services/tracing.service.ts`):
- Service name: `observability-frontend`
- Exporter: OTLP HTTP to collector
- Automatic instrumentation for document load, user interactions, HTTP requests

**Backend** (Docker environment variables):
- Service name: `observability-backend`
- Java agent: Automatic instrumentation
- Exporter: OTLP gRPC to collector
- Instrumented: Spring MVC, MongoDB, Kafka

**Collector** (`docker/otel-collector-config.yaml`):
- Receivers: OTLP (gRPC 4317, HTTP 4318)
- Processors: Batch, memory limiter, resource
- Exporters: Jaeger, Prometheus, Console

## 📊 Viewing Traces in Jaeger

1. Open http://localhost:16686
2. Select service:
   - `observability-frontend` - Frontend traces
   - `observability-backend` - Backend traces
3. Click "Find Traces"
4. Click on any trace to see:
   - Complete request flow
   - Span duration and timing
   - HTTP methods and status codes
   - Database queries
   - Error details

### Understanding Traces

**Single Trace Components**:
- Frontend span (user interaction or page load)
- HTTP request span (fetch/XHR)
- Backend span (API processing)
- Service method span (business logic)
- Database span (MongoDB operation)
- Message broker span (Kafka production)

**Key Attributes**:
- `http.method`, `http.url`, `http.status_code`
- `db.system`, `db.statement`, `db.operation`
- `messaging.system`, `messaging.destination`
- `error`: true/false
- Custom business attributes

## 🐛 Troubleshooting

### No Traces Appearing

```bash
# Check services
docker ps | grep -E "jaeger|otel-collector|observability"

# Check collector logs
docker logs otel-collector

# Check backend logs for OpenTelemetry
docker logs observability-app | grep -i opentelemetry

# Test collector health
curl http://localhost:13133
```

### Traces Not Connected

- Verify `traceparent` header in browser Network tab
- Check CORS configuration allows trace headers
- Ensure frontend propagation is configured
- Check backend extracts trace context

### Performance Issues

- Adjust sampling rate (see OPENTELEMETRY_TRACING.md)
- Increase collector memory limit
- Optimize batch processor settings

For detailed troubleshooting, see [QUICKSTART.md](QUICKSTART.md#troubleshooting)

## License

This project is for educational purposes.
