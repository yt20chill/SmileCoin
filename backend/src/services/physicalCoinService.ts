import { prisma } from '../config/database';
import { redisClient } from '../config/redis';

export interface DailyProgress {
  date: Date;
  coinsReceived: number;
  coinsGiven: number;
  allCoinsGiven: boolean;
  completionPercentage: number;
}

export interface ProgressSummary {
  totalTripDays: number;
  completedDays: number;
  remainingDays: number;
  currentStreak: number;
  completionPercentage: number;
  isEligibleForVoucher: boolean;
  hasGeneratedVoucher: boolean;
  daysUntilDeparture: number;
}

export interface VoucherInfo {
  voucherId: string;
  userId: string;
  generatedAt: Date;
  qrCode: string;
  collectionInstructions: string;
  expiresAt: Date;
  isValid: boolean;
}

export class PhysicalCoinService {
  private readonly PROGRESS_CACHE_PREFIX = 'physical_coin_progress:';
  private readonly VOUCHER_CACHE_PREFIX = 'voucher:';
  private readonly CACHE_TTL = 60 * 30; // 30 minutes

  /**
   * Track daily coin distribution for a user
   */
  async trackDailyDistribution(userId: string, date: Date = new Date()): Promise<void> {
    const rewardDate = new Date(date);
    rewardDate.setUTCHours(0, 0, 0, 0);

    // Check if daily reward already exists
    const existingReward = await prisma.dailyReward.findUnique({
      where: {
        userId_rewardDate: {
          userId,
          rewardDate,
        },
      },
    });

    if (!existingReward) {
      // Create new daily reward entry
      await prisma.dailyReward.create({
        data: {
          userId,
          rewardDate,
          coinsReceived: 10, // Default daily coins
          coinsGiven: 0,
          allCoinsGiven: false,
        },
      });
    }

    // Clear cache to ensure fresh data
    await this.clearUserProgressCache(userId);
  }

  /**
   * Update coins given for a specific day
   */
  async updateCoinsGiven(userId: string, amount: number, date: Date = new Date()): Promise<void> {
    const rewardDate = new Date(date);
    rewardDate.setUTCHours(0, 0, 0, 0);

    const dailyReward = await prisma.dailyReward.findUnique({
      where: {
        userId_rewardDate: {
          userId,
          rewardDate,
        },
      },
    });

    if (!dailyReward) {
      // Create the daily reward if it doesn't exist
      await this.trackDailyDistribution(userId, date);
    }

    // Update coins given
    const updatedReward = await prisma.dailyReward.update({
      where: {
        userId_rewardDate: {
          userId,
          rewardDate,
        },
      },
      data: {
        coinsGiven: {
          increment: amount,
        },
      },
    });

    // Check if all coins have been given
    const allCoinsGiven = updatedReward.coinsGiven >= updatedReward.coinsReceived;
    
    if (allCoinsGiven && !updatedReward.allCoinsGiven) {
      await prisma.dailyReward.update({
        where: {
          userId_rewardDate: {
            userId,
            rewardDate,
          },
        },
        data: {
          allCoinsGiven: true,
        },
      });
    }

    // Clear cache to ensure fresh data
    await this.clearUserProgressCache(userId);
  }

  /**
   * Get user's progress summary
   */
  async getProgressSummary(userId: string): Promise<ProgressSummary> {
    const cacheKey = `${this.PROGRESS_CACHE_PREFIX}summary:${userId}`;
    const cachedSummary = await redisClient.get(cacheKey);
    
    if (cachedSummary) {
      return JSON.parse(cachedSummary);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dailyRewards: {
          orderBy: { rewardDate: 'asc' },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    const arrivalDate = new Date(user.arrivalDate);
    const departureDate = new Date(user.departureDate);

    // Calculate trip duration
    const totalTripDays = Math.ceil(
      (departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const completedDays = user.dailyRewards.filter(dr => dr.allCoinsGiven).length;
    const daysUntilDeparture = Math.max(0, Math.ceil(
      (departureDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    ));

    const remainingDays = Math.max(0, totalTripDays - completedDays);
    const completionPercentage = totalTripDays > 0 ? (completedDays / totalTripDays) * 100 : 0;
    const currentStreak = this.calculateCurrentStreak(user.dailyRewards);

    // Check voucher eligibility and generation status
    const isEligibleForVoucher = this.checkVoucherEligibilityInternal(
      user.dailyRewards,
      arrivalDate,
      departureDate,
      now
    );

    const hasGeneratedVoucher = await this.hasUserGeneratedVoucher(userId);

    const summary: ProgressSummary = {
      totalTripDays,
      completedDays,
      remainingDays,
      currentStreak,
      completionPercentage,
      isEligibleForVoucher,
      hasGeneratedVoucher,
      daysUntilDeparture,
    };

    // Cache the summary
    await redisClient.set(cacheKey, JSON.stringify(summary), this.CACHE_TTL);

    return summary;
  }

  /**
   * Get detailed daily progress
   */
  async getDailyProgress(userId: string, limit: number = 30): Promise<DailyProgress[]> {
    const cacheKey = `${this.PROGRESS_CACHE_PREFIX}daily:${userId}:${limit}`;
    const cachedProgress = await redisClient.get(cacheKey);
    
    if (cachedProgress) {
      return JSON.parse(cachedProgress);
    }

    const dailyRewards = await prisma.dailyReward.findMany({
      where: { userId },
      orderBy: { rewardDate: 'desc' },
      take: limit,
    });

    const progress: DailyProgress[] = dailyRewards.map(reward => ({
      date: reward.rewardDate,
      coinsReceived: reward.coinsReceived,
      coinsGiven: reward.coinsGiven,
      allCoinsGiven: reward.allCoinsGiven,
      completionPercentage: reward.coinsReceived > 0 
        ? (reward.coinsGiven / reward.coinsReceived) * 100 
        : 0,
    }));

    // Cache the progress
    await redisClient.set(cacheKey, JSON.stringify(progress), this.CACHE_TTL);

    return progress;
  }

  /**
   * Check if user is eligible for voucher
   */
  async checkVoucherEligibility(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dailyRewards: true,
      },
    });

    if (!user) {
      return false;
    }

    const now = new Date();
    return this.checkVoucherEligibilityInternal(
      user.dailyRewards,
      user.arrivalDate,
      user.departureDate,
      now
    );
  }

  /**
   * Generate voucher for eligible user
   */
  async generateVoucher(userId: string): Promise<VoucherInfo> {
    // Check eligibility first
    const isEligible = await this.checkVoucherEligibility(userId);
    if (!isEligible) {
      throw new Error('User is not eligible for physical coin voucher');
    }

    // Check if voucher already exists
    const existingVoucher = await this.getUserVoucher(userId);
    if (existingVoucher) {
      return existingVoucher;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate voucher ID and QR code
    const voucherId = `SMILE_${userId.slice(-8).toUpperCase()}_${Date.now()}`;
    const qrCode = this.generateVoucherQRCode(voucherId, userId);
    
    // Set expiration date (30 days from generation)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const voucherInfo: VoucherInfo = {
      voucherId,
      userId,
      generatedAt: new Date(),
      qrCode,
      collectionInstructions: this.getCollectionInstructions(),
      expiresAt,
      isValid: true,
    };

    // Store voucher in cache (in a real system, this would be in database)
    const voucherKey = `${this.VOUCHER_CACHE_PREFIX}${userId}`;
    await redisClient.set(voucherKey, JSON.stringify(voucherInfo), 60 * 60 * 24 * 30); // 30 days

    // Clear progress cache to update hasGeneratedVoucher status
    await this.clearUserProgressCache(userId);

    return voucherInfo;
  }

  /**
   * Get user's voucher if it exists
   */
  async getUserVoucher(userId: string): Promise<VoucherInfo | null> {
    const voucherKey = `${this.VOUCHER_CACHE_PREFIX}${userId}`;
    const cachedVoucher = await redisClient.get(voucherKey);
    
    if (cachedVoucher) {
      const voucher = JSON.parse(cachedVoucher);
      
      // Check if voucher is still valid
      if (new Date(voucher.expiresAt) > new Date()) {
        return voucher;
      } else {
        // Remove expired voucher
        await redisClient.del(voucherKey);
        return null;
      }
    }

    return null;
  }

  /**
   * Check if user has generated a voucher
   */
  private async hasUserGeneratedVoucher(userId: string): Promise<boolean> {
    const voucher = await this.getUserVoucher(userId);
    return voucher !== null;
  }

  /**
   * Calculate current streak of consecutive completed days
   */
  private calculateCurrentStreak(dailyRewards: any[]): number {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedRewards = dailyRewards
      .filter(dr => dr.allCoinsGiven)
      .sort((a, b) => new Date(b.rewardDate).getTime() - new Date(a.rewardDate).getTime());

    for (let i = 0; i < sortedRewards.length; i++) {
      const rewardDate = new Date(sortedRewards[i].rewardDate);
      rewardDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (rewardDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Check voucher eligibility logic (internal method)
   */
  private checkVoucherEligibilityInternal(
    dailyRewards: any[],
    arrivalDate: Date,
    departureDate: Date,
    currentDate: Date
  ): boolean {
    // User must have completed their trip
    if (currentDate < departureDate) {
      return false;
    }

    const totalTripDays = Math.ceil(
      (departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const completeDays = dailyRewards.filter(dr => dr.allCoinsGiven).length;
    
    // User must give all coins every day of their trip
    return completeDays >= totalTripDays;
  }

  /**
   * Generate QR code data for voucher
   */
  private generateVoucherQRCode(voucherId: string, userId: string): string {
    // In a real system, this would generate an actual QR code
    // For now, return the data that would be encoded
    return JSON.stringify({
      type: 'PHYSICAL_COIN_VOUCHER',
      voucherId,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get collection instructions for physical coin
   */
  private getCollectionInstructions(): string {
    return `
Congratulations! You've earned a physical smile coin souvenir!

Collection Instructions:
1. Present this voucher QR code at any participating Hong Kong Tourism Board office
2. Bring a valid ID matching your registration details
3. Voucher expires 30 days from generation date
4. Collection hours: Monday-Friday 9:00 AM - 5:00 PM

Participating Locations:
- Hong Kong Tourism Board Visitor Centre (Tsim Sha Tsui)
- Hong Kong International Airport Tourist Information
- Central District Tourism Office

For questions, contact: tourism@hk.gov (demo contact)
    `.trim();
  }

  /**
   * Clear user progress cache
   */
  private async clearUserProgressCache(userId: string): Promise<void> {
    const keys = [
      `${this.PROGRESS_CACHE_PREFIX}summary:${userId}`,
      `${this.PROGRESS_CACHE_PREFIX}daily:${userId}:*`,
    ];

    for (const key of keys) {
      if (key.includes('*')) {
        // Handle wildcard keys
        const matchingKeys = await redisClient.keys(key);
        if (matchingKeys.length > 0) {
          // Delete keys one by one to avoid spread operator issues
          for (const matchingKey of matchingKeys) {
            await redisClient.del(matchingKey);
          }
        }
      } else {
        await redisClient.del(key);
      }
    }
  }
}

export const physicalCoinService = new PhysicalCoinService();