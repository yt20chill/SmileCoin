import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

export interface DailyStats {
  date: string;
  coinsReceived: number;
  uniqueTourists: number;
  transactions: number;
  averageCoinsPerTransaction: number;
}

export interface TotalStats {
  totalCoins: number;
  totalTransactions: number;
  uniqueTourists: number;
  averageCoinsPerDay: number;
  averageCoinsPerTransaction: number;
  rankingPosition: number;
  totalRestaurants: number;
  percentileRank: number;
}

export interface OriginStats {
  country: string;
  coinsReceived: number;
  touristCount: number;
  transactionCount: number;
  percentage: number;
  averageCoinsPerTourist: number;
}

export interface TrendData {
  period: string;
  coinsReceived: number;
  uniqueTourists: number;
  transactions: number;
  growthRate: number;
}

export interface ComparisonData {
  restaurantId: string;
  name: string;
  totalCoins: number;
  rankingPosition: number;
  averageCoinsPerDay: number;
  uniqueTourists: number;
}

export interface DashboardFilters {
  startDate?: Date;
  endDate?: Date;
  originCountry?: string;
  period?: 'daily' | 'weekly' | 'monthly';
}

export class DashboardService {
  private readonly CACHE_TTL = 300; // 5 minutes cache

  /**
   * Get daily statistics for a restaurant with date filtering
   */
  async getDailyStats(restaurantId: string, filters: DashboardFilters = {}): Promise<DailyStats[]> {
    try {
      const cacheKey = `dashboard:daily:${restaurantId}:${JSON.stringify(filters)}`;
      
      // Try to get from cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info(`Daily stats cache hit for restaurant ${restaurantId}`);
        return JSON.parse(cached);
      }

      const { startDate, endDate, originCountry } = filters;
      
      // Build where clause
      const whereClause: Prisma.TransactionWhereInput = {
        restaurantId,
        ...(startDate && { transactionDate: { gte: startDate } }),
        ...(endDate && { transactionDate: { lte: endDate } }),
        ...(originCountry && { userOriginCountry: originCountry }),
      };

      // If both startDate and endDate are provided, use between
      if (startDate && endDate) {
        whereClause.transactionDate = {
          gte: startDate,
          lte: endDate,
        };
      }

      const dailyStats = await prisma.transaction.groupBy({
        by: ['transactionDate'],
        where: whereClause,
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
          userId: true,
        },
        _avg: {
          amount: true,
        },
        orderBy: {
          transactionDate: 'asc',
        },
      });

      // Get unique tourists per day
      const uniqueTouristsPerDay = await prisma.transaction.groupBy({
        by: ['transactionDate'],
        where: whereClause,
        _count: {
          userId: true,
        },
      });

      const uniqueTouristsMap = new Map(
        uniqueTouristsPerDay.map(item => [
          item.transactionDate?.toISOString().split('T')[0] || '',
          item._count.userId
        ])
      );

      const result: DailyStats[] = dailyStats.map(stat => {
        const dateStr = stat.transactionDate?.toISOString().split('T')[0] || '';
        return {
          date: dateStr,
          coinsReceived: stat._sum.amount || 0,
          uniqueTourists: uniqueTouristsMap.get(dateStr) || 0,
          transactions: stat._count.id,
          averageCoinsPerTransaction: Number((stat._avg.amount || 0).toFixed(2)),
        };
      });

      // Cache the result
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      
      logger.info(`Generated daily stats for restaurant ${restaurantId}: ${result.length} days`);
      return result;

    } catch (error) {
      logger.error('Error getting daily stats:', error);
      throw new Error('Failed to get daily statistics');
    }
  }

  /**
   * Get total statistics for a restaurant
   */
  async getTotalStats(restaurantId: string, filters: DashboardFilters = {}): Promise<TotalStats> {
    try {
      const cacheKey = `dashboard:total:${restaurantId}:${JSON.stringify(filters)}`;
      
      // Try to get from cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info(`Total stats cache hit for restaurant ${restaurantId}`);
        return JSON.parse(cached);
      }

      const { startDate, endDate, originCountry } = filters;
      
      // Build where clause
      const whereClause: Prisma.TransactionWhereInput = {
        restaurantId,
        ...(startDate && endDate && {
          transactionDate: {
            gte: startDate,
            lte: endDate,
          },
        }),
        ...(originCountry && { userOriginCountry: originCountry }),
      };

      // Get total statistics
      const totalStats = await prisma.transaction.aggregate({
        where: whereClause,
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
        _avg: {
          amount: true,
        },
      });

      // Get unique tourists count
      const uniqueTourists = await prisma.transaction.findMany({
        where: whereClause,
        select: {
          userId: true,
        },
        distinct: ['userId'],
      });

      // Get restaurant ranking
      const allRestaurants = await prisma.restaurant.findMany({
        select: {
          id: true,
          totalCoinsReceived: true,
        },
        orderBy: {
          totalCoinsReceived: 'desc',
        },
      });

      const rankingPosition = allRestaurants.findIndex(r => r.id === restaurantId) + 1;
      const totalRestaurants = allRestaurants.length;
      const percentileRank = totalRestaurants > 0 ? 
        Math.round(((totalRestaurants - rankingPosition + 1) / totalRestaurants) * 100) : 0;

      // Calculate average coins per day
      let averageCoinsPerDay = 0;
      if (startDate && endDate) {
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        averageCoinsPerDay = daysDiff > 0 ? (totalStats._sum.amount || 0) / daysDiff : 0;
      } else {
        // Use restaurant creation date to calculate average
        const restaurant = await prisma.restaurant.findUnique({
          where: { id: restaurantId },
          select: { createdAt: true },
        });
        
        if (restaurant) {
          const daysSinceCreation = Math.ceil((new Date().getTime() - restaurant.createdAt.getTime()) / (1000 * 60 * 60 * 24));
          averageCoinsPerDay = daysSinceCreation > 0 ? (totalStats._sum.amount || 0) / daysSinceCreation : 0;
        }
      }

      const result: TotalStats = {
        totalCoins: totalStats._sum.amount || 0,
        totalTransactions: totalStats._count.id,
        uniqueTourists: uniqueTourists.length,
        averageCoinsPerDay: Number(averageCoinsPerDay.toFixed(2)),
        averageCoinsPerTransaction: Number((totalStats._avg.amount || 0).toFixed(2)),
        rankingPosition,
        totalRestaurants,
        percentileRank,
      };

      // Cache the result
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      
      logger.info(`Generated total stats for restaurant ${restaurantId}`);
      return result;

    } catch (error) {
      logger.error('Error getting total stats:', error);
      throw new Error('Failed to get total statistics');
    }
  }

  /**
   * Get tourist origin breakdown for a restaurant
   */
  async getOriginBreakdown(restaurantId: string, filters: DashboardFilters = {}): Promise<OriginStats[]> {
    try {
      const cacheKey = `dashboard:origins:${restaurantId}:${JSON.stringify(filters)}`;
      
      // Try to get from cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info(`Origin breakdown cache hit for restaurant ${restaurantId}`);
        return JSON.parse(cached);
      }

      const { startDate, endDate } = filters;
      
      // Build where clause
      const whereClause: Prisma.TransactionWhereInput = {
        restaurantId,
        ...(startDate && endDate && {
          transactionDate: {
            gte: startDate,
            lte: endDate,
          },
        }),
      };

      const originStats = await prisma.transaction.groupBy({
        by: ['userOriginCountry'],
        where: whereClause,
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
          userId: true,
        },
        orderBy: {
          _sum: {
            amount: 'desc',
          },
        },
      });

      // Get unique tourists per country
      const uniqueTouristsPerCountry = await prisma.transaction.groupBy({
        by: ['userOriginCountry'],
        where: whereClause,
        _count: {
          userId: true,
        },
      });

      const uniqueTouristsMap = new Map(
        uniqueTouristsPerCountry.map(item => [
          item.userOriginCountry,
          item._count.userId
        ])
      );

      // Calculate total coins for percentage calculation
      const totalCoins = originStats.reduce((sum, stat) => sum + (stat._sum.amount || 0), 0);

      const result: OriginStats[] = originStats.map(stat => {
        const coinsReceived = stat._sum.amount || 0;
        const touristCount = uniqueTouristsMap.get(stat.userOriginCountry) || 0;
        
        return {
          country: stat.userOriginCountry,
          coinsReceived,
          touristCount,
          transactionCount: stat._count.id,
          percentage: totalCoins > 0 ? Number(((coinsReceived / totalCoins) * 100).toFixed(1)) : 0,
          averageCoinsPerTourist: touristCount > 0 ? Number((coinsReceived / touristCount).toFixed(2)) : 0,
        };
      });

      // Cache the result
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      
      logger.info(`Generated origin breakdown for restaurant ${restaurantId}: ${result.length} countries`);
      return result;

    } catch (error) {
      logger.error('Error getting origin breakdown:', error);
      throw new Error('Failed to get origin breakdown');
    }
  }

  /**
   * Get performance trends with historical data analysis
   */
  async getPerformanceTrends(
    restaurantId: string, 
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    filters: DashboardFilters = {}
  ): Promise<TrendData[]> {
    try {
      const cacheKey = `dashboard:trends:${restaurantId}:${period}:${JSON.stringify(filters)}`;
      
      // Try to get from cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info(`Performance trends cache hit for restaurant ${restaurantId}`);
        return JSON.parse(cached);
      }

      const { startDate, endDate } = filters;
      
      // Default to last 30 days if no date range provided
      const defaultEndDate = endDate || new Date();
      const defaultStartDate = startDate || new Date(defaultEndDate.getTime() - (30 * 24 * 60 * 60 * 1000));

      // Build where clause
      const whereClause: Prisma.TransactionWhereInput = {
        restaurantId,
        transactionDate: {
          gte: defaultStartDate,
          lte: defaultEndDate,
        },
      };

      // Determine date truncation based on period
      let dateTrunc: string;
      switch (period) {
        case 'weekly':
          dateTrunc = 'week';
          break;
        case 'monthly':
          dateTrunc = 'month';
          break;
        default:
          dateTrunc = 'day';
      }

      // Use raw query for date truncation
      const queryString = `
        SELECT 
          DATE_TRUNC('${dateTrunc}', transaction_date) as period,
          SUM(amount) as coins_received,
          COUNT(DISTINCT user_id) as unique_tourists,
          COUNT(*) as transactions
        FROM transactions 
        WHERE restaurant_id = $1
          AND transaction_date >= $2
          AND transaction_date <= $3
        GROUP BY DATE_TRUNC('${dateTrunc}', transaction_date)
        ORDER BY period ASC
      `;

      const trends = await prisma.$queryRawUnsafe<Array<{
        period: Date;
        coins_received: bigint;
        unique_tourists: bigint;
        transactions: bigint;
      }>>(queryString, restaurantId, defaultStartDate, defaultEndDate);

      // Calculate growth rates
      const result: TrendData[] = trends.map((trend, index) => {
        const coinsReceived = Number(trend.coins_received);
        let growthRate = 0;

        if (index > 0) {
          const previousTrend = trends[index - 1];
          if (previousTrend) {
            const previousCoins = Number(previousTrend.coins_received);
            if (previousCoins > 0) {
              growthRate = Number((((coinsReceived - previousCoins) / previousCoins) * 100).toFixed(2));
            }
          }
        }

        return {
          period: trend.period?.toISOString().split('T')[0] || '',
          coinsReceived,
          uniqueTourists: Number(trend.unique_tourists),
          transactions: Number(trend.transactions),
          growthRate,
        };
      });

      // Cache the result
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      
      logger.info(`Generated performance trends for restaurant ${restaurantId}: ${result.length} periods`);
      return result;

    } catch (error) {
      logger.error('Error getting performance trends:', error);
      throw new Error('Failed to get performance trends');
    }
  }

  /**
   * Get restaurant comparison and benchmarking data
   */
  async getRestaurantComparison(
    restaurantId: string, 
    compareWith: 'similar' | 'top' | 'nearby' = 'similar',
    limit: number = 10
  ): Promise<ComparisonData[]> {
    try {
      const cacheKey = `dashboard:comparison:${restaurantId}:${compareWith}:${limit}`;
      
      // Try to get from cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info(`Restaurant comparison cache hit for restaurant ${restaurantId}`);
        return JSON.parse(cached);
      }

      let restaurants: Array<{
        id: string;
        name: string;
        totalCoinsReceived: number;
        createdAt: Date;
        latitude: any;
        longitude: any;
      }>;

      const targetRestaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
          id: true,
          name: true,
          totalCoinsReceived: true,
          createdAt: true,
          latitude: true,
          longitude: true,
        },
      });

      if (!targetRestaurant) {
        throw new Error('Restaurant not found');
      }

      switch (compareWith) {
        case 'top':
          // Get top restaurants by total coins
          restaurants = await prisma.restaurant.findMany({
            select: {
              id: true,
              name: true,
              totalCoinsReceived: true,
              createdAt: true,
              latitude: true,
              longitude: true,
            },
            orderBy: {
              totalCoinsReceived: 'desc',
            },
            take: limit,
          });
          break;

        case 'nearby':
          // Get nearby restaurants (simplified - in production would use proper geo queries)
          restaurants = await prisma.restaurant.findMany({
            select: {
              id: true,
              name: true,
              totalCoinsReceived: true,
              createdAt: true,
              latitude: true,
              longitude: true,
            },
            where: {
              id: { not: restaurantId },
            },
            orderBy: {
              totalCoinsReceived: 'desc',
            },
            take: limit,
          });
          break;

        default: // 'similar'
          // Get restaurants with similar performance (±50% of total coins)
          const minCoins = Math.max(0, targetRestaurant.totalCoinsReceived * 0.5);
          const maxCoins = targetRestaurant.totalCoinsReceived * 1.5;
          
          restaurants = await prisma.restaurant.findMany({
            select: {
              id: true,
              name: true,
              totalCoinsReceived: true,
              createdAt: true,
              latitude: true,
              longitude: true,
            },
            where: {
              id: { not: restaurantId },
              totalCoinsReceived: {
                gte: minCoins,
                lte: maxCoins,
              },
            },
            orderBy: {
              totalCoinsReceived: 'desc',
            },
            take: limit,
          });
      }

      // Get transaction stats for each restaurant
      const comparisonData: ComparisonData[] = [];
      
      for (const restaurant of restaurants) {
        // Get unique tourists count
        const uniqueTourists = await prisma.transaction.findMany({
          where: { restaurantId: restaurant.id },
          select: { userId: true },
          distinct: ['userId'],
        });

        // Calculate average coins per day
        const daysSinceCreation = Math.ceil(
          (new Date().getTime() - restaurant.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        const averageCoinsPerDay = daysSinceCreation > 0 ? 
          restaurant.totalCoinsReceived / daysSinceCreation : 0;

        // Get ranking position
        const allRestaurants = await prisma.restaurant.findMany({
          select: { id: true },
          orderBy: { totalCoinsReceived: 'desc' },
        });
        const rankingPosition = allRestaurants.findIndex(r => r.id === restaurant.id) + 1;

        comparisonData.push({
          restaurantId: restaurant.id,
          name: restaurant.name,
          totalCoins: restaurant.totalCoinsReceived,
          rankingPosition,
          averageCoinsPerDay: Number(averageCoinsPerDay.toFixed(2)),
          uniqueTourists: uniqueTourists.length,
        });
      }

      // Cache the result
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(comparisonData));
      
      logger.info(`Generated restaurant comparison for ${restaurantId}: ${comparisonData.length} restaurants`);
      return comparisonData;

    } catch (error) {
      logger.error('Error getting restaurant comparison:', error);
      throw new Error('Failed to get restaurant comparison data');
    }
  }

  /**
   * Clear dashboard cache for a specific restaurant
   */
  async clearRestaurantCache(restaurantId: string): Promise<void> {
    try {
      const pattern = `dashboard:*:${restaurantId}:*`;
      const keys = await redisClient.keys(pattern);
      
      if (keys.length > 0) {
        await redisClient.del(keys);
        logger.info(`Cleared ${keys.length} dashboard cache entries for restaurant ${restaurantId}`);
      }
    } catch (error) {
      logger.error('Error clearing restaurant dashboard cache:', error);
    }
  }

  /**
   * Clear all dashboard cache
   */
  async clearAllCache(): Promise<void> {
    try {
      const pattern = 'dashboard:*';
      const keys = await redisClient.keys(pattern);
      
      if (keys.length > 0) {
        await redisClient.del(keys);
        logger.info(`Cleared ${keys.length} dashboard cache entries`);
      }
    } catch (error) {
      logger.error('Error clearing all dashboard cache:', error);
    }
  }
}

export const dashboardService = new DashboardService();