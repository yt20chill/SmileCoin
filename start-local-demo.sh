#!/bin/bash
# start-local-demo.sh - Complete local deployment demo

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Complete SmileCoin Local Demo${NC}"
echo -e "${BLUE}=======================================${NC}"

# Check if Hardhat node is already running
if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  Hardhat node already running on port 8545${NC}"
    echo -e "${YELLOW}Stopping existing node...${NC}"
    pkill -f "hardhat node" || true
    sleep 2
fi

# Start Hardhat node in background
echo -e "\n${BLUE}🌐 Starting Hardhat local network...${NC}"
npx hardhat node --hostname 127.0.0.1 --port 8545 > hardhat-node.log 2>&1 &
HARDHAT_PID=$!
echo $HARDHAT_PID > hardhat-node.pid

# Wait for network to start
echo -e "${YELLOW}⏳ Waiting for network to initialize...${NC}"
sleep 5

# Check if network is running
if ! curl -s http://127.0.0.1:8545 > /dev/null; then
    echo -e "${RED}❌ Failed to start Hardhat network${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Hardhat network running on http://127.0.0.1:8545${NC}"

# Deploy and run complete demo
echo -e "\n${BLUE}📦 Deploying SmileCoin and running complete demo...${NC}"
npx hardhat run deploy-local-complete.js --network localhost

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}🎉 Local demo completed successfully!${NC}"
    echo -e "${GREEN}===================================${NC}"
    
    echo -e "\n${BLUE}📄 Generated Files:${NC}"
    echo -e "  - ${YELLOW}local-deployment-report.json${NC} - Complete deployment details"
    echo -e "  - ${YELLOW}hardhat-node.log${NC} - Network logs"
    echo -e "  - ${YELLOW}hardhat-node.pid${NC} - Network process ID"
    
    echo -e "\n${BLUE}🔗 Network Information:${NC}"
    echo -e "  - RPC URL: ${YELLOW}http://127.0.0.1:8545${NC}"
    echo -e "  - Chain ID: ${YELLOW}31337${NC}"
    echo -e "  - Network: ${YELLOW}Hardhat Local${NC}"
    
    echo -e "\n${BLUE}📊 View Results:${NC}"
    echo -e "  - Deployment report: ${YELLOW}cat local-deployment-report.json${NC}"
    echo -e "  - Network logs: ${YELLOW}tail -f hardhat-node.log${NC}"
    
    echo -e "\n${BLUE}🛑 Stop Network:${NC}"
    echo -e "  - Stop command: ${YELLOW}./stop-local-demo.sh${NC}"
    echo -e "  - Or kill process: ${YELLOW}kill ${HARDHAT_PID}${NC}"
    
    echo -e "\n${GREEN}✨ SmileCoin is now running locally with full demo data!${NC}"
else
    echo -e "\n${RED}❌ Deployment failed${NC}"
    echo -e "${YELLOW}Check hardhat-node.log for details${NC}"
    exit 1
fi