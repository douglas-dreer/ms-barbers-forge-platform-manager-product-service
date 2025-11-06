#!/bin/bash

echo "🗄️ Database Migration Validation"
echo "================================"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if database exists
echo "📋 Checking Database Existence..."
if docker-compose exec -T postgres-db psql -U "$DATABASE_USERNAME" -lqt | cut -d \| -f 1 | grep -qw "$DATABASE_NAME"; then
    echo "✅ Database '$DATABASE_NAME' exists"
else
    echo "❌ Database '$DATABASE_NAME' does not exist"
    exit 1
fi

# Check migration status
echo ""
echo "🔄 Checking Migration Status..."
migration_count=$(docker-compose exec -T postgres-db psql -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" -t -c "SELECT COUNT(*) FROM flyway_schema_history;" 2>/dev/null | tr -d ' ')

if [ "$migration_count" -gt 0 ]; then
    echo "✅ Migrations have been applied ($migration_count migrations)"
    
    # Show latest migration
    latest_migration=$(docker-compose exec -T postgres-db psql -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" -t -c "SELECT version, description FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 1;" 2>/dev/null)
    echo "📄 Latest migration: $latest_migration"
else
    echo "⚠️ No migrations found - database may be empty"
fi

# Check table existence (add your actual table names here)
echo ""
echo "📊 Checking Core Tables..."
tables=("products" "categories")  # Update with your actual table names

for table in "${tables[@]}"; do
    if docker-compose exec -T postgres-db psql -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" -t -c "\dt $table" 2>/dev/null | grep -q "$table"; then
        echo "✅ Table '$table' exists"
    else
        echo "❌ Table '$table' does not exist"
    fi
done

echo ""
echo "🎉 Database validation completed!"