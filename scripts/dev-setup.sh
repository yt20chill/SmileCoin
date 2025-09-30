#!/bin/bash

# Tourist Rewards System - Development Setup Script

set -e

echo "🚀 Setting up Tourist Rewards System development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    print_error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

print_status "Starting development containers..."

# Start the containers
docker-compose up -d postgres redis

print_status "Waiting for containers to be healthy..."

# Wait for PostgreSQL to be ready
echo -n "Waiting for PostgreSQL"
until docker-compose exec postgres pg_isready -U dev -d tourist_rewards > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo ""
print_success "PostgreSQL is ready!"

# Wait for Redis to be ready
echo -n "Waiting for Redis"
until docker-compose exec redis redis-cli ping > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo ""
print_success "Redis is ready!"

print_status "Setting up backend environment..."

# Copy .env.example to .env if it doesn't exist
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    print_success "Created backend/.env from .env.example"
else
    print_warning "backend/.env already exists, skipping copy"
fi

# Install backend dependencies
if [ -d "backend/node_modules" ]; then
    print_warning "Backend dependencies already installed, skipping npm install"
else
    print_status "Installing backend dependencies..."
    cd backend && npm install && cd ..
    print_success "Backend dependencies installed!"
fi

print_status "Running database migrations..."
cd backend && npm run migrate && cd ..
print_success "Database migrations completed!"

print_status "Generating Prisma client..."
cd backend && npm run generate && cd ..
print_success "Prisma client generated!"

print_success "🎉 Development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Start the backend server: cd backend && npm run dev"
echo "  2. Access PostgreSQL: docker-compose exec postgres psql -U dev -d tourist_rewards"
echo "  3. Access Redis CLI: docker-compose exec redis redis-cli"
echo ""
echo "🔧 Optional tools (run with --profile tools):"
echo "  - pgAdmin: http://localhost:8080 (admin@admin.com / admin)"
echo "  - Redis Commander: http://localhost:8081"
echo "  - Start tools: docker-compose --profile tools up -d"
echo ""
echo "🛑 To stop containers: docker-compose down"
echo "🗑️  To reset data: docker-compose down -v"