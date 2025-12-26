#!/bin/bash
set -e

echo "=============================================="
echo "  Observability Full Stack Test Suite"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Check if services are running
echo "📋 Step 1: Checking services..."
if ! docker ps | grep -q observability-app; then
    echo -e "${YELLOW}⚠️  Services not running. Starting all services...${NC}"
    cd "$(dirname "$0")"
    docker compose up -d --build
    echo "⏳ Waiting for services to be healthy (30s)..."
    sleep 30
else
    echo -e "${GREEN}✅ Services already running${NC}"
fi

# 2. Verify services health
echo ""
echo "📋 Step 2: Verifying service health..."
echo "Backend: $(curl -s http://localhost:8080/actuator/health | grep -o '"status":"UP"' | head -1)"
echo "Frontend: HTTP $(curl -s -o /dev/null -w '%{http_code}' http://localhost:4200)"
echo "MongoDB: $(docker ps --filter name=mongodb --format '{{.Status}}' | grep -o 'healthy')"
echo "ClickHouse: $(docker ps --filter name=clickhouse --format '{{.Status}}' | grep -o 'healthy')"
echo "Kafka: $(docker ps --filter name=kafka --format '{{.Status}}' | grep -o 'healthy')"

# 3. Cleanup test data to avoid conflicts
echo ""
echo "📋 Step 3: Cleaning up test data..."
echo "Removing test users..."
docker exec mongodb mongosh --quiet observability --eval '
  db.users.deleteMany({ 
    $or: [
      { email: { $regex: /test|example|dbtest|shopping|profile|api\./i } },
      { name: { $regex: /test|demo|shopping/i } }
    ]
  });
' 2>/dev/null || echo "  (MongoDB cleanup skipped)"

echo "Removing test products..."
docker exec mongodb mongosh --quiet observability --eval '
  db.products.deleteMany({ 
    $or: [
      { name: { $regex: /test|demo|sample|e2e/i } },
      { description: { $regex: /test|e2e/i } }
    ]
  });
' 2>/dev/null || echo "  (MongoDB cleanup skipped)"

echo "Removing test profiles..."
docker exec mongodb mongosh --quiet observability --eval '
  db.userProfiles.deleteMany({
    $or: [
      { userEmail: { $regex: /test|example|profile|api\./i } }
    ]
  });
' 2>/dev/null || echo "  (MongoDB cleanup skipped)"

echo "Cleaning ClickHouse test data..."
docker exec clickhouse clickhouse-client --query "
  ALTER TABLE user_actions DELETE WHERE user_email LIKE '%test%' OR user_email LIKE '%example%';
" 2>/dev/null || echo "  (ClickHouse cleanup skipped)"

echo -e "${GREEN}✅ Test data cleanup complete${NC}"

# 4. Install dependencies if needed
echo ""
echo "📋 Step 4: Checking test dependencies..."
cd "$(dirname "$0")/../frontend"
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/cucumber-js" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# 5. Run E2E tests
echo ""
echo "=============================================="
echo "📋 Step 5: Running E2E Tests"
echo "=============================================="
echo ""

# Create reports directory
mkdir -p e2e/reports e2e/screenshots

# Run tests
if [ "$1" == "--headless" ]; then
    echo "Running tests in HEADLESS mode..."
    HEADLESS=true BASE_URL=http://localhost:4200 API_URL=http://localhost:8080 npx cucumber-js --parallel 2
else
    echo "Running tests with VISIBLE browser..."
    echo "(Pass --headless flag to run in headless mode)"
    BASE_URL=http://localhost:4200 API_URL=http://localhost:8080 npx cucumber-js --parallel 2
fi

EXIT_CODE=$?

# 5. Display results
echo ""
echo "=============================================="
echo "  Test Execution Complete"
echo "=============================================="
echo ""

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Some tests failed (Exit code: $EXIT_CODE)${NC}"
fi

echo ""
echo "📊 Reports available:"
echo "   - HTML Report: frontend/e2e/reports/cucumber-report.html"
echo "   - JSON Report: frontend/e2e/reports/cucumber-report.json"
echo "   - JUnit XML: frontend/e2e/reports/cucumber-report.xml"
echo "   - Screenshots: frontend/e2e/screenshots/"
echo ""
echo "🔍 View HTML report:"
echo "   xdg-open frontend/e2e/reports/cucumber-report.html"
echo ""
echo "📝 Full test report:"
echo "   cat TEST_EXECUTION_REPORT.md"
echo ""

# Open report if tests failed
if [ $EXIT_CODE -ne 0 ] && [ -f "e2e/reports/cucumber-report.html" ]; then
    echo "Opening test report in browser..."
    xdg-open e2e/reports/cucumber-report.html 2>/dev/null || true
fi

exit $EXIT_CODE
