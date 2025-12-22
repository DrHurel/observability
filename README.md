# Observability Application

A microservices-based Spring Boot application demonstrating user and product management with observability features using Kafka, ClickHouse, and Grafana.

## Technical Stack

- **Language**: Java 25
- **Framework**: Spring Boot 4.0.1
- **Architecture**: Microservices
- **Logging**: Log4j2
- **Message Broker**: Apache Kafka
- **Database**: H2 (development), ClickHouse (production metrics)
- **Monitoring**: Grafana
- **Containerization**: Docker & Docker Compose

## Features

### User Management
- Create users with validation (name, age, email, password)
- Retrieve all users
- Get user by ID
- Get user by email
- Email uniqueness validation

### Product Management
- Display all products in repository
- Fetch product by ID (throws exception if not found)
- Add new product (throws exception if ID already exists)
- Delete product by ID (throws exception if not found)
- Update product information (throws exception if not found)
- Product attributes: ID, name, price, expiration date

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
- Java 25 (for local development)
- Maven 3.x (for local development)

### Using Docker Compose (Recommended)

1. Build and start all services:
```bash
docker-compose up --build
```

This will start:
- **Application** on `http://localhost:8080`
- **Grafana** on `http://localhost:3000` (admin/admin)
- **Kafka** on `localhost:9092`
- **ClickHouse** on `localhost:8123`

2. Access the services:
- Application API: http://localhost:8080/api
- Grafana Dashboard: http://localhost:3000
- H2 Console: http://localhost:8080/h2-console

### Local Development

1. Start only infrastructure services:
```bash
docker-compose up kafka clickhouse grafana
```

2. Run the application locally:
```bash
./mvnw spring-boot:run
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

### Logging
- Structured logging with Log4j2
- Logs sent to Kafka topic `application-logs`
- File-based logging in `/app/logs`

### Events
- User creation events published to `user-events` topic
- Product CRUD events published to `product-events` topic

### Monitoring
- Grafana dashboards for visualization
- ClickHouse for metrics storage
- Kafka for event streaming

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
docker-compose down
```

To remove volumes as well:
```bash
docker-compose down -v
```

## License

This project is for educational purposes.
