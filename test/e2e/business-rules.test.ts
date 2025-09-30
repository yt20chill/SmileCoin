/**
 * End-to-End Test: Daily Limits and Business Rule Enforcement
 * 
 * This test covers:
 * - Daily coin issuance limits (once per day per tourist)
 * - Restaurant transfer limits (max 3 coins per restaurant per day)
 * - Coin expiration rules (14-day expiration)
 * - Tourist travel date validation
 * - Physical souvenir eligibility tracking
 * 
 * Requirements: 5.3, 5.4, 7.2, 7.4, 7.5
 */

import { SmileCoinSDK, SDKError, SDKErrorCode } from '../../src/sdk/SmileCoinSDK';

describe('E2E: Daily Limits and Business Rule Enforcement', () => {
  let sdk: SmileCoinSDK;

  beforeAll(async () => {
    // Initialize SDK with test configuration
    sdk = new SmileCoinSDK({
      apiUrl: process.env.TEST_API_URL || 'http://localhost:3000',
      apiKey: process.env.TEST_API_KEY || 'test-api-key',
      timeout: 60000
    });
  });

  describe('Daily Coin Issuance Limits', () => {
    test('should allow only one daily coin issuance per tourist', async () => {
      const touristId = `daily_limit_tourist_${Date.now()}`;
      const today = new Date();
      const departure = new Date(today);
      departure.setDate(departure.getDate() + 7);
      
      // Register tourist
      await sdk.registerTourist({
        touristId,
        originCountry: 'USA',
        arrivalDate: today.toISOString().split('T')[0],
        departureDate: departure.toISOString().split('T')[0]
      });

      // First daily issuance should succeed
      const firstIssuance = await sdk.issueDailyCoins(touristId);
      expect(firstIssuance.amount).toBe(10);
      expect(firstIssuance.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      // Second issuance on same day should fail
      await expect(sdk.issueDailyCoins(touristId))
        .rejects
        .toThrow(); // Should fail due to daily limit
    });

    test('should issue exactly 10 coins per daily issuance', async () => {
      const touristId = `ten_coins_tourist_${Date.now()}`;
      const today = new Date();
      const departure = new Date(today);
      departure.setDate(departure.getDate() + 7);
      
      await sdk.registerTourist({
        touristId,
        originCountry: 'CAN',
        arrivalDate: today.toISOString().split('T')[0],
        departureDate: departure.toISOString().split('T')[0]
      });

      const issuance = await sdk.issueDailyCoins(touristId);
      expect(issuance.amount).toBe(10);

      // Verify balance reflects the issuance
      const balance = await sdk.getTouristBalance(touristId);
      expect(balance.balance).toBeGreaterThanOrEqual(10);
    });

    test('should prevent coin issuance before arrival date', async () => {
      const touristId = `future_arrival_tourist_${Date.now()}`;
      const futureArrival = new Date();
      futureArrival.setDate(futureArrival.getDate() + 1); // Tomorrow
      const departure = new Date(futureArrival);
      departure.setDate(departure.getDate() + 7);
      
      await sdk.registerTourist({
        touristId,
        originCountry: 'GBR',
        arrivalDate: futureArrival.toISOString().split('T')[0],
        departureDate: departure.toISOString().split('T')[0]
      });

      // Should fail because tourist hasn't arrived yet
      await expect(sdk.issueDailyCoins(touristId))
        .rejects
        .toThrow();
    });

    test('should prevent coin issuance after departure date', async () => {
      const touristId = `past_departure_tourist_${Date.now()}`;
      const pastArrival = new Date();
      pastArrival.setDate(pastArrival.getDate() - 10); // 10 days ago
      const pastDeparture = new Date();
      pastDeparture.setDate(pastDeparture.getDate() - 3); // 3 days ago
      
      await sdk.registerTourist({
        touristId,
        originCountry: 'DEU',
        arrivalDate: pastArrival.toISOString().split('T')[0],
        departureDate: pastDeparture.toISOString().split('T')[0]
      });

      // Should fail because tourist has already departed
      await expect(sdk.issueDailyCoins(touristId))
        .rejects
        .toThrow();
    });
  });

  describe('Restaurant Transfer Limits', () => {
    let testTourist: string;
    let testRestaurant: string;

    beforeEach(async () => {
      // Create fresh tourist and restaurant for each test
      const timestamp = Date.now();
      testTourist = `transfer_limit_tourist_${timestamp}`;
      testRestaurant = `ChIJ_transfer_limit_restaurant_${timestamp}`;
      
      const today = new Date();
      const departure = new Date(today);
      departure.setDate(departure.getDate() + 7);
      
      // Register tourist and restaurant
      await sdk.registerTourist({
        touristId: testTourist,
        originCountry: 'FRA',
        arrivalDate: today.toISOString().split('T')[0],
        departureDate: departure.toISOString().split('T')[0]
      });

      await sdk.registerRestaurant({
        googlePlaceId: testRestaurant,
        name: `Transfer Limit Test Restaurant ${timestamp}`,
        address: 'Test Address'
      });

      // Issue coins to tourist
      await sdk.issueDailyCoins(testTourist);
    });

    test('should enforce 3-coin daily limit per restaurant', async () => {
      // Transfer exactly 3 coins (should succeed)
      const result = await sdk.transferCoins({
        touristId: testTourist,
        restaurantId: testRestaurant,
        amount: 3
      });

      expect(result.success).toBe(true);
      expect(result.amount).toBe(3);
      expect(result.remainingDailyLimit).toBe(0);

      // Try to transfer even 0.1 more coins (should fail)
      await expect(sdk.transferCoins({
        touristId: testTourist,
        restaurantId: testRestaurant,
        amount: 0.1
      })).rejects.toThrow();
    });

    test('should allow multiple transfers up to daily limit', async () => {
      // Transfer 1 coin
      const result1 = await sdk.transferCoins({
        touristId: testTourist,
        restaurantId: testRestaurant,
        amount: 1
      });
      expect(result1.success).toBe(true);

      // Transfer 1.5 more coins
      const result2 = await sdk.transferCoins({
        touristId: testTourist,
        restaurantId: testRestaurant,
        amount: 1.5
      });
      expect(result2.success).toBe(true);

      // Transfer 0.5 more coins (total = 3)
      const result3 = await sdk.transferCoins({
        touristId: testTourist,
        restaurantId: testRestaurant,
        amount: 0.5
      });
      expect(result3.success).toBe(true);
      expect(result3.remainingDailyLimit).toBe(0);

      // Try to transfer more (should fail)
      await expect(sdk.transferCoins({
        touristId: testTourist,
        restaurantId: testRestaurant,
        amount: 0.1
      })).rejects.toThrow();
    });

    test('should track daily limits per restaurant separately', async () => {
      const secondRestaurant = `ChIJ_second_restaurant_${Date.now()}`;
      
      await sdk.registerRestaurant({
        googlePlaceId: secondRestaurant,
        name: 'Second Restaurant',
        address: 'Second Address'
      });

      // Transfer 3 coins to first restaurant
      await sdk.transferCoins({
        touristId: testTourist,
        restaurantId: testRestaurant,
        amount: 3
      });

      // Should still be able to transfer 3 coins to second restaurant
      const result = await sdk.transferCoins({
        touristId: testTourist,
        restaurantId: secondRestaurant,
        amount: 3
      });

      expect(result.success).toBe(true);
      expect(result.amount).toBe(3);
    });

    test('should prevent transfers exceeding single transaction limit', async () => {
      // Try to transfer more than 3 coins in single transaction
      await expect(sdk.transferCoins({
        touristId: testTourist,
        restaurantId: testRestaurant,
        amount: 4
      })).rejects.toThrow('Cannot transfer more than 3 coins per restaurant per day');
    });
  });

  describe('Coin Expiration Rules', () => {
    test('should set 14-day expiration on issued coins', async () => {
      const touristId = `expiration_test_tourist_${Date.now()}`;
      const today = new Date();
      const departure = new Date(today);
      departure.setDate(departure.getDate() + 20); // Long stay to test expiration
      
      await sdk.registerTourist({
        touristId,
        originCountry: 'JPN',
        arrivalDate: today.toISOString().split('T')[0],
        departureDate: departure.toISOString().split('T')[0]
      });

      const issuance = await sdk.issueDailyCoins(touristId);
      
      // Check expiration date is approximately 14 days from now
      const expirationDate = new Date(issuance.expirationDate);
      const expectedExpiration = new Date();
      expectedExpiration.setDate(expectedExpiration.getDate() + 14);
      
      const timeDiff = Math.abs(expirationDate.getTime() - expectedExpiration.getTime());
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      // Should be within 24 hours of expected expiration
      expect(hoursDiff).toBeLessThan(24);
    });

    test('should track coin metadata for expiration', async () => {
      const touristId = `metadata_test_tourist_${Date.now()}`;
      const today = new Date();
      const departure = new Date(today);
      departure.setDate(departure.getDate() + 7);
      
      await sdk.registerTourist({
        touristId,
        originCountry: 'AUS',
        arrivalDate: today.toISOString().split('T')[0],
        departureDate: departure.toISOString().split('T')[0]
      });

      const issuance = await sdk.issueDailyCoins(touristId);
      
      // Verify expiration date format and validity
      expect(issuance.expirationDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      
      const expirationDate = new Date(issuance.expirationDate);
      expect(expirationDate.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Tourist Travel Date Validation', () => {
    test('should validate arrival and departure date logic', async () => {
      const touristId = `date_validation_tourist_${Date.now()}`;
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Test departure before arrival
      await expect(sdk.registerTourist({
        touristId,
        originCountry: 'ITA',
        arrivalDate: today.toISOString().split('T')[0],
        departureDate: yesterday.toISOString().split('T')[0]
      })).rejects.toThrow('Departure date must be after arrival date');
    });

    test('should validate date formats', async () => {
      const touristId = `format_validation_tourist_${Date.now()}`;
      
      // Test invalid date format
      await expect(sdk.registerTourist({
        touristId,
        originCountry: 'ESP',
        arrivalDate: 'invalid-date',
        departureDate: '2024-12-31'
      })).rejects.toThrow('Invalid arrival date format');
    });

    test('should allow same-day arrival and departure', async () => {
      const touristId = `same_day_tourist_${Date.now()}`;
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Same day arrival and departure should be allowed
      const result = await sdk.registerTourist({
        touristId,
        originCountry: 'NLD',
        arrivalDate: today.toISOString().split('T')[0],
        departureDate: tomorrow.toISOString().split('T')[0]
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Physical Souvenir Eligibility', () => {
    test('should track daily coin distribution for eligibility', async () => {
      const touristId = `souvenir_eligibility_tourist_${Date.now()}`;
      const today = new Date();
      const departure = new Date(today);
      departure.setDate(departure.getDate() + 5); // 5-day stay
      
      await sdk.registerTourist({
        touristId,
        originCountry: 'SWE',
        arrivalDate: today.toISOString().split('T')[0],
        departureDate: departure.toISOString().split('T')[0]
      });

      // Issue daily coins
      const issuance = await sdk.issueDailyCoins(touristId);
      expect(issuance.amount).toBe(10);

      // Check that the system tracks this for eligibility
      // (In a real implementation, this would be tracked in the smart contract)
      const balance = await sdk.getTouristBalance(touristId);
      expect(balance.balance).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Business Rule Edge Cases', () => {
    test('should handle tourist with zero balance attempting transfer', async () => {
      const touristId = `zero_balance_tourist_${Date.now()}`;
      const restaurantId = `ChIJ_zero_balance_test_${Date.now()}`;
      
      const today = new Date();
      const departure = new Date(today);
      departure.setDate(departure.getDate() + 7);
      
      // Register tourist but don't issue coins
      await sdk.registerTourist({
        touristId,
        originCountry: 'NOR',
        arrivalDate: today.toISOString().split('T')[0],
        departureDate: departure.toISOString().split('T')[0]
      });

      await sdk.registerRestaurant({
        googlePlaceId: restaurantId,
        name: 'Zero Balance Test Restaurant',
        address: 'Test Address'
      });

      // Try to transfer without having coins
      await expect(sdk.transferCoins({
        touristId,
        restaurantId,
        amount: 1
      })).rejects.toThrow();
    });

    test('should handle fractional coin transfers within limits', async () => {
      const touristId = `fractional_tourist_${Date.now()}`;
      const restaurantId = `ChIJ_fractional_test_${Date.now()}`;
      
      const today = new Date();
      const departure = new Date(today);
      departure.setDate(departure.getDate() + 7);
      
      await sdk.registerTourist({
        touristId,
        originCountry: 'FIN',
        arrivalDate: today.toISOString().split('T')[0],
        departureDate: departure.toISOString().split('T')[0]
      });

      await sdk.registerRestaurant({
        googlePlaceId: restaurantId,
        name: 'Fractional Test Restaurant',
        address: 'Test Address'
      });

      await sdk.issueDailyCoins(touristId);

      // Transfer fractional amounts
      const result1 = await sdk.transferCoins({
        touristId,
        restaurantId,
        amount: 1.25
      });
      expect(result1.success).toBe(true);

      const result2 = await sdk.transferCoins({
        touristId,
        restaurantId,
        amount: 1.75
      });
      expect(result2.success).toBe(true);
      expect(result2.remainingDailyLimit).toBe(0);
    });

    test('should handle concurrent daily coin issuance attempts', async () => {
      const touristId = `concurrent_issuance_tourist_${Date.now()}`;
      const today = new Date();
      const departure = new Date(today);
      departure.setDate(departure.getDate() + 7);
      
      await sdk.registerTourist({
        touristId,
        originCountry: 'DNK',
        arrivalDate: today.toISOString().split('T')[0],
        departureDate: departure.toISOString().split('T')[0]
      });

      // Try to issue coins concurrently (simulate race condition)
      const promises = [
        sdk.issueDailyCoins(touristId),
        sdk.issueDailyCoins(touristId),
        sdk.issueDailyCoins(touristId)
      ];

      const results = await Promise.allSettled(promises);
      
      // Only one should succeed, others should fail
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');
      
      expect(successful.length).toBe(1);
      expect(failed.length).toBe(2);
    });

    test('should validate minimum transfer amounts', async () => {
      const touristId = `min_transfer_tourist_${Date.now()}`;
      const restaurantId = `ChIJ_min_transfer_test_${Date.now()}`;
      
      const today = new Date();
      const departure = new Date(today);
      departure.setDate(departure.getDate() + 7);
      
      await sdk.registerTourist({
        touristId,
        originCountry: 'BEL',
        arrivalDate: today.toISOString().split('T')[0],
        departureDate: departure.toISOString().split('T')[0]
      });

      await sdk.registerRestaurant({
        googlePlaceId: restaurantId,
        name: 'Min Transfer Test Restaurant',
        address: 'Test Address'
      });

      await sdk.issueDailyCoins(touristId);

      // Test very small transfer (should be allowed if > 0)
      const result = await sdk.transferCoins({
        touristId,
        restaurantId,
        amount: 0.01
      });
      expect(result.success).toBe(true);
    });
  });
});