#!/bin/bash

# User Profiling Test Scenarios
# This script generates diverse user actions to demonstrate the profiling system
# It creates 10 users with different behavior patterns:
# - 3 READ_HEAVY users (mostly view operations)
# - 3 WRITE_HEAVY users (mostly create/update/delete operations)
# - 2 EXPENSIVE_SEEKER users (focus on expensive products)
# - 2 BALANCED users (mixed operations)

set -e

API_URL="${API_URL:-http://localhost:8080}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}     User Profiling Test Data Generator${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""
echo -e "${YELLOW}API URL: ${API_URL}${NC}"
echo ""

# Function to make API request with user context
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local user_email=$4
    local user_id=$5
    
    local headers="-H \"Content-Type: application/json\""
    
    if [ -n "$user_email" ]; then
        headers="$headers -H \"X-User-Email: $user_email\""
    fi
    if [ -n "$user_id" ]; then
        headers="$headers -H \"X-User-Id: $user_id\""
    fi
    
    if [ "$method" == "GET" ]; then
        eval "curl -s $headers '${API_URL}${endpoint}'"
    elif [ "$method" == "POST" ]; then
        eval "curl -s -X POST $headers -d '$data' '${API_URL}${endpoint}'"
    elif [ "$method" == "PUT" ]; then
        eval "curl -s -X PUT $headers -d '$data' '${API_URL}${endpoint}'"
    elif [ "$method" == "DELETE" ]; then
        eval "curl -s -X DELETE $headers '${API_URL}${endpoint}'"
    fi
}

# Wait for services
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

# ============================================
# STEP 1: Create Test Users
# ============================================
echo ""
echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  Step 1: Creating 10 Test Users${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""

declare -a USER_IDS
declare -a USER_EMAILS

create_user() {
    local name=$1
    local email=$2
    local age=$3
    
    local result=$(make_request "POST" "/api/users" "{\"name\":\"$name\",\"email\":\"$email\",\"age\":$age,\"password\":\"test123\"}")
    local id=$(echo "$result" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$id" ]; then
        echo -e "${GREEN}  ✓ Created user: $name ($email) - ID: $id${NC}"
        USER_IDS+=("$id")
        USER_EMAILS+=("$email")
    else
        echo -e "${YELLOW}  → User may already exist: $email${NC}"
        # Try to get existing user
        result=$(make_request "GET" "/api/users/email/$email")
        id=$(echo "$result" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$id" ]; then
            USER_IDS+=("$id")
            USER_EMAILS+=("$email")
        fi
    fi
}

# Create users for different profiles
# Read-heavy users
create_user "Alice Reader" "alice.reader@example.com" 28
create_user "Bob Browser" "bob.browser@example.com" 35
create_user "Carol Viewer" "carol.viewer@example.com" 42

# Write-heavy users  
create_user "Dave Writer" "dave.writer@example.com" 31
create_user "Eve Editor" "eve.editor@example.com" 27
create_user "Frank Creator" "frank.creator@example.com" 39

# Expensive product seekers
create_user "Grace Premium" "grace.premium@example.com" 45
create_user "Henry Luxury" "henry.luxury@example.com" 52

# Balanced users
create_user "Ivy Balanced" "ivy.balanced@example.com" 33
create_user "Jack Mixed" "jack.mixed@example.com" 29

sleep 1

# ============================================
# STEP 2: Create Test Products
# ============================================
echo ""
echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  Step 2: Creating Test Products (Various Prices)${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""

declare -a PRODUCT_IDS

create_product() {
    local name=$1
    local price=$2
    local expiration=$3
    
    local result=$(make_request "POST" "/api/products" "{\"name\":\"$name\",\"price\":$price,\"expirationDate\":\"$expiration\"}")
    local id=$(echo "$result" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$id" ]; then
        echo -e "${GREEN}  ✓ Created product: $name - \$$price - ID: $id${NC}"
        PRODUCT_IDS+=("$id")
    else
        echo -e "${YELLOW}  → Product creation result: $result${NC}"
    fi
}

# Cheap products (< $50)
create_product "Budget Keyboard" 25.99 "2026-12-31"
create_product "Basic Mouse" 15.99 "2026-12-31"
create_product "USB Cable" 9.99 "2027-06-30"
create_product "Phone Case" 19.99 "2027-12-31"

# Medium-priced products ($50-$100)
create_product "Wireless Earbuds" 79.99 "2026-12-31"
create_product "Mechanical Keyboard" 89.99 "2026-12-31"
create_product "Gaming Mouse" 59.99 "2026-12-31"

# Expensive products (> $100)
create_product "4K Monitor" 499.99 "2026-12-31"
create_product "Gaming Laptop" 1299.99 "2026-12-31"
create_product "Professional Camera" 899.99 "2026-12-31"
create_product "Smart Watch Premium" 549.99 "2026-12-31"
create_product "High-End Headphones" 349.99 "2026-12-31"

sleep 1

# ============================================
# STEP 3: Simulate READ_HEAVY Users
# ============================================
echo ""
echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  Step 3: Simulating READ_HEAVY Users (20 ops each)${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""

# User 1: Alice Reader - Lots of GET operations
echo -e "${CYAN}→ Simulating Alice Reader (alice.reader@example.com)${NC}"
for i in {1..15}; do
    make_request "GET" "/api/products" "" "alice.reader@example.com" > /dev/null
    sleep 0.2
done
for i in {1..5}; do
    if [ ${#PRODUCT_IDS[@]} -gt 0 ]; then
        idx=$((RANDOM % ${#PRODUCT_IDS[@]}))
        make_request "GET" "/api/products/${PRODUCT_IDS[$idx]}" "" "alice.reader@example.com" > /dev/null
    fi
    sleep 0.2
done
echo -e "${GREEN}  ✓ Completed 20 read operations${NC}"

# User 2: Bob Browser
echo -e "${CYAN}→ Simulating Bob Browser (bob.browser@example.com)${NC}"
for i in {1..12}; do
    make_request "GET" "/api/products" "" "bob.browser@example.com" > /dev/null
    sleep 0.2
done
for i in {1..6}; do
    make_request "GET" "/api/users" "" "bob.browser@example.com" > /dev/null
    sleep 0.2
done
for i in {1..2}; do
    if [ ${#PRODUCT_IDS[@]} -gt 0 ]; then
        idx=$((RANDOM % ${#PRODUCT_IDS[@]}))
        make_request "GET" "/api/products/${PRODUCT_IDS[$idx]}" "" "bob.browser@example.com" > /dev/null
    fi
done
echo -e "${GREEN}  ✓ Completed 20 read operations${NC}"

# User 3: Carol Viewer
echo -e "${CYAN}→ Simulating Carol Viewer (carol.viewer@example.com)${NC}"
for i in {1..18}; do
    make_request "GET" "/api/users" "" "carol.viewer@example.com" > /dev/null
    sleep 0.2
done
make_request "GET" "/api/products" "" "carol.viewer@example.com" > /dev/null
make_request "GET" "/api/products" "" "carol.viewer@example.com" > /dev/null
echo -e "${GREEN}  ✓ Completed 20 read operations${NC}"

sleep 1

# ============================================
# STEP 4: Simulate WRITE_HEAVY Users
# ============================================
echo ""
echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  Step 4: Simulating WRITE_HEAVY Users (20 ops each)${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""

# User 4: Dave Writer - Lots of POST/PUT/DELETE
echo -e "${CYAN}→ Simulating Dave Writer (dave.writer@example.com)${NC}"
DAVE_PRODUCTS=()
for i in {1..8}; do
    result=$(make_request "POST" "/api/products" "{\"name\":\"Dave Product $i\",\"price\":$((10 + RANDOM % 50)).99,\"expirationDate\":\"2026-12-31\"}" "dave.writer@example.com")
    id=$(echo "$result" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    [ -n "$id" ] && DAVE_PRODUCTS+=("$id")
    sleep 0.2
done
for i in {1..6}; do
    if [ ${#DAVE_PRODUCTS[@]} -gt 0 ]; then
        idx=$((i % ${#DAVE_PRODUCTS[@]}))
        make_request "PUT" "/api/products/${DAVE_PRODUCTS[$idx]}" "{\"name\":\"Updated Dave Product $i\",\"price\":$((20 + RANDOM % 80)).99,\"expirationDate\":\"2026-12-31\"}" "dave.writer@example.com" > /dev/null
    fi
    sleep 0.2
done
for i in {1..3}; do
    if [ ${#DAVE_PRODUCTS[@]} -gt 0 ]; then
        make_request "DELETE" "/api/products/${DAVE_PRODUCTS[-1]}" "" "dave.writer@example.com" > /dev/null
        unset 'DAVE_PRODUCTS[-1]'
    fi
    sleep 0.2
done
for i in {1..3}; do
    make_request "GET" "/api/products" "" "dave.writer@example.com" > /dev/null
    sleep 0.2
done
echo -e "${GREEN}  ✓ Completed 20 operations (8 create, 6 update, 3 delete, 3 read)${NC}"

# User 5: Eve Editor
echo -e "${CYAN}→ Simulating Eve Editor (eve.editor@example.com)${NC}"
EVE_PRODUCTS=()
for i in {1..6}; do
    result=$(make_request "POST" "/api/products" "{\"name\":\"Eve Product $i\",\"price\":$((15 + RANDOM % 40)).99,\"expirationDate\":\"2026-12-31\"}" "eve.editor@example.com")
    id=$(echo "$result" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    [ -n "$id" ] && EVE_PRODUCTS+=("$id")
    sleep 0.2
done
for i in {1..10}; do
    if [ ${#EVE_PRODUCTS[@]} -gt 0 ]; then
        idx=$((i % ${#EVE_PRODUCTS[@]}))
        make_request "PUT" "/api/products/${EVE_PRODUCTS[$idx]}" "{\"name\":\"Edited Product $i\",\"price\":$((25 + RANDOM % 60)).99,\"expirationDate\":\"2026-12-31\"}" "eve.editor@example.com" > /dev/null
    fi
    sleep 0.2
done
for i in {1..4}; do
    make_request "GET" "/api/products" "" "eve.editor@example.com" > /dev/null
    sleep 0.2
done
echo -e "${GREEN}  ✓ Completed 20 operations (6 create, 10 update, 4 read)${NC}"

# User 6: Frank Creator
echo -e "${CYAN}→ Simulating Frank Creator (frank.creator@example.com)${NC}"
for i in {1..15}; do
    make_request "POST" "/api/products" "{\"name\":\"Frank Product $i\",\"price\":$((5 + RANDOM % 95)).99,\"expirationDate\":\"2026-12-31\"}" "frank.creator@example.com" > /dev/null
    sleep 0.2
done
for i in {1..5}; do
    make_request "GET" "/api/products" "" "frank.creator@example.com" > /dev/null
    sleep 0.2
done
echo -e "${GREEN}  ✓ Completed 20 operations (15 create, 5 read)${NC}"

sleep 1

# ============================================
# STEP 5: Simulate EXPENSIVE_SEEKER Users
# ============================================
echo ""
echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  Step 5: Simulating EXPENSIVE_SEEKER Users (20 ops each)${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""

# Find expensive products (IDs 7-11 are expensive)
EXPENSIVE_START=$((${#PRODUCT_IDS[@]} - 5))
if [ $EXPENSIVE_START -lt 0 ]; then
    EXPENSIVE_START=0
fi

# User 7: Grace Premium - Views expensive products
echo -e "${CYAN}→ Simulating Grace Premium (grace.premium@example.com)${NC}"
for i in {1..16}; do
    if [ ${#PRODUCT_IDS[@]} -gt $EXPENSIVE_START ]; then
        idx=$((EXPENSIVE_START + (i % 5)))
        if [ $idx -lt ${#PRODUCT_IDS[@]} ]; then
            make_request "GET" "/api/products/${PRODUCT_IDS[$idx]}" "" "grace.premium@example.com" > /dev/null
        fi
    fi
    sleep 0.2
done
for i in {1..4}; do
    make_request "GET" "/api/products" "" "grace.premium@example.com" > /dev/null
    sleep 0.2
done
echo -e "${GREEN}  ✓ Completed 20 read operations (focused on expensive products)${NC}"

# User 8: Henry Luxury
echo -e "${CYAN}→ Simulating Henry Luxury (henry.luxury@example.com)${NC}"
for i in {1..14}; do
    if [ ${#PRODUCT_IDS[@]} -gt $EXPENSIVE_START ]; then
        idx=$((EXPENSIVE_START + (i % 5)))
        if [ $idx -lt ${#PRODUCT_IDS[@]} ]; then
            make_request "GET" "/api/products/${PRODUCT_IDS[$idx]}" "" "henry.luxury@example.com" > /dev/null
        fi
    fi
    sleep 0.2
done
# Henry also creates some expensive products
for i in {1..4}; do
    make_request "POST" "/api/products" "{\"name\":\"Luxury Item $i\",\"price\":$((500 + RANDOM % 500)).99,\"expirationDate\":\"2026-12-31\"}" "henry.luxury@example.com" > /dev/null
    sleep 0.2
done
for i in {1..2}; do
    make_request "GET" "/api/products" "" "henry.luxury@example.com" > /dev/null
    sleep 0.2
done
echo -e "${GREEN}  ✓ Completed 20 operations (focused on expensive products)${NC}"

sleep 1

# ============================================
# STEP 6: Simulate BALANCED Users
# ============================================
echo ""
echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  Step 6: Simulating BALANCED Users (20 ops each)${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""

# User 9: Ivy Balanced
echo -e "${CYAN}→ Simulating Ivy Balanced (ivy.balanced@example.com)${NC}"
IVY_PRODUCTS=()
for i in {1..5}; do
    make_request "GET" "/api/products" "" "ivy.balanced@example.com" > /dev/null
    sleep 0.2
done
for i in {1..5}; do
    result=$(make_request "POST" "/api/products" "{\"name\":\"Ivy Product $i\",\"price\":$((20 + RANDOM % 80)).99,\"expirationDate\":\"2026-12-31\"}" "ivy.balanced@example.com")
    id=$(echo "$result" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    [ -n "$id" ] && IVY_PRODUCTS+=("$id")
    sleep 0.2
done
for i in {1..5}; do
    if [ ${#IVY_PRODUCTS[@]} -gt 0 ]; then
        idx=$((i % ${#IVY_PRODUCTS[@]}))
        make_request "GET" "/api/products/${IVY_PRODUCTS[$idx]}" "" "ivy.balanced@example.com" > /dev/null
    fi
    sleep 0.2
done
for i in {1..3}; do
    if [ ${#IVY_PRODUCTS[@]} -gt 0 ]; then
        idx=$((i % ${#IVY_PRODUCTS[@]}))
        make_request "PUT" "/api/products/${IVY_PRODUCTS[$idx]}" "{\"name\":\"Updated Ivy Product $i\",\"price\":$((30 + RANDOM % 70)).99,\"expirationDate\":\"2026-12-31\"}" "ivy.balanced@example.com" > /dev/null
    fi
    sleep 0.2
done
for i in {1..2}; do
    make_request "GET" "/api/users" "" "ivy.balanced@example.com" > /dev/null
    sleep 0.2
done
echo -e "${GREEN}  ✓ Completed 20 operations (10 read, 5 create, 3 update, 2 user reads)${NC}"

# User 10: Jack Mixed
echo -e "${CYAN}→ Simulating Jack Mixed (jack.mixed@example.com)${NC}"
JACK_PRODUCTS=()
for i in {1..4}; do
    make_request "GET" "/api/products" "" "jack.mixed@example.com" > /dev/null
    sleep 0.2
done
for i in {1..4}; do
    result=$(make_request "POST" "/api/products" "{\"name\":\"Jack Product $i\",\"price\":$((25 + RANDOM % 75)).99,\"expirationDate\":\"2026-12-31\"}" "jack.mixed@example.com")
    id=$(echo "$result" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    [ -n "$id" ] && JACK_PRODUCTS+=("$id")
    sleep 0.2
done
for i in {1..4}; do
    if [ ${#PRODUCT_IDS[@]} -gt 0 ]; then
        idx=$((RANDOM % ${#PRODUCT_IDS[@]}))
        make_request "GET" "/api/products/${PRODUCT_IDS[$idx]}" "" "jack.mixed@example.com" > /dev/null
    fi
    sleep 0.2
done
for i in {1..4}; do
    if [ ${#JACK_PRODUCTS[@]} -gt 0 ]; then
        idx=$((i % ${#JACK_PRODUCTS[@]}))
        make_request "PUT" "/api/products/${JACK_PRODUCTS[$idx]}" "{\"name\":\"Updated Jack Product $i\",\"price\":$((35 + RANDOM % 65)).99,\"expirationDate\":\"2026-12-31\"}" "jack.mixed@example.com" > /dev/null
    fi
    sleep 0.2
done
for i in {1..2}; do
    make_request "GET" "/api/users" "" "jack.mixed@example.com" > /dev/null
    sleep 0.2
done
for i in {1..2}; do
    if [ ${#JACK_PRODUCTS[@]} -gt 0 ]; then
        make_request "DELETE" "/api/products/${JACK_PRODUCTS[-1]}" "" "jack.mixed@example.com" > /dev/null
        unset 'JACK_PRODUCTS[-1]'
    fi
    sleep 0.2
done
echo -e "${GREEN}  ✓ Completed 20 operations (8 read, 4 create, 4 update, 2 delete, 2 user reads)${NC}"

sleep 2

# ============================================
# STEP 7: Retrieve and Display Profiles
# ============================================
echo ""
echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  Step 7: Retrieving User Profiles${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""

# Get all profiles
echo -e "${YELLOW}Fetching all profiles...${NC}"
curl -s "${API_URL}/api/profiles" | python3 -c "
import sys, json
try:
    profiles = json.load(sys.stdin)
    print(f'Total profiles: {len(profiles)}')
    print()
    for p in profiles:
        pt = p.get('profileType', 'UNKNOWN')
        email = p.get('userEmail', 'Unknown')
        reads = p.get('readOperations', 0)
        writes = p.get('writeOperations', 0)
        expensive = p.get('expensiveProductSearches', 0)
        print(f'  • {email}')
        print(f'    Type: {pt}, Reads: {reads}, Writes: {writes}, Expensive: {expensive}')
except:
    print('Could not parse profiles')
"

echo ""
echo -e "${YELLOW}Profile Statistics:${NC}"
curl -s "${API_URL}/api/profiles/statistics" | python3 -c "
import sys, json
try:
    stats = json.load(sys.stdin)
    print(f'  Total Profiles: {stats.get(\"totalProfiles\", 0)}')
    print(f'  Avg Read Ops: {stats.get(\"averageReadOperations\", 0):.1f}')
    print(f'  Avg Write Ops: {stats.get(\"averageWriteOperations\", 0):.1f}')
    print(f'  Avg Expensive Searches: {stats.get(\"averageExpensiveSearches\", 0):.1f}')
    print()
    dist = stats.get('profileTypeDistribution', {})
    print('  Profile Type Distribution:')
    for k, v in dist.items():
        print(f'    - {k}: {v}')
except Exception as e:
    print(f'Could not parse statistics: {e}')
"

echo ""
echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  User Profiles by Category${NC}"
echo -e "${BLUE}======================================================${NC}"

echo ""
echo -e "${GREEN}READ_HEAVY Users:${NC}"
curl -s "${API_URL}/api/profiles/read-heavy" | python3 -c "
import sys, json
try:
    profiles = json.load(sys.stdin)
    for p in profiles:
        print(f'  - {p.get(\"userEmail\", \"Unknown\")}: {p.get(\"readOperations\", 0)} reads, {p.get(\"writeOperations\", 0)} writes')
except:
    print('  None found')
"

echo ""
echo -e "${YELLOW}WRITE_HEAVY Users:${NC}"
curl -s "${API_URL}/api/profiles/write-heavy" | python3 -c "
import sys, json
try:
    profiles = json.load(sys.stdin)
    for p in profiles:
        print(f'  - {p.get(\"userEmail\", \"Unknown\")}: {p.get(\"readOperations\", 0)} reads, {p.get(\"writeOperations\", 0)} writes')
except:
    print('  None found')
"

echo ""
echo -e "${CYAN}EXPENSIVE_SEEKER Users:${NC}"
curl -s "${API_URL}/api/profiles/expensive-seekers" | python3 -c "
import sys, json
try:
    profiles = json.load(sys.stdin)
    for p in profiles:
        print(f'  - {p.get(\"userEmail\", \"Unknown\")}: {p.get(\"expensiveProductSearches\", 0)} expensive searches, avg price: \${p.get(\"averageProductPriceViewed\", 0):.2f}')
except:
    print('  None found')
"

echo ""
echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}  ✅ User Profiling Test Complete!${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""
echo "Access the profile API endpoints:"
echo "  - All profiles:         ${API_URL}/api/profiles"
echo "  - Statistics:           ${API_URL}/api/profiles/statistics"
echo "  - Export JSON:          ${API_URL}/api/profiles/export"
echo "  - Read-heavy users:     ${API_URL}/api/profiles/read-heavy"
echo "  - Write-heavy users:    ${API_URL}/api/profiles/write-heavy"
echo "  - Expensive seekers:    ${API_URL}/api/profiles/expensive-seekers"
echo ""
