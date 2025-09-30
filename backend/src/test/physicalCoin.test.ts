import { prisma } from '../config/database';
import { redisClient } from '../config/redis';
import { physicalCoinService } from '../services/physicalCoinService';

// Mock Redis client
jest.mock('../config/redis', () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
  },
}));

describe('PhysicalCoinService', () => {
  let testUser: any;
  let testUser2: any;

  beforeAll(async () => {
    // Clean up any existing test data first (in correct order due to foreign keys)
    await prisma.transaction.deleteMany({
      where: {
        fromAddress: {
          in: [
            '0x1234567890123456789012345678901234567890',
            '0x0987654321098765432109876543210987654321',
          ],
        },
      },
    });
    
    await prisma.dailyReward.deleteMany({
      where: {
        user: {
          walletAddress: {
            in: [
              '0x1234567890123456789012345678901234567890',
              '0x0987654321098765432109876543210987654321',
            ],
          },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        walletAddress: {
          in: [
            '0x1234567890123456789012345678901234567890',
            '0x0987654321098765432109876543210987654321',
          ],
        },
      },
    });

    // Create test users
    testUser = await prisma.user.create({
      data: {
        originCountry: 'USA',
        arrivalDate: new Date('2024-01-01'),
        departureDate: new Date('2024-01-05'), // 4-day trip
        walletAddress: '0x1234567890123456789012345678901234567890',
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        originCountry: 'Canada',
        arrivalDate: new Date('2024-01-01'),
        departureDate: new Date('2024-01-10'), // 9-day trip
        walletAddress: '0x0987654321098765432109876543210987654321',
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.dailyReward.deleteMany({
      where: {
        userId: {
          in: [testUser.id, testUser2.id],
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: [testUser.id, testUser2.id],
        },
      },
    });
  });

  beforeEach(async () => {
    // Clean up any existing daily rewards to avoid constraint violations
    await prisma.dailyReward.deleteMany({
      where: {
        userId: {
          in: [testUser.id, testUser2.id],
        },
      },
    });

    // Reset Redis mocks
    jest.clearAllMocks();
    (redisClient.get as jest.Mock).mockResolvedValue(null);
    (redisClient.set as jest.Mock).mockResolvedValue('OK');
    (redisClient.del as jest.Mock).mockResolvedValue(1);
    (redisClient.keys as jest.Mock).mockResolvedValue([]);
  });

  describe('trackDailyDistribution', () => {
    it('should create a new daily reward entry', async () => {
      const testDate = new Date('2024-01-01T00:00:00.000Z');
      
      await physicalCoinService.trackDailyDistribution(testUser.id, testDate);

      const dailyReward = await prisma.dailyReward.findUnique({
        where: {
          userId_rewardDate: {
            userId: testUser.id,
            rewardDate: testDate,
          },
        },
      });

      expect(dailyReward).toBeTruthy();
      expect(dailyReward?.coinsReceived).toBe(10);
      expect(dailyReward?.coinsGiven).toBe(0);
      expect(dailyReward?.allCoinsGiven).toBe(false);
    });

    it('should not create duplicate entries for the same date', async () => {
      const testDate = new Date('2024-01-02T00:00:00.000Z');
      
      // Track twice for the same date
      await physicalCoinService.trackDailyDistribution(testUser.id, testDate);
      await physicalCoinService.trackDailyDistribution(testUser.id, testDate);

      const dailyRewards = await prisma.dailyReward.findMany({
        where: {
          userId: testUser.id,
          rewardDate: testDate,
        },
      });

      expect(dailyRewards).toHaveLength(1);
    });
  });

  describe('updateCoinsGiven', () => {
    beforeEach(async () => {
      // Clean up first to avoid constraint violations
      await prisma.dailyReward.deleteMany({
        where: { userId: testUser.id },
      });

      // Create a daily reward entry for testing
      await prisma.dailyReward.create({
        data: {
          userId: testUser.id,
          rewardDate: new Date('2024-01-03T00:00:00.000Z'),
          coinsReceived: 10,
          coinsGiven: 0,
          allCoinsGiven: false,
        },
      });
    });

    it('should update coins given and mark as complete when all coins are given', async () => {
      const testDate = new Date('2024-01-03T00:00:00.000Z');
      
      // Give 5 coins
      await physicalCoinService.updateCoinsGiven(testUser.id, 5, testDate);
      
      let dailyReward = await prisma.dailyReward.findUnique({
        where: {
          userId_rewardDate: {
            userId: testUser.id,
            rewardDate: testDate,
          },
        },
      });

      expect(dailyReward?.coinsGiven).toBe(5);
      expect(dailyReward?.allCoinsGiven).toBe(false);

      // Give remaining 5 coins
      await physicalCoinService.updateCoinsGiven(testUser.id, 5, testDate);
      
      dailyReward = await prisma.dailyReward.findUnique({
        where: {
          userId_rewardDate: {
            userId: testUser.id,
            rewardDate: testDate,
          },
        },
      });

      expect(dailyReward?.coinsGiven).toBe(10);
      expect(dailyReward?.allCoinsGiven).toBe(true);
    });

    it('should create daily reward if it does not exist', async () => {
      const testDate = new Date('2024-01-04T00:00:00.000Z');
      
      await physicalCoinService.updateCoinsGiven(testUser.id, 3, testDate);

      const dailyReward = await prisma.dailyReward.findUnique({
        where: {
          userId_rewardDate: {
            userId: testUser.id,
            rewardDate: testDate,
          },
        },
      });

      expect(dailyReward).toBeTruthy();
      expect(dailyReward?.coinsGiven).toBe(3);
      expect(dailyReward?.coinsReceived).toBe(10);
    });
  });

  describe('getProgressSummary', () => {
    beforeEach(async () => {
      // Clean up any existing daily rewards for testUser2
      await prisma.dailyReward.deleteMany({
        where: { userId: testUser2.id },
      });

      // Create test daily rewards for a 9-day trip
      const dailyRewards = [
        { date: '2024-01-01', coinsGiven: 10, allCoinsGiven: true },
        { date: '2024-01-02', coinsGiven: 10, allCoinsGiven: true },
        { date: '2024-01-03', coinsGiven: 8, allCoinsGiven: false },
        { date: '2024-01-04', coinsGiven: 10, allCoinsGiven: true },
        { date: '2024-01-05', coinsGiven: 10, allCoinsGiven: true },
      ];

      for (const reward of dailyRewards) {
        await prisma.dailyReward.create({
          data: {
            userId: testUser2.id,
            rewardDate: new Date(reward.date),
            coinsReceived: 10,
            coinsGiven: reward.coinsGiven,
            allCoinsGiven: reward.allCoinsGiven,
          },
        });
      }
    });

    it('should return correct progress summary', async () => {
      const summary = await physicalCoinService.getProgressSummary(testUser2.id);

      expect(summary.totalTripDays).toBe(9);
      expect(summary.completedDays).toBe(4); // 4 days with all coins given
      expect(summary.completionPercentage).toBeCloseTo(44.44, 2);
      expect(summary.isEligibleForVoucher).toBe(false); // Trip not completed yet
      expect(summary.hasGeneratedVoucher).toBe(false);
    });

    it('should use cached data when available', async () => {
      const mockSummary = {
        totalTripDays: 9,
        completedDays: 4,
        remainingDays: 5,
        currentStreak: 2,
        completionPercentage: 44.44,
        isEligibleForVoucher: false,
        hasGeneratedVoucher: false,
        daysUntilDeparture: 0,
      };

      (redisClient.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockSummary));

      const summary = await physicalCoinService.getProgressSummary(testUser2.id);

      expect(summary).toEqual(mockSummary);
      expect(redisClient.get).toHaveBeenCalledWith(`physical_coin_progress:summary:${testUser2.id}`);
    });
  });

  describe('getDailyProgress', () => {
    beforeEach(async () => {
      // Clean up and create test data
      await prisma.dailyReward.deleteMany({
        where: { userId: testUser.id },
      });

      await prisma.dailyReward.createMany({
        data: [
          {
            userId: testUser.id,
            rewardDate: new Date('2024-01-01T00:00:00.000Z'),
            coinsReceived: 10,
            coinsGiven: 10,
            allCoinsGiven: true,
          },
          {
            userId: testUser.id,
            rewardDate: new Date('2024-01-02T00:00:00.000Z'),
            coinsReceived: 10,
            coinsGiven: 7,
            allCoinsGiven: false,
          },
        ],
      });
    });

    it('should return daily progress with correct calculations', async () => {
      const progress = await physicalCoinService.getDailyProgress(testUser.id, 10);

      expect(progress).toHaveLength(2);
      
      // Most recent first (desc order)
      expect(progress[0]?.date).toEqual(new Date('2024-01-02T00:00:00.000Z'));
      expect(progress[0]?.coinsReceived).toBe(10);
      expect(progress[0]?.coinsGiven).toBe(7);
      expect(progress[0]?.allCoinsGiven).toBe(false);
      expect(progress[0]?.completionPercentage).toBe(70);

      expect(progress[1]?.date).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(progress[1]?.coinsReceived).toBe(10);
      expect(progress[1]?.coinsGiven).toBe(10);
      expect(progress[1]?.allCoinsGiven).toBe(true);
      expect(progress[1]?.completionPercentage).toBe(100);
    });
  });

  describe('checkVoucherEligibility', () => {
    it('should return false for incomplete trip', async () => {
      const isEligible = await physicalCoinService.checkVoucherEligibility(testUser2.id);
      expect(isEligible).toBe(false);
    });

    it('should return true for completed trip with all coins given', async () => {
      // Create a user with a completed trip
      const completedUser = await prisma.user.create({
        data: {
          originCountry: 'UK',
          arrivalDate: new Date('2023-12-01'),
          departureDate: new Date('2023-12-03'), // 2-day trip in the past
          walletAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        },
      });

      // Create daily rewards showing all coins given
      await prisma.dailyReward.createMany({
        data: [
          {
            userId: completedUser.id,
            rewardDate: new Date('2023-12-01'),
            coinsReceived: 10,
            coinsGiven: 10,
            allCoinsGiven: true,
          },
          {
            userId: completedUser.id,
            rewardDate: new Date('2023-12-02'),
            coinsReceived: 10,
            coinsGiven: 10,
            allCoinsGiven: true,
          },
        ],
      });

      const isEligible = await physicalCoinService.checkVoucherEligibility(completedUser.id);
      expect(isEligible).toBe(true);

      // Clean up
      await prisma.dailyReward.deleteMany({
        where: { userId: completedUser.id },
      });
      await prisma.user.delete({
        where: { id: completedUser.id },
      });
    });
  });

  describe('generateVoucher', () => {
    it('should throw error for ineligible user', async () => {
      await expect(
        physicalCoinService.generateVoucher(testUser2.id)
      ).rejects.toThrow('User is not eligible for physical coin voucher');
    });

    it('should generate voucher for eligible user', async () => {
      // Create an eligible user
      const eligibleUser = await prisma.user.create({
        data: {
          originCountry: 'Australia',
          arrivalDate: new Date('2023-11-01'),
          departureDate: new Date('2023-11-03'), // 2-day trip in the past
          walletAddress: '0xfedcbafedcbafedcbafedcbafedcbafedcbafedcba',
        },
      });

      // Create daily rewards showing all coins given
      await prisma.dailyReward.createMany({
        data: [
          {
            userId: eligibleUser.id,
            rewardDate: new Date('2023-11-01'),
            coinsReceived: 10,
            coinsGiven: 10,
            allCoinsGiven: true,
          },
          {
            userId: eligibleUser.id,
            rewardDate: new Date('2023-11-02'),
            coinsReceived: 10,
            coinsGiven: 10,
            allCoinsGiven: true,
          },
        ],
      });

      const voucher = await physicalCoinService.generateVoucher(eligibleUser.id);

      expect(voucher.userId).toBe(eligibleUser.id);
      expect(voucher.voucherId).toMatch(/^SMILE_/);
      expect(voucher.qrCode).toBeTruthy();
      expect(voucher.collectionInstructions).toContain('Hong Kong Tourism Board');
      expect(voucher.isValid).toBe(true);
      expect(new Date(voucher.expiresAt)).toBeInstanceOf(Date);

      // Verify voucher was stored in Redis
      expect(redisClient.set).toHaveBeenCalledWith(
        `voucher:${eligibleUser.id}`,
        expect.any(String),
        60 * 60 * 24 * 30 // 30 days
      );

      // Clean up
      await prisma.dailyReward.deleteMany({
        where: { userId: eligibleUser.id },
      });
      await prisma.user.delete({
        where: { id: eligibleUser.id },
      });
    });

    it('should return existing voucher if already generated', async () => {
      // First make the user eligible
      const eligibleUser = await prisma.user.create({
        data: {
          originCountry: 'Germany',
          arrivalDate: new Date('2023-10-01'),
          departureDate: new Date('2023-10-03'), // 2-day trip in the past
          walletAddress: '0x1111111111111111111111111111111111111111',
        },
      });

      // Create daily rewards showing all coins given
      await prisma.dailyReward.createMany({
        data: [
          {
            userId: eligibleUser.id,
            rewardDate: new Date('2023-10-01'),
            coinsReceived: 10,
            coinsGiven: 10,
            allCoinsGiven: true,
          },
          {
            userId: eligibleUser.id,
            rewardDate: new Date('2023-10-02'),
            coinsReceived: 10,
            coinsGiven: 10,
            allCoinsGiven: true,
          },
        ],
      });

      const existingVoucher = {
        voucherId: 'SMILE_TEST_123',
        userId: eligibleUser.id,
        generatedAt: new Date().toISOString(),
        qrCode: 'test-qr-code',
        collectionInstructions: 'test instructions',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isValid: true,
      };

      (redisClient.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingVoucher));

      const voucher = await physicalCoinService.generateVoucher(eligibleUser.id);

      expect(voucher).toEqual(existingVoucher);

      // Clean up
      await prisma.dailyReward.deleteMany({
        where: { userId: eligibleUser.id },
      });
      await prisma.user.delete({
        where: { id: eligibleUser.id },
      });
    });
  });

  describe('getUserVoucher', () => {
    it('should return null when no voucher exists', async () => {
      // Ensure Redis returns null
      (redisClient.get as jest.Mock).mockResolvedValueOnce(null);
      
      const voucher = await physicalCoinService.getUserVoucher(testUser.id);
      expect(voucher).toBeNull();
    });

    it('should return voucher when it exists and is valid', async () => {
      const validVoucher = {
        voucherId: 'SMILE_TEST_456',
        userId: testUser.id,
        generatedAt: new Date().toISOString(),
        qrCode: 'test-qr-code',
        collectionInstructions: 'test instructions',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        isValid: true,
      };

      (redisClient.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(validVoucher));

      const voucher = await physicalCoinService.getUserVoucher(testUser.id);

      expect(voucher).toEqual(validVoucher);
    });

    it('should return null and delete expired voucher', async () => {
      const expiredVoucher = {
        voucherId: 'SMILE_TEST_789',
        userId: testUser.id,
        generatedAt: new Date().toISOString(),
        qrCode: 'test-qr-code',
        collectionInstructions: 'test instructions',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        isValid: true,
      };

      (redisClient.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(expiredVoucher));

      const voucher = await physicalCoinService.getUserVoucher(testUser.id);

      expect(voucher).toBeNull();
      expect(redisClient.del).toHaveBeenCalledWith(`voucher:${testUser.id}`);
    });
  });
});