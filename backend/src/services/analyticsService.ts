import { prisma } from '../config/database';
import { DashboardMetrics, RestaurantAnalytics } from '../types/analytics';

export class AnalyticsService {
  /**
   * Get restaurant analytics data from the view
   */
  async getRestaurantAnalytics(limit?: number): Promise<RestaurantAnalytics[]> {
    const query = `
      SELECT * FROM restaurant_analytics
      ${limit ? `LIMIT ${limit}` : ''}
    `;
    
    return await prisma.$queryRawUnsafe<RestaurantAnalytics[]>(query);
  }

  /**
   * Get analytics for a specific restaurant
   */
  async getRestaurantAnalyticsById(restaurantId: string): Promise<RestaurantAnalytics | null> {
    const query = `
      SELECT * FROM restaurant_analytics
      WHERE id = $1
    `;
    
    const result = await prisma.$queryRawUnsafe<RestaurantAnalytics[]>(query, restaurantId);
    return result[0] || null;
  }

  /**
   * Get top performing restaurants
   */
  async getTopRestaurants(limit: number = 10): Promise<RestaurantAnalytics[]> {
    const query = `
      SELECT * FROM restaurant_analytics
      ORDER BY total_coins_received DESC
      LIMIT $1
    `;
    
    return await prisma.$queryRawUnsafe<RestaurantAnalytics[]>(query, limit);
  }

  /**
   * Get most active restaurants (by recent activity)
   */
  async getMostActiveRestaurants(limit: number = 10): Promise<RestaurantAnalytics[]> {
    const query = `
      SELECT * FROM restaurant_analytics
      ORDER BY activity_score DESC
      LIMIT $1
    `;
    
    return await prisma.$queryRawUnsafe<RestaurantAnalytics[]>(query, limit);
  }

  /**
   * Get dashboard metrics summary
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    // Get total counts
    const totalRestaurants = await prisma.restaurant.count();
    const totalTransactions = await prisma.transaction.count();
    
    // Get total coins distributed
    const totalCoinsResult = await prisma.transaction.aggregate({
      _sum: {
        amount: true
      }
    });
    
    // Get active restaurants today
    const activeRestaurantsToday = await prisma.transaction.groupBy({
      by: ['restaurantId'],
      where: {
        transactionDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    // Get top restaurants
    const topRestaurants = await this.getTopRestaurants(5);

    // Get recent activity (last 7 days)
    const recentActivityQuery = `
      SELECT 
        DATE(transaction_date) as date,
        COUNT(*) as transactions,
        SUM(amount) as coins
      FROM transactions
      WHERE transaction_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(transaction_date)
      ORDER BY date DESC
    `;
    
    const recentActivity = await prisma.$queryRawUnsafe<{
      date: string;
      transactions: number;
      coins: number;
    }[]>(recentActivityQuery);

    return {
      totalRestaurants,
      totalTransactions,
      totalCoinsDistributed: totalCoinsResult._sum.amount || 0,
      activeRestaurantsToday: activeRestaurantsToday.length,
      topRestaurants,
      recentActivity: recentActivity.map(item => ({
        date: item.date,
        transactions: Number(item.transactions),
        coins: Number(item.coins)
      }))
    };
  }

  /**
   * Get restaurants by location (within radius)
   */
  async getRestaurantsByLocation(
    latitude: number, 
    longitude: number, 
    radiusKm: number = 10
  ): Promise<RestaurantAnalytics[]> {
    // Using Haversine formula for distance calculation
    const query = `
      SELECT *,
        (
          6371 * acos(
            cos(radians($1)) * 
            cos(radians(latitude)) * 
            cos(radians(longitude) - radians($2)) + 
            sin(radians($1)) * 
            sin(radians(latitude))
          )
        ) AS distance_km
      FROM restaurant_analytics
      WHERE (
        6371 * acos(
          cos(radians($1)) * 
          cos(radians(latitude)) * 
          cos(radians(longitude) - radians($2)) + 
          sin(radians($1)) * 
          sin(radians(latitude))
        )
      ) <= $3
      ORDER BY distance_km ASC
    `;
    
    return await prisma.$queryRawUnsafe<RestaurantAnalytics[]>(
      query, 
      latitude, 
      longitude, 
      radiusKm
    );
  }

  /**
   * Get country-wise statistics
   */
  async getCountryStatistics() {
    const query = `
      SELECT 
        user_origin_country as country,
        COUNT(*) as total_transactions,
        SUM(amount) as total_coins,
        COUNT(DISTINCT restaurant_id) as restaurants_visited,
        COUNT(DISTINCT user_id) as unique_users
      FROM transactions
      GROUP BY user_origin_country
      ORDER BY total_coins DESC
    `;
    
    return await prisma.$queryRawUnsafe<{
      country: string;
      total_transactions: number;
      total_coins: number;
      restaurants_visited: number;
      unique_users: number;
    }[]>(query);
  }
}