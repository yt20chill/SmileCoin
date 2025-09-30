#!/bin/bash
# stop-complete-demo.sh - Stop blockchain and web dashboard

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping Complete SmileCoin Demo${NC}"
echo -e "${BLUE}==================================${NC}"

# Stop web dashboard
if [ -f "web-dashboard.pid" ]; then
    WEB_PID=$(cat web-dashboard.pid)
    echo -e "${YELLOW}Stopping web dashboard (PID: ${WEB_PID})...${NC}"
    kill $WEB_PID 2>/dev/null || true
    rm web-dashboard.pid
    echo -e "${GREEN}✅ Web dashboard stopped${NC}"
else
    echo -e "${YELLOW}⚠️  Web dashboard PID file not found${NC}"
    pkill -f "start-web-dashboard.js" || true
fi

# Stop blockchain
echo -e "${YELLOW}Stopping blockchain network...${NC}"
./stop-local-demo.sh

echo -e "\n${GREEN}🎉 Complete demo stopped successfully!${NC}"
echo -e "${BLUE}All generated files are preserved:${NC}"
echo -e "  - local-deployment-report.json"
echo -e "  - hardhat-node-*.log (archived)"
echo -e "  - web-dashboard.html"