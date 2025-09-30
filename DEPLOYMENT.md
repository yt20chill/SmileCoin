# Deployment Guide - Tourist Rewards Blockchain Infrastructure

This guide covers the complete deployment process for the Tourist Rewards Blockchain Infrastructure across different environments.

## Quick Start

### One-Line Deployment

```bash
# Development environment
npm run deploy:dev

# Staging environment  
npm run deploy:staging

# Production environment
npm run deploy:prod
```

## Environment Setup

### 1. Development Environment

```bash
# Copy and configure environment
cp .env.example .env.development
# Edit .env.development with your settings

# Deploy with Docker
npm run docker:dev

# Or deploy without Docker
npm run deploy:dev
```

### 2. Staging Environment

```bash
# Configure staging environment
cp .env.staging .env.staging.local
# Update all CHANGE_ME values in .env.staging.local

# Deploy to staging
npm run deploy:staging
```

### 3. Production Environment

```bash
# Configure production environment
cp .env.production .env.production.local
# Update all CHANGE_ME values in .env.production.local

# Deploy to production (requires confirmation)
npm run deploy:prod
```

## Detailed Deployment Process

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Docker** and **Docker Compose** (for containerized deployment)
3. **PostgreSQL** (if not using Docker)
4. **Redis** (if not using Docker)

### Environment Configuration

Each environment requires specific configuration:

#### Development (.env.development)
- Uses local Hardhat network
- Permissive rate limiting
- Debug logging enabled
- Auto-funding enabled
- Sample data creation enabled

#### Staging (.env.staging)
- Uses Polygon Mumbai testnet
- Moderate rate limiting
- Info logging
- SSL configuration
- Backup scheduling

#### Production (.env.production)
- Uses Polygon mainnet
- Strict rate limiting
- Warning-level logging
- Security hardening
- Monitoring and alerting

### Deployment Scripts

#### Main Deployment Script (`scripts/deploy.sh`)

```bash
./scripts/deploy.sh <environment> [skip-funding]

# Examples:
./scripts/deploy.sh development
./scripts/deploy.sh staging
./scripts/deploy.sh production skip-funding
```

**Features:**
- Environment validation
- Dependency installation
- Smart contract compilation and deployment
- Database migrations
- Service health checks
- Deployment verification

#### Docker Management (`scripts/docker-manager.sh`)

```bash
./scripts/docker-manager.sh <environment> <action> [services]

# Examples:
./scripts/docker-manager.sh development up
./scripts/docker-manager.sh staging restart api
./scripts/docker-manager.sh production logs
./scripts/docker-manager.sh development clean
```

**Actions:**
- `up` - Start services
- `down` - Stop services
- `restart` - Restart services
- `logs` - View logs
- `status` - Show service status
- `build` - Build images
- `clean` - Clean up containers and volumes
- `backup` - Backup database
- `restore` - Restore database

#### Contract Management (`scripts/contract-manager.sh`)

```bash
./scripts/contract-manager.sh <network> <action> [version]

# Examples:
./scripts/contract-manager.sh polygon-mumbai deploy
./scripts/contract-manager.sh polygon upgrade v2.0.0
./scripts/contract-manager.sh polygon-mumbai rollback v1.0.0
./scripts/contract-manager.sh polygon verify
./scripts/contract-manager.sh polygon status
```

## Docker Deployment

### Environment-Specific Compose Files

- `docker-compose.yml` - Base configuration
- `docker-compose.development.yml` - Development overrides
- `docker-compose.staging.yml` - Staging configuration
- `docker-compose.production.yml` - Production configuration

### Starting Services

```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.development.yml up -d

# Staging
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d

# Production
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d
```

### Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │   API Service   │    │   Monitoring    │
│  (Load Balancer)│────│   (Node.js)     │────│   Service       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   PostgreSQL    │              │
         └──────────────│   (Database)    │──────────────┘
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │     Redis       │
                        │   (Cache)       │
                        └─────────────────┘
```

## Database Management

### Migrations

Database migrations are automatically run during deployment:

```bash
# Manual migration
psql $DATABASE_URL -f database/init.sql
```

### Backups

```bash
# Manual backup
npm run backup

# Automated backups (configured in docker-compose)
# - Development: No automated backups
# - Staging: Daily at 2 AM, 7-day retention
# - Production: Daily at 2 AM, 30-day retention
```

### Restore

```bash
# Using Docker manager
./scripts/docker-manager.sh production restore

# Manual restore
psql $DATABASE_URL < database/backups/backup_production_20241201_020000.sql
```

## Wallet Management

### Automated Funding (Testnets Only)

```bash
# Generate test wallets
npm run wallet:generate 10

# Fund specific wallet
npm run wallet:fund 0x1234567890123456789012345678901234567890 0.5

# Monitor and auto-fund wallets
npm run wallet:monitor data/wallets.json
```

### Sample Data Creation

```bash
# Create all sample data
npm run sample:create

# Create specific data types
npm run sample:tourists
npm run sample:restaurants
```

## Monitoring and Health Checks

### Health Check Script

```bash
# Run comprehensive health checks
npm run health

# Check specific components
node scripts/health-check.js
```

### Monitoring Services

The monitoring service tracks:
- Transaction success rates
- Gas price fluctuations
- Network health
- API performance
- Database connectivity

```bash
# Start monitoring
npm run monitoring:start

# Check monitoring status
npm run monitoring:status

# View metrics
npm run monitoring:metrics
```

## Security Considerations

### Production Security Checklist

- [ ] All `CHANGE_ME` values updated in environment files
- [ ] Strong passwords for database and Redis
- [ ] SSL certificates configured
- [ ] Firewall rules configured
- [ ] API keys rotated
- [ ] Admin private keys secured
- [ ] Rate limiting configured
- [ ] CORS origins restricted
- [ ] Debug routes disabled

### Network Security

```bash
# Production network binding (localhost only)
API_PORT=127.0.0.1:3000
POSTGRES_PORT=127.0.0.1:5432
REDIS_PORT=127.0.0.1:6379
```

### SSL Configuration

```bash
# SSL certificate paths
SSL_CERT_PATH=/etc/ssl/certs/production.crt
SSL_KEY_PATH=/etc/ssl/private/production.key
```

## Troubleshooting

### Common Issues

#### 1. Contract Deployment Fails

```bash
# Check network connectivity
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  $RPC_URL

# Check admin wallet balance
node -e "
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('$RPC_URL');
const wallet = new ethers.Wallet('$ADMIN_PRIVATE_KEY', provider);
provider.getBalance(wallet.address).then(b => console.log('Balance:', ethers.formatEther(b)));
"
```

#### 2. Database Connection Issues

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT NOW();"

# Check database logs
docker logs tourist-rewards-postgres-prod
```

#### 3. Service Health Check Failures

```bash
# Check service status
npm run docker:status

# View service logs
npm run docker:logs api

# Restart specific service
./scripts/docker-manager.sh production restart api
```

### Log Locations

- **API Logs**: `docker logs tourist-rewards-api-<env>`
- **Database Logs**: `docker logs tourist-rewards-postgres-<env>`
- **Nginx Logs**: `/var/log/nginx/` (in container)
- **Application Logs**: Console output (structured JSON in production)

## Rollback Procedures

### Contract Rollback

```bash
# Rollback to previous contract version
./scripts/contract-manager.sh polygon rollback v1.0.0
```

### Service Rollback

```bash
# Stop current services
./scripts/docker-manager.sh production down

# Restore database backup
./scripts/docker-manager.sh production restore

# Deploy previous version
git checkout <previous-tag>
./scripts/deploy.sh production
```

## Performance Optimization

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_transactions_tourist ON blockchain_transactions(from_address);
CREATE INDEX CONCURRENTLY idx_transactions_restaurant ON blockchain_transactions(to_address);
CREATE INDEX CONCURRENTLY idx_transactions_timestamp ON blockchain_transactions(created_at);
```

### Redis Configuration

```bash
# Production Redis settings
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### API Performance

- Enable gzip compression (Nginx)
- Configure connection pooling (PostgreSQL)
- Implement response caching (Redis)
- Set appropriate rate limits

## Maintenance

### Regular Maintenance Tasks

1. **Daily**
   - Monitor service health
   - Check backup completion
   - Review error logs

2. **Weekly**
   - Update dependencies
   - Review performance metrics
   - Clean up old logs

3. **Monthly**
   - Security updates
   - Database maintenance
   - Capacity planning review

### Update Procedures

```bash
# Update dependencies
npm update

# Rebuild containers
./scripts/docker-manager.sh production build

# Rolling update (zero downtime)
./scripts/docker-manager.sh production restart api
```

## Support and Documentation

- **API Documentation**: `http://localhost:3000/docs` (development)
- **Contract Documentation**: `docs/contracts/`
- **Monitoring Dashboard**: `http://localhost:3000/monitoring` (if enabled)
- **Health Check Endpoint**: `http://localhost:3000/health`

For additional support, check the troubleshooting section or review the application logs.