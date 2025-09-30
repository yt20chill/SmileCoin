# Testnet Deployment Guide

This guide covers deploying the Tourist Rewards Blockchain Infrastructure to Polygon Mumbai testnet for testing and staging purposes.

## Prerequisites

### Required Software
- Node.js 18+ and npm
- PostgreSQL 12+
- Redis (optional, for caching)
- Git

### Required Accounts
- Polygon Mumbai testnet wallet with MATIC for gas fees
- PolygonScan API key (optional, for contract verification)

## Quick Start

### 1. Environment Setup

Create staging environment configuration:

```bash
cp .env.example .env.staging
```

Update `.env.staging` with your configuration:

```bash
# Blockchain Configuration - Polygon Mumbai Testnet
RPC_URL=https://rpc-mumbai.maticvigil.com
NETWORK_NAME=polygon-mumbai
CHAIN_ID=80001

# Smart Contract Configuration
ADMIN_PRIVATE_KEY=your_private_key_here
WALLET_SEED=staging-wallet-seed-change-in-production

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tourist_rewards_staging

# API Configuration
API_PORT=3000
API_KEY_SECRET=staging-api-key-secret
```

### 2. Fund Admin Wallet

Get testnet MATIC from the Mumbai faucet:
- Visit: https://faucet.polygon.technology/
- Enter your admin wallet address
- Request 0.5 MATIC (minimum 0.1 MATIC required)

### 3. Deploy to Testnet

Run the automated deployment script:

```bash
./scripts/deploy-testnet.sh
```

This script will:
- Install dependencies
- Compile smart contracts
- Deploy SmileCoin contract to Mumbai testnet
- Set up database
- Create sample test data
- Verify deployment

### 4. Start API Services

```bash
./scripts/start-staging-api.sh
```

### 5. Run Integration Tests

```bash
node scripts/test-e2e-testnet.js
```

## Manual Deployment Steps

If you prefer to deploy manually or need to troubleshoot:

### 1. Install Dependencies

```bash
npm install
```

### 2. Compile Contracts

```bash
npx hardhat compile
```

### 3. Deploy Contract

```bash
npx hardhat run scripts/deploy.js --network polygon-mumbai
```

### 4. Verify Deployment

```bash
node scripts/verify-testnet-deployment.js
```

### 5. Set Up Database

```bash
psql $DATABASE_URL -f database/init.sql
```

### 6. Build and Start API

```bash
npm run build
npm run start
```

## Testing the Deployment

### Automated Tests

Run the comprehensive end-to-end test suite:

```bash
node scripts/test-e2e-testnet.js
```

This tests:
- Contract deployment and initialization
- Tourist and restaurant registration
- Daily coin issuance
- Restaurant transfers with limits
- Event emission
- Network performance
- API integration
- Transaction costs

### Manual Testing

#### 1. Test Contract Directly

```javascript
const { ethers } = require("ethers");

// Connect to Mumbai testnet
const provider = new ethers.JsonRpcProvider("https://rpc-mumbai.maticvigil.com");
const wallet = new ethers.Wallet("YOUR_PRIVATE_KEY", provider);

// Load contract
const contractABI = require("./artifacts/contracts/SmileCoin.sol/SmileCoin.json").abi;
const contract = new ethers.Contract("CONTRACT_ADDRESS", contractABI, wallet);

// Test tourist registration
const tourist = ethers.Wallet.createRandom();
await contract.registerTourist(
  tourist.address,
  "USA",
  Math.floor(Date.now() / 1000),
  Math.floor(Date.now() / 1000) + 86400 * 7
);

// Test daily coin issuance
await contract.issueDailyCoins(tourist.address);

// Check balance
const balance = await contract.balanceOf(tourist.address);
console.log("Balance:", ethers.formatEther(balance), "SMILE");
```

#### 2. Test API Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Network status
curl http://localhost:3000/api/blockchain/network/status

# Register tourist
curl -X POST http://localhost:3000/api/tourists/register \
  -H "Content-Type: application/json" \
  -d '{
    "touristId": "test-tourist-1",
    "originCountry": "USA",
    "arrivalDate": "2024-01-15T00:00:00Z",
    "departureDate": "2024-01-22T00:00:00Z"
  }'

# Issue daily coins
curl -X POST http://localhost:3000/api/tourists/test-tourist-1/daily-coins

# Check balance
curl http://localhost:3000/api/tourists/test-tourist-1/balance
```

#### 3. Test SDK

```javascript
const { SmileCoinSDK } = require("./dist/sdk/SmileCoinSDK");

const sdk = new SmileCoinSDK({
  apiUrl: "http://localhost:3000",
  apiKey: "your-api-key"
});

// Register tourist
const tourist = await sdk.registerTourist({
  touristId: "sdk-test-1",
  originCountry: "Canada",
  arrivalDate: "2024-01-15T00:00:00Z",
  departureDate: "2024-01-22T00:00:00Z"
});

// Issue daily coins
const coins = await sdk.issueDailyCoins("sdk-test-1");

// Check balance
const balance = await sdk.getTouristBalance("sdk-test-1");
```

## Monitoring and Debugging

### View Logs

```bash
# API logs
tail -f logs/api-staging.log

# PM2 logs (if using PM2)
pm2 logs tourist-rewards-api-staging
```

### Check Contract on PolygonScan

Visit: https://mumbai.polygonscan.com/address/YOUR_CONTRACT_ADDRESS

### Monitor Transactions

```bash
# View recent events
node -e "
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com');
const contract = new ethers.Contract('CONTRACT_ADDRESS', ABI, provider);

contract.queryFilter(contract.filters.DailyCoinsIssued(), -100)
  .then(events => console.log('Recent events:', events.length));
"
```

### Database Queries

```sql
-- Check wallet registrations
SELECT * FROM wallets ORDER BY created_at DESC LIMIT 10;

-- Check recent transactions
SELECT * FROM blockchain_transactions ORDER BY created_at DESC LIMIT 10;

-- Check API usage
SELECT endpoint, COUNT(*) as requests 
FROM api_usage 
WHERE created_at > NOW() - INTERVAL '1 hour' 
GROUP BY endpoint;
```

## Troubleshooting

### Common Issues

#### 1. Contract Deployment Fails

**Error**: "insufficient funds for intrinsic transaction cost"
**Solution**: Fund admin wallet with more MATIC from faucet

**Error**: "nonce too high"
**Solution**: Reset account nonce or wait for network sync

#### 2. API Service Won't Start

**Error**: "Cannot connect to database"
**Solution**: 
- Check PostgreSQL is running
- Verify DATABASE_URL is correct
- Run database migrations

**Error**: "Contract not found"
**Solution**: 
- Verify CONTRACT_ADDRESS in .env.staging
- Check contract deployment was successful

#### 3. Transaction Failures

**Error**: "Tourist not registered"
**Solution**: Register tourist first using registerTourist

**Error**: "Daily limit exceeded"
**Solution**: This is expected behavior - wait 24 hours or test with different restaurant

#### 4. Network Issues

**Error**: "network timeout"
**Solution**: 
- Try different RPC endpoint
- Check network connectivity
- Increase timeout values

### Getting Help

1. Check deployment logs: `cat testnet-deployment-info.json`
2. Run verification script: `node scripts/verify-testnet-deployment.js`
3. Check test reports: `cat testnet-e2e-report.json`
4. View contract on PolygonScan for transaction details

## Production Readiness Checklist

Before moving to production:

- [ ] All automated tests pass
- [ ] Manual testing completed successfully
- [ ] Performance tests show acceptable response times
- [ ] Security audit completed (if required)
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery procedures tested
- [ ] Documentation updated
- [ ] Team trained on operations

## Next Steps

After successful testnet deployment:

1. **Load Testing**: Run performance tests with realistic load
2. **Security Review**: Conduct security audit of smart contracts and API
3. **Production Setup**: Configure production environment
4. **Monitoring**: Set up comprehensive monitoring and alerting
5. **Documentation**: Update operational documentation
6. **Training**: Train operations team on system management

## Resources

- [Polygon Mumbai Testnet](https://mumbai.polygonscan.com/)
- [Mumbai Faucet](https://faucet.polygon.technology/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethers.js Documentation](https://docs.ethers.org/)

## Support

For issues or questions:
1. Check this documentation
2. Review error logs and test reports
3. Consult troubleshooting section
4. Check contract on PolygonScan for transaction details