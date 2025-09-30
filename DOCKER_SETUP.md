# Docker Development Setup

This document explains how to set up the development environment using Docker containers for the Tourist Rewards System.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (usually included with Docker Desktop)
- Node.js 18+ (for running the backend outside containers)

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Run the setup script
make setup
# or
./scripts/dev-setup.sh
```

This will:
- Start PostgreSQL and Redis containers
- Install backend dependencies
- Run database migrations
- Generate Prisma client

### Option 2: Manual Setup

```bash
# Start containers
make start
# or
docker-compose up -d postgres redis

# Install backend dependencies
cd backend && npm install

# Run migrations
make migrate
# or
cd backend && npm run migrate

# Generate Prisma client
make generate
# or
cd backend && npm run generate
```

## Available Services

### Core Services (Always Running)

- **PostgreSQL**: Database server
  - Port: `5432`
  - Database: `tourist_rewards`
  - User: `dev`
  - Password: `dev`
  - Connection: `postgresql://dev:dev@localhost:5432/tourist_rewards`

- **Redis**: Cache and session store
  - Port: `6379`
  - Connection: `redis://localhost:6379`

### Optional Tools (Profile: tools)

Start with: `make tools` or `docker-compose --profile tools up -d`

- **pgAdmin**: PostgreSQL web interface
  - URL: http://localhost:8080
  - Email: `admin@admin.com`
  - Password: `admin`

- **Redis Commander**: Redis web interface
  - URL: http://localhost:8081

## Common Commands

```bash
# Container management
make start          # Start containers
make stop           # Stop containers
make restart        # Restart containers
make logs           # View logs
make status         # Check container status
make clean          # Stop and remove volumes

# Database operations
make migrate        # Run Prisma migrations
make generate       # Generate Prisma client
make seed           # Seed test data

# Development
make dev            # Start backend dev server
make test           # Run tests
```

## Environment Variables

The backend uses these environment variables (defined in `backend/.env`):

```env
DATABASE_URL="postgresql://dev:dev@localhost:5432/tourist_rewards"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your_jwt_secret_here_change_in_production"
GOOGLE_MAPS_API_KEY="your_google_maps_api_key_here"
PORT=3000
NODE_ENV=development
```

## Database Schema

The system uses these main tables:

- `users` - Tourist information (privacy-first, no email/name)
- `restaurants` - Restaurant data with Google Place ID integration
- `transactions` - Blockchain transaction records
- `daily_rewards` - Daily coin distribution tracking

## Troubleshooting

### Containers won't start

```bash
# Check Docker is running
docker info

# Check port conflicts
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Reset everything
make clean
make setup
```

### Database connection issues

```bash
# Check PostgreSQL is ready
docker-compose exec postgres pg_isready -U dev -d tourist_rewards

# Connect to database directly
docker-compose exec postgres psql -U dev -d tourist_rewards

# Check logs
docker-compose logs postgres
```

### Redis connection issues

```bash
# Test Redis connection
docker-compose exec redis redis-cli ping

# Check logs
docker-compose logs redis
```

### Migration issues

```bash
# Reset database
make clean
make start
make migrate

# Or manually reset
docker-compose exec postgres psql -U dev -d tourist_rewards -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
make migrate
```

## Data Persistence

- PostgreSQL data is persisted in the `postgres_data` Docker volume
- Redis data is persisted in the `redis_data` Docker volume
- To completely reset data: `make clean`

## Development Workflow

1. Start containers: `make start`
2. Run migrations: `make migrate`
3. Start backend: `make dev`
4. Make changes to schema in `backend/prisma/schema.prisma`
5. Create migration: `cd backend && npx prisma migrate dev --name your_migration_name`
6. Generate client: `make generate`

## Production Notes

This Docker setup is for development only. For production:

- Use proper secrets management
- Configure proper networking
- Set up SSL/TLS
- Use production-grade PostgreSQL and Redis configurations
- Implement proper backup strategies