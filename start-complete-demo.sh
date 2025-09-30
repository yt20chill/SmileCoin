#!/bin/bash
# start-complete-demo.sh - Start blockchain + web dashboard

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Complete SmileCoin Demo with Web Dashboard${NC}"
echo -e "${BLUE}====================================================${NC}"

# Step 1: Start local blockchain and deploy contract
echo -e "\n${BLUE}📦 Step 1: Starting blockchain and deploying contract...${NC}"
./start-local-demo.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start blockchain demo${NC}"
    exit 1
fi

# Step 2: Start web dashboard server
echo -e "\n${BLUE}🌐 Step 2: Starting web dashboard server...${NC}"
node start-web-dashboard.js &
WEB_PID=$!
echo $WEB_PID > web-dashboard.pid

# Wait for web server to start
sleep 3

# Check if web server is running
if curl -s http://localhost:3001 > /dev/null; then
    echo -e "${GREEN}✅ Web dashboard server started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start web dashboard server${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 Complete Demo Started Successfully!${NC}"
echo -e "${GREEN}====================================${NC}"

echo -e "\n${BLUE}🔗 Access Points:${NC}"
echo -e "  📊 Web Dashboard: ${YELLOW}http://localhost:3001${NC}"
echo -e "  🌐 Blockchain RPC: ${YELLOW}http://127.0.0.1:8545${NC}"
echo -e "  📄 Deployment Report: ${YELLOW}local-deployment-report.json${NC}"

echo -e "\n${BLUE}📱 What You Can Do:${NC}"
echo -e "  1. ${YELLOW}Open http://localhost:3001 in your browser${NC}"
echo -e "  2. View live contract data and transactions"
echo -e "  3. See tourist and restaurant balances"
echo -e "  4. Monitor blockchain activity in real-time"
echo -e "  5. Take screenshots of the web interface"

echo -e "\n${BLUE}🛑 To Stop Everything:${NC}"
echo -e "  Run: ${YELLOW}./stop-complete-demo.sh${NC}"

echo -e "\n${BLUE}📊 System Status:${NC}"
echo -e "  ✅ Hardhat Network: Running on port 8545"
echo -e "  ✅ SmileCoin Contract: Deployed and functional"
echo -e "  ✅ Web Dashboard: Running on port 3001"
echo -e "  ✅ Demo Data: 2 tourists, 2 restaurants, transactions completed"

echo -e "\n${GREEN}🎯 Perfect for Screenshots and Demonstration!${NC}"
echo -e "${YELLOW}Open your browser now: http://localhost:3001${NC}"