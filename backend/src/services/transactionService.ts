import { prisma } from '../config/database';
import { PaginationParams } from '../types';

interface RecordTransactionParams {
  userId: string;
  restaurantId: string;
  amount: number;
}

interface TransactionValidation {
  canTransact: boolean;
  reason?: string;
  dailyCoinsGiven: number;
  dailyCoinsRemaining: number;
  coinsGivenToRestaurantToday: number;
  maxCoinsPerRestaurantPerDay: number;
}

interface DailyDistribution {
  date: string;
  coinsReceived: number;
  coinsGiven: number;
  coinsRemaining: number;
  allCoinsGiven: boolean;
  restaurantsVisited: number;
}

interface DailyHistory {
  totalDays: number;
  completedDays: number;
  currentStreak: number;
  dailyRecords: Array<{
    date: string;
    coinsGiven: number;
    allCoinsGiven: boolean;
    restaurantsVisited: number;
  }>;
}

export class TransactionService {
  private readonly MAX_COINS_PER_RESTAURANT_PER_DAY = 3;
  private readonly DAILY_COINS_LIMIT = 10;

  /**
   * Record a new transaction with validation
   */
  async recordTransaction(params: RecordTransactionParams) {
    const { userId, restaurantId, amount } = params;

    // Validate the transaction first
    const validation = await this.validateTransaction(userId, restaurantId, amount);
    
    if (!validation.canTransact) {
      throw new Error(validation.reason || 'Transaction not allowed');
    }

    // Get user and restaurant details
    const [user, restaurant] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.restaurant.findUnique({ where: { id: restaurantId } })
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the transaction record (without blockchain hash for now)
      const transaction = await tx.transaction.create({
        data: {
          blockchainHash: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Temporary hash
          fromAddress: user.walletAddress,
          toAddress: restaurant.walletAddress,
          userId,
          restaurantId,
          amount,
          transactionDate: new Date(),
          userOriginCountry: user.originCountry,
        },
        include: {
          user: {
            select: {
              id: true,
              originCountry: true,
              walletAddress: true,
            }
          },
          restaurant: {
            select: {
              id: true,
              name: true,
              googlePlaceId: true,
              walletAddress: true,
            }
          }
        }
      });

      // Update restaurant's total coins received
      await tx.restaurant.update({
        where: { id: restaurantId },
        data: {
          totalCoinsReceived: {
            increment: amount
          }
        }
      });

      // Update or create daily reward record
      const dailyReward = await tx.dailyReward.upsert({
        where: {
          userId_rewardDate: {
            userId,
            rewardDate: today
          }
        },
        update: {
          coinsGiven: {
            increment: amount
          },
          allCoinsGiven: validation.dailyCoinsGiven + amount >= this.DAILY_COINS_LIMIT
        },
        create: {
          userId,
          rewardDate: today,
          coinsReceived: this.DAILY_COINS_LIMIT,
          coinsGiven: amount,
          allCoinsGiven: amount >= this.DAILY_COINS_LIMIT
        }
      });

      return {
        transaction,
        dailyReward,
        validation: {
          ...validation,
          dailyCoinsGiven: validation.dailyCoinsGiven + amount,
          dailyCoinsRemaining: validation.dailyCoinsRemaining - amount
        }
      };
    });

    return result;
  }

  /**
   * Validate if a transaction can be performed
   */
  async validateTransaction(userId: string, restaurantId: string, amount: number): Promise<TransactionValidation> {
    // Check if user and restaurant exist
    const [user, restaurant] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.restaurant.findUnique({ where: { id: restaurantId } })
    ]);

    if (!user) {
      return {
        canTransact: false,
        reason: 'User not found',
        dailyCoinsGiven: 0,
        dailyCoinsRemaining: 0,
        coinsGivenToRestaurantToday: 0,
        maxCoinsPerRestaurantPerDay: this.MAX_COINS_PER_RESTAURANT_PER_DAY
      };
    }

    if (!restaurant) {
      return {
        canTransact: false,
        reason: 'Restaurant not found',
        dailyCoinsGiven: 0,
        dailyCoinsRemaining: 0,
        coinsGivenToRestaurantToday: 0,
        maxCoinsPerRestaurantPerDay: this.MAX_COINS_PER_RESTAURANT_PER_DAY
      };
    }

    // Check amount validity
    if (amount < 1 || amount > 3) {
      return {
        canTransact: false,
        reason: 'Amount must be between 1 and 3 coins',
        dailyCoinsGiven: 0,
        dailyCoinsRemaining: 0,
        coinsGivenToRestaurantToday: 0,
        maxCoinsPerRestaurantPerDay: this.MAX_COINS_PER_RESTAURANT_PER_DAY
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get actual coins given today from transactions (most accurate)
    const dailyCoinsGivenResult = await prisma.transaction.aggregate({
      where: {
        userId,
        transactionDate: {
          gte: today,
          lt: tomorrow
        }
      },
      _sum: {
        amount: true
      }
    });

    const dailyCoinsGiven = dailyCoinsGivenResult._sum.amount || 0;
    const dailyCoinsRemaining = this.DAILY_COINS_LIMIT - dailyCoinsGiven;

    // Check daily coin limit
    if (dailyCoinsGiven + amount > this.DAILY_COINS_LIMIT) {
      return {
        canTransact: false,
        reason: `Daily coin limit exceeded. You have ${dailyCoinsRemaining} coins remaining today`,
        dailyCoinsGiven,
        dailyCoinsRemaining,
        coinsGivenToRestaurantToday: 0,
        maxCoinsPerRestaurantPerDay: this.MAX_COINS_PER_RESTAURANT_PER_DAY
      };
    }

    // Check restaurant daily limit
    const coinsGivenToRestaurantToday = await prisma.transaction.aggregate({
      where: {
        userId,
        restaurantId,
        transactionDate: {
          gte: today,
          lt: tomorrow
        }
      },
      _sum: {
        amount: true
      }
    });

    const totalCoinsToRestaurantToday = coinsGivenToRestaurantToday._sum.amount || 0;

    if (totalCoinsToRestaurantToday + amount > this.MAX_COINS_PER_RESTAURANT_PER_DAY) {
      return {
        canTransact: false,
        reason: `Cannot give more than ${this.MAX_COINS_PER_RESTAURANT_PER_DAY} coins per restaurant per day. You have already given ${totalCoinsToRestaurantToday} coins to this restaurant today`,
        dailyCoinsGiven,
        dailyCoinsRemaining,
        coinsGivenToRestaurantToday: totalCoinsToRestaurantToday,
        maxCoinsPerRestaurantPerDay: this.MAX_COINS_PER_RESTAURANT_PER_DAY
      };
    }

    return {
      canTransact: true,
      dailyCoinsGiven,
      dailyCoinsRemaining,
      coinsGivenToRestaurantToday: totalCoinsToRestaurantToday,
      maxCoinsPerRestaurantPerDay: this.MAX_COINS_PER_RESTAURANT_PER_DAY
    };
  }

  /**
   * Get transaction history for a user with pagination
   */
  async getUserTransactionHistory(userId: string, pagination: PaginationParams) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              googlePlaceId: true,
              address: true
            }
          }
        },
        orderBy: { transactionDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.transaction.count({
        where: { userId }
      })
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get transaction history for a restaurant with pagination
   */
  async getRestaurantTransactionHistory(restaurantId: string, pagination: PaginationParams) {
    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { restaurantId },
        include: {
          user: {
            select: {
              id: true,
              originCountry: true,
              walletAddress: true
            }
          }
        },
        orderBy: { transactionDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.transaction.count({
        where: { restaurantId }
      })
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get user's daily coin distribution for a specific date
   */
  async getUserDailyDistribution(userId: string, dateString?: string): Promise<DailyDistribution> {
    const targetDate = dateString ? new Date(dateString + 'T00:00:00.000Z') : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get daily reward record
    const dailyReward = await prisma.dailyReward.findUnique({
      where: {
        userId_rewardDate: {
          userId,
          rewardDate: targetDate
        }
      }
    });

    // Count unique restaurants visited on this date
    const restaurantsVisited = await prisma.transaction.groupBy({
      by: ['restaurantId'],
      where: {
        userId,
        transactionDate: {
          gte: targetDate,
          lt: nextDay
        }
      }
    });

    const coinsReceived = dailyReward?.coinsReceived || 0;
    const coinsGiven = dailyReward?.coinsGiven || 0;
    const coinsRemaining = Math.max(0, coinsReceived - coinsGiven);
    const allCoinsGiven = dailyReward?.allCoinsGiven || false;

    return {
      date: dateString || targetDate.toISOString().split('T')[0]!,
      coinsReceived,
      coinsGiven,
      coinsRemaining,
      allCoinsGiven,
      restaurantsVisited: restaurantsVisited.length
    };
  }

  /**
   * Get user's complete daily history
   */
  async getUserDailyHistory(userId: string): Promise<DailyHistory> {
    // Get user to determine their stay period
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get all daily rewards for this user
    const dailyRewards = await prisma.dailyReward.findMany({
      where: { userId },
      orderBy: { rewardDate: 'desc' }
    });

    // Calculate statistics
    const totalDays = dailyRewards.length;
    const completedDays = dailyRewards.filter(reward => reward.allCoinsGiven).length;

    // Calculate current streak (consecutive days with all coins given)
    let currentStreak = 0;
    for (const reward of dailyRewards) {
      if (reward.allCoinsGiven) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Get restaurant visit counts for each day
    const dailyRecords = await Promise.all(
      dailyRewards.map(async (reward) => {
        const nextDay = new Date(reward.rewardDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const restaurantsVisited = await prisma.transaction.groupBy({
          by: ['restaurantId'],
          where: {
            userId,
            transactionDate: {
              gte: reward.rewardDate,
              lt: nextDay
            }
          }
        });

        return {
          date: reward.rewardDate.toISOString().split('T')[0]!,
          coinsGiven: reward.coinsGiven,
          allCoinsGiven: reward.allCoinsGiven,
          restaurantsVisited: restaurantsVisited.length
        };
      })
    );

    return {
      totalDays,
      completedDays,
      currentStreak,
      dailyRecords
    };
  }
}

export const transactionService = new TransactionService();