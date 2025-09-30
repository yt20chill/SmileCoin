#!/bin/bash
# deploy.sh - Automated deployment script for Tourist Rewards Blockchain Infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NETWORK=${1:-"polygon-mumbai"}  # Default to testnet
ENVIRONMENT=${2:-"development"}
SKIP_FUNDING=${3:-"false"}

echo -e "${BLUE}🚀 Starting Tourist Rewards Blockchain Infrastructure Deployment${NC}"
echo -e "${BLUE}================================================================${NC}"

# Load environment variables
ENV_FILE=".env.${ENVIRONMENT}"
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
    echo -e "${GREEN}✅ Loaded environment from ${ENV_FILE}${NC}"
else
    echo -e "${RED}❌ Environment file ${ENV_FILE} not found${NC}"
    echo -e "${YELLOW}💡 Creating default environment file...${NC}"
    cp .env.example "$ENV_FILE"
    echo -e "${YELLOW}⚠️  Please update ${ENV_FILE} with your configuration and run again${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo -e "  Network: ${YELLOW}${NETWORK}${NC}"
echo -e "  Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "  RPC URL: ${YELLOW}${RPC_URL}${NC}"
echo -e "  Database URL: ${YELLOW}${DATABASE_URL}${NC}"

# Validate required environment variables
required_vars=("RPC_URL" "ADMIN_PRIVATE_KEY" "DATABASE_URL" "API_PORT")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Required environment variable ${var} is not set${NC}"
        exit 1
    fi
done

# Step 1: Install dependencies
echo -e "\n${BLUE}📦 Installing dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Dependencies already installed, skipping...${NC}"
fi

# Step 2: Compile smart contracts
echo -e "\n${BLUE}🔨 Compiling smart contracts...${NC}"
npx hardhat compile
echo -e "${GREEN}✅ Smart contracts compiled${NC}"

# Step 3: Run database migrations
echo -e "\n${BLUE}🗄️  Running database migrations...${NC}"
if command -v psql &> /dev/null; then
    # Check if database exists and is accessible
    if psql "$DATABASE_URL" -c '\q' 2>/dev/null; then
        psql "$DATABASE_URL" -f database/init.sql
        echo -e "${GREEN}✅ Database migrations completed${NC}"
    else
        echo -e "${RED}❌ Cannot connect to database. Please ensure PostgreSQL is running and DATABASE_URL is correct${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  psql not found. Skipping database migrations. Please run manually:${NC}"
    echo -e "  psql \$DATABASE_URL -f database/init.sql"
fi

# Step 4: Deploy smart contracts
echo -e "\n${BLUE}🚀 Deploying smart contracts to ${NETWORK}...${NC}"
DEPLOY_OUTPUT=$(npx hardhat run scripts/deploy.js --network ${NETWORK} 2>&1)
echo "$DEPLOY_OUTPUT"

CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "SmileCoin deployed to:" | cut -d' ' -f4 | tr -d '\r\n')

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo -e "${RED}❌ Contract deployment failed${NC}"
    echo -e "${RED}Deploy output: ${DEPLOY_OUTPUT}${NC}"
    exit 1
fi

echo -e "${GREEN}✅ SmileCoin contract deployed to: ${CONTRACT_ADDRESS}${NC}"

# Step 5: Update environment with contract address
echo -e "\n${BLUE}📝 Updating environment configuration...${NC}"
if grep -q "CONTRACT_ADDRESS=" "$ENV_FILE"; then
    # Update existing CONTRACT_ADDRESS
    sed -i.bak "s/CONTRACT_ADDRESS=.*/CONTRACT_ADDRESS=${CONTRACT_ADDRESS}/" "$ENV_FILE"
else
    # Add new CONTRACT_ADDRESS
    echo "CONTRACT_ADDRESS=${CONTRACT_ADDRESS}" >> "$ENV_FILE"
fi
echo -e "${GREEN}✅ Environment updated with contract address${NC}"

# Step 6: Fund admin wallet (for testnets)
if [ "$SKIP_FUNDING" != "true" ] && [[ "$NETWORK" == *"mumbai"* || "$NETWORK" == *"testnet"* ]]; then
    echo -e "\n${BLUE}💰 Funding admin wallet...${NC}"
    ADMIN_ADDRESS=$(node -e "
        const { ethers } = require('ethers');
        const wallet = new ethers.Wallet('${ADMIN_PRIVATE_KEY}');
        console.log(wallet.address);
    ")
    
    echo -e "${YELLOW}  Admin wallet address: ${ADMIN_ADDRESS}${NC}"
    
    if [ "$NETWORK" = "polygon-mumbai" ]; then
        echo -e "${YELLOW}  Please fund your admin wallet from Mumbai faucet:${NC}"
        echo -e "${YELLOW}  https://faucet.polygon.technology/${NC}"
        echo -e "${YELLOW}  Minimum 0.1 MATIC required for deployment operations${NC}"
        read -p "Press enter when wallet is funded..."
    fi
fi

# Step 7: Initialize contract with sample data (development only)
if [ "$ENVIRONMENT" = "development" ]; then
    echo -e "\n${BLUE}🎯 Initializing contract with sample data...${NC}"
    node -e "
        const { ethers } = require('ethers');
        const fs = require('fs');
        
        async function initializeSampleData() {
            const provider = new ethers.JsonRpcProvider('${RPC_URL}');
            const wallet = new ethers.Wallet('${ADMIN_PRIVATE_KEY}', provider);
            
            const contractABI = JSON.parse(fs.readFileSync('artifacts/contracts/SmileCoin.sol/SmileCoin.json')).abi;
            const contract = new ethers.Contract('${CONTRACT_ADDRESS}', contractABI, wallet);
            
            console.log('Registering sample tourist...');
            const sampleTourist = ethers.Wallet.createRandom();
            const arrivalTime = Math.floor(Date.now() / 1000);
            const departureTime = arrivalTime + (7 * 24 * 60 * 60); // 7 days
            
            await contract.registerTourist(sampleTourist.address, 'USA', arrivalTime, departureTime);
            console.log('Sample tourist registered:', sampleTourist.address);
            
            console.log('Registering sample restaurant...');
            const sampleRestaurant = ethers.Wallet.createRandom();
            await contract.registerRestaurant(sampleRestaurant.address, 'ChIJN1t_tDeuEmsRUsoyG83frY4');
            console.log('Sample restaurant registered:', sampleRestaurant.address);
        }
        
        initializeSampleData().catch(console.error);
    "
    echo -e "${GREEN}✅ Sample data initialized${NC}"
fi

# Step 8: Build and start services
echo -e "\n${BLUE}🏗️  Building services...${NC}"
npm run build
echo -e "${GREEN}✅ Services built${NC}"

# Step 9: Health checks
echo -e "\n${BLUE}🏥 Running health checks...${NC}"

# Check contract deployment
echo -e "${YELLOW}  Checking contract deployment...${NC}"
CONTRACT_CHECK=$(node -e "
    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider('${RPC_URL}');
    provider.getCode('${CONTRACT_ADDRESS}').then(code => {
        if (code === '0x') {
            console.log('FAILED');
        } else {
            console.log('SUCCESS');
        }
    }).catch(() => console.log('FAILED'));
")

if [ "$CONTRACT_CHECK" = "SUCCESS" ]; then
    echo -e "${GREEN}  ✅ Contract deployment verified${NC}"
else
    echo -e "${RED}  ❌ Contract deployment verification failed${NC}"
    exit 1
fi

# Check database connection
echo -e "${YELLOW}  Checking database connection...${NC}"
if command -v psql &> /dev/null && psql "$DATABASE_URL" -c '\q' 2>/dev/null; then
    echo -e "${GREEN}  ✅ Database connection verified${NC}"
else
    echo -e "${RED}  ❌ Database connection failed${NC}"
    exit 1
fi

# Check API service (if running)
echo -e "${YELLOW}  Checking API service...${NC}"
if curl -s "http://localhost:${API_PORT}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}  ✅ API service is running${NC}"
else
    echo -e "${YELLOW}  ⚠️  API service not running (this is normal for fresh deployment)${NC}"
fi

# Step 10: Generate deployment summary
echo -e "\n${BLUE}📊 Deployment Summary${NC}"
echo -e "${BLUE}===================${NC}"
echo -e "${GREEN}✅ Smart contracts deployed successfully${NC}"
echo -e "   Contract Address: ${YELLOW}${CONTRACT_ADDRESS}${NC}"
echo -e "   Network: ${YELLOW}${NETWORK}${NC}"
echo -e "${GREEN}✅ Database migrations completed${NC}"
echo -e "${GREEN}✅ Services built and ready${NC}"

# Create deployment info file
cat > "deployment-info.json" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "network": "${NETWORK}",
  "environment": "${ENVIRONMENT}",
  "contractAddress": "${CONTRACT_ADDRESS}",
  "rpcUrl": "${RPC_URL}",
  "apiPort": "${API_PORT}",
  "status": "deployed"
}
EOF

echo -e "\n${BLUE}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}====================================${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Start the API service: ${YELLOW}npm run start${NC}"
echo -e "2. View deployment info: ${YELLOW}cat deployment-info.json${NC}"
echo -e "3. Test the deployment: ${YELLOW}npm run test${NC}"

if [ "$ENVIRONMENT" = "development" ]; then
    echo -e "4. Access API documentation: ${YELLOW}http://localhost:${API_PORT}/docs${NC}"
fi

echo -e "\n${GREEN}🚀 Tourist Rewards Blockchain Infrastructure is ready!${NC}"