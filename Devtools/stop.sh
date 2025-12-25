#!/bin/bash

GIT_ROOT=$(git rev-parse --show-toplevel)

pushd $GIT_ROOT/docker

echo "Stopping Observability Application..."
docker-compose down

echo ""
echo "Services stopped successfully!"
echo ""
echo "To remove volumes as well, run: docker-compose down -v"

popd