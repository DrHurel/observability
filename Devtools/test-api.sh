#!/bin/bash

# Quick Test Script for the Observability Application

echo "=========================================="
echo "Testing Observability Application"
echo "=========================================="
echo ""

# Wait for application to be fully ready
echo "Waiting for application to start..."
sleep 5

BASE_URL="http://localhost:8080"

echo ""
echo "1. Testing Health Check..."
curl -s "$BASE_URL/actuator/health" | grep -q "UP" && echo "✓ Health check passed" || echo "✗ Health check failed"

echo ""
echo "2. Creating a test user..."
USER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "age": 25,
    "email": "test@example.com",
    "password": "password123"
  }')
echo "$USER_RESPONSE" | grep -q "test@example.com" && echo "✓ User created successfully" || echo "✗ User creation failed"

echo ""
echo "3. Getting all users..."
curl -s "$BASE_URL/api/users" | grep -q "Test User" && echo "✓ Get users passed" || echo "✗ Get users failed"

echo ""
echo "4. Creating a test product..."
PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/products" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "price": 99.99,
    "expirationDate": "2026-12-31"
  }')
echo "$PRODUCT_RESPONSE" | grep -q "Test Product" && echo "✓ Product created successfully" || echo "✗ Product creation failed"

echo ""
echo "5. Getting all products..."
curl -s "$BASE_URL/api/products" | grep -q "Test Product" && echo "✓ Get products passed" || echo "✗ Get products failed"

echo ""
echo "6. Testing error handling (non-existent product)..."
ERROR_RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL/api/products/999")
echo "$ERROR_RESPONSE" | grep -q "404" && echo "✓ Error handling passed" || echo "✗ Error handling failed"

echo ""
echo "=========================================="
echo "Test Complete!"
echo "=========================================="
echo ""
echo "Access the application at:"
echo "  - API: $BASE_URL"
echo "  - Grafana: http://localhost:3000"
echo "  - H2 Console: $BASE_URL/h2-console"
