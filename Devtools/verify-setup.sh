#!/bin/bash

# OpenTelemetry Setup Verification Script
# This script verifies that all OpenTelemetry components are properly configured

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  OpenTelemetry Setup Verification${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running from correct directory
if [ ! -f "docker/docker-compose.yml" ]; then
    echo -e "${RED}✗ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Checking required files...${NC}"

# Check required files
files=(
    "docker/docker-compose.yml"
    "docker/otel-collector-config.yaml"
    "docker/Dockerfile"
    "frontend/package.json"
    "frontend/src/app/services/tracing.service.ts"
    "frontend/src/main.ts"
    "Devtools/generate-traces.sh"
    "frontend/public/trace-test.html"
    "OPENTELEMETRY_TRACING.md"
    "QUICKSTART.md"
    "OPENTELEMETRY_SUMMARY.md"
)

all_files_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} Found: $file"
    else
        echo -e "${RED}✗${NC} Missing: $file"
        all_files_exist=false
    fi
done

echo ""

if [ "$all_files_exist" = false ]; then
    echo -e "${RED}✗ Some required files are missing!${NC}"
    exit 1
fi

echo -e "${YELLOW}Checking docker-compose.yml configuration...${NC}"

# Check if Jaeger service exists
if grep -q "jaeger:" docker/docker-compose.yml; then
    echo -e "${GREEN}✓${NC} Jaeger service configured"
else
    echo -e "${RED}✗${NC} Jaeger service not found in docker-compose.yml"
    exit 1
fi

# Check if OTel Collector service exists
if grep -q "otel-collector:" docker/docker-compose.yml; then
    echo -e "${GREEN}✓${NC} OpenTelemetry Collector service configured"
else
    echo -e "${RED}✗${NC} OpenTelemetry Collector service not found in docker-compose.yml"
    exit 1
fi

echo ""
echo -e "${YELLOW}Checking OpenTelemetry Collector configuration...${NC}"

# Check collector config file
if grep -q "otlp:" docker/otel-collector-config.yaml; then
    echo -e "${GREEN}✓${NC} OTLP receiver configured"
else
    echo -e "${RED}✗${NC} OTLP receiver not configured"
    exit 1
fi

if grep -q "jaeger:" docker/otel-collector-config.yaml; then
    echo -e "${GREEN}✓${NC} Jaeger exporter configured"
else
    echo -e "${RED}✗${NC} Jaeger exporter not configured"
    exit 1
fi

echo ""
echo -e "${YELLOW}Checking backend instrumentation...${NC}"

# Check Dockerfile for OTel agent
if grep -q "opentelemetry-javaagent.jar" docker/Dockerfile; then
    echo -e "${GREEN}✓${NC} OpenTelemetry Java agent configured in Dockerfile"
else
    echo -e "${RED}✗${NC} OpenTelemetry Java agent not found in Dockerfile"
    exit 1
fi

if grep -q "otel.service.name=observability-backend" docker/Dockerfile; then
    echo -e "${GREEN}✓${NC} Backend service name configured"
else
    echo -e "${RED}✗${NC} Backend service name not configured"
    exit 1
fi

echo ""
echo -e "${YELLOW}Checking frontend instrumentation...${NC}"

# Check package.json for OTel dependencies
if grep -q "@opentelemetry/api" frontend/package.json; then
    echo -e "${GREEN}✓${NC} OpenTelemetry API dependency added"
else
    echo -e "${RED}✗${NC} OpenTelemetry API dependency missing"
    exit 1
fi

if grep -q "@opentelemetry/sdk-trace-web" frontend/package.json; then
    echo -e "${GREEN}✓${NC} OpenTelemetry Web SDK dependency added"
else
    echo -e "${RED}✗${NC} OpenTelemetry Web SDK dependency missing"
    exit 1
fi

# Check tracing service exists
if [ -f "frontend/src/app/services/tracing.service.ts" ]; then
    echo -e "${GREEN}✓${NC} Tracing service created"
    
    if grep -q "observability-frontend" frontend/src/app/services/tracing.service.ts; then
        echo -e "${GREEN}✓${NC} Frontend service name configured"
    else
        echo -e "${RED}✗${NC} Frontend service name not configured"
        exit 1
    fi
else
    echo -e "${RED}✗${NC} Tracing service not found"
    exit 1
fi

# Check main.ts initializes tracing
if grep -q "initializeTracing" frontend/src/main.ts; then
    echo -e "${GREEN}✓${NC} Tracing initialized in main.ts"
else
    echo -e "${RED}✗${NC} Tracing not initialized in main.ts"
    exit 1
fi

echo ""
echo -e "${YELLOW}Checking CORS configuration...${NC}"

# Check WebConfig for trace headers
if grep -q "traceparent" src/main/java/fr/umontpellier/observability/config/WebConfig.java; then
    echo -e "${GREEN}✓${NC} Trace context headers configured in CORS"
else
    echo -e "${RED}✗${NC} Trace context headers not configured in CORS"
    exit 1
fi

echo ""
echo -e "${YELLOW}Checking test resources...${NC}"

# Check test script
if [ -f "Devtools/generate-traces.sh" ]; then
    echo -e "${GREEN}✓${NC} Trace generation script exists"
    if [ -x "Devtools/generate-traces.sh" ]; then
        echo -e "${GREEN}✓${NC} Script is executable"
    else
        echo -e "${YELLOW}⚠${NC} Script is not executable (run: chmod +x Devtools/generate-traces.sh)"
    fi
else
    echo -e "${RED}✗${NC} Trace generation script not found"
    exit 1
fi

# Check test page
if [ -f "frontend/public/trace-test.html" ]; then
    echo -e "${GREEN}✓${NC} Interactive test page exists"
else
    echo -e "${RED}✗${NC} Interactive test page not found"
    exit 1
fi

echo ""
echo -e "${YELLOW}Checking documentation...${NC}"

docs=(
    "OPENTELEMETRY_TRACING.md"
    "QUICKSTART.md"
    "OPENTELEMETRY_SUMMARY.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✓${NC} Documentation: $doc"
    else
        echo -e "${RED}✗${NC} Missing documentation: $doc"
    fi
done

echo ""
echo -e "${YELLOW}Checking if npm dependencies are installed...${NC}"

if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules directory exists"
    
    # Check for specific OTel packages
    if [ -d "frontend/node_modules/@opentelemetry" ]; then
        echo -e "${GREEN}✓${NC} OpenTelemetry packages installed"
    else
        echo -e "${YELLOW}⚠${NC} OpenTelemetry packages not installed (run: cd frontend && npm install)"
    fi
else
    echo -e "${YELLOW}⚠${NC} node_modules not found (run: cd frontend && npm install)"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Configuration verification complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo -e "1. Install frontend dependencies (if not already done):"
echo -e "   ${BLUE}cd frontend && npm install && cd ..${NC}"
echo ""
echo -e "2. Start all services:"
echo -e "   ${BLUE}cd docker && docker compose up --build${NC}"
echo ""
echo -e "3. Wait for services to be healthy (~2-3 minutes)"
echo ""
echo -e "4. Access the services:"
echo -e "   - Frontend:         ${BLUE}http://localhost:4200${NC}"
echo -e "   - Backend API:      ${BLUE}http://localhost:8080${NC}"
echo -e "   - ${GREEN}Jaeger UI:        http://localhost:16686${NC} ⭐"
echo -e "   - Test Page:        ${BLUE}http://localhost:4200/trace-test.html${NC}"
echo ""
echo -e "5. Generate traces:"
echo -e "   ${BLUE}./Devtools/generate-traces.sh${NC}"
echo ""
echo -e "6. View traces in Jaeger:"
echo -e "   ${BLUE}http://localhost:16686${NC}"
echo ""
echo -e "${GREEN}For detailed instructions, see:${NC}"
echo -e "  - ${BLUE}QUICKSTART.md${NC} - Quick start guide"
echo -e "  - ${BLUE}OPENTELEMETRY_TRACING.md${NC} - Complete documentation"
echo -e "  - ${BLUE}OPENTELEMETRY_SUMMARY.md${NC} - Implementation summary"
echo ""
echo -e "${GREEN}🎉 Setup is complete and ready to use!${NC}"
