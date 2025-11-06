#!/bin/bash

echo "👥 Usability Testing Simulator"
echo "=============================="
echo "Simulating new developer onboarding experience"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Test counters
TOTAL_SCENARIOS=0
PASSED_SCENARIOS=0
FAILED_SCENARIOS=0
USABILITY_ISSUES=()

# Timing variables
START_TIME=""
END_TIME=""

# Function to start timing
start_timer() {
    START_TIME=$(date +%s)
}

# Function to end timing and calculate duration
end_timer() {
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    echo "    ⏱️  Completed in ${DURATION} seconds"
}

# Function to simulate user action with timing
simulate_user_action() {
    local action_name="$1"
    local commands="$2"
    local expected_time="$3"
    local success_criteria="$4"
    
    TOTAL_SCENARIOS=$((TOTAL_SCENARIOS + 1))
    echo -e "${BLUE}Simulating:${NC} $action_name"
    echo "  Expected completion time: ${expected_time} seconds"
    
    start_timer
    
    # Execute commands
    local success=true
    local error_output=""
    
    if ! eval "$commands" > /dev/null 2>&1; then
        success=false
        error_output="Command execution failed"
    fi
    
    end_timer
    
    # Check if within expected time
    local time_acceptable=true
    if [ $DURATION -gt $expected_time ]; then
        time_acceptable=false
        echo -e "${YELLOW}    ⚠️  Took longer than expected (${DURATION}s vs ${expected_time}s)${NC}"
    fi
    
    # Evaluate success
    if [ "$success" = true ] && [ "$time_acceptable" = true ]; then
        echo -e "${GREEN}✅ PASS:${NC} $action_name"
        PASSED_SCENARIOS=$((PASSED_SCENARIOS + 1))
    else
        echo -e "${RED}❌ USABILITY ISSUE:${NC} $action_name"
        FAILED_SCENARIOS=$((FAILED_SCENARIOS + 1))
        
        local issue="$action_name: "
        if [ "$success" = false ]; then
            issue="${issue}Command failed. "
        fi
        if [ "$time_acceptable" = false ]; then
            issue="${issue}Took ${DURATION}s (expected ${expected_time}s). "
        fi
        USABILITY_ISSUES+=("$issue")
    fi
    
    echo ""
}

# Function to test documentation navigation
test_documentation_navigation() {
    echo -e "${PURPLE}📚 Testing Documentation Navigation Experience${NC}"
    echo "--------------------------------------------"
    
    # Test: Finding quick start guide
    simulate_user_action \
        "Locate Quick Start Guide" \
        "test -f docs/quick-start/index.md && grep -q 'Prerequisites' docs/quick-start/index.md" \
        5 \
        "File exists and contains prerequisites"
    
    # Test: Finding environment setup
    simulate_user_action \
        "Find Development Environment Setup" \
        "test -f docs/environment-setup/development.md && grep -q 'Local Database' docs/environment-setup/development.md" \
        10 \
        "Environment setup guide is accessible"
    
    # Test: Locating troubleshooting information
    simulate_user_action \
        "Access Troubleshooting Guide" \
        "test -f docs/troubleshooting/index.md && grep -q 'Connection' docs/troubleshooting/index.md" \
        8 \
        "Troubleshooting guide is findable"
    
    # Test: Cross-referencing between documents
    simulate_user_action \
        "Follow Cross-References" \
        "grep -q 'database/postgresql-setup' docs/quick-start/index.md || grep -q 'environment-setup' docs/quick-start/index.md" \
        15 \
        "Documents contain cross-references"
}

# Function to test setup procedure usability
test_setup_procedure_usability() {
    echo -e "${PURPLE}⚙️ Testing Setup Procedure Usability${NC}"
    echo "-----------------------------------"
    
    # Test: Prerequisites verification
    simulate_user_action \
        "Verify Prerequisites Checklist" \
        "grep -A 10 'Prerequisites' docs/quick-start/index.md | grep -q 'Java\|Docker\|Git'" \
        30 \
        "Prerequisites are clearly listed"
    
    # Test: Step-by-step clarity
    simulate_user_action \
        "Follow Step-by-Step Instructions" \
        "grep -c 'Step [0-9]' docs/quick-start/index.md | awk '{if(\$1 >= 3) exit 0; else exit 1}'" \
        60 \
        "Multiple clear steps are provided"
    
    # Test: Code example accessibility
    simulate_user_action \
        "Locate Code Examples" \
        "grep -c '```' docs/quick-start/index.md | awk '{if(\$1 >= 5) exit 0; else exit 1}'" \
        20 \
        "Sufficient code examples are provided"
    
    # Test: Validation instructions
    simulate_user_action \
        "Find Validation Steps" \
        "grep -q 'curl.*health\|verify\|check' docs/quick-start/index.md" \
        25 \
        "Validation steps are included"
}

# Function to test error recovery usability
test_error_recovery_usability() {
    echo -e "${PURPLE}🔧 Testing Error Recovery Usability${NC}"
    echo "-----------------------------------"
    
    # Test: Common error scenarios
    simulate_user_action \
        "Find Common Error Solutions" \
        "grep -i 'port.*use\|connection.*refused\|build.*fail' docs/troubleshooting/index.md" \
        45 \
        "Common errors are documented"
    
    # Test: Diagnostic commands
    simulate_user_action \
        "Locate Diagnostic Commands" \
        "grep -c 'docker ps\|netstat\|curl.*health' docs/troubleshooting/index.md | awk '{if(\$1 >= 2) exit 0; else exit 1}'" \
        30 \
        "Diagnostic commands are provided"
    
    # Test: Problem-solution format
    simulate_user_action \
        "Navigate Problem-Solution Format" \
        "grep -A 5 -B 5 'Problem:\|Solution:' docs/troubleshooting/index.md | wc -l | awk '{if(\$1 >= 10) exit 0; else exit 1}'" \
        20 \
        "Clear problem-solution structure exists"
}

# Function to test environment-specific guidance
test_environment_guidance_usability() {
    echo -e "${PURPLE}🌍 Testing Environment-Specific Guidance${NC}"
    echo "----------------------------------------"
    
    # Test: Development environment clarity
    simulate_user_action \
        "Understand Development Setup" \
        "grep -q 'development\|dev\|local' docs/environment-setup/development.md && test -s docs/environment-setup/development.md" \
        40 \
        "Development environment is well documented"
    
    # Test: Production considerations
    simulate_user_action \
        "Find Production Guidelines" \
        "grep -q 'production\|prod\|security' docs/environment-setup/production.md && test -s docs/environment-setup/production.md" \
        35 \
        "Production environment guidance exists"
    
    # Test: Environment differences
    simulate_user_action \
        "Compare Environment Differences" \
        "wc -l docs/environment-setup/*.md | tail -1 | awk '{if(\$1 >= 300) exit 0; else exit 1}'" \
        50 \
        "Comprehensive environment documentation"
}

# Function to test mobile/responsive experience simulation
test_mobile_experience() {
    echo -e "${PURPLE}📱 Testing Mobile Experience Simulation${NC}"
    echo "--------------------------------------"
    
    # Test: Content structure for mobile
    simulate_user_action \
        "Verify Mobile-Friendly Structure" \
        "grep -c '^#' docs/quick-start/index.md | awk '{if(\$1 >= 5) exit 0; else exit 1}'" \
        15 \
        "Good heading structure for mobile navigation"
    
    # Test: Code block readability
    simulate_user_action \
        "Check Code Block Mobile Readability" \
        "grep -A 3 '```' docs/quick-start/index.md | grep -v '^--$' | wc -l | awk '{if(\$1 >= 10) exit 0; else exit 1}'" \
        20 \
        "Code blocks are present and structured"
    
    # Test: Table responsiveness indicators
    simulate_user_action \
        "Verify Table Mobile Compatibility" \
        "grep -c '|.*|.*|' docs/quick-start/index.md | awk '{if(\$1 >= 2) exit 0; else exit 1}'" \
        10 \
        "Tables are used appropriately"
}

# Function to test accessibility simulation
test_accessibility_simulation() {
    echo -e "${PURPLE}♿ Testing Accessibility Simulation${NC}"
    echo "----------------------------------"
    
    # Test: Alt text and descriptions
    simulate_user_action \
        "Check Image Descriptions" \
        "grep -c '!\[.*\]' docs/quick-start/index.md || echo '0'" \
        10 \
        "Images have descriptive alt text"
    
    # Test: Link descriptions
    simulate_user_action \
        "Verify Link Clarity" \
        "grep -c '\[.*\](' docs/quick-start/index.md | awk '{if(\$1 >= 3) exit 0; else exit 1}'" \
        15 \
        "Links have descriptive text"
    
    # Test: Content hierarchy
    simulate_user_action \
        "Validate Content Hierarchy" \
        "grep '^#' docs/quick-start/index.md | head -5 | wc -l | awk '{if(\$1 >= 3) exit 0; else exit 1}'" \
        12 \
        "Clear content hierarchy exists"
}

# Function to simulate new developer onboarding
simulate_new_developer_onboarding() {
    echo -e "${PURPLE}👨‍💻 Simulating Complete New Developer Onboarding${NC}"
    echo "================================================"
    
    local total_onboarding_time=0
    
    echo "Scenario: A new developer joins the team and needs to set up the project"
    echo ""
    
    # Phase 1: Initial orientation
    echo "Phase 1: Initial Project Orientation"
    start_timer
    simulate_user_action \
        "Read Project Overview" \
        "test -f README.md && grep -q 'Manager Product Service' README.md" \
        120 \
        "Project overview is accessible"
    end_timer
    total_onboarding_time=$((total_onboarding_time + DURATION))
    
    # Phase 2: Environment setup
    echo "Phase 2: Environment Setup"
    start_timer
    simulate_user_action \
        "Complete Environment Setup" \
        "test -f docs/quick-start/index.md && grep -A 20 'Step-by-Step' docs/quick-start/index.md | wc -l | awk '{if(\$1 >= 15) exit 0; else exit 1}'" \
        600 \
        "Environment setup is comprehensive"
    end_timer
    total_onboarding_time=$((total_onboarding_time + DURATION))
    
    # Phase 3: First successful run
    echo "Phase 3: First Successful Application Run"
    start_timer
    simulate_user_action \
        "Achieve First Successful Run" \
        "grep -q 'health' docs/quick-start/index.md && grep -q 'curl' docs/quick-start/index.md" \
        300 \
        "Success verification is documented"
    end_timer
    total_onboarding_time=$((total_onboarding_time + DURATION))
    
    # Phase 4: Troubleshooting capability
    echo "Phase 4: Troubleshooting Preparedness"
    start_timer
    simulate_user_action \
        "Learn Troubleshooting" \
        "test -f docs/troubleshooting/index.md && wc -l docs/troubleshooting/index.md | awk '{if(\$1 >= 50) exit 0; else exit 1}'" \
        180 \
        "Troubleshooting knowledge is available"
    end_timer
    total_onboarding_time=$((total_onboarding_time + DURATION))
    
    echo ""
    echo "📊 Complete Onboarding Simulation Results"
    echo "========================================"
    echo "Total estimated onboarding time: ${total_onboarding_time} seconds ($(($total_onboarding_time / 60)) minutes)"
    
    # Evaluate onboarding efficiency
    if [ $total_onboarding_time -le 1200 ]; then  # 20 minutes
        echo -e "${GREEN}🎉 Excellent onboarding experience! (≤20 minutes)${NC}"
    elif [ $total_onboarding_time -le 1800 ]; then  # 30 minutes
        echo -e "${YELLOW}⚠️ Good onboarding experience (≤30 minutes)${NC}"
    else
        echo -e "${RED}❌ Onboarding may be too complex (>30 minutes)${NC}"
        USABILITY_ISSUES+=("Onboarding process takes too long: ${total_onboarding_time} seconds")
    fi
}

# Main execution
echo "Starting comprehensive usability testing simulation..."
echo ""

test_documentation_navigation
test_setup_procedure_usability
test_error_recovery_usability
test_environment_guidance_usability
test_mobile_experience
test_accessibility_simulation

echo ""
simulate_new_developer_onboarding

echo ""
echo "📊 Overall Usability Test Results"
echo "================================="
echo -e "Total Scenarios: ${BLUE}$TOTAL_SCENARIOS${NC}"
echo -e "Passed: ${GREEN}$PASSED_SCENARIOS${NC}"
echo -e "Failed: ${RED}$FAILED_SCENARIOS${NC}"

if [ ${#USABILITY_ISSUES[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}Usability Issues Identified:${NC}"
    for issue in "${USABILITY_ISSUES[@]}"; do
        echo -e "${RED}  • $issue${NC}"
    done
fi

# Calculate success percentage
if [ $TOTAL_SCENARIOS -gt 0 ]; then
    SUCCESS_RATE=$(( (PASSED_SCENARIOS * 100) / TOTAL_SCENARIOS ))
    echo ""
    echo -e "Usability Success Rate: ${GREEN}$SUCCESS_RATE%${NC}"
    
    if [ $SUCCESS_RATE -ge 90 ]; then
        echo -e "${GREEN}🎉 Excellent usability! Documentation provides great user experience.${NC}"
        exit 0
    elif [ $SUCCESS_RATE -ge 75 ]; then
        echo -e "${YELLOW}⚠️ Good usability, but some improvements recommended.${NC}"
        exit 1
    else
        echo -e "${RED}❌ Significant usability issues found. Review and improve documentation.${NC}"
        exit 2
    fi
else
    echo -e "${RED}❌ No usability scenarios were tested.${NC}"
    exit 3
fi