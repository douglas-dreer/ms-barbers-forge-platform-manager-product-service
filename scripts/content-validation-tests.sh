#!/bin/bash

echo "🧪 Content Validation Test Suite"
echo "================================"
echo "Testing all configuration procedures from documentation"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test result tracking
FAILED_TEST_DETAILS=()

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${BLUE}Testing:${NC} $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        if [ "$expected_result" = "success" ]; then
            echo -e "${GREEN}✅ PASS:${NC} $test_name"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}❌ FAIL:${NC} $test_name (expected failure but got success)"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            FAILED_TEST_DETAILS+=("$test_name: Expected failure but got success")
        fi
    else
        if [ "$expected_result" = "failure" ]; then
            echo -e "${GREEN}✅ PASS:${NC} $test_name (expected failure)"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}❌ FAIL:${NC} $test_name"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            FAILED_TEST_DETAILS+=("$test_name: Command failed unexpectedly")
        fi
    fi
}

# Function to test command existence
test_command_exists() {
    local cmd="$1"
    local test_name="Check $cmd command availability"
    run_test "$test_name" "command -v $cmd" "success"
}

# Function to test file existence
test_file_exists() {
    local file="$1"
    local test_name="Check $file exists"
    run_test "$test_name" "test -f $file" "success"
}

# Function to test directory existence
test_directory_exists() {
    local dir="$1"
    local test_name="Check $dir directory exists"
    run_test "$test_name" "test -d $dir" "success"
}

echo "🔍 Phase 1: Prerequisites Validation"
echo "-----------------------------------"

# Test Java installation
test_command_exists "java"
if command -v java > /dev/null 2>&1; then
    java_version=$(java -version 2>&1 | head -n 1)
    echo "   Java version: $java_version"
    
    # Check if Java 21+
    if java -version 2>&1 | grep -q "21\|22\|23"; then
        echo -e "${GREEN}✅ Java 21+ detected${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${YELLOW}⚠️  Java version may not be 21+${NC}"
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# Test Docker installation
test_command_exists "docker"
if command -v docker > /dev/null 2>&1; then
    docker_version=$(docker --version)
    echo "   Docker version: $docker_version"
fi

# Test Docker Compose
test_command_exists "docker-compose"
if command -v docker-compose > /dev/null 2>&1; then
    compose_version=$(docker-compose --version)
    echo "   Docker Compose version: $compose_version"
fi

# Test Git
test_command_exists "git"
if command -v git > /dev/null 2>&1; then
    git_version=$(git --version)
    echo "   Git version: $git_version"
fi

echo ""
echo "📁 Phase 2: Project Structure Validation"
echo "----------------------------------------"

# Test essential project files
test_file_exists "build.gradle.kts"
test_file_exists "docker-compose.yml"
test_file_exists "gradlew"
test_file_exists ".env.example"

# Test project directories
test_directory_exists "src/main"
test_directory_exists "src/test"
test_directory_exists "docs"
test_directory_exists "scripts"

# Test documentation structure
test_file_exists "docs/quick-start/index.md"
test_file_exists "docs/environment-setup/development.md"
test_file_exists "docs/environment-setup/staging.md"
test_file_exists "docs/environment-setup/production.md"
test_file_exists "docs/database/postgresql-setup.md"
test_file_exists "docs/troubleshooting/index.md"

echo ""
echo "⚙️  Phase 3: Configuration File Validation"
echo "------------------------------------------"

# Test .env file creation from example
if [ -f ".env.example" ]; then
    run_test "Copy .env.example to .env" "cp .env.example .env" "success"
fi

# Validate docker-compose.yml syntax
if command -v docker-compose > /dev/null 2>&1; then
    run_test "Docker Compose file syntax validation" "docker-compose config" "success"
fi

# Test Gradle wrapper permissions (Unix-like systems)
if [ -f "gradlew" ]; then
    run_test "Gradle wrapper executable permissions" "test -x gradlew" "success"
fi

echo ""
echo "🔧 Phase 4: Build System Validation"
echo "-----------------------------------"

# Test Gradle build (dry run)
if [ -f "gradlew" ]; then
    echo "Testing Gradle build (this may take a few minutes)..."
    run_test "Gradle clean build" "./gradlew clean build -x test" "success"
fi

echo ""
echo "🐳 Phase 5: Docker Environment Validation"
echo "-----------------------------------------"

# Check if Docker daemon is running
if command -v docker > /dev/null 2>&1; then
    run_test "Docker daemon accessibility" "docker info" "success"
    
    # Test Docker Compose services definition
    if [ -f "docker-compose.yml" ]; then
        run_test "Docker Compose services validation" "docker-compose config --services" "success"
    fi
fi

echo ""
echo "📚 Phase 6: Documentation Content Validation"
echo "--------------------------------------------"

# Function to check if documentation contains required sections
check_doc_section() {
    local file="$1"
    local section="$2"
    local test_name="Check '$section' section in $file"
    
    if [ -f "$file" ]; then
        run_test "$test_name" "grep -q '$section' '$file'" "success"
    else
        echo -e "${YELLOW}⚠️  File $file not found, skipping section check${NC}"
    fi
}

# Check quick start guide sections
if [ -f "docs/quick-start/index.md" ]; then
    check_doc_section "docs/quick-start/index.md" "Prerequisites"
    check_doc_section "docs/quick-start/index.md" "Step-by-Step Setup"
    check_doc_section "docs/quick-start/index.md" "Environment Configuration"
    check_doc_section "docs/quick-start/index.md" "Verification"
fi

# Check database setup sections
if [ -f "docs/database/postgresql-setup.md" ]; then
    check_doc_section "docs/database/postgresql-setup.md" "Development Environment Setup"
    check_doc_section "docs/database/postgresql-setup.md" "Connection Management"
    check_doc_section "docs/database/postgresql-setup.md" "Troubleshooting"
fi

# Check environment setup sections
for env in development staging production; do
    env_file="docs/environment-setup/${env}.md"
    if [ -f "$env_file" ]; then
        check_doc_section "$env_file" "Prerequisites"
        check_doc_section "$env_file" "Configuration"
        check_doc_section "$env_file" "Security"
    fi
done

echo ""
echo "🔍 Phase 7: Code Examples Validation"
echo "------------------------------------"

# Function to extract and validate code blocks
validate_code_examples() {
    local file="$1"
    local language="$2"
    
    if [ -f "$file" ]; then
        # Extract code blocks for the specified language
        local code_blocks=$(grep -A 20 "\`\`\`$language" "$file" | grep -v "\`\`\`" | head -10)
        
        if [ -n "$code_blocks" ]; then
            echo -e "${GREEN}✅ Found $language code examples in $file${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${YELLOW}⚠️  No $language code examples found in $file${NC}"
        fi
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
    fi
}

# Validate different types of code examples
validate_code_examples "docs/quick-start/index.md" "bash"
validate_code_examples "docs/database/postgresql-setup.md" "yaml"
validate_code_examples "docs/database/postgresql-setup.md" "sql"
validate_code_examples "docs/environment-setup/development.md" "properties"

echo ""
echo "🌐 Phase 8: Cross-Platform Compatibility Checks"
echo "-----------------------------------------------"

# Detect current platform
OS="$(uname -s)"
case "${OS}" in
    Linux*)     PLATFORM=Linux;;
    Darwin*)    PLATFORM=Mac;;
    CYGWIN*|MINGW*|MSYS*) PLATFORM=Windows;;
    *)          PLATFORM="Unknown:${OS}"
esac

echo "Detected platform: $PLATFORM"

# Platform-specific validations
case $PLATFORM in
    "Linux")
        test_command_exists "systemctl"
        test_command_exists "netstat"
        ;;
    "Mac")
        test_command_exists "brew"
        test_command_exists "lsof"
        ;;
    "Windows")
        # Windows-specific checks would go here
        echo "Windows-specific validations (limited in bash)"
        ;;
esac

echo ""
echo "📊 Test Results Summary"
echo "======================"
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -gt 0 ]; then
    echo ""
    echo -e "${RED}Failed Test Details:${NC}"
    for detail in "${FAILED_TEST_DETAILS[@]}"; do
        echo -e "${RED}  • $detail${NC}"
    done
fi

# Calculate success percentage
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    echo ""
    echo -e "Success Rate: ${GREEN}$SUCCESS_RATE%${NC}"
    
    if [ $SUCCESS_RATE -ge 90 ]; then
        echo -e "${GREEN}🎉 Excellent! Documentation and setup procedures are well validated.${NC}"
        exit 0
    elif [ $SUCCESS_RATE -ge 75 ]; then
        echo -e "${YELLOW}⚠️  Good, but some improvements needed.${NC}"
        exit 1
    else
        echo -e "${RED}❌ Significant issues found. Review failed tests.${NC}"
        exit 2
    fi
else
    echo -e "${RED}❌ No tests were executed.${NC}"
    exit 3
fi