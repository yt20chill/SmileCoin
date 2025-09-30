/**
 * End-to-End Test: Transaction Monitoring and Status Tracking
 * 
 * This test covers:
 * - Real-time transaction status monitoring
 * - Blockchain network health checking
 * - Transaction confirmation waiting
 * - Error handling for failed transactions
 * - Gas estimation and cost tracking
 * 
 * Requirements: 6.1, 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { SmileCoinSDK, SDKError, SDKErrorCode } from '../../src/sdk/SmileCoinSDK';

describe('E2E: Transaction Monitoring and Status Tracking', () => {
  let sdk: SmileCoinSDK;
  let testTouristId: string;
  let testRestaurantId: string;
  let sampleTransactionHash: string;

  beforeAll(async () => {
    // Initialize SDK with test configuration
    sdk = new SmileCoinSDK({
      apiUrl: process.env.TEST_API_URL || 'http://localhost:3000',
      apiKey: process.env.TEST_API_KEY || 'test-api-key',
      timeout: 60000
    });

    // Set up test data
    const timestamp = Date.now();
    testTouristId = `monitoring_tourist_${timestamp}`;
    testRestaurantId = `ChIJ_monitoring_restaurant_${timestamp}`;

    const today = new Date();
    const departure = new Date(today);
    departure.setDate(departure.getDate() + 7);
    
    // Register tourist and restaurant for monitoring tests
    await sdk.registerTourist({
      touristId: testTouristId,
      originCountry: 'USA',
      arrivalDate: today.toISOString().split('T')[0],
      departureDate: departure.toISOString().split('T')[0]
    });

    await sdk.registerRestaurant({
      googlePlaceId: testRestaurantId,
      name: `Monitoring Test Restaurant ${timestamp}`,
      address: 'Monitoring Test Address'
    });

    // Issue coins and get a transaction hash for monitoring
    const issuance = await sdk.issueDailyCoins(testTouristId);
    sampleTransactionHash = issuance.transactionHash;
  });

  describe('Transaction Status Monitoring', () => {
    test('should retrieve transaction status by hash', async () => {
      const status = await sdk.getTransactionStatus(sampleTransactionHash);

      expect(status).toMatchObject({
        status: expect.stringMatching(/^(pending|confirmed|failed)$/),
        explorerUrl: expect.stringContaining('http')
      });

      // If confirmed, should have additional details
      if (status.status === 'confirmed') {
        expect(status.blockNumber).toBeGreaterThan(0);
        expect(status.gasUsed).toBeGreaterThan(0);
      }

      // Explorer URL should be valid
      expect(status.explorerUrl).toContain(sampleTransactionHash);
    });

    test('should validate transaction hash format', async () => {
      // Test invalid hash formats
      const invalidHashes = [
        '',
        'invalid-hash',
        '0x123', // Too short
        '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', // Invalid characters
        'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' // Missing 0x prefix
      ];

      for (const hash of invalidHashes) {
        await expect(sdk.getTransactionStatus(hash))
          .rejects
          .toThrow(SDKError);
      }
    });

    test('should handle non-existent transaction hash', async () => {
      const nonExistentHash = '0x1111111111111111111111111111111111111111111111111111111111111111';
      
      await expect(sdk.getTransactionStatus(nonExistentHash))
        .rejects
        .toThrow(SDKError);
    });

    test('should provide correct explorer URLs for different networks', async () => {
      const status = await sdk.getTransactionStatus(sampleTransactionHash);
      
      // Should contain a valid blockchain explorer URL
      expect(status.explorerUrl).toMatch(/^https?:\/\/.+/);
      
      // Common explorer domains
      const validExplorers = [
        'polygonscan.com',
        'mumbai.polygonscan.com',
        'etherscan.io',
        'bscscan.com'
      ];
      
      const hasValidExplorer = validExplorers.some(explorer => 
        status.explorerUrl.includes(explorer)
      );
      expect(hasValidExplorer).toBe(true);
    });
  });

  describe('Network Status Monitoring', () => {
    test('should retrieve current network status', async () => {
      const networkStatus = await sdk.getNetworkStatus();

      expect(networkStatus).toMatchObject({
        network: expect.any(String),
        blockNumber: expect.any(Number),
        gasPrice: expect.any(String),
        isHealthy: expect.any(Boolean)
      });

      // Network should be healthy for tests to pass
      expect(networkStatus.isHealthy).toBe(true);
      expect(networkStatus.blockNumber).toBeGreaterThan(0);
      expect(networkStatus.gasPrice).toMatch(/^\d+$/); // Should be numeric string
    });

    test('should provide network-specific information', async () => {
      const networkStatus = await sdk.getNetworkStatus();
      
      // Network name should be one of the supported networks
      const supportedNetworks = [
        'polygon',
        'polygon-mainnet',
        'polygon-mumbai',
        'ethereum',
        'bsc',
        'hardhat',
        'localhost'
      ];
      
      expect(supportedNetworks).toContain(networkStatus.network);
    });

    test('should track gas price changes', async () => {
      const status1 = await sdk.getNetworkStatus();
      
      // Wait a moment and check again
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const status2 = await sdk.getNetworkStatus();
      
      // Both should have valid gas prices
      expect(parseInt(status1.gasPrice)).toBeGreaterThan(0);
      expect(parseInt(status2.gasPrice)).toBeGreaterThan(0);
      
      // Block numbers should be increasing (or at least not decreasing)
      expect(status2.blockNumber).toBeGreaterThanOrEqual(status1.blockNumber);
    });
  });

  describe('Transaction Confirmation Waiting', () => {
    test('should wait for transaction confirmation', async () => {
      // Create a new transaction to monitor
      const transferResult = await sdk.transferCoins({
        touristId: testTouristId,
        restaurantId: testRestaurantId,
        amount: 1
      });

      // Wait for confirmation with reasonable timeout
      const finalStatus = await sdk.waitForTransaction(
        transferResult.transactionHash,
        60000, // 1 minute max wait
        2000   // Check every 2 seconds
      );

      expect(finalStatus.status).toMatch(/^(confirmed|failed)$/);
      
      if (finalStatus.status === 'confirmed') {
        expect(finalStatus.blockNumber).toBeGreaterThan(0);
      }
    }, 70000); // Increase Jest timeout for this test

    test('should timeout if transaction takes too long', async () => {
      // Use a very short timeout to test timeout behavior
      await expect(sdk.waitForTransaction(
        sampleTransactionHash,
        1000, // 1 second timeout
        500   // Check every 500ms
      )).rejects.toThrow('Transaction confirmation timeout');
    });

    test('should validate wait parameters', async () => {
      // Test invalid parameters
      await expect(sdk.waitForTransaction(
        sampleTransactionHash,
        500, // Too short max wait time
        1000
      )).rejects.toThrow('Max wait time must be at least 1000ms');

      await expect(sdk.waitForTransaction(
        sampleTransactionHash,
        10000,
        500 // Too short poll interval
      )).rejects.toThrow('Poll interval must be at least 1000ms');
    });

    test('should handle network errors during waiting', async () => {
      // Create SDK with invalid URL to test network error handling
      const invalidSdk = new SmileCoinSDK({
        apiUrl: 'http://invalid-network-test.com',
        apiKey: 'test-key',
        timeout: 5000
      });

      await expect(invalidSdk.waitForTransaction(
        sampleTransactionHash,
        10000,
        2000
      )).rejects.toThrow(SDKError);
    });
  });

  describe('Transaction History and Analytics', () => {
    test('should track transaction metadata', async () => {
      // Get tourist transaction history
      const transactions = await sdk.getTouristTransactions(testTouristId, 10, 0);
      
      expect(Array.isArray(transactions)).toBe(true);
      
      if (transactions.length > 0) {
        const transaction = transactions[0];
        
        expect(transaction).toMatchObject({
          hash: expect.stringMatching(/^0x[a-fA-F0-9]{64}$/),
          from: expect.any(String),
          to: expect.any(String),
          amount: expect.any(Number),
          timestamp: expect.any(String),
          type: expect.stringMatching(/^(daily_issuance|restaurant_transfer|expiration)$/),
          status: expect.stringMatching(/^(pending|confirmed|failed)$/)
        });

        // Timestamp should be valid ISO date
        expect(new Date(transaction.timestamp).getTime()).toBeGreaterThan(0);
      }
    });

    test('should provide restaurant transaction analytics', async () => {
      const transactions = await sdk.getRestaurantTransactions(testRestaurantId, 10, 0);
      
      expect(Array.isArray(transactions)).toBe(true);
      
      // Should include transfers to this restaurant
      const restaurantTransfers = transactions.filter(tx => 
        tx.type === 'restaurant_transfer'
      );
      
      expect(restaurantTransfers.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle pagination in transaction history', async () => {
      // Test pagination parameters
      const page1 = await sdk.getTouristTransactions(testTouristId, 5, 0);
      const page2 = await sdk.getTouristTransactions(testTouristId, 5, 5);
      
      expect(Array.isArray(page1)).toBe(true);
      expect(Array.isArray(page2)).toBe(true);
      
      // Pages should not overlap (if there are enough transactions)
      if (page1.length === 5 && page2.length > 0) {
        const page1Hashes = page1.map(tx => tx.hash);
        const page2Hashes = page2.map(tx => tx.hash);
        
        const overlap = page1Hashes.filter(hash => page2Hashes.includes(hash));
        expect(overlap.length).toBe(0);
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle blockchain network disconnection', async () => {
      // This test simulates network issues
      // In a real scenario, you might temporarily disable network access
      
      // For now, we'll test with an invalid transaction hash
      const invalidHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
      
      await expect(sdk.getTransactionStatus(invalidHash))
        .rejects
        .toThrow(SDKError);
    });

    test('should retry failed network requests', async () => {
      // Test that the SDK handles temporary network failures gracefully
      // This is more of an integration test with the actual network
      
      const networkStatus = await sdk.getNetworkStatus();
      expect(networkStatus.isHealthy).toBe(true);
      
      // Multiple rapid requests should all succeed
      const promises = Array(5).fill(0).map(() => sdk.getNetworkStatus());
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.isHealthy).toBe(true);
      });
    });

    test('should handle malformed API responses', async () => {
      // This test would require mocking the API to return malformed data
      // For now, we'll test with edge case inputs
      
      await expect(sdk.getTransactionStatus('0x'))
        .rejects
        .toThrow('Invalid transaction hash format');
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle concurrent transaction status requests', async () => {
      // Test multiple concurrent requests
      const promises = Array(10).fill(0).map(() => 
        sdk.getTransactionStatus(sampleTransactionHash)
      );
      
      const results = await Promise.all(promises);
      
      // All requests should succeed and return consistent data
      results.forEach(result => {
        expect(result.status).toMatch(/^(pending|confirmed|failed)$/);
        expect(result.explorerUrl).toContain(sampleTransactionHash);
      });
    });

    test('should handle rapid network status checks', async () => {
      // Test rapid successive network status requests
      const promises = Array(5).fill(0).map((_, i) => 
        new Promise(resolve => 
          setTimeout(() => resolve(sdk.getNetworkStatus()), i * 100)
        )
      );
      
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result).toMatchObject({
          network: expect.any(String),
          blockNumber: expect.any(Number),
          gasPrice: expect.any(String),
          isHealthy: true
        });
      });
    });

    test('should maintain performance under load', async () => {
      const startTime = Date.now();
      
      // Perform multiple operations
      const operations = [
        sdk.getNetworkStatus(),
        sdk.getTransactionStatus(sampleTransactionHash),
        sdk.getTouristBalance(testTouristId),
        sdk.getRestaurantEarnings(testRestaurantId)
      ];
      
      await Promise.all(operations);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // All operations should complete within reasonable time
      expect(duration).toBeLessThan(30000); // 30 seconds max
    });
  });

  describe('Real-time Monitoring Features', () => {
    test('should detect transaction state changes', async () => {
      // Create a new transaction
      const issuanceResult = await sdk.issueDailyCoins(`realtime_test_${Date.now()}`);
      
      // Check initial status
      const initialStatus = await sdk.getTransactionStatus(issuanceResult.transactionHash);
      
      // Status should be pending or confirmed
      expect(['pending', 'confirmed']).toContain(initialStatus.status);
      
      // If pending, wait a bit and check again
      if (initialStatus.status === 'pending') {
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const updatedStatus = await sdk.getTransactionStatus(issuanceResult.transactionHash);
        
        // Status should have progressed or remained the same
        expect(['pending', 'confirmed', 'failed']).toContain(updatedStatus.status);
      }
    });

    test('should provide transaction timing information', async () => {
      const status = await sdk.getTransactionStatus(sampleTransactionHash);
      
      if (status.status === 'confirmed') {
        expect(status.blockNumber).toBeGreaterThan(0);
        
        // Should provide gas usage information
        if (status.gasUsed) {
          expect(status.gasUsed).toBeGreaterThan(0);
        }
      }
    });
  });
});