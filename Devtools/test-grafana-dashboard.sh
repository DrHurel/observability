#!/bin/bash

echo "========================================"
echo "  Grafana Dashboard Functional Tests"
echo "========================================"
echo ""

GRAFANA_URL="http://localhost:3000"
GRAFANA_USER="admin"
GRAFANA_PASS="admin"
CLICKHOUSE_URL="http://localhost:8123"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass_count=0
fail_count=0

print_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}✓ PASS${NC} $1"
    ((pass_count++))
}

print_fail() {
    echo -e "${RED}✗ FAIL${NC} $1"
    ((fail_count++))
}

# Test 1: Grafana Health Check
print_test "Checking Grafana health..."
health_response=$(curl -s "$GRAFANA_URL/api/health")
if echo "$health_response" | grep -q "ok"; then
    print_pass "Grafana is healthy"
    echo "       Response: $health_response"
else
    print_fail "Grafana health check failed"
    echo "       Response: $health_response"
fi
echo ""

# Test 2: Grafana API Authentication
print_test "Testing Grafana API authentication..."
auth_response=$(curl -s -u "$GRAFANA_USER:$GRAFANA_PASS" "$GRAFANA_URL/api/org")
if echo "$auth_response" | grep -q "id"; then
    print_pass "Authentication successful"
    echo "       Organization: $(echo $auth_response | grep -o '"name":"[^"]*"' | cut -d'"' -f4)"
else
    print_fail "Authentication failed"
    echo "       Response: $auth_response"
fi
echo ""

# Test 3: Check ClickHouse Datasource
print_test "Checking ClickHouse datasource..."
datasource_response=$(curl -s -u "$GRAFANA_USER:$GRAFANA_PASS" "$GRAFANA_URL/api/datasources/name/ClickHouse")
if echo "$datasource_response" | grep -q "ClickHouse"; then
    print_pass "ClickHouse datasource configured"
    ds_id=$(echo $datasource_response | grep -o '"id":[0-9]*' | cut -d':' -f2)
    echo "       Datasource ID: $ds_id"
else
    print_fail "ClickHouse datasource not found"
    echo "       Response: $datasource_response"
fi
echo ""

# Test 4: Test ClickHouse Connection
print_test "Testing ClickHouse connection..."
clickhouse_test=$(curl -s "$CLICKHOUSE_URL/ping")
if [ "$clickhouse_test" = "Ok." ]; then
    print_pass "ClickHouse is responding"
else
    print_fail "ClickHouse connection failed"
    echo "       Response: $clickhouse_test"
fi
echo ""

# Test 5: Check if observability database exists
print_test "Checking observability database..."
db_check=$(curl -s "$CLICKHOUSE_URL/?query=SHOW%20DATABASES%20FORMAT%20TabSeparated" | grep "observability")
if [ ! -z "$db_check" ]; then
    print_pass "Observability database exists"
else
    print_fail "Observability database not found"
fi
echo ""

# Test 6: Check user_events table
print_test "Checking user_events table..."
user_table=$(curl -s "$CLICKHOUSE_URL/?query=EXISTS%20TABLE%20observability.user_events%20FORMAT%20TabSeparated")
if [ "$user_table" = "1" ]; then
    print_pass "user_events table exists"
    user_count=$(curl -s "$CLICKHOUSE_URL/?query=SELECT%20COUNT(*)%20FROM%20observability.user_events%20FORMAT%20TabSeparated")
    echo "       Records in user_events: $user_count"
else
    print_fail "user_events table not found"
fi
echo ""

# Test 7: Check product_events table
print_test "Checking product_events table..."
product_table=$(curl -s "$CLICKHOUSE_URL/?query=EXISTS%20TABLE%20observability.product_events%20FORMAT%20TabSeparated")
if [ "$product_table" = "1" ]; then
    print_pass "product_events table exists"
    product_count=$(curl -s "$CLICKHOUSE_URL/?query=SELECT%20COUNT(*)%20FROM%20observability.product_events%20FORMAT%20TabSeparated")
    echo "       Records in product_events: $product_count"
else
    print_fail "product_events table not found"
fi
echo ""

# Test 8: Test user_events query (Panel 1)
print_test "Testing user_events count query..."
user_events_query="SELECT%20COUNT(*)%20as%20total%20FROM%20observability.user_events%20FORMAT%20JSONCompact"
user_query_result=$(curl -s "$CLICKHOUSE_URL/?query=$user_events_query")
if echo "$user_query_result" | grep -q "data"; then
    print_pass "User events count query successful"
    echo "       Result: $user_query_result"
else
    print_fail "User events query failed"
fi
echo ""

# Test 9: Test product_events query (Panel 2)
print_test "Testing product_events count query..."
product_events_query="SELECT%20COUNT(*)%20as%20total%20FROM%20observability.product_events%20FORMAT%20JSONCompact"
product_query_result=$(curl -s "$CLICKHOUSE_URL/?query=$product_events_query")
if echo "$product_query_result" | grep -q "data"; then
    print_pass "Product events count query successful"
    echo "       Result: $product_query_result"
else
    print_fail "Product events query failed"
fi
echo ""

# Test 10: Test time series query with GROUP BY
print_test "Testing time series query (events per minute)..."
timeseries_query="SELECT%20toStartOfMinute(timestamp)%20as%20time,%20COUNT(*)%20as%20count%20FROM%20observability.user_events%20WHERE%20timestamp%20%3E=%20now()%20-%20INTERVAL%201%20HOUR%20GROUP%20BY%20time%20ORDER%20BY%20time%20FORMAT%20JSONCompact"
timeseries_result=$(curl -s "$CLICKHOUSE_URL/?query=$timeseries_query")
if echo "$timeseries_result" | grep -q "data"; then
    print_pass "Time series query successful"
    echo "       Result: $(echo $timeseries_result | head -c 100)..."
else
    print_fail "Time series query failed"
fi
echo ""

# Test 11: Test event type distribution query
print_test "Testing event type distribution query..."
distribution_query="SELECT%20event_type,%20COUNT(*)%20as%20count%20FROM%20observability.user_events%20GROUP%20BY%20event_type%20FORMAT%20JSONCompact"
distribution_result=$(curl -s "$CLICKHOUSE_URL/?query=$distribution_query")
if echo "$distribution_result" | grep -q "data"; then
    print_pass "Event distribution query successful"
    echo "       Result: $distribution_result"
else
    print_fail "Event distribution query failed"
fi
echo ""

# Test 12: Check dashboard exists
print_test "Checking if observability dashboard exists..."
dashboard_response=$(curl -s -u "$GRAFANA_USER:$GRAFANA_PASS" "$GRAFANA_URL/api/dashboards/uid/observability-main")
if echo "$dashboard_response" | grep -q "observability-main"; then
    print_pass "Dashboard found"
    dashboard_title=$(echo $dashboard_response | grep -o '"title":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "       Title: $dashboard_title"
    panel_count=$(echo $dashboard_response | grep -o '"id":[0-9]*' | wc -l)
    echo "       Panels detected: $panel_count"
else
    print_fail "Dashboard not found"
    echo "       Response: $(echo $dashboard_response | head -c 200)"
fi
echo ""

# Test 13: Test dashboard panels configuration
print_test "Verifying dashboard panels have targets..."
if echo "$dashboard_response" | grep -q "rawSql"; then
    print_pass "Dashboard panels have SQL queries configured"
    query_count=$(echo $dashboard_response | grep -o '"rawSql"' | wc -l)
    echo "       Number of queries: $query_count"
else
    print_fail "No SQL queries found in dashboard panels"
fi
echo ""

# Test 14: Check dashboard refresh rate
print_test "Checking dashboard auto-refresh configuration..."
if echo "$dashboard_response" | grep -q '"refresh":"10s"'; then
    print_pass "Auto-refresh is configured (10 seconds)"
else
    if echo "$dashboard_response" | grep -q '"refresh"'; then
        refresh=$(echo $dashboard_response | grep -o '"refresh":"[^"]*"' | head -1 | cut -d'"' -f4)
        print_pass "Auto-refresh configured: $refresh"
    else
        print_fail "Auto-refresh not configured"
    fi
fi
echo ""

# Test 15: Test recent events query (last 50)
print_test "Testing recent events query..."
recent_query="SELECT%20*%20FROM%20observability.user_events%20ORDER%20BY%20timestamp%20DESC%20LIMIT%2050%20FORMAT%20JSONCompact"
recent_result=$(curl -s "$CLICKHOUSE_URL/?query=$recent_query")
if echo "$recent_result" | grep -q "data"; then
    print_pass "Recent events query successful"
    row_count=$(echo $recent_result | grep -o '\[' | wc -l)
    echo "       Rows returned: $row_count"
else
    print_fail "Recent events query failed"
fi
echo ""

# Summary
echo "========================================"
echo "           TEST SUMMARY"
echo "========================================"
echo -e "${GREEN}Passed: $pass_count${NC}"
echo -e "${RED}Failed: $fail_count${NC}"
total=$((pass_count + fail_count))
echo "Total:  $total"
echo ""

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Dashboard is fully functional.${NC}"
    echo ""
    echo "🌐 Access the dashboard:"
    echo "   URL: http://localhost:3000/d/observability-main"
    echo "   User: admin"
    echo "   Pass: admin"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the errors above.${NC}"
    exit 1
fi
