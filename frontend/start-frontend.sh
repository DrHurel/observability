#!/bin/bash

# Frontend Quick Start Script
# This script installs dependencies and starts the Angular development server

echo "=========================================="
echo "Frontend Quick Start"
echo "=========================================="
echo ""

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please run this script from the frontend directory."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

echo "Starting Angular development server..."
echo "The application will be available at: http://localhost:4200"
echo ""
echo "Make sure the backend is running on http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
