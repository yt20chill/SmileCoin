# SmileCoin SDK Examples

## Overview

This document provides comprehensive examples for using the SmileCoin JavaScript SDK to integrate tourist rewards blockchain functionality into your applications.

## Installation

```bash
npm install @smilecoin/sdk
# or
yarn add @smilecoin/sdk
```

## Basic Setup

### Initialize the SDK

```javascript
import { SmileCoinSDK } from '@smilecoin/sdk';

const sdk = new SmileCoinSDK({
  apiUrl: 'https://api.smilecoin.example.com',
  apiKey: 'your-api-key',
  timeout: 30000 // Optional: 30 seconds timeout
});
```

### Environment Configuration

```javascript
// Development
const devSdk = new SmileCoinSDK({
  apiUrl: 'http://localhost:3000',
  apiKey: 'dev-api-key'
});

// Production
const prodSdk = new SmileCoinSDK({
  apiUrl: 'https://api.smilecoin.example.com',
  apiKey: process.env.SMILECOIN_API_KEY
});
```

## Tourist Operations

### 1. Register a Tourist

```javascript
async function registerTourist() {
  try {
    const tourist = await sdk.registerTourist({
      touristId: 'tourist-123',
      originCountry: 'USA',
      arrivalDate: '2024-01-15',
      departureDate: '2024-01-22'
    });

    console.log('Tourist registered successfully:');
    console.log('Wallet Address:', tourist.walletAddress);
    console.log('Transaction Hash:', tourist.transactionHash);
    
    return tourist;
  } catch (error) {
    console.error('Failed to register tourist:', error.message);
    
    if (error.code === 'VALIDATION_ERROR') {
      console.error('Invalid data provided:', error.details);
    }
    
    throw error;
  }
}
```

### 2. Issue Daily Coins

```javascript
async function issueDailyCoins(touristId) {
  try {
    const issuance = await sdk.issueDailyCoins(touristId);
    
    console.log(`Issued ${issuance.amount} coins to ${touristId}`);
    console.log('Transaction Hash:', issuance.transactionHash);
    console.log('Coins expire on:', issuance.expirationDate);
    
    // Wait for transaction confirmation
    const status = await sdk.waitForTransaction(issuance.transactionHash);
    console.log('Transaction confirmed:', status.status);
    
    return issuance;
  } catch (error) {
    if (error.code === 'TOURIST_NOT_REGISTERED') {
      console.error('Tourist must be registered first');
      // Automatically register tourist if needed
      await registerTourist();
      return await issueDailyCoins(touristId);
    }
    
    throw error;
  }
}
```

### 3. Check Tourist Balance

```javascript
async function checkTouristBalance(touristId) {
  try {
    const balance = await sdk.getTouristBalance(touristId);
    
    console.log(`Tourist ${touristId} Balance:`);
    console.log('Current Balance:', balance.balance, 'coins');
    console.log('Wallet Address:', balance.walletAddress);
    console.log('Recent Transactions:', balance.transactions.length);
    
    // Display recent transactions
    balance.transactions.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.type}: ${tx.amount} coins (${tx.status})`);
    });
    
    return balance;
  } catch (error) {
    console.error('Failed to get balance:', error.message);
    throw error;
  }
}
```

### 4. Get Transaction History

```javascript
async function getTouristTransactionHistory(touristId, limit = 20) {
  try {
    const transactions = await sdk.getTouristTransactions(touristId, limit, 0);
    
    console.log(`Transaction History for ${touristId}:`);
    
    transactions.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.type.toUpperCase()}`);
      console.log(`   Amount: ${tx.amount} coins`);
      console.log(`   Status: ${tx.status}`);
      console.log(`   Date: ${new Date(tx.timestamp).toLocaleDateString()}`);
      console.log(`   Hash: ${tx.hash}`);
      console.log('---');
    });
    
    return transactions;
  } catch (error) {
    console.error('Failed to get transaction history:', error.message);
    throw error;
  }
}
```

## Restaurant Operations

### 1. Register a Restaurant

```javascript
async function registerRestaurant() {
  try {
    const restaurant = await sdk.registerRestaurant({
      googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      name: 'Mario\'s Pizza',
      address: '123 Main St, New York, NY 10001'
    });

    console.log('Restaurant registered successfully:');
    console.log('Wallet Address:', restaurant.walletAddress);
    console.log('QR Code Data:', restaurant.qrCode);
    console.log('Transaction Hash:', restaurant.transactionHash);
    
    return restaurant;
  } catch (error) {
    console.error('Failed to register restaurant:', error.message);
    throw error;
  }
}
```

### 2. Transfer Coins to Restaurant

```javascript
async function transferCoinsToRestaurant(touristId, restaurantId, amount) {
  try {
    // Check tourist balance first
    const balance = await sdk.getTouristBalance(touristId);
    
    if (balance.balance < amount) {
      throw new Error(`Insufficient balance. Available: ${balance.balance}, Required: ${amount}`);
    }
    
    const transfer = await sdk.transferCoins({
      touristId,
      restaurantId,
      amount
    });
    
    console.log(`Successfully transferred ${amount} coins`);
    console.log('Transaction Hash:', transfer.transactionHash);
    console.log('Remaining Daily Limit:', transfer.remainingDailyLimit);
    
    return transfer;
  } catch (error) {
    if (error.code === 'DAILY_LIMIT_EXCEEDED') {
      console.error('Daily transfer limit exceeded for this restaurant');
    } else if (error.code === 'INSUFFICIENT_BALANCE') {
      console.error('Tourist has insufficient balance');
    }
    
    throw error;
  }
}
```

### 3. Get Restaurant Earnings

```javascript
async function getRestaurantEarnings(restaurantId, days = 30) {
  try {
    const earnings = await sdk.getRestaurantEarnings(restaurantId);
    
    console.log(`Restaurant ${restaurantId} Earnings:`);
    console.log('Total Coins Received:', earnings.totalCoins);
    console.log('Wallet Address:', earnings.walletAddress);
    
    // Display daily breakdown
    console.log('\nDaily Breakdown (Last 7 days):');
    earnings.dailyBreakdown.slice(0, 7).forEach(day => {
      console.log(`${day.date}: ${day.coins} coins (${day.transactions} transactions)`);
    });
    
    // Display origin country breakdown
    console.log('\nTop Origin Countries:');
    earnings.originBreakdown.slice(0, 5).forEach(origin => {
      console.log(`${origin.country}: ${origin.coins} coins (${origin.transactions} transactions)`);
    });
    
    return earnings;
  } catch (error) {
    console.error('Failed to get restaurant earnings:', error.message);
    throw error;
  }
}
```

## Blockchain Operations

### 1. Monitor Transaction Status

```javascript
async function monitorTransaction(transactionHash) {
  try {
    console.log(`Monitoring transaction: ${transactionHash}`);
    
    // Get initial status
    let status = await sdk.getTransactionStatus(transactionHash);
    console.log('Initial Status:', status.status);
    
    // Wait for confirmation if pending
    if (status.status === 'pending') {
      console.log('Waiting for confirmation...');
      status = await sdk.waitForTransaction(transactionHash, 60000, 5000);
    }
    
    console.log('Final Status:', status.status);
    if (status.blockNumber) {
      console.log('Block Number:', status.blockNumber);
      console.log('Gas Used:', status.gasUsed);
    }
    console.log('Explorer URL:', status.explorerUrl);
    
    return status;
  } catch (error) {
    console.error('Failed to monitor transaction:', error.message);
    throw error;
  }
}
```

### 2. Check Network Status

```javascript
async function checkNetworkStatus() {
  try {
    const status = await sdk.getNetworkStatus();
    
    console.log('Blockchain Network Status:');
    console.log('Network:', status.network);
    console.log('Latest Block:', status.blockNumber);
    console.log('Gas Price:', status.gasPrice, 'wei');
    console.log('Network Healthy:', status.isHealthy ? 'Yes' : 'No');
    
    if (!status.isHealthy) {
      console.warn('⚠️ Network is experiencing issues');
    }
    
    return status;
  } catch (error) {
    console.error('Failed to check network status:', error.message);
    throw error;
  }
}
```

## Advanced Examples

### 1. Complete Tourist Journey

```javascript
async function completeTouristJourney() {
  const touristId = `tourist-${Date.now()}`;
  const restaurantId = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
  
  try {
    console.log('🧳 Starting complete tourist journey...');
    
    // Step 1: Register tourist
    console.log('1. Registering tourist...');
    await sdk.registerTourist({
      touristId,
      originCountry: 'USA',
      arrivalDate: '2024-01-15',
      departureDate: '2024-01-22'
    });
    
    // Step 2: Issue daily coins
    console.log('2. Issuing daily coins...');
    const issuance = await sdk.issueDailyCoins(touristId);
    
    // Step 3: Wait for confirmation
    console.log('3. Waiting for coin issuance confirmation...');
    await sdk.waitForTransaction(issuance.transactionHash);
    
    // Step 4: Check balance
    console.log('4. Checking balance...');
    const balance = await sdk.getTouristBalance(touristId);
    console.log(`Balance: ${balance.balance} coins`);
    
    // Step 5: Transfer coins to restaurant
    console.log('5. Transferring coins to restaurant...');
    const transfer = await sdk.transferCoins({
      touristId,
      restaurantId,
      amount: 3
    });
    
    // Step 6: Wait for transfer confirmation
    console.log('6. Waiting for transfer confirmation...');
    await sdk.waitForTransaction(transfer.transactionHash);
    
    // Step 7: Check final balance
    console.log('7. Checking final balance...');
    const finalBalance = await sdk.getTouristBalance(touristId);
    console.log(`Final balance: ${finalBalance.balance} coins`);
    
    console.log('✅ Tourist journey completed successfully!');
    
  } catch (error) {
    console.error('❌ Tourist journey failed:', error.message);
    throw error;
  }
}
```

### 2. Batch Operations

```javascript
async function batchTouristOperations(tourists) {
  const results = {
    successful: [],
    failed: []
  };
  
  // Register multiple tourists concurrently
  const registrationPromises = tourists.map(async (tourist) => {
    try {
      const result = await sdk.registerTourist(tourist);
      results.successful.push({ touristId: tourist.touristId, result });
    } catch (error) {
      results.failed.push({ touristId: tourist.touristId, error: error.message });
    }
  });
  
  await Promise.all(registrationPromises);
  
  console.log(`Registered ${results.successful.length} tourists successfully`);
  console.log(`Failed to register ${results.failed.length} tourists`);
  
  // Issue daily coins for successful registrations
  const coinIssuancePromises = results.successful.map(async ({ touristId }) => {
    try {
      await sdk.issueDailyCoins(touristId);
      console.log(`Issued coins to ${touristId}`);
    } catch (error) {
      console.error(`Failed to issue coins to ${touristId}:`, error.message);
    }
  });
  
  await Promise.all(coinIssuancePromises);
  
  return results;
}
```

### 3. Error Handling and Retry Logic

```javascript
class SmileCoinManager {
  constructor(apiUrl, apiKey) {
    this.sdk = new SmileCoinSDK({ apiUrl, apiKey });
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }
  
  async withRetry(operation, ...args) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation.apply(this.sdk, args);
      } catch (error) {
        lastError = error;
        
        // Don't retry validation errors
        if (error.code === 'VALIDATION_ERROR') {
          throw error;
        }
        
        // Don't retry business rule violations
        if (['DAILY_LIMIT_EXCEEDED', 'INSUFFICIENT_BALANCE'].includes(error.code)) {
          throw error;
        }
        
        console.warn(`Attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * attempt;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
  
  async registerTouristWithRetry(touristData) {
    return this.withRetry(this.sdk.registerTourist, touristData);
  }
  
  async issueDailyCoinsWithRetry(touristId) {
    return this.withRetry(this.sdk.issueDailyCoins, touristId);
  }
  
  async transferCoinsWithRetry(transferData) {
    return this.withRetry(this.sdk.transferCoins, transferData);
  }
}

// Usage
const manager = new SmileCoinManager('https://api.smilecoin.example.com', 'your-api-key');

try {
  const tourist = await manager.registerTouristWithRetry({
    touristId: 'tourist-123',
    originCountry: 'USA',
    arrivalDate: '2024-01-15',
    departureDate: '2024-01-22'
  });
  console.log('Tourist registered:', tourist.walletAddress);
} catch (error) {
  console.error('Failed after retries:', error.message);
}
```

### 4. Real-time Transaction Monitoring

```javascript
class TransactionMonitor {
  constructor(sdk) {
    this.sdk = sdk;
    this.monitoredTransactions = new Map();
  }
  
  async monitorTransaction(transactionHash, callback) {
    console.log(`Starting to monitor transaction: ${transactionHash}`);
    
    const monitor = {
      hash: transactionHash,
      callback,
      startTime: Date.now(),
      attempts: 0
    };
    
    this.monitoredTransactions.set(transactionHash, monitor);
    
    // Start monitoring
    this.checkTransaction(transactionHash);
  }
  
  async checkTransaction(transactionHash) {
    const monitor = this.monitoredTransactions.get(transactionHash);
    if (!monitor) return;
    
    try {
      monitor.attempts++;
      const status = await this.sdk.getTransactionStatus(transactionHash);
      
      // Call callback with status update
      monitor.callback({
        hash: transactionHash,
        status: status.status,
        blockNumber: status.blockNumber,
        gasUsed: status.gasUsed,
        attempts: monitor.attempts,
        elapsedTime: Date.now() - monitor.startTime
      });
      
      // If transaction is final, stop monitoring
      if (status.status === 'confirmed' || status.status === 'failed') {
        this.monitoredTransactions.delete(transactionHash);
        return;
      }
      
      // Continue monitoring if still pending
      if (status.status === 'pending' && monitor.attempts < 60) { // Max 5 minutes
        setTimeout(() => this.checkTransaction(transactionHash), 5000); // Check every 5 seconds
      } else {
        // Timeout
        monitor.callback({
          hash: transactionHash,
          status: 'timeout',
          attempts: monitor.attempts,
          elapsedTime: Date.now() - monitor.startTime
        });
        this.monitoredTransactions.delete(transactionHash);
      }
      
    } catch (error) {
      monitor.callback({
        hash: transactionHash,
        status: 'error',
        error: error.message,
        attempts: monitor.attempts,
        elapsedTime: Date.now() - monitor.startTime
      });
      
      // Retry on network errors
      if (error.code === 'NETWORK_ERROR' && monitor.attempts < 10) {
        setTimeout(() => this.checkTransaction(transactionHash), 10000); // Wait 10 seconds on error
      } else {
        this.monitoredTransactions.delete(transactionHash);
      }
    }
  }
  
  stopMonitoring(transactionHash) {
    this.monitoredTransactions.delete(transactionHash);
  }
  
  getActiveMonitors() {
    return Array.from(this.monitoredTransactions.keys());
  }
}

// Usage
const monitor = new TransactionMonitor(sdk);

// Issue coins and monitor the transaction
const issuance = await sdk.issueDailyCoins('tourist-123');

monitor.monitorTransaction(issuance.transactionHash, (update) => {
  console.log(`Transaction ${update.hash}:`);
  console.log(`  Status: ${update.status}`);
  console.log(`  Attempts: ${update.attempts}`);
  console.log(`  Elapsed: ${update.elapsedTime}ms`);
  
  if (update.status === 'confirmed') {
    console.log(`  Block: ${update.blockNumber}`);
    console.log(`  Gas Used: ${update.gasUsed}`);
    console.log('✅ Transaction confirmed!');
  } else if (update.status === 'failed') {
    console.log('❌ Transaction failed!');
  } else if (update.status === 'timeout') {
    console.log('⏰ Transaction monitoring timed out');
  } else if (update.status === 'error') {
    console.log(`🔥 Monitoring error: ${update.error}`);
  }
});
```

### 5. Analytics and Reporting

```javascript
class SmileCoinAnalytics {
  constructor(sdk) {
    this.sdk = sdk;
  }
  
  async generateTouristReport(touristId) {
    try {
      const balance = await this.sdk.getTouristBalance(touristId);
      const transactions = await this.sdk.getTouristTransactions(touristId, 100, 0);
      
      const report = {
        touristId,
        walletAddress: balance.walletAddress,
        currentBalance: balance.balance,
        totalTransactions: transactions.length,
        statistics: this.calculateTouristStatistics(transactions),
        recentActivity: transactions.slice(0, 10)
      };
      
      return report;
    } catch (error) {
      console.error('Failed to generate tourist report:', error.message);
      throw error;
    }
  }
  
  calculateTouristStatistics(transactions) {
    const stats = {
      totalCoinsReceived: 0,
      totalCoinsSpent: 0,
      restaurantsVisited: new Set(),
      dailyIssuances: 0,
      averageSpendingPerRestaurant: 0
    };
    
    transactions.forEach(tx => {
      if (tx.type === 'daily_issuance') {
        stats.totalCoinsReceived += tx.amount;
        stats.dailyIssuances++;
      } else if (tx.type === 'restaurant_transfer') {
        stats.totalCoinsSpent += tx.amount;
        stats.restaurantsVisited.add(tx.to);
      }
    });
    
    stats.restaurantsVisited = stats.restaurantsVisited.size;
    stats.averageSpendingPerRestaurant = stats.restaurantsVisited > 0 
      ? stats.totalCoinsSpent / stats.restaurantsVisited 
      : 0;
    
    return stats;
  }
  
  async generateRestaurantReport(restaurantId, days = 30) {
    try {
      const earnings = await this.sdk.getRestaurantEarnings(restaurantId);
      
      const report = {
        restaurantId,
        walletAddress: earnings.walletAddress,
        totalEarnings: earnings.totalCoins,
        reportPeriod: `${days} days`,
        dailyAverage: this.calculateDailyAverage(earnings.dailyBreakdown, days),
        topOriginCountries: earnings.originBreakdown.slice(0, 5),
        trends: this.calculateTrends(earnings.dailyBreakdown)
      };
      
      return report;
    } catch (error) {
      console.error('Failed to generate restaurant report:', error.message);
      throw error;
    }
  }
  
  calculateDailyAverage(dailyBreakdown, days) {
    const totalCoins = dailyBreakdown.reduce((sum, day) => sum + day.coins, 0);
    return totalCoins / days;
  }
  
  calculateTrends(dailyBreakdown) {
    if (dailyBreakdown.length < 7) return null;
    
    const recent = dailyBreakdown.slice(0, 7);
    const previous = dailyBreakdown.slice(7, 14);
    
    const recentAvg = recent.reduce((sum, day) => sum + day.coins, 0) / recent.length;
    const previousAvg = previous.reduce((sum, day) => sum + day.coins, 0) / previous.length;
    
    const change = ((recentAvg - previousAvg) / previousAvg) * 100;
    
    return {
      recentAverage: recentAvg,
      previousAverage: previousAvg,
      changePercent: change,
      trend: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable'
    };
  }
}

// Usage
const analytics = new SmileCoinAnalytics(sdk);

// Generate tourist report
const touristReport = await analytics.generateTouristReport('tourist-123');
console.log('Tourist Report:', JSON.stringify(touristReport, null, 2));

// Generate restaurant report
const restaurantReport = await analytics.generateRestaurantReport('ChIJN1t_tDeuEmsRUsoyG83frY4', 30);
console.log('Restaurant Report:', JSON.stringify(restaurantReport, null, 2));
```

## Testing Examples

### Unit Testing with Jest

```javascript
// __tests__/smilecoin-sdk.test.js
import { SmileCoinSDK } from '@smilecoin/sdk';

describe('SmileCoin SDK', () => {
  let sdk;
  
  beforeEach(() => {
    sdk = new SmileCoinSDK({
      apiUrl: 'http://localhost:3000',
      apiKey: 'test-api-key'
    });
  });
  
  test('should register tourist successfully', async () => {
    const touristData = {
      touristId: 'test-tourist-1',
      originCountry: 'USA',
      arrivalDate: '2024-01-15',
      departureDate: '2024-01-22'
    };
    
    const result = await sdk.registerTourist(touristData);
    
    expect(result).toHaveProperty('walletAddress');
    expect(result).toHaveProperty('transactionHash');
    expect(result.success).toBe(true);
  });
  
  test('should handle validation errors', async () => {
    const invalidData = {
      touristId: '', // Invalid empty ID
      originCountry: 'USA',
      arrivalDate: '2024-01-15',
      departureDate: '2024-01-22'
    };
    
    await expect(sdk.registerTourist(invalidData))
      .rejects
      .toThrow('Tourist ID is required');
  });
});
```

### Integration Testing

```javascript
// integration-test.js
async function runIntegrationTest() {
  const sdk = new SmileCoinSDK({
    apiUrl: 'http://localhost:3000',
    apiKey: 'test-api-key'
  });
  
  const touristId = `integration-test-${Date.now()}`;
  const restaurantId = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
  
  try {
    console.log('🧪 Running integration test...');
    
    // Test complete flow
    await sdk.registerTourist({
      touristId,
      originCountry: 'USA',
      arrivalDate: '2024-01-15',
      departureDate: '2024-01-22'
    });
    
    await sdk.issueDailyCoins(touristId);
    
    const balance = await sdk.getTouristBalance(touristId);
    expect(balance.balance).toBe(10);
    
    await sdk.transferCoins({
      touristId,
      restaurantId,
      amount: 3
    });
    
    const finalBalance = await sdk.getTouristBalance(touristId);
    expect(finalBalance.balance).toBe(7);
    
    console.log('✅ Integration test passed!');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    throw error;
  }
}
```

## Best Practices

### 1. Error Handling

```javascript
// Always handle specific error codes
try {
  await sdk.transferCoins(transferData);
} catch (error) {
  switch (error.code) {
    case 'INSUFFICIENT_BALANCE':
      // Handle insufficient balance
      break;
    case 'DAILY_LIMIT_EXCEEDED':
      // Handle daily limit
      break;
    case 'NETWORK_ERROR':
      // Retry or show network error
      break;
    default:
      // Handle unexpected errors
      break;
  }
}
```

### 2. Configuration Management

```javascript
// Use environment-specific configuration
const config = {
  development: {
    apiUrl: 'http://localhost:3000',
    apiKey: 'dev-api-key'
  },
  production: {
    apiUrl: 'https://api.smilecoin.example.com',
    apiKey: process.env.SMILECOIN_API_KEY
  }
};

const sdk = new SmileCoinSDK(config[process.env.NODE_ENV || 'development']);
```

### 3. Logging and Monitoring

```javascript
// Add logging wrapper
class LoggingSDK {
  constructor(sdk, logger) {
    this.sdk = sdk;
    this.logger = logger;
  }
  
  async registerTourist(data) {
    this.logger.info('Registering tourist', { touristId: data.touristId });
    
    try {
      const result = await this.sdk.registerTourist(data);
      this.logger.info('Tourist registered successfully', { 
        touristId: data.touristId,
        walletAddress: result.walletAddress 
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to register tourist', { 
        touristId: data.touristId,
        error: error.message 
      });
      throw error;
    }
  }
}
```

This comprehensive guide should help you integrate the SmileCoin SDK into your applications effectively. For more examples and updates, check the official documentation and GitHub repository.