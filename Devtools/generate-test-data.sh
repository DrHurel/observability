#!/bin/bash

echo "========================================"
echo "  Generating Test Data for Dashboard"
echo "========================================"
echo ""

API_URL="http://localhost:8080"

echo "Creating test users..."
for i in {1..5}; do
    curl -s -X POST "$API_URL/api/users" \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"Test User $i\",\"email\":\"user$i@test.com\",\"age\":$((20 + i)),\"password\":\"password$i\"}" > /dev/null
    echo "✓ Created user $i"
    sleep 1
done

echo ""
echo "Creating test products..."
for i in {1..5}; do
    price=$((10 + i * 5))
    curl -s -X POST "$API_URL/api/products" \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"Test Product $i\",\"description\":\"Description for product $i\",\"price\":$price.99,\"expirationDate\":\"2026-12-31\"}" > /dev/null
    echo "✓ Created product $i (Price: \$$price.99)"
    sleep 1
done

echo ""
echo "========================================"
echo "✅ Test data created successfully!"
echo "========================================"
echo ""
echo "Open Grafana to see the data:"
echo "🔗 http://localhost:3000/d/observability-main"
echo ""
echo "Default credentials:"
echo "   Username: admin"
echo "   Password: admin"
echo ""
echo "You should see:"
echo "   📊 10 total events (5 users + 5 products)"
echo "   📈 Activity in the time series charts"
echo "   📋 10 entries in the recent events tables"
echo ""
