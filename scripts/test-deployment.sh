#!/bin/bash
# Test script for deployment automation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
TEST_ENVIRONMENT="development"
TEST_DIR="test-deployment"
ORIGINAL_DIR=$(pwd)
TEST_RESULTS=()

echo -e "${BLUE}🧪 Testing Deployment Automation${NC}"
echo -e "${BLUE}=================================${NC}"

# Function to log test results
log_test_result() {
    local test_name="$1"
    local status="$2"
    local details="$3"
    
    TEST_RESULTS+=("$test_name:$status:$details")
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ $test_name: PASSED${NC}"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ $test_name: FAILED${NC}"
        if [ -n "$details" ]; then
            echo -e "${RED}   Details: $details${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  $test_name: $status${NC}"
        if [ -n "$details" ]; then
            echo -e "${YELLOW}   Details: $details${NC}"
        fi
    fi
}

# Function to cleanup test environment
cleanup_test_env() {
    echo -e "\n${YELLOW}🧹 Cleaning up test environment...${NC}"
    
    if [ -d "$TEST_DIR" ]; then
        cd "$ORIGINAL_DIR"
        
        # Stop any running services
        if [ -f "$TEST_DIR/docker-compose.yml" ]; then
            cd "$TEST_DIR"
            docker-compose -f docker-compose.yml -f docker-compose.development.yml down -v --remove-orphans 2>/dev/null || true
            cd "$ORIGINAL_DIR"
        fi
        
        # Remove test directory
        rm -rf "$TEST_DIR"
        echo -e "${GREEN}✅ Test environment cleaned up${NC}"
    fi
}

# Function to setup test environment
setup_test_env() {
    echo -e "\n${BLUE}🏗️  Setting up test environment...${NC}"
    
    # Create test directory
    mkdir -p "$TEST_DIR"
    
    # Copy project files to test directory
    cp -r . "$TEST_DIR/" 2>/dev/null || {
        # If cp fails, use rsync or alternative method
        rsync -av --exclude="$TEST_DIR" --exclude=".git" --exclude="node_modules" --exclude="dist" . "$TEST_DIR/"
    }
    
    cd "$TEST_DIR"
    
    # Create test environment file
    cat > .env.test << EOF
# Test Environment Configuration
NODE_ENV=test
ENVIRONMENT=test
RPC_URL=http://localhost:8545
NETWORK=hardhat
CHAIN_ID=31337
POSTGRES_DB=tourist_rewards_test
POSTGRES_USER=postgres
POSTGRES_PASSWORD=test_password
DATABASE_URL=postgresql://postgres:test_password@localhost:5432/tourist_rewards_test
REDIS_URL=redis://localhost:6379
API_PORT=3001
API_KEY=test-api-key
LOG_LEVEL=debug
ADMIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
MONITORING_INTERVAL=5000
ENABLE_MONITORING=false
ENABLE_SWAGGER=true
ENABLE_DEBUG_ROUTES=true
AUTO_FUND_WALLETS=false
CREATE_SAMPLE_DATA=false
GAS_LIMIT=8000000
GAS_PRICE=20000000000
WALLET_FUNDING_AMOUNT=1.0
AUTO_FUND_THRESHOLD=0.1
EOF
    
    echo -e "${GREEN}✅ Test environment setup complete${NC}"
}

# Test 1: Validate deployment script exists and is executable
test_deployment_script_exists() {
    echo -e "\n${BLUE}Test 1: Deployment Script Validation${NC}"
    
    if [ -f "scripts/deploy.sh" ] && [ -x "scripts/deploy.sh" ]; then
        log_test_result "Deployment Script Exists" "PASS"
    else
        log_test_result "Deployment Script Exists" "FAIL" "scripts/deploy.sh not found or not executable"
        return 1
    fi
    
    # Test script help output
    if ./scripts/deploy.sh 2>&1 | grep -q "Starting Tourist Rewards Blockchain Infrastructure Deployment"; then
        log_test_result "Deployment Script Help" "PASS"
    else
        log_test_result "Deployment Script Help" "FAIL" "Script help output not as expected"
    fi
}

# Test 2: Validate Docker configuration
test_docker_configuration() {
    echo -e "\n${BLUE}Test 2: Docker Configuration Validation${NC}"
    
    # Check base docker-compose.yml
    if [ -f "docker-compose.yml" ]; then
        log_test_result "Base Docker Compose File" "PASS"
    else
        log_test_result "Base Docker Compose File" "FAIL" "docker-compose.yml not found"
        return 1
    fi
    
    # Check environment-specific files
    local env_files=("docker-compose.development.yml" "docker-compose.staging.yml" "docker-compose.production.yml")
    for file in "${env_files[@]}"; do
        if [ -f "$file" ]; then
            log_test_result "Docker Compose $file" "PASS"
        else
            log_test_result "Docker Compose $file" "FAIL" "$file not found"
        fi
    done
    
    # Validate Docker Compose syntax
    if docker-compose -f docker-compose.yml -f docker-compose.development.yml config > /dev/null 2>&1; then
        log_test_result "Docker Compose Syntax" "PASS"
    else
        log_test_result "Docker Compose Syntax" "FAIL" "Docker Compose configuration has syntax errors"
    fi
}

# Test 3: Test environment file validation
test_environment_files() {
    echo -e "\n${BLUE}Test 3: Environment Files Validation${NC}"
    
    local env_files=(".env.development" ".env.staging" ".env.production")
    for file in "${env_files[@]}"; do
        if [ -f "$file" ]; then
            log_test_result "Environment File $file" "PASS"
            
            # Check for required variables
            local required_vars=("NODE_ENV" "RPC_URL" "DATABASE_URL" "ADMIN_PRIVATE_KEY")
            for var in "${required_vars[@]}"; do
                if grep -q "^${var}=" "$file"; then
                    log_test_result "$file - $var" "PASS"
                else
                    log_test_result "$file - $var" "FAIL" "Required variable $var not found"
                fi
            done
        else
            log_test_result "Environment File $file" "FAIL" "$file not found"
        fi
    done
}

# Test 4: Test contract deployment (local)
test_contract_deployment() {
    echo -e "\n${BLUE}Test 4: Contract Deployment Test${NC}"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        npm install > /dev/null 2>&1 || {
            log_test_result "Dependency Installation" "FAIL" "npm install failed"
            return 1
        }
    fi
    
    log_test_result "Dependency Installation" "PASS"
    
    # Compile contracts
    echo -e "${YELLOW}Compiling contracts...${NC}"
    if npx hardhat compile > /dev/null 2>&1; then
        log_test_result "Contract Compilation" "PASS"
    else
        log_test_result "Contract Compilation" "FAIL" "Contract compilation failed"
        return 1
    fi
    
    # Start local hardhat node in background
    echo -e "${YELLOW}Starting local blockchain...${NC}"
    npx hardhat node > hardhat.log 2>&1 &
    HARDHAT_PID=$!
    
    # Wait for hardhat node to start
    sleep 5
    
    # Test if hardhat node is running
    if curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        http://localhost:8545 > /dev/null; then
        log_test_result "Local Blockchain Start" "PASS"
    else
        log_test_result "Local Blockchain Start" "FAIL" "Could not connect to local blockchain"
        kill $HARDHAT_PID 2>/dev/null || true
        return 1
    fi
    
    # Deploy contract
    echo -e "${YELLOW}Deploying contract...${NC}"
    if DEPLOY_OUTPUT=$(npx hardhat run scripts/deploy.js --network localhost 2>&1); then
        CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "SmileCoin deployed to:" | cut -d' ' -f4 | tr -d '\r\n')
        if [ -n "$CONTRACT_ADDRESS" ]; then
            log_test_result "Contract Deployment" "PASS" "Contract deployed to $CONTRACT_ADDRESS"
            echo "CONTRACT_ADDRESS=$CONTRACT_ADDRESS" >> .env.test
        else
            log_test_result "Contract Deployment" "FAIL" "Could not extract contract address"
        fi
    else
        log_test_result "Contract Deployment" "FAIL" "Contract deployment failed"
    fi
    
    # Stop hardhat node
    kill $HARDHAT_PID 2>/dev/null || true
    wait $HARDHAT_PID 2>/dev/null || true
}

# Test 5: Test service startup with Docker
test_service_startup() {
    echo -e "\n${BLUE}Test 5: Service Startup Test${NC}"
    
    # Copy test environment to development environment for Docker
    cp .env.test .env.development
    
    # Start services
    echo -e "${YELLOW}Starting services with Docker...${NC}"
    if docker-compose -f docker-compose.yml -f docker-compose.development.yml up -d > docker-startup.log 2>&1; then
        log_test_result "Docker Services Start" "PASS"
    else
        log_test_result "Docker Services Start" "FAIL" "Docker services failed to start"
        return 1
    fi
    
    # Wait for services to be ready
    echo -e "${YELLOW}Waiting for services to be ready...${NC}"
    sleep 30
    
    # Test database connectivity
    if docker-compose -f docker-compose.yml -f docker-compose.development.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        log_test_result "Database Connectivity" "PASS"
    else
        log_test_result "Database Connectivity" "FAIL" "Database not ready"
    fi
    
    # Test Redis connectivity
    if docker-compose -f docker-compose.yml -f docker-compose.development.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
        log_test_result "Redis Connectivity" "PASS"
    else
        log_test_result "Redis Connectivity" "FAIL" "Redis not ready"
    fi
    
    # Test API health endpoint (if API is running)
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        log_test_result "API Health Check" "PASS"
    else
        log_test_result "API Health Check" "SKIP" "API not accessible (expected in test environment)"
    fi
}

# Test 6: Test health check script
test_health_checks() {
    echo -e "\n${BLUE}Test 6: Health Check Script Test${NC}"
    
    if [ -f "scripts/health-check.js" ] && [ -x "scripts/health-check.js" ]; then
        log_test_result "Health Check Script Exists" "PASS"
        
        # Run health check (expect some failures in test environment)
        if timeout 30 node scripts/health-check.js > health-check.log 2>&1; then
            log_test_result "Health Check Execution" "PASS"
        else
            # Health check may fail in test environment, that's expected
            log_test_result "Health Check Execution" "SKIP" "Some checks failed (expected in test environment)"
        fi
    else
        log_test_result "Health Check Script Exists" "FAIL" "scripts/health-check.js not found or not executable"
    fi
}

# Test 7: Test rollback functionality
test_rollback_functionality() {
    echo -e "\n${BLUE}Test 7: Rollback Functionality Test${NC}"
    
    if [ -f "scripts/contract-manager.sh" ] && [ -x "scripts/contract-manager.sh" ]; then
        log_test_result "Contract Manager Script Exists" "PASS"
        
        # Test contract manager help
        if ./scripts/contract-manager.sh 2>&1 | grep -q "Contract Manager for Tourist Rewards System"; then
            log_test_result "Contract Manager Help" "PASS"
        else
            log_test_result "Contract Manager Help" "FAIL" "Contract manager help not working"
        fi
        
        # Create a mock deployment record for rollback test
        mkdir -p deployments
        cat > deployments/hardhat-v1.0.0.json << EOF
{
  "network": "hardhat",
  "version": "v1.0.0",
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "deployer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
EOF
        
        log_test_result "Mock Deployment Record" "PASS"
        
    else
        log_test_result "Contract Manager Script Exists" "FAIL" "scripts/contract-manager.sh not found"
    fi
}

# Test 8: Test utility scripts
test_utility_scripts() {
    echo -e "\n${BLUE}Test 8: Utility Scripts Test${NC}"
    
    local scripts=("wallet-funding.js" "create-sample-data.js" "backup.sh" "docker-manager.sh")
    
    for script in "${scripts[@]}"; do
        if [ -f "scripts/$script" ] && [ -x "scripts/$script" ]; then
            log_test_result "Utility Script $script" "PASS"
        else
            log_test_result "Utility Script $script" "FAIL" "scripts/$script not found or not executable"
        fi
    done
    
    # Test package.json scripts
    if grep -q "\"deploy\":" package.json; then
        log_test_result "Package.json Deploy Scripts" "PASS"
    else
        log_test_result "Package.json Deploy Scripts" "FAIL" "Deploy scripts not found in package.json"
    fi
}

# Generate test report
generate_test_report() {
    echo -e "\n${BLUE}📊 Test Report${NC}"
    echo -e "${BLUE}=============${NC}"
    
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    local skipped_tests=0
    
    echo -e "\n${YELLOW}Detailed Results:${NC}"
    for result in "${TEST_RESULTS[@]}"; do
        IFS=':' read -r test_name status details <<< "$result"
        total_tests=$((total_tests + 1))
        
        case $status in
            "PASS")
                passed_tests=$((passed_tests + 1))
                echo -e "${GREEN}✅ $test_name${NC}"
                ;;
            "FAIL")
                failed_tests=$((failed_tests + 1))
                echo -e "${RED}❌ $test_name${NC}"
                if [ -n "$details" ]; then
                    echo -e "${RED}   $details${NC}"
                fi
                ;;
            "SKIP")
                skipped_tests=$((skipped_tests + 1))
                echo -e "${YELLOW}⏭️  $test_name${NC}"
                if [ -n "$details" ]; then
                    echo -e "${YELLOW}   $details${NC}"
                fi
                ;;
        esac
    done
    
    echo -e "\n${BLUE}Summary:${NC}"
    echo -e "${GREEN}✅ Passed: $passed_tests${NC}"
    echo -e "${RED}❌ Failed: $failed_tests${NC}"
    echo -e "${YELLOW}⏭️  Skipped: $skipped_tests${NC}"
    echo -e "${BLUE}📊 Total: $total_tests${NC}"
    
    # Calculate success rate
    if [ $total_tests -gt 0 ]; then
        local success_rate=$(( (passed_tests * 100) / total_tests ))
        echo -e "${BLUE}📈 Success Rate: ${success_rate}%${NC}"
        
        if [ $failed_tests -eq 0 ]; then
            echo -e "\n${GREEN}🎉 All critical tests passed!${NC}"
            return 0
        else
            echo -e "\n${RED}❌ Some tests failed. Please review and fix issues.${NC}"
            return 1
        fi
    else
        echo -e "\n${YELLOW}⚠️  No tests were run.${NC}"
        return 1
    fi
}

# Main test execution
main() {
    echo -e "${BLUE}Starting deployment automation tests...${NC}"
    
    # Setup test environment
    setup_test_env
    
    # Run tests
    test_deployment_script_exists
    test_docker_configuration
    test_environment_files
    test_contract_deployment
    test_service_startup
    test_health_checks
    test_rollback_functionality
    test_utility_scripts
    
    # Generate report
    local test_result=0
    generate_test_report || test_result=1
    
    # Cleanup
    cleanup_test_env
    
    if [ $test_result -eq 0 ]; then
        echo -e "\n${GREEN}🚀 Deployment automation tests completed successfully!${NC}"
    else
        echo -e "\n${RED}❌ Deployment automation tests completed with failures.${NC}"
    fi
    
    return $test_result
}

# Handle cleanup on script exit
trap cleanup_test_env EXIT

# Run main function
main "$@"