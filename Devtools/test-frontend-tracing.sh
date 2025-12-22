#!/bin/bash

echo "=== Testing Frontend Tracing ==="
echo

echo "1. Testing frontend page load..."
curl -s http://localhost:4200 > /dev/null
sleep 1

echo "2. Testing API calls through frontend..."
# Simulate API calls that the frontend would make
curl -s http://localhost:8080/api/users > /dev/null
sleep 1

curl -s http://localhost:8080/api/products > /dev/null
sleep 2

echo "3. Checking Jaeger for frontend traces..."
echo

# Check if frontend service appears in Jaeger
SERVICES=$(curl -s 'http://localhost:16686/api/services' | grep -o '"observability-frontend"' || echo "NOT FOUND")

if [ "$SERVICES" = "\"observability-frontend\"" ]; then
    echo "✅ Frontend service found in Jaeger!"
    
    # Get traces for frontend
    echo
    echo "Recent frontend traces:"
    curl -s "http://localhost:16686/api/traces?service=observability-frontend&limit=5" | \
        python3 -c "import sys, json; data = json.load(sys.stdin); print(f'Found {len(data.get(\"data\", []))} traces')"
else
    echo "❌ Frontend service NOT found in Jaeger"
    echo "Available services:"
    curl -s 'http://localhost:16686/api/services' | python3 -c "import sys, json; data = json.load(sys.stdin); [print(f'  - {s}') for s in data.get('data', [])]"
fi

echo
echo "4. Checking if OTLP endpoint is accessible from frontend perspective..."
# This simulates what the frontend would do
curl -X POST http://localhost:4318/v1/traces \
    -H "Content-Type: application/json" \
    -d '{"resourceSpans":[]}' \
    -w "\nHTTP Status: %{http_code}\n" \
    2>/dev/null

echo
echo "=== Test Complete ==="
