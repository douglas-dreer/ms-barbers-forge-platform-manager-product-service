#!/bin/bash

echo "🧪 Pre-deployment Test Suite"
echo "============================"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Build and test application
echo "🔨 Building Application..."
if ./gradlew clean build; then
    echo "✅ Application build successful"
else
    echo "❌ Application build failed"
    exit 1
fi

# Run unit tests
echo ""
echo "🧪 Running Unit Tests..."
if ./gradlew test; then
    echo "✅ Unit tests passed"
else
    echo "❌ Unit tests failed"
    exit 1
fi

# Start services for integration testing
echo ""
echo "🚀 Starting Services for Integration Tests..."
docker-compose up -d postgres-db

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
timeout=60
while ! pg_isready -h localhost -p 5432 -U postgres > /dev/null 2>&1; do
    sleep 2
    timeout=$((timeout - 2))
    if [ $timeout -le 0 ]; then
        echo "❌ Database failed to start within timeout"
        exit 1
    fi
done
echo "✅ Database is ready"

# Test application startup
echo ""
echo "🚀 Testing Application Startup..."
docker-compose up -d manager-product-service

# Wait for application to be ready
echo "⏳ Waiting for application to start..."
timeout=120
while ! curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; do
    sleep 5
    timeout=$((timeout - 5))
    if [ $timeout -le 0 ]; then
        echo "❌ Application failed to start within timeout"
        docker-compose logs manager-product-service
        docker-compose down
        exit 1
    fi
done

# Verify health endpoints
echo ""
echo "🏥 Verifying Health Endpoints..."
health_status=$(curl -s http://localhost:8080/actuator/health | jq -r '.status')
if [ "$health_status" = "UP" ]; then
    echo "✅ Application health check passed"
else
    echo "❌ Application health check failed: $health_status"
    docker-compose down
    exit 1
fi

# Clean up
docker-compose down

echo ""
echo "🎉 All pre-deployment tests passed!"