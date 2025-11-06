# PostgreSQL Database Setup

Comprehensive guide for PostgreSQL database setup, configuration, and management across all environments.

!!! info "Overview"
    This guide covers PostgreSQL setup for the Manager Product Service, including environment-specific configurations, connection management, and troubleshooting.

## Quick Setup Summary

| Environment | Setup Method | Configuration File | Security Level |
|-------------|--------------|-------------------|----------------|
| **Development** | Docker Compose | `.env` | Basic |
| **Staging** | Managed Service | Environment Variables | Enhanced |
| **Production** | Managed Service | Secrets Manager | Maximum |

## Development Environment Setup

### Using Docker Compose (Recommended)

The fastest way to get PostgreSQL running for development:

```yaml
# docker-compose.yml (included in project)
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: manager-product-postgres
    environment:
      POSTGRES_DB: manager_product_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
```

**Start the database:**
```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Verify container is running
docker ps | grep postgres

# Check container logs
docker-compose logs postgres
```

### Local PostgreSQL Installation

If you prefer a local installation:

=== "Ubuntu/Debian"
    ```bash
    # Install PostgreSQL
    sudo apt update
    sudo apt install postgresql postgresql-contrib
    
    # Start PostgreSQL service
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Create database and user
    sudo -u postgres psql
    CREATE DATABASE manager_product_db;
    CREATE USER manager_user WITH PASSWORD 'secure_password';
    GRANT ALL PRIVILEGES ON DATABASE manager_product_db TO manager_user;
    \q
    ```

=== "macOS (Homebrew)"
    ```bash
    # Install PostgreSQL
    brew install postgresql
    
    # Start PostgreSQL service
    brew services start postgresql
    
    # Create database
    createdb manager_product_db
    ```

=== "Windows"
    ```powershell
    # Download and install from postgresql.org
    # Or use Chocolatey
    choco install postgresql
    
    # Start PostgreSQL service
    net start postgresql-x64-15
    ```

## Environment-Specific Configuration

### Development Configuration

**Environment Variables (`.env` file):**
```properties
# Database Connection
DATABASE_PROTOCOL=postgresql
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=manager_product_db
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres123

# Connection Pool Settings
DATABASE_MAX_POOL_SIZE=10
DATABASE_MIN_IDLE=2
DATABASE_CONNECTION_TIMEOUT=30000
DATABASE_IDLE_TIMEOUT=600000
DATABASE_MAX_LIFETIME=1800000

# Development Specific
DATABASE_SHOW_SQL=true
DATABASE_FORMAT_SQL=true
```

**Spring Boot Configuration (`application-dev.yaml`):**
```yaml
spring:
  datasource:
    url: jdbc:${DATABASE_PROTOCOL}://${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
    driver-class-name: org.postgresql.Driver
    
    # HikariCP Connection Pool
    hikari:
      maximum-pool-size: ${DATABASE_MAX_POOL_SIZE:10}
      minimum-idle: ${DATABASE_MIN_IDLE:2}
      connection-timeout: ${DATABASE_CONNECTION_TIMEOUT:30000}
      idle-timeout: ${DATABASE_IDLE_TIMEOUT:600000}
      max-lifetime: ${DATABASE_MAX_LIFETIME:1800000}
      pool-name: ManagerProductHikariCP
      
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: validate
    show-sql: ${DATABASE_SHOW_SQL:false}
    properties:
      hibernate:
        format_sql: ${DATABASE_FORMAT_SQL:false}
        jdbc:
          time_zone: UTC
```

### Staging Configuration

**Environment Variables:**
```bash
# Use managed PostgreSQL service
export DATABASE_HOST=staging-postgres.internal.company.com
export DATABASE_PORT=5432
export DATABASE_NAME=manager_product_staging
export DATABASE_USERNAME=staging_user
export DATABASE_PASSWORD=${STAGING_DB_PASSWORD}  # From secrets

# Enhanced connection pool for staging load
export DATABASE_MAX_POOL_SIZE=20
export DATABASE_MIN_IDLE=5
export DATABASE_CONNECTION_TIMEOUT=20000
```

**Additional Staging Settings:**
```yaml
spring:
  datasource:
    hikari:
      leak-detection-threshold: 60000  # 1 minute
      
  jpa:
    show-sql: false  # Disable SQL logging in staging
    properties:
      hibernate:
        generate_statistics: true
        session:
          events:
            log:
              LOG_QUERIES_SLOWER_THAN_MS: 1000
```

### Production Configuration

**Environment Variables (via Secrets Manager):**
```bash
# Production database cluster
export DATABASE_HOST=prod-postgres-cluster.amazonaws.com
export DATABASE_PORT=5432
export DATABASE_NAME=manager_product_prod
export DATABASE_USERNAME=prod_user
export DATABASE_PASSWORD=${PROD_DB_PASSWORD}  # From AWS Secrets Manager

# Production-optimized connection pool
export DATABASE_MAX_POOL_SIZE=50
export DATABASE_MIN_IDLE=10
export DATABASE_CONNECTION_TIMEOUT=10000
export DATABASE_IDLE_TIMEOUT=300000
export DATABASE_MAX_LIFETIME=900000
```

**Production-Specific Settings:**
```yaml
spring:
  datasource:
    hikari:
      leak-detection-threshold: 30000  # 30 seconds
      register-mbeans: true  # Enable JMX monitoring
      
  jpa:
    show-sql: false
    properties:
      hibernate:
        jdbc:
          batch_size: 25
          fetch_size: 50
        order_inserts: true
        order_updates: true
        batch_versioned_data: true
```

## Connection Management Best Practices

### Connection Pool Configuration

**HikariCP Settings Explained:**

| Setting | Development | Staging | Production | Purpose |
|---------|-------------|---------|------------|---------|
| `maximum-pool-size` | 10 | 20 | 50 | Max concurrent connections |
| `minimum-idle` | 2 | 5 | 10 | Always-ready connections |
| `connection-timeout` | 30s | 20s | 10s | Max wait for connection |
| `idle-timeout` | 10min | 10min | 5min | Idle connection cleanup |
| `max-lifetime` | 30min | 30min | 15min | Connection refresh interval |

### Connection Validation

**Health Check Configuration:**
```yaml
management:
  health:
    db:
      enabled: true
    datasource:
      enabled: true
      
  endpoint:
    health:
      show-details: always
```

**Custom Health Indicator:**
```kotlin
@Component
class DatabaseHealthIndicator(
    private val dataSource: DataSource
) : HealthIndicator {
    
    override fun health(): Health {
        return try {
            dataSource.connection.use { connection ->
                val valid = connection.isValid(5) // 5 second timeout
                if (valid) {
                    Health.up()
                        .withDetail("database", "PostgreSQL")
                        .withDetail("status", "Connected")
                        .build()
                } else {
                    Health.down()
                        .withDetail("error", "Connection validation failed")
                        .build()
                }
            }
        } catch (e: Exception) {
            Health.down(e)
                .withDetail("error", e.message)
                .build()
        }
    }
}
```

## Enhanced Connection Troubleshooting

### Diagnostic Commands

#### 1. Basic Connectivity Test
```bash
# Test if PostgreSQL is accepting connections
pg_isready -h localhost -p 5432 -U postgres

# Expected output: localhost:5432 - accepting connections
```

#### 2. Connection Details Verification
```bash
# Connect to database and check connection info
psql -h localhost -p 5432 -U postgres -d manager_product_db -c "
SELECT 
    current_database() as database,
    current_user as user,
    inet_server_addr() as server_ip,
    inet_server_port() as server_port,
    version() as postgresql_version;
"
```

#### 3. Active Connections Monitoring
```sql
-- Check current connections
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    state_change
FROM pg_stat_activity 
WHERE datname = 'manager_product_db';
```

#### 4. Connection Pool Status (Application)
```bash
# Check HikariCP metrics via JMX or Actuator
curl http://localhost:8080/actuator/metrics/hikaricp.connections.active
curl http://localhost:8080/actuator/metrics/hikaricp.connections.idle
curl http://localhost:8080/actuator/metrics/hikaricp.connections.pending
```

### Common Connection Issues and Solutions

#### Issue 1: Connection Refused
**Symptoms:**
```
org.postgresql.util.PSQLException: Connection to localhost:5432 refused
```

**Diagnosis Steps:**
```bash
# 1. Check if PostgreSQL is running
docker ps | grep postgres
# OR for local installation
sudo systemctl status postgresql

# 2. Check if port is open
netstat -an | grep 5432
# OR
ss -tuln | grep 5432

# 3. Test network connectivity
telnet localhost 5432
```

**Solutions:**
```bash
# Start PostgreSQL container
docker-compose up -d postgres

# OR start local PostgreSQL service
sudo systemctl start postgresql

# Check firewall settings (if applicable)
sudo ufw status
```

#### Issue 2: Authentication Failed
**Symptoms:**
```
org.postgresql.util.PSQLException: FATAL: password authentication failed for user "postgres"
```

**Diagnosis:**
```bash
# Check environment variables
echo $DATABASE_USERNAME
echo $DATABASE_PASSWORD

# Verify credentials manually
psql -h localhost -p 5432 -U postgres -W
```

**Solutions:**
```bash
# Reset PostgreSQL password (Docker)
docker exec -it postgres-container psql -U postgres -c "ALTER USER postgres PASSWORD 'new_password';"

# Update .env file with correct credentials
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=new_password
```

#### Issue 3: Too Many Connections
**Symptoms:**
```
org.postgresql.util.PSQLException: FATAL: too many connections for role "postgres"
```

**Diagnosis:**
```sql
-- Check current connection count
SELECT count(*) FROM pg_stat_activity;

-- Check connection limit
SELECT setting FROM pg_settings WHERE name = 'max_connections';

-- Check connections by database
SELECT datname, count(*) 
FROM pg_stat_activity 
GROUP BY datname;
```

**Solutions:**
```yaml
# Reduce connection pool size
spring:
  datasource:
    hikari:
      maximum-pool-size: 5  # Reduce from default
      minimum-idle: 1
```

#### Issue 4: Connection Pool Exhaustion
**Symptoms:**
```
HikariPool-1 - Connection is not available, request timed out after 30000ms
```

**Diagnosis:**
```bash
# Check pool metrics
curl http://localhost:8080/actuator/metrics/hikaricp.connections

# Check for connection leaks in logs
grep -i "leak" application.log
```

**Solutions:**
```yaml
# Enable leak detection
spring:
  datasource:
    hikari:
      leak-detection-threshold: 60000  # 1 minute
      maximum-pool-size: 15  # Increase pool size
```

#### Issue 5: Slow Query Performance
**Symptoms:**
- Application timeouts
- High database CPU usage
- Slow response times

**Diagnosis:**
```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s
SELECT pg_reload_conf();

-- Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

**Solutions:**
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_products_category_id ON products(category_id);

-- Analyze table statistics
ANALYZE products;

-- Update query planner statistics
VACUUM ANALYZE;
```

### Monitoring and Alerting

#### Database Metrics to Monitor

```yaml
# Actuator metrics configuration
management:
  metrics:
    export:
      prometheus:
        enabled: true
    tags:
      application: manager-product-service
      environment: ${SPRING_PROFILES_ACTIVE:dev}
```

**Key Metrics:**
- `hikaricp.connections.active` - Active connections
- `hikaricp.connections.idle` - Idle connections  
- `hikaricp.connections.pending` - Pending connection requests
- `hikaricp.connections.timeout` - Connection timeouts
- `jdbc.connections.active` - JDBC connection count

#### Health Check Endpoints

```bash
# Application health (includes database)
curl http://localhost:8080/actuator/health

# Database-specific health
curl http://localhost:8080/actuator/health/db

# Detailed health information
curl http://localhost:8080/actuator/health/datasource
```

## Security Best Practices

### Connection Security

1. **Use SSL/TLS in Production:**
```yaml
spring:
  datasource:
    url: jdbc:postgresql://prod-host:5432/db?sslmode=require&sslcert=client-cert.pem&sslkey=client-key.pem&sslrootcert=ca-cert.pem
```

2. **Restrict Database Access:**
```sql
-- Create application-specific user
CREATE USER manager_app WITH PASSWORD 'secure_random_password';

-- Grant minimal required permissions
GRANT CONNECT ON DATABASE manager_product_db TO manager_app;
GRANT USAGE ON SCHEMA public TO manager_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO manager_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO manager_app;
```

3. **Use Connection Encryption:**
```properties
# Force SSL connection
DATABASE_URL=jdbc:postgresql://host:5432/db?sslmode=require
```

### Secrets Management

**Development:**
```bash
# Use .env file (never commit)
DATABASE_PASSWORD=dev_password_123
```

**Production:**
```bash
# Use AWS Secrets Manager, Azure Key Vault, etc.
DATABASE_PASSWORD=$(aws secretsmanager get-secret-value --secret-id prod/db/password --query SecretString --output text)
```

## Performance Optimization

### Database Configuration

```sql
-- PostgreSQL configuration for application workload
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
SELECT pg_reload_conf();
```

### Application-Level Optimizations

```yaml
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 25        # Batch INSERT/UPDATE operations
          fetch_size: 50        # JDBC fetch size
        order_inserts: true     # Order INSERT statements
        order_updates: true     # Order UPDATE statements
        batch_versioned_data: true  # Batch versioned entities
```

This comprehensive PostgreSQL setup guide provides everything needed to configure, troubleshoot, and optimize database connections across all environments.