# Quick Start Guide - OpenTelemetry Tracing

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ and npm (for local frontend development)
- Java 21 (for local backend development)
- At least 4GB RAM available for Docker

## Step-by-Step Setup

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

This installs the OpenTelemetry packages and other dependencies.

### 2. Build and Start All Services

```bash
cd docker
docker compose up --build
```

**Wait for all services to be healthy** (approximately 2-3 minutes):
- MongoDB
- Kafka
- ClickHouse
- Grafana
- **Jaeger** ✨
- **OpenTelemetry Collector** ✨
- Backend Application
- Frontend Application

### 3. Verify Services are Running

```bash
# In a new terminal
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

You should see all containers running and healthy.

### 4. Access the Applications

Open these URLs in your browser:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:4200 | Main Angular application |
| **Backend API** | http://localhost:8080/api | REST API endpoints |
| **Jaeger UI** | http://localhost:16686 | 🎯 **View distributed traces** |
| **Grafana** | http://localhost:3000 | Metrics and dashboards |
| **OTel Collector Health** | http://localhost:13133 | Collector health check |

## Testing the Tracing Setup

### Method 1: Use the Angular Application

1. Open http://localhost:4200
2. Navigate through the application:
   - Go to Users page
   - Create a new user
   - View the user list
   - Go to Products page
   - Create products
   - Edit or delete products
3. Each interaction generates traces!

### Method 2: Use the HTML Test Page

1. Open http://localhost:4200/trace-test.html
2. Click the various scenario buttons:
   - **User Management**: Create and query users
   - **Product Management**: Full CRUD operations
   - **Rapid Fire**: Generate multiple traces quickly
   - **Error Scenarios**: Test error tracking
   - **Complex Workflows**: Multi-step operations
3. Watch the console output
4. Open Jaeger UI to see the traces

### Method 3: Run the Automated Test Script

```bash
chmod +x Devtools/generate-traces.sh
./Devtools/generate-traces.sh
```

This script automatically generates diverse traces covering all scenarios.

### Method 4: Use curl Commands

```bash
# Create a user
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","age":30,"department":"IT"}'

# Get all users
curl http://localhost:8080/api/users

# Create a product
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","description":"High-performance laptop","price":1299.99,"quantity":50}'

# Get all products
curl http://localhost:8080/api/products
```

## Viewing Traces in Jaeger

### 1. Open Jaeger UI

Go to: http://localhost:16686

### 2. Search for Traces

**Option A: View Frontend Traces**
1. Select **Service**: `observability-frontend`
2. Click **"Find Traces"**
3. You'll see traces for:
   - Page loads
   - User interactions (clicks)
   - HTTP requests to backend

**Option B: View Backend Traces**
1. Select **Service**: `observability-backend`
2. Click **"Find Traces"**
3. You'll see traces for:
   - HTTP requests received
   - Controller methods
   - Service methods
   - Database operations
   - Kafka operations

**Option C: View End-to-End Traces**
1. Select **Service**: `observability-frontend`
2. Look for traces with multiple spans
3. Click on a trace to see:
   - Frontend span (user click or page load)
   - HTTP request span
   - Backend span (API processing)
   - Database span (MongoDB query)
   - Complete timeline from browser to database

### 3. Understanding the Trace Visualization

Each trace shows:
- **Trace ID**: Unique identifier for the entire request flow
- **Spans**: Individual operations within the trace
- **Duration**: Time taken for each operation
- **Tags**: Metadata like HTTP method, status code, URLs
- **Timeline**: Visual representation of operation sequence

### 4. Advanced Filtering

Try these searches:
- **Slow requests**: Set min duration to 500ms
- **Errors only**: Add tag `http.status_code=500` or `error=true`
- **Specific operations**: Add tag `http.method=POST`
- **Recent traces**: Adjust the time range (last 5 minutes, 1 hour, etc.)

## What to Look For

### ✅ Successful End-to-End Traces

A complete trace should show:

```
Frontend Trace
├── Document Load / User Interaction
├── Fetch/XHR Request
│   └── HTTP POST/GET to backend
│
Backend Trace (same trace ID!)
├── HTTP Request Received
├── Controller Method
├── Service Method
├── MongoDB Operation
└── Kafka Producer (if applicable)
```

### ✅ Trace Context Propagation

Verify that:
1. Frontend and backend spans share the **same Trace ID**
2. Backend span is a **child** of frontend HTTP request span
3. The timeline shows proper sequence: Frontend → Network → Backend → Database

### ✅ Attributes to Check

Each span should have rich metadata:
- `http.method`: GET, POST, PUT, DELETE
- `http.url`: Full request URL
- `http.status_code`: 200, 404, 500, etc.
- `db.system`: mongodb
- `db.statement`: Query executed
- `messaging.system`: kafka

## Troubleshooting

### Problem: No Traces in Jaeger

**Solution:**
```bash
# Check if services are running
docker ps | grep -E "jaeger|otel-collector"

# Check collector logs
docker logs otel-collector

# Check backend logs for OpenTelemetry initialization
docker logs observability-app | grep -i opentelemetry

# Test collector endpoint
curl http://localhost:13133
```

### Problem: Frontend Traces Not Appearing

**Solution:**
```bash
# Check browser console for errors
# Verify collector CORS is configured
# Test OTLP endpoint
curl -X POST http://localhost:4318/v1/traces \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans":[]}'
```

### Problem: Traces Not Connected (Different Trace IDs)

**Solution:**
- Check browser Network tab for `traceparent` header in requests
- Verify CORS allows trace headers
- Check backend logs for trace context extraction
- Ensure frontend instrumentation includes propagation config

### Problem: Backend Won't Start

**Solution:**
```bash
# Check if OpenTelemetry agent downloaded successfully
docker exec observability-app ls -lh /app/opentelemetry-javaagent.jar

# Check backend logs
docker logs observability-app

# Rebuild the image
docker compose up --build application
```

### Problem: High Memory Usage

**Solution:**
- Adjust sampling rate (see OPENTELEMETRY_TRACING.md)
- Increase collector memory limit
- Reduce batch size in collector config

## Next Steps

Once traces are working:

1. **Explore Different Scenarios**: Try all 6 test scenarios
2. **Analyze Performance**: Find slow operations in traces
3. **Debug Issues**: Use traces to identify bottlenecks
4. **Custom Instrumentation**: Add manual spans for business logic
5. **Production Configuration**: Implement sampling and optimization
6. **Alerting**: Set up alerts for slow or failing traces
7. **Metrics Integration**: Connect traces with metrics in Grafana

## Expected Results

After following this guide, you should see:

✅ All Docker containers running
✅ Frontend accessible at localhost:4200
✅ Backend API responding at localhost:8080
✅ Jaeger UI showing traces at localhost:16686
✅ User interactions generating traces
✅ API calls creating connected traces
✅ Database operations visible in traces
✅ End-to-end trace propagation working
✅ Error scenarios captured in traces

## Performance Metrics

Typical trace durations you might see:
- **Page Load**: 200-500ms
- **Simple API Call**: 10-50ms
- **Database Query**: 5-20ms
- **Full User Interaction**: 50-200ms
- **Complex Workflow**: 500ms-2s

## Resources

- Full documentation: [OPENTELEMETRY_TRACING.md](OPENTELEMETRY_TRACING.md)
- Test script: [Devtools/generate-traces.sh](Devtools/generate-traces.sh)
- Test page: http://localhost:4200/trace-test.html
- Jaeger UI: http://localhost:16686

## Quick Reference Commands

```bash
# Start services
cd docker && docker compose up --build

# Stop services
docker compose down

# View logs
docker logs -f observability-app
docker logs -f otel-collector
docker logs -f jaeger

# Generate test traces
./Devtools/generate-traces.sh

# Check service health
curl http://localhost:8080/actuator/health
curl http://localhost:13133
```

## Success Checklist

- [ ] All Docker containers are running and healthy
- [ ] Frontend loads at localhost:4200
- [ ] Backend API responds at localhost:8080
- [ ] Jaeger UI accessible at localhost:16686
- [ ] Can create users and products
- [ ] Traces appear in Jaeger UI
- [ ] Frontend traces visible (observability-frontend)
- [ ] Backend traces visible (observability-backend)
- [ ] Frontend and backend traces are connected (same trace ID)
- [ ] Can see database operations in traces
- [ ] Error scenarios generate traces with error information
- [ ] Test script runs successfully

---

🎉 **Congratulations!** You now have a complete end-to-end distributed tracing system with OpenTelemetry!
