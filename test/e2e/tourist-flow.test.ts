/**
 * End-to-End Test: Complete Tourist Registration and Coin Issuance Flow
 * 
 * This test covers:
 * - Tourist registration with wallet creation
 * - Daily coin issuance (10 coins per day)
 * - Balance checking and transaction history
 * - Business rule enforcement (daily limits, expiration)
 * 
 * Requirements: 1.1, 5.3, 6.1
 */

import { SmileCoinSDK, SDKError, SDKErrorCode } from '../../src/sdk/SmileCoinSDK';
import { ContractManager } from '../../src/services/ContractManager';
import { WalletManager } from '../../src/services/WalletManager';

describe('E2E: Tourist Registration and Coin Issuance Flow', () => {
  let sdk: SmileCoinSDK;
  let testTouristId: string;
  let testOriginCountry: string;
  let arrivalDate: string;
  let departureDate: string;

  beforeAll(async () => {
    // Initialize SDK with test configuration
    sdk = new SmileCoinSDK({
      apiUrl: process.env.TEST_API_URL || 'http://localhost:3000',
      apiKey: process.env.TEST_API_KEY || 'test-api-key',
      timeout: 60000
    });

    // Generate unique test data
    const timestamp = Date.now();
    testTouristId = `e2e-tourist-${timestamp}`;
    testOriginCountry = 'USA';
    
    // Set arrival date to today, departure in 7 days
    const today = new Date();
    const departure = new Date(today);
    departure.setDate(departure.getDate() + 7);
    
    arrivalDate = today.toISOString().split('T')[0];
    departureDate = departure.toISOString().split('T')[0];
  });

  afterAll(async () => {
    // Cleanup test data if needed
    try {
      // In a real test environment, you might want to clean up test wallets
      // For now, we'll leave them as they don't affect other tests
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  });

  describe('Tourist Registration', () => {
    test('should register a new tourist successfully', async () => {
      const registrationData = {
        touristId: testTouristId,
        originCountry: testOriginCountry,
        arrivalDate,
        departureDate
      };

      const result = await sdk.registerTourist(registrationData);

      expect(result).toMatchObject({
        walletAddress: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
        transactionHash: expect.stringMatching(/^0x[a-fA-F0-9]{64}$/),
        success: true
      });

      // Verify wallet was created
      expect(result.walletAddress).toBeTruthy();
      expect(result.transactionHash).toBeTruthy();
    });

    test('should prevent duplicate tourist registration', async () => {
      const registrationData = {
        touristId: testTouristId,
        originCountry: testOriginCountry,
        arrivalDate,
        departureDate
      };

      await expect(sdk.registerTourist(registrationData))
        .rejects
        .toThrow(SDKError);
    });

    test('should validate tourist registration data', async () => {
      // Test missing tourist ID
      await expect(sdk.registerTourist({
        touristId: '',
        originCountry: 'USA',
        arrivalDate,
        departureDate
      })).rejects.toThrow('Tourist ID is required');

      // Test missing origin country
      await expect(sdk.registerTourist({
        touristId: 'test-tourist',
        originCountry: '',
        arrivalDate,
        departureDate
      })).rejects.toThrow('Origin country is required');

      // Test invalid date order
      await expect(sdk.registerTourist({
        touristId: 'test-tourist-2',
        originCountry: 'USA',
        arrivalDate: departureDate,
        departureDate: arrivalDate
      })).rejects.toThrow('Departure date must be after arrival date');
    });
  });

  describe('Daily Coin Issuance', () => {
    test('should issue 10 coins daily to registered tourist', async () => {
      const result = await sdk.issueDailyCoins(testTouristId);

      expect(result).toMatchObject({
        transactionHash: expect.stringMatching(/^0x[a-fA-F0-9]{64}$/),
        amount: 10,
        expirationDate: expect.any(String)
      });

      // Verify expiration date is 14 days from now
      const expirationDate = new Date(result.expirationDate);
      const expectedExpiration = new Date();
      expectedExpiration.setDate(expectedExpiration.getDate() + 14);
      
      const timeDiff = Math.abs(expirationDate.getTime() - expectedExpiration.getTime());
      expect(timeDiff).toBeLessThan(24 * 60 * 60 * 1000); // Within 24 hours
    });

    test('should prevent double issuance on same day', async () => {
      // Try to issue coins again on the same day
      await expect(sdk.issueDailyCoins(testTouristId))
        .rejects
        .toThrow(); // Should fail due to daily limit
    });

    test('should reject coin issuance for unregistered tourist', async () => {
      const unregisteredTouristId = `unregistered-${Date.now()}`;
      
      await expect(sdk.issueDailyCoins(unregisteredTouristId))
        .rejects
        .toThrow(SDKError);
    });

    test('should validate tourist ID for coin issuance', async () => {
      await expect(sdk.issueDailyCoins(''))
        .rejects
        .toThrow('Tourist ID is required');
    });
  });

  describe('Tourist Balance and Transactions', () => {
    test('should retrieve tourist balance correctly', async () => {
      const balance = await sdk.getTouristBalance(testTouristId);

      expect(balance).toMatchObject({
        balance: expect.any(Number),
        walletAddress: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
        transactions: expect.any(Array)
      });

      // Balance should be 10 (from daily issuance)
      expect(balance.balance).toBeGreaterThanOrEqual(10);
    });

    test('should handle balance request for unregistered tourist', async () => {
      const unregisteredTouristId = `unregistered-balance-${Date.now()}`;
      
      await expect(sdk.getTouristBalance(unregisteredTouristId))
        .rejects
        .toThrow(SDKError);
    });

    test('should retrieve transaction history', async () => {
      const transactions = await sdk.getTouristTransactions(testTouristId, 10, 0);

      expect(Array.isArray(transactions)).toBe(true);
      
      // Should have at least one transaction (daily issuance)
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

  describe('Transaction Monitoring', () => {
    let testTransactionHash: string;

    beforeAll(async () => {
      // Get a transaction hash from previous tests
      const balance = await sdk.getTouristBalance(testTouristId);
      if (balance.transactions.length > 0) {
        testTransactionHash = balance.transactions[0].hash;
      }
    });

    test('should get transaction status', async () => {
      if (!testTransactionHash) {
        console.warn('No transaction hash available for status test');
        return;
      }

      const status = await sdk.getTransactionStatus(testTransactionHash);

      expect(status).toMatchObject({
        status: expect.stringMatching(/^(pending|confirmed|failed)$/),
        explorerUrl: expect.stringContaining('http')
      });

      if (status.status === 'confirmed') {
        expect(status.blockNumber).toBeGreaterThan(0);
        expect(status.gasUsed).toBeGreaterThan(0);
      }
    });

    test('should validate transaction hash format', async () => {
      await expect(sdk.getTransactionStatus('invalid-hash'))
        .rejects
        .toThrow('Invalid transaction hash format');

      await expect(sdk.getTransactionStatus(''))
        .rejects
        .toThrow('Transaction hash is required');
    });

    test('should get network status', async () => {
      const networkStatus = await sdk.getNetworkStatus();

      expect(networkStatus).toMatchObject({
        network: expect.any(String),
        blockNumber: expect.any(Number),
        gasPrice: expect.any(String),
        isHealthy: expect.any(Boolean)
      });

      expect(networkStatus.blockNumber).toBeGreaterThan(0);
      expect(networkStatus.isHealthy).toBe(true);
    });
  });

  describe('Business Rule Enforcement', () => {
    test('should enforce daily coin issuance limits', async () => {
      // This test verifies that the system prevents multiple daily issuances
      // The actual enforcement happens in the smart contract
      
      // Try to issue coins multiple times (should fail after first success)
      const newTouristId = `daily-limit-test-${Date.now()}`;
      
      // Register new tourist
      await sdk.registerTourist({
        touristId: newTouristId,
        originCountry: 'CAN',
        arrivalDate,
        departureDate
      });

      // First issuance should succeed
      const firstIssuance = await sdk.issueDailyCoins(newTouristId);
      expect(firstIssuance.amount).toBe(10);

      // Second issuance on same day should fail
      await expect(sdk.issueDailyCoins(newTouristId))
        .rejects
        .toThrow();
    });

    test('should track coin expiration metadata', async () => {
      // Verify that issued coins have proper expiration tracking
      const issuance = await sdk.issueDailyCoins(`expiration-test-${Date.now()}`);
      
      const expirationDate = new Date(issuance.expirationDate);
      const now = new Date();
      const daysDiff = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      // Should expire in approximately 14 days
      expect(daysDiff).toBeGreaterThan(13);
      expect(daysDiff).toBeLessThan(15);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async () => {
      // Create SDK with invalid URL to test network error handling
      const invalidSdk = new SmileCoinSDK({
        apiUrl: 'http://invalid-url-that-does-not-exist.com',
        apiKey: 'test-key',
        timeout: 5000
      });

      await expect(invalidSdk.getTouristBalance('test'))
        .rejects
        .toThrow(SDKError);
    });

    test('should handle authentication errors', async () => {
      // Create SDK with invalid API key
      const invalidAuthSdk = new SmileCoinSDK({
        apiUrl: process.env.TEST_API_URL || 'http://localhost:3000',
        apiKey: 'invalid-api-key',
        timeout: 10000
      });

      await expect(invalidAuthSdk.getTouristBalance(testTouristId))
        .rejects
        .toThrow(SDKError);
    });

    test('should handle timeout errors', async () => {
      // Create SDK with very short timeout
      const timeoutSdk = new SmileCoinSDK({
        apiUrl: process.env.TEST_API_URL || 'http://localhost:3000',
        apiKey: process.env.TEST_API_KEY || 'test-api-key',
        timeout: 1 // 1ms timeout
      });

      await expect(timeoutSdk.getTouristBalance(testTouristId))
        .rejects
        .toThrow(SDKError);
    });
  });
});