# Interactive SmileCoin API Examples

## Overview

This document provides interactive examples and code snippets that you can copy and run directly to test the SmileCoin API endpoints. All examples include complete request/response cycles with real data.

## Prerequisites

- API Key (get from your dashboard)
- Base URL: `https://api.smilecoin.example.com` (or `http://localhost:3000` for development)
- HTTP client (curl, Postman, or JavaScript fetch)

## Authentication

All requests require an API key in the Authorization header:

```bash
Authorization: Bearer YOUR_API_KEY
```

## Interactive Examples

### 1. Health Check

**Test API connectivity and status**

```bash
# cURL
curl -X GET "https://api.smilecoin.example.com/health" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Expected Response
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "blockchain": "healthy",
    "redis": "healthy"
  }
}
```

```javascript
// JavaScript (Node.js/Browser)
const response = await fetch('https://api.smilecoin.example.com/health', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});

const health = await response.json();
console.log('API Health:', health);
```

```python
# Python
import requests

response = requests.get(
    'https://api.smilecoin.example.com/health',
    headers={'Authorization': 'Bearer YOUR_API_KEY'}
)

print('API Health:', response.json())
```

### 2. Register Tourist

**Create a new tourist account and blockchain wallet**

```bash
# cURL
curl -X POST "https://api.smilecoin.example.com/api/tourists/register" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "touristId": "tourist-demo-001",
    "originCountry": "USA",
    "arrivalDate": "2024-01-15",
    "departureDate": "2024-01-22"
  }'

# Expected Response
{
  "walletAddress": "0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4",
  "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "success": true
}
```

```javascript
// JavaScript
async function registerTourist() {
  const response = await fetch('https://api.smilecoin.example.com/api/tourists/register', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      touristId: 'tourist-demo-001',
      originCountry: 'USA',
      arrivalDate: '2024-01-15',
      departureDate: '2024-01-22'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Registration failed:', error);
    return;
  }

  const tourist = await response.json();
  console.log('Tourist registered:', tourist);
  return tourist;
}

// Run the function
registerTourist();
```

```python
# Python
import requests
import json

def register_tourist():
    url = 'https://api.smilecoin.example.com/api/tourists/register'
    headers = {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    }
    data = {
        'touristId': 'tourist-demo-001',
        'originCountry': 'USA',
        'arrivalDate': '2024-01-15',
        'departureDate': '2024-01-22'
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 200:
        tourist = response.json()
        print('Tourist registered:', tourist)
        return tourist
    else:
        print('Registration failed:', response.json())
        return None

# Run the function
register_tourist()
```

### 3. Issue Daily Coins

**Issue 10 SmileCoins to a registered tourist**

```bash
# cURL
curl -X POST "https://api.smilecoin.example.com/api/tourists/tourist-demo-001/daily-coins" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Expected Response
{
  "transactionHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "amount": 10,
  "expirationDate": "2024-01-29T10:30:00Z"
}
```

```javascript
// JavaScript
async function issueDailyCoins(touristId) {
  const response = await fetch(`https://api.smilecoin.example.com/api/tourists/${touristId}/daily-coins`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Coin issuance failed:', error);
    return;
  }

  const issuance = await response.json();
  console.log('Coins issued:', issuance);
  
  // Monitor transaction status
  setTimeout(() => checkTransactionStatus(issuance.transactionHash), 5000);
  
  return issuance;
}

// Run the function
issueDailyCoins('tourist-demo-001');
```

### 4. Check Tourist Balance

**Get current balance and transaction history**

```bash
# cURL
curl -X GET "https://api.smilecoin.example.com/api/tourists/tourist-demo-001/balance?limit=5" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Expected Response
{
  "balance": 10,
  "walletAddress": "0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4",
  "transactions": [
    {
      "hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      "from": "0x0000000000000000000000000000000000000000",
      "to": "0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4",
      "amount": 10,
      "timestamp": "2024-01-15T10:30:00Z",
      "status": "confirmed",
      "type": "daily_issuance"
    }
  ]
}
```

```javascript
// JavaScript
async function checkBalance(touristId) {
  const response = await fetch(`https://api.smilecoin.example.com/api/tourists/${touristId}/balance?limit=10`, {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  });

  const balance = await response.json();
  
  console.log(`Tourist ${touristId}:`);
  console.log(`Balance: ${balance.balance} coins`);
  console.log(`Wallet: ${balance.walletAddress}`);
  console.log(`Recent transactions: ${balance.transactions.length}`);
  
  balance.transactions.forEach((tx, index) => {
    console.log(`${index + 1}. ${tx.type}: ${tx.amount} coins (${tx.status})`);
  });
  
  return balance;
}

// Run the function
checkBalance('tourist-demo-001');
```

### 5. Register Restaurant

**Create a new restaurant account**

```bash
# cURL
curl -X POST "https://api.smilecoin.example.com/api/restaurants/register" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
    "name": "Demo Pizza Restaurant",
    "address": "123 Demo Street, Demo City, Demo Country"
  }'

# Expected Response
{
  "walletAddress": "0x853f43d8A49eDb4B8C4C4e4C4C4C4C4C4C4C4C4",
  "qrCode": "restaurant:ChIJN1t_tDeuEmsRUsoyG83frY4:0x853f43d8A49eDb4B8C4C4e4C4C4C4C4C4C4C4C4",
  "transactionHash": "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
  "success": true
}
```

```javascript
// JavaScript
async function registerRestaurant() {
  const response = await fetch('https://api.smilecoin.example.com/api/restaurants/register', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      name: 'Demo Pizza Restaurant',
      address: '123 Demo Street, Demo City, Demo Country'
    })
  });

  const restaurant = await response.json();
  console.log('Restaurant registered:', restaurant);
  console.log('QR Code for payments:', restaurant.qrCode);
  
  return restaurant;
}

// Run the function
registerRestaurant();
```

### 6. Transfer Coins to Restaurant

**Send coins from tourist to restaurant**

```bash
# cURL
curl -X POST "https://api.smilecoin.example.com/api/restaurants/ChIJN1t_tDeuEmsRUsoyG83frY4/receive-coins" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "touristId": "tourist-demo-001",
    "amount": 2.5
  }'

# Expected Response
{
  "transactionHash": "0x567890abcdef567890abcdef567890abcdef567890abcdef567890abcdef567890",
  "success": true,
  "amount": 2.5,
  "remainingDailyLimit": 0.5
}
```

```javascript
// JavaScript
async function transferCoins(touristId, restaurantId, amount) {
  const response = await fetch(`https://api.smilecoin.example.com/api/restaurants/${restaurantId}/receive-coins`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      touristId: touristId,
      amount: amount
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Transfer failed:', error);
    return;
  }

  const transfer = await response.json();
  console.log(`Transferred ${transfer.amount} coins successfully`);
  console.log(`Remaining daily limit: ${transfer.remainingDailyLimit} coins`);
  console.log(`Transaction hash: ${transfer.transactionHash}`);
  
  return transfer;
}

// Run the function
transferCoins('tourist-demo-001', 'ChIJN1t_tDeuEmsRUsoyG83frY4', 2.5);
```

### 7. Get Restaurant Earnings

**Check restaurant's total earnings and breakdown**

```bash
# cURL
curl -X GET "https://api.smilecoin.example.com/api/restaurants/ChIJN1t_tDeuEmsRUsoyG83frY4/earnings?days=7" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Expected Response
{
  "totalCoins": 15.5,
  "walletAddress": "0x853f43d8A49eDb4B8C4C4e4C4C4C4C4C4C4C4C4",
  "dailyBreakdown": [
    {
      "date": "2024-01-15",
      "coins": 2.5,
      "transactions": 1
    }
  ],
  "originBreakdown": [
    {
      "country": "USA",
      "coins": 2.5,
      "transactions": 1
    }
  ]
}
```

```javascript
// JavaScript
async function getRestaurantEarnings(restaurantId, days = 7) {
  const response = await fetch(`https://api.smilecoin.example.com/api/restaurants/${restaurantId}/earnings?days=${days}`, {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  });

  const earnings = await response.json();
  
  console.log(`Restaurant ${restaurantId} Earnings:`);
  console.log(`Total coins: ${earnings.totalCoins}`);
  console.log(`Wallet: ${earnings.walletAddress}`);
  
  console.log('\nDaily breakdown:');
  earnings.dailyBreakdown.forEach(day => {
    console.log(`${day.date}: ${day.coins} coins (${day.transactions} transactions)`);
  });
  
  console.log('\nTop countries:');
  earnings.originBreakdown.forEach(origin => {
    console.log(`${origin.country}: ${origin.coins} coins`);
  });
  
  return earnings;
}

// Run the function
getRestaurantEarnings('ChIJN1t_tDeuEmsRUsoyG83frY4', 7);
```

### 8. Monitor Transaction Status

**Check the status of a blockchain transaction**

```bash
# cURL
curl -X GET "https://api.smilecoin.example.com/api/blockchain/transaction/0x567890abcdef567890abcdef567890abcdef567890abcdef567890abcdef567890" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Expected Response
{
  "status": "confirmed",
  "blockNumber": 12345678,
  "gasUsed": 65000,
  "explorerUrl": "https://polygonscan.com/tx/0x567890abcdef567890abcdef567890abcdef567890abcdef567890abcdef567890",
  "confirmations": 15
}
```

```javascript
// JavaScript
async function checkTransactionStatus(transactionHash) {
  const response = await fetch(`https://api.smilecoin.example.com/api/blockchain/transaction/${transactionHash}`, {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  });

  if (!response.ok) {
    console.error('Failed to get transaction status');
    return;
  }

  const status = await response.json();
  
  console.log(`Transaction ${transactionHash}:`);
  console.log(`Status: ${status.status}`);
  
  if (status.status === 'confirmed') {
    console.log(`Block: ${status.blockNumber}`);
    console.log(`Gas used: ${status.gasUsed}`);
    console.log(`Confirmations: ${status.confirmations}`);
  }
  
  console.log(`Explorer: ${status.explorerUrl}`);
  
  return status;
}

// Run the function
checkTransactionStatus('0x567890abcdef567890abcdef567890abcdef567890abcdef567890abcdef567890');
```

### 9. Check Network Status

**Get blockchain network health and status**

```bash
# cURL
curl -X GET "https://api.smilecoin.example.com/api/blockchain/network/status" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Expected Response
{
  "network": "polygon-mumbai",
  "blockNumber": 12345678,
  "gasPrice": "30000000000",
  "isHealthy": true,
  "lastBlockTime": "2024-01-15T10:30:00Z"
}
```

```javascript
// JavaScript
async function checkNetworkStatus() {
  const response = await fetch('https://api.smilecoin.example.com/api/blockchain/network/status', {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  });

  const status = await response.json();
  
  console.log('Blockchain Network Status:');
  console.log(`Network: ${status.network}`);
  console.log(`Latest block: ${status.blockNumber}`);
  console.log(`Gas price: ${status.gasPrice} wei`);
  console.log(`Healthy: ${status.isHealthy ? 'Yes' : 'No'}`);
  console.log(`Last block time: ${status.lastBlockTime}`);
  
  if (!status.isHealthy) {
    console.warn('⚠️ Network is experiencing issues');
  }
  
  return status;
}

// Run the function
checkNetworkStatus();
```

### 10. Estimate Gas Costs

**Get gas cost estimates for operations**

```bash
# cURL
curl -X POST "https://api.smilecoin.example.com/api/blockchain/gas/estimate" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "transfer_coins",
    "amount": 2.5
  }'

# Expected Response
{
  "operation": "transfer_coins",
  "estimatedGas": 65000,
  "gasPrice": "30000000000",
  "estimatedCostWei": "1950000000000000",
  "estimatedCostUSD": 0.0026
}
```

```javascript
// JavaScript
async function estimateGasCost(operation, amount = null) {
  const body = { operation };
  if (amount) body.amount = amount;

  const response = await fetch('https://api.smilecoin.example.com/api/blockchain/gas/estimate', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const estimate = await response.json();
  
  console.log(`Gas estimate for ${operation}:`);
  console.log(`Estimated gas: ${estimate.estimatedGas}`);
  console.log(`Gas price: ${estimate.gasPrice} wei`);
  console.log(`Estimated cost: $${estimate.estimatedCostUSD}`);
  
  return estimate;
}

// Run the function
estimateGasCost('transfer_coins', 2.5);
```

## Complete Workflow Example

**Full tourist journey from registration to spending**

```javascript
// Complete workflow example
async function completeWorkflowDemo() {
  console.log('🚀 Starting complete SmileCoin workflow demo...\n');
  
  const touristId = `demo-tourist-${Date.now()}`;
  const restaurantId = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
  
  try {
    // Step 1: Check network status
    console.log('1. Checking network status...');
    const networkStatus = await checkNetworkStatus();
    if (!networkStatus.isHealthy) {
      throw new Error('Network is not healthy');
    }
    
    // Step 2: Register tourist
    console.log('\n2. Registering tourist...');
    const tourist = await fetch('https://api.smilecoin.example.com/api/tourists/register', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        touristId,
        originCountry: 'USA',
        arrivalDate: '2024-01-15',
        departureDate: '2024-01-22'
      })
    }).then(r => r.json());
    
    console.log(`Tourist registered: ${tourist.walletAddress}`);
    
    // Step 3: Issue daily coins
    console.log('\n3. Issuing daily coins...');
    const issuance = await fetch(`https://api.smilecoin.example.com/api/tourists/${touristId}/daily-coins`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
    }).then(r => r.json());
    
    console.log(`Issued ${issuance.amount} coins, expires: ${issuance.expirationDate}`);
    
    // Step 4: Wait for confirmation
    console.log('\n4. Waiting for transaction confirmation...');
    let confirmed = false;
    let attempts = 0;
    
    while (!confirmed && attempts < 12) { // Max 1 minute
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const status = await fetch(`https://api.smilecoin.example.com/api/blockchain/transaction/${issuance.transactionHash}`, {
        headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
      }).then(r => r.json());
      
      console.log(`Transaction status: ${status.status}`);
      
      if (status.status === 'confirmed') {
        confirmed = true;
        console.log(`Confirmed in block ${status.blockNumber}`);
      } else if (status.status === 'failed') {
        throw new Error('Transaction failed');
      }
      
      attempts++;
    }
    
    // Step 5: Check balance
    console.log('\n5. Checking tourist balance...');
    const balance = await fetch(`https://api.smilecoin.example.com/api/tourists/${touristId}/balance`, {
      headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
    }).then(r => r.json());
    
    console.log(`Current balance: ${balance.balance} coins`);
    
    // Step 6: Transfer coins to restaurant
    console.log('\n6. Transferring coins to restaurant...');
    const transfer = await fetch(`https://api.smilecoin.example.com/api/restaurants/${restaurantId}/receive-coins`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        touristId,
        amount: 3
      })
    }).then(r => r.json());
    
    console.log(`Transferred ${transfer.amount} coins successfully`);
    console.log(`Remaining daily limit: ${transfer.remainingDailyLimit} coins`);
    
    // Step 7: Check final balance
    console.log('\n7. Checking final balance...');
    const finalBalance = await fetch(`https://api.smilecoin.example.com/api/tourists/${touristId}/balance`, {
      headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
    }).then(r => r.json());
    
    console.log(`Final balance: ${finalBalance.balance} coins`);
    
    // Step 8: Check restaurant earnings
    console.log('\n8. Checking restaurant earnings...');
    const earnings = await fetch(`https://api.smilecoin.example.com/api/restaurants/${restaurantId}/earnings`, {
      headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
    }).then(r => r.json());
    
    console.log(`Restaurant total earnings: ${earnings.totalCoins} coins`);
    
    console.log('\n✅ Complete workflow demo finished successfully!');
    
  } catch (error) {
    console.error('\n❌ Workflow demo failed:', error.message);
  }
}

// Run the complete demo
completeWorkflowDemo();
```

## Error Handling Examples

```javascript
// Comprehensive error handling
async function robustApiCall(endpoint, options = {}) {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const response = await fetch(`https://api.smilecoin.example.com${endpoint}`, {
        ...options,
        headers: {
          'Authorization': 'Bearer YOUR_API_KEY',
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        
        // Handle specific error codes
        switch (error.error?.code) {
          case 'RATE_LIMIT_EXCEEDED':
            console.log('Rate limit exceeded, waiting...');
            await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
            attempt++;
            continue;
            
          case 'NETWORK_ERROR':
            console.log('Network error, retrying...');
            attempt++;
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            continue;
            
          case 'VALIDATION_ERROR':
            console.error('Validation error:', error.error.message);
            throw new Error(`Validation failed: ${error.error.message}`);
            
          case 'INSUFFICIENT_BALANCE':
            console.error('Insufficient balance for operation');
            throw new Error('Tourist does not have enough coins');
            
          case 'DAILY_LIMIT_EXCEEDED':
            console.error('Daily limit exceeded');
            throw new Error('Cannot transfer more coins to this restaurant today');
            
          default:
            console.error('API error:', error);
            throw new Error(`API error: ${error.error?.message || 'Unknown error'}`);
        }
      }
      
      return await response.json();
      
    } catch (error) {
      if (attempt >= maxRetries - 1) {
        throw error;
      }
      
      console.log(`Attempt ${attempt + 1} failed, retrying...`);
      attempt++;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
    }
  }
}

// Usage example
try {
  const result = await robustApiCall('/api/tourists/register', {
    method: 'POST',
    body: JSON.stringify({
      touristId: 'robust-tourist-001',
      originCountry: 'USA',
      arrivalDate: '2024-01-15',
      departureDate: '2024-01-22'
    })
  });
  
  console.log('Tourist registered successfully:', result);
} catch (error) {
  console.error('Failed to register tourist after retries:', error.message);
}
```

## Testing Your Integration

```javascript
// Simple test suite for your integration
async function runTests() {
  const tests = [
    {
      name: 'Health Check',
      test: async () => {
        const response = await fetch('https://api.smilecoin.example.com/health', {
          headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
        });
        return response.ok;
      }
    },
    {
      name: 'Network Status',
      test: async () => {
        const response = await fetch('https://api.smilecoin.example.com/api/blockchain/network/status', {
          headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
        });
        const status = await response.json();
        return status.isHealthy;
      }
    },
    {
      name: 'Tourist Registration',
      test: async () => {
        const response = await fetch('https://api.smilecoin.example.com/api/tourists/register', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer YOUR_API_KEY',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            touristId: `test-tourist-${Date.now()}`,
            originCountry: 'USA',
            arrivalDate: '2024-01-15',
            departureDate: '2024-01-22'
          })
        });
        return response.ok;
      }
    }
  ];
  
  console.log('🧪 Running integration tests...\n');
  
  for (const test of tests) {
    try {
      const result = await test.test();
      console.log(`${result ? '✅' : '❌'} ${test.name}: ${result ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      console.log(`❌ ${test.name}: FAIL (${error.message})`);
    }
  }
  
  console.log('\n🏁 Tests completed');
}

// Run tests
runTests();
```

## Next Steps

1. **Get Your API Key**: Contact support to get your production API key
2. **Test in Development**: Use the localhost examples to test your integration
3. **Implement Error Handling**: Use the robust error handling patterns shown above
4. **Monitor Your Usage**: Check your API usage and rate limits regularly
5. **Join the Community**: Get help and share experiences with other developers

## Support

- **Documentation**: https://docs.smilecoin.example.com
- **API Status**: https://status.smilecoin.example.com
- **Support Email**: support@smilecoin.example.com
- **Discord**: https://discord.gg/smilecoin

Copy and modify these examples to build your SmileCoin integration!