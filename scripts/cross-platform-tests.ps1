# Cross-Platform Compatibility Test Suite for Windows
# PowerShell script to validate documentation procedures on Windows

param(
    [switch]$Verbose = $false
)

Write-Host "🧪 Cross-Platform Compatibility Test Suite (Windows)" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Test counters
$script:TotalTests = 0
$script:PassedTests = 0
$script:FailedTests = 0
$script:FailedTestDetails = @()

# Function to run a test
function Test-Condition {
    param(
        [string]$TestName,
        [scriptblock]$TestCommand,
        [string]$ExpectedResult = "success"
    )
    
    $script:TotalTests++
    Write-Host "Testing: $TestName" -ForegroundColor Blue
    
    try {
        $result = & $TestCommand
        $success = $?
        
        if ($success -and $ExpectedResult -eq "success") {
            Write-Host "✅ PASS: $TestName" -ForegroundColor Green
            $script:PassedTests++
        } elseif (-not $success -and $ExpectedResult -eq "failure") {
            Write-Host "✅ PASS: $TestName (expected failure)" -ForegroundColor Green
            $script:PassedTests++
        } else {
            Write-Host "❌ FAIL: $TestName" -ForegroundColor Red
            $script:FailedTests++
            $script:FailedTestDetails += "${TestName}: Unexpected result"
        }
    } catch {
        if ($ExpectedResult -eq "failure") {
            Write-Host "✅ PASS: $TestName (expected failure)" -ForegroundColor Green
            $script:PassedTests++
        } else {
            Write-Host "❌ FAIL: $TestName - $($_.Exception.Message)" -ForegroundColor Red
            $script:FailedTests++
            $script:FailedTestDetails += "${TestName}: $($_.Exception.Message)"
        }
    }
}

# Function to test command existence
function Test-CommandExists {
    param([string]$Command)
    
    Test-Condition "Check $Command command availability" {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
}

# Function to test file existence
function Test-FileExists {
    param([string]$FilePath)
    
    Test-Condition "Check $FilePath exists" {
        Test-Path $FilePath -PathType Leaf
    }
}

# Function to test directory existence
function Test-DirectoryExists {
    param([string]$DirectoryPath)
    
    Test-Condition "Check $DirectoryPath directory exists" {
        Test-Path $DirectoryPath -PathType Container
    }
}

Write-Host "🔍 Phase 1: Windows Prerequisites Validation" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Yellow

# Test Java installation
Test-CommandExists "java"
if (Get-Command java -ErrorAction SilentlyContinue) {
    try {
        $javaVersion = java -version 2>&1 | Select-Object -First 1
        Write-Host "   Java version: $javaVersion" -ForegroundColor Gray
        
        # Check if Java 21+
        if ($javaVersion -match "21\.|22\.|23\.") {
            Write-Host "✅ Java 21+ detected" -ForegroundColor Green
            $script:PassedTests++
        } else {
            Write-Host "⚠️  Java version may not be 21+" -ForegroundColor Yellow
        }
        $script:TotalTests++
    } catch {
        Write-Host "❌ Could not determine Java version" -ForegroundColor Red
    }
}

# Test Docker installation
Test-CommandExists "docker"
if (Get-Command docker -ErrorAction SilentlyContinue) {
    try {
        $dockerVersion = docker --version
        Write-Host "   Docker version: $dockerVersion" -ForegroundColor Gray
    } catch {
        Write-Host "⚠️  Could not get Docker version" -ForegroundColor Yellow
    }
}

# Test Docker Compose
Test-CommandExists "docker-compose"
if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    try {
        $composeVersion = docker-compose --version
        Write-Host "   Docker Compose version: $composeVersion" -ForegroundColor Gray
    } catch {
        Write-Host "⚠️  Could not get Docker Compose version" -ForegroundColor Yellow
    }
}

# Test Git
Test-CommandExists "git"
if (Get-Command git -ErrorAction SilentlyContinue) {
    try {
        $gitVersion = git --version
        Write-Host "   Git version: $gitVersion" -ForegroundColor Gray
    } catch {
        Write-Host "⚠️  Could not get Git version" -ForegroundColor Yellow
    }
}

# Test PowerShell version
Write-Host "   PowerShell version: $($PSVersionTable.PSVersion)" -ForegroundColor Gray

Write-Host ""
Write-Host "📁 Phase 2: Project Structure Validation" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow

# Test essential project files
Test-FileExists "build.gradle.kts"
Test-FileExists "docker-compose.yml"
Test-FileExists "gradlew.bat"
Test-FileExists ".env.example"

# Test project directories
Test-DirectoryExists "src\main"
Test-DirectoryExists "src\test"
Test-DirectoryExists "docs"
Test-DirectoryExists "scripts"

# Test documentation structure
Test-FileExists "docs\quick-start\index.md"
Test-FileExists "docs\environment-setup\development.md"
Test-FileExists "docs\environment-setup\staging.md"
Test-FileExists "docs\environment-setup\production.md"
Test-FileExists "docs\database\postgresql-setup.md"
Test-FileExists "docs\troubleshooting\index.md"

Write-Host ""
Write-Host "⚙️  Phase 3: Windows-Specific Configuration Validation" -ForegroundColor Yellow
Write-Host "-----------------------------------------------------" -ForegroundColor Yellow

# Test .env file creation from example
if (Test-Path ".env.example") {
    Test-Condition "Copy .env.example to .env" {
        Copy-Item ".env.example" ".env" -Force
        Test-Path ".env"
    }
}

# Validate docker-compose.yml syntax
if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    Test-Condition "Docker Compose file syntax validation" {
        docker-compose config | Out-Null
        return $?
    }
}

# Test Gradle wrapper (Windows batch file)
Test-FileExists "gradlew.bat"

Write-Host ""
Write-Host "🔧 Phase 4: Windows Build System Validation" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Yellow

# Test Gradle build (dry run)
if (Test-Path "gradlew.bat") {
    Write-Host "Testing Gradle build (this may take a few minutes)..." -ForegroundColor Gray
    Test-Condition "Gradle clean build (Windows)" {
        & .\gradlew.bat clean build -x test
        return $LASTEXITCODE -eq 0
    }
}

Write-Host ""
Write-Host "🐳 Phase 5: Docker Environment Validation (Windows)" -ForegroundColor Yellow
Write-Host "--------------------------------------------------" -ForegroundColor Yellow

# Check if Docker daemon is running
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Test-Condition "Docker daemon accessibility" {
        docker info | Out-Null
        return $LASTEXITCODE -eq 0
    }
    
    # Test Docker Compose services definition
    if (Test-Path "docker-compose.yml") {
        Test-Condition "Docker Compose services validation" {
            docker-compose config --services | Out-Null
            return $LASTEXITCODE -eq 0
        }
    }
}

Write-Host ""
Write-Host "🌐 Phase 6: Windows-Specific Network and Port Checks" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow

# Test port availability (Windows netstat)
Test-Condition "Check port 8080 availability" {
    $portCheck = netstat -an | Select-String ":8080"
    return $portCheck.Count -eq 0
}

Test-Condition "Check port 5432 availability" {
    $portCheck = netstat -an | Select-String ":5432"
    return $portCheck.Count -eq 0
}

# Test Windows firewall (if accessible)
Test-Condition "Windows Firewall service status" {
    $firewallService = Get-Service -Name "MpsSvc" -ErrorAction SilentlyContinue
    return $firewallService -and $firewallService.Status -eq "Running"
}

Write-Host ""
Write-Host "📚 Phase 7: Documentation Content Validation (Windows)" -ForegroundColor Yellow
Write-Host "------------------------------------------------------" -ForegroundColor Yellow

# Function to check if documentation contains required sections
function Test-DocumentationSection {
    param(
        [string]$FilePath,
        [string]$Section
    )
    
    if (Test-Path $FilePath) {
        Test-Condition "Check '$Section' section in $FilePath" {
            $content = Get-Content $FilePath -Raw
            return $content -match [regex]::Escape($Section)
        }
    } else {
        Write-Host "⚠️  File $FilePath not found, skipping section check" -ForegroundColor Yellow
    }
}

# Check quick start guide sections
if (Test-Path "docs\quick-start\index.md") {
    Test-DocumentationSection "docs\quick-start\index.md" "Prerequisites"
    Test-DocumentationSection "docs\quick-start\index.md" "Step-by-Step Setup"
    Test-DocumentationSection "docs\quick-start\index.md" "Windows"
}

# Check database setup sections
if (Test-Path "docs\database\postgresql-setup.md") {
    Test-DocumentationSection "docs\database\postgresql-setup.md" "Windows"
    Test-DocumentationSection "docs\database\postgresql-setup.md" "PowerShell"
}

Write-Host ""
Write-Host "🔍 Phase 8: Windows Command Examples Validation" -ForegroundColor Yellow
Write-Host "----------------------------------------------" -ForegroundColor Yellow

# Function to validate Windows-specific code examples
function Test-WindowsCodeExamples {
    param(
        [string]$FilePath,
        [string]$Language
    )
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        
        # Look for Windows-specific commands
        $windowsCommands = @("gradlew.bat", "netstat", "PowerShell", "cmd", ".bat")
        $foundCommands = 0
        
        foreach ($cmd in $windowsCommands) {
            if ($content -match [regex]::Escape($cmd)) {
                $foundCommands++
            }
        }
        
        if ($foundCommands -gt 0) {
            Write-Host "✅ Found Windows-specific examples in $FilePath" -ForegroundColor Green
            $script:PassedTests++
        } else {
            Write-Host "⚠️  No Windows-specific examples found in $FilePath" -ForegroundColor Yellow
        }
        $script:TotalTests++
    }
}

# Validate Windows-specific code examples
Test-WindowsCodeExamples "docs\quick-start\index.md" "cmd"
Test-WindowsCodeExamples "docs\environment-setup\development.md" "powershell"

Write-Host ""
Write-Host "📊 Test Results Summary" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "Total Tests: $($script:TotalTests)" -ForegroundColor Blue
Write-Host "Passed: $($script:PassedTests)" -ForegroundColor Green
Write-Host "Failed: $($script:FailedTests)" -ForegroundColor Red

if ($script:FailedTests -gt 0) {
    Write-Host ""
    Write-Host "Failed Test Details:" -ForegroundColor Red
    foreach ($detail in $script:FailedTestDetails) {
        Write-Host "  • $detail" -ForegroundColor Red
    }
}

# Calculate success percentage
if ($script:TotalTests -gt 0) {
    $successRate = [math]::Round(($script:PassedTests * 100) / $script:TotalTests, 1)
    Write-Host ""
    Write-Host "Success Rate: $successRate%" -ForegroundColor Green
    
    if ($successRate -ge 90) {
        Write-Host "🎉 Excellent! Documentation and setup procedures are well validated for Windows." -ForegroundColor Green
        exit 0
    } elseif ($successRate -ge 75) {
        Write-Host "⚠️  Good, but some improvements needed for Windows compatibility." -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "❌ Significant issues found. Review failed tests." -ForegroundColor Red
        exit 2
    }
} else {
    Write-Host "❌ No tests were executed." -ForegroundColor Red
    exit 3
}