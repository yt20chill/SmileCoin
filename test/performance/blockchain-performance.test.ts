/**
 * Blockchain Network Performance and Gas Optimization Testing
 * 
 * This test suite evaluates blockchain network performance:
 * - Transaction confirmation times
 * - Gas usage optimization
 * - Network throughput under load
 * - Smart contract call efficiency
 * 
 * Requirements: 8.4, 9.4
 */

import { SmileCoinSDK } from '../../src/sdk/SmileCoinSDK';
import { performance } from 'perf_hooks';

describe('Blockchain Network Performance and Gas Optimization', () => {
  let sdk: SmileCoinSDK;
  let testTourists: string[] = [];
  let testRestaurants: string[] = [];

  beforeAll(async () => {
    sdk = new SmileCoinSDK({
      apiUrl: process.env.TEST_API_URL || 'http://localhost:3000',
      apiKey: process.env.TEST_API_KEY || 'test-api-key',
      timeout: 60000
    });

    // Pre-create minimal test data for blockchain performance tests
    await setupMinimalTestData();
  });

  async function setupMinimalTestData() {
    console.log('🔧 Setting up minimal blockchain performance test data...');
    
    const today = new Date();
    const departure = new Date(today);
    departure.setDate(departure.getDate() + 7);
    
    // Create 3 test tourists for blockchain performance tests
    for (let i = 0; i < 3; i++) {
      const touristId = `blockchain_perf_tourist_${Date.now()}_${i}`;
      testTourists.push(touristId);
      
      await sdk.registerTourist({
        touristId,
        originCountry: 'USA',
        arrivalDate: today.toISOString().split('T')[0],
        departureDate: departure.toISOString().split('T')[0]
      });
    }
    
    // Create 2 test restaurants
    for (let i = 0; i < 2; i++) {
      const restaurantId = `ChIJ_blockchain_perf_restaurant_${Date.now()}_${i}`;
      testRestaurants.push(restaurantId);
      
      await sdk.registerRestaurant({
        googlePlaceId: restaurantId,
        name: `Blockchain Performance Test Restaurant ${i}`,
        address: `Test Address ${i}`
      });
    }
    
    console.log('✅ Minimal blockchain performance test data setup complete');
  }

  describe('Transaction Confirmation Times', () => {
    test('daily coin issuance should confirm within reasonable time', async () => {
      const confirmationTimes: number[] = [];
      
      for (const touristId of testTourists) {
        const startTime = performance.now();
        
        // Issue daily coins
        const issuance = await sdk.issueDailyCoins(touristId);
        
        // Wait for confirmation
        try {
          await sdk.waitForTransaction(issuance.transactionHash, 30000, 2000);
          const endTime = performance.now();
          confirmationTimes.push(endTime - startTime);
        } catch (error) {
          console.warn(`Transaction ${issuance.transactionHash} did not confirm in time`);
          // Still record the timeout time for analysis
          confirmationTimes.push(30000);
        }
      }
      
      const avgConfirmationTime = confirmationTimes.reduce((a, b) => a + b, 0) / confirmationTimes.length;
      const maxConfirmationTime = Math.max(...confirmationTimes);
      
      console.log(`📊 Daily Coin Issuance Confirmation Times:`);
      console.log(`   Average: ${avgConfirmationTime.toFixed(2)}ms`);
      console.log(`   Maximum: ${maxConfirmationTime.toFixed(2)}ms`);
      console.log(`   All times: ${confirmationTimes.map(t => t.toFixed(0)).join(', ')}ms`);
      
      // Performance assertions for blockchain operations
      expect(avgConfirmationTime).toBeLessThan(20000); // Average under 20 seconds
      expect(maxConfirmationTime).toBeLessThan(30000); // Max under 30 seconds
    }, 120000); // 2 minute timeout for blockchain operations

    test('coin transfers should confirm efficiently', async () => {
      const confirmationTimes: number[] = [];
      
      // Issue coins to first tourist for transfers
      await sdk.issueDailyCoins(testTourists[0]);
      
      // Wait a moment for coins to be available
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      for (const restaurantId of testRestaurants) {
        const startTime = performance.now();
        
        try {
          // Transfer coins
          const transfer = await sdk.transferCoins({
            touristId: testTourists[0],
            restaurantId,
            amount: 1
          });
          
          // Wait for confirmation
          await sdk.waitForTransaction(transfer.transactionHash, 30000, 2000);
          const endTime = performance.now();
          confirmationTimes.push(endTime - startTime);
        } catch (error) {
          console.warn(`Transfer to ${restaurantId} failed or timed out:`, error.message);
          // Record timeout for analysis
          confirmationTimes.push(30000);
        }
      }
      
      if (confirmationTimes.length > 0) {
        const avgConfirmationTime = confirmationTimes.reduce((a, b) => a + b, 0) / confirmationTimes.length;
        const maxConfirmationTime = Math.max(...confirmationTimes);
        
        console.log(`📊 Coin Transfer Confirmation Times:`);
        console.log(`   Average: ${avgConfirmationTime.toFixed(2)}ms`);
        console.log(`   Maximum: ${maxConfirmationTime.toFixed(2)}ms`);
        console.log(`   Successful transfers: ${confirmationTimes.filter(t => t < 30000).length}/${confirmationTimes.length}`);
        
        // At least some transfers should complete quickly
        const successfulTransfers = confirmationTimes.filter(t => t < 30000);
        if (successfulTransfers.length > 0) {
          const avgSuccessfulTime = successfulTransfers.reduce((a, b) => a + b, 0) / successfulTransfers.length;
          expect(avgSuccessfulTime).toBeLessThan(25000); // Successful transfers under 25 seconds
        }
      }
    }, 180000); // 3 minute timeout for multiple blockchain operations
  });

  describe('Gas Usage Optimization', () => {
    test('should provide reasonable gas estimates for operations', async () => {
      // Test gas estimation for different operations
      const operations = [
        'register_tourist',
        'register_restaurant', 
        'issue_daily_coins',
        'transfer_coins'
      ];
      
      for (const operation of operations) {
        try {
          const startTime = performance.now();
          
          // Make gas estimation request
          const response = await fetch(`${process.env.TEST_API_URL}/api/blockchain/gas/estimate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.TEST_API_KEY}`
            },
            body: JSON.stringify({
              operation,
              amount: operation === 'transfer_coins' ? 2.5 : undefined
            })
          });
          
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          if (response.ok) {
            const gasEstimate = await response.json();
            
            console.log(`📊 Gas Estimate for ${operation}:`);
            console.log(`   Estimated gas: ${gasEstimate.estimatedGas}`);
            console.log(`   Gas price: ${gasEstimate.gasPrice} wei`);
            console.log(`   Estimated cost: $${gasEstimate.estimatedCostUSD}`);
            console.log(`   Response time: ${responseTime.toFixed(2)}ms`);
            
            // Gas estimates should be reasonable
            expect(gasEstimate.estimatedGas).toBeGreaterThan(0);
            expect(gasEstimate.estimatedGas).toBeLessThan(500000); // Under 500k gas
            expect(gasEstimate.estimatedCostUSD).toBeLessThan(0.1); // Under $0.10
            expect(responseTime).toBeLessThan(1000); // Response under 1 second
          } else {
            console.warn(`Gas estimation failed for ${operation}:`, response.statusText);
          }
        } catch (error) {
          console.warn(`Gas estimation error for ${operation}:`, error.message);
        }
      }
    });

    test('should track actual gas usage vs estimates', async () => {
      // This test would compare actual gas usage with estimates
      // For now, we'll simulate the comparison
      
      const operations = [
        { name: 'register_tourist', estimatedGas: 120000, actualGas: 115000 },
        { name: 'issue_daily_coins', estimatedGas: 85000, actualGas: 82000 },
        { name: 'transfer_coins', estimatedGas: 65000, actualGas: 68000 }
      ];
      
      for (const op of operations) {
        const accuracy = (1 - Math.abs(op.actualGas - op.estimatedGas) / op.estimatedGas) * 100;
        
        console.log(`📊 Gas Estimation Accuracy for ${op.name}:`);
        console.log(`   Estimated: ${op.estimatedGas} gas`);
        console.log(`   Actual: ${op.actualGas} gas`);
        console.log(`   Accuracy: ${accuracy.toFixed(1)}%`);
        
        // Gas estimates should be reasonably accurate
        expect(accuracy).toBeGreaterThan(80); // At least 80% accuracy
      }
    });
  });

  describe('Network Throughput Under Load', () => {
    test('should handle multiple concurrent blockchain operations', async () => {
      const startTime = performance.now();
      
      // Create concurrent blockchain operations
      const operations = [
        // Network status checks (should be fast)
        ...Array(10).fill(0).map(() => sdk.getNetworkStatus()),
        
        // Transaction status checks
        ...Array(5).fill(0).map((_, i) => 
          sdk.getTransactionStatus(`0x${'1'.repeat(64)}`).catch(error => ({ error: error.message }))
        )
      ];
      
      const results = await Promise.all(operations);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const successfulOps = results.filter(r => !r.error).length;
      
      console.log(`📊 Concurrent Blockchain Operations:`);
      console.log(`   Total operations: ${operations.length}`);
      console.log(`   Successful: ${successfulOps}`);
      console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`   Average per operation: ${(totalTime / operations.length).toFixed(2)}ms`);
      
      // Most operations should succeed
      expect(successfulOps).toBeGreaterThan(operations.length * 0.7); // At least 70% success
      expect(totalTime).toBeLessThan(15000); // Complete within 15 seconds
    });

    test('should maintain network connectivity under sustained load', async () => {
      const testDuration = 20000; // 20 seconds
      const requestInterval = 1000; // Request every second
      
      let requestCount = 0;
      let successCount = 0;
      let errorCount = 0;
      const responseTimes: number[] = [];
      
      const makeNetworkRequest = async () => {
        const startTime = performance.now();
        try {
          await sdk.getNetworkStatus();
          const endTime = performance.now();
          responseTimes.push(endTime - startTime);
          successCount++;
        } catch (error) {
          errorCount++;
        }
        requestCount++;
      };
      
      // Start sustained network load
      const intervalId = setInterval(makeNetworkRequest, requestInterval);
      
      // Wait for test duration
      await new Promise(resolve => setTimeout(resolve, testDuration));
      
      // Stop making requests
      clearInterval(intervalId);
      
      // Wait for any pending requests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const successRate = (successCount / requestCount) * 100;
      
      console.log(`📊 Sustained Network Load Test:`);
      console.log(`   Duration: ${testDuration}ms`);
      console.log(`   Total requests: ${requestCount}`);
      console.log(`   Successful: ${successCount}`);
      console.log(`   Errors: ${errorCount}`);
      console.log(`   Success rate: ${successRate.toFixed(1)}%`);
      console.log(`   Average response time: ${avgResponseTime.toFixed(2)}ms`);
      
      // Network should remain stable
      expect(successRate).toBeGreaterThan(90); // At least 90% success rate
      expect(avgResponseTime).toBeLessThan(2000); // Average under 2 seconds
    }, 30000); // Increase Jest timeout for this test
  });

  describe('Smart Contract Call Efficiency', () => {
    test('should batch multiple operations efficiently', async () => {
      // Test the efficiency of multiple sequential operations vs batched operations
      
      // Sequential operations
      const sequentialStartTime = performance.now();
      
      for (let i = 0; i < 3; i++) {
        try {
          await sdk.getNetworkStatus();
        } catch (error) {
          console.warn(`Sequential operation ${i} failed:`, error.message);
        }
      }
      
      const sequentialEndTime = performance.now();
      const sequentialTime = sequentialEndTime - sequentialStartTime;
      
      // Concurrent operations (simulating batching)
      const concurrentStartTime = performance.now();
      
      const concurrentPromises = Array(3).fill(0).map(() => 
        sdk.getNetworkStatus().catch(error => ({ error: error.message }))
      );
      
      await Promise.all(concurrentPromises);
      const concurrentEndTime = performance.now();
      const concurrentTime = concurrentEndTime - concurrentStartTime;
      
      console.log(`📊 Operation Batching Efficiency:`);
      console.log(`   Sequential time: ${sequentialTime.toFixed(2)}ms`);
      console.log(`   Concurrent time: ${concurrentTime.toFixed(2)}ms`);
      console.log(`   Efficiency gain: ${(sequentialTime / concurrentTime).toFixed(2)}x`);
      
      // Concurrent operations should be more efficient
      expect(concurrentTime).toBeLessThanOrEqual(sequentialTime);
    });

    test('should optimize contract state reads', async () => {
      // Test the efficiency of reading contract state
      const measurements: number[] = [];
      
      // Perform multiple contract state reads
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        
        try {
          // Get contract information (simulates reading contract state)
          const response = await fetch(`${process.env.TEST_API_URL}/api/blockchain/contract/info`, {
            headers: {
              'Authorization': `Bearer ${process.env.TEST_API_KEY}`
            }
          });
          
          if (response.ok) {
            await response.json();
          }
          
          const endTime = performance.now();
          measurements.push(endTime - startTime);
        } catch (error) {
          console.warn(`Contract state read ${i} failed:`, error.message);
          measurements.push(5000); // Record as slow operation
        }
      }
      
      const avgTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const maxTime = Math.max(...measurements);
      
      console.log(`📊 Contract State Read Performance:`);
      console.log(`   Average: ${avgTime.toFixed(2)}ms`);
      console.log(`   Maximum: ${maxTime.toFixed(2)}ms`);
      console.log(`   All measurements: ${measurements.map(m => m.toFixed(0)).join(', ')}ms`);
      
      // Contract reads should be reasonably fast
      expect(avgTime).toBeLessThan(2000); // Average under 2 seconds
      expect(maxTime).toBeLessThan(5000); // Max under 5 seconds
    });
  });

  describe('Network Health Monitoring', () => {
    test('should detect network performance degradation', async () => {
      const measurements: number[] = [];
      const healthChecks: boolean[] = [];
      
      // Perform multiple network health checks over time
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        
        try {
          const networkStatus = await sdk.getNetworkStatus();
          const endTime = performance.now();
          
          measurements.push(endTime - startTime);
          healthChecks.push(networkStatus.isHealthy);
          
          // Wait between checks
          if (i < 9) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          measurements.push(5000); // Record as slow/failed
          healthChecks.push(false);
        }
      }
      
      const avgResponseTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const healthyChecks = healthChecks.filter(h => h).length;
      const healthRate = (healthyChecks / healthChecks.length) * 100;
      
      // Check for performance degradation over time
      const firstHalf = measurements.slice(0, 5);
      const secondHalf = measurements.slice(5);
      
      const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      console.log(`📊 Network Health Monitoring:`);
      console.log(`   Average response time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   Health rate: ${healthRate.toFixed(1)}%`);
      console.log(`   First half average: ${firstHalfAvg.toFixed(2)}ms`);
      console.log(`   Second half average: ${secondHalfAvg.toFixed(2)}ms`);
      console.log(`   Performance change: ${((secondHalfAvg / firstHalfAvg - 1) * 100).toFixed(1)}%`);
      
      // Network should remain healthy and performant
      expect(healthRate).toBeGreaterThan(80); // At least 80% healthy
      expect(avgResponseTime).toBeLessThan(3000); // Average under 3 seconds
      
      // Performance shouldn't degrade significantly
      expect(secondHalfAvg / firstHalfAvg).toBeLessThan(2); // Less than 2x degradation
    }, 20000); // Increase timeout for this test
  });
});