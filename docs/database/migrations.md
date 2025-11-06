# Database Migrations with Flyway

Comprehensive guide for managing database schema changes using Flyway migration tool.

!!! info "Migration Overview"
    Flyway provides version control for your database schema, allowing you to migrate it reliably and easily from any version to the latest.

## Flyway Configuration

### Spring Boot Integration

The Manager Product Service uses Flyway integrated with Spring Boot for automatic migration management.

**Configuration (`application.yaml`):**
```yaml
spring:
  flyway:
    enabled: true
    baseline-on-migrate: true
    baseline-version: 0
    baseline-description: "Initial baseline"
    locations: classpath:db/migration
    sql-migration-prefix: V
    sql-migration-separator: __
    sql-migration-suffixes: .sql
    validate-on-migrate: true
    clean-disabled: true  # Prevent accidental data loss
```

### Environment-Specific Settings

=== "Development"
    ```yaml
    spring:
      flyway:
        clean-disabled: false  # Allow clean in dev
        validate-on-migrate: true
        out-of-order: false
    ```

=== "Staging"
    ```yaml
    spring:
      flyway:
        clean-disabled: true   # Prevent data loss
        validate-on-migrate: true
        out-of-order: false
        baseline-on-migrate: true
    ```

=== "Production"
    ```yaml
    spring:
      flyway:
        clean-disabled: true   # Critical: prevent data loss
        validate-on-migrate: true
        out-of-order: false
        baseline-on-migrate: false  # Strict migration order
    ```

## Migration File Structure

### Directory Layout
```
src/main/resources/db/migration/
├── V1__create_initial_schema.sql
├── V2__add_products_table.sql
├── V3__add_categories_table.sql
├── V4__add_product_category_relationship.sql
├── V5__add_indexes_for_performance.sql
└── V6__add_audit_columns.sql
```

### Naming Convention

**Pattern:** `V{version}__{description}.sql`

| Component | Rules | Examples |
|-----------|-------|----------|
| **V** | Version prefix (required) | `V` |
| **{version}** | Numeric version (sequential) | `1`, `2`, `3.1`, `4.2.1` |
| **__** | Double underscore separator | `__` |
| **{description}** | Descriptive name (snake_case) | `create_products_table` |
| **.sql** | File extension | `.sql` |

**Valid Examples:**
- ✅ `V1__create_initial_schema.sql`
- ✅ `V2__add_products_table.sql`
- ✅ `V3.1__add_product_name_index.sql`
- ✅ `V4__update_category_constraints.sql`

**Invalid Examples:**
- ❌ `v1__create_schema.sql` (lowercase v)
- ❌ `V1_create_schema.sql` (single underscore)
- ❌ `V1__Create Schema.sql` (spaces in description)
- ❌ `create_schema.sql` (missing version)

## Migration Best Practices

### 1. Migration Content Guidelines

**DO:**
```sql
-- V1__create_products_table.sql
-- Create products table with proper constraints and indexes

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    category_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_products_category 
        FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Add indexes for performance
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_name ON products(name);

-- Add comments for documentation
COMMENT ON TABLE products IS 'Product catalog for the barbershop services';
COMMENT ON COLUMN products.price IS 'Product price in local currency';
```

**DON'T:**
```sql
-- ❌ Bad migration example
DROP TABLE IF EXISTS products; -- Dangerous in production
ALTER TABLE products DROP COLUMN important_data; -- Data loss
CREATE OR REPLACE FUNCTION... -- Non-deterministic
```

### 2. Safe Migration Patterns

#### Adding Columns (Safe)
```sql
-- V5__add_product_sku.sql
ALTER TABLE products 
ADD COLUMN sku VARCHAR(50);

-- Add index after column creation
CREATE INDEX idx_products_sku ON products(sku);

-- Update existing records with default values if needed
UPDATE products 
SET sku = 'SKU-' || id::text 
WHERE sku IS NULL;
```

#### Removing Columns (Multi-step)
```sql
-- V6__deprecate_old_column.sql
-- Step 1: Mark column as deprecated (add comment)
COMMENT ON COLUMN products.old_column IS 'DEPRECATED: Will be removed in V7';

-- V7__remove_old_column.sql  
-- Step 2: Remove the column (separate migration)
ALTER TABLE products DROP COLUMN old_column;
```

#### Renaming Columns (Safe Pattern)
```sql
-- V8__rename_product_description.sql
-- Step 1: Add new column
ALTER TABLE products ADD COLUMN product_description TEXT;

-- Step 2: Copy data
UPDATE products SET product_description = description;

-- Step 3: Drop old column (in next migration)
-- ALTER TABLE products DROP COLUMN description; -- V9
```

#### Data Migrations
```sql
-- V9__migrate_category_data.sql
-- Migrate data with proper error handling

DO $$
DECLARE
    rec RECORD;
    error_count INTEGER := 0;
BEGIN
    -- Migrate category data
    FOR rec IN SELECT id, old_category_name FROM products WHERE category_id IS NULL
    LOOP
        BEGIN
            UPDATE products 
            SET category_id = (
                SELECT id FROM categories 
                WHERE name = rec.old_category_name
            )
            WHERE id = rec.id;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE NOTICE 'Failed to migrate product ID %: %', rec.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Migration completed. Errors: %', error_count;
END $$;
```

### 3. Performance Considerations

#### Large Table Modifications
```sql
-- V10__add_index_concurrently.sql
-- Use CONCURRENT for large tables to avoid locks
CREATE INDEX CONCURRENTLY idx_products_created_at ON products(created_at);

-- For large data updates, use batching
DO $$
DECLARE
    batch_size INTEGER := 1000;
    total_updated INTEGER := 0;
BEGIN
    LOOP
        UPDATE products 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id IN (
            SELECT id FROM products 
            WHERE updated_at IS NULL 
            LIMIT batch_size
        );
        
        GET DIAGNOSTICS total_updated = ROW_COUNT;
        EXIT WHEN total_updated = 0;
        
        RAISE NOTICE 'Updated % rows', total_updated;
        COMMIT; -- Commit each batch
    END LOOP;
END $$;
```

## Migration Management

### Running Migrations

#### Automatic (Default)
Migrations run automatically when the application starts:

```bash
# Start application - migrations run automatically
./gradlew bootRun

# Check logs for migration status
tail -f logs/application.log | grep -i flyway
```

#### Manual Execution
```bash
# Run migrations manually using Gradle
./gradlew flywayMigrate

# Get migration info
./gradlew flywayInfo

# Validate migrations
./gradlew flywayValidate
```

#### Using Flyway CLI
```bash
# Install Flyway CLI
curl -fsSL https://flywaydb.org/download/thankyou?dl=https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/9.22.3/flyway-commandline-9.22.3-linux-x64.tar.gz | tar xz

# Configure flyway.conf
flyway.url=jdbc:postgresql://localhost:5432/manager_product_db
flyway.user=postgres
flyway.password=postgres123
flyway.locations=filesystem:src/main/resources/db/migration

# Run migrations
./flyway migrate
./flyway info
```

### Migration Status Monitoring

#### Check Migration History
```sql
-- Query Flyway schema history
SELECT 
    installed_rank,
    version,
    description,
    type,
    script,
    installed_on,
    execution_time,
    success
FROM flyway_schema_history
ORDER BY installed_rank;
```

#### Application Health Check
```bash
# Check if migrations completed successfully
curl http://localhost:8080/actuator/health/flyway

# Expected response:
{
  "status": "UP",
  "details": {
    "flywayBeans": {
      "status": "UP",
      "details": {
        "flyway": {
          "status": "UP"
        }
      }
    }
  }
}
```

## Version Control Strategies

### Git Integration

#### Branch-Based Development
```bash
# Create feature branch for database changes
git checkout -b feature/add-product-reviews

# Create migration file
touch src/main/resources/db/migration/V15__add_product_reviews_table.sql

# Commit migration with descriptive message
git add .
git commit -m "feat: add product reviews table migration (V15)"

# Push and create PR
git push origin feature/add-product-reviews
```

#### Migration Conflicts Resolution
```bash
# If migration version conflicts occur during merge
# 1. Check existing migrations
ls src/main/resources/db/migration/

# 2. Rename conflicting migration to next available version
mv V15__add_reviews.sql V16__add_reviews.sql

# 3. Update migration content if needed
# 4. Test migration on clean database
docker-compose down -v
docker-compose up -d
./gradlew bootRun
```

### Semantic Versioning for Migrations

| Version Pattern | Use Case | Example |
|----------------|----------|---------|
| **Major (V1, V2, V3)** | Major schema changes | `V2__restructure_product_schema.sql` |
| **Minor (V1.1, V1.2)** | New features | `V1.1__add_product_categories.sql` |
| **Patch (V1.1.1)** | Bug fixes, indexes | `V1.1.1__fix_product_name_constraint.sql` |

## Rollback Procedures

### Understanding Flyway Rollbacks

!!! warning "Important"
    Flyway Community Edition doesn't support automatic rollbacks. Rollbacks must be handled manually through new migrations.

### Safe Rollback Strategies

#### 1. Additive Changes (No Rollback Needed)
```sql
-- V10__add_optional_column.sql
-- Adding nullable columns is safe - no rollback needed
ALTER TABLE products ADD COLUMN optional_field VARCHAR(100);
```

#### 2. Reversible Changes
```sql
-- V11__add_product_status.sql
-- Forward migration
ALTER TABLE products ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- V12__rollback_product_status.sql (if needed)
-- Rollback migration
ALTER TABLE products DROP COLUMN status;
```

#### 3. Data Migration Rollbacks
```sql
-- V13__migrate_price_format.sql
-- Forward: Convert prices from cents to dollars
UPDATE products SET price = price / 100;

-- V14__rollback_price_format.sql (if needed)  
-- Rollback: Convert prices back to cents
UPDATE products SET price = price * 100;
```

### Emergency Rollback Procedures

#### 1. Application-Level Rollback
```bash
# Stop current application
./gradlew --stop

# Deploy previous version
git checkout previous-stable-tag
./gradlew bootRun
```

#### 2. Database-Level Rollback
```sql
-- Create emergency rollback migration
-- V99__emergency_rollback_v15.sql

-- Reverse the problematic changes from V15
DROP INDEX IF EXISTS idx_problematic_index;
ALTER TABLE products DROP COLUMN IF EXISTS problematic_column;

-- Restore previous state if needed
-- (Include specific rollback logic here)
```

#### 3. Point-in-Time Recovery (Production)
```bash
# Using PostgreSQL PITR (Point-in-Time Recovery)
# 1. Stop application
# 2. Restore database from backup to point before migration
pg_restore --clean --if-exists -d manager_product_db backup_before_migration.dump

# 3. Update Flyway schema history to reflect rollback
DELETE FROM flyway_schema_history WHERE version >= '15';
```

## Troubleshooting Common Issues

### Migration Checksum Mismatch
**Problem:**
```
Migration checksum mismatch for migration version 5
-> Applied to database : 1234567890
-> Resolved locally    : 0987654321
```

**Solution:**
```bash
# Option 1: Repair the schema history (if you're sure the change is safe)
./gradlew flywayRepair

# Option 2: Create a new migration to fix the issue
# Never modify existing migrations that have been applied!
```

### Out of Order Migration
**Problem:**
```
Detected resolved migration not applied to database: 3.1
```

**Solution:**
```yaml
# Allow out-of-order migrations (use carefully)
spring:
  flyway:
    out-of-order: true
```

### Failed Migration
**Problem:**
```
Migration V5__add_constraints.sql failed
SQL State  : 23505
Error Code : 0
Message    : duplicate key value violates unique constraint
```

**Solution:**
```sql
-- V6__fix_failed_migration.sql
-- Fix the data issue that caused the constraint violation
DELETE FROM products 
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY sku ORDER BY id) as rn
        FROM products 
        WHERE sku IS NOT NULL
    ) t WHERE rn > 1
);

-- Now the constraint can be added safely
ALTER TABLE products ADD CONSTRAINT uk_products_sku UNIQUE (sku);
```

### Baseline Issues
**Problem:**
```
Found non-empty schema(s) "public" but no schema history table. Use baseline() or set baselineOnMigrate to true.
```

**Solution:**
```yaml
spring:
  flyway:
    baseline-on-migrate: true
    baseline-version: 0
    baseline-description: "Existing schema baseline"
```

## Testing Migrations

### Local Testing
```bash
# 1. Test on clean database
docker-compose down -v
docker-compose up -d postgres

# 2. Run migrations
./gradlew bootRun

# 3. Verify schema
psql -h localhost -U postgres -d manager_product_db -c "\dt"

# 4. Test rollback scenario (if applicable)
# Create and test rollback migration
```

### Automated Testing
```kotlin
@SpringBootTest
@Testcontainers
class MigrationTest {
    
    @Container
    val postgres = PostgreSQLContainer("postgres:15-alpine")
        .withDatabaseName("test_db")
        .withUsername("test")
        .withPassword("test")
    
    @Test
    fun `should apply all migrations successfully`() {
        // Test that all migrations can be applied to empty database
        val flyway = Flyway.configure()
            .dataSource(postgres.jdbcUrl, postgres.username, postgres.password)
            .locations("classpath:db/migration")
            .load()
            
        val result = flyway.migrate()
        assertThat(result.migrationsExecuted).isGreaterThan(0)
    }
    
    @Test
    fun `should validate migration checksums`() {
        // Validate that migration files haven't been modified
        val flyway = Flyway.configure()
            .dataSource(postgres.jdbcUrl, postgres.username, postgres.password)
            .locations("classpath:db/migration")
            .load()
            
        assertDoesNotThrow { flyway.validate() }
    }
}
```

This comprehensive migration guide ensures safe, reliable database schema evolution across all environments.