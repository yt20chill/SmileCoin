# Tourist Rewards System - Development Makefile

.PHONY: help setup start stop restart logs clean migrate generate seed test

# Default target
help:
	@echo "Tourist Rewards System - Development Commands"
	@echo ""
	@echo "Setup Commands:"
	@echo "  setup     - Set up development environment (Docker + dependencies)"
	@echo "  migrate   - Run database migrations"
	@echo "  generate  - Generate Prisma client"
	@echo "  seed      - Seed database with test data"
	@echo ""
	@echo "Container Management:"
	@echo "  start     - Start development containers"
	@echo "  stop      - Stop development containers"
	@echo "  restart   - Restart development containers"
	@echo "  logs      - Show container logs"
	@echo "  clean     - Stop containers and remove volumes"
	@echo ""
	@echo "Development:"
	@echo "  dev       - Start backend development server"
	@echo "  test      - Run backend tests"
	@echo "  tools     - Start optional development tools (pgAdmin, Redis Commander)"

# Setup development environment
setup:
	@echo "🚀 Setting up development environment..."
	@./scripts/dev-setup.sh

# Container management
start:
	@echo "🐳 Starting development containers..."
	@docker-compose up -d postgres redis

stop:
	@echo "🛑 Stopping development containers..."
	@docker-compose down

restart:
	@echo "🔄 Restarting development containers..."
	@docker-compose restart postgres redis

logs:
	@echo "📋 Showing container logs..."
	@docker-compose logs -f postgres redis

clean:
	@echo "🗑️ Cleaning up containers and volumes..."
	@docker-compose down -v
	@docker system prune -f

# Database operations
migrate:
	@echo "🗄️ Running database migrations..."
	@cd backend && npm run migrate

generate:
	@echo "⚙️ Generating Prisma client..."
	@cd backend && npm run generate

seed:
	@echo "🌱 Seeding database..."
	@cd backend && npm run seed

# Development
dev:
	@echo "🚀 Starting backend development server..."
	@cd backend && npm run dev

test:
	@echo "🧪 Running backend tests..."
	@cd backend && npm test

# Optional development tools
tools:
	@echo "🔧 Starting development tools..."
	@docker-compose --profile tools up -d
	@echo "pgAdmin: http://localhost:8080 (admin@admin.com / admin)"
	@echo "Redis Commander: http://localhost:8081"

# Check container status
status:
	@echo "📊 Container status:"
	@docker-compose ps