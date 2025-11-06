#!/bin/bash

echo "🔍 Environment Validation Script"
echo "================================"

# Check required environment variables
required_vars=("DATABASE_HOST" "DATABASE_PORT" "DATABASE_NAME" "DATABASE_USERNAME" "DATABASE_PASSWORD")

echo "📋 Checking Environment Variables..."
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ $var is not set"
        exit 1
    else
        echo "✅ $var is set"
    fi
done

# Check database connectivity
echo ""
echo "🔌 Testing Database Connectivity..."
if pg_isready -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USERNAME" > /dev/null 2>&1; then
    echo "✅ Database is accessible"
else
    echo "❌ Database is not accessible"
    exit 1
fi

# Check application port availability
echo ""
echo "🚪 Checking Port Availability..."
if ! netstat -tuln | grep -q ":8080 "; then
    echo "✅ Port 8080 is available"
else
    echo "❌ Port 8080 is already in use"
    exit 1
fi

# Check Docker daemon
echo ""
echo "🐳 Checking Docker Status..."
if docker info > /dev/null 2>&1; then
    echo "✅ Docker daemon is running"
else
    echo "❌ Docker daemon is not running"
    exit 1
fi

echo ""
echo "🎉 All validation checks passed!"