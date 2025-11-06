# Docker Security Checklist

Security best practices and checklist for containerizing the Manager Product Service in production environments.

## 🔒 Container Security Checklist

### ✅ Image Security

- [ ] **Use official base images**: Using `eclipse-temurin:21-jre-alpine` for minimal attack surface
- [ ] **Multi-stage builds**: Separate build and runtime environments
- [ ] **Non-root user**: Application runs as non-privileged user (`appuser`)
- [ ] **Minimal packages**: Only essential packages installed in runtime image
- [ ] **Regular updates**: Base images updated regularly for security patches
- [ ] **Image scanning**: Integrate vulnerability scanning in CI/CD pipeline
- [ ] **Signed images**: Use Docker Content Trust for image signing

### ✅ Runtime Security

- [ ] **Resource limits**: CPU and memory limits configured
- [ ] **Read-only filesystem**: Container filesystem mounted as read-only where possible
- [ ] **No privileged containers**: Containers run without `--privileged` flag
- [ ] **Security profiles**: AppArmor/SELinux profiles applied
- [ ] **Capabilities dropped**: Unnecessary Linux capabilities removed
- [ ] **Secrets management**: Sensitive data managed via Docker secrets or external systems

### ✅ Network Security

- [ ] **Custom networks**: Services use custom Docker networks, not default bridge
- [ ] **Port exposure**: Only necessary ports exposed to host
- [ ] **TLS encryption**: All external communication encrypted
- [ ] **Network policies**: Ingress/egress traffic controlled
- [ ] **Reverse proxy**: Application behind reverse proxy (nginx)

### ✅ Data Security

- [ ] **Volume encryption**: Persistent volumes encrypted at rest
- [ ] **Backup encryption**: Database backups encrypted
- [ ] **Access controls**: Database access restricted to application only
- [ ] **Data retention**: Sensitive data retention policies implemented

## 🛡️ Production Security Configuration

### Dockerfile Security Enhancements

```dockerfile
# Security-hardened production Dockerfile
FROM eclipse-temurin:21.0.1_12-jre-alpine AS production

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init curl && \
    rm -rf /var/cache/apk/*

# Create non-root user with specific UID/GID
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -S appuser -G appuser

# Set up application directory with proper permissions
WORKDIR /app
RUN chown appuser:appuser /app

# Copy application with proper ownership
COPY --from=builder --chown=appuser:appuser /app/build/libs/*.jar app.jar

# Switch to non-root user
USER appuser

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Secure JVM settings
CMD ["java", \
     "-server", \
     "-XX:+UseContainerSupport", \
     "-XX:+UseG1GC", \
     "-Djava.security.egd=file:/dev/./urandom", \
     "-Dspring.profiles.active=prod", \
     "-jar", "app.jar"]
```

### Docker Compose Security Configuration

```yaml
# Production security configuration
services:
  manager-product-service:
    # Security options
    security_opt:
      - no-new-privileges:true
    
    # Read-only root filesystem
    read_only: true
    
    # Temporary filesystems for writable directories
    tmpfs:
      - /tmp:noexec,nosuid,size=100m
      - /app/logs:noexec,nosuid,size=50m
    
    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    
    # Restart policy
    restart: unless-stopped
    
    # User specification
    user: "1001:1001"
    
    # Drop capabilities
    cap_drop:
      - ALL
    
    # Add only required capabilities
    cap_add:
      - NET_BIND_SERVICE  # Only if binding to privileged ports
```

### Secrets Management

#### Using Docker Secrets

```yaml
# docker-compose.prod.yml with secrets
services:
  postgres-db:
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
      - db_user

  manager-product-service:
    environment:
      SPRING_DATASOURCE_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
      - jwt_secret

secrets:
  db_password:
    external: true
  db_user:
    external: true
  jwt_secret:
    external: true
```

#### Creating Secrets

```bash
# Create Docker secrets
echo "your_secure_password" | docker secret create db_password -
echo "postgres" | docker secret create db_user -
echo "your_jwt_secret_key" | docker secret create jwt_secret -
```

### Network Security

#### Custom Network Configuration

```yaml
# Secure network setup
networks:
  frontend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/24
  backend:
    driver: bridge
    internal: true  # No external access
    ipam:
      config:
        - subnet: 172.21.0.0/24

services:
  nginx:
    networks:
      - frontend
  
  manager-product-service:
    networks:
      - frontend
      - backend
  
  postgres-db:
    networks:
      - backend  # Database only accessible internally
```

## 🔍 Security Monitoring

### Container Security Scanning

#### Trivy Security Scanner

```bash
# Install Trivy
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Scan Docker image
trivy image manager-product-service:latest

# Scan for high and critical vulnerabilities only
trivy image --severity HIGH,CRITICAL manager-product-service:latest

# Generate report
trivy image --format json --output report.json manager-product-service:latest
```

#### Docker Bench Security

```bash
# Run Docker Bench Security
docker run --rm --net host --pid host --userns host --cap-add audit_control \
    -e DOCKER_CONTENT_TRUST=$DOCKER_CONTENT_TRUST \
    -v /etc:/etc:ro \
    -v /usr/bin/containerd:/usr/bin/containerd:ro \
    -v /usr/bin/runc:/usr/bin/runc:ro \
    -v /usr/lib/systemd:/usr/lib/systemd:ro \
    -v /var/lib:/var/lib:ro \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    --label docker_bench_security \
    docker/docker-bench-security
```

### Runtime Security Monitoring

#### Falco Rules for Container Monitoring

```yaml
# Custom Falco rules for Manager Product Service
- rule: Unexpected Network Connection
  desc: Detect unexpected network connections from application container
  condition: >
    (container.name = "manager-product-service" and
     fd.type = ipv4 and
     not fd.ip in (postgres-db, nginx))
  output: >
    Unexpected network connection from application
    (container=%container.name ip=%fd.ip port=%fd.port)
  priority: WARNING

- rule: Suspicious File Access
  desc: Detect access to sensitive files
  condition: >
    (container.name = "manager-product-service" and
     fd.name in (/etc/passwd, /etc/shadow, /etc/hosts) and
     evt.type = open)
  output: >
    Suspicious file access in container
    (container=%container.name file=%fd.name)
  priority: HIGH
```

## 🚨 Incident Response

### Security Incident Checklist

1. **Immediate Response**
   - [ ] Isolate affected containers
   - [ ] Stop compromised services
   - [ ] Preserve logs and evidence
   - [ ] Notify security team

2. **Investigation**
   - [ ] Analyze container logs
   - [ ] Check network traffic
   - [ ] Review access logs
   - [ ] Identify attack vector

3. **Containment**
   - [ ] Update security policies
   - [ ] Patch vulnerabilities
   - [ ] Rotate secrets and keys
   - [ ] Update firewall rules

4. **Recovery**
   - [ ] Deploy clean containers
   - [ ] Restore from backups if needed
   - [ ] Verify system integrity
   - [ ] Monitor for reoccurrence

### Emergency Commands

```bash
# Stop all services immediately
docker compose down

# Remove potentially compromised containers
docker container prune -f

# Check for suspicious processes
docker exec -it container_name ps aux

# Export container logs for analysis
docker logs container_name > incident_logs.txt

# Check container file changes
docker diff container_name

# Inspect container configuration
docker inspect container_name
```

## 📋 Compliance and Auditing

### Security Audit Commands

```bash
# Check container security configuration
docker inspect --format='{{.HostConfig.SecurityOpt}}' container_name

# Verify user configuration
docker exec container_name whoami

# Check file permissions
docker exec container_name ls -la /app

# Verify network configuration
docker network ls
docker network inspect network_name

# Check resource limits
docker stats --no-stream

# Audit Docker daemon configuration
docker system info | grep -i security
```

### Compliance Frameworks

#### CIS Docker Benchmark Compliance

- [ ] **2.1** - Run containers as non-root user
- [ ] **2.2** - Set container resource limits
- [ ] **2.3** - Use read-only root filesystem
- [ ] **2.4** - Drop unnecessary capabilities
- [ ] **2.5** - Use security profiles (AppArmor/SELinux)
- [ ] **2.6** - Enable Docker Content Trust
- [ ] **2.7** - Use secrets management
- [ ] **2.8** - Enable container logging

#### NIST Cybersecurity Framework

- [ ] **Identify**: Asset inventory and risk assessment
- [ ] **Protect**: Access controls and security policies
- [ ] **Detect**: Monitoring and alerting systems
- [ ] **Respond**: Incident response procedures
- [ ] **Recover**: Backup and recovery processes

## 🔧 Security Tools Integration

### CI/CD Security Pipeline

```yaml
# GitHub Actions security workflow
name: Security Scan
on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t manager-product-service:${{ github.sha }} .
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'manager-product-service:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Docker Bench Security
        run: |
          docker run --rm --net host --pid host --userns host --cap-add audit_control \
            -v /etc:/etc:ro \
            -v /var/lib:/var/lib:ro \
            -v /var/run/docker.sock:/var/run/docker.sock:ro \
            docker/docker-bench-security
```

### Automated Security Updates

```bash
#!/bin/bash
# security-update.sh - Automated security update script

# Update base images
docker pull eclipse-temurin:21-jre-alpine

# Rebuild with security updates
docker compose build --no-cache

# Run security scan
trivy image manager-product-service:latest

# Deploy if scan passes
if [ $? -eq 0 ]; then
    docker compose up -d
    echo "Security update deployed successfully"
else
    echo "Security vulnerabilities found, deployment aborted"
    exit 1
fi
```

## 📚 Additional Resources

- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
- [NIST Container Security Guide](https://csrc.nist.gov/publications/detail/sp/800-190/final)
- [OWASP Container Security](https://owasp.org/www-project-container-security/)
- [Kubernetes Security Best Practices](https://kubernetes.io/docs/concepts/security/)