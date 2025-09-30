/**
 * API Performance and Load Testing
 * 
 * This test suite evaluates API performance under various load conditions:
 * - Concurrent request handling
 * - Response time benchmarks
 * - Throughput measurements
 * - Memory and CPU usage monitoring
 * 
 * Requirements: 8.4, 9.4
 */

import { SmileCoinSDK } from '../../src/sdk/SmileCoinSDK';
import { performance } from 'perf_hooks';

describe('API Performance and Load Testing', () => {
  let sdk: SmileCoinSDK;
  let testTourists: string[] = [];
  let testRestaurants: string[] = [];

  beforeAll(async () => {
    sdk = new SmileCoinSDK({
      apiUrl: process.env.TEST_API_URL || 'http://localhost:3000',
      apiKey: process.env.TEST_API_KEY || 'test-api-key',
      timeout: 60000
    });

    // Pre-create test data for performance tests
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup is handled by global teardown
  });

  async function setupTestData() {
    console.log('🔧 Setting up performance test data...');
    
    const today = new Date();
    const departure = new Date(today);
    departure.setDate(departure.getDate() + 7);
    
    // Create 10 test tourists
    for (let i = 0; i < 10; i++) {
      const touristId = `perf_tourist_${Date.now()}_${i}`;
      testTourists.push(touristId);
      
      await sdk.registerTourist({
        touristId,
        originCountry: 'USA',
        arrivalDate: today.toISOString().split('T')[0],
        departureDate: departure.toISOString().split('T')[0]
      });
      
      // Issue coins to each tourist
      await sdk.issueDailyCoins(touristId);
    }
    
    // Create 5 test restaurants
    for (let i = 0; i < 5; i++) {
      const restaurantId = `ChIJ_perf_restaurant_${Date.now()}_${i}`;
      testRestaurants.push(restaurantId);
      
      await sdk.registerRestaurant({
        googlePlaceId: restaurantId,
        name: `Performance Test Restaurant ${i}`,
        address: `Test Address ${i}`
      });
    }
    
    console.log('✅ Performance test data setup complete');
  }

  describe('Response Time Benchmarks', () => {
    test('tourist balance queries should respond within 500ms', async () => {
      const measurements: number[] = [];
      
      for (const touristId of testTourists) {
        const startTime = performance.now();
        await sdk.getTouristBalance(touristId);
        const endTime = performance.now();
        
        measurements.push(endTime - startTime);
      }
      
      const avgResponseTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const maxResponseTime = Math.max(...measurements);
      
      console.log(`📊 Tourist Balance Query Performance:`);
      console.log(`   Average: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   Maximum: ${maxResponseTime.toFixed(2)}ms`);
      
      // Performance assertions
      expect(avgResponseTime).toBeLessThan(500); // Average under 500ms
      expect(maxResponseTime).toBeLessThan(1000); // Max under 1 second
    });

    test('restaurant earnings queries should respond within 750ms', async () => {
      const measurements: number[] = [];
      
      for (const restaurantId of testRestaurants) {
        const startTime = performance.now();
        await sdk.getRestaurantEarnings(restaurantId);
        const endTime = performance.now();
        
        measurements.push(endTime - startTime);
      }
      
      const avgResponseTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const maxResponseTime = Math.max(...measurements);
      
      console.log(`📊 Restaurant Earnings Query Performance:`);
      console.log(`   Average: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   Maximum: ${maxResponseTime.toFixed(2)}ms`);
      
      // Performance assertions
      expect(avgResponseTime).toBeLessThan(750); // Average under 750ms
      expect(maxResponseTime).toBeLessThan(1500); // Max under 1.5 seconds
    });

    test('network status queries should respond within 200ms', async () => {
      const measurements: number[] = [];
      
      // Test 20 network status queries
      for (let i = 0; i < 20; i++) {
        const startTime = performance.now();
        await sdk.getNetworkStatus();
        const endTime = performance.now();
        
        measurements.push(endTime - startTime);
      }
      
      const avgResponseTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const maxResponseTime = Math.max(...measurements);
      
      console.log(`📊 Network Status Query Performance:`);
      console.log(`   Average: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   Maximum: ${maxResponseTime.toFixed(2)}ms`);
      
      // Performance assertions
      expect(avgResponseTime).toBeLessThan(200); // Average under 200ms
      expect(maxResponseTime).toBeLessThan(500); // Max under 500ms
    });
  });

  describe('Concurrent Request Handling', () => {
    test('should handle 50 concurrent balance queries', async () => {
      const startTime = performance.now();
      
      // Create 50 concurrent requests (5 requests per tourist)
      const promises = [];
      for (let i = 0; i < 50; i++) {
        const touristId = testTourists[i % testTourists.length];
        promises.push(sdk.getTouristBalance(touristId));
      }
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const avgTimePerRequest = totalTime / 50;
      
      console.log(`📊 Concurrent Balance Queries (50 requests):`);
      console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`   Average per request: ${avgTimePerRequest.toFixed(2)}ms`);
      console.log(`   Requests per second: ${(50 / (totalTime / 1000)).toFixed(2)}`);
      
      // All requests should succeed
      expect(results).toHaveLength(50);
      results.forEach(result => {
        expect(result.balance).toBeGreaterThanOrEqual(0);
      });
      
      // Performance assertions
      expect(totalTime).toBeLessThan(10000); // Complete within 10 seconds
      expect(avgTimePerRequest).toBeLessThan(1000); // Average under 1 second per request
    });

    test('should handle 25 concurrent coin transfers', async () => {
      const startTime = performance.now();
      
      // Create 25 concurrent transfer requests
      const promises = [];
      for (let i = 0; i < 25; i++) {
        const touristId = testTourists[i % testTourists.length];
        const restaurantId = testRestaurants[i % testRestaurants.length];
        
        promises.push(
          sdk.transferCoins({
            touristId,
            restaurantId,
            amount: 0.5 // Small amount to avoid hitting daily limits
          }).catch(error => {
            // Some transfers may fail due to daily limits, which is expected
            return { error: error.message };
          })
        );
      }
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const successfulTransfers = results.filter(r => !r.error).length;
      
      console.log(`📊 Concurrent Coin Transfers (25 requests):`);
      console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`   Successful transfers: ${successfulTransfers}/25`);
      console.log(`   Success rate: ${((successfulTransfers / 25) * 100).toFixed(1)}%`);
      
      // At least some transfers should succeed
      expect(successfulTransfers).toBeGreaterThan(0);
      
      // Performance assertions
      expect(totalTime).toBeLessThan(30000); // Complete within 30 seconds
    });

    test('should handle mixed concurrent operations', async () => {
      const startTime = performance.now();
      
      // Mix of different operations
      const promises = [
        // 10 balance queries
        ...Array(10).fill(0).map((_, i) => 
          sdk.getTouristBalance(testTourists[i % testTourists.length])
        ),
        // 5 earnings queries
        ...Array(5).fill(0).map((_, i) => 
          sdk.getRestaurantEarnings(testRestaurants[i % testRestaurants.length])
        ),
        // 10 network status queries
        ...Array(10).fill(0).map(() => sdk.getNetworkStatus()),
        // 5 transaction history queries
        ...Array(5).fill(0).map((_, i) => 
          sdk.getTouristTransactions(testTourists[i % testTourists.length], 5, 0)
        )
      ];
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const totalRequests = promises.length;
      
      console.log(`📊 Mixed Concurrent Operations (${totalRequests} requests):`);
      console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`   Average per request: ${(totalTime / totalRequests).toFixed(2)}ms`);
      console.log(`   Requests per second: ${(totalRequests / (totalTime / 1000)).toFixed(2)}`);
      
      // All requests should succeed
      expect(results).toHaveLength(totalRequests);
      
      // Performance assertions
      expect(totalTime).toBeLessThan(15000); // Complete within 15 seconds
    });
  });

  describe('Throughput Measurements', () => {
    test('should maintain throughput under sustained load', async () => {
      const testDuration = 30000; // 30 seconds
      const requestInterval = 100; // Request every 100ms
      const startTime = performance.now();
      
      let requestCount = 0;
      let successCount = 0;
      let errorCount = 0;
      const responseTimes: number[] = [];
      
      const makeRequest = async () => {
        const reqStartTime = performance.now();
        try {
          await sdk.getNetworkStatus();
          const reqEndTime = performance.now();
          responseTimes.push(reqEndTime - reqStartTime);
          successCount++;
        } catch (error) {
          errorCount++;
        }
        requestCount++;
      };
      
      // Start sustained load
      const intervalId = setInterval(makeRequest, requestInterval);
      
      // Wait for test duration
      await new Promise(resolve => setTimeout(resolve, testDuration));
      
      // Stop making requests
      clearInterval(intervalId);
      
      // Wait for any pending requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const endTime = performance.now();
      const actualDuration = endTime - startTime;
      
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const throughput = (successCount / (actualDuration / 1000));
      const errorRate = (errorCount / requestCount) * 100;
      
      console.log(`📊 Sustained Load Test (${actualDuration.toFixed(0)}ms):`);
      console.log(`   Total requests: ${requestCount}`);
      console.log(`   Successful: ${successCount}`);
      console.log(`   Errors: ${errorCount}`);
      console.log(`   Error rate: ${errorRate.toFixed(2)}%`);
      console.log(`   Throughput: ${throughput.toFixed(2)} req/sec`);
      console.log(`   Average response time: ${avgResponseTime.toFixed(2)}ms`);
      
      // Performance assertions
      expect(errorRate).toBeLessThan(5); // Less than 5% error rate
      expect(throughput).toBeGreaterThan(5); // At least 5 requests per second
      expect(avgResponseTime).toBeLessThan(1000); // Average under 1 second
    }, 35000); // Increase Jest timeout for this test
  });

  describe('Memory and Resource Usage', () => {
    test('should not have significant memory leaks during operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await sdk.getNetworkStatus();
        
        // Occasionally check memory usage
        if (i % 20 === 0) {
          const currentMemory = process.memoryUsage();
          const heapIncrease = currentMemory.heapUsed - initialMemory.heapUsed;
          
          // Memory increase should be reasonable
          expect(heapIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
        }
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const heapIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`📊 Memory Usage:`);
      console.log(`   Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Heap increase: ${(heapIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // Memory increase should be minimal after GC
      expect(heapIncrease).toBeLessThan(20 * 1024 * 1024); // Less than 20MB increase
    });
  });

  describe('Error Handling Performance', () => {
    test('should handle errors efficiently without degrading performance', async () => {
      const validRequests: Promise<any>[] = [];
      const invalidRequests: Promise<any>[] = [];
      
      // Mix valid and invalid requests
      for (let i = 0; i < 25; i++) {
        // Valid request
        validRequests.push(sdk.getNetworkStatus());
        
        // Invalid request (should fail quickly)
        invalidRequests.push(
          sdk.getTouristBalance(`invalid_tourist_${i}`).catch(error => ({ error: error.message }))
        );
      }
      
      const startTime = performance.now();
      
      const [validResults, invalidResults] = await Promise.all([
        Promise.all(validRequests),
        Promise.all(invalidRequests)
      ]);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      console.log(`📊 Error Handling Performance:`);
      console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`   Valid requests: ${validResults.length}`);
      console.log(`   Invalid requests: ${invalidResults.length}`);
      console.log(`   Average time per request: ${(totalTime / 50).toFixed(2)}ms`);
      
      // All valid requests should succeed
      validResults.forEach(result => {
        expect(result.isHealthy).toBeDefined();
      });
      
      // All invalid requests should fail gracefully
      invalidResults.forEach(result => {
        expect(result.error).toBeDefined();
      });
      
      // Error handling shouldn't significantly impact performance
      expect(totalTime).toBeLessThan(10000); // Complete within 10 seconds
    });
  });
});