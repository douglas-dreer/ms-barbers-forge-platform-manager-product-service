# Health Monitoring Script for Manager Product Service (PowerShell)
# Usage: .\health-monitor.ps1 [-Continuous] [-AlertWebhook "URL"]

param(
    [switch]$Continuous,
    [string]$AlertWebhook = "",
    [int]$CheckInterval = 30,
    [string]$LogFile = "health-monitor.log"
)

# Configuration
$Services = @("postgres-db", "manager-product-service")

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    White = "White"
}

# Logging function
function Write-Log {
    param(
        [string]$Level,
        [string]$Message
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Write to console with colors
    switch ($Level) {
        "ERROR" { Write-Host $logEntry -ForegroundColor $Colors.Red }
        "WARN" { Write-Host $logEntry -ForegroundColor $Colors.Yellow }
        "INFO" { Write-Host $logEntry -ForegroundColor $Colors.Green }
        default { Write-Host $logEntry -ForegroundColor $Colors.White }
    }
    
    # Write to log file
    Add-Content -Path $LogFile -Value $logEntry
}

# Send alert function
function Send-Alert {
    param(
        [string]$Service,
        [string]$Status,
        [string]$Message
    )
    
    if ($AlertWebhook) {
        $payload = @{
            service = $Service
            status = $Status
            message = $Message
            timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
            hostname = $env:COMPUTERNAME
        } | ConvertTo-Json
        
        try {
            Invoke-RestMethod -Uri $AlertWebhook -Method Post -Body $payload -ContentType "application/json" -ErrorAction SilentlyContinue
        }
        catch {
            Write-Log "ERROR" "Failed to send alert: $_"
        }
    }
}

# Check Docker service health
function Test-DockerHealth {
    param([string]$Service)
    
    try {
        # Get container ID
        $containerId = docker compose ps -q $Service 2>$null
        
        if (-not $containerId) {
            return "not_running"
        }
        
        # Check container state
        $state = docker inspect --format='{{.State.Status}}' $containerId 2>$null
        
        if ($state -ne "running") {
            return $state
        }
        
        # Check health status
        $health = docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no_healthcheck{{end}}' $containerId 2>$null
        
        return $health
    }
    catch {
        return "unknown"
    }
}

# Check application endpoints
function Test-ApplicationEndpoints {
    $baseUrl = "http://localhost:8080"
    $endpoints = @("/actuator/health", "/actuator/info")
    $allHealthy = $true
    
    foreach ($endpoint in $endpoints) {
        $url = "$baseUrl$endpoint"
        
        try {
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 10 -UseBasicParsing
            
            if ($response.StatusCode -eq 200) {
                Write-Log "INFO" "Endpoint $endpoint`: OK ($($response.StatusCode))"
            }
            else {
                Write-Log "ERROR" "Endpoint $endpoint`: FAILED ($($response.StatusCode))"
                $allHealthy = $false
            }
        }
        catch {
            Write-Log "ERROR" "Endpoint $endpoint`: FAILED (Connection error)"
            $allHealthy = $false
        }
    }
    
    return if ($allHealthy) { "healthy" } else { "unhealthy" }
}

# Check database connectivity
function Test-DatabaseConnectivity {
    $dbContainer = "postgres-db"
    $dbName = $env:DATABASE_NAME ?? "manager_product_db"
    $dbUser = $env:DATABASE_USERNAME ?? "postgres"
    
    try {
        $result = docker compose exec -T $dbContainer pg_isready -U $dbUser -d $dbName 2>$null
        
        if ($result -match "accepting connections") {
            return "healthy"
        }
        else {
            return "unhealthy"
        }
    }
    catch {
        return "unhealthy"
    }
}

# Check resource usage
function Test-ResourceUsage {
    param([string]$Service)
    
    try {
        $containerId = docker compose ps -q $Service 2>$null
        
        if (-not $containerId) {
            return
        }
        
        # Get resource stats
        $stats = docker stats --no-stream --format "{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}}" $containerId 2>$null
        
        if ($stats) {
            $parts = $stats -split ","
            $cpuPerc = $parts[0]
            $memUsage = $parts[1]
            $memPerc = $parts[2]
            
            # Extract numeric values
            $cpuNum = [double]($cpuPerc -replace '%', '')
            $memNum = [double]($memPerc -replace '%', '')
            
            # Check thresholds
            if ($cpuNum -gt 80) {
                Write-Log "WARN" "$Service`: High CPU usage: $cpuPerc"
                Send-Alert $Service "warning" "High CPU usage: $cpuPerc"
            }
            
            if ($memNum -gt 85) {
                Write-Log "WARN" "$Service`: High memory usage: $memPerc ($memUsage)"
                Send-Alert $Service "warning" "High memory usage: $memPerc"
            }
            
            Write-Log "INFO" "$Service resources: CPU=$cpuPerc, Memory=$memPerc"
        }
    }
    catch {
        Write-Log "ERROR" "Failed to get resource stats for $Service`: $_"
    }
}

# Main health check function
function Invoke-HealthCheck {
    $overallStatus = "healthy"
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    Write-Host "=== Health Check Report - $timestamp ===" -ForegroundColor Yellow
    
    # Check each service
    foreach ($service in $Services) {
        $healthStatus = Test-DockerHealth $service
        
        switch ($healthStatus) {
            { $_ -in @("healthy", "no_healthcheck") } {
                Write-Host "✓ $service`: $healthStatus" -ForegroundColor Green
                Write-Log "INFO" "$service`: $healthStatus"
                Test-ResourceUsage $service
            }
            { $_ -in @("unhealthy", "starting") } {
                Write-Host "⚠ $service`: $healthStatus" -ForegroundColor Yellow
                Write-Log "WARN" "$service`: $healthStatus"
                Send-Alert $service "warning" "Service status: $healthStatus"
                $overallStatus = "degraded"
            }
            default {
                Write-Host "✗ $service`: $healthStatus" -ForegroundColor Red
                Write-Log "ERROR" "$service`: $healthStatus"
                Send-Alert $service "critical" "Service status: $healthStatus"
                $overallStatus = "unhealthy"
            }
        }
    }
    
    # Check application endpoints
    Write-Host "`nApplication Endpoints:" -ForegroundColor Yellow
    $endpointStatus = Test-ApplicationEndpoints
    
    if ($endpointStatus -eq "healthy") {
        Write-Host "✓ Application endpoints: healthy" -ForegroundColor Green
    }
    else {
        Write-Host "✗ Application endpoints: unhealthy" -ForegroundColor Red
        $overallStatus = "unhealthy"
    }
    
    # Check database connectivity
    Write-Host "`nDatabase Connectivity:" -ForegroundColor Yellow
    $dbStatus = Test-DatabaseConnectivity
    
    if ($dbStatus -eq "healthy") {
        Write-Host "✓ Database: healthy" -ForegroundColor Green
    }
    else {
        Write-Host "✗ Database: unhealthy" -ForegroundColor Red
        $overallStatus = "unhealthy"
    }
    
    # Overall status
    Write-Host "`nOverall Status:" -ForegroundColor Yellow
    switch ($overallStatus) {
        "healthy" {
            Write-Host "✓ HEALTHY - All services are running normally" -ForegroundColor Green
        }
        "degraded" {
            Write-Host "⚠ DEGRADED - Some services have warnings" -ForegroundColor Yellow
        }
        "unhealthy" {
            Write-Host "✗ UNHEALTHY - Critical issues detected" -ForegroundColor Red
            Send-Alert "system" "critical" "System health check failed"
        }
    }
    
    Write-Host "==================================" -ForegroundColor Yellow
    
    return $overallStatus -eq "healthy"
}

# Main execution
function Main {
    Write-Log "INFO" "Health monitor started (continuous: $Continuous)"
    
    if ($Continuous) {
        try {
            while ($true) {
                Invoke-HealthCheck
                Start-Sleep -Seconds $CheckInterval
            }
        }
        catch {
            Write-Log "ERROR" "Health monitor error: $_"
        }
        finally {
            Write-Log "INFO" "Health monitor stopped"
        }
    }
    else {
        $result = Invoke-HealthCheck
        exit $(if ($result) { 0 } else { 1 })
    }
}

# Handle Ctrl+C gracefully
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Write-Log "INFO" "Health monitor stopped"
}

# Run main function
Main