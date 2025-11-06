# Troubleshooting & FAQ

Comprehensive troubleshooting guide for common issues and their solutions.

## 🔧 Common Issues

### Database Connection Issues

#### Problem: Connection Refused Error
**Symptoms:**
- Application fails to start with database connection errors
- Error message: `Connection refused to localhost:5432`
- Spring Boot startup logs show connection timeout

**Diagnosis:**
1. Check if PostgreSQL container is running:
   ```bash
   docker ps | grep postgres
   ```
   **Expected output:** Container should be listed with status "Up"

2. Verify port availability:
   ```bash
   netstat -an | grep 5432
   ```
   **Expected output:** `0.0.0.0:5432` should be listed

3. Test database connectivity:
   ```bash
   pg_isready -h localhost -p 5432 -U postgres
   ```
   **Expected output:** `localhost:5432 - accepting connections`

**Solution:**
1. Start PostgreSQL container:
   ```bash
   docker-compose up -d postgres-db
   ```

2. Wait for health check to pass:
   ```bash
   docker-compose logs postgres-db
   ```

3. Verify connection with application credentials:
   ```bash
   docker exec -it bff-manager-product-postgresql psql -U postgres -d manager_product_db -c "SELECT 1;"
   ```

**Validation Steps:**
- ✅ Container is running and healthy
- ✅ Port 5432 is accessible
- ✅ Database accepts connections
- ✅ Application can connect successfully

**Prevention:**
- Add health checks to docker-compose.yml
- Implement connection retry logic in application
- Monitor database container resource usage

---

#### Problem: Database Authentication Failed
**Symptoms:**
- Application starts but fails during database operations
- Error message: `FATAL: password authentication failed for user "postgres"`
- Connection established but authentication rejected

**Diagnosis:**
1. Check environment variables:
   ```bash
   docker-compose config | grep -A 5 -B 5 POSTGRES
   ```

2. Verify .env file configuration:
   ```bash
   cat .env | grep DATABASE
   ```

3. Test credentials manually:
   ```bash
   docker exec -it bff-manager-product-postgresql psql -U ${DATABASE_USERNAME} -d ${DATABASE_NAME}
   ```

**Solution:**
1. Update .env file with correct credentials:
   ```properties
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=your_secure_password
   DATABASE_NAME=manager_product_db
   ```

2. Recreate containers with new environment:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

3. Verify new credentials:
   ```bash
   docker-compose exec postgres-db psql -U postgres -d manager_product_db -c "\l"
   ```

**Validation Steps:**
- ✅ Environment variables are correctly set
- ✅ Database user exists with proper permissions
- ✅ Application connects without authentication errors

---

### Application Startup Issues

#### Problem: Port Already in Use
**Symptoms:**
- Application fails to start
- Error message: `Port 8080 was already in use`
- Cannot bind to application port

**Diagnosis:**
1. Check what's using the port:
   ```bash
   # Windows
   netstat -ano | findstr :8080
   
   # Linux/macOS
   lsof -i :8080
   ```

2. Identify the process:
   ```bash
   # Windows (use PID from netstat)
   tasklist | findstr <PID>
   
   # Linux/macOS
   ps aux | grep <PID>
   ```

**Solution:**
1. Stop the conflicting process:
   ```bash
   # Windows
   taskkill /PID <PID> /F
   
   # Linux/macOS
   kill -9 <PID>
   ```

2. Or change application port in docker-compose.yml:
   ```yaml
   manager-product-service:
     ports:
       - "8081:8080"  # Use different external port
   ```

3. Restart the application:
   ```bash
   docker-compose up -d manager-product-service
   ```

**Validation Steps:**
- ✅ Port is available for binding
- ✅ Application starts successfully
- ✅ Health check endpoint responds

---

#### Problem: Out of Memory Errors
**Symptoms:**
- Application crashes unexpectedly
- Error message: `java.lang.OutOfMemoryError: Java heap space`
- Container restarts frequently

**Diagnosis:**
1. Check container memory usage:
   ```bash
   docker stats manager-product-service
   ```

2. Review application logs:
   ```bash
   docker-compose logs manager-product-service | grep -i "memory\|heap\|gc"
   ```

3. Check JVM memory settings:
   ```bash
   docker-compose exec manager-product-service java -XX:+PrintFlagsFinal -version | grep HeapSize
   ```

**Solution:**
1. Increase container memory limits in docker-compose.yml:
   ```yaml
   manager-product-service:
     deploy:
       resources:
         limits:
           memory: 1G
         reservations:
           memory: 512M
   ```

2. Configure JVM heap size:
   ```yaml
   manager-product-service:
     environment:
       JAVA_OPTS: "-Xmx768m -Xms256m"
   ```

3. Restart with new configuration:
   ```bash
   docker-compose up -d manager-product-service
   ```

**Validation Steps:**
- ✅ Container memory usage is within limits
- ✅ No OutOfMemoryError in logs
- ✅ Application performance is stable

---

### Docker and Container Issues

#### Problem: Container Build Failures
**Symptoms:**
- Docker build process fails
- Error message: `failed to solve with frontend dockerfile.v0`
- Cannot create application image

**Diagnosis:**
1. Check Dockerfile syntax:
   ```bash
   docker build --no-cache -t test-build .
   ```

2. Verify base image availability:
   ```bash
   docker pull openjdk:21-jdk-slim
   ```

3. Check build context size:
   ```bash
   du -sh .
   ```

**Solution:**
1. Clean Docker build cache:
   ```bash
   docker builder prune -f
   ```

2. Update .dockerignore to exclude unnecessary files:
   ```
   .git
   .gradle
   build/
   *.md
   .env*
   ```

3. Rebuild with verbose output:
   ```bash
   docker-compose build --no-cache --progress=plain
   ```

**Validation Steps:**
- ✅ Docker image builds successfully
- ✅ Image size is reasonable
- ✅ Container starts without errors

---

#### Problem: Volume Mount Issues
**Symptoms:**
- Data is not persisted between container restarts
- Error message: `permission denied` when accessing volumes
- Database data is lost after container recreation

**Diagnosis:**
1. Check volume configuration:
   ```bash
   docker-compose config | grep -A 10 volumes
   ```

2. Inspect volume details:
   ```bash
   docker volume ls
   docker volume inspect <volume_name>
   ```

3. Check file permissions:
   ```bash
   docker-compose exec postgres-db ls -la /var/lib/postgresql/data
   ```

**Solution:**
1. Ensure proper volume declaration in docker-compose.yml:
   ```yaml
   volumes:
     postgres-data:
       driver: local
   ```

2. Fix permission issues:
   ```bash
   docker-compose exec postgres-db chown -R postgres:postgres /var/lib/postgresql/data
   ```

3. Recreate volumes if corrupted:
   ```bash
   docker-compose down -v
   docker volume rm $(docker volume ls -q)
   docker-compose up -d
   ```

**Validation Steps:**
- ✅ Volumes are properly mounted
- ✅ Data persists after container restart
- ✅ No permission errors in logs
## 📋 Error 
Message Reference

### Database Errors

#### Error Code: DB-001
**Error Message:** `Connection refused to localhost:5432`
**Severity:** Critical
**Category:** Database Connectivity

**Description:** PostgreSQL database is not accessible on the specified host and port.

**Immediate Actions:**
1. Verify PostgreSQL container is running
2. Check network connectivity
3. Confirm port configuration

**Resolution:**
```bash
# Start PostgreSQL container
docker-compose up -d postgres-db

# Verify container health
docker-compose ps postgres-db
```

**Prevention Strategies:**
- Implement health checks in docker-compose.yml
- Add connection retry logic with exponential backoff
- Monitor database container resource usage
- Set up alerting for database connectivity issues

---

#### Error Code: DB-002
**Error Message:** `FATAL: password authentication failed for user "postgres"`
**Severity:** Critical
**Category:** Database Authentication

**Description:** Database credentials are incorrect or user doesn't exist.

**Immediate Actions:**
1. Verify environment variables
2. Check database user permissions
3. Confirm password accuracy

**Resolution:**
```bash
# Check current environment variables
docker-compose config | grep POSTGRES

# Reset database with correct credentials
docker-compose down -v
docker-compose up -d
```

**Prevention Strategies:**
- Use environment variable validation
- Implement secure credential management
- Regular credential rotation procedures
- Document credential requirements clearly

---

#### Error Code: DB-003
**Error Message:** `org.postgresql.util.PSQLException: Connection to localhost:5432 refused`
**Severity:** High
**Category:** Database Connectivity

**Description:** Application cannot establish connection to PostgreSQL database.

**Immediate Actions:**
1. Check database container status
2. Verify network configuration
3. Test manual connection

**Resolution:**
```bash
# Check container logs
docker-compose logs postgres-db

# Test connection manually
pg_isready -h localhost -p 5432 -U postgres
```

**Prevention Strategies:**
- Implement connection pooling
- Add circuit breaker pattern
- Monitor connection metrics
- Set up database failover mechanisms

---

### Application Errors

#### Error Code: APP-001
**Error Message:** `Port 8080 was already in use`
**Severity:** Medium
**Category:** Application Startup

**Description:** Another process is using the required application port.

**Immediate Actions:**
1. Identify process using the port
2. Stop conflicting process or change port
3. Restart application

**Resolution:**
```bash
# Find process using port 8080
netstat -ano | findstr :8080  # Windows
lsof -i :8080                 # Linux/macOS

# Kill process or change port in docker-compose.yml
```

**Prevention Strategies:**
- Use dynamic port allocation
- Implement port conflict detection
- Document port usage requirements
- Use container orchestration for port management

---

#### Error Code: APP-002
**Error Message:** `java.lang.OutOfMemoryError: Java heap space`
**Severity:** Critical
**Category:** Memory Management

**Description:** Application has exhausted available heap memory.

**Immediate Actions:**
1. Increase JVM heap size
2. Analyze memory usage patterns
3. Check for memory leaks

**Resolution:**
```bash
# Increase heap size in docker-compose.yml
environment:
  JAVA_OPTS: "-Xmx1024m -Xms512m"

# Monitor memory usage
docker stats manager-product-service
```

**Prevention Strategies:**
- Implement memory monitoring
- Regular memory profiling
- Optimize data structures and algorithms
- Set appropriate JVM memory limits

---

#### Error Code: APP-003
**Error Message:** `Failed to configure a DataSource: 'url' attribute is not specified`
**Severity:** Critical
**Category:** Configuration

**Description:** Database URL configuration is missing or invalid.

**Immediate Actions:**
1. Check environment variables
2. Verify .env file configuration
3. Confirm docker-compose.yml settings

**Resolution:**
```bash
# Verify environment configuration
cat .env | grep DATABASE_

# Check docker-compose configuration
docker-compose config | grep SPRING_DATASOURCE
```

**Prevention Strategies:**
- Use configuration validation
- Implement environment-specific configs
- Add startup configuration checks
- Document all required environment variables

---

### Docker and Container Errors

#### Error Code: DOC-001
**Error Message:** `failed to solve with frontend dockerfile.v0`
**Severity:** Medium
**Category:** Container Build

**Description:** Docker build process failed due to Dockerfile issues.

**Immediate Actions:**
1. Check Dockerfile syntax
2. Verify base image availability
3. Clean build cache

**Resolution:**
```bash
# Clean build cache
docker builder prune -f

# Rebuild with no cache
docker-compose build --no-cache
```

**Prevention Strategies:**
- Use multi-stage builds
- Optimize Dockerfile layers
- Pin base image versions
- Regular base image updates

---

#### Error Code: DOC-002
**Error Message:** `Error response from daemon: driver failed programming external connectivity`
**Severity:** Medium
**Category:** Network Configuration

**Description:** Docker cannot bind container ports to host ports.

**Immediate Actions:**
1. Check port availability
2. Stop conflicting services
3. Restart Docker daemon

**Resolution:**
```bash
# Check port usage
netstat -tulpn | grep :8080

# Restart Docker daemon
sudo systemctl restart docker  # Linux
# Restart Docker Desktop on Windows/macOS
```

**Prevention Strategies:**
- Use port range allocation
- Implement service discovery
- Monitor port usage
- Use reverse proxy for port management

---

#### Error Code: DOC-003
**Error Message:** `no space left on device`
**Severity:** Critical
**Category:** Storage Management

**Description:** Docker host has insufficient disk space for container operations.

**Immediate Actions:**
1. Clean unused Docker resources
2. Remove old images and containers
3. Check disk usage

**Resolution:**
```bash
# Clean Docker system
docker system prune -a -f

# Remove unused volumes
docker volume prune -f

# Check disk usage
df -h
```

**Prevention Strategies:**
- Implement automated cleanup
- Monitor disk usage
- Set up log rotation
- Use external storage for data volumes

---

### Network and Connectivity Errors

#### Error Code: NET-001
**Error Message:** `Connection timed out`
**Severity:** High
**Category:** Network Connectivity

**Description:** Network request exceeded timeout threshold.

**Immediate Actions:**
1. Check network connectivity
2. Verify service availability
3. Review timeout configurations

**Resolution:**
```bash
# Test network connectivity
ping <target_host>
telnet <target_host> <port>

# Check service status
curl -I http://localhost:8080/actuator/health
```

**Prevention Strategies:**
- Implement retry mechanisms
- Use circuit breaker patterns
- Monitor network latency
- Set appropriate timeout values

---

#### Error Code: NET-002
**Error Message:** `Name or service not known`
**Severity:** Medium
**Category:** DNS Resolution

**Description:** DNS cannot resolve the specified hostname.

**Immediate Actions:**
1. Check DNS configuration
2. Verify hostname spelling
3. Test DNS resolution

**Resolution:**
```bash
# Test DNS resolution
nslookup <hostname>
dig <hostname>

# Check /etc/hosts file
cat /etc/hosts
```

**Prevention Strategies:**
- Use IP addresses for critical services
- Implement DNS caching
- Monitor DNS resolution times
- Have backup DNS servers configured##
 🔍 Diagnostic and Validation Tools

### Health Check Endpoints

#### Application Health Check
**Endpoint:** `GET /actuator/health`
**Purpose:** Verify application status and dependencies

**Usage:**
```bash
curl -s http://localhost:8080/actuator/health | jq
```

**Response Interpretation:**
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "validationQuery": "isValid()"
      }
    },
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 499963174912,
        "free": 91943821312,
        "threshold": 10485760,
        "exists": true
      }
    }
  }
}
```

**Status Meanings:**
- **UP**: Component is healthy and operational
- **DOWN**: Component has failed health checks
- **OUT_OF_SERVICE**: Component is temporarily unavailable
- **UNKNOWN**: Health status cannot be determined

**Troubleshooting:**
- If `db.status` is DOWN: Check database connectivity
- If `diskSpace.status` is DOWN: Free up disk space
- If overall status is DOWN: Check application logs

---

#### Database Health Check
**Endpoint:** `GET /actuator/health/db`
**Purpose:** Specific database connectivity verification

**Usage:**
```bash
curl -s http://localhost:8080/actuator/health/db
```

**Response Examples:**
```json
// Healthy Database
{
  "status": "UP",
  "details": {
    "database": "PostgreSQL",
    "validationQuery": "isValid()"
  }
}

// Unhealthy Database
{
  "status": "DOWN",
  "details": {
    "error": "org.springframework.jdbc.CannotGetJdbcConnectionException"
  }
}
```

---

### Configuration Validation Scripts

#### Environment Validation Script
**File:** `scripts/validate-environment.sh`

```bash
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
```

**Usage:**
```bash
chmod +x scripts/validate-environment.sh
./scripts/validate-environment.sh
```

---

#### Database Migration Validation
**File:** `scripts/validate-migrations.sh`

```bash
#!/bin/bash

echo "🗄️ Database Migration Validation"
echo "================================"

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

# Check table existence
echo ""
echo "📊 Checking Core Tables..."
tables=("products" "categories")  # Add your actual table names

for table in "${tables[@]}"; do
    if docker-compose exec -T postgres-db psql -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" -t -c "\dt $table" 2>/dev/null | grep -q "$table"; then
        echo "✅ Table '$table' exists"
    else
        echo "❌ Table '$table' does not exist"
    fi
done

echo ""
echo "🎉 Database validation completed!"
```

---

### Automated Testing Procedures

#### Pre-deployment Test Suite
**File:** `scripts/pre-deployment-tests.sh`

```bash
#!/bin/bash

echo "🧪 Pre-deployment Test Suite"
echo "============================"

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

# Run integration tests
echo ""
echo "🔗 Running Integration Tests..."
if ./gradlew integrationTest; then
    echo "✅ Integration tests passed"
else
    echo "❌ Integration tests failed"
    docker-compose down
    exit 1
fi

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
```

---

### Monitoring Setup and Alerting

#### Application Metrics Collection
**Configuration for Prometheus monitoring:**

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana

volumes:
  grafana-storage:
```

**Prometheus Configuration:**
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'manager-product-service'
    static_configs:
      - targets: ['manager-product-service:8080']
    metrics_path: '/actuator/prometheus'
    scrape_interval: 5s
```

#### Health Check Monitoring Script
**File:** `scripts/health-monitor.sh`

```bash
#!/bin/bash

# Health monitoring script for continuous monitoring
HEALTH_URL="http://localhost:8080/actuator/health"
LOG_FILE="/var/log/health-monitor.log"
ALERT_THRESHOLD=3  # Number of consecutive failures before alert

consecutive_failures=0

while true; do
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if curl -s -f "$HEALTH_URL" > /dev/null 2>&1; then
        if [ $consecutive_failures -gt 0 ]; then
            echo "[$timestamp] ✅ Service recovered after $consecutive_failures failures" | tee -a "$LOG_FILE"
        fi
        consecutive_failures=0
    else
        consecutive_failures=$((consecutive_failures + 1))
        echo "[$timestamp] ❌ Health check failed (attempt $consecutive_failures)" | tee -a "$LOG_FILE"
        
        if [ $consecutive_failures -ge $ALERT_THRESHOLD ]; then
            echo "[$timestamp] 🚨 ALERT: Service has failed $consecutive_failures consecutive health checks" | tee -a "$LOG_FILE"
            
            # Add your alerting mechanism here (email, Slack, etc.)
            # Example: send_alert "Manager Product Service is down"
        fi
    fi
    
    sleep 30  # Check every 30 seconds
done
```

#### Log Analysis and Alerting
**File:** `scripts/log-analyzer.sh`

```bash
#!/bin/bash

echo "📊 Log Analysis Report"
echo "====================="

LOG_FILE="logs/application.log"
REPORT_FILE="logs/analysis-report-$(date +%Y%m%d-%H%M%S).txt"

# Check if log file exists
if [ ! -f "$LOG_FILE" ]; then
    echo "❌ Log file not found: $LOG_FILE"
    exit 1
fi

# Analyze error patterns
echo "🔍 Error Analysis:" | tee "$REPORT_FILE"
echo "==================" | tee -a "$REPORT_FILE"

# Count error levels
error_count=$(grep -c "ERROR" "$LOG_FILE")
warn_count=$(grep -c "WARN" "$LOG_FILE")
info_count=$(grep -c "INFO" "$LOG_FILE")

echo "Error Count: $error_count" | tee -a "$REPORT_FILE"
echo "Warning Count: $warn_count" | tee -a "$REPORT_FILE"
echo "Info Count: $info_count" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# Top error messages
echo "🔥 Top Error Messages:" | tee -a "$REPORT_FILE"
echo "=====================" | tee -a "$REPORT_FILE"
grep "ERROR" "$LOG_FILE" | cut -d']' -f3- | sort | uniq -c | sort -nr | head -10 | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# Database connection issues
echo "🗄️ Database Issues:" | tee -a "$REPORT_FILE"
echo "==================" | tee -a "$REPORT_FILE"
grep -i "connection\|database\|sql" "$LOG_FILE" | grep -i "error\|exception" | tail -5 | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# Performance issues
echo "⚡ Performance Issues:" | tee -a "$REPORT_FILE"
echo "=====================" | tee -a "$REPORT_FILE"
grep -i "timeout\|slow\|performance" "$LOG_FILE" | tail -5 | tee -a "$REPORT_FILE"

echo ""
echo "📄 Full report saved to: $REPORT_FILE"
```

**Usage:**
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run environment validation
./scripts/validate-environment.sh

# Run database validation
./scripts/validate-migrations.sh

# Run pre-deployment tests
./scripts/pre-deployment-tests.sh

# Start health monitoring (run in background)
nohup ./scripts/health-monitor.sh &

# Analyze logs
./scripts/log-analyzer.sh
```

### Quick Diagnostic Commands

#### System Status Check
```bash
# One-liner system status
echo "=== System Status ===" && \
docker-compose ps && \
echo "=== Health Check ===" && \
curl -s http://localhost:8080/actuator/health | jq '.status' && \
echo "=== Database Status ===" && \
pg_isready -h localhost -p 5432 -U postgres
```

#### Performance Monitoring
```bash
# Monitor resource usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
```

#### Log Monitoring
```bash
# Follow application logs with error highlighting
docker-compose logs -f manager-product-service | grep --color=always -E "(ERROR|WARN|Exception|$)"
```