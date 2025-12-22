#!/bin/bash

# Observability Project - Remaining Commits Script
# Creates commits for files not yet tracked

set -e

echo "=========================================="
echo "  Creating Remaining Feature Commits"
echo "=========================================="
echo ""

# Check existing commits
COMMIT_COUNT=$(git log --oneline 2>/dev/null | wc -l)
echo "ℹ️  Found $COMMIT_COUNT existing commits"
echo ""

# Commit: Frontend Components (all at once if not committed)
echo "📦 Frontend UI Components"
if git status --short | grep -q "frontend/src/app/components"; then
    git add frontend/src/app/components/
    git add frontend/src/app/app.spec.ts frontend/src/environments/ 2>/dev/null || true
    if ! git diff --cached --quiet; then
        git commit -m "feat: implement complete frontend UI components

- UserListComponent with table display
- UserFormComponent with reactive forms
- ProductListComponent with card layout  
- ProductFormComponent with validation
- Navbar with routing links
- Home component with dashboard
- Form validation and error handling
- Responsive design"
        echo "✓ Committed"
    else
        echo "⊘ Already committed"
    fi
else
    echo "⊘ Already committed"
fi
echo ""

# Commit: Frontend Config Files
echo "📦 Frontend Configuration"
git add frontend/.editorconfig frontend/.gitignore frontend/.github/ 2>/dev/null || true
if ! git diff --cached --quiet; then
    git commit -m "chore: add frontend configuration files

- Editor config for consistency
- Frontend-specific gitignore
- GitHub Copilot instructions"
    echo "✓ Committed"
fi
echo ""

# Commit: E2E Framework and Tests
echo "📦 E2E Testing Framework & Scenarios"
if git status --short | grep -q "frontend/e2e"; then
    git add frontend/e2e/ frontend/cucumber.js
    git commit -m "test: add complete E2E testing framework with Cucumber/Selenium

- Configure Cucumber with Selenium WebDriver
- Implement Page Object Model pattern
- Add database helper for API verification
- User management feature scenarios
- Product management feature scenarios
- Navigation testing scenarios
- Database verification scenarios
- 30+ test scenarios with Gherkin syntax
- Setup headless Chrome for CI/CD"
    echo "✓ Committed"
else
    echo "⊘ Already committed"
fi
echo ""

# Commit: Docker Configuration
echo "📦 Docker Configuration"
if git status --short | grep -q "docker/"; then
    git add docker/
    git commit -m "build: add Docker configuration for all services

Backend Docker:
- Multi-stage Docker build
- Maven build stage
- Runtime with OpenJDK 21
- Port 8080 exposure

Docker Compose:
- MongoDB 7.0 service
- Kafka 7.6.0 with KRaft
- ClickHouse 24.1.8
- Grafana 10.4.0
- Spring Boot backend service
- Angular frontend service
- Health checks and networking
- Volume persistence"
    echo "✓ Committed"
else
    echo "⊘ Already committed"
fi
echo ""

# Commit: Frontend Docker
echo "📦 Frontend Docker & Nginx"
if git status --short | grep -q "frontend/Dockerfile\|frontend/nginx.conf"; then
    git add frontend/Dockerfile frontend/.dockerignore frontend/nginx.conf
    git commit -m "build: add Docker configuration for frontend with Nginx

- Multi-stage build with Node.js
- Production build optimization
- Nginx for serving static files
- Reverse proxy configuration
- Port 80 exposure"
    echo "✓ Committed"
else
    echo "⊘ Already committed"
fi
echo ""

# Commit: ClickHouse
echo "�� ClickHouse Setup"
if git status --short | grep -q "clickhouse-init"; then
    git add clickhouse-init/
    git commit -m "feat: setup ClickHouse database with event tables

- Create observability database
- user_events table schema with detailed columns
- product_events table schema with detailed columns
- MergeTree engine configuration
- Timestamp-based ordering"
    echo "✓ Committed"
else
    echo "⊘ Already committed"
fi
echo ""

# Commit: Grafana
echo "📦 Grafana Configuration & Dashboard"
if git status --short | grep -q "grafana"; then
    git add grafana/
    git commit -m "feat: add Grafana monitoring with ClickHouse integration

Datasource Configuration:
- ClickHouse datasource provisioning
- Connection to observability database
- Default datasource configuration

Monitoring Dashboard:
- 10 visualization panels
- User events monitoring (count, time series, distribution)
- Product events monitoring
- Recent events tables
- 24-hour trend analysis
- Auto-refresh every 10 seconds
- ClickHouse queries for real-time data"
    echo "✓ Committed"
else
    echo "⊘ Already committed"
fi
echo ""

# Commit: Development Scripts
echo "📦 Utility Scripts"
if git status --short | grep -q "Devtools\|frontend/.*\.sh"; then
    git add Devtools/ frontend/*.sh
    git commit -m "chore: add development and testing utility scripts

- start.sh - Start all services
- stop.sh - Stop all services
- test-api.sh - API testing
- test-grafana-dashboard.sh - Dashboard tests (15 tests)
- generate-test-data.sh - Sample data generation
- dashboard-status.sh - Quick status check
- run-full-test-suite.sh - Complete test runner
- Frontend E2E test runners
- Commit creation scripts"
    echo "✓ Committed"
else
    echo "⊘ Already committed"
fi
echo ""

# Commit: Documentation
echo "📦 Project Documentation"
git add README.md frontend/README.md frontend/.claude/ prompt.yaml 2>/dev/null || true
if ! git diff --cached --quiet; then
    git commit -m "docs: add comprehensive project documentation

- Main project README with architecture
- Frontend-specific README
- Setup and installation instructions
- API documentation
- Testing guide
- Claude AI context for development
- Prompt configuration"
    echo "✓ Committed"
fi
echo ""

# Commit: Remaining files
echo "📦 Additional Files"
git add logs/ frontend/package-lock.json 2>/dev/null || true
if ! git diff --cached --quiet; then
    git commit -m "chore: add logs directory and dependency lock

- Logs directory for runtime logs
- Package-lock.json for dependency pinning"
    echo "✓ Committed"
fi
echo ""

echo "=========================================="
echo "✅ All remaining commits created!"
echo "=========================================="
echo ""
FINAL_COUNT=$(git log --oneline | wc -l)
echo "Total commits: $FINAL_COUNT"
echo ""
git status --short
echo ""
