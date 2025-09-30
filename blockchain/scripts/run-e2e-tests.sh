#!/bin/bash

# End-to-End Test Execution Script
# This script runs the complete E2E test suite for the Tourist Rewards Blockchain Infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Tourist Rewards Blockchain Infrastructure - E2E Test Suite${NC}"
echo -e "${BLUE}================================================================${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Load environment variables
if [ -f ".env.test" ]; then
    echo -e "${GREEN}✅ Loading test environment variables${NC}"
    export $(cat .env.test | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}⚠️  .env.test not found, using defaults${NC}"
fi

# Set default values if not provided
export TEST_API_URL=${TEST_API_URL:-"http://localhost:3000"}
export TEST_API_KEY=${TEST_API_KEY:-"test-api-key-e2e"}
export RPC_URL=${RPC_URL:-"http://localhost:8545"}
export CONTRACT_ADDRESS=${CONTRACT_ADDRESS:-"0x1234567890123456789012345678901234567890"}
export BLOCKCHAIN_NETWORK=${BLOCKCHAIN_NETWORK:-"hardhat"}
export NODE_ENV="test"

echo -e "${BLUE}📋 Test Configuration:${NC}"
echo -e "   API URL: ${TEST_API_URL}"
echo -e "   RPC URL: ${RPC_URL}"
echo -e "   Network: ${BLOCKCHAIN_NETWORK}"
echo -e "   Contract: ${CONTRACT_ADDRESS}"

# Function to check if a service is running
check_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${BLUE}🔍 Checking ${name}...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ ${name} is running${NC}"
            return 0
        fi
        
        if [ $attempt -eq 1 ]; then
            echo -e "${YELLOW}⏳ Waiting for ${name} to be ready...${NC}"
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${YELLOW}⚠️  ${name} is not responding (tests may fail)${NC}"
    return 1
}

# Function to check blockchain network
check_blockchain() {
    local rpc_url=$1
    local max_attempts=30
    local attempt=1
    
    echo -e "${BLUE}🔍 Checking blockchain network...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -X POST -H "Content-Type: application/json" \
           -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
           "$rpc_url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Blockchain network is running${NC}"
            return 0
        fi
        
        if [ $attempt -eq 1 ]; then
            echo -e "${YELLOW}⏳ Waiting for blockchain network to be ready...${NC}"
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${YELLOW}⚠️  Blockchain network is not responding (tests may fail)${NC}"
    return 1
}

# Pre-flight checks
echo -e "\n${BLUE}🚀 Pre-flight Checks${NC}"
echo -e "${BLUE}===================${NC}"

# Check Node.js version
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js version: ${NODE_VERSION}${NC}"

# Check npm dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Check TypeScript compilation
echo -e "${BLUE}🔨 Checking TypeScript compilation...${NC}"
if npx tsc --noEmit; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
else
    echo -e "${RED}❌ TypeScript compilation failed${NC}"
    exit 1
fi

# Check services
check_service "${TEST_API_URL}/health" "API Server"
check_blockchain "$RPC_URL"

# Create test reports directory
mkdir -p test-reports/e2e

# Run the E2E tests
echo -e "\n${BLUE}🧪 Running End-to-End Tests${NC}"
echo -e "${BLUE}============================${NC}"

# Set Jest configuration for E2E tests
export JEST_CONFIG="test/e2e/jest.config.js"

# Run tests with proper configuration
if npm run test:e2e; then
    echo -e "\n${GREEN}🎉 All E2E tests passed!${NC}"
    echo -e "${GREEN}✅ System is ready for deployment${NC}"
    
    # Generate success report
    echo "{
        \"status\": \"success\",
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"message\": \"All E2E tests passed successfully\"
    }" > test-reports/e2e/status.json
    
    exit 0
else
    echo -e "\n${RED}❌ Some E2E tests failed${NC}"
    echo -e "${RED}🔧 Please fix the issues before deployment${NC}"
    
    # Generate failure report
    echo "{
        \"status\": \"failure\",
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"message\": \"Some E2E tests failed\"
    }" > test-reports/e2e/status.json
    
    # Show test reports location
    echo -e "\n${BLUE}📄 Test reports available at:${NC}"
    echo -e "   HTML Report: test-reports/e2e/e2e-report.html"
    echo -e "   JSON Report: test-reports/e2e/e2e-report.json"
    
    exit 1
fi