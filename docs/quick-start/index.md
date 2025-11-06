# Quick Start Guide

Welcome to the Manager Product Service quick start guide. Get your development environment up and running in under 10 minutes with this step-by-step guide.

!!! info "Estimated Time"
    ⏱️ **Total setup time**: 8-10 minutes  
    🎯 **Difficulty**: Beginner

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

| Software | Minimum Version | Download Link | Purpose |
|----------|----------------|---------------|---------|
| **Java JDK** | 21 (LTS) | [OpenJDK 21](https://adoptium.net/) | Runtime environment |
| **Docker** | 20.10+ | [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Database containerization |
| **Docker Compose** | 2.0+ | Included with Docker Desktop | Multi-container orchestration |
| **Git** | 2.30+ | [Git SCM](https://git-scm.com/) | Version control |

### Optional Tools

| Tool | Purpose | Download Link |
|------|---------|---------------|
| **IntelliJ IDEA** | IDE with Kotlin support | [JetBrains](https://www.jetbrains.com/idea/) |
| **Postman** | API testing | [Postman](https://www.postman.com/) |
| **pgAdmin** | PostgreSQL management | [pgAdmin](https://www.pgadmin.org/) |

### System Requirements

- **RAM**: Minimum 4GB, Recommended 8GB+
- **Disk Space**: 2GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)

## Step-by-Step Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone <repository-url>
cd manager-product-service

# Verify the project structure
ls -la
```

!!! tip "Expected Output"
    You should see files like `build.gradle.kts`, `docker-compose.yml`, and directories like `src/`, `docs/`

### Step 2: Environment Configuration

Create your environment configuration file:

```bash
# Copy the example environment file
cp .env.example .env
```

Edit the `.env` file with your preferred settings:

```properties
# Database Configuration
DATABASE_PROTOCOL=postgresql
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=manager_product_db
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres123

# Application Configuration
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=dev
```

!!! warning "Security Note"
    Never commit the `.env` file to version control. It's already included in `.gitignore`

### Step 3: Start the Database

Launch PostgreSQL using Docker Compose:

```bash
# Start the database container
docker-compose up -d

# Verify the container is running
docker ps
```

!!! success "Verification"
    You should see a PostgreSQL container running on port 5432

**Test database connectivity:**

```bash
# Test connection (optional)
docker exec -it <postgres-container-name> psql -U postgres -d manager_product_db -c "SELECT version();"
```

### Step 4: Build and Run the Application

Build and start the Spring Boot application:

```bash
# Make gradlew executable (Linux/macOS)
chmod +x gradlew

# Build the project
./gradlew build

# Run the application
./gradlew bootRun
```

**For Windows users:**
```cmd
# Build the project
gradlew.bat build

# Run the application
gradlew.bat bootRun
```

!!! info "First Run"
    The first build may take 2-3 minutes as Gradle downloads dependencies

### Step 5: Verify Installation

Once the application starts, verify everything is working:

#### Health Check
```bash
curl http://localhost:8080/actuator/health
```

**Expected response:**
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
    }
  }
}
```

#### Database Migrations
Check the application logs for successful Flyway migrations:

```
INFO  o.f.core.internal.command.DbMigrate - Successfully applied 3 migrations
```

## Environment Validation Checklist

Use this checklist to verify your setup is complete:

### ✅ Prerequisites Check

- [ ] Java 21+ installed (`java -version`)
- [ ] Docker running (`docker --version`)
- [ ] Docker Compose available (`docker-compose --version`)
- [ ] Git configured (`git --version`)

### ✅ Project Setup Check

- [ ] Repository cloned successfully
- [ ] `.env` file created and configured
- [ ] Database container running (`docker ps`)
- [ ] Application builds without errors (`./gradlew build`)

### ✅ Runtime Verification

- [ ] Application starts successfully
- [ ] Health endpoint responds (`/actuator/health`)
- [ ] Database connection established (check logs)
- [ ] Flyway migrations applied (check logs)

### ✅ Common Setup Verification Steps

Run these commands to verify your setup:

```bash
# 1. Check Java version
java -version
# Expected: openjdk version "21.x.x"

# 2. Verify Docker is running
docker info
# Should show Docker system information

# 3. Check if PostgreSQL container is accessible
docker exec -it $(docker-compose ps -q postgres) pg_isready
# Expected: /tmp:5432 - accepting connections

# 4. Test application health
curl -f http://localhost:8080/actuator/health
# Expected: HTTP 200 with status "UP"

# 5. Check application logs for errors
./gradlew bootRun | grep -i error
# Should show no critical errors
```

## Quick Troubleshooting

### Common Issues and Solutions

#### Port Already in Use
**Problem**: `Port 8080 is already in use`

**Solution**:
```bash
# Find process using port 8080
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Kill the process or change port in .env
SERVER_PORT=8081
```

#### Database Connection Failed
**Problem**: `Connection refused to localhost:5432`

**Solution**:
```bash
# Restart Docker containers
docker-compose down
docker-compose up -d

# Wait 30 seconds for PostgreSQL to fully start
sleep 30
```

#### Build Failures
**Problem**: `Build failed with compilation errors`

**Solution**:
```bash
# Clean and rebuild
./gradlew clean build

# Check Java version compatibility
java -version
```

## Next Steps

Now that your environment is set up, you can:

1. **Explore the API**: Check out the [API Documentation](../api/endpoints.md)
2. **Configure for Production**: See [Environment Setup](../environment-setup/production.md)
3. **Learn about Database**: Read [Database Configuration](../database/postgresql-setup.md)
4. **Understand Docker Setup**: Review [Docker Guide](../docker/containerization.md)

!!! tip "Development Workflow"
    For daily development, you only need to run:
    ```bash
    docker-compose up -d  # Start database
    ./gradlew bootRun     # Start application
    ```

## Getting Help

If you encounter issues not covered here:

1. Check the [Troubleshooting Guide](../troubleshooting/index.md)
2. Review the [Configuration Documentation](../configuracao.md)
3. Contact the development team

**Happy coding! 🚀**