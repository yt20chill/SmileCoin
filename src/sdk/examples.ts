/**
 * SmileCoin SDK Usage Examples
 * 
 * This file contains comprehensive examples of how to use the SmileCoin SDK
 * for common tourist rewards workflows.
 */

import { SmileCoinSDK, SDKError, SDKErrorCode } from './SmileCoinSDK';

// Initialize SDK
const sdk = new SmileCoinSDK({
  apiUrl: process.env.SMILECOIN_API_URL || 'http://localhost:3000',
  apiKey: process.env.SMILECOIN_API_KEY || 'your-api-key'
});

/**
 * Example 1: Basic Tourist Registration and Daily Coins
 */
async function basicTouristFlow() {
  console.log('=== Basic Tourist Flow ===');
  
  const touristId = `tourist-${Date.now()}`;
  
  try {
    // Step 1: Register tourist
    console.log('1. Registering tourist...');
    const tourist = await sdk.registerTourist({
      touristId,
      originCountry: 'USA',
      arrivalDate: '2024-01-15T00:00:00Z',
      departureDate: '2024-01-22T23:59:59Z'
    });
    
    console.log(`✅ Tourist registered with wallet: ${tourist.walletAddress}`);
    console.log(`   Transaction: ${tourist.transactionHash}`);
    
    // Step 2: Issue daily coins
    console.log('2. Issuing daily coins...');
    const issuance = await sdk.issueDailyCoins(touristId);
    
    console.log(`✅ Issued ${issuance.amount} coins`);
    console.log(`   Expires: ${issuance.expirationDate}`);
    console.log(`   Transaction: ${issuance.transactionHash}`);
    
    // Step 3: Check balance
    console.log('3. Checking balance...');
    const balance = await sdk.getTouristBalance(touristId);
    
    console.log(`✅ Current balance: ${balance.balance} coins`);
    console.log(`   Wallet: ${balance.walletAddress}`);
    console.log(`   Transactions: ${balance.transactions.length}`);
    
    return { touristId, balance };
    
  } catch (error: any) {
    console.error('❌ Basic tourist flow failed:', error.message);
    throw error;
  }
}

/**
 * Example 2: Restaurant Registration and Coin Collection
 */
async function restaurantRegistrationFlow() {
  console.log('=== Restaurant Registration Flow ===');
  
  const restaurantData = {
    googlePlaceId: `place_${Date.now()}`,
    name: 'Amazing Local Restaurant',
    address: '123 Main Street, Tourist City'
  };
  
  try {
    // Step 1: Register restaurant
    console.log('1. Registering restaurant...');
    const restaurant = await sdk.registerRestaurant(restaurantData);
    
    console.log(`✅ Restaurant registered with wallet: ${restaurant.walletAddress}`);
    console.log(`   QR Code: ${restaurant.qrCode}`);
    console.log(`   Transaction: ${restaurant.transactionHash}`);
    
    // Step 2: Check initial earnings (should be 0)
    console.log('2. Checking initial earnings...');
    const earnings = await sdk.getRestaurantEarnings(restaurantData.googlePlaceId);
    
    console.log(`✅ Initial earnings: ${earnings.totalCoins} coins`);
    console.log(`   Daily breakdown entries: ${earnings.dailyBreakdown.length}`);
    console.log(`   Origin breakdown entries: ${earnings.originBreakdown.length}`);
    
    return { restaurantId: restaurantData.googlePlaceId, restaurant };
    
  } catch (error: any) {
    console.error('❌ Restaurant registration failed:', error.message);
    throw error;
  }
}

/**
 * Example 3: Complete Coin Transfer Workflow
 */
async function coinTransferWorkflow() {
  console.log('=== Coin Transfer Workflow ===');
  
  const touristId = `tourist-${Date.now()}`;
  const restaurantId = `place-${Date.now()}`;
  
  try {
    // Step 1: Set up tourist and restaurant
    console.log('1. Setting up tourist and restaurant...');
    
    const [tourist, restaurant] = await Promise.all([
      sdk.registerTourist({
        touristId,
        originCountry: 'Canada',
        arrivalDate: new Date().toISOString(),
        departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }),
      sdk.registerRestaurant({
        googlePlaceId: restaurantId,
        name: 'Cozy Corner Cafe',
        address: '456 Tourist Avenue'
      })
    ]);
    
    console.log('✅ Both tourist and restaurant registered');
    
    // Step 2: Issue coins to tourist
    console.log('2. Issuing daily coins to tourist...');
    const issuance = await sdk.issueDailyCoins(touristId);
    
    // Wait for transaction confirmation
    console.log('3. Waiting for coin issuance confirmation...');
    await sdk.waitForTransaction(issuance.transactionHash, 60000, 2000);
    console.log('✅ Coins issued and confirmed');
    
    // Step 3: Transfer coins to restaurant
    console.log('4. Transferring coins to restaurant...');
    const transfer = await sdk.transferCoins({
      touristId,
      restaurantId,
      amount: 3
    });
    
    console.log(`✅ Transfer initiated: ${transfer.transactionHash}`);
    console.log(`   Remaining daily limit: ${transfer.remainingDailyLimit}`);
    
    // Step 4: Wait for transfer confirmation
    console.log('5. Waiting for transfer confirmation...');
    const transferStatus = await sdk.waitForTransaction(transfer.transactionHash);
    
    if (transferStatus.status === 'confirmed') {
      console.log('✅ Transfer confirmed');
      
      // Step 5: Check final balances
      console.log('6. Checking final balances...');
      const [touristBalance, restaurantEarnings] = await Promise.all([
        sdk.getTouristBalance(touristId),
        sdk.getRestaurantEarnings(restaurantId)
      ]);
      
      console.log(`✅ Tourist final balance: ${touristBalance.balance} coins`);
      console.log(`✅ Restaurant total earnings: ${restaurantEarnings.totalCoins} coins`);
      
      return {
        touristId,
        restaurantId,
        touristBalance: touristBalance.balance,
        restaurantEarnings: restaurantEarnings.totalCoins
      };
    } else {
      throw new Error('Transfer failed to confirm');
    }
    
  } catch (error: any) {
    console.error('❌ Coin transfer workflow failed:', error.message);
    throw error;
  }
}

/**
 * Example 4: Error Handling Scenarios
 */
async function errorHandlingExamples() {
  console.log('=== Error Handling Examples ===');
  
  try {
    // Example 1: Invalid tourist registration
    console.log('1. Testing invalid tourist registration...');
    try {
      await sdk.registerTourist({
        touristId: '', // Invalid empty ID
        originCountry: 'USA',
        arrivalDate: '2024-01-15',
        departureDate: '2024-01-22'
      });
    } catch (error) {
      if (error instanceof SDKError && error.code === SDKErrorCode.VALIDATION_ERROR) {
        console.log('✅ Correctly caught validation error:', error.message);
      }
    }
    
    // Example 2: Daily coins for unregistered tourist
    console.log('2. Testing daily coins for unregistered tourist...');
    try {
      await sdk.issueDailyCoins('non-existent-tourist');
    } catch (error) {
      if (error instanceof SDKError && error.code === SDKErrorCode.TOURIST_NOT_REGISTERED) {
        console.log('✅ Correctly caught tourist not registered error:', error.message);
      }
    }
    
    // Example 3: Excessive coin transfer
    console.log('3. Testing excessive coin transfer...');
    try {
      await sdk.transferCoins({
        touristId: 'some-tourist',
        restaurantId: 'some-restaurant',
        amount: 5 // More than daily limit of 3
      });
    } catch (error) {
      if (error instanceof SDKError && error.code === SDKErrorCode.VALIDATION_ERROR) {
        console.log('✅ Correctly caught excessive transfer error:', error.message);
      }
    }
    
    // Example 4: Invalid transaction hash
    console.log('4. Testing invalid transaction hash...');
    try {
      await sdk.getTransactionStatus('invalid-hash');
    } catch (error) {
      if (error instanceof SDKError && error.code === SDKErrorCode.VALIDATION_ERROR) {
        console.log('✅ Correctly caught invalid hash error:', error.message);
      }
    }
    
    console.log('✅ All error handling tests passed');
    
  } catch (error: any) {
    console.error('❌ Error handling examples failed:', error.message);
    throw error;
  }
}

/**
 * Example 5: Monitoring and Analytics
 */
async function monitoringExample() {
  console.log('=== Monitoring and Analytics Example ===');
  
  const touristId = `tourist-${Date.now()}`;
  
  try {
    // Step 1: Register and set up tourist
    console.log('1. Setting up tourist...');
    await sdk.registerTourist({
      touristId,
      originCountry: 'UK',
      arrivalDate: new Date().toISOString(),
      departureDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    });
    
    const issuance = await sdk.issueDailyCoins(touristId);
    await sdk.waitForTransaction(issuance.transactionHash);
    
    // Step 2: Get detailed transaction history
    console.log('2. Getting transaction history...');
    const transactions = await sdk.getTouristTransactions(touristId, 10, 0);
    
    console.log(`✅ Found ${transactions.length} transactions`);
    transactions.forEach((tx, index) => {
      console.log(`   ${index + 1}. ${tx.type}: ${tx.amount} coins (${tx.status})`);
      console.log(`      Hash: ${tx.hash}`);
      console.log(`      Time: ${tx.timestamp}`);
    });
    
    // Step 3: Check network status
    console.log('3. Checking network status...');
    const networkStatus = await sdk.getNetworkStatus();
    
    console.log(`✅ Network: ${networkStatus.network}`);
    console.log(`   Block: ${networkStatus.blockNumber}`);
    console.log(`   Gas Price: ${networkStatus.gasPrice}`);
    console.log(`   Healthy: ${networkStatus.isHealthy}`);
    
    // Step 4: Monitor a specific transaction
    console.log('4. Monitoring transaction status...');
    const txStatus = await sdk.getTransactionStatus(issuance.transactionHash);
    
    console.log(`✅ Transaction Status: ${txStatus.status}`);
    console.log(`   Block: ${txStatus.blockNumber}`);
    console.log(`   Gas Used: ${txStatus.gasUsed}`);
    console.log(`   Explorer: ${txStatus.explorerUrl}`);
    
    return {
      touristId,
      transactionCount: transactions.length,
      networkStatus,
      lastTransactionStatus: txStatus
    };
    
  } catch (error: any) {
    console.error('❌ Monitoring example failed:', error.message);
    throw error;
  }
}

/**
 * Example 6: Batch Operations
 */
async function batchOperationsExample() {
  console.log('=== Batch Operations Example ===');
  
  const touristIds = [
    `tourist-batch-${Date.now()}-1`,
    `tourist-batch-${Date.now()}-2`,
    `tourist-batch-${Date.now()}-3`
  ];
  
  try {
    // Step 1: Register multiple tourists in parallel
    console.log('1. Registering multiple tourists...');
    const registrations = await Promise.all(
      touristIds.map(id => 
        sdk.registerTourist({
          touristId: id,
          originCountry: ['USA', 'Canada', 'UK'][Math.floor(Math.random() * 3)],
          arrivalDate: new Date().toISOString(),
          departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
      )
    );
    
    console.log(`✅ Registered ${registrations.length} tourists`);
    
    // Step 2: Issue daily coins to all tourists
    console.log('2. Issuing daily coins to all tourists...');
    const issuances = await Promise.all(
      touristIds.map(id => sdk.issueDailyCoins(id))
    );
    
    console.log(`✅ Issued coins to ${issuances.length} tourists`);
    
    // Step 3: Wait for all transactions to confirm
    console.log('3. Waiting for all transactions to confirm...');
    const confirmations = await Promise.all(
      issuances.map(issuance => 
        sdk.waitForTransaction(issuance.transactionHash, 60000, 2000)
      )
    );
    
    const confirmedCount = confirmations.filter(c => c.status === 'confirmed').length;
    console.log(`✅ ${confirmedCount}/${confirmations.length} transactions confirmed`);
    
    // Step 4: Get all balances
    console.log('4. Getting all tourist balances...');
    const balances = await Promise.all(
      touristIds.map(id => sdk.getTouristBalance(id))
    );
    
    const totalBalance = balances.reduce((sum, b) => sum + b.balance, 0);
    console.log(`✅ Total balance across all tourists: ${totalBalance} coins`);
    
    return {
      touristCount: touristIds.length,
      confirmedTransactions: confirmedCount,
      totalBalance
    };
    
  } catch (error: any) {
    console.error('❌ Batch operations failed:', error.message);
    throw error;
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('🚀 Running all SmileCoin SDK examples...\n');
  
  try {
    const results = {
      basicFlow: await basicTouristFlow(),
      restaurantFlow: await restaurantRegistrationFlow(),
      transferFlow: await coinTransferWorkflow(),
      errorHandling: await errorHandlingExamples(),
      monitoring: await monitoringExample(),
      batchOps: await batchOperationsExample()
    };
    
    console.log('\n✅ All examples completed successfully!');
    console.log('Results summary:', JSON.stringify(results, null, 2));
    
    return results;
    
  } catch (error: any) {
    console.error('\n❌ Examples failed:', error.message);
    throw error;
  }
}

// Export individual examples for selective testing
export {
  basicTouristFlow,
  restaurantRegistrationFlow,
  coinTransferWorkflow,
  errorHandlingExamples,
  monitoringExample,
  batchOperationsExample
};

// If running this file directly, run all examples
if (require.main === module) {
  runAllExamples()
    .then(() => {
      console.log('🎉 All examples completed!');
      process.exit(0);
    })
    .catch((error: any) => {
      console.error('💥 Examples failed:', error);
      process.exit(1);
    });
}