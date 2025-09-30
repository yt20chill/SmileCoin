#!/bin/bash
# stop-local-demo.sh - Stop local Hardhat network

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping SmileCoin Local Demo${NC}"
echo -e "${BLUE}===============================${NC}"

# Stop Hardhat node using PID file
if [ -f "hardhat-node.pid" ]; then
    PID=$(cat hardhat-node.pid)
    echo -e "${YELLOW}Stopping Hardhat node (PID: ${PID})...${NC}"
    kill $PID 2>/dev/null || true
    rm hardhat-node.pid
    echo -e "${GREEN}✅ Hardhat node stopped${NC}"
else
    echo -e "${YELLOW}⚠️  PID file not found, trying to kill by process name...${NC}"
    pkill -f "hardhat node" || true
    echo -e "${GREEN}✅ Attempted to stop Hardhat processes${NC}"
fi

# Clean up log file
if [ -f "hardhat-node.log" ]; then
    echo -e "${YELLOW}Archiving network logs...${NC}"
    mv hardhat-node.log "hardhat-node-$(date +%Y%m%d-%H%M%S).log"
    echo -e "${GREEN}✅ Logs archived${NC}"
fi

echo -e "\n${GREEN}🎉 Local demo stopped successfully!${NC}"
echo -e "${BLUE}Generated files are preserved for review:${NC}"
echo -e "  - local-deployment-report.json"
echo -e "  - hardhat-node-*.log (archived)"