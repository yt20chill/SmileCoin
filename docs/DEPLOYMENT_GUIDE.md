# SmileCoin Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the SmileCoin Tourist Rewards Blockchain Infrastructure in different environments (development, staging, production).

## Prerequisites

### System Requirements

**Minimum Requirements:**
- **CPU:** 2 cores
- **RAM:** 4GB
- **Storage:** 20GB SSD
- **Network:** Stable internet connection

**Recommended Requirements:**
- **CPU:** 4+ cores
- **RAM:** 8GB+
- **Storage:** 50GB+ SSD
- **Network:** High-speed internet connection

### Software Dependencies

**Required Software:**
- **Node.js:** v18.0.0 or higher
- **npm:** v8.0.0 or higher
- **Docker:** v20.0.0 or higher
- **Docker Compose:** v2.0.0 or higher
- **Git:** v2.30.0 or higher

**Optional but Recommended:**
- **PostgreSQL:** v14.0+ (if not using Docker)
- **Redis:** v6.0+ (if not using Docker)

### Blockchain Network Access

**Testnet (Development/Staging):**
- Polygon Mumbai testnet RPC endpoint
- Test MATIC tokens for gas fees
- Testnet wallet with admin privileges

**Mainnet (Production):**
- Polygon mainnet RPC endpoint (Infura, Alchemy, or self-hosted)
- MATIC tokens for gas fees
- Secure wallet management solution

## Quick Start (Development)

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/your-org/smilecoin-infrastructure.git
cd smilecoin-infrastructure

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.development
```

### 2. Configure Environment

Edit `.env.development`:

```bash
# Environment
NODE_ENV=development

# API Configuration
API_PORT=3000
API_KEY=your-development-api-key

# Blockchain Configuration
RPC_URL=https://rpc-mumbai.maticvigil.com
BLOCKCHAIN_NETWORK=polygon-mumbai
ADMIN_PRIVATE_KEY=your-admin-private-key

# Database Configuration
DATABASE_URL=postgresql://smilecoin:password@localhost:5432/smilecoin_dev
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-jwt-secret-key
WALLET_SEED=your-wallet-seed-for-deterministic-generation
```

### 3. One-Command Deployment

```bash
# Deploy everything with one command
npm run deploy:dev

# Or use the deployment script directly
./scripts/deploy.sh development
```

This will:
- Start Docker services (PostgreSQL, Redis)
- Compile and deploy smart contracts
- Initialize the database
- Start the API server
- Run health checks

### 4. Verify Deployment

```bash
# Check deployment status
npm run health

# Test API endpoints
curl http://localhost:3000/health

# Check smart contract deployment
npm run contract:status
```

## Environment-Specific Deployments

### Development Environment

**Purpose:** Local development and testing

**Configuration:**
```bash
# Use local blockchain (Hardhat)
RPC_URL=http://localhost:8545
BLOCKCHAIN_NETWORK=hardhat

# Use Docker services
DATABASE_URL=postgresql://smilecoin:password@localhost:5432/smilecoin_dev
REDIS_URL=redis://localhost:6379

# Enable debug logging
LOG_LEVEL=debug
```

**Deployment:**
```bash
# Start local blockchain
npx hardhat node

# Deploy to development
npm run deploy:dev

# Create sample data
npm run sample:create
```

### Staging Environment

**Purpose:** Pre-production testing with real blockchain

**Configuration:**
```bash
# Use testnet
RPC_URL=https://rpc-mumbai.maticvigil.com
BLOCKCHAIN_NETWORK=polygon-mumbai

# Use managed database services
DATABASE_URL=postgresql://user:pass@staging-db.example.com:5432/smilecoin_staging
REDIS_URL=redis://staging-redis.example.com:6379

# Production-like settings
LOG_LEVEL=info
ENABLE_RATE_LIMITING=true
```

**Deployment:**
```bash
# Deploy to staging
npm run deploy:staging

# Run integration tests
npm run test:integration

# Verify with testnet
npm run test:deployment
```

### Production Environment

**Purpose:** Live production system

**Configuration:**
```bash
# Use mainnet
RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID
BLOCKCHAIN_NETWORK=polygon

# Use production database
DATABASE_URL=postgresql://user:pass@prod-db.example.com:5432/smilecoin_prod
REDIS_URL=redis://prod-redis.example.com:6379

# Production security
LOG_LEVEL=warn
ENABLE_RATE_LIMITING=true
ENABLE_MONITORING=true
```

**Deployment:**
```bash
# Deploy to production
npm run deploy:prod

# Verify deployment
npm run health

# Monitor system
npm run monitoring:start
```

## Docker Deployment

### Using Docker Compose

**Development:**
```bash
# Start all services
docker-compose -f docker-compose.yml -f docker-compose.development.yml up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

**Production:**
```bash
# Start production services
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d

# Scale API service
docker-compose up -d --scale api=3

# Update services
docker-compose pull && docker-compose up -d
```

### Custom Docker Deployment

**Build Images:**
```bash
# Build API image
docker build -f Dockerfile.api -t smilecoin-api:latest .

# Build Hardhat image (for local blockchain)
docker build -f Dockerfile.hardhat -t smilecoin-hardhat:latest .
```

**Run Containers:**
```bash
# Run API container
docker run -d \
  --name smilecoin-api \
  -p 3000:3000 \
  --env-file .env.production \
  smilecoin-api:latest

# Run with custom network
docker network create smilecoin-network
docker run -d --network smilecoin-network --name smilecoin-api smilecoin-api:latest
```

## Cloud Deployment

### AWS Deployment

**Using ECS (Elastic Container Service):**

1. **Create ECS Cluster:**
```bash
aws ecs create-cluster --cluster-name smilecoin-cluster
```

2. **Create Task Definition:**
```json
{
  "family": "smilecoin-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "smilecoin-api",
      "image": "your-account.dkr.ecr.region.amazonaws.com/smilecoin-api:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/smilecoin-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

3. **Create Service:**
```bash
aws ecs create-service \
  --cluster smilecoin-cluster \
  --service-name smilecoin-api-service \
  --task-definition smilecoin-api \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
```

**Using Lambda (Serverless):**

1. **Install Serverless Framework:**
```bash
npm install -g serverless
```

2. **Create serverless.yml:**
```yaml
service: smilecoin-api

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    NODE_ENV: production
    DATABASE_URL: ${env:DATABASE_URL}
    RPC_URL: ${env:RPC_URL}

functions:
  api:
    handler: dist/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
    timeout: 30
    memorySize: 512

plugins:
  - serverless-offline
```

3. **Deploy:**
```bash
serverless deploy --stage production
```

### Google Cloud Platform

**Using Cloud Run:**

1. **Build and Push Image:**
```bash
# Build image
docker build -t gcr.io/your-project/smilecoin-api .

# Push to Container Registry
docker push gcr.io/your-project/smilecoin-api
```

2. **Deploy to Cloud Run:**
```bash
gcloud run deploy smilecoin-api \
  --image gcr.io/your-project/smilecoin-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,DATABASE_URL=your-db-url
```

### Azure Deployment

**Using Container Instances:**

```bash
# Create resource group
az group create --name smilecoin-rg --location eastus

# Create container instance
az container create \
  --resource-group smilecoin-rg \
  --name smilecoin-api \
  --image your-registry.azurecr.io/smilecoin-api:latest \
  --cpu 1 \
  --memory 2 \
  --ports 3000 \
  --environment-variables NODE_ENV=production \
  --secure-environment-variables DATABASE_URL=your-db-url
```

## Database Setup

### PostgreSQL Setup

**Using Docker:**
```bash
# Start PostgreSQL container
docker run -d \
  --name smilecoin-postgres \
  -e POSTGRES_DB=smilecoin \
  -e POSTGRES_USER=smilecoin \
  -e POSTGRES_PASSWORD=your-password \
  -p 5432:5432 \
  postgres:14
```

**Manual Installation:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE smilecoin;
CREATE USER smilecoin WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE smilecoin TO smilecoin;
```

**Initialize Schema:**
```bash
# Run database migrations
psql -h localhost -U smilecoin -d smilecoin -f database/init.sql
```

### Redis Setup

**Using Docker:**
```bash
# Start Redis container
docker run -d \
  --name smilecoin-redis \
  -p 6379:6379 \
  redis:6-alpine
```

**Manual Installation:**
```bash
# Ubuntu/Debian
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## Smart Contract Deployment

### Deploy to Testnet

```bash
# Configure network in hardhat.config.ts
networks: {
  "polygon-mumbai": {
    url: "https://rpc-mumbai.maticvigil.com",
    accounts: [process.env.ADMIN_PRIVATE_KEY]
  }
}

# Deploy contract
npx hardhat run scripts/deploy.js --network polygon-mumbai

# Verify contract (optional)
npx hardhat verify --network polygon-mumbai CONTRACT_ADDRESS
```

### Deploy to Mainnet

```bash
# Use secure key management
export ADMIN_PRIVATE_KEY=$(cat /secure/path/to/private-key)

# Deploy to mainnet
npx hardhat run scripts/deploy.js --network polygon

# Verify deployment
npm run contract:status polygon
```

### Contract Upgrades

```bash
# Upgrade contract (if using proxy pattern)
npx hardhat run scripts/upgrade.js --network polygon-mumbai

# Verify upgrade
npm run contract:status polygon-mumbai
```

## Monitoring and Logging

### Application Monitoring

**Setup Monitoring:**
```bash
# Start monitoring service
npm run monitoring:start

# Check monitoring status
npm run monitoring:status

# View metrics
npm run monitoring:metrics
```

**Configure Alerts:**
```bash
# Edit monitoring configuration
vim src/config/monitoring.json

# Restart monitoring
npm run monitoring:restart
```

### Log Management

**Centralized Logging:**
```bash
# Using Docker with log driver
docker run -d \
  --log-driver=syslog \
  --log-opt syslog-address=tcp://log-server:514 \
  smilecoin-api:latest
```

**Log Rotation:**
```bash
# Configure logrotate
sudo vim /etc/logrotate.d/smilecoin

/var/log/smilecoin/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 smilecoin smilecoin
}
```

## Security Considerations

### Environment Security

**Secure Environment Variables:**
```bash
# Use encrypted environment files
gpg --symmetric --cipher-algo AES256 .env.production
gpg --decrypt .env.production.gpg > .env.production

# Use secret management services
export DATABASE_URL=$(aws secretsmanager get-secret-value --secret-id prod/smilecoin/db --query SecretString --output text)
```

**Network Security:**
```bash
# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 3000/tcp
sudo ufw enable

# Use reverse proxy
nginx -t && nginx -s reload
```

### Wallet Security

**Hardware Security Modules (HSM):**
```javascript
// Use AWS KMS for key management
const kms = new AWS.KMS();
const privateKey = await kms.decrypt({
  CiphertextBlob: encryptedPrivateKey
}).promise();
```

**Multi-signature Wallets:**
```solidity
// Use Gnosis Safe for production
// Configure multi-sig requirements
```

## Backup and Recovery

### Database Backup

**Automated Backups:**
```bash
#!/bin/bash
# backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U smilecoin smilecoin > backup_${DATE}.sql
aws s3 cp backup_${DATE}.sql s3://smilecoin-backups/
```

**Restore Database:**
```bash
# Restore from backup
psql -h localhost -U smilecoin -d smilecoin < backup_20240115_120000.sql
```

### Smart Contract Backup

**Contract State Backup:**
```bash
# Export contract state
node scripts/export-contract-state.js > contract-state-backup.json

# Store securely
aws s3 cp contract-state-backup.json s3://smilecoin-backups/contracts/
```

## Troubleshooting

### Common Issues

**1. Contract Deployment Fails**
```bash
# Check gas price and limit
npx hardhat run scripts/check-gas.js --network polygon-mumbai

# Verify network connectivity
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://rpc-mumbai.maticvigil.com
```

**2. Database Connection Issues**
```bash
# Test database connection
psql -h localhost -U smilecoin -d smilecoin -c "SELECT version();"

# Check connection pool
npm run health:db
```

**3. API Performance Issues**
```bash
# Check system resources
htop
df -h

# Analyze API performance
npm run test:performance
```

### Health Checks

**Automated Health Checks:**
```bash
# Run comprehensive health check
npm run health

# Check specific components
npm run health:api
npm run health:db
npm run health:blockchain
```

**Health Check Endpoints:**
```bash
# API health
curl http://localhost:3000/health

# Database health
curl http://localhost:3000/health/db

# Blockchain health
curl http://localhost:3000/health/blockchain
```

## Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor system health and performance
- Check error logs for issues
- Verify blockchain network status

**Weekly:**
- Review and rotate logs
- Update security patches
- Backup database and configurations

**Monthly:**
- Review and optimize database performance
- Update dependencies and security patches
- Review and update monitoring alerts

### Updates and Upgrades

**Application Updates:**
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Run database migrations
npm run migrate

# Restart services
npm run deploy:prod
```

**Smart Contract Updates:**
```bash
# Deploy new contract version
npm run contract:upgrade polygon-mumbai

# Verify upgrade
npm run contract:status polygon-mumbai
```

## Support and Resources

### Documentation
- **API Documentation:** [docs/API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **SDK Documentation:** [src/sdk/README.md](../src/sdk/README.md)
- **Troubleshooting Guide:** [docs/TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### Community
- **GitHub Issues:** https://github.com/your-org/smilecoin-infrastructure/issues
- **Discord:** https://discord.gg/smilecoin
- **Documentation:** https://docs.smilecoin.example.com

### Professional Support
- **Email:** support@smilecoin.example.com
- **Enterprise Support:** enterprise@smilecoin.example.com
- **Status Page:** https://status.smilecoin.example.com