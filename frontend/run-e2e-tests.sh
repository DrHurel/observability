#!/bin/bash

echo "=========================================="
echo "Running E2E Tests"
echo "=========================================="
echo ""

# Check if application is running
echo "Checking if application is running..."
if ! curl -s http://localhost:4200 > /dev/null; then
    echo "❌ Frontend not running on http://localhost:4200"
    echo "Please start the frontend with: npm start"
    exit 1
fi

if ! curl -s http://localhost:8080/actuator/health > /dev/null; then
    echo "⚠️  Warning: Backend not running on http://localhost:8080"
    echo "Some tests may fail. Start backend with: docker-compose up -d"
fi

echo "✅ Application is running"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Run tests
echo "Running Cucumber E2E tests..."
echo ""

if [ "$1" == "--headless" ]; then
    echo "Running in headless mode..."
    export HEADLESS=true
    npx cucumber-js
else
    echo "Running with visible browser..."
    npx cucumber-js
fi

EXIT_CODE=$?

echo ""
echo "=========================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed"
    echo "Check e2e/reports/ for details"
    echo "Screenshots saved to e2e/screenshots/"
fi
echo "=========================================="

exit $EXIT_CODE
