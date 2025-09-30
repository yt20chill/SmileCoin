#!/bin/bash
# deploy-testnet.sh - Deploy to Polygon Mumbai testnet

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying Tourist Rewards System to Polygon Mumbai Testnet${NC}"
echo -e "${BLUE}============================================================${NC}"

# Check if staging environment file exists
if [ ! -f ".env.staging" ]; then
    echo -e "${RED}❌ .env.staging file not found${NC}"
    echo -e "${YELLOW}💡 Creating staging environment file from template...${NC}"
    cp .env.example .env.staging
    echo -e "${YELLOW}⚠️  Please update .env.staging with your configuration and run again${NC}"
    exit 1
fi

# Load staging environment
source .env.staging

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo -e "  Network: ${YELLOW}polygon-mumbai${NC}"
echo -e "  Environment: ${YELLOW}staging${NC}"
echo -e "  RPC URL: ${YELLOW}${RPC_URL}${NC}"
echo -e "  Chain ID: ${YELLOW}${CHAIN_ID}${NC}"

# Validate required environment variables
required_vars=("RPC_URL" "ADMIN_PRIVATE_KEY" "DATABASE_URL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Required environment variable ${var} is not set in .env.staging${NC}"
        exit 1
    fi
done

# Check if admin private key is set
if [ "$ADMIN_PRIVATE_KEY" = "" ]; then
    echo -e "${RED}❌ ADMIN_PRIVATE_KEY is not set in .env.staging${NC}"
    echo -e "${YELLOW}💡 Generate a new wallet or use an existing one${NC}"
    exit 1
fi

# Get admin wallet address
ADMIN_ADDRESS=$(node -e "
    const { ethers } = require('ethers');
    const wallet = new ethers.Wallet('${ADMIN_PRIVATE_KEY}');
    console.log(wallet.address);
")

echo -e "${BLUE}👤 Admin Wallet: ${YELLOW}${ADMIN_ADDRESS}${NC}"

# Check admin wallet balance
echo -e "${BLUE}💰 Checking admin wallet balance...${NC}"
BALANCE=$(node -e "
    const { ethers } = require('ethers');
    async function checkBalance() {
        const provider = new ethers.JsonRpcProvider('${RPC_URL}');
        const balance = await provider.getBalance('${ADMIN_ADDRESS}');
        console.log(ethers.formatEther(balance));
    }
    checkBalance().catch(console.error);
")

echo -e "  Balance: ${YELLOW}${BALANCE} MATIC${NC}"

# Check if balance is sufficient (minimum 0.1 MATIC)
BALANCE_CHECK=$(node -e "
    const balance = parseFloat('${BALANCE}');
    console.log(balance >= 0.1 ? 'sufficient' : 'insufficient');
")

if [ "$BALANCE_CHECK" = "insufficient" ]; then
    echo -e "${RED}❌ Insufficient MATIC balance for deployment${NC}"
    echo -e "${YELLOW}💡 Please fund your admin wallet from Mumbai faucet:${NC}"
    echo -e "${YELLOW}   https://faucet.polygon.technology/${NC}"
    echo -e "${YELLOW}   Admin wallet: ${ADMIN_ADDRESS}${NC}"
    echo -e "${YELLOW}   Minimum required: 0.1 MATIC${NC}"
    read -p "Press enter when wallet is funded..."
fi

# Step 1: Install dependencies
echo -e "\n${BLUE}📦 Installing dependencies...${NC}"
npm install

# Step 2: Compile contracts
echo -e "\n${BLUE}🔨 Compiling smart contracts...${NC}"
npx hardhat compile

# Step 3: Deploy to testnet
echo -e "\n${BLUE}🚀 Deploying SmileCoin contract to Mumbai testnet...${NC}"
DEPLOY_OUTPUT=$(npx hardhat run scripts/deploy.js --network polygon-mumbai 2>&1)
echo "$DEPLOY_OUTPUT"

# Extract contract address from deployment output
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "SmileCoin deployed to:" | cut -d' ' -f4 | tr -d '\r\n')

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo -e "${RED}❌ Contract deployment failed${NC}"
    echo -e "${RED}Deploy output: ${DEPLOY_OUTPUT}${NC}"
    exit 1
fi

echo -e "${GREEN}✅ SmileCoin contract deployed to: ${CONTRACT_ADDRESS}${NC}"

# Step 4: Update environment with contract address
echo -e "\n${BLUE}📝 Updating staging environment...${NC}"
if grep -q "CONTRACT_ADDRESS=" .env.staging; then
    sed -i.bak "s/CONTRACT_ADDRESS=.*/CONTRACT_ADDRESS=${CONTRACT_ADDRESS}/" .env.staging
else
    echo "CONTRACT_ADDRESS=${CONTRACT_ADDRESS}" >> .env.staging
fi
echo -e "${GREEN}✅ Environment updated${NC}"

# Step 5: Verify deployment
echo -e "\n${BLUE}🔍 Verifying deployment...${NC}"
node scripts/verify-testnet-deployment.js

# Step 6: Set up database (if PostgreSQL is available)
echo -e "\n${BLUE}🗄️  Setting up database...${NC}"
if command -v psql &> /dev/null; then
    if psql "$DATABASE_URL" -c '\q' 2>/dev/null; then
        echo -e "${YELLOW}  Running database migrations...${NC}"
        psql "$DATABASE_URL" -f database/init.sql
        echo -e "${GREEN}✅ Database setup completed${NC}"
    else
        echo -e "${YELLOW}⚠️  Cannot connect to database. Please run manually:${NC}"
        echo -e "  psql \$DATABASE_URL -f database/init.sql"
    fi
else
    echo -e "${YELLOW}⚠️  psql not found. Please run database migrations manually${NC}"
fi

# Step 7: Build API services
echo -e "\n${BLUE}🏗️  Building API services...${NC}"
npm run build
echo -e "${GREEN}✅ API services built${NC}"

# Step 8: Create sample data for testing
echo -e "\n${BLUE}🎯 Creating sample test data...${NC}"
node -e "
const { ethers } = require('ethers');
const fs = require('fs');

async function createSampleData() {
    const provider = new ethers.JsonRpcProvider('${RPC_URL}');
    const adminWallet = new ethers.Wallet('${ADMIN_PRIVATE_KEY}', provider);
    
    const contractABI = JSON.parse(fs.readFileSync('artifacts/contracts/SmileCoin.sol/SmileCoin.json')).abi;
    const contract = new ethers.Contract('${CONTRACT_ADDRESS}', contractABI, adminWallet);
    
    console.log('Creating sample tourist...');
    const sampleTourist = ethers.Wallet.createRandom();
    const arrivalTime = Math.floor(Date.now() / 1000);
    const departureTime = arrivalTime + (7 * 24 * 60 * 60); // 7 days
    
    try {
        const tx1 = await contract.registerTourist(sampleTourist.address, 'USA', arrivalTime, departureTime);
        await tx1.wait();
        console.log('✅ Sample tourist registered:', sampleTourist.address);
        
        console.log('Creating sample restaurant...');
        const sampleRestaurant = ethers.Wallet.createRandom();
        const tx2 = await contract.registerRestaurant(sampleRestaurant.address, 'ChIJN1t_tDeuEmsRUsoyG83frY4');
        await tx2.wait();
        console.log('✅ Sample restaurant registered:', sampleRestaurant.address);
        
        // Save sample data for testing
        const sampleData = {
            tourist: {
                address: sampleTourist.address,
                privateKey: sampleTourist.privateKey,
                originCountry: 'USA',
                arrivalTime: arrivalTime,
                departureTime: departureTime
            },
            restaurant: {
                address: sampleRestaurant.address,
                privateKey: sampleRestaurant.privateKey,
                googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4'
            }
        };
        
        fs.writeFileSync('testnet-sample-data.json', JSON.stringify(sampleData, null, 2));
        console.log('✅ Sample data saved to testnet-sample-data.json');
        
    } catch (error) {
        console.error('❌ Failed to create sample data:', error.message);
    }
}

createSampleData();
"

# Step 9: Generate deployment summary
echo -e "\n${BLUE}📊 Generating deployment summary...${NC}"
cat > testnet-deployment-info.json << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "network": {
    "name": "polygon-mumbai",
    "chainId": 80001,
    "rpcUrl": "${RPC_URL}"
  },
  "contract": {
    "address": "${CONTRACT_ADDRESS}",
    "explorerUrl": "https://mumbai.polygonscan.com/address/${CONTRACT_ADDRESS}"
  },
  "admin": {
    "address": "${ADMIN_ADDRESS}",
    "explorerUrl": "https://mumbai.polygonscan.com/address/${ADMIN_ADDRESS}"
  },
  "environment": "staging",
  "status": "deployed",
  "apiPort": ${API_PORT},
  "databaseUrl": "${DATABASE_URL}"
}
EOF

echo -e "\n${GREEN}🎉 Testnet deployment completed successfully!${NC}"
echo -e "${GREEN}================================================${NC}"

echo -e "\n${BLUE}📋 Deployment Summary:${NC}"
echo -e "  Contract Address: ${YELLOW}${CONTRACT_ADDRESS}${NC}"
echo -e "  Network: ${YELLOW}Polygon Mumbai Testnet${NC}"
echo -e "  Admin Wallet: ${YELLOW}${ADMIN_ADDRESS}${NC}"
echo -e "  Environment: ${YELLOW}staging${NC}"

echo -e "\n${BLUE}🔗 Useful Links:${NC}"
echo -e "  Contract on PolygonScan: ${YELLOW}https://mumbai.polygonscan.com/address/${CONTRACT_ADDRESS}${NC}"
echo -e "  Admin wallet on PolygonScan: ${YELLOW}https://mumbai.polygonscan.com/address/${ADMIN_ADDRESS}${NC}"
echo -e "  Mumbai Faucet: ${YELLOW}https://faucet.polygon.technology/${NC}"

echo -e "\n${BLUE}📄 Files Created:${NC}"
echo -e "  - testnet-deployment-info.json (deployment details)"
echo -e "  - testnet-deployment-summary.json (verification results)"
echo -e "  - testnet-sample-data.json (sample test data)"

echo -e "\n${BLUE}🚀 Next Steps:${NC}"
echo -e "1. Start the API service: ${YELLOW}npm run start${NC}"
echo -e "2. Test the deployment: ${YELLOW}npm run test:e2e${NC}"
echo -e "3. Access API docs: ${YELLOW}http://localhost:${API_PORT}/docs${NC}"

echo -e "\n${GREEN}✅ Tourist Rewards System is ready on Mumbai testnet!${NC}"