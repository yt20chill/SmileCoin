# Tourist Rewards System - Docker Setup

This document explains how to run the Tourist Rewards System using Docker Compose.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v2.0 or higher

## Services Overview

The system includes the following services:

### Core Services
- **PostgreSQL Database** - Main database (port 5432)
- **Redis Cache** - Caching and session storage (port 6379)
- **Backend API** - Node.js/Express API server (port 3001)

### Optional Tools (use `--profile tools`)
- **pgAdmin** - PostgreSQL web interface (port 8080)
- **Redis Commander** - Redis web interface (port 8081)

## Quick Start

### 1. Start Core Services

```bash
# Start database and cache only
docker-compose up postgres redis -d

# Or start everything including backend
docker-compose up -d
```

### 2. Start with Development Tools

```bash
# Start all services including pgAdmin and Redis Commander
docker-compose --profile tools up -d
```

### 3. Development Mode (Hot Reload)

```bash
# Start in development mode with hot reloading
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

## Service URLs

Once running, you can access:

- **API Server**: http://localhost:3001
- **API Documentation (Swagger)**: http://localhost:3001/api-docs
- **API Health Check**: http://localhost:3001/health
- **pgAdmin** (if tools profile): http://localhost:8080
  - Email: `admin@admin.com`
  - Password: `admin`
- **Redis Commander** (if tools profile): http://localhost:8081

## Environment Variables

The backend service uses these environment variables:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://dev:dev@postgres:5432/tourist_rewards
REDIS_URL=redis://redis:6379
JWT_SECRET=your_jwt_secret_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:8081
```

## Database Setup

### Initial Setup

```bash
# Run database migrations
docker-compose exec backend npm run migrate

# Seed test data
docker-compose exec backend npm run seed
```

### Database Access

**Via pgAdmin (Web Interface):**
1. Go to http://localhost:8080
2. Login with admin@admin.com / admin
3. Add server with:
   - Host: `postgres`
   - Port: `5432`
   - Database: `tourist_rewards`
   - Username: `dev`
   - Password: `dev`

**Via Command Line:**
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U dev -d tourist_rewards

# View tables
\dt

# Exit
\q
```

## API Testing

### Using Swagger UI
1. Go to http://localhost:3001/api-docs
2. Explore and test all API endpoints
3. Use the "Try it out" feature for interactive testing

### Using Postman
Import the collection from `backend/postman/Tourist-Rewards-API.postman_collection.json`

### Using curl
```bash
# Health check
curl http://localhost:3001/health

# API info
curl http://localhost:3001/api/v1

# Register user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "originCountry": "United States",
    "arrivalDate": "2024-01-15T10:00:00Z",
    "departureDate": "2024-01-22T15:00:00Z",
    "walletAddress": "0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4"
  }'
```

## Development Workflow

### 1. Code Changes
When developing, use the development compose file for hot reloading:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d backend
```

### 2. Database Changes
```bash
# Create new migration
docker-compose exec backend npx prisma migrate dev --name your_migration_name

# Reset database (careful!)
docker-compose exec backend npx prisma migrate reset
```

### 3. View Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f postgres
```

### 4. Run Tests
```bash
# Run all tests
docker-compose exec backend npm test

# Run tests with coverage
docker-compose exec backend npm run test:run

# Run specific test file
docker-compose exec backend npm test -- auth.test.ts
```

## Troubleshooting

### Port Conflicts
If you get port conflicts, you can change the ports in docker-compose.yml:

```yaml
services:
  backend:
    ports:
      - '3002:3000'  # Change from 3001 to 3002
```

### Database Connection Issues
```bash
# Check if PostgreSQL is ready
docker-compose exec postgres pg_isready -U dev -d tourist_rewards

# Restart database
docker-compose restart postgres
```

### Redis Connection Issues
```bash
# Check Redis
docker-compose exec redis redis-cli ping

# Should return "PONG"
```

### Backend Issues
```bash
# Check backend health
curl http://localhost:3001/health

# View backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Clean Restart
```bash
# Stop all services
docker-compose down

# Remove volumes (this will delete data!)
docker-compose down -v

# Rebuild and start
docker-compose up --build -d
```

## Production Deployment

For production deployment:

1. Update environment variables in docker-compose.yml
2. Use production Dockerfile (not .dev)
3. Set up proper secrets management
4. Configure reverse proxy (nginx)
5. Set up SSL certificates
6. Configure monitoring and logging

```bash
# Production build
docker-compose -f docker-compose.yml up -d --build
```

## Useful Commands

```bash
# View running containers
docker-compose ps

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View service logs
docker-compose logs -f [service_name]

# Execute command in container
docker-compose exec [service_name] [command]

# Rebuild specific service
docker-compose up --build [service_name]

# Scale service (if needed)
docker-compose up --scale backend=2 -d
```

## API Documentation Features

The Swagger documentation includes:

- **Complete API Reference** - All endpoints documented
- **Interactive Testing** - Try endpoints directly from the browser
- **Request/Response Examples** - Sample data for all endpoints
- **Authentication** - JWT token support built-in
- **Error Handling** - Comprehensive error response documentation
- **Schema Definitions** - All data models documented

Access it at: http://localhost:3001/api-docs

## Next Steps

1. **Mobile App Development** - Connect React Native app to http://localhost:3001
2. **Web Dashboard** - Connect React.js dashboard to the API
3. **Blockchain Integration** - Integrate with your blockchain teammate's services
4. **Testing** - Run comprehensive test suite
5. **Deployment** - Deploy to cloud platform

For more details, see the individual service README files in their respective directories.