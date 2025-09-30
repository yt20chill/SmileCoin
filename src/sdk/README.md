# SmileCoin JavaScript SDK

The SmileCoin JavaScript SDK provides a simple, promise-based interface for interacting with the Tourist Rewards Blockchain Infrastructure. This SDK abstracts away blockchain complexity and provides easy-to-use methods for tourist registration, daily coin issuance, restaurant transfers, and transaction monitoring.

## Installation

```bash
npm install @smilecoin/sdk
```

## Quick Start

```typescript
import { SmileCoinSDK } from '@smilecoin/sdk';

// Initialize the SDK
const sdk = new SmileCoinSDK({
  apiUrl: 'https://api.smilecoin.example.com',
  apiKey: 'your-api-key-here'
});

// Register a tourist
const tourist = await sdk.registerTourist({
  touristId: 'tourist-123',
  originCountry: 'USA',
  arrivalDate: '2024-01-15',
  departureDate: '2024-01-22'
});

console.log('Tourist registered:', tourist.walletAddress);
```

## Configuration

### SDK Constructor Options

```typescript
interface SDKConfig {
  apiUrl: string;      // Base URL of the SmileCoin API
  apiKey: string;      // Your API authentication key
  timeout?: number;    // Request timeout in milliseconds (default: 30000)
}
```

### Example Configuration

```typescript
const sdk = new SmileCoinSDK({
  apiUrl: 'https://api.smilecoin.example.com',
  apiKey: process.env.SMILECOIN_API_KEY,
  timeout: 60000 // 60 seconds
});
```

## Tourist Operations

### Register Tourist

Register a new tourist in the system and create their blockchain wallet.

```typescript
const tourist = await sdk.registerTourist({
  touristId: 'unique-tourist-id',
  originCountry: 'USA',
  arrivalDate: '2024-01-15T00:00:00Z',
  departureDate: '2024-01-22T23:59:59Z'
});

console.log('Wallet Address:', tourist.walletAddress);
console.log('Transaction Hash:', tourist.transactionHash);
```

### Issue Daily Coins

Issue the daily allocation of 10 smile coins to a registered tourist.

```typescript
try {
  const issuance = await sdk.issueDailyCoins('tourist-123');
  
  console.log('Coins issued:', issuance.amount);
  console.log('Expiration date:', issuance.expirationDate);
  console.log('Transaction hash:', issuance.transactionHash);
} catch (error) {
  if (error.code === 'TOURIST_NOT_REGISTERED') {
    console.log('Tourist needs to be registered first');
  }
}
```

### Get Tourist Balance

Retrieve a tourist's current balance and transaction history.

```typescript
const balance = await sdk.getTouristBalance('tourist-123');

console.log('Current balance:', balance.balance);
console.log('Wallet address:', balance.walletAddress);
console.log('Recent transactions:', balance.transactions);
```

### Get Tourist Transactions

Get detailed transaction history for a tourist.

```typescript
const transactions = await sdk.getTouristTransactions('tourist-123', 20, 0);

transactions.forEach(tx => {
  console.log(`${tx.type}: ${tx.amount} coins - ${tx.status}`);
});
```

## Restaurant Operations

### Register Restaurant

Register a new restaurant in the system using their Google Place ID.

```typescript
const restaurant = await sdk.registerRestaurant({
  googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  name: 'Amazing Local Restaurant',
  address: '123 Main Street, City, Country'
});

console.log('Restaurant wallet:', restaurant.walletAddress);
console.log('QR Code data:', restaurant.qrCode);
```

### Transfer Coins to Restaurant

Transfer smile coins from a tourist to a restaurant (max 3 per day per restaurant).

```typescript
try {
  const transfer = await sdk.transferCoins({
    touristId: 'tourist-123',
    restaurantId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    amount: 3
  });
  
  console.log('Transfer successful:', transfer.transactionHash);
  console.log('Remaining daily limit:', transfer.remainingDailyLimit);
} catch (error) {
  if (error.code === 'DAILY_LIMIT_EXCEEDED') {
    console.log('Daily transfer limit reached for this restaurant');
  } else if (error.code === 'INSUFFICIENT_BALANCE') {
    console.log('Tourist does not have enough coins');
  }
}
```

### Get Restaurant Earnings

Retrieve detailed earnings information for a restaurant.

```typescript
const earnings = await sdk.getRestaurantEarnings('ChIJN1t_tDeuEmsRUsoyG83frY4');

console.log('Total coins received:', earnings.totalCoins);

// Daily breakdown
earnings.dailyBreakdown.forEach(day => {
  console.log(`${day.date}: ${day.totalCoins} coins from ${day.touristCount} tourists`);
});

// Origin country breakdown
earnings.originBreakdown.forEach(origin => {
  console.log(`${origin.country}: ${origin.totalCoins} coins (${origin.percentage}%)`);
});
```

## Blockchain Operations

### Get Transaction Status

Check the status of any blockchain transaction.

```typescript
const status = await sdk.getTransactionStatus('0x1234567890abcdef...');

console.log('Status:', status.status); // 'pending', 'confirmed', or 'failed'
console.log('Block number:', status.blockNumber);
console.log('Explorer URL:', status.explorerUrl);
```

### Get Network Status

Check the current blockchain network health and status.

```typescript
const network = await sdk.getNetworkStatus();

console.log('Network:', network.network);
console.log('Current block:', network.blockNumber);
console.log('Gas price:', network.gasPrice);
console.log('Healthy:', network.isHealthy);
```

### Wait for Transaction Confirmation

Wait for a transaction to be confirmed on the blockchain.

```typescript
try {
  const finalStatus = await sdk.waitForTransaction(
    '0x1234567890abcdef...',
    300000, // 5 minutes max wait
    5000    // Check every 5 seconds
  );
  
  if (finalStatus.status === 'confirmed') {
    console.log('Transaction confirmed in block:', finalStatus.blockNumber);
  } else {
    console.log('Transaction failed');
  }
} catch (error) {
  if (error.code === 'TIMEOUT_ERROR') {
    console.log('Transaction confirmation timed out');
  }
}
```

## Complete Workflow Examples

### Tourist Daily Routine

```typescript
async function dailyTouristFlow(touristId: string) {
  try {
    // Issue daily coins
    const issuance = await sdk.issueDailyCoins(touristId);
    console.log(`Issued ${issuance.amount} coins to ${touristId}`);
    
    // Wait for confirmation
    await sdk.waitForTransaction(issuance.transactionHash);
    
    // Check balance
    const balance = await sdk.getTouristBalance(touristId);
    console.log(`Tourist now has ${balance.balance} coins`);
    
    return balance;
  } catch (error) {
    console.error('Daily flow error:', error.message);
    throw error;
  }
}
```

### Restaurant Coin Collection

```typescript
async function restaurantCoinCollection(touristId: string, restaurantId: string, amount: number) {
  try {
    // Transfer coins
    const transfer = await sdk.transferCoins({
      touristId,
      restaurantId,
      amount
    });
    
    console.log('Transfer initiated:', transfer.transactionHash);
    
    // Wait for confirmation
    const status = await sdk.waitForTransaction(transfer.transactionHash);
    
    if (status.status === 'confirmed') {
      // Get updated restaurant earnings
      const earnings = await sdk.getRestaurantEarnings(restaurantId);
      console.log(`Restaurant now has ${earnings.totalCoins} total coins`);
      
      return earnings;
    } else {
      throw new Error('Transfer failed');
    }
  } catch (error) {
    console.error('Collection error:', error.message);
    throw error;
  }
}
```

### Complete Tourist Journey

```typescript
async function completeTouristJourney() {
  const touristId = 'tourist-' + Date.now();
  const restaurantId = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
  
  try {
    // 1. Register tourist
    console.log('Registering tourist...');
    const tourist = await sdk.registerTourist({
      touristId,
      originCountry: 'USA',
      arrivalDate: new Date().toISOString(),
      departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
    console.log('Tourist registered with wallet:', tourist.walletAddress);
    
    // 2. Issue daily coins
    console.log('Issuing daily coins...');
    const issuance = await sdk.issueDailyCoins(touristId);
    await sdk.waitForTransaction(issuance.transactionHash);
    console.log('Daily coins issued successfully');
    
    // 3. Transfer coins to restaurant
    console.log('Transferring coins to restaurant...');
    const transfer = await sdk.transferCoins({
      touristId,
      restaurantId,
      amount: 3
    });
    await sdk.waitForTransaction(transfer.transactionHash);
    console.log('Coins transferred successfully');
    
    // 4. Check final balances
    const touristBalance = await sdk.getTouristBalance(touristId);
    const restaurantEarnings = await sdk.getRestaurantEarnings(restaurantId);
    
    console.log('Final tourist balance:', touristBalance.balance);
    console.log('Restaurant total earnings:', restaurantEarnings.totalCoins);
    
  } catch (error) {
    console.error('Journey failed:', error.message);
    throw error;
  }
}
```

## Error Handling

The SDK provides specific error codes for different scenarios:

```typescript
import { SDKError, SDKErrorCode } from '@smilecoin/sdk';

try {
  await sdk.transferCoins({
    touristId: 'tourist-123',
    restaurantId: 'restaurant-456',
    amount: 5 // Too many coins
  });
} catch (error) {
  if (error instanceof SDKError) {
    switch (error.code) {
      case SDKErrorCode.DAILY_LIMIT_EXCEEDED:
        console.log('Cannot transfer more than 3 coins per restaurant per day');
        break;
      case SDKErrorCode.INSUFFICIENT_BALANCE:
        console.log('Tourist does not have enough coins');
        break;
      case SDKErrorCode.TOURIST_NOT_REGISTERED:
        console.log('Tourist must be registered first');
        break;
      case SDKErrorCode.RESTAURANT_NOT_REGISTERED:
        console.log('Restaurant must be registered first');
        break;
      case SDKErrorCode.NETWORK_ERROR:
        console.log('Network connection issue');
        break;
      case SDKErrorCode.AUTHENTICATION_ERROR:
        console.log('Invalid API key');
        break;
      default:
        console.log('Unknown error:', error.message);
    }
  }
}
```

## Available Error Codes

- `NETWORK_ERROR` - Network connectivity issues
- `AUTHENTICATION_ERROR` - Invalid API key or authentication failure
- `VALIDATION_ERROR` - Invalid input parameters
- `API_ERROR` - General API errors
- `TIMEOUT_ERROR` - Request or operation timeout
- `INSUFFICIENT_BALANCE` - Not enough coins for transfer
- `DAILY_LIMIT_EXCEEDED` - Daily transfer limit reached
- `TOURIST_NOT_REGISTERED` - Tourist not found in system
- `RESTAURANT_NOT_REGISTERED` - Restaurant not found in system

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import { 
  SmileCoinSDK, 
  TouristRegistration, 
  RestaurantRegistration,
  CoinTransfer,
  SDKError,
  SDKErrorCode 
} from '@smilecoin/sdk';

// All methods are fully typed
const sdk = new SmileCoinSDK({ apiUrl: '...', apiKey: '...' });
const balance: TouristBalance = await sdk.getTouristBalance('tourist-123');
```

## Support

For support and questions:
- Documentation: [https://docs.smilecoin.example.com](https://docs.smilecoin.example.com)
- Issues: [https://github.com/smilecoin/sdk/issues](https://github.com/smilecoin/sdk/issues)
- Email: support@smilecoin.example.com

## License

MIT License - see LICENSE file for details.