#!/bin/bash
# Contract management script for upgrades and rollbacks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NETWORK=${1:-"polygon-mumbai"}
ACTION=${2:-"deploy"}
CONTRACT_VERSION=${3:-""}

# Available actions
VALID_ACTIONS=("deploy" "upgrade" "rollback" "verify" "status")

# Function to display usage
usage() {
    echo -e "${BLUE}Contract Manager for Tourist Rewards System${NC}"
    echo -e "${BLUE}===========================================${NC}"
    echo ""
    echo "Usage: $0 <network> <action> [version]"
    echo ""
    echo "Networks:"
    echo "  hardhat         - Local development network"
    echo "  polygon-mumbai  - Polygon Mumbai testnet"
    echo "  polygon         - Polygon mainnet"
    echo ""
    echo "Actions:"
    echo "  deploy          - Deploy new contract"
    echo "  upgrade         - Upgrade existing contract"
    echo "  rollback        - Rollback to previous version"
    echo "  verify          - Verify contract on explorer"
    echo "  status          - Show contract status"
    echo ""
    echo "Examples:"
    echo "  $0 polygon-mumbai deploy"
    echo "  $0 polygon upgrade v2.0.0"
    echo "  $0 polygon-mumbai rollback v1.0.0"
    echo "  $0 polygon verify"
}

# Validate action
validate_action() {
    if [[ ! " ${VALID_ACTIONS[@]} " =~ " ${ACTION} " ]]; then
        echo -e "${RED}❌ Invalid action: ${ACTION}${NC}"
        echo -e "${YELLOW}Valid actions: ${VALID_ACTIONS[*]}${NC}"
        exit 1
    fi
}

# Load environment based on network
load_environment() {
    case $NETWORK in
        "hardhat")
            ENV_FILE=".env.development"
            ;;
        "polygon-mumbai")
            ENV_FILE=".env.staging"
            ;;
        "polygon")
            ENV_FILE=".env.production"
            ;;
        *)
            echo -e "${RED}❌ Unknown network: ${NETWORK}${NC}"
            exit 1
            ;;
    esac
    
    if [ -f "$ENV_FILE" ]; then
        source "$ENV_FILE"
        echo -e "${GREEN}✅ Loaded environment from ${ENV_FILE}${NC}"
    else
        echo -e "${RED}❌ Environment file ${ENV_FILE} not found${NC}"
        exit 1
    fi
}

# Create deployment record
create_deployment_record() {
    local contract_address=$1
    local version=$2
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Create deployments directory if it doesn't exist
    mkdir -p deployments
    
    # Create deployment record
    cat > "deployments/${NETWORK}-${version}.json" << EOF
{
  "network": "${NETWORK}",
  "version": "${version}",
  "contractAddress": "${contract_address}",
  "deployedAt": "${timestamp}",
  "deployer": "$(node -e "const { ethers } = require('ethers'); const wallet = new ethers.Wallet('${ADMIN_PRIVATE_KEY}'); console.log(wallet.address);")",
  "rpcUrl": "${RPC_URL}",
  "chainId": "${CHAIN_ID}",
  "gasUsed": "",
  "transactionHash": ""
}
EOF
    
    echo -e "${GREEN}✅ Deployment record created: deployments/${NETWORK}-${version}.json${NC}"
}

# Deploy new contract
deploy_contract() {
    echo -e "${BLUE}🚀 Deploying SmileCoin contract to ${NETWORK}...${NC}"
    
    # Compile contracts
    echo -e "${YELLOW}📦 Compiling contracts...${NC}"
    npx hardhat compile
    
    # Deploy contract
    echo -e "${YELLOW}🔨 Deploying contract...${NC}"
    DEPLOY_OUTPUT=$(npx hardhat run scripts/deploy.js --network ${NETWORK} 2>&1)
    echo "$DEPLOY_OUTPUT"
    
    # Extract contract address
    CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "SmileCoin deployed to:" | cut -d' ' -f4 | tr -d '\r\n')
    
    if [ -z "$CONTRACT_ADDRESS" ]; then
        echo -e "${RED}❌ Contract deployment failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Contract deployed to: ${CONTRACT_ADDRESS}${NC}"
    
    # Generate version if not provided
    if [ -z "$CONTRACT_VERSION" ]; then
        CONTRACT_VERSION="v$(date +%Y%m%d-%H%M%S)"
    fi
    
    # Create deployment record
    create_deployment_record "$CONTRACT_ADDRESS" "$CONTRACT_VERSION"
    
    # Update environment file
    if grep -q "CONTRACT_ADDRESS=" "$ENV_FILE"; then
        sed -i.bak "s/CONTRACT_ADDRESS=.*/CONTRACT_ADDRESS=${CONTRACT_ADDRESS}/" "$ENV_FILE"
    else
        echo "CONTRACT_ADDRESS=${CONTRACT_ADDRESS}" >> "$ENV_FILE"
    fi
    
    echo -e "${GREEN}✅ Environment updated with new contract address${NC}"
}

# Upgrade contract (for upgradeable contracts)
upgrade_contract() {
    echo -e "${BLUE}⬆️  Upgrading SmileCoin contract on ${NETWORK}...${NC}"
    
    if [ -z "$CONTRACT_ADDRESS" ]; then
        echo -e "${RED}❌ No contract address found in environment${NC}"
        exit 1
    fi
    
    if [ -z "$CONTRACT_VERSION" ]; then
        echo -e "${RED}❌ Version required for upgrade${NC}"
        exit 1
    fi
    
    # Compile contracts
    echo -e "${YELLOW}📦 Compiling contracts...${NC}"
    npx hardhat compile
    
    # Create upgrade script
    cat > "scripts/upgrade-temp.js" << EOF
const { ethers, upgrades } = require("hardhat");

async function main() {
    const SmileCoin = await ethers.getContractFactory("SmileCoin");
    
    console.log("Upgrading SmileCoin contract...");
    const upgraded = await upgrades.upgradeProxy("${CONTRACT_ADDRESS}", SmileCoin);
    
    console.log("SmileCoin upgraded at:", upgraded.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
EOF
    
    # Run upgrade
    echo -e "${YELLOW}🔨 Running upgrade...${NC}"
    npx hardhat run scripts/upgrade-temp.js --network ${NETWORK}
    
    # Clean up temporary script
    rm scripts/upgrade-temp.js
    
    # Create deployment record for upgrade
    create_deployment_record "$CONTRACT_ADDRESS" "$CONTRACT_VERSION"
    
    echo -e "${GREEN}✅ Contract upgraded to version ${CONTRACT_VERSION}${NC}"
}

# Rollback to previous version
rollback_contract() {
    echo -e "${BLUE}⬅️  Rolling back SmileCoin contract on ${NETWORK}...${NC}"
    
    if [ -z "$CONTRACT_VERSION" ]; then
        echo -e "${RED}❌ Version required for rollback${NC}"
        exit 1
    fi
    
    # Check if deployment record exists
    DEPLOYMENT_FILE="deployments/${NETWORK}-${CONTRACT_VERSION}.json"
    if [ ! -f "$DEPLOYMENT_FILE" ]; then
        echo -e "${RED}❌ Deployment record not found: ${DEPLOYMENT_FILE}${NC}"
        exit 1
    fi
    
    # Extract contract address from deployment record
    ROLLBACK_ADDRESS=$(node -e "const data = require('./${DEPLOYMENT_FILE}'); console.log(data.contractAddress);")
    
    echo -e "${YELLOW}⚠️  Rolling back to contract address: ${ROLLBACK_ADDRESS}${NC}"
    echo -e "${YELLOW}⚠️  This will update your environment configuration${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cancelled${NC}"
        exit 0
    fi
    
    # Update environment file
    if grep -q "CONTRACT_ADDRESS=" "$ENV_FILE"; then
        sed -i.bak "s/CONTRACT_ADDRESS=.*/CONTRACT_ADDRESS=${ROLLBACK_ADDRESS}/" "$ENV_FILE"
    else
        echo "CONTRACT_ADDRESS=${ROLLBACK_ADDRESS}" >> "$ENV_FILE"
    fi
    
    echo -e "${GREEN}✅ Rolled back to version ${CONTRACT_VERSION}${NC}"
    echo -e "${GREEN}✅ Contract address: ${ROLLBACK_ADDRESS}${NC}"
}

# Verify contract on block explorer
verify_contract() {
    echo -e "${BLUE}🔍 Verifying SmileCoin contract on ${NETWORK}...${NC}"
    
    if [ -z "$CONTRACT_ADDRESS" ]; then
        echo -e "${RED}❌ No contract address found in environment${NC}"
        exit 1
    fi
    
    # Verify based on network
    case $NETWORK in
        "polygon-mumbai")
            echo -e "${YELLOW}📝 Verifying on PolygonScan Mumbai...${NC}"
            npx hardhat verify --network ${NETWORK} ${CONTRACT_ADDRESS}
            echo -e "${GREEN}✅ View on explorer: https://mumbai.polygonscan.com/address/${CONTRACT_ADDRESS}${NC}"
            ;;
        "polygon")
            echo -e "${YELLOW}📝 Verifying on PolygonScan...${NC}"
            npx hardhat verify --network ${NETWORK} ${CONTRACT_ADDRESS}
            echo -e "${GREEN}✅ View on explorer: https://polygonscan.com/address/${CONTRACT_ADDRESS}${NC}"
            ;;
        "hardhat")
            echo -e "${YELLOW}⚠️  Cannot verify on local hardhat network${NC}"
            ;;
        *)
            echo -e "${YELLOW}⚠️  Verification not configured for network: ${NETWORK}${NC}"
            ;;
    esac
}

# Show contract status
show_status() {
    echo -e "${BLUE}📊 Contract Status for ${NETWORK}${NC}"
    echo -e "${BLUE}================================${NC}"
    
    if [ -z "$CONTRACT_ADDRESS" ]; then
        echo -e "${RED}❌ No contract address found in environment${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Contract Address:${NC} ${CONTRACT_ADDRESS}"
    echo -e "${YELLOW}Network:${NC} ${NETWORK}"
    echo -e "${YELLOW}RPC URL:${NC} ${RPC_URL}"
    
    # Check contract code
    echo -e "\n${YELLOW}Checking contract deployment...${NC}"
    CONTRACT_CODE=$(node -e "
        const { ethers } = require('ethers');
        const provider = new ethers.JsonRpcProvider('${RPC_URL}');
        provider.getCode('${CONTRACT_ADDRESS}').then(code => {
            if (code === '0x') {
                console.log('❌ No contract code found');
            } else {
                console.log('✅ Contract is deployed');
                console.log('Code size:', code.length, 'characters');
            }
        }).catch(err => console.log('❌ Error:', err.message));
    ")
    
    # List available deployments
    echo -e "\n${YELLOW}Available Deployments:${NC}"
    if [ -d "deployments" ]; then
        ls -la deployments/${NETWORK}-*.json 2>/dev/null | while read line; do
            filename=$(echo $line | awk '{print $9}')
            if [ -n "$filename" ]; then
                version=$(basename "$filename" .json | sed "s/${NETWORK}-//")
                address=$(node -e "try { const data = require('./deployments/${filename}'); console.log(data.contractAddress); } catch(e) { console.log('N/A'); }")
                timestamp=$(node -e "try { const data = require('./deployments/${filename}'); console.log(data.deployedAt); } catch(e) { console.log('N/A'); }")
                echo -e "  ${version}: ${address} (${timestamp})"
            fi
        done
    else
        echo -e "${YELLOW}  No deployment records found${NC}"
    fi
}

# Main execution
main() {
    # Show usage if no arguments
    if [ $# -eq 0 ]; then
        usage
        exit 0
    fi
    
    # Validate inputs
    validate_action
    
    # Load environment
    load_environment
    
    echo -e "${BLUE}🔧 Contract Manager - ${NETWORK} network${NC}"
    echo -e "${BLUE}Action: ${ACTION}${NC}"
    if [ -n "$CONTRACT_VERSION" ]; then
        echo -e "${BLUE}Version: ${CONTRACT_VERSION}${NC}"
    fi
    echo ""
    
    # Execute action
    case $ACTION in
        "deploy")
            deploy_contract
            ;;
        "upgrade")
            upgrade_contract
            ;;
        "rollback")
            rollback_contract
            ;;
        "verify")
            verify_contract
            ;;
        "status")
            show_status
            ;;
        *)
            echo -e "${RED}❌ Unknown action: ${ACTION}${NC}"
            usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"