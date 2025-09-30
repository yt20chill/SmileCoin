import { NextFunction, Request, Response } from 'express';
import { OriginBasedRankingParams, RankingParams, rankingService } from '../services/rankingService';
import { logger } from '../utils/logger';

export class RankingController {
  /**
   * GET /api/v1/rankings/overall
   * Get overall restaurant rankings based on total smile coins
   */
  async getOverallRankings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page,
        limit,
        lat,
        lng,
        radius
      } = req.query;

      const params: RankingParams = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        latitude: lat ? parseFloat(lat as string) : undefined,
        longitude: lng ? parseFloat(lng as string) : undefined,
        radius: radius ? parseFloat(radius as string) : undefined
      };

      logger.info(`Overall rankings request: ${JSON.stringify(params)}`);

      const result = await rankingService.getOverallRankings(params);

      res.status(200).json({
        success: true,
        data: result.rankings,
        pagination: result.pagination,
        lastUpdated: result.lastUpdated,
        meta: {
          type: 'overall',
          location: params.latitude && params.longitude ? {
            latitude: params.latitude,
            longitude: params.longitude,
            radius: params.radius
          } : null
        }
      });

    } catch (error) {
      logger.error('Error getting overall rankings:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/rankings/origin/:country
   * Get origin-based restaurant recommendations using user country data
   */
  async getOriginBasedRankings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { country } = req.params;
      const {
        page,
        limit,
        lat,
        lng,
        radius
      } = req.query;

      if (!country) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Origin country is required'
        });
        return;
      }

      const params: OriginBasedRankingParams = {
        originCountry: decodeURIComponent(country),
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        latitude: lat ? parseFloat(lat as string) : undefined,
        longitude: lng ? parseFloat(lng as string) : undefined,
        radius: radius ? parseFloat(radius as string) : undefined
      };

      logger.info(`Origin-based rankings request: ${JSON.stringify(params)}`);

      const result = await rankingService.getOriginBasedRankings(params);

      res.status(200).json({
        success: true,
        data: result.rankings,
        pagination: result.pagination,
        lastUpdated: result.lastUpdated,
        meta: {
          type: 'origin-based',
          originCountry: params.originCountry,
          location: params.latitude && params.longitude ? {
            latitude: params.latitude,
            longitude: params.longitude,
            radius: params.radius
          } : null
        }
      });

    } catch (error) {
      logger.error('Error getting origin-based rankings:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/rankings/nearby
   * Get nearby restaurants ranking with GPS integration
   */
  async getNearbyRankings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        lat,
        lng,
        radius,
        page,
        limit
      } = req.query;

      if (!lat || !lng) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Latitude and longitude are required'
        });
        return;
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const radiusKm = radius ? parseFloat(radius as string) : 5;

      const params: RankingParams = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined
      };

      logger.info(`Nearby rankings request: lat=${latitude}, lng=${longitude}, radius=${radiusKm}`);

      const result = await rankingService.getNearbyRankings(latitude, longitude, radiusKm, params);

      res.status(200).json({
        success: true,
        data: result.rankings,
        pagination: result.pagination,
        lastUpdated: result.lastUpdated,
        meta: {
          type: 'nearby',
          location: {
            latitude,
            longitude,
            radius: radiusKm
          }
        }
      });

    } catch (error) {
      logger.error('Error getting nearby rankings:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/rankings/statistics/:restaurantId
   * Get restaurant statistics for web dashboard
   */
  async getRestaurantStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { restaurantId } = req.params;

      if (!restaurantId) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Restaurant ID is required'
        });
        return;
      }

      logger.info(`Restaurant statistics request: ${restaurantId}`);

      const statistics = await rankingService.getRestaurantStatistics(restaurantId);

      if (!statistics) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Restaurant not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: statistics
      });

    } catch (error) {
      logger.error('Error getting restaurant statistics:', error);
      next(error);
    }
  }

  /**
   * POST /api/v1/rankings/refresh
   * Manual ranking refresh endpoint for demo purposes
   */
  async refreshRankings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Manual ranking refresh requested');

      const result = await rankingService.refreshRankings();

      res.status(200).json({
        success: result.success,
        message: result.message,
        timestamp: result.timestamp,
        meta: {
          action: 'manual_refresh',
          triggeredBy: 'api_request'
        }
      });

    } catch (error) {
      logger.error('Error refreshing rankings:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/rankings/top
   * Get top restaurants (shortcut for overall rankings with limit)
   */
  async getTopRestaurants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = '10' } = req.query;

      const params: RankingParams = {
        page: 1,
        limit: parseInt(limit as string, 10)
      };

      logger.info(`Top restaurants request: limit=${params.limit}`);

      const result = await rankingService.getOverallRankings(params);

      res.status(200).json({
        success: true,
        data: result.rankings,
        meta: {
          type: 'top',
          limit: params.limit,
          lastUpdated: result.lastUpdated
        }
      });

    } catch (error) {
      logger.error('Error getting top restaurants:', error);
      next(error);
    }
  }
}

export const rankingController = new RankingController();