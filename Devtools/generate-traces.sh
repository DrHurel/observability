#!/bin/bash

# OpenTelemetry Trace Generation Script
# This script generates various traces by interacting with the backend API
# It simulates different user scenarios to populate Jaeger with diverse traces

set -e

API_URL="${API_URL:-http://localhost:8080}"
BASE_URL="${BASE_URL:-http://localhost:4200}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  OpenTelemetry Trace Generation Script${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${YELLOW}API URL: ${API_URL}${NC}"
echo -e "${YELLOW}Frontend URL: ${BASE_URL}${NC}"
echo ""

# Function to make API requests with trace headers
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${GREEN}→ ${description}${NC}"
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" \
            -H "Content-Type: application/json" \
            -H "traceparent: 00-$(openssl rand -hex 16)-$(openssl rand -hex 8)-01" \
            "${API_URL}${endpoint}")
    elif [ "$method" == "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" \
            -X POST \
            -H "Content-Type: application/json" \
            -H "traceparent: 00-$(openssl rand -hex 16)-$(openssl rand -hex 8)-01" \
            -d "${data}" \
            "${API_URL}${endpoint}")
    elif [ "$method" == "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" \
            -X PUT \
            -H "Content-Type: application/json" \
            -H "traceparent: 00-$(openssl rand -hex 16)-$(openssl rand -hex 8)-01" \
            -d "${data}" \
            "${API_URL}${endpoint}")
    elif [ "$method" == "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" \
            -X DELETE \
            -H "Content-Type: application/json" \
            -H "traceparent: 00-$(openssl rand -hex 16)-$(openssl rand -hex 8)-01" \
            "${API_URL}${endpoint}")
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
        echo -e "  ${GREEN}✓ Success (HTTP ${http_code})${NC}"
    else
        echo -e "  ${RED}✗ Failed (HTTP ${http_code})${NC}"
    fi
    
    echo "$body"
    sleep 0.5
}

# Wait for services to be ready
echo -e "${YELLOW}Checking if services are ready...${NC}"
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s -f "${API_URL}/actuator/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready${NC}"
        break
    fi
    echo -e "  Waiting for backend... (attempt $((attempt+1))/${max_attempts})"
    sleep 2
    attempt=$((attempt+1))
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}✗ Backend is not responding. Exiting.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}===================================${NC}"
echo -e "${BLUE}  Scenario 1: User Management${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""

# Create users
USER1=$(make_request "POST" "/api/users" \
    '{"name":"Alice Johnson","email":"alice.johnson@example.com","age":28,"department":"Engineering"}' \
    "Creating user: Alice Johnson")
USER1_ID=$(echo "$USER1" | jq -r '.id' 2>/dev/null || echo "")

sleep 1

USER2=$(make_request "POST" "/api/users" \
    '{"name":"Bob Smith","email":"bob.smith@example.com","age":35,"department":"Sales"}' \
    "Creating user: Bob Smith")
USER2_ID=$(echo "$USER2" | jq -r '.id' 2>/dev/null || echo "")

sleep 1

USER3=$(make_request "POST" "/api/users" \
    '{"name":"Charlie Brown","email":"charlie.brown@example.com","age":42,"department":"Marketing"}' \
    "Creating user: Charlie Brown")

sleep 1

# List all users
make_request "GET" "/api/users" "" "Fetching all users"

sleep 1

# Get user by ID
if [ -n "$USER1_ID" ] && [ "$USER1_ID" != "null" ]; then
    make_request "GET" "/api/users/${USER1_ID}" "" "Fetching user by ID: ${USER1_ID}"
    sleep 1
fi

# Get user by email
make_request "GET" "/api/users/email/bob.smith@example.com" "" "Fetching user by email: bob.smith@example.com"

sleep 1

echo ""
echo -e "${BLUE}===================================${NC}"
echo -e "${BLUE}  Scenario 2: Product Management${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""

# Create products
PRODUCT1=$(make_request "POST" "/api/products" \
    '{"name":"Laptop","description":"High-performance laptop for developers","price":1299.99,"quantity":50}' \
    "Creating product: Laptop")
PRODUCT1_ID=$(echo "$PRODUCT1" | jq -r '.id' 2>/dev/null || echo "")

sleep 1

PRODUCT2=$(make_request "POST" "/api/products" \
    '{"name":"Monitor","description":"4K Ultra HD monitor","price":499.99,"quantity":100}' \
    "Creating product: Monitor")
PRODUCT2_ID=$(echo "$PRODUCT2" | jq -r '.id' 2>/dev/null || echo "")

sleep 1

PRODUCT3=$(make_request "POST" "/api/products" \
    '{"name":"Keyboard","description":"Mechanical keyboard with RGB","price":149.99,"quantity":200}' \
    "Creating product: Keyboard")

sleep 1

PRODUCT4=$(make_request "POST" "/api/products" \
    '{"name":"Mouse","description":"Wireless ergonomic mouse","price":79.99,"quantity":150}' \
    "Creating product: Mouse")

sleep 1

# List all products
make_request "GET" "/api/products" "" "Fetching all products"

sleep 1

# Get product by ID
if [ -n "$PRODUCT1_ID" ] && [ "$PRODUCT1_ID" != "null" ]; then
    make_request "GET" "/api/products/${PRODUCT1_ID}" "" "Fetching product by ID: ${PRODUCT1_ID}"
    sleep 1
    
    # Update product
    make_request "PUT" "/api/products/${PRODUCT1_ID}" \
        '{"name":"Laptop Pro","description":"Premium high-performance laptop","price":1499.99,"quantity":45}' \
        "Updating product: ${PRODUCT1_ID}"
    sleep 1
fi

echo ""
echo -e "${BLUE}===================================${NC}"
echo -e "${BLUE}  Scenario 3: Rapid Operations${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""

# Simulate rapid consecutive requests
for i in {1..5}; do
    make_request "GET" "/api/products" "" "Rapid request #${i}: Fetching products"
    sleep 0.2
done

sleep 1

for i in {1..5}; do
    make_request "GET" "/api/users" "" "Rapid request #${i}: Fetching users"
    sleep 0.2
done

echo ""
echo -e "${BLUE}===================================${NC}"
echo -e "${BLUE}  Scenario 4: Error Scenarios${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""

# Try to access non-existent resources
make_request "GET" "/api/users/nonexistent-id-12345" "" "Fetching non-existent user (expect 404)"

sleep 1

make_request "GET" "/api/products/invalid-product-id" "" "Fetching non-existent product (expect 404)"

sleep 1

# Try to create invalid data (validation errors)
make_request "POST" "/api/users" \
    '{"name":"","email":"invalid-email","age":-5}' \
    "Creating user with invalid data (expect 400)"

sleep 1

make_request "POST" "/api/products" \
    '{"name":"","price":-10,"quantity":-5}' \
    "Creating product with invalid data (expect 400)"

echo ""
echo -e "${BLUE}===================================${NC}"
echo -e "${BLUE}  Scenario 5: Complex Workflows${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""

# Simulate a complex workflow: create user, create product, fetch both
NEW_USER=$(make_request "POST" "/api/users" \
    '{"name":"David Wilson","email":"david.wilson@example.com","age":31,"department":"IT"}' \
    "Step 1: Creating new user")
NEW_USER_ID=$(echo "$NEW_USER" | jq -r '.id' 2>/dev/null || echo "")

sleep 0.5

NEW_PRODUCT=$(make_request "POST" "/api/products" \
    '{"name":"Headphones","description":"Noise-cancelling headphones","price":299.99,"quantity":75}' \
    "Step 2: Creating new product")
NEW_PRODUCT_ID=$(echo "$NEW_PRODUCT" | jq -r '.id' 2>/dev/null || echo "")

sleep 0.5

if [ -n "$NEW_USER_ID" ] && [ "$NEW_USER_ID" != "null" ]; then
    make_request "GET" "/api/users/${NEW_USER_ID}" "" "Step 3: Verifying user creation"
fi

sleep 0.5

if [ -n "$NEW_PRODUCT_ID" ] && [ "$NEW_PRODUCT_ID" != "null" ]; then
    make_request "GET" "/api/products/${NEW_PRODUCT_ID}" "" "Step 4: Verifying product creation"
fi

sleep 0.5

make_request "GET" "/api/users" "" "Step 5: Listing all users"

sleep 0.5

make_request "GET" "/api/products" "" "Step 6: Listing all products"

echo ""
echo -e "${BLUE}===================================${NC}"
echo -e "${BLUE}  Scenario 6: Delete Operations${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""

# Delete operations
if [ -n "$PRODUCT2_ID" ] && [ "$PRODUCT2_ID" != "null" ]; then
    make_request "DELETE" "/api/products/${PRODUCT2_ID}" "" "Deleting product: ${PRODUCT2_ID}"
    sleep 1
    
    # Try to fetch the deleted product
    make_request "GET" "/api/products/${PRODUCT2_ID}" "" "Verifying deletion (expect 404)"
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Trace Generation Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${YELLOW}View traces in Jaeger UI:${NC}"
echo -e "  ${BLUE}http://localhost:16686${NC}"
echo ""
echo -e "${YELLOW}Summary of generated traces:${NC}"
echo "  - User creation and management operations"
echo "  - Product CRUD operations"
echo "  - Rapid consecutive requests"
echo "  - Error scenarios (404, 400)"
echo "  - Complex multi-step workflows"
echo "  - Delete operations with verification"
echo ""
echo -e "${YELLOW}Expected trace patterns:${NC}"
echo "  - HTTP request spans"
echo "  - Controller method spans"
echo "  - Service method spans"
echo "  - MongoDB operation spans"
echo "  - Kafka message production spans"
echo ""
echo -e "${GREEN}✓ All scenarios executed successfully${NC}"
