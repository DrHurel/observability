#!/bin/bash

echo "Stopping Observability Application..."
docker-compose down

echo ""
echo "Services stopped successfully!"
echo ""
echo "To remove volumes as well, run: docker-compose down -v"
