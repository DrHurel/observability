#!/bin/bash

GIT_ROOT=$(git rev-parse --show-toplevel)


echo "Starting Observability Application..."
echo "======================================"

pushd $GIT_ROOT/docker
# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed."
    exit 1
fi

echo "Building and starting all services..."
docker-compose up --build -d

echo ""
echo "Waiting for services to be ready..."
sleep 10

echo ""
echo "Services Status:"
docker-compose ps

echo ""
echo "======================================"
echo "Services are starting up!"
echo "======================================"
echo ""
echo "Frontend URL: http://localhost:4200"
echo "Backend API: http://localhost:8080"
echo "Grafana URL: http://localhost:3000 (admin/admin)"
echo ""
echo "API Endpoints (accessed through frontend proxy or directly):"
echo "  - GET    http://localhost:8080/api/users"
echo "  - POST   http://localhost:8080/api/users"
echo "  - GET    http://localhost:8080/api/products"
echo "  - POST   http://localhost:8080/api/products"
echo ""
echo "Health Check: http://localhost:8080/actuator/health"
echo "Frontend Health: http://localhost:4200/health"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To view frontend logs: docker-compose logs -f frontend"
echo "To stop: docker-compose down"
echo "======================================"

popd