#!/bin/bash

# Setup test database for Tourist Rewards System

set -e

echo "🧪 Setting up test database..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PostgreSQL container is running
if ! docker-compose ps postgres | grep -q "Up"; then
    print_error "PostgreSQL container is not running. Please run 'docker-compose up -d postgres' first."
    exit 1
fi

print_status "Creating test database and user..."

# Create test user first
docker-compose exec postgres psql -U dev -d postgres -c "
DO \$\$
BEGIN
    -- Create test user if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'test') THEN
        CREATE USER test WITH PASSWORD 'test';
    END IF;
    
    -- Grant privileges
    ALTER USER test CREATEDB;
END
\$\$;
"

# Create test database - ignore error if it already exists
docker-compose exec postgres psql -U dev -d postgres -c "CREATE DATABASE tourist_rewards_test OWNER test;" 2>/dev/null || print_status "Test database already exists"

# Grant additional privileges
docker-compose exec postgres psql -U dev -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE tourist_rewards_test TO test;" 2>/dev/null || true

print_status "Setting up test database schema..."

# Connect to test database and set up extensions
docker-compose exec postgres psql -U test -d tourist_rewards_test -c "
-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";

-- Set timezone to UTC for consistency
SET timezone = 'UTC';
"

print_success "Test database setup complete!"
print_status "Test database connection: postgresql://test:test@localhost:5432/tourist_rewards_test"