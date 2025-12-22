.PHONY: help build start stop restart clean test integration-test logs

# Default target
help:
	@echo "Observability Project - Available targets:"
	@echo ""
	@echo "  make build              - Build all Docker images"
	@echo "  make start              - Start all services"
	@echo "  make stop               - Stop all services"
	@echo "  make restart            - Restart all services"
	@echo "  make clean              - Remove containers and volumes"
	@echo "  make logs               - Show logs from all services"
	@echo "  make test               - Run all tests"
	@echo "  make integration-test   - Run integration tests"
	@echo "  make test-backend       - Run backend unit tests"
	@echo "  make test-frontend      - Run frontend unit tests"
	@echo "  make test-e2e           - Run E2E tests"
	@echo "  make status             - Show services status"
	@echo ""

# Build Docker images
build:
	@echo "Building Docker images..."
	cd docker && docker compose build

# Start all services
start:
	@echo "Starting services..."
	cd docker && docker compose up -d
	@echo "Waiting for services to be ready..."
	@sleep 30
	@echo "Services started. Access points:"
	@echo "  - Frontend:  http://localhost:4200"
	@echo "  - Backend:   http://localhost:8080"
	@echo "  - Jaeger:    http://localhost:16686"
	@echo "  - Grafana:   http://localhost:3000"

# Stop all services
stop:
	@echo "Stopping services..."
	cd docker && docker compose stop

# Restart all services
restart: stop start

# Remove containers and volumes
clean:
	@echo "Removing containers and volumes..."
	cd docker && docker compose down -v
	@echo "Cleaning build artifacts..."
	rm -rf target/
	rm -rf frontend/dist/
	rm -rf frontend/node_modules/.cache/

# Show logs from all services
logs:
	cd docker && docker compose logs -f

# Show logs from specific service
logs-%:
	docker logs $* -f

# Run all tests
test: test-backend test-frontend integration-test

# Run integration tests (Jest-based)
integration-test:
	@echo "Running integration tests with Jest..."
	@cd integration-tests && npm install --silent && npm test

# Run integration tests in CI mode
integration-test-ci:
	@echo "Running integration tests (CI mode)..."
	@cd integration-tests && npm ci && npm run test:ci

# Run specific integration test suite
integration-test-%:
	@echo "Running $* integration tests..."
	@cd integration-tests && npm test -- --testPathPattern=$*

# Legacy bash integration tests
integration-test-bash:
	@echo "Running legacy bash integration tests..."
	@chmod +x Devtools/integration-test.sh
	@./Devtools/integration-test.sh

# Run backend unit tests
test-backend:
	@echo "Running backend unit tests..."
	./mvnw test

# Run frontend unit tests
test-frontend:
	@echo "Running frontend unit tests..."
	cd frontend && npm test -- --watch=false

# Run E2E tests
test-e2e:
	@echo "Running E2E tests..."
	cd frontend && npm run test:e2e

# Show services status
status:
	@echo "Services status:"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Generate test data
generate-data:
	@echo "Generating test data..."
	@bash Devtools/generate-test-data.sh

# Generate traces
generate-traces:
	@echo "Generating test traces..."
	@bash Devtools/generate-traces.sh

# Verify setup
verify:
	@echo "Verifying setup..."
	@bash Devtools/verify-setup.sh

# Development mode - start with hot reload
dev:
	@echo "Starting development mode..."
	cd docker && docker compose up

# Production build
prod-build:
	@echo "Building for production..."
	cd docker && docker compose -f docker-compose.yml build --no-cache

# Database shell
db-mongo:
	docker exec -it mongodb mongosh observability

db-clickhouse:
	docker exec -it clickhouse clickhouse-client --database observability

# Kafka console
kafka-topics:
	docker exec kafka kafka-topics --bootstrap-server localhost:9092 --list

kafka-consume-users:
	docker exec kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic user-events --from-beginning

kafka-consume-products:
	docker exec kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic product-events --from-beginning
