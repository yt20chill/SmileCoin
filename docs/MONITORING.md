# Transaction Monitoring System

The Tourist Rewards Blockchain Infrastructure includes a comprehensive transaction monitoring system that provides real-time indexing, network health monitoring, and alerting capabilities.

## Features

### 🔍 Transaction Indexing
- **Real-time Event Listening**: Automatically indexes all SmileCoin contract events
- **Historical Backfill**: Can backfill transaction data from any block range
- **Metadata Extraction**: Captures tourist origin countries, restaurant data, and transaction context
- **Status Tracking**: Monitors transaction confirmations and failures

### 📊 Network Monitoring
- **Health Checks**: Continuous monitoring of blockchain network status
- **Gas Price Tracking**: Alerts when gas prices exceed thresholds
- **Performance Metrics**: Response times, uptime, and block production rates
- **Failure Detection**: Automatic detection and logging of transaction failures

### 🚨 Alerting System
- **Gas Price Alerts**: Notifications when gas costs spike
- **Network Health Alerts**: Warnings when network becomes unhealthy
- **Transaction Failures**: Immediate alerts for failed transactions
- **Webhook Integration**: Send alerts to external systems

### 📈 Analytics & Insights
- **Tourist Activity**: Daily active users, origin country breakdowns
- **Restaurant Rankings**: Performance metrics and earnings analysis
- **Transaction Statistics**: Success rates, volumes, and trends
- **Performance Dashboards**: Real-time system health metrics

## Quick Start

### 1. Environment Setup

```bash
# Required environment variables
RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/your-api-key
CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
NETWORK_NAME=polygon-mumbai
DATABASE_URL=postgresql://user:password@localhost:5432/tourist_rewards

# Optional monitoring configuration
GAS_PRICE_THRESHOLD_GWEI=50
HEALTH_CHECK_INTERVAL_MS=30000
ALERT_WEBHOOK_URL=https://your-webhook-url.com/alerts
```

### 2. Start Monitoring

```bash
# Using CLI
npm run monitoring:start

# Or programmatically
npm run monitoring start --daemon
```

### 3. Check Status

```bash
# Get monitoring status
npm run monitoring:status

# Get system metrics
npm run monitoring:metrics

# Get network health
npm run monitoring health
```

## API Endpoints

### System Status
```http
GET /api/monitoring/status
GET /api/monitoring/metrics
GET /api/monitoring/performance
```

### Network Monitoring
```http
GET /api/monitoring/network/health
GET /api/monitoring/network/history?hours=24
```

### Transaction Data
```http
GET /api/monitoring/transactions/stats?hours=24
GET /api/monitoring/transactions/failures?hours=24
GET /api/monitoring/transactions/:hash
GET /api/monitoring/transactions/address/:address
GET /api/monitoring/transactions/type/:type
```

### Analytics
```http
GET /api/monitoring/insights/tourists?days=7
GET /api/monitoring/insights/restaurants?limit=20
```

### Management
```http
POST /api/monitoring/start
POST /api/monitoring/stop
POST /api/monitoring/backfill
POST /api/monitoring/transactions/:hash/monitor
```

## CLI Commands

### Basic Operations
```bash
# Start monitoring service
npm run monitoring start

# Start as daemon
npm run monitoring start --daemon

# Stop monitoring
npm run monitoring stop

# Get status
npm run monitoring status
```

### Data Management
```bash
# Backfill historical data
npm run monitoring backfill --from-block 1000000

# Backfill specific range
npm run monitoring backfill --from-block 1000000 --to-block 1001000
```

### Analytics
```bash
# Get system metrics
npm run monitoring metrics

# Get insights
npm run monitoring insights --days 7

# Check network health
npm run monitoring health

# Get transaction details
npm run monitoring transaction 0x1234...
```

## Programmatic Usage

### Initialize Monitoring Service

```typescript
import { MonitoringService } from './services/MonitoringService';

const monitoringService = new MonitoringService({
  rpcUrl: 'https://polygon-mumbai.g.alchemy.com/v2/your-api-key',
  contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
  networkName: 'polygon-mumbai',
  gasPriceThresholdGwei: 50,
  healthCheckIntervalMs: 30000,
  alertWebhookUrl: 'https://your-webhook-url.com/alerts'
});

// Start monitoring
await monitoringService.start();

// Get metrics
const metrics = await monitoringService.getSystemMetrics();
console.log('Network Health:', metrics.networkHealth);
console.log('Transaction Stats:', metrics.transactionStats);
```

### Monitor Specific Transactions

```typescript
// Monitor a transaction for completion/failure
await monitoringService.monitorTransaction('0x1234...');

// Get transaction details
const transactionIndexer = monitoringService['transactionIndexer'];
const tx = await transactionIndexer.getTransaction('0x1234...');
```

### Get Analytics Data

```typescript
// Tourist activity insights
const touristInsights = await monitoringService.getTouristActivityInsights(7);
console.log('Top Countries:', touristInsights.topOriginCountries);

// Restaurant rankings
const rankings = await monitoringService.getRestaurantRankings(10);
console.log('Top Restaurants:', rankings);
```

## Database Schema

The monitoring system uses the following database tables:

### blockchain_transactions
Stores all indexed transaction data with metadata:
```sql
- transaction_hash (VARCHAR) - Unique transaction identifier
- block_number (BIGINT) - Block number
- from_address (VARCHAR) - Sender address
- to_address (VARCHAR) - Recipient address
- amount (DECIMAL) - Transaction amount
- gas_used (BIGINT) - Gas consumed
- gas_price (DECIMAL) - Gas price in wei
- transaction_fee (DECIMAL) - Total transaction fee
- status (VARCHAR) - pending/confirmed/failed
- transaction_type (VARCHAR) - daily_issuance/restaurant_transfer/expiration
- metadata (JSONB) - Additional context data
- created_at (TIMESTAMP) - Creation time
- confirmed_at (TIMESTAMP) - Confirmation time
```

### network_status
Tracks network health metrics:
```sql
- network_name (VARCHAR) - Network identifier
- block_number (BIGINT) - Current block
- gas_price (DECIMAL) - Current gas price
- is_healthy (BOOLEAN) - Health status
- response_time_ms (INTEGER) - Response time
- created_at (TIMESTAMP) - Check time
```

## Alert Configuration

### Webhook Alerts
Set up webhook URL to receive alerts:

```bash
export ALERT_WEBHOOK_URL=https://your-webhook-url.com/alerts
```

Alert payload format:
```json
{
  "alertType": "gas_price_spike",
  "timestamp": "2024-01-15T10:30:00Z",
  "network": "polygon-mumbai",
  "message": "Gas price spike detected",
  "details": {
    "currentGasPrice": "75.5",
    "thresholdGasPrice": "50.0",
    "percentageIncrease": 51.0
  }
}
```

### Alert Types
- `gas_price_spike` - Gas price exceeds threshold
- `network_unhealthy` - Network health issues
- `transaction_failed` - Transaction failures

## Performance Considerations

### Indexing Performance
- Events are processed in real-time as they occur
- Historical backfill processes events in batches
- Database indexes optimize query performance

### Memory Usage
- Transaction indexer maintains minimal in-memory state
- Network monitor caches recent health data
- Configurable cleanup of old data

### Network Load
- Health checks run every 30 seconds by default
- Event listening uses WebSocket connections when available
- Configurable polling intervals for different networks

## Troubleshooting

### Common Issues

**Monitoring service won't start:**
```bash
# Check environment variables
npm run monitoring status

# Verify database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check RPC endpoint
curl -X POST $RPC_URL -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Missing transaction data:**
```bash
# Backfill from specific block
npm run monitoring backfill --from-block 1000000

# Check contract address
npm run monitoring status
```

**High gas price alerts:**
```bash
# Adjust threshold
export GAS_PRICE_THRESHOLD_GWEI=100

# Check current gas prices
npm run monitoring health
```

### Logs and Debugging

Enable debug logging:
```bash
export DEBUG=monitoring:*
npm run monitoring start
```

Check system logs:
```bash
# View recent alerts
npm run monitoring metrics

# Check transaction failures
npm run monitoring insights --days 1
```

## Integration Examples

### Dashboard Integration
```typescript
// Get real-time metrics for dashboard
const metrics = await fetch('/api/monitoring/metrics').then(r => r.json());

// Display network health
const health = await fetch('/api/monitoring/network/health').then(r => r.json());

// Show transaction statistics
const stats = await fetch('/api/monitoring/transactions/stats').then(r => r.json());
```

### Alert Integration
```typescript
// Set up webhook endpoint to receive alerts
app.post('/webhook/alerts', (req, res) => {
  const { alertType, message, details } = req.body;
  
  switch (alertType) {
    case 'gas_price_spike':
      // Handle gas price alert
      notifyAdmins(`Gas price spike: ${details.currentGasPrice} Gwei`);
      break;
    case 'network_unhealthy':
      // Handle network issues
      escalateToOncall(`Network ${details.network} is unhealthy`);
      break;
    case 'transaction_failed':
      // Handle transaction failures
      logTransactionFailure(details);
      break;
  }
  
  res.status(200).send('OK');
});
```

## Best Practices

### Production Deployment
1. **Database Optimization**: Ensure proper indexing and regular maintenance
2. **Alert Thresholds**: Set appropriate gas price and health check thresholds
3. **Backup Strategy**: Regular backups of transaction data
4. **Monitoring**: Monitor the monitoring system itself
5. **Scaling**: Consider read replicas for high-query workloads

### Security
1. **API Keys**: Secure RPC endpoint access
2. **Database Access**: Restrict database permissions
3. **Webhook Security**: Validate webhook signatures
4. **Network Security**: Use secure connections (HTTPS/WSS)

### Maintenance
1. **Data Retention**: Configure automatic cleanup of old data
2. **Index Maintenance**: Regular database maintenance
3. **Log Rotation**: Manage log file sizes
4. **Updates**: Keep dependencies updated

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review system logs and metrics
3. Verify environment configuration
4. Test network connectivity

The monitoring system is designed to be robust and self-healing, but proper configuration and maintenance ensure optimal performance.