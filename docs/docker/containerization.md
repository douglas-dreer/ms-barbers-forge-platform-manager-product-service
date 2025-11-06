# Docker & Containerization

Complete guide for containerizing and deploying the Manager Product Service using Docker and Docker Compose across different environments.

## 📋 Prerequisites

Before starting with Docker containerization, ensure you have:

- Docker Engine 20.10+ installed
- Docker Compose v2.0+ installed
- At least 4GB RAM available for containers
- Basic understanding of Docker concepts

### Verify Installation

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker compose version

# Verify Docker is running
docker info
```

## 🚀 Quick Start with Docker Compose

### Basic Setup

The Manager Product Service uses a multi-container setup with PostgreSQL database. Here's how to get started:

1. **Clone and navigate to the project directory**
2. **Copy environment configuration:**
   ```bash
   cp .env.example .env
   ```

3. **Start all services:**
   ```bash
   docker compose up -d
   ```

4. **Verify services are running:**
   ```bash
   docker compose ps
   ```

### Environment Configuration

The `.env` file contains essential configuration variables:

```bash
# Database Configuration
DATABASE_PROTOCOL=postgresql
DATABASE_HOST=postgres-db  # Use service name for container networking
DATABASE_PORT=5432
DATABASE_NAME=manager_product_db
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
```

> 💡 **Tip**: For container-to-container communication, use service names (e.g., `postgres-db`) instead of `localhost`.

## 🐳 Docker Compose Configuration

### Service Architecture

Our Docker Compose setup includes two main services:

```yaml
services:
  postgres-db:          # Database service
  manager-product-service:  # Application service
```

### PostgreSQL Database Service

```yaml
postgres-db:
  image: postgres:15.6-alpine
  container_name: bff-manager-product-postgresql
  ports:
    - "5432:5432"
  environment:
    POSTGRES_DB: ${DATABASE_NAME}
    POSTGRES_USER: ${DATABASE_USERNAME}
    POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
  volumes:
    - postgres-data:/var/lib/postgresql/data
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USERNAME} -d ${DATABASE_NAME} || exit 1"]
    interval: 10s
    timeout: 5s
    retries: 5
```

**Key Features:**
- **Alpine Linux**: Lightweight base image for better performance
- **Health Checks**: Automatic service health monitoring
- **Persistent Storage**: Data survives container restarts
- **Environment Variables**: Configurable database credentials

### Application Service

```yaml
manager-product-service:
  build:
    context: .
    dockerfile: Dockerfile
  ports:
    - "8080:8080"
  environment:
    SPRING_DATASOURCE_URL: "jdbc:postgresql://${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}"
    SPRING_DATASOURCE_USERNAME: ${DATABASE_USERNAME}
    SPRING_DATASOURCE_PASSWORD: ${DATABASE_PASSWORD}
    SPRING_JPA_DATABASE-PLATFORM: "org.hibernate.dialect.PostgreSQLDialect"
  depends_on:
    postgres-db:
      condition: service_healthy
```

**Key Features:**
- **Service Dependencies**: Waits for database health check
- **Environment Integration**: Uses variables from `.env` file
- **Port Mapping**: Exposes application on port 8080

## 🏗️ Dockerfile Explained

Our multi-stage Dockerfile optimizes for both build efficiency and runtime security:

### Stage 1: Builder (Build Environment)

```dockerfile
FROM gradle:8.9-jdk21 AS builder
WORKDIR /app

# Copy build files first (Docker layer caching)
COPY build.gradle.kts settings.gradle.kts ./
COPY gradlew ./
COPY gradle/ ./gradle/

# Make gradlew executable
RUN chmod +x ./gradlew

# Copy source code
COPY src/ ./src/

# Build the application
RUN ./gradlew bootJar --no-daemon
```

**Benefits:**
- **Layer Caching**: Dependencies are cached when source code changes
- **Build Isolation**: Full build environment with Gradle and JDK
- **Reproducible Builds**: Consistent build environment

### Stage 2: Runtime (Production Environment)

```dockerfile
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy only the built JAR
COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Benefits:**
- **Minimal Attack Surface**: Only JRE, no build tools
- **Smaller Image Size**: Reduced storage and transfer time
- **Security**: No unnecessary packages or tools

## 🔍 Container Health Checks and Monitoring

### Database Health Check

The PostgreSQL service includes a comprehensive health check:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USERNAME} -d ${DATABASE_NAME} || exit 1"]
  interval: 10s      # Check every 10 seconds
  timeout: 5s        # Timeout after 5 seconds
  retries: 5         # Retry 5 times before marking unhealthy
```

### Application Health Check

Add health check to the application service:

```yaml
manager-product-service:
  # ... other configuration
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:8080/actuator/health || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 60s  # Wait 60s before first check
```

### Monitoring Commands

```bash
# Check service health status
docker compose ps

# View health check logs
docker compose logs postgres-db

# Monitor resource usage
docker stats

# Check specific service health
docker inspect --format='{{.State.Health.Status}}' bff-manager-product-postgresql
```

## 🔒 Production-Ready Configuration

### Security Considerations

#### 1. Environment Variables Security

**Development (.env):**
```bash
DATABASE_PASSWORD=postgres
```

**Production (Docker Secrets):**
```yaml
services:
  postgres-db:
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password

secrets:
  db_password:
    external: true
```

#### 2. Non-Root User

**Enhanced Dockerfile for Production:**
```dockerfile
FROM eclipse-temurin:21-jre

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Copy JAR and set ownership
COPY --from=builder --chown=appuser:appuser /app/build/libs/*.jar app.jar

# Switch to non-root user
USER appuser

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### 3. Resource Limits

**Production Docker Compose:**
```yaml
services:
  manager-product-service:
    # ... other configuration
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    restart: unless-stopped
    
  postgres-db:
    # ... other configuration
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    restart: unless-stopped
```

### Production Environment Variables

```bash
# Production .env example
DATABASE_PROTOCOL=postgresql
DATABASE_HOST=postgres-db
DATABASE_PORT=5432
DATABASE_NAME=manager_product_db
DATABASE_USERNAME=postgres

# Security
SPRING_PROFILES_ACTIVE=prod
SPRING_JPA_SHOW_SQL=false
SPRING_JPA_HIBERNATE_DDL_AUTO=validate

# Logging
LOGGING_LEVEL_ROOT=WARN
LOGGING_LEVEL_BR_COM_BARBERS_FORGE=INFO

# Actuator (restrict endpoints in production)
MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE=health,info,metrics
MANAGEMENT_ENDPOINT_HEALTH_SHOW_DETAILS=when-authorized
```

### SSL/TLS Configuration

For production HTTPS setup:

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - manager-product-service

  manager-product-service:
    # Remove direct port exposure
    # ports:
    #   - "8080:8080"
    expose:
      - "8080"
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Problem: Container Fails to Start

**Symptoms:**
- Service exits immediately
- Error in `docker compose logs`

**Diagnosis:**
```bash
# Check container logs
docker compose logs manager-product-service

# Check if ports are available
netstat -tulpn | grep :8080

# Verify environment variables
docker compose config
```

**Solutions:**
1. **Port Conflicts**: Change port mapping in docker-compose.yml
2. **Missing Environment Variables**: Verify .env file exists and is complete
3. **Database Connection**: Ensure database service is healthy

#### Problem: Database Connection Refused

**Symptoms:**
- Application logs show connection errors
- `Connection refused` or `Connection timeout`

**Diagnosis:**
```bash
# Check database health
docker compose ps postgres-db

# Test database connectivity
docker compose exec postgres-db pg_isready -U postgres

# Check network connectivity
docker compose exec manager-product-service ping postgres-db
```

**Solutions:**
1. **Service Dependencies**: Ensure `depends_on` with health condition
2. **Network Configuration**: Use service names for container communication
3. **Database Initialization**: Wait for database to be fully ready

#### Problem: Out of Memory Errors

**Symptoms:**
- Container killed by OOM killer
- Application becomes unresponsive

**Diagnosis:**
```bash
# Check memory usage
docker stats

# Check container limits
docker inspect manager-product-service | grep -i memory

# Review application logs
docker compose logs --tail=100 manager-product-service
```

**Solutions:**
1. **Increase Memory Limits**: Adjust deploy.resources.limits.memory
2. **JVM Tuning**: Add JVM memory flags to ENTRYPOINT
3. **Application Optimization**: Review memory usage patterns

### Health Check Troubleshooting

#### Database Health Check Failing

```bash
# Manual health check
docker compose exec postgres-db pg_isready -U postgres -d manager_product_db

# Check PostgreSQL logs
docker compose logs postgres-db

# Verify environment variables
docker compose exec postgres-db env | grep POSTGRES
```

#### Application Health Check Failing

```bash
# Test health endpoint manually
docker compose exec manager-product-service curl http://localhost:8080/actuator/health

# Check if actuator is enabled
docker compose logs manager-product-service | grep actuator

# Verify Spring Boot startup
docker compose logs manager-product-service | grep "Started"
```

### Performance Optimization

#### Build Performance

```bash
# Use BuildKit for faster builds
export DOCKER_BUILDKIT=1
docker compose build

# Build with cache from registry
docker compose build --build-arg BUILDKIT_INLINE_CACHE=1
```

#### Runtime Performance

```bash
# Monitor resource usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# Check container logs for performance issues
docker compose logs --follow manager-product-service
```

## 📊 Monitoring and Logging

### Container Metrics

```bash
# Real-time resource monitoring
docker stats

# Export metrics to file
docker stats --no-stream --format "json" > container-metrics.json

# Check disk usage
docker system df
```

### Log Management

```bash
# View logs with timestamps
docker compose logs -t manager-product-service

# Follow logs in real-time
docker compose logs -f --tail=50

# Export logs
docker compose logs --no-color > application.log
```

### Health Monitoring Script

Create a monitoring script for production:

```bash
#!/bin/bash
# health-check.sh

services=("postgres-db" "manager-product-service")

for service in "${services[@]}"; do
    health=$(docker inspect --format='{{.State.Health.Status}}' $service 2>/dev/null)
    if [ "$health" != "healthy" ]; then
        echo "WARNING: $service is not healthy (status: $health)"
        # Add alerting logic here
    else
        echo "OK: $service is healthy"
    fi
done
```

## 🚀 Deployment Commands

### Development

```bash
# Start services in development mode
docker compose up -d

# Rebuild and restart after code changes
docker compose up -d --build

# View logs
docker compose logs -f
```

### Production

```bash
# Pull latest images
docker compose pull

# Start with production configuration
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Zero-downtime deployment
docker compose up -d --no-deps --build manager-product-service
```

### Maintenance

```bash
# Stop all services
docker compose down

# Stop and remove volumes (⚠️ Data loss)
docker compose down -v

# Clean up unused resources
docker system prune -f

# Backup database
docker compose exec postgres-db pg_dump -U postgres manager_product_db > backup.sql
```