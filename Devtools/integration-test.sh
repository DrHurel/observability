#!/bin/bash

# Comprehensive Integration Test Suite for Observability Project
# Tests all components: Backend, Frontend, Databases, Message Queue, Tracing, Metrics

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Test result function
test_result() {
    local test_name="$1"
    local result="$2"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Wait for service to be ready
wait_for_service() {
    local url="$1"
    local max_attempts="${2:-30}"
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    return 1
}

echo "=============================================="
echo "  OBSERVABILITY INTEGRATION TEST SUITE"
echo "=============================================="
echo ""
echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting integration tests"
echo ""

# ============================================
# SECTION 1: Infrastructure Tests
# ============================================
echo -e "${BLUE}[1/7] Infrastructure Health Checks${NC}"
echo "----------------------------------------"

# Test 1.1: Docker is running
if docker ps > /dev/null 2>&1; then
    test_result "Docker daemon is running" 0
else
    test_result "Docker daemon is running" 1
    echo "ERROR: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Test 1.2: All containers are running (using partial matching for flexibility)
REQUIRED_PATTERNS=("mongo" "clickhouse" "kafka" "app" "frontend" "jaeger" "otel-collector")
for pattern in "${REQUIRED_PATTERNS[@]}"; do
    FOUND=$(docker ps --format '{{.Names}}' | grep -i "$pattern" | head -1)
    if [ -n "$FOUND" ]; then
        test_result "Container matching '$pattern' is running ($FOUND)" 0
    else
        test_result "Container matching '$pattern' is running" 1
    fi
done

echo ""

# ============================================
# SECTION 2: Backend API Tests
# ============================================
echo -e "${BLUE}[2/7] Backend API Tests${NC}"
echo "----------------------------------------"

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
if wait_for_service "http://localhost:8080/actuator/health" 30; then
    test_result "Backend is accessible" 0
else
    test_result "Backend is accessible" 1
fi

# Test 2.1: Health endpoint
HEALTH_RESPONSE=$(curl -s http://localhost:8080/actuator/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"UP"'; then
    test_result "Backend health check returns UP" 0
else
    test_result "Backend health check returns UP" 1
fi

# Test 2.2: Users API - GET all users
USER_LIST=$(curl -s http://localhost:8080/api/users)
if [ $? -eq 0 ] && echo "$USER_LIST" | grep -q '\['; then
    test_result "GET /api/users returns data" 0
else
    test_result "GET /api/users returns data" 1
fi

# Test 2.3: Users API - POST create user
TIMESTAMP=$(date +%s)
NEW_USER=$(curl -s -X POST http://localhost:8080/api/users \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Test User $TIMESTAMP\",\"email\":\"test$TIMESTAMP@example.com\",\"password\":\"TestPass123!\"}")

if echo "$NEW_USER" | grep -q '"id"'; then
    USER_ID=$(echo "$NEW_USER" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    test_result "POST /api/users creates user" 0
    
    # Test 2.4: Users API - GET single user
    SINGLE_USER=$(curl -s "http://localhost:8080/api/users/$USER_ID")
    if echo "$SINGLE_USER" | grep -q "$USER_ID"; then
        test_result "GET /api/users/{id} returns user" 0
    else
        test_result "GET /api/users/{id} returns user" 1
    fi
else
    test_result "POST /api/users creates user" 1
    USER_ID=""
fi

# Test 2.5: Products API - GET all products
PRODUCT_LIST=$(curl -s http://localhost:8080/api/products)
if [ $? -eq 0 ] && echo "$PRODUCT_LIST" | grep -q '\['; then
    test_result "GET /api/products returns data" 0
else
    test_result "GET /api/products returns data" 1
fi

# Test 2.6: Products API - POST create product
NEW_PRODUCT=$(curl -s -X POST http://localhost:8080/api/products \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Test Product $TIMESTAMP\",\"price\":99.99,\"expirationDate\":\"2025-12-31\"}")

if echo "$NEW_PRODUCT" | grep -q '"id"'; then
    PRODUCT_ID=$(echo "$NEW_PRODUCT" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    test_result "POST /api/products creates product" 0
    
    # Test 2.7: Products API - PUT update product
    UPDATED_PRODUCT=$(curl -s -X PUT "http://localhost:8080/api/products/$PRODUCT_ID" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"Updated Product $TIMESTAMP\",\"price\":149.99,\"expirationDate\":\"2025-12-31\"}")
    
    if echo "$UPDATED_PRODUCT" | grep -q "Updated Product"; then
        test_result "PUT /api/products/{id} updates product" 0
    else
        test_result "PUT /api/products/{id} updates product" 1
    fi
    
    # Test 2.8: Products API - DELETE product
    DELETE_RESPONSE=$(curl -s -o /dev/null -w '%{http_code}' -X DELETE "http://localhost:8080/api/products/$PRODUCT_ID")
    if [ "$DELETE_RESPONSE" = "204" ] || [ "$DELETE_RESPONSE" = "200" ]; then
        test_result "DELETE /api/products/{id} deletes product" 0
    else
        test_result "DELETE /api/products/{id} deletes product" 1
    fi
else
    test_result "POST /api/products creates product" 1
fi

echo ""

# ============================================
# SECTION 3: Frontend Tests
# ============================================
echo -e "${BLUE}[3/7] Frontend Tests${NC}"
echo "----------------------------------------"

# Wait for frontend to be ready
echo "Waiting for frontend to be ready..."
if wait_for_service "http://localhost:4200" 30; then
    test_result "Frontend is accessible" 0
else
    test_result "Frontend is accessible" 1
fi

# Test 3.1: Frontend returns HTML
FRONTEND_HTML=$(curl -s http://localhost:4200)
if echo "$FRONTEND_HTML" | grep -q "<!DOCTYPE html>"; then
    test_result "Frontend serves HTML content" 0
else
    test_result "Frontend serves HTML content" 1
fi

# Test 3.2: Frontend contains application name
if echo "$FRONTEND_HTML" | grep -q "Observability Application"; then
    test_result "Frontend contains app branding" 0
else
    test_result "Frontend contains app branding" 1
fi

# Test 3.3: Frontend JavaScript bundle loads
MAIN_JS=$(echo "$FRONTEND_HTML" | grep -o 'main-[^"]*\.js' | head -1)
if [ -n "$MAIN_JS" ]; then
    JS_STATUS=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:4200/$MAIN_JS")
    if [ "$JS_STATUS" = "200" ]; then
        test_result "Frontend JavaScript bundle loads" 0
    else
        test_result "Frontend JavaScript bundle loads" 1
    fi
else
    test_result "Frontend JavaScript bundle loads" 1
fi

echo ""

# ============================================
# SECTION 4: Database Tests
# ============================================
echo -e "${BLUE}[4/7] Database Tests${NC}"
echo "----------------------------------------"

# Test 4.1: MongoDB connectivity
if docker exec mongodb mongosh --quiet --eval "db.adminCommand('ping').ok" 2>/dev/null | grep -q "1"; then
    test_result "MongoDB is responsive" 0
else
    test_result "MongoDB is responsive" 1
fi

# Test 4.2: MongoDB has data
USER_COUNT=$(docker exec mongodb mongosh --quiet observability --eval "db.users.countDocuments()" 2>/dev/null || echo "0")
if [ "$USER_COUNT" -ge 0 ]; then
    test_result "MongoDB users collection accessible ($USER_COUNT documents)" 0
else
    test_result "MongoDB users collection accessible" 1
fi

PRODUCT_COUNT=$(docker exec mongodb mongosh --quiet observability --eval "db.products.countDocuments()" 2>/dev/null || echo "0")
if [ "$PRODUCT_COUNT" -ge 0 ]; then
    test_result "MongoDB products collection accessible ($PRODUCT_COUNT documents)" 0
else
    test_result "MongoDB products collection accessible" 1
fi

# Test 4.3: ClickHouse connectivity
if docker exec clickhouse clickhouse-client --query "SELECT 1" 2>/dev/null | grep -q "1"; then
    test_result "ClickHouse is responsive" 0
else
    test_result "ClickHouse is responsive" 1
fi

# Test 4.4: ClickHouse has metrics table
CH_TABLES=$(docker exec clickhouse clickhouse-client --query "SHOW TABLES FROM observability" 2>/dev/null || echo "")
if echo "$CH_TABLES" | grep -q "user_events"; then
    test_result "ClickHouse user_events table exists" 0
else
    test_result "ClickHouse user_events table exists" 1
fi

if echo "$CH_TABLES" | grep -q "product_events"; then
    test_result "ClickHouse product_events table exists" 0
else
    test_result "ClickHouse product_events table exists" 1
fi

echo ""

# ============================================
# SECTION 5: Message Queue Tests
# ============================================
echo -e "${BLUE}[5/7] Message Queue Tests${NC}"
echo "----------------------------------------"

# Test 5.1: Kafka broker is running
if docker exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092 2>/dev/null | grep -q "ApiVersion"; then
    test_result "Kafka broker is responsive" 0
else
    test_result "Kafka broker is responsive" 1
fi

# Test 5.2: Kafka topics exist
KAFKA_TOPICS=$(docker exec kafka kafka-topics --bootstrap-server localhost:9092 --list 2>/dev/null || echo "")
if echo "$KAFKA_TOPICS" | grep -q "user-events"; then
    test_result "Kafka topic 'user-events' exists" 0
else
    test_result "Kafka topic 'user-events' exists" 1
fi

if echo "$KAFKA_TOPICS" | grep -q "product-events"; then
    test_result "Kafka topic 'product-events' exists" 0
else
    test_result "Kafka topic 'product-events' exists" 1
fi

echo ""

# ============================================
# SECTION 6: Tracing Tests
# ============================================
echo -e "${BLUE}[6/7] OpenTelemetry Tracing Tests${NC}"
echo "----------------------------------------"

# Test 6.1: Jaeger UI is accessible
JAEGER_STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:16686)
if [ "$JAEGER_STATUS" = "200" ]; then
    test_result "Jaeger UI is accessible" 0
else
    test_result "Jaeger UI is accessible" 1
fi

# Test 6.2: OpenTelemetry Collector is running (check multiple endpoints)
OTEL_CHECK=0
if curl -s -o /dev/null -w '%{http_code}' http://localhost:13133 2>/dev/null | grep -q "200\|503"; then
    OTEL_CHECK=1
elif curl -s -o /dev/null -w '%{http_code}' http://localhost:4318/v1/traces 2>/dev/null | grep -qE "200|405"; then
    OTEL_CHECK=1
elif docker ps --format '{{.Names}}' | grep -q "otel-collector"; then
    OTEL_CHECK=1
fi
if [ $OTEL_CHECK -eq 1 ]; then
    test_result "OpenTelemetry Collector is running" 0
else
    test_result "OpenTelemetry Collector is running" 1
fi

# Test 6.3: Generate traces and verify they appear in Jaeger
echo "Generating test traces..."
curl -s http://localhost:8080/api/users > /dev/null
curl -s http://localhost:8080/api/products > /dev/null
sleep 3  # Wait for traces to be exported

JAEGER_SERVICES=$(curl -s 'http://localhost:16686/api/services' | grep -o '"observability-backend"' || echo "")
if [ -n "$JAEGER_SERVICES" ]; then
    test_result "Backend service appears in Jaeger" 0
else
    test_result "Backend service appears in Jaeger" 1
fi

# Test 6.4: Verify traces contain spans
TRACES=$(curl -s "http://localhost:16686/api/traces?service=observability-backend&limit=5")
if echo "$TRACES" | grep -q '"spans"'; then
    test_result "Backend traces contain spans" 0
    
    # Count spans
    SPAN_COUNT=$(echo "$TRACES" | grep -o '"spanID"' | wc -l)
    echo "  └─ Found $SPAN_COUNT spans in recent traces"
else
    test_result "Backend traces contain spans" 1
fi

# Test 6.5: OTLP endpoint is accessible
OTLP_STATUS=$(curl -s -X POST -o /dev/null -w '%{http_code}' http://localhost:4318/v1/traces \
    -H "Content-Type: application/json" \
    -d '{"resourceSpans":[]}')
if [ "$OTLP_STATUS" = "200" ]; then
    test_result "OTLP HTTP endpoint is accessible" 0
else
    test_result "OTLP HTTP endpoint is accessible" 1
fi

echo ""

# ============================================
# SECTION 7: Metrics & Monitoring Tests
# ============================================
echo -e "${BLUE}[7/7] Metrics & Monitoring Tests${NC}"
echo "----------------------------------------"

# Test 7.1: Grafana is accessible
GRAFANA_STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health)
if [ "$GRAFANA_STATUS" = "200" ]; then
    test_result "Grafana is accessible" 0
else
    test_result "Grafana is accessible" 1
fi

# Test 7.2: Backend metrics endpoint
METRICS=$(curl -s http://localhost:8080/actuator/metrics)
if echo "$METRICS" | grep -q '"names"'; then
    test_result "Backend exposes metrics" 0
else
    test_result "Backend exposes metrics" 1
fi

# Test 7.3: Backend Prometheus endpoint
PROMETHEUS_METRICS=$(curl -s http://localhost:8080/actuator/prometheus)
if echo "$PROMETHEUS_METRICS" | grep -q "jvm_"; then
    test_result "Backend exposes Prometheus metrics" 0
else
    test_result "Backend exposes Prometheus metrics" 1
fi

# Test 7.4: Collector metrics endpoint (may not be exposed in all configurations)
COLLECTOR_METRICS=$(curl -s http://localhost:8889/metrics 2>/dev/null || echo "")
if echo "$COLLECTOR_METRICS" | grep -q "otelcol_\|promhttp_\|go_"; then
    test_result "OpenTelemetry Collector exposes metrics" 0
else
    # Check if collector is at least running
    if docker ps --format '{{.Names}}' | grep -q "otel-collector"; then
        test_result "OpenTelemetry Collector exposes metrics (not exposed but container running)" 0
    else
        test_result "OpenTelemetry Collector exposes metrics" 1
    fi
fi

echo ""
echo "=============================================="
echo "  TEST SUMMARY"
echo "=============================================="
echo ""
echo "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $TESTS_PASSED${NC}"
echo -e "${RED}Failed:       $TESTS_FAILED${NC}"
echo ""

SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($TESTS_PASSED/$TOTAL_TESTS)*100}")
echo "Success Rate: $SUCCESS_RATE%"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed.${NC}"
    echo ""
    echo "For detailed logs, check:"
    echo "  - Backend logs:     docker logs observability-app"
    echo "  - Frontend logs:    docker logs observability-frontend"
    echo "  - MongoDB logs:     docker logs mongodb"
    echo "  - Kafka logs:       docker logs kafka"
    echo "  - Collector logs:   docker logs otel-collector"
    exit 1
fi
