import { prisma } from '../config/database';
import { redisClient } from '../config/redis';

export class UserService {
  private readonly USER_CACHE_PREFIX = 'user:';
  private readonly USER_CACHE_TTL = 60 * 15; // 15 minutes

  /**
   * Get user by ID with caching
   */
  async getUserById(userId: string) {
    // Try to get from cache first
    const cacheKey = `${this.USER_CACHE_PREFIX}${userId}`;
    const cachedUser = await redisClient.get(cacheKey);
    
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }

    // Get from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        originCountry: true,
        arrivalDate: true,
        departureDate: true,
        walletAddress: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (user) {
      // Cache the user data
      await redisClient.set(cacheKey, JSON.stringify(user), this.USER_CACHE_TTL);
    }

    return user;
  }

  /**
   * Get user by wallet address
   */
  async getUserByWalletAddress(walletAddress: string) {
    return await prisma.user.findUnique({
      where: { walletAddress },
      select: {
        id: true,
        originCountry: true,
        arrivalDate: true,
        departureDate: true,
        walletAddress: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(userId: string) {
    const cacheKey = `${this.USER_CACHE_PREFIX}stats:${userId}`;
    const cachedStats = await redisClient.get(cacheKey);
    
    if (cachedStats) {
      return JSON.parse(cachedStats);
    }

    // Get user with related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        transactions: {
          select: {
            amount: true,
            restaurantId: true,
            createdAt: true,
          },
        },
        dailyRewards: {
          select: {
            rewardDate: true,
            coinsReceived: true,
            coinsGiven: true,
            allCoinsGiven: true,
          },
          orderBy: { rewardDate: 'desc' },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate statistics
    const totalCoinsGiven = user.transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalTransactions = user.transactions.length;
    const uniqueRestaurantsVisited = new Set(user.transactions.map(tx => tx.restaurantId)).size;
    const totalDaysActive = user.dailyRewards.filter(dr => dr.allCoinsGiven).length;
    const currentStreak = this.calculateCurrentStreak(user.dailyRewards);
    
    const daysUntilDeparture = Math.ceil(
      (user.departureDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    const totalTripDays = Math.ceil(
      (user.departureDate.getTime() - user.arrivalDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const isEligibleForPhysicalCoin = this.checkPhysicalCoinEligibility(
      user.dailyRewards,
      user.arrivalDate,
      user.departureDate
    );

    const stats = {
      totalCoinsGiven,
      totalTransactions,
      uniqueRestaurantsVisited,
      totalDaysActive,
      currentStreak,
      daysUntilDeparture: Math.max(0, daysUntilDeparture),
      totalTripDays,
      isEligibleForPhysicalCoin,
      completionPercentage: totalTripDays > 0 ? (totalDaysActive / totalTripDays) * 100 : 0,
    };

    // Cache statistics for 5 minutes
    await redisClient.set(cacheKey, JSON.stringify(stats), 300);

    return stats;
  }

  /**
   * Get user's daily rewards progress
   */
  async getDailyRewardsProgress(userId: string) {
    const dailyRewards = await prisma.dailyReward.findMany({
      where: { userId },
      orderBy: { rewardDate: 'desc' },
      take: 30, // Last 30 days
    });

    return dailyRewards.map(reward => ({
      date: reward.rewardDate,
      coinsReceived: reward.coinsReceived,
      coinsGiven: reward.coinsGiven,
      allCoinsGiven: reward.allCoinsGiven,
      completionPercentage: (reward.coinsGiven / reward.coinsReceived) * 100,
    }));
  }

  /**
   * Get user's transaction history
   */
  async getTransactionHistory(userId: string, limit: number = 20, offset: number = 0) {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        restaurant: {
          select: {
            name: true,
            googlePlaceId: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.transaction.count({
      where: { userId },
    });

    return {
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Update user cache
   */
  async updateUserCache(userId: string) {
    const cacheKey = `${this.USER_CACHE_PREFIX}${userId}`;
    await redisClient.del(cacheKey);
    
    const statsKey = `${this.USER_CACHE_PREFIX}stats:${userId}`;
    await redisClient.del(statsKey);
  }

  /**
   * Calculate current streak of consecutive days with all coins given
   */
  private calculateCurrentStreak(dailyRewards: any[]): number {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedRewards = dailyRewards.sort((a, b) => 
      new Date(b.rewardDate).getTime() - new Date(a.rewardDate).getTime()
    );

    for (let i = 0; i < sortedRewards.length; i++) {
      const rewardDate = new Date(sortedRewards[i].rewardDate);
      rewardDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      // Check if this reward is for the expected date and all coins were given
      if (rewardDate.getTime() === expectedDate.getTime() && sortedRewards[i].allCoinsGiven) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Check if user is eligible for physical coin souvenir
   */
  private checkPhysicalCoinEligibility(
    dailyRewards: any[],
    arrivalDate: Date,
    departureDate: Date
  ): boolean {
    const now = new Date();
    
    // User must have completed their trip
    if (now < departureDate) {
      return false;
    }

    const totalTripDays = Math.ceil(
      (departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const completeDays = dailyRewards.filter(dr => dr.allCoinsGiven).length;
    
    // User must give all coins every day of their trip
    return completeDays >= totalTripDays;
  }
}

export const userService = new UserService();