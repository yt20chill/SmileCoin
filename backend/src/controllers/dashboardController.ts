import { NextFunction, Request, Response } from 'express';
import { DashboardFilters, dashboardService } from '../services/dashboardService';
import { logger } from '../utils/logger';

export class DashboardController {
  /**
   * GET /api/v1/restaurants/:id/dashboard/daily-stats
   * Get daily statistics for a restaurant with date filtering
   */
  async getDailyStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: restaurantId } = req.params;
      const { startDate, endDate, originCountry } = req.query;

      if (!restaurantId) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Restaurant ID is required'
        });
        return;
      }

      const filters: DashboardFilters = {};
      
      if (startDate) {
        filters.startDate = new Date(startDate as string);
        if (isNaN(filters.startDate.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: 'Invalid start date format'
          });
          return;
        }
      }

      if (endDate) {
        filters.endDate = new Date(endDate as string);
        if (isNaN(filters.endDate.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: 'Invalid end date format'
          });
          return;
        }
      }

      if (originCountry) {
        filters.originCountry = originCountry as string;
      }

      logger.info(`Daily stats request for restaurant ${restaurantId} with filters:`, filters);

      const dailyStats = await dashboardService.getDailyStats(restaurantId, filters);

      res.status(200).json({
        success: true,
        data: dailyStats,
        meta: {
          restaurantId,
          filters,
          totalDays: dailyStats.length,
          totalCoins: dailyStats.reduce((sum, day) => sum + day.coinsReceived, 0),
          totalTransactions: dailyStats.reduce((sum, day) => sum + day.transactions, 0),
        }
      });

    } catch (error) {
      logger.error('Error getting daily stats:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/restaurants/:id/dashboard/total-stats
   * Get total statistics for a restaurant (total coins, ranking, trends)
   */
  async getTotalStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: restaurantId } = req.params;
      const { startDate, endDate, originCountry } = req.query;

      if (!restaurantId) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Restaurant ID is required'
        });
        return;
      }

      const filters: DashboardFilters = {};
      
      if (startDate) {
        filters.startDate = new Date(startDate as string);
        if (isNaN(filters.startDate.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: 'Invalid start date format'
          });
          return;
        }
      }

      if (endDate) {
        filters.endDate = new Date(endDate as string);
        if (isNaN(filters.endDate.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: 'Invalid end date format'
          });
          return;
        }
      }

      if (originCountry) {
        filters.originCountry = originCountry as string;
      }

      logger.info(`Total stats request for restaurant ${restaurantId} with filters:`, filters);

      const totalStats = await dashboardService.getTotalStats(restaurantId, filters);

      res.status(200).json({
        success: true,
        data: totalStats,
        meta: {
          restaurantId,
          filters,
          generatedAt: new Date().toISOString(),
        }
      });

    } catch (error) {
      logger.error('Error getting total stats:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/restaurants/:id/dashboard/origin-breakdown
   * Get tourist origin breakdown showing country statistics
   */
  async getOriginBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: restaurantId } = req.params;
      const { startDate, endDate, limit } = req.query;

      if (!restaurantId) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Restaurant ID is required'
        });
        return;
      }

      const filters: DashboardFilters = {};
      
      if (startDate) {
        filters.startDate = new Date(startDate as string);
        if (isNaN(filters.startDate.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: 'Invalid start date format'
          });
          return;
        }
      }

      if (endDate) {
        filters.endDate = new Date(endDate as string);
        if (isNaN(filters.endDate.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: 'Invalid end date format'
          });
          return;
        }
      }

      logger.info(`Origin breakdown request for restaurant ${restaurantId} with filters:`, filters);

      let originBreakdown = await dashboardService.getOriginBreakdown(restaurantId, filters);

      // Apply limit if specified
      if (limit) {
        const limitNum = parseInt(limit as string, 10);
        if (!isNaN(limitNum) && limitNum > 0) {
          originBreakdown = originBreakdown.slice(0, limitNum);
        }
      }

      const totalCoins = originBreakdown.reduce((sum, origin) => sum + origin.coinsReceived, 0);
      const totalTourists = originBreakdown.reduce((sum, origin) => sum + origin.touristCount, 0);

      res.status(200).json({
        success: true,
        data: originBreakdown,
        meta: {
          restaurantId,
          filters,
          totalCountries: originBreakdown.length,
          totalCoins,
          totalTourists,
          generatedAt: new Date().toISOString(),
        }
      });

    } catch (error) {
      logger.error('Error getting origin breakdown:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/restaurants/:id/dashboard/performance-trends
   * Get performance trends with historical data analysis
   */
  async getPerformanceTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: restaurantId } = req.params;
      const { period, startDate, endDate } = req.query;

      if (!restaurantId) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Restaurant ID is required'
        });
        return;
      }

      const validPeriods = ['daily', 'weekly', 'monthly'];
      const selectedPeriod = (period as string) || 'daily';
      
      if (!validPeriods.includes(selectedPeriod)) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Period must be one of: daily, weekly, monthly'
        });
        return;
      }

      const filters: DashboardFilters = {};
      
      if (startDate) {
        filters.startDate = new Date(startDate as string);
        if (isNaN(filters.startDate.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: 'Invalid start date format'
          });
          return;
        }
      }

      if (endDate) {
        filters.endDate = new Date(endDate as string);
        if (isNaN(filters.endDate.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: 'Invalid end date format'
          });
          return;
        }
      }

      logger.info(`Performance trends request for restaurant ${restaurantId} with period ${selectedPeriod} and filters:`, filters);

      const trends = await dashboardService.getPerformanceTrends(
        restaurantId, 
        selectedPeriod as 'daily' | 'weekly' | 'monthly',
        filters
      );

      // Calculate summary statistics
      const totalCoins = trends.reduce((sum, trend) => sum + trend.coinsReceived, 0);
      const totalTransactions = trends.reduce((sum, trend) => sum + trend.transactions, 0);
      const averageGrowthRate = trends.length > 1 ? 
        trends.slice(1).reduce((sum, trend) => sum + trend.growthRate, 0) / (trends.length - 1) : 0;

      res.status(200).json({
        success: true,
        data: trends,
        meta: {
          restaurantId,
          period: selectedPeriod,
          filters,
          totalPeriods: trends.length,
          totalCoins,
          totalTransactions,
          averageGrowthRate: Number(averageGrowthRate.toFixed(2)),
          generatedAt: new Date().toISOString(),
        }
      });

    } catch (error) {
      logger.error('Error getting performance trends:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/restaurants/:id/dashboard/comparison
   * Get restaurant comparison and benchmarking data
   */
  async getRestaurantComparison(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: restaurantId } = req.params;
      const { compareWith, limit } = req.query;

      if (!restaurantId) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Restaurant ID is required'
        });
        return;
      }

      const validCompareWith = ['similar', 'top', 'nearby'];
      const selectedCompareWith = (compareWith as string) || 'similar';
      
      if (!validCompareWith.includes(selectedCompareWith)) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'compareWith must be one of: similar, top, nearby'
        });
        return;
      }

      const limitNum = limit ? parseInt(limit as string, 10) : 10;
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Limit must be a number between 1 and 50'
        });
        return;
      }

      logger.info(`Restaurant comparison request for ${restaurantId} with compareWith ${selectedCompareWith} and limit ${limitNum}`);

      const comparison = await dashboardService.getRestaurantComparison(
        restaurantId,
        selectedCompareWith as 'similar' | 'top' | 'nearby',
        limitNum
      );

      res.status(200).json({
        success: true,
        data: comparison,
        meta: {
          restaurantId,
          compareWith: selectedCompareWith,
          limit: limitNum,
          totalRestaurants: comparison.length,
          generatedAt: new Date().toISOString(),
        }
      });

    } catch (error) {
      logger.error('Error getting restaurant comparison:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/v1/restaurants/:id/dashboard/cache
   * Clear dashboard cache for a specific restaurant
   */
  async clearRestaurantCache(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: restaurantId } = req.params;

      if (!restaurantId) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Restaurant ID is required'
        });
        return;
      }

      logger.info(`Clearing dashboard cache for restaurant ${restaurantId}`);

      await dashboardService.clearRestaurantCache(restaurantId);

      res.status(200).json({
        success: true,
        message: 'Dashboard cache cleared successfully',
        restaurantId,
        clearedAt: new Date().toISOString(),
      });

    } catch (error) {
      logger.error('Error clearing restaurant dashboard cache:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/v1/dashboard/cache
   * Clear all dashboard cache
   */
  async clearAllCache(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Clearing all dashboard cache');

      await dashboardService.clearAllCache();

      res.status(200).json({
        success: true,
        message: 'All dashboard cache cleared successfully',
        clearedAt: new Date().toISOString(),
      });

    } catch (error) {
      logger.error('Error clearing all dashboard cache:', error);
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();