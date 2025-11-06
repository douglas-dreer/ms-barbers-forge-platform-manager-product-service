# Manager Product Service Documentation

Welcome to the **Manager Product Service** documentation, a microservice for managing products and services in the Barber's Forge platform.

!!! tip "Quick Start Available"
    New to the project? Check out our [Quick Start Guide](quick-start/index.md) to get up and running in minutes.

## 📖 About the Project

The Manager Product Service is a microservice developed in **Kotlin** with **Spring Boot 3.5.7**, responsible for managing the catalog of products and services offered by barbershops on the Barber's Forge platform.

## 🏗️ Architecture Overview

### Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Language** | Kotlin | 1.9.25 |
| **Framework** | Spring Boot | 3.5.7 |
| **Java** | OpenJDK | 21 (LTS) |
| **Database** | PostgreSQL | Latest |
| **Migrations** | Flyway | Latest |
| **Build Tool** | Gradle (Kotlin DSL) | Latest |
| **Container** | Docker | Latest |

### Core Dependencies

=== "Web Layer"
    - **Spring Boot Starter Web**: RESTful API endpoints
    - **Spring Boot Starter Validation**: Request/response validation

=== "Data Layer"
    - **Spring Boot Starter Data JPA**: Database persistence
    - **PostgreSQL Driver**: Database connectivity
    - **Flyway**: Schema migration management

=== "Operations"
    - **Spring Boot Starter Actuator**: Health checks and metrics
    - **Docker**: Containerization and deployment

## 🚀 Quick Navigation

<div class="grid cards" markdown>

-   :material-rocket-launch:{ .lg .middle } **Quick Start**

    ---

    Get the service running locally in under 5 minutes

    [:octicons-arrow-right-24: Get Started](quick-start/index.md)

-   :material-cog:{ .lg .middle } **Configuration**

    ---

    Comprehensive configuration guide for all environments

    [:octicons-arrow-right-24: Configure](configuracao.md)

-   :material-database:{ .lg .middle } **Database Setup**

    ---

    PostgreSQL setup and migration management

    [:octicons-arrow-right-24: Database](database/postgresql-setup.md)

-   :material-docker:{ .lg .middle } **Docker & Containers**

    ---

    Containerization and deployment guides

    [:octicons-arrow-right-24: Docker](docker/containerization.md)

-   :material-bug:{ .lg .middle } **Troubleshooting**

    ---

    Common issues and their solutions

    [:octicons-arrow-right-24: Troubleshoot](troubleshooting/index.md)

-   :material-server:{ .lg .middle } **Environment Setup**

    ---

    Environment-specific configuration guides

    [:octicons-arrow-right-24: Environments](environment-setup/development.md)

</div>

## 🔍 API Resources

The service exposes RESTful endpoints for product management. Key features include:

- **Product CRUD Operations**: Create, read, update, and delete products
- **Category Management**: Organize products by categories
- **Search and Filtering**: Advanced product search capabilities
- **Health Monitoring**: Built-in health checks and metrics

!!! info "API Documentation"
    Detailed API documentation will be available soon via OpenAPI/Swagger integration.

## 🛡️ Best Practices

This project follows industry best practices:

- **Clean Architecture**: Separation of concerns and dependency inversion
- **SOLID Principles**: Object-oriented design principles
- **RESTful Design**: Standard HTTP methods and status codes
- **Database Migrations**: Versioned schema changes with Flyway
- **Containerization**: Docker-first deployment strategy
- **Monitoring**: Comprehensive health checks and metrics

## 📞 Support & Contributing

!!! question "Need Help?"
    - Check the [Troubleshooting Guide](troubleshooting/index.md) for common issues
    - Review the [Configuration Documentation](configuracao.md) for setup questions
    - Contact the Barber's Forge development team for additional support

For contributions and development guidelines, please refer to the project repository and follow the established coding standards.

