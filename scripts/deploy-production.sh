#!/bin/bash
# deploy-production.sh - Deploy to Polygon Mainnet (Production)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}⚠️  PRODUCTION DEPLOYMENT WARNING ⚠️${NC}"
echo -e "${RED}====================================${NC}"
echo -e "${YELLOW}This script will deploy to Polygon MAINNET using REAL MATIC tokens.${NC}"
echo -e "${YELLOW}Please ensure you have:${NC}"
echo -e "${YELLOW}1. Thoroughly tested on testnet${NC}"
echo -e "${YELLOW}2. Completed security audit${NC}"
echo -e "${YELLOW}3. Sufficient MATIC for deployment (minimum 1 MATIC)${NC}"
echo -e "${YELLOW}4. Backup of all critical data${NC}"
echo -e "${YELLOW}5. Production environment properly configured${NC}"

read -p "Are you sure you want to proceed with PRODUCTION deployment? (type 'YES' to continue): " confirm

if [ "$confirm" != "YES" ]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi

echo -e "\n${BLUE}🚀 Starting Production Deployment to Polygon Mainnet${NC}"
echo -e "${BLUE}===================================================${NC}"

# Check if production environment file exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production file not found${NC}"
    echo -e "${YELLOW}💡 Creating production environment file from template...${NC}"
    cp .env.example .env.production
    echo -e "${YELLOW}⚠️  Please update .env.production with your configuration and run again${NC}"
    exit 1
fi

# Load production environment
source .env.production

echo -e "${BLUE}📋 Production Configuration:${NC}"
echo -e "  Network: ${YELLOW}polygon (mainnet)${NC}"
echo -e "  Environment: ${YELLOW}production${NC}"
echo -e "  RPC URL: ${YELLOW}${RPC_URL}${NC}"
echo -e "  Chain ID: ${YELLOW}${CHAIN_ID}${NC}"

# Validate required environment variables
required_vars=("RPC_URL" "ADMIN_PRIVATE_KEY" "DATABASE_URL" "API_KEY_SECRET" "WALLET_SEED")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Required environment variable ${var} is not set in .env.production${NC}"
        exit 1
    fi
done

# Check for default/insecure values
if [[ "$API_KEY_SECRET" == *"CHANGE-THIS"* ]] || [[ "$WALLET_SEED" == *"CHANGE-THIS"* ]]; then
    echo -e "${RED}❌ Default security values detected in .env.production${NC}"
    echo -e "${RED}Please update API_KEY_SECRET and WALLET_SEED with secure values${NC}"
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

# Check if balance is sufficient (minimum 1 MATIC for production)
BALANCE_CHECK=$(node -e "
    const balance = parseFloat('${BALANCE}');
    console.log(balance >= 1.0 ? 'sufficient' : 'insufficient');
")

if [ "$BALANCE_CHECK" = "insufficient" ]; then
    echo -e "${RED}❌ Insufficient MATIC balance for production deployment${NC}"
    echo -e "${YELLOW}💡 Please fund your admin wallet with at least 1 MATIC${NC}"
    echo -e "${YELLOW}   Admin wallet: ${ADMIN_ADDRESS}${NC}"
    exit 1
fi

# Final confirmation
echo -e "\n${RED}⚠️  FINAL CONFIRMATION ⚠️${NC}"
echo -e "${YELLOW}You are about to deploy to POLYGON MAINNET${NC}"
echo -e "${YELLOW}Admin wallet: ${ADMIN_ADDRESS}${NC}"
echo -e "${YELLOW}Balance: ${BALANCE} MATIC${NC}"
read -p "Type 'DEPLOY' to proceed: " final_confirm

if [ "$final_confirm" != "DEPLOY" ]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi

# Create deployment backup
echo -e "\n${BLUE}💾 Creating deployment backup...${NC}"
BACKUP_DIR="backups/production-deployment-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup current state
cp -r contracts "$BACKUP_DIR/"
cp -r scripts "$BACKUP_DIR/"
cp .env.production "$BACKUP_DIR/"
cp package.json "$BACKUP_DIR/"
cp hardhat.config.ts "$BACKUP_DIR/"

echo -e "${GREEN}✅ Backup created: ${BACKUP_DIR}${NC}"

# Step 1: Install dependencies
echo -e "\n${BLUE}📦 Installing dependencies...${NC}"
npm ci --only=production

# Step 2: Compile contracts
echo -e "\n${BLUE}🔨 Compiling smart contracts...${NC}"
npx hardhat compile

# Step 3: Run pre-deployment checks
echo -e "\n${BLUE}🔍 Running pre-deployment checks...${NC}"

# Check contract compilation
if [ ! -f "artifacts/contracts/SmileCoin.sol/SmileCoin.json" ]; then
    echo -e "${RED}❌ Contract compilation failed${NC}"
    exit 1
fi

# Check database connection
if command -v psql &> /dev/null; then
    if ! psql "$DATABASE_URL" -c '\q' 2>/dev/null; then
        echo -e "${RED}❌ Cannot connect to production database${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Database connection verified${NC}"
else
    echo -e "${YELLOW}⚠️  psql not found. Please verify database connection manually${NC}"
fi

# Step 4: Deploy smart contracts
echo -e "\n${BLUE}🚀 Deploying SmileCoin contract to Polygon Mainnet...${NC}"
echo -e "${YELLOW}⏳ This may take several minutes...${NC}"

DEPLOY_OUTPUT=$(npx hardhat run scripts/deploy.js --network polygon 2>&1)
echo "$DEPLOY_OUTPUT"

# Extract contract address from deployment output
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "SmileCoin deployed to:" | cut -d' ' -f4 | tr -d '\r\n')

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo -e "${RED}❌ Contract deployment failed${NC}"
    echo -e "${RED}Deploy output: ${DEPLOY_OUTPUT}${NC}"
    exit 1
fi

echo -e "${GREEN}✅ SmileCoin contract deployed to: ${CONTRACT_ADDRESS}${NC}"

# Step 5: Update environment with contract address
echo -e "\n${BLUE}📝 Updating production environment...${NC}"
if grep -q "CONTRACT_ADDRESS=" .env.production; then
    sed -i.bak "s/CONTRACT_ADDRESS=.*/CONTRACT_ADDRESS=${CONTRACT_ADDRESS}/" .env.production
else
    echo "CONTRACT_ADDRESS=${CONTRACT_ADDRESS}" >> .env.production
fi
echo -e "${GREEN}✅ Environment updated${NC}"

# Step 6: Verify contract on PolygonScan
if [ -n "$POLYGONSCAN_API_KEY" ]; then
    echo -e "\n${BLUE}🔍 Verifying contract on PolygonScan...${NC}"
    sleep 30 # Wait for contract to be indexed
    
    npx hardhat verify --network polygon "$CONTRACT_ADDRESS" || {
        echo -e "${YELLOW}⚠️  Contract verification failed, but deployment succeeded${NC}"
    }
else
    echo -e "${YELLOW}⚠️  POLYGONSCAN_API_KEY not set, skipping verification${NC}"
fi

# Step 7: Run database migrations
echo -e "\n${BLUE}🗄️  Running database migrations...${NC}"
if command -v psql &> /dev/null; then
    psql "$DATABASE_URL" -f database/init.sql
    echo -e "${GREEN}✅ Database migrations completed${NC}"
else
    echo -e "${YELLOW}⚠️  Please run database migrations manually:${NC}"
    echo -e "  psql \$DATABASE_URL -f database/init.sql"
fi

# Step 8: Build production application
echo -e "\n${BLUE}🏗️  Building production application...${NC}"
npm run build
echo -e "${GREEN}✅ Application built${NC}"

# Step 9: Run production health checks
echo -e "\n${BLUE}🏥 Running production health checks...${NC}"

# Check contract deployment
CONTRACT_CHECK=$(node -e "
    const { ethers } = require('ethers');
    async function checkContract() {
        try {
            const provider = new ethers.JsonRpcProvider('${RPC_URL}');
            const code = await provider.getCode('${CONTRACT_ADDRESS}');
            console.log(code === '0x' ? 'FAILED' : 'SUCCESS');
        } catch (error) {
            console.log('FAILED');
        }
    }
    checkContract();
")

if [ "$CONTRACT_CHECK" = "SUCCESS" ]; then
    echo -e "${GREEN}  ✅ Contract deployment verified${NC}"
else
    echo -e "${RED}  ❌ Contract deployment verification failed${NC}"
    exit 1
fi

# Step 10: Create production deployment package
echo -e "\n${BLUE}📦 Creating production deployment package...${NC}"

PACKAGE_DIR="production-package-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$PACKAGE_DIR"

# Copy production files
cp -r dist "$PACKAGE_DIR/"
cp -r database "$PACKAGE_DIR/"
cp -r nginx "$PACKAGE_DIR/"
cp package.json "$PACKAGE_DIR/"
cp package-lock.json "$PACKAGE_DIR/"
cp .env.production "$PACKAGE_DIR/"
cp docker-compose.production.yml "$PACKAGE_DIR/"

# Copy deployment scripts
mkdir -p "$PACKAGE_DIR/scripts"
cp scripts/health-check.js "$PACKAGE_DIR/scripts/"
cp scripts/backup.sh "$PACKAGE_DIR/scripts/"
cp scripts/start-staging-api.sh "$PACKAGE_DIR/scripts/start-production-api.sh"

# Create production README
cat > "$PACKAGE_DIR/README.md" << EOF
# Tourist Rewards System - Production Package

This package contains the production-ready Tourist Rewards System.

## Deployment Information
- Deployed: $(date)
- Network: Polygon Mainnet
- Contract Address: ${CONTRACT_ADDRESS}
- Admin Wallet: ${ADMIN_ADDRESS}

## Quick Start

1. Install dependencies:
   \`\`\`bash
   npm ci --only=production
   \`\`\`

2. Set up database:
   \`\`\`bash
   psql \$DATABASE_URL -f database/init.sql
   \`\`\`

3. Start services:
   \`\`\`bash
   ./scripts/start-production-api.sh
   \`\`\`

4. Health check:
   \`\`\`bash
   node scripts/health-check.js
   \`\`\`

## Important Files
- \`.env.production\` - Production environment configuration
- \`docker-compose.production.yml\` - Docker production setup
- \`nginx/production.conf\` - Nginx configuration
- \`scripts/backup.sh\` - Database backup script

## Monitoring
- Contract: https://polygonscan.com/address/${CONTRACT_ADDRESS}
- Admin Wallet: https://polygonscan.com/address/${ADMIN_ADDRESS}

## Support
Refer to the main documentation for operational procedures.
EOF

# Create deployment manifest
cat > "$PACKAGE_DIR/deployment-manifest.json" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "1.0.0",
  "network": {
    "name": "polygon",
    "chainId": 137,
    "rpcUrl": "${RPC_URL}"
  },
  "contract": {
    "address": "${CONTRACT_ADDRESS}",
    "explorerUrl": "https://polygonscan.com/address/${CONTRACT_ADDRESS}"
  },
  "admin": {
    "address": "${ADMIN_ADDRESS}",
    "explorerUrl": "https://polygonscan.com/address/${ADMIN_ADDRESS}"
  },
  "environment": "production",
  "status": "deployed",
  "files": [
    "dist/",
    "database/",
    "nginx/",
    "scripts/",
    ".env.production",
    "docker-compose.production.yml",
    "package.json",
    "README.md"
  ]
}
EOF

# Create deployment archive
tar -czf "${PACKAGE_DIR}.tar.gz" "$PACKAGE_DIR"
echo -e "${GREEN}✅ Production package created: ${PACKAGE_DIR}.tar.gz${NC}"

# Step 11: Generate deployment summary
echo -e "\n${BLUE}📊 Generating deployment summary...${NC}"
cat > "production-deployment-info.json" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "network": {
    "name": "polygon",
    "chainId": 137,
    "rpcUrl": "${RPC_URL}"
  },
  "contract": {
    "address": "${CONTRACT_ADDRESS}",
    "explorerUrl": "https://polygonscan.com/address/${CONTRACT_ADDRESS}"
  },
  "admin": {
    "address": "${ADMIN_ADDRESS}",
    "explorerUrl": "https://polygonscan.com/address/${ADMIN_ADDRESS}",
    "balance": "${BALANCE}"
  },
  "environment": "production",
  "status": "deployed",
  "apiPort": ${API_PORT},
  "databaseUrl": "${DATABASE_URL}",
  "backupLocation": "${BACKUP_DIR}",
  "packageLocation": "${PACKAGE_DIR}.tar.gz"
}
EOF

echo -e "\n${GREEN}🎉 PRODUCTION DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
echo -e "${GREEN}=================================================${NC}"

echo -e "\n${BLUE}📋 Deployment Summary:${NC}"
echo -e "  Contract Address: ${YELLOW}${CONTRACT_ADDRESS}${NC}"
echo -e "  Network: ${YELLOW}Polygon Mainnet${NC}"
echo -e "  Admin Wallet: ${YELLOW}${ADMIN_ADDRESS}${NC}"
echo -e "  Environment: ${YELLOW}production${NC}"
echo -e "  Package: ${YELLOW}${PACKAGE_DIR}.tar.gz${NC}"

echo -e "\n${BLUE}🔗 Important Links:${NC}"
echo -e "  Contract on PolygonScan: ${YELLOW}https://polygonscan.com/address/${CONTRACT_ADDRESS}${NC}"
echo -e "  Admin wallet on PolygonScan: ${YELLOW}https://polygonscan.com/address/${ADMIN_ADDRESS}${NC}"

echo -e "\n${BLUE}📄 Files Created:${NC}"
echo -e "  - production-deployment-info.json (deployment details)"
echo -e "  - ${PACKAGE_DIR}.tar.gz (production package)"
echo -e "  - ${BACKUP_DIR}/ (deployment backup)"

echo -e "\n${BLUE}🚀 Next Steps:${NC}"
echo -e "1. Deploy package to production servers: ${YELLOW}${PACKAGE_DIR}.tar.gz${NC}"
echo -e "2. Set up monitoring and alerting"
echo -e "3. Configure load balancer and SSL certificates"
echo -e "4. Set up automated backups"
echo -e "5. Test production deployment thoroughly"

echo -e "\n${RED}⚠️  IMPORTANT SECURITY REMINDERS:${NC}"
echo -e "- Secure your admin private key"
echo -e "- Set up proper monitoring and alerting"
echo -e "- Configure automated backups"
echo -e "- Review and update security settings regularly"
echo -e "- Monitor contract for unusual activity"

echo -e "\n${GREEN}✅ Tourist Rewards System is LIVE on Polygon Mainnet!${NC}"