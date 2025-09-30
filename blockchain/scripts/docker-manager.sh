#!/bin/bash
# Docker management script for Tourist Rewards Blockchain Infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-"development"}
ACTION=${2:-"up"}
SERVICES=${3:-""}

# Available environments
VALID_ENVIRONMENTS=("development" "staging" "production")

# Available actions
VALID_ACTIONS=("up" "down" "restart" "logs" "status" "build" "clean" "backup" "restore")

# Function to display usage
usage() {
    echo -e "${BLUE}Docker Manager for Tourist Rewards Blockchain Infrastructure${NC}"
    echo -e "${BLUE}============================================================${NC}"
    echo ""
    echo "Usage: $0 <environment> <action> [services]"
    echo ""
    echo "Environments:"
    echo "  development  - Local development with Hardhat node"
    echo "  staging      - Staging environment with testnet"
    echo "  production   - Production environment with mainnet"
    echo ""
    echo "Actions:"
    echo "  up           - Start services"
    echo "  down         - Stop services"
    echo "  restart      - Restart services"
    echo "  logs         - View logs"
    echo "  status       - Show service status"
    echo "  build        - Build images"
    echo "  clean        - Clean up containers and volumes"
    echo "  backup       - Backup database"
    echo "  restore      - Restore database"
    echo ""
    echo "Examples:"
    echo "  $0 development up"
    echo "  $0 staging restart api"
    echo "  $0 production logs"
    echo "  $0 development clean"
}

# Validate environment
validate_environment() {
    if [[ ! " ${VALID_ENVIRONMENTS[@]} " =~ " ${ENVIRONMENT} " ]]; then
        echo -e "${RED}❌ Invalid environment: ${ENVIRONMENT}${NC}"
        echo -e "${YELLOW}Valid environments: ${VALID_ENVIRONMENTS[*]}${NC}"
        exit 1
    fi
}

# Validate action
validate_action() {
    if [[ ! " ${VALID_ACTIONS[@]} " =~ " ${ACTION} " ]]; then
        echo -e "${RED}❌ Invalid action: ${ACTION}${NC}"
        echo -e "${YELLOW}Valid actions: ${VALID_ACTIONS[*]}${NC}"
        exit 1
    fi
}

# Get Docker Compose files for environment
get_compose_files() {
    local env=$1
    echo "-f docker-compose.yml -f docker-compose.${env}.yml"
}

# Load environment variables
load_environment() {
    local env_file=".env.${ENVIRONMENT}"
    if [ -f "$env_file" ]; then
        source "$env_file"
        echo -e "${GREEN}✅ Loaded environment from ${env_file}${NC}"
    else
        echo -e "${YELLOW}⚠️  Environment file ${env_file} not found${NC}"
        if [ "$ENVIRONMENT" != "development" ]; then
            echo -e "${RED}❌ Environment file required for ${ENVIRONMENT}${NC}"
            exit 1
        fi
    fi
}

# Start services
start_services() {
    echo -e "${BLUE}🚀 Starting ${ENVIRONMENT} environment...${NC}"
    
    local compose_files=$(get_compose_files $ENVIRONMENT)
    
    if [ "$ENVIRONMENT" = "production" ]; then
        echo -e "${YELLOW}⚠️  Starting production environment${NC}"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Cancelled${NC}"
            exit 0
        fi
    fi
    
    docker-compose $compose_files up -d $SERVICES
    
    echo -e "${GREEN}✅ Services started${NC}"
    
    # Show status
    docker-compose $compose_files ps
}

# Stop services
stop_services() {
    echo -e "${BLUE}🛑 Stopping ${ENVIRONMENT} environment...${NC}"
    
    local compose_files=$(get_compose_files $ENVIRONMENT)
    docker-compose $compose_files down $SERVICES
    
    echo -e "${GREEN}✅ Services stopped${NC}"
}

# Restart services
restart_services() {
    echo -e "${BLUE}🔄 Restarting ${ENVIRONMENT} environment...${NC}"
    
    local compose_files=$(get_compose_files $ENVIRONMENT)
    docker-compose $compose_files restart $SERVICES
    
    echo -e "${GREEN}✅ Services restarted${NC}"
}

# View logs
view_logs() {
    echo -e "${BLUE}📋 Viewing logs for ${ENVIRONMENT} environment...${NC}"
    
    local compose_files=$(get_compose_files $ENVIRONMENT)
    docker-compose $compose_files logs -f $SERVICES
}

# Show status
show_status() {
    echo -e "${BLUE}📊 Status of ${ENVIRONMENT} environment:${NC}"
    
    local compose_files=$(get_compose_files $ENVIRONMENT)
    docker-compose $compose_files ps
    
    echo -e "\n${BLUE}📈 Resource usage:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# Build images
build_images() {
    echo -e "${BLUE}🏗️  Building images for ${ENVIRONMENT} environment...${NC}"
    
    local compose_files=$(get_compose_files $ENVIRONMENT)
    docker-compose $compose_files build $SERVICES
    
    echo -e "${GREEN}✅ Images built${NC}"
}

# Clean up
clean_up() {
    echo -e "${BLUE}🧹 Cleaning up ${ENVIRONMENT} environment...${NC}"
    
    echo -e "${YELLOW}⚠️  This will remove containers, networks, and volumes${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cancelled${NC}"
        exit 0
    fi
    
    local compose_files=$(get_compose_files $ENVIRONMENT)
    docker-compose $compose_files down -v --remove-orphans
    
    # Remove unused images
    docker image prune -f
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Backup database
backup_database() {
    echo -e "${BLUE}💾 Backing up database for ${ENVIRONMENT} environment...${NC}"
    
    local compose_files=$(get_compose_files $ENVIRONMENT)
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="database/backups/backup_${ENVIRONMENT}_${timestamp}.sql"
    
    # Create backup directory
    mkdir -p database/backups
    
    # Run backup
    docker-compose $compose_files exec -T postgres pg_dump -U ${POSTGRES_USER:-postgres} ${POSTGRES_DB:-tourist_rewards} > $backup_file
    
    echo -e "${GREEN}✅ Database backed up to ${backup_file}${NC}"
}

# Restore database
restore_database() {
    echo -e "${BLUE}📥 Restoring database for ${ENVIRONMENT} environment...${NC}"
    
    # List available backups
    echo -e "${YELLOW}Available backups:${NC}"
    ls -la database/backups/*.sql 2>/dev/null || {
        echo -e "${RED}❌ No backup files found${NC}"
        exit 1
    }
    
    read -p "Enter backup filename: " backup_file
    
    if [ ! -f "database/backups/$backup_file" ]; then
        echo -e "${RED}❌ Backup file not found${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}⚠️  This will overwrite the current database${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cancelled${NC}"
        exit 0
    fi
    
    local compose_files=$(get_compose_files $ENVIRONMENT)
    
    # Restore backup
    docker-compose $compose_files exec -T postgres psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-tourist_rewards} < "database/backups/$backup_file"
    
    echo -e "${GREEN}✅ Database restored from ${backup_file}${NC}"
}

# Main execution
main() {
    # Show usage if no arguments
    if [ $# -eq 0 ]; then
        usage
        exit 0
    fi
    
    # Validate inputs
    validate_environment
    validate_action
    
    # Load environment
    load_environment
    
    echo -e "${BLUE}🐳 Docker Manager - ${ENVIRONMENT} environment${NC}"
    echo -e "${BLUE}Action: ${ACTION}${NC}"
    if [ -n "$SERVICES" ]; then
        echo -e "${BLUE}Services: ${SERVICES}${NC}"
    fi
    echo ""
    
    # Execute action
    case $ACTION in
        "up")
            start_services
            ;;
        "down")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "logs")
            view_logs
            ;;
        "status")
            show_status
            ;;
        "build")
            build_images
            ;;
        "clean")
            clean_up
            ;;
        "backup")
            backup_database
            ;;
        "restore")
            restore_database
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