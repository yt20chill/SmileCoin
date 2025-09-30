#!/bin/bash
# start-staging-api.sh - Start API services for staging environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Tourist Rewards API Services (Staging)${NC}"
echo -e "${BLUE}================================================${NC}"

# Load staging environment
if [ ! -f ".env.staging" ]; then
    echo -e "${RED}❌ .env.staging file not found${NC}"
    exit 1
fi

source .env.staging

echo -e "${BLUE}📋 Configuration:${NC}"
echo -e "  Environment: ${YELLOW}staging${NC}"
echo -e "  API Port: ${YELLOW}${API_PORT}${NC}"
echo -e "  Network: ${YELLOW}${NETWORK_NAME}${NC}"
echo -e "  Contract: ${YELLOW}${CONTRACT_ADDRESS}${NC}"

# Validate required environment variables
required_vars=("CONTRACT_ADDRESS" "RPC_URL" "ADMIN_PRIVATE_KEY" "DATABASE_URL" "API_PORT")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Required environment variable ${var} is not set${NC}"
        exit 1
    fi
done

# Check if contract is deployed
echo -e "\n${BLUE}🔍 Verifying contract deployment...${NC}"
CONTRACT_CHECK=$(node -e "
    const { ethers } = require('ethers');
    async function checkContract() {
        try {
            const provider = new ethers.JsonRpcProvider('${RPC_URL}');
            const code = await provider.getCode('${CONTRACT_ADDRESS}');
            console.log(code === '0x' ? 'not_deployed' : 'deployed');
        } catch (error) {
            console.log('error');
        }
    }
    checkContract();
")

if [ "$CONTRACT_CHECK" != "deployed" ]; then
    echo -e "${RED}❌ Contract not found at address ${CONTRACT_ADDRESS}${NC}"
    echo -e "${YELLOW}💡 Please deploy the contract first using: ./scripts/deploy-testnet.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contract verified${NC}"

# Check database connection
echo -e "\n${BLUE}🗄️  Checking database connection...${NC}"
if command -v psql &> /dev/null; then
    if psql "$DATABASE_URL" -c '\q' 2>/dev/null; then
        echo -e "${GREEN}✅ Database connection verified${NC}"
    else
        echo -e "${RED}❌ Cannot connect to database${NC}"
        echo -e "${YELLOW}💡 Please ensure PostgreSQL is running and DATABASE_URL is correct${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  psql not found, skipping database check${NC}"
fi

# Build the application
echo -e "\n${BLUE}🏗️  Building application...${NC}"
npm run build
echo -e "${GREEN}✅ Application built${NC}"

# Start Redis (if available)
echo -e "\n${BLUE}📦 Checking Redis...${NC}"
if command -v redis-server &> /dev/null; then
    if ! pgrep -x "redis-server" > /dev/null; then
        echo -e "${YELLOW}  Starting Redis server...${NC}"
        redis-server --daemonize yes --port 6379
        sleep 2
    fi
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${YELLOW}⚠️  Redis not found, caching will be disabled${NC}"
fi

# Create logs directory
mkdir -p logs

# Start the API service
echo -e "\n${BLUE}🚀 Starting API service...${NC}"
echo -e "  Port: ${YELLOW}${API_PORT}${NC}"
echo -e "  Environment: ${YELLOW}staging${NC}"
echo -e "  Logs: ${YELLOW}logs/api-staging.log${NC}"

# Set environment for the API service
export NODE_ENV=staging
export PORT=${API_PORT}

# Start the service with PM2 if available, otherwise use node directly
if command -v pm2 &> /dev/null; then
    echo -e "${BLUE}  Using PM2 process manager...${NC}"
    
    # Stop existing process if running
    pm2 delete tourist-rewards-api-staging 2>/dev/null || true
    
    # Start new process
    pm2 start dist/api/app.js \
        --name "tourist-rewards-api-staging" \
        --env staging \
        --log logs/api-staging.log \
        --error logs/api-staging-error.log \
        --out logs/api-staging-out.log
    
    echo -e "${GREEN}✅ API service started with PM2${NC}"
    echo -e "${BLUE}  View logs: ${YELLOW}pm2 logs tourist-rewards-api-staging${NC}"
    echo -e "${BLUE}  Stop service: ${YELLOW}pm2 stop tourist-rewards-api-staging${NC}"
    
else
    echo -e "${BLUE}  Starting with Node.js directly...${NC}"
    echo -e "${YELLOW}  Note: Install PM2 for better process management: npm install -g pm2${NC}"
    
    # Start in background
    nohup node dist/api/app.js > logs/api-staging.log 2>&1 &
    API_PID=$!
    echo $API_PID > logs/api-staging.pid
    
    echo -e "${GREEN}✅ API service started (PID: ${API_PID})${NC}"
    echo -e "${BLUE}  View logs: ${YELLOW}tail -f logs/api-staging.log${NC}"
    echo -e "${BLUE}  Stop service: ${YELLOW}kill ${API_PID}${NC}"
fi

# Wait for service to start
echo -e "\n${BLUE}⏳ Waiting for API service to start...${NC}"
sleep 5

# Health check
echo -e "\n${BLUE}🏥 Running health check...${NC}"
for i in {1..10}; do
    if curl -s "http://localhost:${API_PORT}/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API service is healthy${NC}"
        break
    else
        if [ $i -eq 10 ]; then
            echo -e "${RED}❌ API service health check failed${NC}"
            echo -e "${YELLOW}💡 Check logs: tail -f logs/api-staging.log${NC}"
            exit 1
        fi
        echo -e "${YELLOW}  Attempt $i/10 - waiting...${NC}"
        sleep 2
    fi
done

# Test basic endpoints
echo -e "\n${BLUE}🧪 Testing basic endpoints...${NC}"

# Test health endpoint
HEALTH_RESPONSE=$(curl -s "http://localhost:${API_PORT}/health" || echo "failed")
if [[ "$HEALTH_RESPONSE" == *"healthy"* ]]; then
    echo -e "${GREEN}  ✅ Health endpoint works${NC}"
else
    echo -e "${RED}  ❌ Health endpoint failed${NC}"
fi

# Test network status endpoint
NETWORK_RESPONSE=$(curl -s "http://localhost:${API_PORT}/api/blockchain/network/status" || echo "failed")
if [[ "$NETWORK_RESPONSE" == *"blockNumber"* ]]; then
    echo -e "${GREEN}  ✅ Network status endpoint works${NC}"
else
    echo -e "${RED}  ❌ Network status endpoint failed${NC}"
fi

# Display service information
echo -e "\n${GREEN}🎉 API service started successfully!${NC}"
echo -e "${GREEN}================================${NC}"

echo -e "\n${BLUE}📋 Service Information:${NC}"
echo -e "  API URL: ${YELLOW}http://localhost:${API_PORT}${NC}"
echo -e "  Health Check: ${YELLOW}http://localhost:${API_PORT}/health${NC}"
echo -e "  API Documentation: ${YELLOW}http://localhost:${API_PORT}/docs${NC}"
echo -e "  Environment: ${YELLOW}staging${NC}"
echo -e "  Network: ${YELLOW}${NETWORK_NAME}${NC}"
echo -e "  Contract: ${YELLOW}${CONTRACT_ADDRESS}${NC}"

echo -e "\n${BLUE}🔗 Useful Links:${NC}"
echo -e "  Contract on PolygonScan: ${YELLOW}https://mumbai.polygonscan.com/address/${CONTRACT_ADDRESS}${NC}"
echo -e "  Mumbai Faucet: ${YELLOW}https://faucet.polygon.technology/${NC}"

echo -e "\n${BLUE}📄 Log Files:${NC}"
echo -e "  API Logs: ${YELLOW}logs/api-staging.log${NC}"
echo -e "  Error Logs: ${YELLOW}logs/api-staging-error.log${NC}"

echo -e "\n${BLUE}🧪 Test the API:${NC}"
echo -e "  Run integration tests: ${YELLOW}node scripts/test-testnet-integration.js${NC}"
echo -e "  Manual test: ${YELLOW}curl http://localhost:${API_PORT}/health${NC}"

echo -e "\n${GREEN}✅ Tourist Rewards API is ready for testing!${NC}"