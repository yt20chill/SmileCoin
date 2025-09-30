/**
 * End-to-End Test: Restaurant Registration and Coin Receiving Flow
 * 
 * This test covers:
 * - Restaurant registration with wallet creation
 * - Coin transfers from tourists to restaurants
 * - Daily transfer limits (max 3 coins per restaurant per day)
 * - Restaurant earnings tracking and analytics
 * 
 * Requirements: 1.2, 5.4, 6.1
 */

import { SmileCoinSDK, SDKError, SDKErrorCode } from '../../src/sdk/SmileCoinSDK';

describe('E2E: Restaurant Registration and Coin Receiving Flow', () => {
  let sdk: SmileCoinSDK;
  let testRestaurantId: string;
  let testTouristId: string;
  let restaurantName: string;
  let restaurantAddress: string;

  beforeAll(async () => {
    // Initialize SDK with test configuration
    sdk = new SmileCoinSDK({
      apiUrl: process.env.TEST_API_URL || 'http://localhost:3000',
      apiKey: process.env.TEST_API_KEY || 'test-api-key',
      timeout: 60000
    });

    // Generate unique test data
    const timestamp = Date.now();
    testRestaurantId = `ChIJ_e2e_restaurant_${timestamp}`;
    testTouristId = `e2e-tourist-restaurant-${timestamp}`;
    restaurantName = `E2E Test Restaurant ${timestamp}`;
    restaurantAddress = `123 Test Street, Test City, Test Country`;

    // Set up test tourist with coins
    const today = new Date();
    const departure = new Date(today);
    departure.setDate(departure.getDate() + 7);
    
    const arrivalDate = today.toISOString().split('T')[0];
    const departureDate = departure.toISOString().split('T')[0];

    // Register tourist and issue coins for testing transfers
    await sdk.registerTourist({
      touristId: testTouristId,
      originCountry: 'USA',
      arrivalDate,
      departureDate
    });

    // Issue daily coins to tourist
    await sdk.issueDailyCoins(testTouristId);
  });

  afterAll(async () => {
    // Cleanup test data if needed
    try {
      // In a real test environment, you might want to clean up test wallets
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  });

  describe('Restaurant Registration', () => {
    test('should register a new restaurant successfully', async () => {
      const registrationData = {
        googlePlaceId: testRestaurantId,
        name: restaurantName,
        address: restaurantAddress
      };

      const result = await sdk.registerRestaurant(registrationData);

      expect(result).toMatchObject({
        walletAddress: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
        qrCode: expect.stringContaining(testRestaurantId),
        transactionHash: expect.stringMatching(/^0x[a-fA-F0-9]{64}$/),
        success: true
      });

      // Verify QR code format
      expect(result.qrCode).toContain('restaurant:');
      expect(result.qrCode).toContain(testRestaurantId);
      expect(result.qrCode).toContain(result.walletAddress);
    });

    test('should prevent duplicate restaurant registration', async () => {
      const registrationData = {
        googlePlaceId: testRestaurantId,
        name: restaurantName,
        address: restaurantAddress
      };

      await expect(sdk.registerRestaurant(registrationData))
        .rejects
        .toThrow(SDKError);
    });

    test('should validate restaurant registration data', async () => {
      // Test missing Google Place ID
      await expect(sdk.registerRestaurant({
        googlePlaceId: '',
        name: 'Test Restaurant',
        address: 'Test Address'
      })).rejects.toThrow('Google Place ID is required');

      // Test missing name
      await expect(sdk.registerRestaurant({
        googlePlaceId: 'ChIJTest123',
        name: '',
        address: 'Test Address'
      })).rejects.toThrow('Restaurant name is required');

      // Test missing address
      await expect(sdk.registerRestaurant({
        googlePlaceId: 'ChIJTest456',
        name: 'Test Restaurant',
        address: ''
      })).rejects.toThrow('Restaurant address is required');
    });
  });

  describe('Coin Transfer Operations', () => {
    test('should transfer coins from tourist to restaurant', async () => {
      const transferData = {
        touristId: testTouristId,
        restaurantId: testRestaurantId,
        amount: 2.5
      };

      const result = await sdk.transferCoins(transferData);

      expect(result).toMatchObject({
        transactionHash: expect.stringMatching(/^0x[a-fA-F0-9]{64}$/),
        success: true,
        amount: 2.5,
        remainingDailyLimit: expect.any(Number)
      });

      // Remaining daily limit should be 3 - 2.5 = 0.5
      expect(result.remainingDailyLimit).toBeLessThanOrEqual(0.5);
    });

    test('should enforce daily transfer limits per restaurant', async () => {
      // Try to transfer more coins to the same restaurant
      const transferData = {
        touristId: testTouristId,
        restaurantId: testRestaurantId,
        amount: 1.0 // This should exceed the daily limit
      };

      await expect(sdk.transferCoins(transferData))
        .rejects
        .toThrow(); // Should fail due to daily limit
    });

    test('should validate transfer amounts', async () => {
      const newRestaurantId = `ChIJ_validation_test_${Date.now()}`;
      
      // Register new restaurant for validation tests
      await sdk.registerRestaurant({
        googlePlaceId: newRestaurantId,
        name: 'Validation Test Restaurant',
        address: 'Test Address'
      });

      // Test zero amount
      await expect(sdk.transferCoins({
        touristId: testTouristId,
        restaurantId: newRestaurantId,
        amount: 0
      })).rejects.toThrow('Amount must be greater than 0');

      // Test negative amount
      await expect(sdk.transferCoins({
        touristId: testTouristId,
        restaurantId: newRestaurantId,
        amount: -1
      })).rejects.toThrow('Amount must be greater than 0');

      // Test amount exceeding daily limit
      await expect(sdk.transferCoins({
        touristId: testTouristId,
        restaurantId: newRestaurantId,
        amount: 4
      })).rejects.toThrow('Cannot transfer more than 3 coins per restaurant per day');
    });

    test('should handle transfers to unregistered restaurant', async () => {
      const unregisteredRestaurantId = `ChIJ_unregistered_${Date.now()}`;

      await expect(sdk.transferCoins({
        touristId: testTouristId,
        restaurantId: unregisteredRestaurantId,
        amount: 1
      })).rejects.toThrow(SDKError);
    });

    test('should handle transfers from unregistered tourist', async () => {
      const unregisteredTouristId = `unregistered_tourist_${Date.now()}`;

      await expect(sdk.transferCoins({
        touristId: unregisteredTouristId,
        restaurantId: testRestaurantId,
        amount: 1
      })).rejects.toThrow(SDKError);
    });

    test('should handle insufficient balance transfers', async () => {
      // Create new tourist with no coins
      const poorTouristId = `poor_tourist_${Date.now()}`;
      const today = new Date();
      const departure = new Date(today);
      departure.setDate(departure.getDate() + 7);
      
      await sdk.registerTourist({
        touristId: poorTouristId,
        originCountry: 'CAN',
        arrivalDate: today.toISOString().split('T')[0],
        departureDate: departure.toISOString().split('T')[0]
      });

      // Try to transfer without having coins
      await expect(sdk.transferCoins({
        touristId: poorTouristId,
        restaurantId: testRestaurantId,
        amount: 1
      })).rejects.toThrow(); // Should fail due to insufficient balance
    });
  });

  describe('Restaurant Earnings and Analytics', () => {
    test('should retrieve restaurant earnings', async () => {
      const earnings = await sdk.getRestaurantEarnings(testRestaurantId);

      expect(earnings).toMatchObject({
        totalCoins: expect.any(Number),
        walletAddress: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
        dailyBreakdown: expect.any(Array),
        originBreakdown: expect.any(Array)
      });

      // Should have received coins from previous transfer
      expect(earnings.totalCoins).toBeGreaterThan(0);
    });

    test('should provide daily earnings breakdown', async () => {
      const earnings = await sdk.getRestaurantEarnings(testRestaurantId);

      expect(Array.isArray(earnings.dailyBreakdown)).toBe(true);
      
      if (earnings.dailyBreakdown.length > 0) {
        expect(earnings.dailyBreakdown[0]).toMatchObject({
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          coins: expect.any(Number),
          transactions: expect.any(Number)
        });
      }
    });

    test('should provide origin country breakdown', async () => {
      const earnings = await sdk.getRestaurantEarnings(testRestaurantId);

      expect(Array.isArray(earnings.originBreakdown)).toBe(true);
      
      if (earnings.originBreakdown.length > 0) {
        expect(earnings.originBreakdown[0]).toMatchObject({
          country: expect.any(String),
          coins: expect.any(Number),
          transactions: expect.any(Number)
        });
      }
    });

    test('should handle earnings request for unregistered restaurant', async () => {
      const unregisteredRestaurantId = `ChIJ_unregistered_earnings_${Date.now()}`;
      
      await expect(sdk.getRestaurantEarnings(unregisteredRestaurantId))
        .rejects
        .toThrow(SDKError);
    });

    test('should retrieve restaurant transaction history', async () => {
      const transactions = await sdk.getRestaurantTransactions(testRestaurantId, 10, 0);

      expect(Array.isArray(transactions)).toBe(true);
      
      // Should have at least one transaction (from coin transfer)
      if (transactions.length > 0) {
        expect(transactions[0]).toMatchObject({
          hash: expect.stringMatching(/^0x[a-fA-F0-9]{64}$/),
          from: expect.any(String),
          to: expect.any(String),
          amount: expect.any(Number),
          timestamp: expect.any(String),
          type: expect.stringMatching(/^(daily_issuance|restaurant_transfer|expiration)$/),
          status: expect.stringMatching(/^(pending|confirmed|failed)$/)
        });
      }
    });
  });

  describe('Daily Limits and Business Rules', () => {
    test('should enforce 3-coin daily limit per restaurant', async () => {
      // Create new tourist and restaurant for clean daily limit test
      const limitTestTouristId = `limit_tourist_${Date.now()}`;
      const limitTestRestaurantId = `ChIJ_limit_test_${Date.now()}`;
      
      const today = new Date();
      const departure = new Date(today);
      departure.setDate(departure.getDate() + 7);
      
      // Register tourist and restaurant
      await sdk.registerTourist({
        touristId: limitTestTouristId,
        originCountry: 'GBR',
        arrivalDate: today.toISOString().split('T')[0],
        departureDate: departure.toISOString().split('T')[0]
      });

      await sdk.registerRestaurant({
        googlePlaceId: limitTestRestaurantId,
        name: 'Daily Limit Test Restaurant',
        address: 'Test Address'
      });

      // Issue coins to tourist
      await sdk.issueDailyCoins(limitTestTouristId);

      // Transfer exactly 3 coins (should succeed)
      const result = await sdk.transferCoins({
        touristId: limitTestTouristId,
        restaurantId: limitTestRestaurantId,
        amount: 3
      });

      expect(result.success).toBe(true);
      expect(result.remainingDailyLimit).toBe(0);

      // Try to transfer more coins (should fail)
      await expect(sdk.transferCoins({
        touristId: limitTestTouristId,
        restaurantId: limitTestRestaurantId,
        amount: 0.1
      })).rejects.toThrow();
    });

    test('should allow transfers to different restaurants on same day', async () => {
      // Create new tourist with fresh coins
      const multiRestaurantTouristId = `multi_restaurant_tourist_${Date.now()}`;
      const restaurant1Id = `ChIJ_multi_test_1_${Date.now()}`;
      const restaurant2Id = `ChIJ_multi_test_2_${Date.now()}`;
      
      const today = new Date();
      const departure = new Date(today);
      departure.setDate(departure.getDate() + 7);
      
      // Register tourist
      await sdk.registerTourist({
        touristId: multiRestaurantTouristId,
        originCountry: 'DEU',
        arrivalDate: today.toISOString().split('T')[0],
        departureDate: departure.toISOString().split('T')[0]
      });

      // Register two restaurants
      await sdk.registerRestaurant({
        googlePlaceId: restaurant1Id,
        name: 'Multi Test Restaurant 1',
        address: 'Test Address 1'
      });

      await sdk.registerRestaurant({
        googlePlaceId: restaurant2Id,
        name: 'Multi Test Restaurant 2',
        address: 'Test Address 2'
      });

      // Issue coins to tourist
      await sdk.issueDailyCoins(multiRestaurantTouristId);

      // Transfer 3 coins to first restaurant
      const result1 = await sdk.transferCoins({
        touristId: multiRestaurantTouristId,
        restaurantId: restaurant1Id,
        amount: 3
      });

      expect(result1.success).toBe(true);

      // Transfer 3 coins to second restaurant (should also succeed)
      const result2 = await sdk.transferCoins({
        touristId: multiRestaurantTouristId,
        restaurantId: restaurant2Id,
        amount: 3
      });

      expect(result2.success).toBe(true);
    });
  });

  describe('QR Code Integration', () => {
    test('should generate valid QR code data for restaurants', async () => {
      const qrTestRestaurantId = `ChIJ_qr_test_${Date.now()}`;
      
      const result = await sdk.registerRestaurant({
        googlePlaceId: qrTestRestaurantId,
        name: 'QR Test Restaurant',
        address: 'QR Test Address'
      });

      // QR code should contain restaurant identifier and wallet address
      const qrParts = result.qrCode.split(':');
      expect(qrParts).toHaveLength(3);
      expect(qrParts[0]).toBe('restaurant');
      expect(qrParts[1]).toBe(qrTestRestaurantId);
      expect(qrParts[2]).toBe(result.walletAddress);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle concurrent transfers gracefully', async () => {
      // This test simulates multiple tourists trying to transfer to the same restaurant
      const concurrentTestRestaurantId = `ChIJ_concurrent_test_${Date.now()}`;
      
      await sdk.registerRestaurant({
        googlePlaceId: concurrentTestRestaurantId,
        name: 'Concurrent Test Restaurant',
        address: 'Concurrent Test Address'
      });

      // Create multiple tourists
      const tourists = [];
      for (let i = 0; i < 3; i++) {
        const touristId = `concurrent_tourist_${Date.now()}_${i}`;
        const today = new Date();
        const departure = new Date(today);
        departure.setDate(departure.getDate() + 7);
        
        await sdk.registerTourist({
          touristId,
          originCountry: 'FRA',
          arrivalDate: today.toISOString().split('T')[0],
          departureDate: departure.toISOString().split('T')[0]
        });

        await sdk.issueDailyCoins(touristId);
        tourists.push(touristId);
      }

      // All tourists should be able to transfer to the restaurant
      const transferPromises = tourists.map(touristId => 
        sdk.transferCoins({
          touristId,
          restaurantId: concurrentTestRestaurantId,
          amount: 2
        })
      );

      const results = await Promise.all(transferPromises);
      
      // All transfers should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    test('should validate input parameters', async () => {
      // Test empty tourist ID
      await expect(sdk.transferCoins({
        touristId: '',
        restaurantId: testRestaurantId,
        amount: 1
      })).rejects.toThrow('Tourist ID is required');

      // Test empty restaurant ID
      await expect(sdk.transferCoins({
        touristId: testTouristId,
        restaurantId: '',
        amount: 1
      })).rejects.toThrow('Restaurant ID is required');
    });
  });
});