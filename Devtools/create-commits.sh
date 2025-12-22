#!/bin/bash

# Observability Project - Automated Commit Script (Part 2)
# This script creates remaining feature-oriented commits

set -e

echo "=========================================="
echo "  Creating Remaining Feature Commits"
echo "=========================================="
echo ""

# Check how many commits already exist
COMMIT_COUNT=$(git log --oneline | wc -l)
echo "ℹ️  Found $COMMIT_COUNT existing commits"
echo ""

# Commit 1: Project Foundation (SKIP - already done)
echo "📦 Commit 1/23: Project Foundation"
git add pom.xml mvnw mvnw.cmd .mvn/ .gitignore .gitattributes
git add src/main/java/fr/umontpellier/observability/ObservabilityApplication.java
git add src/main/resources/application.properties src/main/resources/application-prod.properties
git commit -m "feat: initialize Spring Boot project with Maven configuration

- Add Maven wrapper and configuration
- Configure Spring Boot 3.4.1 with Java 21
- Setup MongoDB, Kafka, and ClickHouse dependencies
- Add application properties for dev and prod environments"
echo "✓ Committed"
echo ""

# Commit 2: Backend Core Features
echo "📦 Commit 2/23: Backend Domain Models"
git add src/main/java/fr/umontpellier/observability/model/
git add src/main/java/fr/umontpellier/observability/repository/
git commit -m "feat: implement User and Product domain models with repositories

- Add User entity with MongoDB annotations
- Add Product entity with validation
- Implement UserRepository extending MongoRepository
- Implement ProductRepository with custom queries"
echo "✓ Committed"
echo ""

# Commit 3: Backend API Layer
echo "📦 Commit 3/23: REST Controllers"
git add src/main/java/fr/umontpellier/observability/controller/
git commit -m "feat: add REST controllers for User and Product management

- UserController with CRUD endpoints
- ProductController with CRUD endpoints
- RESTful API design with proper HTTP methods
- Request/Response validation"
echo "✓ Committed"
echo ""

# Commit 4: Backend Services & Kafka
echo "📦 Commit 4/23: Service Layer & Kafka"
git add src/main/java/fr/umontpellier/observability/service/
git commit -m "feat: implement service layer with Kafka event streaming

- UserService with business logic
- ProductService with business logic
- KafkaProducerService for event streaming
- Event-driven architecture integration"
echo "✓ Committed"
echo ""

# Commit 5: Backend Configuration
echo "📦 Commit 5/23: Application Configuration"
git add src/main/java/fr/umontpellier/observability/config/
git add src/main/java/fr/umontpellier/observability/exception/ 2>/dev/null || true
git commit -m "feat: add application configuration and CORS support

- WebConfig with CORS configuration for frontend
- Allow localhost:4200 origin
- Configure allowed methods and headers
- Add exception handlers"
echo "✓ Committed"
echo ""

# Commit 6: Backend Logging
echo "📦 Commit 6/23: Logging Configuration"
git add src/main/resources/log4j2.xml src/test/resources/log4j2-test.xml
git commit -m "feat: configure Log4j2 for application logging

- Setup console and file appenders
- Configure log levels by package
- Add Kafka appender for ClickHouse integration
- Separate test logging configuration"
echo "✓ Committed"
echo ""

# Commit 7: Backend Tests
echo "📦 Commit 7/23: Backend Tests"
git add src/test/java/
git commit -m "test: add integration tests for User and Product APIs

- UserIntegrationTest with full CRUD coverage
- ProductIntegrationTest with validation tests
- Application context loading test
- MockMvc for API testing"
echo "✓ Committed"
echo ""

# Commit 8: Frontend Foundation
echo "📦 Commit 8/23: Frontend Foundation"
git add frontend/package.json frontend/angular.json frontend/tsconfig*.json
git add frontend/src/main.ts frontend/src/main.server.ts frontend/src/server.ts
git add frontend/src/index.html frontend/src/styles.scss frontend/public/
git commit -m "feat: initialize Angular 21 application with SSR

- Setup Angular 21 with standalone components
- Configure Server-Side Rendering (SSR)
- Add TypeScript configuration
- Configure build and serve options
- Add global styles"
echo "✓ Committed"
echo ""

# Commit 9: Frontend Core
echo "📦 Commit 9/23: Frontend Application Structure"
git add frontend/src/app/app.ts frontend/src/app/app.config.ts
git add frontend/src/app/app.config.server.ts frontend/src/app/app.routes.ts
git add frontend/src/app/app.routes.server.ts frontend/src/app/app.html frontend/src/app/app.scss
git commit -m "feat: implement Angular application structure and routing

- Configure standalone application
- Setup routing with lazy loading
- Add SSR-specific configuration
- Configure HTTP client and animations"
echo "✓ Committed"
echo ""

# Commit 10: Frontend Models & Services
echo "📦 Commit 10/23: Models & Services"
git add frontend/src/app/models/ frontend/src/app/services/
git commit -m "feat: add domain models and HTTP services

- User and Product TypeScript models
- UserService with CRUD operations
- ProductService with CRUD operations
- HTTP client integration with backend API"
echo "✓ Committed"
echo ""

# Commit 11: Frontend User Management
echo "📦 Commit 11/23: User Management UI"
git add frontend/src/app/components/user-list/ frontend/src/app/components/user-form/
git commit -m "feat: implement user management UI components

- UserListComponent with table display
- UserFormComponent with reactive forms
- Create, update, delete operations
- Form validation and error handling"
echo "✓ Committed"
echo ""

# Commit 12: Frontend Product Management
echo "📦 Commit 12/23: Product Management UI"
git add frontend/src/app/components/product-list/ frontend/src/app/components/product-form/
git commit -m "feat: implement product management UI components

- ProductListComponent with card layout
- ProductFormComponent with validation
- Price formatting and date handling
- Responsive design"
echo "✓ Committed"
echo ""

# Commit 13: Frontend Navigation
echo "📦 Commit 13/23: Navigation & Home"
git add frontend/src/app/components/navbar/ frontend/src/app/components/home/
git commit -m "feat: add navigation and home components

- Navbar with routing links
- Home component with dashboard
- Active route highlighting
- Responsive navigation"
echo "✓ Committed"
echo ""

# Commit 14: E2E Framework
echo "📦 Commit 14/23: E2E Testing Framework"
git add frontend/e2e/support/ frontend/e2e/page-objects/ frontend/e2e/helpers/
git add frontend/cucumber.js
git commit -m "test: setup Cucumber/Selenium E2E testing framework

- Configure Cucumber with Selenium WebDriver
- Implement Page Object Model pattern
- Add database helper for API verification
- Setup headless Chrome for CI/CD
- Configure test environment variables"
echo "✓ Committed"
echo ""

# Commit 15: E2E Scenarios
echo "📦 Commit 15/23: E2E Test Scenarios"
git add frontend/e2e/features/ frontend/e2e/steps/
git commit -m "test: add E2E test scenarios for user and product features

- User management feature scenarios
- Product management feature scenarios
- Navigation testing scenarios
- Database verification scenarios
- 30+ test scenarios with Gherkin syntax"
echo "✓ Committed"
echo ""

# Commit 16: Docker Backend
echo "📦 Commit 16/23: Backend Docker"
git add docker/Dockerfile docker/.dockerignore
git commit -m "build: add Docker configuration for backend service

- Multi-stage Docker build
- Maven build stage
- Runtime with OpenJDK 21
- Optimize layer caching
- Port 8080 exposure"
echo "✓ Committed"
echo ""

# Commit 17: Docker Frontend
echo "📦 Commit 17/23: Frontend Docker"
git add frontend/Dockerfile frontend/.dockerignore frontend/nginx.conf
git commit -m "build: add Docker configuration for frontend with Nginx

- Multi-stage build with Node.js
- Production build optimization
- Nginx for serving static files
- Reverse proxy configuration
- Port 80 exposure"
echo "✓ Committed"
echo ""

# Commit 18: Docker Compose
echo "📦 Commit 18/23: Docker Compose Stack"
git add docker/docker-compose.yml
git commit -m "build: configure multi-service Docker Compose stack

- MongoDB 7.0 service
- Kafka 7.6.0 with KRaft
- ClickHouse 24.1.8
- Grafana 10.4.0
- Spring Boot backend service
- Angular frontend service
- Health checks and networking
- Volume persistence"
echo "✓ Committed"
echo ""

# Commit 19: ClickHouse
echo "📦 Commit 19/23: ClickHouse Setup"
git add clickhouse-init/
git commit -m "feat: setup ClickHouse database with event tables

- Create observability database
- user_events table schema with detailed columns
- product_events table schema with detailed columns
- MergeTree engine configuration
- Timestamp-based ordering"
echo "✓ Committed"
echo ""

# Commit 20: Grafana Configuration
echo "📦 Commit 20/23: Grafana Datasource"
git add grafana/provisioning/datasources/ grafana/provisioning/dashboards/dashboard.yml
git commit -m "feat: configure Grafana with ClickHouse datasource

- ClickHouse datasource provisioning
- Connection to observability database
- Default datasource configuration
- Dashboard auto-provisioning setup"
echo "✓ Committed"
echo ""

# Commit 21: Grafana Dashboard
echo "📦 Commit 21/23: Monitoring Dashboard"
git add grafana/provisioning/dashboards/observability-dashboard.json
git commit -m "feat: add observability monitoring dashboard

- 10 visualization panels
- User events monitoring (count, time series, distribution)
- Product events monitoring
- Recent events tables
- 24-hour trend analysis
- Auto-refresh every 10 seconds
- ClickHouse queries for real-time data"
echo "✓ Committed"
echo ""

# Commit 22: Development Scripts
echo "📦 Commit 22/23: Utility Scripts"
git add Devtools/ frontend/*.sh
git commit -m "chore: add development and testing utility scripts

- start.sh - Start all services
- stop.sh - Stop all services
- test-api.sh - API testing
- test-grafana-dashboard.sh - Dashboard tests (15 tests)
- generate-test-data.sh - Sample data generation
- dashboard-status.sh - Quick status check
- Frontend E2E test runners"
echo "✓ Committed"
echo ""

# Commit 23: Documentation
echo "📦 Commit 23/23: Project Documentation"
git add README.md frontend/.claude/CLAUDE.md prompt.yaml COMMIT_PLAN.md
git add frontend/README.md 2>/dev/null || true
git commit -m "docs: add project README and development documentation

- Comprehensive project README
- Architecture overview
- Setup and installation instructions
- API documentation
- Testing guide
- Claude AI context for development
- Prompt configuration"
echo "✓ Committed"
echo ""

echo "=========================================="
echo "✅ All 23 commits created successfully!"
echo "=========================================="
echo ""
echo "Review commits with:"
echo "  git log --oneline"
echo ""
echo "Review specific commit:"
echo "  git show <commit-hash>"
echo ""
