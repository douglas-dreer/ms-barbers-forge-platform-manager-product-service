#!/bin/bash

# Health Monitoring Script for Manager Product Service
# Usage: ./health-monitor.sh [--continuous] [--alert-webhook=URL]

set -euo pipefail

# Configuration
SERVICES=("postgres-db" "manager-product-service")
CHECK_INTERVAL=30
LOG_FILE="/var/log/health-monitor.log"
ALERT_WEBHOOK=""
CONTINUOUS=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --continuous)
            CONTINUOUS=true
            shift
            ;;
        --alert-webhook=*)
            ALERT_WEBHOOK="${1#*=}"
            shift
            ;;
        --help)
            echo "Usage: $0 [--continuous] [--alert-webhook=URL]"
            echo "  --continuous: Run continuously with $CHECK_INTERVAL second intervals"
            echo "  --alert-webhook: Send alerts to specified webhook URL"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Send alert function
send_alert() {
    local service=$1
    local status=$2
    local message=$3
    
    if [[ -n "$ALERT_WEBHOOK" ]]; then
        local payload=$(cat <<EOF
{
    "service": "$service",
    "status": "$status",
    "message": "$message",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "hostname": "$(hostname)"
}
EOF
)
        curl -s -X POST -H "Content-Type: application/json" -d "$payload" "$ALERT_WEBHOOK" || true
    fi
}

# Check Docker service health
check_docker_health() {
    local service=$1
    local container_name
    
    # Get container name
    container_name=$(docker compose ps -q "$service" 2>/dev/null || echo "")
    
    if [[ -z "$container_name" ]]; then
        echo "not_running"
        return
    fi
    
    # Check if container is running
    local state=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null || echo "unknown")
    
    if [[ "$state" != "running" ]]; then
        echo "$state"
        return
    fi
    
    # Check health status if available
    local health=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no_healthcheck{{end}}' "$container_name" 2>/dev/null || echo "unknown")
    
    echo "$health"
}

# Check application endpoints
check_application_endpoints() {
    local base_url="http://localhost:8080"
    local endpoints=("/actuator/health" "/actuator/info")
    local all_healthy=true
    
    for endpoint in "${endpoints[@]}"; do
        local url="$base_url$endpoint"
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10 || echo "000")
        
        if [[ "$response_code" == "200" ]]; then
            log "INFO" "Endpoint $endpoint: OK ($response_code)"
        else
            log "ERROR" "Endpoint $endpoint: FAILED ($response_code)"
            all_healthy=false
        fi
    done
    
    if $all_healthy; then
        echo "healthy"
    else
        echo "unhealthy"
    fi
}

# Check database connectivity
check_database_connectivity() {
    local db_container="postgres-db"
    local db_name="${DATABASE_NAME:-manager_product_db}"
    local db_user="${DATABASE_USERNAME:-postgres}"
    
    # Test database connection
    local result=$(docker compose exec -T "$db_container" pg_isready -U "$db_user" -d "$db_name" 2>/dev/null || echo "failed")
    
    if [[ "$result" == *"accepting connections"* ]]; then
        echo "healthy"
    else
        echo "unhealthy"
    fi
}

# Check resource usage
check_resource_usage() {
    local service=$1
    local container_name
    
    container_name=$(docker compose ps -q "$service" 2>/dev/null || echo "")
    
    if [[ -z "$container_name" ]]; then
        return
    fi
    
    # Get resource stats
    local stats=$(docker stats --no-stream --format "{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}}" "$container_name" 2>/dev/null || echo "0%,0B / 0B,0%")
    
    IFS=',' read -r cpu_perc mem_usage mem_perc <<< "$stats"
    
    # Extract numeric values for comparison
    local cpu_num=$(echo "$cpu_perc" | sed 's/%//')
    local mem_num=$(echo "$mem_perc" | sed 's/%//')
    
    # Check thresholds
    if (( $(echo "$cpu_num > 80" | bc -l) )); then
        log "WARN" "$service: High CPU usage: $cpu_perc"
        send_alert "$service" "warning" "High CPU usage: $cpu_perc"
    fi
    
    if (( $(echo "$mem_num > 85" | bc -l) )); then
        log "WARN" "$service: High memory usage: $mem_perc ($mem_usage)"
        send_alert "$service" "warning" "High memory usage: $mem_perc"
    fi
    
    log "INFO" "$service resources: CPU=$cpu_perc, Memory=$mem_perc"
}

# Main health check function
perform_health_check() {
    local overall_status="healthy"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo -e "${YELLOW}=== Health Check Report - $timestamp ===${NC}"
    
    # Check each service
    for service in "${SERVICES[@]}"; do
        local health_status=$(check_docker_health "$service")
        
        case "$health_status" in
            "healthy"|"no_healthcheck")
                echo -e "${GREEN}✓${NC} $service: $health_status"
                log "INFO" "$service: $health_status"
                
                # Check resource usage for running services
                check_resource_usage "$service"
                ;;
            "unhealthy"|"starting")
                echo -e "${YELLOW}⚠${NC} $service: $health_status"
                log "WARN" "$service: $health_status"
                send_alert "$service" "warning" "Service status: $health_status"
                overall_status="degraded"
                ;;
            *)
                echo -e "${RED}✗${NC} $service: $health_status"
                log "ERROR" "$service: $health_status"
                send_alert "$service" "critical" "Service status: $health_status"
                overall_status="unhealthy"
                ;;
        esac
    done
    
    # Check application endpoints
    echo -e "\n${YELLOW}Application Endpoints:${NC}"
    local endpoint_status=$(check_application_endpoints)
    
    if [[ "$endpoint_status" == "healthy" ]]; then
        echo -e "${GREEN}✓${NC} Application endpoints: healthy"
    else
        echo -e "${RED}✗${NC} Application endpoints: unhealthy"
        overall_status="unhealthy"
    fi
    
    # Check database connectivity
    echo -e "\n${YELLOW}Database Connectivity:${NC}"
    local db_status=$(check_database_connectivity)
    
    if [[ "$db_status" == "healthy" ]]; then
        echo -e "${GREEN}✓${NC} Database: healthy"
    else
        echo -e "${RED}✗${NC} Database: unhealthy"
        overall_status="unhealthy"
    fi
    
    # Overall status
    echo -e "\n${YELLOW}Overall Status:${NC}"
    case "$overall_status" in
        "healthy")
            echo -e "${GREEN}✓ HEALTHY${NC} - All services are running normally"
            ;;
        "degraded")
            echo -e "${YELLOW}⚠ DEGRADED${NC} - Some services have warnings"
            ;;
        "unhealthy")
            echo -e "${RED}✗ UNHEALTHY${NC} - Critical issues detected"
            send_alert "system" "critical" "System health check failed"
            ;;
    esac
    
    echo "=================================="
    
    return $([ "$overall_status" = "healthy" ] && echo 0 || echo 1)
}

# Cleanup function
cleanup() {
    log "INFO" "Health monitor stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    
    log "INFO" "Health monitor started (continuous: $CONTINUOUS)"
    
    if $CONTINUOUS; then
        while true; do
            perform_health_check
            sleep "$CHECK_INTERVAL"
        done
    else
        perform_health_check
    fi
}

# Check if bc is available for numeric comparisons
if ! command -v bc &> /dev/null; then
    echo "Warning: 'bc' command not found. Resource usage thresholds will be skipped."
fi

# Run main function
main "$@"