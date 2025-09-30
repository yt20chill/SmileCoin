# SmileCoin Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered when deploying, configuring, and operating the SmileCoin Tourist Rewards Blockchain Infrastructure.

## Quick Diagnosis

### Health Check Commands

Run these commands to quickly identify issues:

```bash
# Overall system health
npm run health

# Component-specific health checks
npm run health:api      # API server status
npm run health:db       # Database connectivity
npm run health:blockchain  # Blockchain network status

# Detailed diagnostics
npm run test:deployment  # Comprehensive deployment test
```

### Log Analysis

```bash
# View recent logs
tail -f logs/application.log

# Search for errors
grep -i error logs/application.log | tail -20

# Check specific component logs
docker-compose logs api
docker-compose logs postgres
docker-compose logs redis
```

## Common Issues and Solutions

### 1. API Server Issues

#### Issue: API Server Won't Start

**Symptoms:**
- `npm run start` fails
- Port 3000 already in use
- Module not found errors

**Solutions:**

```bash
# Check if port is in use
lsof -i :3000
# Kill process using port
kill -9 $(lsof -t -i:3000)

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be v18.0.0+

# Verify TypeScript compilation
npx tsc --noEmit
```

**Environment Configuration:**
```bash
# Verify environment variables
cat .env.development | grep -v '^#'

# Required variables:
NODE_ENV=development
API_PORT=3000
DATABASE_URL=postgresql://...
RPC_URL=https://...
```

#### Issue: API Returns 500 Internal Server Error

**Symptoms:**
- All API endpoints return 500 errors
- Database connection errors in logs
- Blockchain network errors

**Solutions:**

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT version();"

# Test blockchain connectivity
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  $RPC_URL

# Restart services
npm run docker:down
npm run docker:dev
```

#### Issue: Rate Limiting Errors

**Symptoms:**
- 429 Too Many Requests errors
- API becomes unresponsive under load

**Solutions:**

```bash
# Adjust rate limiting in environment
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=1000

# Scale API service
docker-compose up -d --scale api=3

# Use Redis for distributed rate limiting
REDIS_URL=redis://localhost:6379
```

### 2. Database Issues

#### Issue: Database Connection Failed

**Symptoms:**
- "Connection refused" errors
- "Database does not exist" errors
- Authentication failures

**Solutions:**

```bash
# Check if PostgreSQL is running
docker ps | grep postgres
# Or for system installation
sudo systemctl status postgresql

# Start PostgreSQL service
docker-compose up -d postgres
# Or for system installation
sudo systemctl start postgresql

# Create database if it doesn't exist
createdb -h localhost -U postgres smilecoin_dev

# Test connection with correct credentials
psql -h localhost -U smilecoin -d smilecoin_dev -c "SELECT 1;"
```

**Database URL Format:**
```bash
# Correct format
DATABASE_URL=postgresql://username:password@host:port/database

# Example
DATABASE_URL=postgresql://smilecoin:password@localhost:5432/smilecoin_dev
```

#### Issue: Database Schema Errors

**Symptoms:**
- "Table does not exist" errors
- "Column does not exist" errors
- Migration failures

**Solutions:**

```bash
# Initialize database schema
psql $DATABASE_URL -f database/init.sql

# Check if tables exist
psql $DATABASE_URL -c "\dt"

# Recreate database if corrupted
dropdb -h localhost -U postgres smilecoin_dev
createdb -h localhost -U postgres smilecoin_dev
psql $DATABASE_URL -f database/init.sql
```

#### Issue: Database Performance Problems

**Symptoms:**
- Slow query responses
- High CPU usage on database
- Connection pool exhaustion

**Solutions:**

```bash
# Check database performance
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"

# Analyze slow queries
psql $DATABASE_URL -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Optimize database configuration
# Edit postgresql.conf:
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
```

### 3. Blockchain Network Issues

#### Issue: Smart Contract Deployment Failed

**Symptoms:**
- Contract deployment transactions fail
- "Insufficient funds" errors
- Network timeout errors

**Solutions:**

```bash
# Check wallet balance
npx hardhat run scripts/check-balance.js --network polygon-mumbai

# Fund wallet with testnet tokens
# For Mumbai testnet: https://faucet.polygon.technology/

# Check gas price and adjust
npx hardhat run scripts/check-gas.js --network polygon-mumbai

# Verify network configuration
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  $RPC_URL
```

**Hardhat Configuration:**
```javascript
// hardhat.config.ts
networks: {
  "polygon-mumbai": {
    url: process.env.RPC_URL,
    accounts: [process.env.ADMIN_PRIVATE_KEY],
    gas: 2100000,
    gasPrice: 8000000000, // 8 gwei
    timeout: 60000
  }
}
```

#### Issue: Transaction Failures

**Symptoms:**
- Transactions stuck in pending state
- "Transaction underpriced" errors
- "Nonce too low" errors

**Solutions:**

```bash
# Check transaction status
npx hardhat run scripts/check-transaction.js --network polygon-mumbai

# Reset account nonce (if stuck)
# Use MetaMask or similar wallet to reset

# Increase gas price
export GAS_PRICE=10000000000  # 10 gwei

# Check network congestion
curl -s "https://gasstation-mumbai.matic.today/v2" | jq .
```

#### Issue: RPC Endpoint Problems

**Symptoms:**
- "Network error" messages
- Intermittent connection failures
- Rate limiting from RPC provider

**Solutions:**

```bash
# Test multiple RPC endpoints
RPC_ENDPOINTS=(
  "https://rpc-mumbai.maticvigil.com"
  "https://matic-mumbai.chainstacklabs.com"
  "https://polygon-mumbai.infura.io/v3/YOUR_KEY"
)

for endpoint in "${RPC_ENDPOINTS[@]}"; do
  echo "Testing $endpoint"
  curl -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    "$endpoint"
done

# Use multiple RPC endpoints for redundancy
RPC_URL=https://rpc-mumbai.maticvigil.com,https://matic-mumbai.chainstacklabs.com
```

### 4. Docker and Container Issues

#### Issue: Docker Services Won't Start

**Symptoms:**
- `docker-compose up` fails
- Port conflicts
- Volume mount errors

**Solutions:**

```bash
# Check Docker daemon status
sudo systemctl status docker

# Start Docker if not running
sudo systemctl start docker

# Check for port conflicts
docker ps -a
netstat -tulpn | grep :5432  # PostgreSQL
netstat -tulpn | grep :6379  # Redis

# Clean up stopped containers
docker system prune -a

# Rebuild containers
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

#### Issue: Container Memory Issues

**Symptoms:**
- Containers getting killed (OOMKilled)
- Poor performance
- Out of memory errors

**Solutions:**

```bash
# Check container resource usage
docker stats

# Increase memory limits in docker-compose.yml
services:
  api:
    mem_limit: 1g
    memswap_limit: 1g

# Check system memory
free -h
df -h

# Clean up Docker resources
docker system prune -a --volumes
```

### 5. SDK and Integration Issues

#### Issue: SDK Authentication Errors

**Symptoms:**
- 401 Unauthorized errors
- "Invalid API key" messages
- Authentication failures

**Solutions:**

```javascript
// Verify API key configuration
const sdk = new SmileCoinSDK({
  apiUrl: 'http://localhost:3000',
  apiKey: 'your-actual-api-key'  // Check this value
});

// Test API key manually
curl -H "Authorization: Bearer your-api-key" \
  http://localhost:3000/api/blockchain/network/status

// Generate new API key if needed
npm run generate-api-key
```

#### Issue: SDK Timeout Errors

**Symptoms:**
- Request timeout errors
- Network connectivity issues
- Slow response times

**Solutions:**

```javascript
// Increase timeout
const sdk = new SmileCoinSDK({
  apiUrl: 'http://localhost:3000',
  apiKey: 'your-api-key',
  timeout: 60000  // 60 seconds
});

// Implement retry logic
const maxRetries = 3;
let attempt = 0;

while (attempt < maxRetries) {
  try {
    const result = await sdk.getTouristBalance('tourist-123');
    break;
  } catch (error) {
    attempt++;
    if (attempt >= maxRetries) throw error;
    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
  }
}
```

### 6. Performance Issues

#### Issue: Slow API Response Times

**Symptoms:**
- API responses take > 5 seconds
- High CPU usage
- Memory leaks

**Solutions:**

```bash
# Run performance tests
npm run test:performance

# Profile API performance
npm install -g clinic
clinic doctor -- node dist/api/app.js

# Check for memory leaks
node --inspect dist/api/app.js
# Open chrome://inspect in Chrome

# Optimize database queries
npm run analyze-queries

# Enable caching
REDIS_CACHE_ENABLED=true
CACHE_TTL=300  # 5 minutes
```

#### Issue: High Memory Usage

**Symptoms:**
- Memory usage continuously increasing
- Out of memory crashes
- Slow garbage collection

**Solutions:**

```bash
# Monitor memory usage
node --max-old-space-size=4096 dist/api/app.js

# Enable garbage collection logging
node --trace-gc dist/api/app.js

# Use memory profiling
npm install -g memwatch-next
# Add to your code:
const memwatch = require('memwatch-next');
memwatch.on('leak', (info) => {
  console.error('Memory leak detected:', info);
});
```

### 7. Network and Connectivity Issues

#### Issue: External API Failures

**Symptoms:**
- Google Places API errors
- Blockchain explorer API failures
- Third-party service timeouts

**Solutions:**

```bash
# Test external APIs
curl "https://maps.googleapis.com/maps/api/place/details/json?place_id=ChIJN1t_tDeuEmsRUsoyG83frY4&key=YOUR_API_KEY"

# Check API quotas and limits
# Google Cloud Console -> APIs & Services -> Quotas

# Implement fallback mechanisms
GOOGLE_PLACES_API_KEY_BACKUP=your-backup-key
BLOCKCHAIN_EXPLORER_FALLBACK_URL=https://backup-explorer.com
```

#### Issue: SSL/TLS Certificate Problems

**Symptoms:**
- "Certificate verification failed" errors
- HTTPS connection issues
- SSL handshake failures

**Solutions:**

```bash
# Check certificate validity
openssl s_client -connect api.smilecoin.example.com:443

# Update certificates
sudo apt update && sudo apt install ca-certificates

# For development, disable SSL verification (NOT for production)
NODE_TLS_REJECT_UNAUTHORIZED=0
```

## Environment-Specific Issues

### Development Environment

#### Issue: Local Blockchain Not Working

**Symptoms:**
- Hardhat network connection failures
- Contract deployment to localhost fails

**Solutions:**

```bash
# Start local blockchain
npx hardhat node

# In another terminal, deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Check if contracts are deployed
npx hardhat run scripts/verify-deployment.js --network localhost
```

### Staging Environment

#### Issue: Testnet Transaction Failures

**Symptoms:**
- Mumbai testnet transactions fail
- Insufficient test tokens

**Solutions:**

```bash
# Get testnet tokens
# Visit: https://faucet.polygon.technology/
# Enter your wallet address

# Check testnet status
curl -s "https://mumbai.polygonscan.com/api?module=proxy&action=eth_blockNumber"

# Use alternative testnet if Mumbai is down
RPC_URL=https://rpc-mumbai.matic.today
```

### Production Environment

#### Issue: Mainnet Gas Price Issues

**Symptoms:**
- Transactions fail due to low gas price
- High transaction costs

**Solutions:**

```bash
# Monitor gas prices
curl -s "https://gasstation-mainnet.matic.network/v2" | jq .

# Implement dynamic gas pricing
GAS_PRICE_STRATEGY=dynamic
GAS_PRICE_MULTIPLIER=1.2

# Use gas optimization
OPTIMIZE_GAS=true
```

## Monitoring and Alerting

### Setting Up Monitoring

```bash
# Start monitoring service
npm run monitoring:start

# Configure alerts
vim config/monitoring.json

# Test alerts
npm run monitoring:test-alerts
```

### Log Analysis

```bash
# Centralized logging with ELK stack
docker run -d --name elasticsearch elasticsearch:7.17.0
docker run -d --name kibana -p 5601:5601 kibana:7.17.0

# Configure log shipping
# Edit filebeat.yml or use Docker log driver
```

## Recovery Procedures

### Database Recovery

```bash
# Restore from backup
pg_restore -h localhost -U smilecoin -d smilecoin_prod backup.dump

# Point-in-time recovery
pg_basebackup -h localhost -U postgres -D /backup/base
```

### Smart Contract Recovery

```bash
# Redeploy contracts if needed
npm run contract:deploy polygon

# Migrate data to new contract
npm run contract:migrate-data
```

### Service Recovery

```bash
# Restart all services
docker-compose restart

# Rolling restart for zero downtime
docker-compose up -d --scale api=2
docker-compose stop api_1
docker-compose up -d --scale api=1
```

## Getting Help

### Self-Service Resources

1. **Check Documentation:**
   - [API Documentation](./API_DOCUMENTATION.md)
   - [Deployment Guide](./DEPLOYMENT_GUIDE.md)
   - [SDK Documentation](../src/sdk/README.md)

2. **Run Diagnostics:**
   ```bash
   npm run health
   npm run test:deployment
   npm run test:integration
   ```

3. **Check System Status:**
   - Application logs: `tail -f logs/application.log`
   - System resources: `htop`, `df -h`
   - Network connectivity: `ping`, `curl`

### Community Support

1. **GitHub Issues:**
   - Search existing issues: https://github.com/your-org/smilecoin-infrastructure/issues
   - Create new issue with:
     - Environment details
     - Error messages
     - Steps to reproduce
     - Expected vs actual behavior

2. **Discord Community:**
   - Join: https://discord.gg/smilecoin
   - Channels: #support, #development, #deployment

### Professional Support

1. **Email Support:**
   - General: support@smilecoin.example.com
   - Technical: tech-support@smilecoin.example.com
   - Enterprise: enterprise@smilecoin.example.com

2. **Support Ticket Information:**
   Include the following in your support request:
   - Environment (development/staging/production)
   - Version information (`npm run version`)
   - Error logs and stack traces
   - Steps to reproduce the issue
   - System configuration details

### Emergency Contacts

For critical production issues:
- **24/7 Support:** +1-800-SMILECOIN
- **Emergency Email:** emergency@smilecoin.example.com
- **Status Page:** https://status.smilecoin.example.com

## Preventive Measures

### Regular Maintenance

```bash
# Weekly maintenance script
#!/bin/bash
# maintenance.sh

# Update dependencies
npm audit fix

# Clean up logs
find logs/ -name "*.log" -mtime +30 -delete

# Database maintenance
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Docker cleanup
docker system prune -f

# Health check
npm run health
```

### Monitoring Setup

```bash
# Set up automated monitoring
crontab -e

# Add monitoring jobs
*/5 * * * * /path/to/smilecoin/scripts/health-check.sh
0 2 * * * /path/to/smilecoin/scripts/backup.sh
0 3 * * 0 /path/to/smilecoin/scripts/maintenance.sh
```

### Backup Strategy

```bash
# Automated backup script
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
pg_dump $DATABASE_URL > backups/db_${DATE}.sql

# Configuration backup
tar -czf backups/config_${DATE}.tar.gz .env.* config/

# Upload to cloud storage
aws s3 sync backups/ s3://smilecoin-backups/
```

This troubleshooting guide should help you resolve most common issues. For issues not covered here, please refer to the community resources or contact professional support.