# Staging Environment Setup

This guide covers the configuration and deployment of the Manager Product Service in staging environments, including production-like settings, deployment pipeline integration, and comprehensive validation procedures.

> 📋 **Info**: Staging environments should mirror production as closely as possible while maintaining safe testing capabilities.

## Overview

The staging environment serves as the final testing ground before production deployment. It should:

- Mirror production infrastructure and configuration
- Support automated testing and validation
- Enable safe integration testing
- Provide realistic performance testing conditions

## Staging-Specific Configuration

### Environment Variables

Create a `.env.staging` file with production-like settings:

```properties
# Database Configuration
DATABASE_PROTOCOL=postgresql
DATABASE_HOST=staging-db.internal.company.com
DATABASE_PORT=5432
DATABASE_NAME=manager_product_staging
DATABASE_USERNAME=staging_user
DATABASE_PASSWORD=${STAGING_DB_PASSWORD}  # From secrets management

# Application Configuration
SPRING_PROFILES_ACTIVE=staging
SERVER_PORT=8080

# Security Configuration
JWT_SECRET=${STAGING_JWT_SECRET}
CORS_ALLOWED_ORIGINS=https://staging-frontend.company.com

# Monitoring Configuration
MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE=health,info,metrics,prometheus
MANAGEMENT_ENDPOINT_HEALTH_SHOW_DETAILS=when_authorized

# Logging Configuration
LOGGING_LEVEL_ROOT=INFO
LOGGING_LEVEL_BR_COM_BARBERS_FORGE=DEBUG
```

### Spring Boot Configuration

#### application-staging.yaml

```yaml
spring:
  application:
    name: manager-product-service
  
  datasource:
    url: jdbc:${DATABASE_PROTOCOL}://${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      leak-detection-threshold: 60000
  
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        jdbc:
          batch_size: 25
        order_inserts: true
        order_updates: true
        generate_statistics: false
  
  flyway:
    enabled: true
    baseline-on-migrate: true
    validate-on-migrate: true
    clean-disabled: true

server:
  port: ${SERVER_PORT:8080}
  compression:
    enabled: true
  http2:
    enabled: true

management:
  endpoints:
    web:
      exposure:
        include: ${MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE}
      base-path: /actuator
  endpoint:
    health:
      show-details: ${MANAGEMENT_ENDPOINT_HEALTH_SHOW_DETAILS}
      probes:
        enabled: true
  metrics:
    export:
      prometheus:
        enabled: true

logging:
  level:
    root: ${LOGGING_LEVEL_ROOT}
    br.com.barbers_forge: ${LOGGING_LEVEL_BR_COM_BARBERS_FORGE}
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: /var/log/manager-product-service/application.log
```

### Docker Configuration for Staging

#### docker-compose.staging.yml

```yaml
version: '3.8'

services:
  manager-product-service:
    image: manager-product-service:${BUILD_VERSION}
    container_name: manager-product-staging
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: staging
      DATABASE_HOST: ${DATABASE_HOST}
      DATABASE_PORT: ${DATABASE_PORT}
      DATABASE_NAME: ${DATABASE_NAME}
      DATABASE_USERNAME: ${DATABASE_USERNAME}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    
    volumes:
      - staging-logs:/var/log/manager-product-service
      - staging-config:/app/config
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    
    restart: unless-stopped
    
    networks:
      - staging-network
    
    depends_on:
      - postgres-staging
    
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'

  postgres-staging:
    image: postgres:15.6-alpine
    container_name: postgres-staging
    environment:
      POSTGRES_DB: ${DATABASE_NAME}
      POSTGRES_USER: ${DATABASE_USERNAME}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    
    volumes:
      - postgres-staging-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USERNAME} -d ${DATABASE_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
    
    networks:
      - staging-network
    
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.3'

volumes:
  postgres-staging-data:
    driver: local
  staging-logs:
    driver: local
  staging-config:
    driver: local

networks:
  staging-network:
    driver: bridge
```

## Deployment Pipeline Integration

### CI/CD Pipeline Configuration

#### GitHub Actions Example (.github/workflows/staging-deploy.yml)

```yaml
name: Deploy to Staging

on:
  push:
    branches: [ develop ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: manager-product-service

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
      
      - name: Cache Gradle packages
        uses: actions/cache@v3
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
      
      - name: Run tests
        run: ./gradlew test
      
      - name: Run integration tests
        run: ./gradlew integrationTest
      
      - name: Generate test report
        uses: dorny/test-reporter@v1
        if: success() || failure()
        with:
          name: Test Results
          path: build/test-results/test/*.xml
          reporter: java-junit

  build:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build.outputs.digest }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
      
      - name: Build application
        run: ./gradlew bootJar
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ github.repository }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
      
      - name: Build and push Docker image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to staging
        run: |
          echo "Deploying ${{ needs.build.outputs.image-tag }} to staging"
          # Add your deployment commands here
          # Example: kubectl, docker-compose, or custom deployment scripts
      
      - name: Run smoke tests
        run: |
          # Wait for deployment to be ready
          sleep 30
          
          # Run smoke tests
          curl -f https://staging-api.company.com/actuator/health
          
          # Run additional validation
          ./scripts/staging-validation.sh
      
      - name: Notify deployment status
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Jenkins Pipeline Example

```groovy
pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'your-registry.com'
        IMAGE_NAME = 'manager-product-service'
        STAGING_HOST = 'staging.company.com'
    }
    
    stages {
        stage('Test') {
            steps {
                sh './gradlew test integrationTest'
                publishTestResults testResultsPattern: 'build/test-results/**/*.xml'
            }
        }
        
        stage('Build') {
            steps {
                sh './gradlew bootJar'
                script {
                    def image = docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}")
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-registry-credentials') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }
        
        stage('Deploy to Staging') {
            steps {
                sshagent(['staging-ssh-key']) {
                    sh """
                        ssh user@${STAGING_HOST} '
                            cd /opt/manager-product-service &&
                            docker-compose -f docker-compose.staging.yml pull &&
                            docker-compose -f docker-compose.staging.yml up -d &&
                            docker system prune -f
                        '
                    """
                }
            }
        }
        
        stage('Validate Deployment') {
            steps {
                script {
                    def healthCheck = sh(
                        script: "curl -f https://${STAGING_HOST}/actuator/health",
                        returnStatus: true
                    )
                    if (healthCheck != 0) {
                        error("Health check failed")
                    }
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            slackSend(
                channel: '#deployments',
                color: 'good',
                message: "✅ Staging deployment successful: ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
            )
        }
        failure {
            slackSend(
                channel: '#deployments',
                color: 'danger',
                message: "❌ Staging deployment failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
            )
        }
    }
}
```

## Environment Validation Steps

### Pre-Deployment Validation

#### 1. Infrastructure Readiness Check

```bash
#!/bin/bash
# staging-pre-deploy-check.sh

echo "🔍 Pre-deployment validation for staging environment"

# Check database connectivity
echo "Checking database connectivity..."
pg_isready -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USERNAME
if [ $? -ne 0 ]; then
    echo "❌ Database connection failed"
    exit 1
fi

# Check required environment variables
required_vars=("DATABASE_HOST" "DATABASE_USERNAME" "DATABASE_PASSWORD" "JWT_SECRET")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

# Check Docker registry access
echo "Checking Docker registry access..."
docker pull $DOCKER_REGISTRY/$IMAGE_NAME:latest
if [ $? -ne 0 ]; then
    echo "❌ Cannot pull Docker image"
    exit 1
fi

echo "✅ Pre-deployment validation passed"
```

#### 2. Database Migration Validation

```bash
#!/bin/bash
# validate-migrations.sh

echo "🔍 Validating database migrations"

# Create backup before migration
pg_dump -h $DATABASE_HOST -U $DATABASE_USERNAME $DATABASE_NAME > staging_backup_$(date +%Y%m%d_%H%M%S).sql

# Run migration in dry-run mode (if supported)
java -jar manager-product-service.jar --spring.flyway.validate-on-migrate=true --spring.flyway.dry-run=true

if [ $? -eq 0 ]; then
    echo "✅ Migration validation passed"
else
    echo "❌ Migration validation failed"
    exit 1
fi
```

### Post-Deployment Validation

#### 1. Application Health Validation

```bash
#!/bin/bash
# staging-validation.sh

STAGING_URL="https://staging-api.company.com"
MAX_RETRIES=30
RETRY_INTERVAL=10

echo "🔍 Post-deployment validation for staging environment"

# Wait for application to start
echo "Waiting for application to start..."
for i in $(seq 1 $MAX_RETRIES); do
    if curl -f "$STAGING_URL/actuator/health" > /dev/null 2>&1; then
        echo "✅ Application is responding"
        break
    fi
    
    if [ $i -eq $MAX_RETRIES ]; then
        echo "❌ Application failed to start within expected time"
        exit 1
    fi
    
    echo "Attempt $i/$MAX_RETRIES - waiting $RETRY_INTERVAL seconds..."
    sleep $RETRY_INTERVAL
done

# Detailed health checks
echo "Running detailed health checks..."

# Check application health
health_response=$(curl -s "$STAGING_URL/actuator/health")
health_status=$(echo $health_response | jq -r '.status')

if [ "$health_status" != "UP" ]; then
    echo "❌ Application health check failed: $health_status"
    echo "Response: $health_response"
    exit 1
fi

# Check database health
db_health=$(echo $health_response | jq -r '.components.db.status')
if [ "$db_health" != "UP" ]; then
    echo "❌ Database health check failed: $db_health"
    exit 1
fi

# Check disk space
disk_health=$(echo $health_response | jq -r '.components.diskSpace.status')
if [ "$disk_health" != "UP" ]; then
    echo "❌ Disk space health check failed: $disk_health"
    exit 1
fi

echo "✅ All health checks passed"
```

#### 2. Functional Validation Tests

```bash
#!/bin/bash
# functional-validation.sh

STAGING_URL="https://staging-api.company.com"

echo "🔍 Running functional validation tests"

# Test API endpoints
echo "Testing API endpoints..."

# Test health endpoint
curl -f "$STAGING_URL/actuator/health" || exit 1

# Test info endpoint
curl -f "$STAGING_URL/actuator/info" || exit 1

# Test metrics endpoint (if exposed)
curl -f "$STAGING_URL/actuator/metrics" || exit 1

# Test application-specific endpoints
# Add your application-specific API tests here
# Example:
# curl -f "$STAGING_URL/api/products" -H "Authorization: Bearer $TEST_TOKEN" || exit 1

echo "✅ Functional validation tests passed"
```

#### 3. Performance Validation

```bash
#!/bin/bash
# performance-validation.sh

STAGING_URL="https://staging-api.company.com"

echo "🔍 Running performance validation"

# Basic load test using curl
echo "Running basic load test..."
for i in {1..10}; do
    response_time=$(curl -o /dev/null -s -w "%{time_total}" "$STAGING_URL/actuator/health")
    echo "Request $i: ${response_time}s"
    
    # Fail if response time is too high
    if (( $(echo "$response_time > 2.0" | bc -l) )); then
        echo "❌ Response time too high: ${response_time}s"
        exit 1
    fi
done

echo "✅ Performance validation passed"
```

## Staging-Specific Monitoring and Logging

### Monitoring Configuration

#### 1. Prometheus Metrics

```yaml
# prometheus.yml (staging)
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'manager-product-service-staging'
    static_configs:
      - targets: ['staging-api.company.com:8080']
    metrics_path: '/actuator/prometheus'
    scrape_interval: 30s
    scrape_timeout: 10s
```

#### 2. Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "Manager Product Service - Staging",
    "panels": [
      {
        "title": "Application Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"manager-product-service-staging\"}",
            "legendFormat": "Application Status"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "http_server_requests_seconds_sum{job=\"manager-product-service-staging\"} / http_server_requests_seconds_count{job=\"manager-product-service-staging\"}",
            "legendFormat": "Average Response Time"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "hikaricp_connections_active{job=\"manager-product-service-staging\"}",
            "legendFormat": "Active Connections"
          }
        ]
      }
    ]
  }
}
```

### Logging Configuration

#### 1. Centralized Logging with ELK Stack

```yaml
# logstash.conf (staging)
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][environment] == "staging" {
    mutate {
      add_tag => ["staging"]
    }
  }
  
  if [fields][service] == "manager-product-service" {
    grok {
      match => { 
        "message" => "%{TIMESTAMP_ISO8601:timestamp} \[%{DATA:thread}\] %{LOGLEVEL:level} %{DATA:logger} - %{GREEDYDATA:message}" 
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "staging-logs-%{+YYYY.MM.dd}"
  }
}
```

#### 2. Log Aggregation Script

```bash
#!/bin/bash
# collect-staging-logs.sh

STAGING_HOST="staging.company.com"
LOG_DIR="/var/log/manager-product-service"
LOCAL_LOG_DIR="./staging-logs"

echo "📋 Collecting staging logs"

# Create local log directory
mkdir -p $LOCAL_LOG_DIR

# Collect application logs
scp -r user@$STAGING_HOST:$LOG_DIR/* $LOCAL_LOG_DIR/

# Collect Docker logs
ssh user@$STAGING_HOST "docker logs manager-product-staging" > $LOCAL_LOG_DIR/docker.log 2>&1

# Collect system logs
ssh user@$STAGING_HOST "journalctl -u docker --since '1 hour ago'" > $LOCAL_LOG_DIR/system.log

echo "✅ Logs collected in $LOCAL_LOG_DIR"
```

## Rollback Procedures

### Automated Rollback

```bash
#!/bin/bash
# rollback-staging.sh

PREVIOUS_VERSION=$1
STAGING_HOST="staging.company.com"

if [ -z "$PREVIOUS_VERSION" ]; then
    echo "Usage: $0 <previous_version>"
    exit 1
fi

echo "🔄 Rolling back to version $PREVIOUS_VERSION"

# Stop current version
ssh user@$STAGING_HOST "docker-compose -f /opt/manager-product-service/docker-compose.staging.yml down"

# Restore database backup (if needed)
# ssh user@$STAGING_HOST "psql -h $DATABASE_HOST -U $DATABASE_USERNAME $DATABASE_NAME < backup_$PREVIOUS_VERSION.sql"

# Deploy previous version
ssh user@$STAGING_HOST "
    cd /opt/manager-product-service &&
    export BUILD_VERSION=$PREVIOUS_VERSION &&
    docker-compose -f docker-compose.staging.yml pull &&
    docker-compose -f docker-compose.staging.yml up -d
"

# Validate rollback
sleep 30
curl -f "https://$STAGING_HOST/actuator/health"

if [ $? -eq 0 ]; then
    echo "✅ Rollback successful"
else
    echo "❌ Rollback failed"
    exit 1
fi
```

## Security Considerations for Staging

### 1. Environment Isolation

```yaml
# Network security configuration
networks:
  staging-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
    driver_opts:
      com.docker.network.bridge.enable_icc: "false"
      com.docker.network.bridge.enable_ip_masquerade: "true"
```

### 2. Secrets Management

```bash
# Using Docker secrets
echo "staging_db_password" | docker secret create staging_db_password -
echo "staging_jwt_secret" | docker secret create staging_jwt_secret -

# Reference in docker-compose
services:
  manager-product-service:
    secrets:
      - staging_db_password
      - staging_jwt_secret
    environment:
      DATABASE_PASSWORD_FILE: /run/secrets/staging_db_password
      JWT_SECRET_FILE: /run/secrets/staging_jwt_secret

secrets:
  staging_db_password:
    external: true
  staging_jwt_secret:
    external: true
```

### 3. Access Control

```yaml
# application-staging.yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: when_authorized
  security:
    enabled: true

spring:
  security:
    user:
      name: ${ACTUATOR_USERNAME}
      password: ${ACTUATOR_PASSWORD}
      roles: ACTUATOR
```

## Troubleshooting Staging Issues

### Common Staging Problems

#### 1. Deployment Failures

**Problem**: Container fails to start

**Diagnosis**:
```bash
# Check container logs
docker logs manager-product-staging

# Check resource usage
docker stats manager-product-staging

# Check health check status
docker inspect manager-product-staging | jq '.[0].State.Health'
```

**Solutions**:
- Verify environment variables are set correctly
- Check resource limits and availability
- Validate database connectivity
- Review application logs for startup errors

#### 2. Performance Issues

**Problem**: Slow response times in staging

**Diagnosis**:
```bash
# Check application metrics
curl https://staging-api.company.com/actuator/metrics/http.server.requests

# Check database performance
docker exec postgres-staging pg_stat_activity

# Check system resources
ssh user@staging.company.com "top -p $(pgrep java)"
```

**Solutions**:
- Adjust JVM heap settings
- Optimize database connection pool
- Review and optimize slow queries
- Scale resources if needed

## Best Practices for Staging

### 1. Configuration Management
- Use environment-specific configuration files
- Implement proper secrets management
- Maintain configuration version control
- Document all configuration changes

### 2. Testing Strategy
- Run comprehensive test suites before deployment
- Implement smoke tests post-deployment
- Perform regular security scans
- Conduct performance testing

### 3. Monitoring and Alerting
- Set up comprehensive monitoring
- Configure appropriate alerts
- Implement log aggregation
- Monitor key business metrics

### 4. Deployment Process
- Use automated deployment pipelines
- Implement proper rollback procedures
- Maintain deployment documentation
- Follow change management processes

> ✅ **Success**: Your staging environment is now properly configured and ready for production-like testing!