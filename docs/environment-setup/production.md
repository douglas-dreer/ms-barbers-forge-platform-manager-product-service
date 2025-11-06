# Production Environment Setup

This comprehensive guide covers production-ready configuration, deployment, security best practices, performance optimization, and disaster recovery procedures for the Manager Product Service.

> ⚠️ **Critical**: Production environments require careful planning, security hardening, and comprehensive monitoring. Never deploy without proper testing and validation.

## Overview

Production deployment requires:

- **High Availability**: Multi-instance deployment with load balancing
- **Security Hardening**: Comprehensive security measures and access controls
- **Performance Optimization**: Tuned for production workloads
- **Monitoring & Alerting**: Complete observability and incident response
- **Disaster Recovery**: Backup and recovery procedures

## Production-Ready Configuration

### Environment Variables

Create a secure `.env.production` file with production settings:

```properties
# Application Configuration
SPRING_PROFILES_ACTIVE=production
SERVER_PORT=8080

# Database Configuration (Primary)
DATABASE_PROTOCOL=postgresql
DATABASE_HOST=prod-db-primary.internal.company.com
DATABASE_PORT=5432
DATABASE_NAME=manager_product_prod
DATABASE_USERNAME=prod_app_user
DATABASE_PASSWORD=${PROD_DB_PASSWORD}  # From secrets management

# Database Configuration (Read Replica)
DATABASE_READONLY_HOST=prod-db-replica.internal.company.com
DATABASE_READONLY_USERNAME=prod_readonly_user
DATABASE_READONLY_PASSWORD=${PROD_DB_READONLY_PASSWORD}

# Security Configuration
JWT_SECRET=${PROD_JWT_SECRET}
JWT_EXPIRATION=3600000  # 1 hour
CORS_ALLOWED_ORIGINS=https://app.company.com,https://admin.company.com

# SSL/TLS Configuration
SERVER_SSL_ENABLED=true
SERVER_SSL_KEY_STORE=/etc/ssl/certs/keystore.p12
SERVER_SSL_KEY_STORE_PASSWORD=${SSL_KEYSTORE_PASSWORD}
SERVER_SSL_KEY_STORE_TYPE=PKCS12

# Monitoring Configuration
MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE=health,info,metrics,prometheus
MANAGEMENT_ENDPOINT_HEALTH_SHOW_DETAILS=never
MANAGEMENT_SECURITY_ENABLED=true

# Logging Configuration
LOGGING_LEVEL_ROOT=WARN
LOGGING_LEVEL_BR_COM_BARBERS_FORGE=INFO
LOGGING_FILE_NAME=/var/log/manager-product-service/application.log

# Performance Configuration
JVM_OPTS=-Xms2g -Xmx4g -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+UseStringDeduplication

# External Services
REDIS_HOST=prod-redis.internal.company.com
REDIS_PORT=6379
REDIS_PASSWORD=${PROD_REDIS_PASSWORD}
```

### Spring Boot Production Configuration

#### application-production.yaml

```yaml
spring:
  application:
    name: manager-product-service
  
  # Primary Database Configuration
  datasource:
    primary:
      url: jdbc:${DATABASE_PROTOCOL}://${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}
      username: ${DATABASE_USERNAME}
      password: ${DATABASE_PASSWORD}
      hikari:
        maximum-pool-size: 50
        minimum-idle: 10
        connection-timeout: 30000
        idle-timeout: 600000
        max-lifetime: 1800000
        leak-detection-threshold: 60000
        pool-name: PrimaryHikariPool
    
    # Read-only Database Configuration
    readonly:
      url: jdbc:${DATABASE_PROTOCOL}://${DATABASE_READONLY_HOST}:${DATABASE_PORT}/${DATABASE_NAME}
      username: ${DATABASE_READONLY_USERNAME}
      password: ${DATABASE_READONLY_PASSWORD}
      hikari:
        maximum-pool-size: 30
        minimum-idle: 5
        connection-timeout: 30000
        idle-timeout: 600000
        max-lifetime: 1800000
        pool-name: ReadOnlyHikariPool
  
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        jdbc:
          batch_size: 50
        order_inserts: true
        order_updates: true
        generate_statistics: false
        cache:
          use_second_level_cache: true
          use_query_cache: true
          region:
            factory_class: org.hibernate.cache.jcache.JCacheRegionFactory
  
  flyway:
    enabled: true
    baseline-on-migrate: false
    validate-on-migrate: true
    clean-disabled: true
    locations: classpath:db/migration
  
  # Redis Configuration
  redis:
    host: ${REDIS_HOST}
    port: ${REDIS_PORT}
    password: ${REDIS_PASSWORD}
    timeout: 2000ms
    lettuce:
      pool:
        max-active: 20
        max-idle: 10
        min-idle: 5
  
  # Security Configuration
  security:
    require-ssl: true
    headers:
      frame: DENY
      content-type: nosniff
      xss-protection: "1; mode=block"

server:
  port: ${SERVER_PORT}
  
  # SSL Configuration
  ssl:
    enabled: ${SERVER_SSL_ENABLED}
    key-store: ${SERVER_SSL_KEY_STORE}
    key-store-password: ${SERVER_SSL_KEY_STORE_PASSWORD}
    key-store-type: ${SERVER_SSL_KEY_STORE_TYPE}
    protocol: TLS
    enabled-protocols: TLSv1.2,TLSv1.3
  
  # Performance Configuration
  compression:
    enabled: true
    mime-types: text/html,text/xml,text/plain,text/css,text/javascript,application/javascript,application/json
    min-response-size: 1024
  
  http2:
    enabled: true
  
  tomcat:
    threads:
      max: 200
      min-spare: 10
    max-connections: 8192
    accept-count: 100
    connection-timeout: 20000

# Management and Monitoring
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
      group:
        readiness:
          include: readinessState,db,redis
        liveness:
          include: livenessState,diskSpace
  
  metrics:
    export:
      prometheus:
        enabled: true
      cloudwatch:
        enabled: true
        namespace: ManagerProductService
        batch-size: 20
    
    distribution:
      percentiles-histogram:
        http.server.requests: true
      percentiles:
        http.server.requests: 0.5,0.9,0.95,0.99
      sla:
        http.server.requests: 100ms,200ms,500ms,1s,2s

# Logging Configuration
logging:
  level:
    root: ${LOGGING_LEVEL_ROOT}
    br.com.barbers_forge: ${LOGGING_LEVEL_BR_COM_BARBERS_FORGE}
    org.springframework.security: WARN
    org.hibernate.SQL: WARN
  
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level [%X{traceId:-},%X{spanId:-}] %logger{36} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level [%X{traceId:-},%X{spanId:-}] %logger{36} - %msg%n"
  
  file:
    name: ${LOGGING_FILE_NAME}
    max-size: 100MB
    max-history: 30
    total-size-cap: 3GB

# Application-specific Configuration
app:
  security:
    jwt:
      secret: ${JWT_SECRET}
      expiration: ${JWT_EXPIRATION}
    
    cors:
      allowed-origins: ${CORS_ALLOWED_ORIGINS}
      allowed-methods: GET,POST,PUT,DELETE,OPTIONS
      allowed-headers: "*"
      allow-credentials: true
      max-age: 3600
  
  cache:
    ttl: 300  # 5 minutes
    max-size: 10000
  
  rate-limiting:
    enabled: true
    requests-per-minute: 1000
    burst-capacity: 100
```

### Docker Production Configuration

#### docker-compose.production.yml

```yaml
version: '3.8'

services:
  manager-product-service-1:
    image: ${DOCKER_REGISTRY}/manager-product-service:${BUILD_VERSION}
    container_name: manager-product-prod-1
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: production
      INSTANCE_ID: "prod-1"
      DATABASE_HOST: ${DATABASE_HOST}
      DATABASE_PORT: ${DATABASE_PORT}
      DATABASE_NAME: ${DATABASE_NAME}
      DATABASE_USERNAME: ${DATABASE_USERNAME}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
      DATABASE_READONLY_HOST: ${DATABASE_READONLY_HOST}
      DATABASE_READONLY_USERNAME: ${DATABASE_READONLY_USERNAME}
      DATABASE_READONLY_PASSWORD: ${DATABASE_READONLY_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      REDIS_HOST: ${REDIS_HOST}
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      SSL_KEYSTORE_PASSWORD: ${SSL_KEYSTORE_PASSWORD}
    
    volumes:
      - prod-logs-1:/var/log/manager-product-service
      - prod-ssl-certs:/etc/ssl/certs:ro
      - prod-config:/app/config:ro
    
    secrets:
      - prod_db_password
      - prod_jwt_secret
      - ssl_keystore_password
    
    healthcheck:
      test: ["CMD", "curl", "-f", "-k", "https://localhost:8080/actuator/health/readiness"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 120s
    
    restart: unless-stopped
    
    networks:
      - prod-network
    
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2.0'
        reservations:
          memory: 2G
          cpus: '1.0'
      
      restart_policy:
        condition: on-failure
        delay: 30s
        max_attempts: 3
        window: 120s
    
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "5"
        labels: "service=manager-product,environment=production,instance=1"

  manager-product-service-2:
    image: ${DOCKER_REGISTRY}/manager-product-service:${BUILD_VERSION}
    container_name: manager-product-prod-2
    ports:
      - "8081:8080"
    environment:
      SPRING_PROFILES_ACTIVE: production
      INSTANCE_ID: "prod-2"
      # Same environment variables as service-1
    
    volumes:
      - prod-logs-2:/var/log/manager-product-service
      - prod-ssl-certs:/etc/ssl/certs:ro
      - prod-config:/app/config:ro
    
    secrets:
      - prod_db_password
      - prod_jwt_secret
      - ssl_keystore_password
    
    healthcheck:
      test: ["CMD", "curl", "-f", "-k", "https://localhost:8080/actuator/health/readiness"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 120s
    
    restart: unless-stopped
    
    networks:
      - prod-network
    
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2.0'
        reservations:
          memory: 2G
          cpus: '1.0'
    
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "5"
        labels: "service=manager-product,environment=production,instance=2"

  nginx-load-balancer:
    image: nginx:1.25-alpine
    container_name: nginx-prod-lb
    ports:
      - "443:443"
      - "80:80"
    
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - prod-ssl-certs:/etc/ssl/certs:ro
      - nginx-logs:/var/log/nginx
    
    depends_on:
      - manager-product-service-1
      - manager-product-service-2
    
    networks:
      - prod-network
    
    restart: unless-stopped
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 5s
      retries: 3

volumes:
  prod-logs-1:
    driver: local
  prod-logs-2:
    driver: local
  prod-ssl-certs:
    driver: local
  prod-config:
    driver: local
  nginx-logs:
    driver: local

networks:
  prod-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.30.0.0/16

secrets:
  prod_db_password:
    external: true
  prod_jwt_secret:
    external: true
  ssl_keystore_password:
    external: true
```

#### nginx.prod.conf

```nginx
events {
    worker_connections 1024;
}

http {
    upstream manager_product_backend {
        least_conn;
        server manager-product-service-1:8080 max_fails=3 fail_timeout=30s;
        server manager-product-service-2:8080 max_fails=3 fail_timeout=30s;
    }
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=health:10m rate=1r/s;
    
    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                   '$status $body_bytes_sent "$http_referer" '
                   '"$http_user_agent" "$http_x_forwarded_for" '
                   'rt=$request_time uct="$upstream_connect_time" '
                   'uht="$upstream_header_time" urt="$upstream_response_time"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name api.company.com;
        return 301 https://$server_name$request_uri;
    }
    
    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name api.company.com;
        
        ssl_certificate /etc/ssl/certs/api.company.com.crt;
        ssl_certificate_key /etc/ssl/certs/api.company.com.key;
        
        # Health check endpoint (no rate limiting)
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
        
        # Actuator endpoints (restricted)
        location /actuator/ {
            limit_req zone=health burst=5 nodelay;
            
            # IP whitelist for monitoring systems
            allow 10.0.0.0/8;
            allow 172.16.0.0/12;
            allow 192.168.0.0/16;
            deny all;
            
            proxy_pass https://manager_product_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # API endpoints
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass https://manager_product_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeouts
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
        
        # Default location
        location / {
            return 404;
        }
    }
}
```

## Security Best Practices

### 1. Network Security

#### Firewall Configuration

```bash
#!/bin/bash
# production-firewall.sh

# Allow SSH (restricted to management IPs)
ufw allow from 10.0.0.0/8 to any port 22

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow application ports (internal only)
ufw allow from 172.30.0.0/16 to any port 8080
ufw allow from 172.30.0.0/16 to any port 8081

# Allow database access (internal only)
ufw allow from 172.30.0.0/16 to any port 5432

# Allow Redis access (internal only)
ufw allow from 172.30.0.0/16 to any port 6379

# Deny all other traffic
ufw default deny incoming
ufw default allow outgoing

# Enable firewall
ufw --force enable
```

#### Network Segmentation

```yaml
# docker-compose network configuration
networks:
  prod-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.30.0.0/16
          gateway: 172.30.0.1
    driver_opts:
      com.docker.network.bridge.enable_icc: "false"
      com.docker.network.bridge.enable_ip_masquerade: "true"
      com.docker.network.bridge.host_binding_ipv4: "172.30.0.1"
```

### 2. Application Security

#### Security Configuration Class

```kotlin
@Configuration
@EnableWebSecurity
@Profile("production")
class ProductionSecurityConfig {
    
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        return http
            .requiresChannel { channel ->
                channel.requestMatchers(RequestMatcher { true })
                    .requiresSecure()
            }
            .headers { headers ->
                headers
                    .frameOptions().deny()
                    .contentTypeOptions().and()
                    .httpStrictTransportSecurity { hstsConfig ->
                        hstsConfig
                            .maxAgeInSeconds(31536000)
                            .includeSubdomains(true)
                    }
            }
            .sessionManagement { session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            }
            .csrf { csrf ->
                csrf.disable()
            }
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers("/actuator/health/**").permitAll()
                    .requestMatchers("/actuator/**").hasRole("ACTUATOR")
                    .requestMatchers("/api/**").authenticated()
                    .anyRequest().denyAll()
            }
            .oauth2ResourceServer { oauth2 ->
                oauth2.jwt { jwt ->
                    jwt.decoder(jwtDecoder())
                }
            }
            .build()
    }
    
    @Bean
    fun jwtDecoder(): JwtDecoder {
        val decoder = NimbusJwtDecoder.withSecretKey(
            SecretKeySpec(jwtSecret.toByteArray(), "HmacSHA256")
        ).build()
        
        decoder.setJwtValidator(jwtValidator())
        return decoder
    }
    
    @Bean
    fun jwtValidator(): Oauth2TokenValidator<Jwt> {
        val validators = listOf(
            JwtTimestampValidator(),
            JwtIssuerValidator("manager-product-service"),
            JwtAudienceValidator(listOf("api"))
        )
        return DelegatingOauth2TokenValidator(validators)
    }
}
```

#### Input Validation and Sanitization

```kotlin
@RestController
@RequestMapping("/api/products")
@Validated
class ProductController {
    
    @PostMapping
    fun createProduct(
        @Valid @RequestBody request: CreateProductRequest
    ): ResponseEntity<ProductResponse> {
        // Input is automatically validated by @Valid annotation
        return ResponseEntity.ok(productService.createProduct(request))
    }
}

@JsonIgnoreProperties(ignoreUnknown = true)
data class CreateProductRequest(
    @field:NotBlank(message = "Product name is required")
    @field:Size(min = 1, max = 100, message = "Product name must be between 1 and 100 characters")
    @field:Pattern(regexp = "^[a-zA-Z0-9\\s\\-_]+$", message = "Product name contains invalid characters")
    val name: String,
    
    @field:NotNull(message = "Price is required")
    @field:DecimalMin(value = "0.01", message = "Price must be greater than 0")
    @field:DecimalMax(value = "999999.99", message = "Price must be less than 1,000,000")
    val price: BigDecimal,
    
    @field:Size(max = 500, message = "Description must be less than 500 characters")
    val description: String? = null
)
```

### 3. Secrets Management

#### Using HashiCorp Vault

```bash
#!/bin/bash
# vault-setup.sh

# Store secrets in Vault
vault kv put secret/manager-product-service/production \
    database_password="$(openssl rand -base64 32)" \
    jwt_secret="$(openssl rand -base64 64)" \
    redis_password="$(openssl rand -base64 32)" \
    ssl_keystore_password="$(openssl rand -base64 32)"

# Create policy for application
vault policy write manager-product-service-prod - <<EOF
path "secret/data/manager-product-service/production" {
  capabilities = ["read"]
}
EOF

# Create role for Kubernetes service account
vault write auth/kubernetes/role/manager-product-service \
    bound_service_account_names=manager-product-service \
    bound_service_account_namespaces=production \
    policies=manager-product-service-prod \
    ttl=24h
```

#### Kubernetes Secrets Integration

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: manager-product-secrets
  namespace: production
type: Opaque
data:
  database-password: <base64-encoded-password>
  jwt-secret: <base64-encoded-secret>
  redis-password: <base64-encoded-password>
  ssl-keystore-password: <base64-encoded-password>
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: manager-product-service
  namespace: production
spec:
  template:
    spec:
      containers:
      - name: manager-product-service
        image: manager-product-service:latest
        env:
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: manager-product-secrets
              key: database-password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: manager-product-secrets
              key: jwt-secret
```

## Performance Optimization Settings

### 1. JVM Tuning

#### Production JVM Configuration

```bash
#!/bin/bash
# jvm-production.sh

export JAVA_OPTS="
    # Heap Settings
    -Xms4g
    -Xmx4g
    
    # Garbage Collection
    -XX:+UseG1GC
    -XX:MaxGCPauseMillis=200
    -XX:G1HeapRegionSize=16m
    -XX:+UseStringDeduplication
    
    # JIT Compilation
    -XX:+TieredCompilation
    -XX:TieredStopAtLevel=4
    
    # Memory Management
    -XX:+UseCompressedOops
    -XX:+UseCompressedClassPointers
    
    # Monitoring and Debugging
    -XX:+HeapDumpOnOutOfMemoryError
    -XX:HeapDumpPath=/var/log/manager-product-service/
    -XX:+PrintGCDetails
    -XX:+PrintGCTimeStamps
    -Xloggc:/var/log/manager-product-service/gc.log
    
    # Security
    -Djava.security.egd=file:/dev/./urandom
    
    # Network
    -Djava.net.preferIPv4Stack=true
    
    # Application-specific
    -Dspring.profiles.active=production
    -Dfile.encoding=UTF-8
"
```

### 2. Database Optimization

#### Connection Pool Configuration

```yaml
spring:
  datasource:
    primary:
      hikari:
        # Pool sizing
        maximum-pool-size: 50
        minimum-idle: 10
        
        # Connection management
        connection-timeout: 30000
        idle-timeout: 600000
        max-lifetime: 1800000
        
        # Performance
        leak-detection-threshold: 60000
        validation-timeout: 5000
        
        # Connection properties
        data-source-properties:
          cachePrepStmts: true
          prepStmtCacheSize: 250
          prepStmtCacheSqlLimit: 2048
          useServerPrepStmts: true
          useLocalSessionState: true
          rewriteBatchedStatements: true
          cacheResultSetMetadata: true
          cacheServerConfiguration: true
          elideSetAutoCommits: true
          maintainTimeStats: false
```

#### Database Indexes and Optimization

```sql
-- Production database optimizations

-- Create indexes for frequently queried columns
CREATE INDEX CONCURRENTLY idx_products_name ON products(name);
CREATE INDEX CONCURRENTLY idx_products_category_id ON products(category_id);
CREATE INDEX CONCURRENTLY idx_products_created_at ON products(created_at);
CREATE INDEX CONCURRENTLY idx_products_status ON products(status);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_products_category_status ON products(category_id, status);
CREATE INDEX CONCURRENTLY idx_products_name_status ON products(name, status) WHERE status = 'ACTIVE';

-- Analyze tables for query optimization
ANALYZE products;
ANALYZE categories;

-- Set up automatic statistics collection
ALTER TABLE products SET (autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE products SET (autovacuum_vacuum_scale_factor = 0.05);
```

### 3. Caching Strategy

#### Redis Configuration

```yaml
spring:
  redis:
    host: ${REDIS_HOST}
    port: ${REDIS_PORT}
    password: ${REDIS_PASSWORD}
    timeout: 2000ms
    
    lettuce:
      pool:
        max-active: 20
        max-idle: 10
        min-idle: 5
        max-wait: 2000ms
      
      cluster:
        refresh:
          adaptive: true
          period: 30s

  cache:
    type: redis
    redis:
      time-to-live: 300000  # 5 minutes
      cache-null-values: false
      key-prefix: "manager-product:"
```

#### Application-Level Caching

```kotlin
@Configuration
@EnableCaching
class CacheConfig {
    
    @Bean
    fun cacheManager(redisConnectionFactory: RedisConnectionFactory): CacheManager {
        val config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(5))
            .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(GenericJackson2JsonRedisSerializer()))
            .disableCachingNullValues()
        
        return RedisCacheManager.builder(redisConnectionFactory)
            .cacheDefaults(config)
            .withCacheConfiguration("products", config.entryTtl(Duration.ofMinutes(10)))
            .withCacheConfiguration("categories", config.entryTtl(Duration.ofHours(1)))
            .build()
    }
}

@Service
class ProductService {
    
    @Cacheable(value = ["products"], key = "#id")
    fun getProduct(id: Long): Product? {
        return productRepository.findById(id).orElse(null)
    }
    
    @CacheEvict(value = ["products"], key = "#product.id")
    fun updateProduct(product: Product): Product {
        return productRepository.save(product)
    }
}
```

## Monitoring Configuration

### 1. Application Monitoring

#### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "manager-product-service.rules.yml"

scrape_configs:
  - job_name: 'manager-product-service'
    static_configs:
      - targets: 
        - 'api.company.com:443'
    metrics_path: '/actuator/prometheus'
    scheme: https
    scrape_interval: 30s
    scrape_timeout: 10s
    
    basic_auth:
      username: 'prometheus'
      password: '${PROMETHEUS_PASSWORD}'

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

#### Alerting Rules

```yaml
# manager-product-service.rules.yml
groups:
  - name: manager-product-service
    rules:
      - alert: ApplicationDown
        expr: up{job="manager-product-service"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Manager Product Service is down"
          description: "Manager Product Service has been down for more than 1 minute"
      
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_server_requests_seconds_bucket{job="manager-product-service"}[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s"
      
      - alert: HighErrorRate
        expr: rate(http_server_requests_total{job="manager-product-service",status=~"5.."}[5m]) / rate(http_server_requests_total{job="manager-product-service"}[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"
      
      - alert: DatabaseConnectionPoolExhausted
        expr: hikaricp_connections_active{job="manager-product-service"} / hikaricp_connections_max{job="manager-product-service"} > 0.9
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "Connection pool usage is {{ $value | humanizePercentage }}"
```

### 2. Log Management

#### ELK Stack Configuration

```yaml
# logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][service] == "manager-product-service" and [fields][environment] == "production" {
    
    # Parse application logs
    grok {
      match => { 
        "message" => "%{TIMESTAMP_ISO8601:timestamp} \[%{DATA:thread}\] %{LOGLEVEL:level} \[%{DATA:trace_id},%{DATA:span_id}\] %{DATA:logger} - %{GREEDYDATA:log_message}" 
      }
    }
    
    # Parse timestamp
    date {
      match => [ "timestamp", "yyyy-MM-dd HH:mm:ss.SSS" ]
    }
    
    # Add environment tags
    mutate {
      add_tag => ["production", "manager-product-service"]
      add_field => { "service" => "manager-product-service" }
      add_field => { "environment" => "production" }
    }
    
    # Parse JSON logs if present
    if [log_message] =~ /^\{.*\}$/ {
      json {
        source => "log_message"
        target => "json_log"
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch-cluster:9200"]
    index => "manager-product-service-production-%{+YYYY.MM.dd}"
    
    # Use document template
    template_name => "manager-product-service"
    template => "/etc/logstash/templates/manager-product-service.json"
    template_overwrite => true
  }
}
```

#### Fluentd Configuration (Alternative)

```yaml
# fluent.conf
<source>
  @type tail
  path /var/log/manager-product-service/application.log
  pos_file /var/log/fluentd/manager-product-service.log.pos
  tag manager-product-service.application
  format multiline
  format_firstline /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/
  format1 /^(?<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}) \[(?<thread>[^\]]+)\] (?<level>\w+) \[(?<trace_id>[^,]*),(?<span_id>[^\]]*)\] (?<logger>[^\s]+) - (?<message>.*)/
</source>

<filter manager-product-service.**>
  @type record_transformer
  <record>
    service manager-product-service
    environment production
    hostname "#{Socket.gethostname}"
  </record>
</filter>

<match manager-product-service.**>
  @type elasticsearch
  host elasticsearch-cluster
  port 9200
  index_name manager-product-service-production
  type_name _doc
  
  <buffer>
    @type file
    path /var/log/fluentd/buffers/manager-product-service
    flush_mode interval
    flush_interval 10s
    chunk_limit_size 8m
    queue_limit_length 32
    retry_max_interval 30
    retry_forever true
  </buffer>
</match>
```

### 3. Infrastructure Monitoring

#### System Metrics Collection

```yaml
# node_exporter configuration
version: '3.8'
services:
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    restart: unless-stopped
    networks:
      - monitoring

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cadvisor
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    privileged: true
    devices:
      - /dev/kmsg
    restart: unless-stopped
    networks:
      - monitoring
```

## Disaster Recovery and Backup Procedures

### 1. Database Backup Strategy

#### Automated Backup Script

```bash
#!/bin/bash
# production-backup.sh

set -euo pipefail

# Configuration
DB_HOST="${DATABASE_HOST}"
DB_PORT="${DATABASE_PORT}"
DB_NAME="${DATABASE_NAME}"
DB_USER="${DATABASE_USERNAME}"
BACKUP_DIR="/var/backups/postgresql"
RETENTION_DAYS=30
S3_BUCKET="company-backups"
S3_PREFIX="manager-product-service/production"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/manager_product_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

echo "🔄 Starting database backup: ${BACKUP_FILE}"

# Create database backup
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
    --verbose --clean --if-exists --create \
    --format=custom --compress=9 \
    --file="${BACKUP_FILE}"

# Compress backup
gzip "${BACKUP_FILE}"

# Verify backup integrity
pg_restore --list "${COMPRESSED_FILE}" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backup verification successful"
else
    echo "❌ Backup verification failed"
    exit 1
fi

# Upload to S3
aws s3 cp "${COMPRESSED_FILE}" "s3://${S3_BUCKET}/${S3_PREFIX}/$(basename ${COMPRESSED_FILE})"
if [ $? -eq 0 ]; then
    echo "✅ Backup uploaded to S3"
else
    echo "❌ S3 upload failed"
    exit 1
fi

# Clean up old local backups
find "${BACKUP_DIR}" -name "manager_product_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

# Clean up old S3 backups
aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" | \
    awk '{print $4}' | \
    head -n -${RETENTION_DAYS} | \
    xargs -I {} aws s3 rm "s3://${S3_BUCKET}/${S3_PREFIX}/{}"

echo "✅ Backup completed successfully: ${COMPRESSED_FILE}"
```

#### Backup Cron Job

```bash
# Add to crontab
# Daily backup at 2 AM
0 2 * * * /opt/scripts/production-backup.sh >> /var/log/backup.log 2>&1

# Weekly full backup on Sunday at 1 AM
0 1 * * 0 /opt/scripts/production-full-backup.sh >> /var/log/backup.log 2>&1
```

### 2. Application State Backup

#### Configuration Backup

```bash
#!/bin/bash
# config-backup.sh

BACKUP_DIR="/var/backups/config"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONFIG_BACKUP="${BACKUP_DIR}/config_${TIMESTAMP}.tar.gz"

mkdir -p "${BACKUP_DIR}"

# Backup configuration files
tar -czf "${CONFIG_BACKUP}" \
    /opt/manager-product-service/docker-compose.production.yml \
    /opt/manager-product-service/.env.production \
    /etc/nginx/nginx.conf \
    /etc/ssl/certs/ \
    /opt/manager-product-service/config/

# Upload to S3
aws s3 cp "${CONFIG_BACKUP}" "s3://${S3_BUCKET}/config/$(basename ${CONFIG_BACKUP})"

echo "✅ Configuration backup completed: ${CONFIG_BACKUP}"
```

### 3. Disaster Recovery Procedures

#### Recovery Runbook

```bash
#!/bin/bash
# disaster-recovery.sh

set -euo pipefail

RECOVERY_TYPE="${1:-full}"  # full, partial, config-only
BACKUP_DATE="${2:-latest}"

echo "🚨 Starting disaster recovery: ${RECOVERY_TYPE}"

case "${RECOVERY_TYPE}" in
    "full")
        echo "🔄 Full system recovery"
        
        # 1. Stop all services
        docker-compose -f docker-compose.production.yml down
        
        # 2. Restore database
        ./restore-database.sh "${BACKUP_DATE}"
        
        # 3. Restore configuration
        ./restore-config.sh "${BACKUP_DATE}"
        
        # 4. Start services
        docker-compose -f docker-compose.production.yml up -d
        
        # 5. Verify recovery
        ./verify-recovery.sh
        ;;
        
    "partial")
        echo "🔄 Partial recovery (application only)"
        
        # 1. Stop application services
        docker-compose -f docker-compose.production.yml stop manager-product-service-1 manager-product-service-2
        
        # 2. Restore configuration
        ./restore-config.sh "${BACKUP_DATE}"
        
        # 3. Start application services
        docker-compose -f docker-compose.production.yml up -d manager-product-service-1 manager-product-service-2
        
        # 4. Verify recovery
        ./verify-recovery.sh
        ;;
        
    "config-only")
        echo "🔄 Configuration recovery only"
        
        # 1. Restore configuration
        ./restore-config.sh "${BACKUP_DATE}"
        
        # 2. Reload services
        docker-compose -f docker-compose.production.yml restart
        ;;
        
    *)
        echo "❌ Invalid recovery type: ${RECOVERY_TYPE}"
        echo "Usage: $0 [full|partial|config-only] [backup-date]"
        exit 1
        ;;
esac

echo "✅ Disaster recovery completed"
```

#### Database Recovery Script

```bash
#!/bin/bash
# restore-database.sh

BACKUP_DATE="${1:-latest}"
RESTORE_DIR="/tmp/restore"
S3_BUCKET="company-backups"
S3_PREFIX="manager-product-service/production"

mkdir -p "${RESTORE_DIR}"

if [ "${BACKUP_DATE}" = "latest" ]; then
    # Get latest backup
    BACKUP_FILE=$(aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" | sort | tail -n 1 | awk '{print $4}')
else
    # Use specific backup date
    BACKUP_FILE="manager_product_${BACKUP_DATE}.sql.gz"
fi

echo "🔄 Restoring database from: ${BACKUP_FILE}"

# Download backup from S3
aws s3 cp "s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_FILE}" "${RESTORE_DIR}/"

# Decompress backup
gunzip "${RESTORE_DIR}/${BACKUP_FILE}"
BACKUP_SQL="${RESTORE_DIR}/${BACKUP_FILE%.gz}"

# Stop application to prevent connections
docker-compose -f docker-compose.production.yml stop manager-product-service-1 manager-product-service-2

# Restore database
pg_restore -h "${DATABASE_HOST}" -p "${DATABASE_PORT}" -U "${DATABASE_USERNAME}" \
    --clean --if-exists --create --verbose \
    --dbname=postgres "${BACKUP_SQL}"

# Verify restoration
psql -h "${DATABASE_HOST}" -p "${DATABASE_PORT}" -U "${DATABASE_USERNAME}" -d "${DATABASE_NAME}" \
    -c "SELECT COUNT(*) FROM products;"

echo "✅ Database restoration completed"
```

## Production Deployment Checklist

### Pre-Deployment Checklist

```markdown
## Pre-Deployment Checklist

### Infrastructure
- [ ] Production servers provisioned and configured
- [ ] Load balancer configured and tested
- [ ] SSL certificates installed and validated
- [ ] Firewall rules configured
- [ ] DNS records configured
- [ ] Monitoring systems configured

### Database
- [ ] Production database provisioned
- [ ] Database migrations tested
- [ ] Database backups configured
- [ ] Read replicas configured (if applicable)
- [ ] Connection pooling configured

### Security
- [ ] Secrets management configured
- [ ] SSL/TLS certificates valid
- [ ] Security headers configured
- [ ] Access controls implemented
- [ ] Vulnerability scan completed

### Application
- [ ] Application built and tested
- [ ] Docker images pushed to registry
- [ ] Configuration files reviewed
- [ ] Environment variables configured
- [ ] Health checks implemented

### Monitoring
- [ ] Application monitoring configured
- [ ] Infrastructure monitoring configured
- [ ] Log aggregation configured
- [ ] Alerting rules configured
- [ ] Dashboards created

### Backup & Recovery
- [ ] Backup procedures tested
- [ ] Recovery procedures documented
- [ ] Disaster recovery plan reviewed
- [ ] RTO/RPO requirements defined
```

### Post-Deployment Validation

```bash
#!/bin/bash
# post-deployment-validation.sh

PRODUCTION_URL="https://api.company.com"
TIMEOUT=300  # 5 minutes

echo "🔍 Post-deployment validation"

# Wait for application to be ready
echo "Waiting for application to be ready..."
for i in $(seq 1 $((TIMEOUT/10))); do
    if curl -f "${PRODUCTION_URL}/actuator/health/readiness" > /dev/null 2>&1; then
        echo "✅ Application is ready"
        break
    fi
    
    if [ $i -eq $((TIMEOUT/10)) ]; then
        echo "❌ Application failed to become ready within ${TIMEOUT} seconds"
        exit 1
    fi
    
    sleep 10
done

# Run validation tests
echo "Running validation tests..."

# Health checks
curl -f "${PRODUCTION_URL}/actuator/health" || exit 1
curl -f "${PRODUCTION_URL}/actuator/health/liveness" || exit 1
curl -f "${PRODUCTION_URL}/actuator/health/readiness" || exit 1

# Performance test
response_time=$(curl -o /dev/null -s -w "%{time_total}" "${PRODUCTION_URL}/actuator/health")
if (( $(echo "$response_time > 2.0" | bc -l) )); then
    echo "❌ Response time too high: ${response_time}s"
    exit 1
fi

# SSL certificate validation
echo | openssl s_client -servername api.company.com -connect api.company.com:443 2>/dev/null | \
    openssl x509 -noout -dates

echo "✅ Post-deployment validation completed successfully"
```

## Troubleshooting Production Issues

### Common Production Problems

#### 1. High Memory Usage

**Diagnosis**:
```bash
# Check JVM memory usage
curl -s https://api.company.com/actuator/metrics/jvm.memory.used | jq '.measurements[0].value'

# Check heap dump
jcmd <pid> GC.run_finalization
jcmd <pid> VM.gc
jcmd <pid> GC.heap_dump /tmp/heapdump.hprof

# Analyze with MAT or VisualVM
```

**Solutions**:
- Increase heap size if needed
- Check for memory leaks
- Optimize caching strategy
- Review object lifecycle

#### 2. Database Connection Issues

**Diagnosis**:
```bash
# Check connection pool metrics
curl -s https://api.company.com/actuator/metrics/hikaricp.connections.active

# Check database connections
docker exec postgres-prod psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Check connection pool configuration
docker logs manager-product-prod-1 | grep -i hikari
```

**Solutions**:
- Adjust connection pool settings
- Check database server capacity
- Review connection timeout settings
- Implement connection retry logic

#### 3. Performance Degradation

**Diagnosis**:
```bash
# Check response time metrics
curl -s https://api.company.com/actuator/metrics/http.server.requests

# Check database query performance
docker exec postgres-prod psql -U postgres -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check system resources
docker stats manager-product-prod-1
```

**Solutions**:
- Optimize slow queries
- Review and tune JVM settings
- Scale horizontally if needed
- Implement caching for frequently accessed data

> ✅ **Success**: Your production environment is now fully configured with comprehensive security, monitoring, and disaster recovery procedures!