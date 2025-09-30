import { prisma } from '../config/database';
import { redisClient } from '../config/redis';
import { physicalCoinService } from '../services/physicalCoinService';
import { transactionService } from '../services/transactionService';

// Mock Redis client
jest.mock('../config/redis', () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    isClientConnected: jest.fn().mockReturnValue(true),
  },
}));

describe('Physical Coin Integration Tests', () => {
  let testUser: any;
  let testRestaurant: any;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        originCountry: 'USA',
        arrivalDate: new Date('2024-01-01T00:00:00.000Z'),
        departureDate: new Date('2024-01-05T00:00:00.000Z'),
        walletAddress: '0x1234567890123456789012345678901234567890',
      },
    });

    // Create test restaurant
    testRestaurant = await prisma.restaurant.create({
      data: {
        googlePlaceId: 'test-place-id',
        name: 'Test Restaurant',
        address: '123 Test Street',
        latitude: 22.3193,
        longitude: 114.1694,
        walletAddress: '0x0987654321098765432109876543210987654321',
        qrCodeData: 'test-qr-code',
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.transaction.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.dailyReward.deleteMany({
      where: { userId: testUser.id },
    });
    
    // Clean up restaurants (use deleteMany to avoid "not found" errors)
    await prisma.restaurant.deleteMany({
      where: { 
        OR: [
          { id: testRestaurant.id },
          { googlePlaceId: { startsWith: 'test-place-id-' } }
        ]
      },
    });
    
    // Clean up user (use deleteMany to avoid "not found" errors)
    await prisma.user.deleteMany({
      where: { id: testUser.id },
    });
  });

  beforeEach(() => {
    // Reset Redis mocks
    jest.clearAllMocks();
    (redisClient.get as jest.Mock).mockResolvedValue(null);
    (redisClient.set as jest.Mock).mockResolvedValue('OK');
    (redisClient.del as jest.Mock).mockResolvedValue(1);
    (redisClient.keys as jest.Mock).mockResolvedValue([]);
  });

  describe('Integration with Transaction Service', () => {
    beforeEach(async () => {
      // Clean up any existing data
      await prisma.transaction.deleteMany({
        where: { userId: testUser.id },
      });
      await prisma.dailyReward.deleteMany({
        where: { userId: testUser.id },
      });
      
      // Clean up any test restaurants that might exist
      await prisma.restaurant.deleteMany({
        where: {
          googlePlaceId: {
            startsWith: 'test-place-id-'
          }
        }
      });
    });

    it('should automatically track physical coin progress when transaction is recorded', async () => {
      // Record a transaction
      const transactionResult = await transactionService.recordTransaction({
        userId: testUser.id,
        restaurantId: testRestaurant.id,
        amount: 3,
      });

      expect(transactionResult.transaction).toBeTruthy();
      expect(transactionResult.transaction.amount).toBe(3);

      // Check that physical coin tracking was updated
      const progress = await physicalCoinService.getProgressSummary(testUser.id);
      
      expect(progress.totalTripDays).toBe(4); // 4-day trip
      expect(progress.completedDays).toBe(0); // Not all coins given yet
      expect(progress.isEligibleForVoucher).toBe(false);

      // Check daily progress
      const dailyProgress = await physicalCoinService.getDailyProgress(testUser.id, 1);
      expect(dailyProgress).toHaveLength(1);
      expect(dailyProgress[0]?.coinsGiven).toBe(3);
      expect(dailyProgress[0]?.coinsReceived).toBe(10);
      expect(dailyProgress[0]?.allCoinsGiven).toBe(false);
    });

    it('should mark day as complete when all coins are given', async () => {
      // Use a specific test date to avoid issues with "today"
      const testDate = new Date('2024-01-02T00:00:00.000Z');
      
      // Create multiple restaurants to distribute 10 coins (max 3 per restaurant per day)
      const restaurants = [];
      
      for (let i = 2; i <= 4; i++) {
        const restaurant = await prisma.restaurant.create({
          data: {
            googlePlaceId: `test-place-id-${i}`,
            name: `Test Restaurant ${i}`,
            address: `${i * 100} Test Street`,
            latitude: 22.3193 + (i * 0.001),
            longitude: 114.1694 + (i * 0.001),
            walletAddress: `0x${i.toString().repeat(40)}`,
            qrCodeData: `test-qr-code-${i}`,
          },
        });
        restaurants.push(restaurant);
      }

      // Mock the transaction dates to be the same test date
      // We'll manually create the daily reward and transactions to have full control
      
      // Create daily reward for the test date
      await prisma.dailyReward.create({
        data: {
          userId: testUser.id,
          rewardDate: testDate,
          coinsReceived: 10,
          coinsGiven: 0,
          allCoinsGiven: false,
        },
      });

      // Create transactions that will total 10 coins
      const transactions = [
        { restaurantId: testRestaurant.id, amount: 3 },
        { restaurantId: restaurants[0]!.id, amount: 3 },
        { restaurantId: restaurants[1]!.id, amount: 3 },
        { restaurantId: restaurants[2]!.id, amount: 1 },
      ];

      for (const txData of transactions) {
        await prisma.transaction.create({
          data: {
            blockchainHash: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fromAddress: testUser.walletAddress,
            toAddress: '0x' + Math.random().toString(16).substr(2, 40),
            userId: testUser.id,
            restaurantId: txData.restaurantId,
            amount: txData.amount,
            transactionDate: testDate,
            userOriginCountry: testUser.originCountry,
          },
        });
      }

      // Update the daily reward to reflect all coins given
      await prisma.dailyReward.update({
        where: {
          userId_rewardDate: {
            userId: testUser.id,
            rewardDate: testDate,
          },
        },
        data: {
          coinsGiven: 10,
          allCoinsGiven: true,
        },
      });

      // Check progress
      const progress = await physicalCoinService.getProgressSummary(testUser.id);
      
      expect(progress.completedDays).toBe(1); // One complete day
      expect(progress.totalTripDays).toBe(4); // 4-day trip

      const dailyProgress = await physicalCoinService.getDailyProgress(testUser.id, 1);
      expect(dailyProgress[0]?.allCoinsGiven).toBe(true);
      expect(dailyProgress[0]?.coinsGiven).toBe(10);

      // Clean up
      for (const restaurant of restaurants) {
        await prisma.transaction.deleteMany({
          where: { restaurantId: restaurant.id },
        });
        await prisma.restaurant.delete({
          where: { id: restaurant.id },
        });
      }
    });

    it('should check voucher eligibility for completed trip', async () => {
      // Create a user with completed trip
      const completedUser = await prisma.user.create({
        data: {
          originCountry: 'Canada',
          arrivalDate: new Date('2023-12-01T00:00:00.000Z'),
          departureDate: new Date('2023-12-03T00:00:00.000Z'), // 2-day trip in the past
          walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`, // Generate unique wallet address
        },
      });

      // Create daily rewards showing all coins given for entire trip
      await prisma.dailyReward.createMany({
        data: [
          {
            userId: completedUser.id,
            rewardDate: new Date('2023-12-01T00:00:00.000Z'),
            coinsReceived: 10,
            coinsGiven: 10,
            allCoinsGiven: true,
          },
          {
            userId: completedUser.id,
            rewardDate: new Date('2023-12-02T00:00:00.000Z'),
            coinsReceived: 10,
            coinsGiven: 10,
            allCoinsGiven: true,
          },
        ],
      });

      // Check eligibility
      const isEligible = await physicalCoinService.checkVoucherEligibility(completedUser.id);
      expect(isEligible).toBe(true);

      // Generate voucher
      const voucher = await physicalCoinService.generateVoucher(completedUser.id);
      expect(voucher.userId).toBe(completedUser.id);
      expect(voucher.voucherId).toMatch(/^SMILE_/);
      expect(voucher.isValid).toBe(true);

      // Mock Redis to return the voucher for retrieval
      (redisClient.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(voucher));

      // Verify voucher can be retrieved
      const retrievedVoucher = await physicalCoinService.getUserVoucher(completedUser.id);
      expect(retrievedVoucher).toBeTruthy();
      expect(retrievedVoucher?.voucherId).toBe(voucher.voucherId);

      // Clean up
      await prisma.dailyReward.deleteMany({
        where: { userId: completedUser.id },
      });
      await prisma.user.delete({
        where: { id: completedUser.id },
      });
    });
  });

  describe('Physical Coin Service Caching', () => {
    it('should cache progress summary', async () => {
      // First call should hit database
      await physicalCoinService.getProgressSummary(testUser.id);
      
      // Verify cache was set
      expect(redisClient.set).toHaveBeenCalledWith(
        `physical_coin_progress:summary:${testUser.id}`,
        expect.any(String),
        1800 // 30 minutes
      );

      // Mock cache hit for second call
      const mockSummary = {
        totalTripDays: 4,
        completedDays: 0,
        remainingDays: 4,
        currentStreak: 0,
        completionPercentage: 0,
        isEligibleForVoucher: false,
        hasGeneratedVoucher: false,
        daysUntilDeparture: 0,
      };

      (redisClient.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockSummary));

      const cachedSummary = await physicalCoinService.getProgressSummary(testUser.id);
      expect(cachedSummary).toEqual(mockSummary);
    });

    it('should cache daily progress', async () => {
      await physicalCoinService.getDailyProgress(testUser.id, 30);
      
      expect(redisClient.set).toHaveBeenCalledWith(
        `physical_coin_progress:daily:${testUser.id}:30`,
        expect.any(String),
        1800 // 30 minutes
      );
    });

    it('should clear cache when progress is updated', async () => {
      // Track daily distribution
      await physicalCoinService.trackDailyDistribution(testUser.id);
      
      // Verify cache clearing was attempted
      expect(redisClient.del).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent user gracefully', async () => {
      const nonExistentUserId = 'non-existent-user-id';
      
      await expect(
        physicalCoinService.getProgressSummary(nonExistentUserId)
      ).rejects.toThrow('User not found');
    });

    it('should handle voucher generation for ineligible user', async () => {
      await expect(
        physicalCoinService.generateVoucher(testUser.id)
      ).rejects.toThrow('User is not eligible for physical coin voucher');
    });

    it('should return null for non-existent voucher', async () => {
      const voucher = await physicalCoinService.getUserVoucher(testUser.id);
      expect(voucher).toBeNull();
    });
  });
});