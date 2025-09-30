import { prisma } from '../config/database';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

export interface RankingParams {
  page?: number;
  limit?: number;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export interface OriginBasedRankingParams extends RankingParams {
  originCountry: string;
}

export interface RestaurantRanking {
  id: string;
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  walletAddress: string;
  totalCoinsReceived: number;
  rank: number;
  distance?: number;
  originSpecificCoins?: number;
  originSpecificRank?: number;
  lastRankingUpdate: Date;
  createdAt: Date;
}

export interface RankingResult {
  rankings: RestaurantRanking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  lastUpdated: Date;
}

export interface RestaurantStatistics {
  restaurantId: string;
  name: string;
  totalCoins: number;
  totalTransactions: number;
  uniqueTourists: number;
  uniqueCountries: number;
  averageCoinsPerTransaction: number;
  rank: number;
  dailyStats: {
    date: string;
    coins: number;
    transactions: number;
    uniqueTourists: number;
  }[];
  originBreakdown: {
    country: string;
    coins: number;
    transactions: number;
    percentage: number;
  }[];
  performanceTrends: {
    period: 'daily' | 'weekly' | 'monthly';
    trend: 'up' | 'down' | 'stable';
    changePercentage: number;
  }[];
}

class RankingService {
  private cachePrefix = 'ranking:';
  private cacheTTL = 60 * 30; // 30 minutes in seconds
  private statisticsCacheTTL = 60 * 60; // 1 hour for statistics

  /**
   * Get overall restaurant rankings based on total smile coins
   */
  async getOverallRankings(params: RankingParams = {}): Promise<RankingResult> {
    try {
      const {
        page = 1,
        limit = 20,
        latitude,
        longitude,
        radius
      } = params;

      const cacheKey = `${this.cachePrefix}overall:${page}:${limit}:${latitude || 'null'}:${longitude || 'null'}:${radius || 'null'}`;
      
      // Check cache first
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const skip = (page - 1) * limit;
      const take = Math.min(limit, 100);

      // Get restaurants with ranking
      let restaurants: any[];
      let total: number;

      // Get all restaurants first, then filter by location if needed
      const query = `
        SELECT 
          r.*,
          ROW_NUMBER() OVER (ORDER BY r.total_coins_received DESC, r.created_at ASC) as rank
        FROM restaurants r
        ORDER BY r.total_coins_received DESC, r.created_at ASC
        LIMIT $1 OFFSET $2
      `;

      [restaurants, total] = await Promise.all([
        prisma.$queryRawUnsafe<any[]>(query, take, skip),
        prisma.restaurant.count()
      ]);

      // Add distance calculation and filtering if location parameters are provided
      if (latitude && longitude && radius) {
        restaurants = restaurants.map(restaurant => {
          const distance = this.calculateDistance(
            latitude, 
            longitude, 
            parseFloat(restaurant.latitude.toString()), 
            parseFloat(restaurant.longitude.toString())
          );
          restaurant.distance = distance;
          logger.info(`Restaurant ${restaurant.name} distance: ${distance}`);
          return restaurant;
        }).filter(restaurant => restaurant.distance <= radius);
        total = restaurants.length;
        logger.info(`Filtered restaurants count: ${total}`);
      }

      // Transform to RestaurantRanking format
      const rankings: RestaurantRanking[] = restaurants.map(restaurant => ({
        id: restaurant.id,
        googlePlaceId: restaurant.google_place_id,
        name: restaurant.name,
        address: restaurant.address,
        latitude: parseFloat(restaurant.latitude.toString()),
        longitude: parseFloat(restaurant.longitude.toString()),
        walletAddress: restaurant.wallet_address,
        totalCoinsReceived: Number(restaurant.total_coins_received),
        rank: Number(restaurant.rank),
        distance: restaurant.distance ? parseFloat(restaurant.distance.toString()) : undefined,
        lastRankingUpdate: restaurant.last_ranking_update,
        createdAt: restaurant.created_at
      }));

      const totalPages = Math.ceil(total / take);
      const result: RankingResult = {
        rankings,
        pagination: {
          page,
          limit: take,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        lastUpdated: new Date()
      };

      // Cache the result
      await this.setCache(cacheKey, result);

      return result;

    } catch (error) {
      logger.error('Error getting overall rankings:', error);
      throw error;
    }
  }

  /**
   * Get origin-based restaurant recommendations using user country data
   */
  async getOriginBasedRankings(params: OriginBasedRankingParams): Promise<RankingResult> {
    try {
      const {
        originCountry,
        page = 1,
        limit = 20,
        latitude,
        longitude,
        radius
      } = params;

      const cacheKey = `${this.cachePrefix}origin:${originCountry}:${page}:${limit}:${latitude || 'null'}:${longitude || 'null'}:${radius || 'null'}`;
      
      // Check cache first
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const skip = (page - 1) * limit;
      const take = Math.min(limit, 100);

      let restaurants: any[];
      let total: number;

      // Always use global origin-based ranking for now, add location filtering later if needed
      const query = `
        WITH origin_stats AS (
          SELECT 
            t.restaurant_id,
            SUM(t.amount) as origin_coins,
            COUNT(*) as origin_transactions
          FROM transactions t
          WHERE t.user_origin_country = $1
          GROUP BY t.restaurant_id
        ),
        ranked_restaurants AS (
          SELECT 
            r.*,
            COALESCE(os.origin_coins, 0) as origin_specific_coins,
            COALESCE(os.origin_transactions, 0) as origin_transactions,
            ROW_NUMBER() OVER (ORDER BY COALESCE(os.origin_coins, 0) DESC, r.total_coins_received DESC, r.created_at ASC) as origin_rank
          FROM restaurants r
          LEFT JOIN origin_stats os ON r.id = os.restaurant_id
        )
        SELECT * FROM ranked_restaurants
        ORDER BY origin_specific_coins DESC, total_coins_received DESC, created_at ASC
        LIMIT $2 OFFSET $3
      `;

      [restaurants, total] = await Promise.all([
        prisma.$queryRawUnsafe<any[]>(query, originCountry, take, skip),
        prisma.restaurant.count()
      ]);

      // Add distance calculation if location parameters are provided
      if (latitude && longitude && radius) {
        restaurants = restaurants.map(restaurant => {
          const distance = this.calculateDistance(
            latitude, 
            longitude, 
            parseFloat(restaurant.latitude.toString()), 
            parseFloat(restaurant.longitude.toString())
          );
          restaurant.distance = distance;
          return restaurant;
        }).filter(restaurant => restaurant.distance <= radius);
        total = restaurants.length;
      }

      // Transform to RestaurantRanking format
      const rankings: RestaurantRanking[] = restaurants.map(restaurant => ({
        id: restaurant.id,
        googlePlaceId: restaurant.google_place_id,
        name: restaurant.name,
        address: restaurant.address,
        latitude: parseFloat(restaurant.latitude.toString()),
        longitude: parseFloat(restaurant.longitude.toString()),
        walletAddress: restaurant.wallet_address,
        totalCoinsReceived: Number(restaurant.total_coins_received),
        rank: Number(restaurant.origin_rank || 0),
        distance: restaurant.distance ? parseFloat(restaurant.distance.toString()) : undefined,
        originSpecificCoins: Number(restaurant.origin_specific_coins || 0),
        originSpecificRank: Number(restaurant.origin_rank || 0),
        lastRankingUpdate: restaurant.last_ranking_update,
        createdAt: restaurant.created_at
      }));

      const totalPages = Math.ceil(total / take);
      const result: RankingResult = {
        rankings,
        pagination: {
          page,
          limit: take,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        lastUpdated: new Date()
      };

      // Cache the result
      await this.setCache(cacheKey, result);

      return result;

    } catch (error) {
      logger.error('Error getting origin-based rankings:', error);
      logger.error('Origin country:', params.originCountry);
      logger.error('Query parameters:', { latitude: params.latitude, longitude: params.longitude, radius: params.radius });
      throw error;
    }
  }

  /**
   * Get nearby restaurants ranking with GPS integration
   */
  async getNearbyRankings(
    latitude: number,
    longitude: number,
    radius: number = 5,
    params: RankingParams = {}
  ): Promise<RankingResult> {
    try {
      const rankingParams: RankingParams = {
        ...params,
        latitude,
        longitude,
        radius
      };

      return this.getOverallRankings(rankingParams);

    } catch (error) {
      logger.error('Error getting nearby rankings:', error);
      throw error;
    }
  }

  /**
   * Get restaurant statistics for web dashboard
   */
  async getRestaurantStatistics(restaurantId: string): Promise<RestaurantStatistics | null> {
    try {
      const cacheKey = `${this.cachePrefix}stats:${restaurantId}`;
      
      // Check cache first
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Get restaurant basic info
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId }
      });

      if (!restaurant) {
        return null;
      }

      // Get overall statistics
      const overallStats = await prisma.transaction.aggregate({
        where: { restaurantId },
        _sum: { amount: true },
        _count: { id: true },
        _avg: { amount: true }
      });

      // Get unique tourists and countries
      const uniqueStats = await prisma.transaction.groupBy({
        by: ['userId', 'userOriginCountry'],
        where: { restaurantId }
      });

      const uniqueTourists = new Set(uniqueStats.map(s => s.userId)).size;
      const uniqueCountries = new Set(uniqueStats.map(s => s.userOriginCountry)).size;

      // Get restaurant rank
      const rankQuery = `
        SELECT COUNT(*) + 1 as rank
        FROM restaurants
        WHERE total_coins_received > $1
      `;
      const rankResult = await prisma.$queryRawUnsafe<{ rank: bigint }[]>(rankQuery, restaurant.totalCoinsReceived);
      const rank = Number(rankResult[0]?.rank || 1);

      // Get daily statistics for the last 30 days
      const dailyStatsQuery = `
        SELECT 
          DATE(transaction_date) as date,
          SUM(amount) as coins,
          COUNT(*) as transactions,
          COUNT(DISTINCT user_id) as unique_tourists
        FROM transactions
        WHERE restaurant_id = $1
          AND transaction_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(transaction_date)
        ORDER BY date DESC
      `;

      const dailyStats = await prisma.$queryRawUnsafe<{
        date: string;
        coins: number;
        transactions: number;
        unique_tourists: number;
      }[]>(dailyStatsQuery, restaurantId);

      // Get origin breakdown
      const originBreakdownQuery = `
        SELECT 
          user_origin_country as country,
          SUM(amount) as coins,
          COUNT(*) as transactions,
          ROUND(
            (SUM(amount) * 100.0 / $2), 2
          ) as percentage
        FROM transactions
        WHERE restaurant_id = $1
        GROUP BY user_origin_country
        ORDER BY coins DESC
      `;

      const originBreakdown = await prisma.$queryRawUnsafe<{
        country: string;
        coins: number;
        transactions: number;
        percentage: number;
      }[]>(originBreakdownQuery, restaurantId, overallStats._sum.amount || 1);

      // Calculate performance trends
      const performanceTrends = await this.calculatePerformanceTrends(restaurantId);

      const statistics: RestaurantStatistics = {
        restaurantId,
        name: restaurant.name,
        totalCoins: overallStats._sum.amount || 0,
        totalTransactions: overallStats._count.id || 0,
        uniqueTourists,
        uniqueCountries,
        averageCoinsPerTransaction: Number(overallStats._avg.amount) || 0,
        rank,
        dailyStats: dailyStats.map(stat => ({
          date: stat.date,
          coins: Number(stat.coins),
          transactions: Number(stat.transactions),
          uniqueTourists: Number(stat.unique_tourists)
        })),
        originBreakdown: originBreakdown.map(breakdown => ({
          country: breakdown.country,
          coins: Number(breakdown.coins),
          transactions: Number(breakdown.transactions),
          percentage: Number(breakdown.percentage)
        })),
        performanceTrends
      };

      // Cache the result
      await this.setCache(cacheKey, statistics, this.statisticsCacheTTL);

      return statistics;

    } catch (error) {
      logger.error(`Error getting restaurant statistics for ${restaurantId}:`, error);
      throw error;
    }
  }

  /**
   * Manual ranking refresh endpoint for demo purposes
   */
  async refreshRankings(): Promise<{ success: boolean; message: string; timestamp: Date }> {
    try {
      logger.info('Manual ranking refresh initiated');

      // Clear all ranking caches
      await this.clearRankingCaches();

      // Update last ranking update timestamp for all restaurants
      await prisma.restaurant.updateMany({
        data: {
          lastRankingUpdate: new Date()
        }
      });

      // Pre-warm cache with top rankings
      await this.getOverallRankings({ page: 1, limit: 50 });

      const timestamp = new Date();
      logger.info(`Manual ranking refresh completed at ${timestamp}`);

      return {
        success: true,
        message: 'Rankings refreshed successfully',
        timestamp
      };

    } catch (error) {
      logger.error('Error refreshing rankings:', error);
      throw error;
    }
  }

  /**
   * Calculate performance trends for a restaurant
   */
  private async calculatePerformanceTrends(restaurantId: string): Promise<RestaurantStatistics['performanceTrends']> {
    try {
      const trends: RestaurantStatistics['performanceTrends'] = [];

      // Daily trend (last 7 days vs previous 7 days)
      const dailyTrendQuery = `
        WITH current_week AS (
          SELECT SUM(amount) as coins
          FROM transactions
          WHERE restaurant_id = $1
            AND transaction_date >= CURRENT_DATE - INTERVAL '7 days'
        ),
        previous_week AS (
          SELECT SUM(amount) as coins
          FROM transactions
          WHERE restaurant_id = $1
            AND transaction_date >= CURRENT_DATE - INTERVAL '14 days'
            AND transaction_date < CURRENT_DATE - INTERVAL '7 days'
        )
        SELECT 
          COALESCE(cw.coins, 0) as current_coins,
          COALESCE(pw.coins, 0) as previous_coins
        FROM current_week cw, previous_week pw
      `;

      const dailyTrendResult = await prisma.$queryRawUnsafe<{
        current_coins: number;
        previous_coins: number;
      }[]>(dailyTrendQuery, restaurantId);

      if (dailyTrendResult.length > 0 && dailyTrendResult[0]) {
        const { current_coins, previous_coins } = dailyTrendResult[0];
        const changePercentage = previous_coins > 0 
          ? ((current_coins - previous_coins) / previous_coins) * 100 
          : current_coins > 0 ? 100 : 0;

        trends.push({
          period: 'daily',
          trend: changePercentage > 5 ? 'up' : changePercentage < -5 ? 'down' : 'stable',
          changePercentage: Number(changePercentage.toFixed(2))
        });
      }

      // Weekly trend (last 4 weeks vs previous 4 weeks)
      const weeklyTrendQuery = `
        WITH current_month AS (
          SELECT SUM(amount) as coins
          FROM transactions
          WHERE restaurant_id = $1
            AND transaction_date >= CURRENT_DATE - INTERVAL '28 days'
        ),
        previous_month AS (
          SELECT SUM(amount) as coins
          FROM transactions
          WHERE restaurant_id = $1
            AND transaction_date >= CURRENT_DATE - INTERVAL '56 days'
            AND transaction_date < CURRENT_DATE - INTERVAL '28 days'
        )
        SELECT 
          COALESCE(cm.coins, 0) as current_coins,
          COALESCE(pm.coins, 0) as previous_coins
        FROM current_month cm, previous_month pm
      `;

      const weeklyTrendResult = await prisma.$queryRawUnsafe<{
        current_coins: number;
        previous_coins: number;
      }[]>(weeklyTrendQuery, restaurantId);

      if (weeklyTrendResult.length > 0 && weeklyTrendResult[0]) {
        const { current_coins, previous_coins } = weeklyTrendResult[0];
        const changePercentage = previous_coins > 0 
          ? ((current_coins - previous_coins) / previous_coins) * 100 
          : current_coins > 0 ? 100 : 0;

        trends.push({
          period: 'weekly',
          trend: changePercentage > 10 ? 'up' : changePercentage < -10 ? 'down' : 'stable',
          changePercentage: Number(changePercentage.toFixed(2))
        });
      }

      return trends;

    } catch (error) {
      logger.warn(`Error calculating performance trends for restaurant ${restaurantId}:`, error);
      return [];
    }
  }

  /**
   * Get data from Redis cache
   */
  private async getFromCache(key: string): Promise<any> {
    try {
      const cached = await redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.warn(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set data in Redis cache with TTL
   */
  private async setCache(key: string, data: any, ttl: number = this.cacheTTL): Promise<void> {
    try {
      await redisClient.set(key, JSON.stringify(data), ttl);
    } catch (error) {
      logger.warn(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Clear ranking-related caches
   */
  private async clearRankingCaches(): Promise<void> {
    try {
      const client = redisClient.getClient();
      const keys = await client.keys(`${this.cachePrefix}*`);
      
      if (keys.length > 0) {
        await client.del(keys);
        logger.info(`Cleared ${keys.length} ranking cache entries`);
      }
    } catch (error) {
      logger.warn('Error clearing ranking caches:', error);
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const rankingService = new RankingService();