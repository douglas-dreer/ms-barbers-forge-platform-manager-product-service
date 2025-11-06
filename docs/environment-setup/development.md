# Development Environment Setup

This comprehensive guide covers setting up the Manager Product Service for local development, including database configuration, IDE setup, and debugging tools.

> 💡 **Tip**: This guide assumes you have Java 21, Docker, and Git installed on your system.

## Prerequisites

Before starting, ensure you have the following installed:

- **Java 21** (OpenJDK or Oracle JDK)
- **Docker Desktop** (for PostgreSQL database)
- **Git** (for version control)
- **IDE** (IntelliJ IDEA, VS Code, or Eclipse)

### Verification Commands

```bash
# Verify Java installation
java -version

# Verify Docker installation
docker --version
docker-compose --version

# Verify Git installation
git --version
```

## Local Database Configuration

### PostgreSQL Setup with Docker

The development environment uses PostgreSQL running in a Docker container for consistency and ease of setup.

#### 1. Environment Configuration

Create a `.env` file in the project root (copy from `.env.example`):

```properties
# Database Configuration
DATABASE_PROTOCOL=postgresql
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=manager_product_db
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
```

> ⚠️ **Warning**: Never commit real passwords to version control. The development password shown here is for local use only.

#### 2. Start PostgreSQL Container

```bash
# Start PostgreSQL container
docker-compose up -d postgres-db

# Verify container is running
docker ps

# Check container logs
docker-compose logs postgres-db
```

#### 3. Database Connection Verification

```bash
# Test database connection
docker exec -it bff-manager-product-postgresql psql -U postgres -d manager_product_db

# Alternative: Use pg_isready
docker exec bff-manager-product-postgresql pg_isready -U postgres -d manager_product_db
```

#### 4. Database Management Tools

**Option 1: pgAdmin (Web Interface)**
```bash
# Add pgAdmin to docker-compose for development
# Access at http://localhost:5050
```

**Option 2: Command Line Access**
```bash
# Connect to PostgreSQL CLI
docker exec -it bff-manager-product-postgresql psql -U postgres -d manager_product_db

# Common commands:
# \dt - List tables
# \d table_name - Describe table
# \q - Quit
```

## Application Configuration

### Spring Profiles

The application uses Spring profiles for environment-specific configuration:

- **Default Profile**: Basic configuration (application.yaml)
- **Development Profile**: Development-specific settings (application-dev.yaml)

#### Activating Development Profile

**Method 1: Environment Variable**
```bash
export SPRING_PROFILES_ACTIVE=dev
```

**Method 2: IDE Configuration**
```
VM Options: -Dspring.profiles.active=dev
```

**Method 3: Application Properties**
```properties
spring.profiles.active=dev
```

### Development-Specific Settings

The development profile includes:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate  # Safe for development
    show-sql: true        # Enable SQL logging
    properties:
      hibernate:
        format_sql: true  # Format SQL output
  
  logging:
    level:
      org.hibernate.SQL: DEBUG
      org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

> 📋 **Info**: The `ddl-auto: validate` setting ensures database schema matches entity definitions without auto-creating tables.

## IDE Setup and Configuration

### IntelliJ IDEA Setup

#### 1. Project Import
```
File → Open → Select project root directory
```

#### 2. Kotlin Configuration
- Ensure Kotlin plugin is enabled
- Set Kotlin compiler version to 1.9.25

#### 3. Spring Boot Configuration
- Install Spring Boot plugin
- Enable Spring Boot run configurations

#### 4. Database Integration
```
Database Tool Window → + → Data Source → PostgreSQL
Host: localhost
Port: 5432
Database: manager_product_db
User: postgres
Password: postgres
```

#### 5. Run Configuration
Create a new Spring Boot run configuration:
- **Main class**: `br.com.barbers_forge.ManagerProductServiceApplicationKt`
- **VM options**: `-Dspring.profiles.active=dev`
- **Environment variables**: Load from `.env` file

### VS Code Setup

#### 1. Required Extensions
```json
{
  "recommendations": [
    "vscjava.vscode-java-pack",
    "pivotal.vscode-spring-boot",
    "fwcd.kotlin",
    "ms-vscode.vscode-json"
  ]
}
```

#### 2. Launch Configuration (.vscode/launch.json)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "java",
      "name": "Manager Product Service (Dev)",
      "request": "launch",
      "mainClass": "br.com.barbers_forge.ManagerProductServiceApplicationKt",
      "projectName": "manager-product-service",
      "env": {
        "SPRING_PROFILES_ACTIVE": "dev"
      },
      "envFile": "${workspaceFolder}/.env"
    }
  ]
}
```

### Eclipse Setup

#### 1. Project Import
```
File → Import → Existing Gradle Projects → Select project root
```

#### 2. Kotlin Support
- Install Kotlin plugin from Eclipse Marketplace
- Configure Kotlin nature for the project

## Debugging Configuration

### Application Debugging

#### 1. Debug Mode Startup
```bash
# Command line with debug port
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 -jar target/manager-product-service.jar

# Gradle debug task
./gradlew bootRun --debug-jvm
```

#### 2. IDE Debug Configuration
- **IntelliJ**: Create Remote JVM Debug configuration (port 5005)
- **VS Code**: Add remote debugging to launch.json
- **Eclipse**: Debug Configurations → Remote Java Application

### Database Debugging

#### 1. SQL Logging
Enable in `application-dev.yaml`:
```yaml
logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
    org.springframework.jdbc.core: DEBUG
```

#### 2. Connection Pool Monitoring
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 20000
      leak-detection-threshold: 60000
```

## Development-Specific Security Considerations

### 1. Local Security Settings

```yaml
# application-dev.yaml
spring:
  security:
    user:
      name: dev
      password: dev123
      roles: ADMIN
  
management:
  endpoints:
    web:
      exposure:
        include: "*"  # Expose all actuator endpoints in dev
  endpoint:
    health:
      show-details: always
```

> ⚠️ **Warning**: These settings are for development only. Never use in production.

### 2. CORS Configuration for Development

```kotlin
@Configuration
@Profile("dev")
class DevCorsConfiguration {
    
    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration()
        configuration.allowedOriginPatterns = listOf("*")
        configuration.allowedMethods = listOf("*")
        configuration.allowedHeaders = listOf("*")
        configuration.allowCredentials = true
        
        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", configuration)
        return source
    }
}
```

## Performance Considerations for Development

### 1. JVM Settings for Development

```bash
# Recommended JVM options for development
export JAVA_OPTS="-Xms512m -Xmx2g -XX:+UseG1GC -XX:+UseStringDeduplication"
```

### 2. Database Performance

```yaml
# application-dev.yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 5  # Smaller pool for development
      minimum-idle: 2
  
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 20
        order_inserts: true
        order_updates: true
```

### 3. Caching Configuration

```yaml
# Disable caching in development for immediate changes
spring:
  cache:
    type: none
  
  thymeleaf:
    cache: false
  
  web:
    resources:
      cache:
        period: 0
```

## Development Workflow

### 1. Daily Development Startup

```bash
# 1. Start database
docker-compose up -d postgres-db

# 2. Verify database health
docker-compose ps

# 3. Run application
./gradlew bootRun

# 4. Verify application health
curl http://localhost:8080/actuator/health
```

### 2. Code Changes Workflow

```bash
# 1. Make code changes
# 2. Run tests
./gradlew test

# 3. Check code style
./gradlew ktlintCheck

# 4. Restart application (if needed)
# Hot reload is enabled for most changes
```

### 3. Database Schema Changes

```bash
# 1. Create new migration file
# src/main/resources/db/migration/V{version}__{description}.sql

# 2. Restart application to apply migration
./gradlew bootRun

# 3. Verify migration
docker exec -it bff-manager-product-postgresql psql -U postgres -d manager_product_db -c "\dt"
```

## Troubleshooting Development Issues

### Common Problems and Solutions

#### Database Connection Issues

**Problem**: `Connection refused to localhost:5432`

**Solution**:
```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# Start container if not running
docker-compose up -d postgres-db

# Check container logs
docker-compose logs postgres-db
```

#### Port Already in Use

**Problem**: `Port 8080 is already in use`

**Solution**:
```bash
# Find process using port 8080
netstat -ano | findstr :8080  # Windows
lsof -i :8080                 # macOS/Linux

# Kill process or change application port
# application-dev.yaml
server:
  port: 8081
```

#### Gradle Build Issues

**Problem**: `Could not resolve dependencies`

**Solution**:
```bash
# Clear Gradle cache
./gradlew clean

# Refresh dependencies
./gradlew build --refresh-dependencies

# Check Gradle wrapper version
./gradlew wrapper --gradle-version 8.5
```

## Development Tools and Utilities

### 1. Health Check Endpoints

```bash
# Application health
curl http://localhost:8080/actuator/health

# Database health
curl http://localhost:8080/actuator/health/db

# Application info
curl http://localhost:8080/actuator/info
```

### 2. Database Utilities

```bash
# Backup development database
docker exec bff-manager-product-postgresql pg_dump -U postgres manager_product_db > dev_backup.sql

# Restore database
docker exec -i bff-manager-product-postgresql psql -U postgres manager_product_db < dev_backup.sql

# Reset database (careful!)
docker-compose down -v
docker-compose up -d postgres-db
```

### 3. Log Analysis

```bash
# Follow application logs
tail -f logs/application.log

# Search for errors
grep -i error logs/application.log

# Filter by log level
grep -i "ERROR\|WARN" logs/application.log
```

## Next Steps

After completing the development setup:

1. **Run the application**: `./gradlew bootRun`
2. **Access health endpoint**: http://localhost:8080/actuator/health
3. **Review API documentation**: Check if Swagger/OpenAPI is configured
4. **Set up testing environment**: Review test configuration and run `./gradlew test`

> ✅ **Success**: Your development environment is now ready! Proceed to implement features and run tests.