#!/bin/bash

# Performance Test Execution Script
# This script runs comprehensive performance tests and generates optimization recommendations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}⚡ Tourist Rewards Blockchain Infrastructure - Performance Test Suite${NC}"
echo -e "${PURPLE}=====================================================================${NC}"

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

# Set performance-specific environment variables
export TEST_API_URL=${TEST_API_URL:-"http://localhost:3000"}
export TEST_API_KEY=${TEST_API_KEY:-"test-api-key-performance"}
export RPC_URL=${RPC_URL:-"http://localhost:8545"}
export CONTRACT_ADDRESS=${CONTRACT_ADDRESS:-"0x1234567890123456789012345678901234567890"}
export BLOCKCHAIN_NETWORK=${BLOCKCHAIN_NETWORK:-"hardhat"}
export NODE_ENV="test"

# Performance test specific settings
export NODE_OPTIONS="--max-old-space-size=4096 --optimize-for-size"
export UV_THREADPOOL_SIZE="16"

echo -e "${BLUE}📋 Performance Test Configuration:${NC}"
echo -e "   API URL: ${TEST_API_URL}"
echo -e "   RPC URL: ${RPC_URL}"
echo -e "   Network: ${BLOCKCHAIN_NETWORK}"
echo -e "   Node Options: ${NODE_OPTIONS}"
echo -e "   Thread Pool Size: ${UV_THREADPOOL_SIZE}"

# Function to check system resources
check_system_resources() {
    echo -e "${BLUE}🔍 Checking system resources...${NC}"
    
    # Check available memory
    if command -v free >/dev/null 2>&1; then
        echo -e "${BLUE}💾 Memory Status:${NC}"
        free -h
    elif command -v vm_stat >/dev/null 2>&1; then
        echo -e "${BLUE}💾 Memory Status (macOS):${NC}"
        vm_stat | head -5
    fi
    
    # Check CPU info
    if command -v nproc >/dev/null 2>&1; then
        echo -e "${BLUE}🖥️  CPU Cores: $(nproc)${NC}"
    elif command -v sysctl >/dev/null 2>&1; then
        echo -e "${BLUE}🖥️  CPU Cores: $(sysctl -n hw.ncpu)${NC}"
    fi
    
    # Check disk space
    echo -e "${BLUE}💽 Disk Space:${NC}"
    df -h . | head -2
}

# Function to optimize system for performance testing
optimize_system() {
    echo -e "${BLUE}⚡ Optimizing system for performance testing...${NC}"
    
    # Increase file descriptor limits
    ulimit -n 4096 2>/dev/null || echo -e "${YELLOW}⚠️  Could not increase file descriptor limit${NC}"
    
    # Set process priority
    renice -n -5 $$ 2>/dev/null || echo -e "${YELLOW}⚠️  Could not adjust process priority${NC}"
    
    # Clear system caches if possible (requires sudo)
    if command -v sync >/dev/null 2>&1; then
        sync 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ System optimization complete${NC}"
}

# Function to check if a service is running with performance measurement
check_service_performance() {
    local url=$1
    local name=$2
    local max_attempts=20
    local attempt=1
    
    echo -e "${BLUE}🔍 Checking ${name} performance...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        local start_time=$(date +%s%3N)
        
        if curl -s -f "$url" > /dev/null 2>&1; then
            local end_time=$(date +%s%3N)
            local response_time=$((end_time - start_time))
            
            echo -e "${GREEN}✅ ${name} is running (${response_time}ms response time)${NC}"
            
            if [ $response_time -gt 1000 ]; then
                echo -e "${YELLOW}⚠️  ${name} response time is high (${response_time}ms)${NC}"
            fi
            
            return 0
        fi
        
        if [ $attempt -eq 1 ]; then
            echo -e "${YELLOW}⏳ Waiting for ${name} to be ready...${NC}"
        fi
        
        sleep 3
        attempt=$((attempt + 1))
    done
    
    echo -e "${YELLOW}⚠️  ${name} is not responding (performance tests may fail)${NC}"
    return 1
}

# Function to run performance benchmarks
run_performance_benchmarks() {
    echo -e "\n${PURPLE}🏃 Running Performance Benchmarks${NC}"
    echo -e "${PURPLE}=================================${NC}"
    
    # API performance benchmark
    if check_service_performance "${TEST_API_URL}/health" "API Server"; then
        echo -e "${BLUE}📊 API Performance Benchmark:${NC}"
        
        local total_time=0
        local successful_requests=0
        
        for i in {1..10}; do
            local start_time=$(date +%s%3N)
            if curl -s -f "${TEST_API_URL}/health" > /dev/null 2>&1; then
                local end_time=$(date +%s%3N)
                local response_time=$((end_time - start_time))
                total_time=$((total_time + response_time))
                successful_requests=$((successful_requests + 1))
                echo -e "   Request $i: ${response_time}ms"
            else
                echo -e "   Request $i: Failed"
            fi
        done
        
        if [ $successful_requests -gt 0 ]; then
            local avg_time=$((total_time / successful_requests))
            echo -e "${GREEN}   Average response time: ${avg_time}ms${NC}"
            echo -e "${GREEN}   Success rate: $((successful_requests * 10))%${NC}"
        fi
    fi
    
    # Blockchain performance benchmark
    echo -e "\n${BLUE}📊 Blockchain Performance Benchmark:${NC}"
    
    local blockchain_total_time=0
    local blockchain_successful_requests=0
    
    for i in {1..5}; do
        local start_time=$(date +%s%3N)
        if curl -s -X POST -H "Content-Type: application/json" \
           -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
           "$RPC_URL" > /dev/null 2>&1; then
            local end_time=$(date +%s%3N)
            local response_time=$((end_time - start_time))
            blockchain_total_time=$((blockchain_total_time + response_time))
            blockchain_successful_requests=$((blockchain_successful_requests + 1))
            echo -e "   Request $i: ${response_time}ms"
        else
            echo -e "   Request $i: Failed"
        fi
    done
    
    if [ $blockchain_successful_requests -gt 0 ]; then
        local blockchain_avg_time=$((blockchain_total_time / blockchain_successful_requests))
        echo -e "${GREEN}   Average response time: ${blockchain_avg_time}ms${NC}"
        echo -e "${GREEN}   Success rate: $((blockchain_successful_requests * 20))%${NC}"
    fi
}

# Pre-flight checks
echo -e "\n${BLUE}🚀 Pre-flight Checks${NC}"
echo -e "${BLUE}===================${NC}"

# Check Node.js version and configuration
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js version: ${NODE_VERSION}${NC}"

# Check system resources
check_system_resources

# Optimize system
optimize_system

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

# Check services with performance measurement
check_service_performance "${TEST_API_URL}/health" "API Server"
check_service_performance "$RPC_URL" "Blockchain Network" "POST"

# Run performance benchmarks
run_performance_benchmarks

# Create test reports directory
mkdir -p test-reports/performance

# Run the Performance tests
echo -e "\n${PURPLE}⚡ Running Performance Tests${NC}"
echo -e "${PURPLE}============================${NC}"

# Set Jest configuration for performance tests
export JEST_CONFIG="test/performance/jest.config.js"

# Record start time
START_TIME=$(date +%s)

# Run performance tests with detailed output
if npm run test:performance; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo -e "\n${GREEN}🎉 All performance tests completed successfully!${NC}"
    echo -e "${GREEN}⏱️  Total duration: ${DURATION} seconds${NC}"
    echo -e "${GREEN}📊 Performance analysis complete${NC}"
    
    # Generate success report
    echo "{
        \"status\": \"success\",
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"duration\": ${DURATION},
        \"message\": \"All performance tests passed successfully\"
    }" > test-reports/performance/status.json
    
    # Show performance reports location
    echo -e "\n${BLUE}📄 Performance reports available at:${NC}"
    echo -e "   HTML Report: test-reports/performance/performance-report.html"
    echo -e "   JSON Report: test-reports/performance/performance-report.json"
    echo -e "   Analysis: test-reports/performance/final-analysis.json"
    echo -e "   Recommendations: test-reports/performance/recommendations.md"
    
    exit 0
else
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo -e "\n${RED}❌ Some performance tests failed or showed concerning metrics${NC}"
    echo -e "${RED}⏱️  Duration: ${DURATION} seconds${NC}"
    echo -e "${RED}🔧 Please review the performance reports and implement optimizations${NC}"
    
    # Generate failure report
    echo "{
        \"status\": \"failure\",
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"duration\": ${DURATION},
        \"message\": \"Some performance tests failed or showed concerning metrics\"
    }" > test-reports/performance/status.json
    
    # Show test reports location
    echo -e "\n${BLUE}📄 Performance reports available at:${NC}"
    echo -e "   HTML Report: test-reports/performance/performance-report.html"
    echo -e "   JSON Report: test-reports/performance/performance-report.json"
    echo -e "   Analysis: test-reports/performance/final-analysis.json"
    echo -e "   Recommendations: test-reports/performance/recommendations.md"
    
    echo -e "\n${YELLOW}💡 Next Steps:${NC}"
    echo -e "   1. Review detailed performance reports"
    echo -e "   2. Implement recommended optimizations"
    echo -e "   3. Re-run performance tests to verify improvements"
    echo -e "   4. Set up continuous performance monitoring"
    
    exit 1
fi