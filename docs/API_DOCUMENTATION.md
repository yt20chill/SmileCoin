# SmileCoin API Documentation

## Overview

The SmileCoin API provides a RESTful interface for managing tourist rewards blockchain operations. This API handles tourist registration, daily coin issuance, restaurant registration, coin transfers, and blockchain monitoring.

**Base URL:** `https://api.smilecoin.example.com`  
**Version:** 1.0.0  
**Authentication:** Bearer Token (API Key)

## Authentication

All API requests require authentication using an API key in the Authorization header:

```http
Authorization: Bearer YOUR_API_KEY
```

## Rate Limiting

- **Rate Limit:** 1000 requests per hour per API key
- **Burst Limit:** 100 requests per minute
- **Headers:** Rate limit information is returned in response headers:
  - `X-RateLimit-Limit`: Total requests allowed per hour
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Unix timestamp when the rate limit resets

## Error Handling

The API uses standard HTTP status codes and returns detailed error information:

```json
{
  "error": {
    "code": "TOURIST_NOT_REGISTERED",
    "message": "Tourist must be registered before issuing coins",
    "details": {
      "touristId": "tourist-123",
      "suggestion": "Register the tourist first using POST /api/tourists/register"
    }
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid request data |
| `TOURIST_NOT_REGISTERED` | Tourist not found or not registered |
| `RESTAURANT_NOT_REGISTERED` | Restaurant not found or not registered |
| `INSUFFICIENT_BALANCE` | Tourist has insufficient coin balance |
| `DAILY_LIMIT_EXCEEDED` | Daily transfer limit exceeded |
| `TRANSACTION_FAILED` | Blockchain transaction failed |
| `NETWORK_ERROR` | Blockchain network connectivity issue |

## Tourist Operations

### Register Tourist

Register a new tourist in the system and create their blockchain wallet.

**Endpoint:** `POST /api/tourists/register`

**Request Body:**
```json
{
  "touristId": "tourist-123",
  "originCountry": "USA",
  "arrivalDate": "2024-01-15",
  "departureDate": "2024-01-22"
}
```

**Response:**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4",
  "transactionHash": "0x1234567890abcdef...",
  "success": true
}
```

**Example:**
```bash
curl -X POST https://api.smilecoin.example.com/api/tourists/register \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "touristId": "tourist-123",
    "originCountry": "USA",
    "arrivalDate": "2024-01-15",
    "departureDate": "2024-01-22"
  }'
```

### Issue Daily Coins

Issue 10 SmileCoins to a registered tourist (once per day).

**Endpoint:** `POST /api/tourists/{touristId}/daily-coins`

**Parameters:**
- `touristId` (path): Unique identifier for the tourist

**Response:**
```json
{
  "transactionHash": "0x1234567890abcdef...",
  "amount": 10,
  "expirationDate": "2024-01-29T12:00:00Z"
}
```

**Example:**
```bash
curl -X POST https://api.smilecoin.example.com/api/tourists/tourist-123/daily-coins \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Get Tourist Balance

Retrieve tourist's current balance and transaction history.

**Endpoint:** `GET /api/tourists/{touristId}/balance`

**Parameters:**
- `touristId` (path): Unique identifier for the tourist
- `limit` (query, optional): Maximum number of transactions to return (default: 20, max: 100)
- `offset` (query, optional): Number of transactions to skip (default: 0)

**Response:**
```json
{
  "balance": 7.5,
  "walletAddress": "0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4",
  "transactions": [
    {
      "hash": "0x1234567890abcdef...",
      "from": "0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4",
      "to": "0x853f43d8A49eDb4B8C4C4e4C4C4C4C4C4C4C4C4",
      "amount": 3,
      "timestamp": "2024-01-15T14:30:00Z",
      "status": "confirmed",
      "type": "restaurant_transfer"
    }
  ]
}
```

**Example:**
```bash
curl https://api.smilecoin.example.com/api/tourists/tourist-123/balance?limit=10 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Restaurant Operations

### Register Restaurant

Register a new restaurant in the system and create their blockchain wallet.

**Endpoint:** `POST /api/restaurants/register`

**Request Body:**
```json
{
  "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
  "name": "Mario's Pizza",
  "address": "123 Main St, City, Country"
}
```

**Response:**
```json
{
  "walletAddress": "0x853f43d8A49eDb4B8C4C4e4C4C4C4C4C4C4C4C4",
  "qrCode": "restaurant:ChIJN1t_tDeuEmsRUsoyG83frY4:0x853f43d8A49eDb4B8C4C4e4C4C4C4C4C4C4C4C4",
  "transactionHash": "0x1234567890abcdef...",
  "success": true
}
```

**Example:**
```bash
curl -X POST https://api.smilecoin.example.com/api/restaurants/register \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
    "name": "Mario'\''s Pizza",
    "address": "123 Main St, City, Country"
  }'
```

### Transfer Coins to Restaurant

Transfer SmileCoins from a tourist to a restaurant (max 3 coins per restaurant per day).

**Endpoint:** `POST /api/restaurants/{restaurantId}/receive-coins`

**Parameters:**
- `restaurantId` (path): Google Place ID of the restaurant

**Request Body:**
```json
{
  "touristId": "tourist-123",
  "amount": 2.5
}
```

**Response:**
```json
{
  "transactionHash": "0x1234567890abcdef...",
  "success": true,
  "amount": 2.5,
  "remainingDailyLimit": 0.5
}
```

**Example:**
```bash
curl -X POST https://api.smilecoin.example.com/api/restaurants/ChIJN1t_tDeuEmsRUsoyG83frY4/receive-coins \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "touristId": "tourist-123",
    "amount": 2.5
  }'
```

### Get Restaurant Earnings

Retrieve restaurant's earnings breakdown and statistics.

**Endpoint:** `GET /api/restaurants/{restaurantId}/earnings`

**Parameters:**
- `restaurantId` (path): Google Place ID of the restaurant
- `days` (query, optional): Number of days to include in daily breakdown (default: 30, max: 90)
- `includeOrigins` (query, optional): Whether to include origin country breakdown (default: true)

**Response:**
```json
{
  "totalCoins": 127.5,
  "walletAddress": "0x853f43d8A49eDb4B8C4C4e4C4C4C4C4C4C4C4C4",
  "dailyBreakdown": [
    {
      "date": "2024-01-15",
      "coins": 15.5,
      "transactions": 8
    }
  ],
  "originBreakdown": [
    {
      "country": "USA",
      "coins": 45.5,
      "transactions": 23
    }
  ]
}
```

**Example:**
```bash
curl https://api.smilecoin.example.com/api/restaurants/ChIJN1t_tDeuEmsRUsoyG83frY4/earnings?days=7 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Blockchain Operations

### Get Transaction Status

Retrieve the current status and details of a blockchain transaction.

**Endpoint:** `GET /api/blockchain/transaction/{hash}`

**Parameters:**
- `hash` (path): Transaction hash (64-character hexadecimal string starting with 0x)

**Response:**
```json
{
  "status": "confirmed",
  "blockNumber": 12345678,
  "gasUsed": 21000,
  "explorerUrl": "https://polygonscan.com/tx/0x1234567890abcdef...",
  "confirmations": 15
}
```

**Example:**
```bash
curl https://api.smilecoin.example.com/api/blockchain/transaction/0x1234567890abcdef... \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Get Network Status

Retrieve the current status and health of the blockchain network.

**Endpoint:** `GET /api/blockchain/network/status`

**Response:**
```json
{
  "network": "polygon-mumbai",
  "blockNumber": 12345678,
  "gasPrice": "30000000000",
  "isHealthy": true,
  "lastBlockTime": "2024-01-15T14:30:00Z"
}
```

**Example:**
```bash
curl https://api.smilecoin.example.com/api/blockchain/network/status \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Estimate Gas Costs

Get estimated gas costs for common SmileCoin operations.

**Endpoint:** `POST /api/blockchain/gas/estimate`

**Request Body:**
```json
{
  "operation": "issue_daily_coins",
  "amount": 2.5
}
```

**Response:**
```json
{
  "operation": "issue_daily_coins",
  "estimatedGas": 85000,
  "gasPrice": "30000000000",
  "estimatedCostWei": "2550000000000000",
  "estimatedCostUSD": 0.0034
}
```

**Example:**
```bash
curl -X POST https://api.smilecoin.example.com/api/blockchain/gas/estimate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "transfer_coins",
    "amount": 2.5
  }'
```

### Get Contract Information

Retrieve information about the deployed SmileCoin contract.

**Endpoint:** `GET /api/blockchain/contract/info`

**Response:**
```json
{
  "contractAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "network": "polygon-mumbai",
  "totalSupply": "1000000000000000000000",
  "totalTourists": 1247,
  "totalRestaurants": 89,
  "dailyCoinsIssued": "12470000000000000000000",
  "explorerUrl": "https://mumbai.polygonscan.com/address/0x1234567890abcdef1234567890abcdef12345678"
}
```

**Example:**
```bash
curl https://api.smilecoin.example.com/api/blockchain/contract/info \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Business Rules

### Daily Coin Issuance
- Each tourist can receive exactly 10 SmileCoins per day
- Coins can only be issued once per day per tourist
- Coins expire after 14 days from issuance
- Tourist must be within their travel dates (arrival to departure)

### Restaurant Transfers
- Maximum 3 coins can be transferred to any single restaurant per day per tourist
- Transfers are only allowed between registered tourists and restaurants
- Tourist must have sufficient balance for the transfer
- Daily limits reset at midnight UTC

### Coin Expiration
- All coins expire 14 days after issuance
- Expired coins are automatically burned from the tourist's balance
- Expiration tracking is handled automatically by the smart contract

## SDK Integration

For easier integration, use the SmileCoin JavaScript SDK:

```javascript
import { SmileCoinSDK } from '@smilecoin/sdk';

const sdk = new SmileCoinSDK({
  apiUrl: 'https://api.smilecoin.example.com',
  apiKey: 'your-api-key'
});

// Register a tourist
const tourist = await sdk.registerTourist({
  touristId: 'tourist-123',
  originCountry: 'USA',
  arrivalDate: '2024-01-15',
  departureDate: '2024-01-22'
});

// Issue daily coins
const coins = await sdk.issueDailyCoins('tourist-123');

// Transfer coins to restaurant
const transfer = await sdk.transferCoins({
  touristId: 'tourist-123',
  restaurantId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  amount: 2.5
});
```

## Webhooks (Coming Soon)

Future versions will support webhooks for real-time notifications:
- Transaction confirmations
- Daily coin issuance events
- Transfer completions
- Network status changes

## Support

For API support and questions:
- **Documentation:** https://docs.smilecoin.example.com
- **Support Email:** support@smilecoin.example.com
- **Status Page:** https://status.smilecoin.example.com