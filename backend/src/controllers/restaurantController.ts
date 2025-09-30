import { NextFunction, Request, Response } from 'express';
import { RestaurantListParams, RestaurantRegistrationData, restaurantService } from '../services/restaurantService';
import { logger } from '../utils/logger';

export class RestaurantController {
  /**
   * POST /api/v1/restaurants/register
   * Register a new restaurant using Google Place ID
   */
  async registerRestaurant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { googlePlaceId, walletAddress }: RestaurantRegistrationData = req.body;

      logger.info(`Restaurant registration request: ${googlePlaceId}`);

      const restaurant = await restaurantService.registerRestaurant({
        googlePlaceId,
        walletAddress
      });

      res.status(201).json({
        success: true,
        message: 'Restaurant registered successfully',
        data: {
          id: restaurant.id,
          googlePlaceId: restaurant.googlePlaceId,
          name: restaurant.name,
          address: restaurant.address,
          walletAddress: restaurant.walletAddress,
          qrCodeData: restaurant.qrCodeData,
          location: {
            latitude: parseFloat(restaurant.latitude.toString()),
            longitude: parseFloat(restaurant.longitude.toString())
          },
          totalCoinsReceived: restaurant.totalCoinsReceived,
          createdAt: restaurant.createdAt
        }
      });

    } catch (error) {
      logger.error('Error in restaurant registration:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('already exists') || error.message.includes('already in use')) {
          res.status(409).json({
            success: false,
            error: 'Conflict',
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('not found in Google Maps')) {
          res.status(404).json({
            success: false,
            error: 'Not Found',
            message: error.message
          });
          return;
        }
      }

      next(error);
    }
  }

  /**
   * GET /api/v1/restaurants/:id/profile
   * Get restaurant profile with Google Maps data
   */
  async getRestaurantProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Restaurant ID is required'
        });
        return;
      }

      logger.info(`Restaurant profile request: ${id}`);

      const restaurant = await restaurantService.getRestaurantProfile(id);

      if (!restaurant) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Restaurant not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: restaurant.id,
          googlePlaceId: restaurant.googlePlaceId,
          name: restaurant.name,
          address: restaurant.address,
          walletAddress: restaurant.walletAddress,
          qrCodeData: restaurant.qrCodeData,
          location: {
            latitude: parseFloat(restaurant.latitude.toString()),
            longitude: parseFloat(restaurant.longitude.toString())
          },
          totalCoinsReceived: restaurant.totalCoinsReceived,
          dailyCoinsCache: restaurant.dailyCoinsCache,
          lastRankingUpdate: restaurant.lastRankingUpdate,
          createdAt: restaurant.createdAt,
          updatedAt: restaurant.updatedAt,
          googleData: restaurant.googleData,
          distance: restaurant.distance
        }
      });

    } catch (error) {
      logger.error('Error getting restaurant profile:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/restaurants/place/:placeId
   * Get restaurant by Google Place ID
   */
  async getRestaurantByPlaceId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { placeId } = req.params;

      if (!placeId) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Google Place ID is required'
        });
        return;
      }

      logger.info(`Restaurant by place ID request: ${placeId}`);

      const restaurant = await restaurantService.getRestaurantByPlaceId(placeId);

      if (!restaurant) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Restaurant not found with this Google Place ID'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: restaurant.id,
          googlePlaceId: restaurant.googlePlaceId,
          name: restaurant.name,
          address: restaurant.address,
          walletAddress: restaurant.walletAddress,
          qrCodeData: restaurant.qrCodeData,
          location: {
            latitude: parseFloat(restaurant.latitude.toString()),
            longitude: parseFloat(restaurant.longitude.toString())
          },
          totalCoinsReceived: restaurant.totalCoinsReceived,
          dailyCoinsCache: restaurant.dailyCoinsCache,
          lastRankingUpdate: restaurant.lastRankingUpdate,
          createdAt: restaurant.createdAt,
          updatedAt: restaurant.updatedAt,
          googleData: restaurant.googleData,
          distance: restaurant.distance
        }
      });

    } catch (error) {
      logger.error('Error getting restaurant by place ID:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/restaurants
   * List restaurants with pagination and filtering
   */
  async listRestaurants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page,
        limit,
        search,
        lat,
        lng,
        radius,
        sortBy,
        sortOrder
      } = req.query;

      const params: RestaurantListParams = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string,
        latitude: lat ? parseFloat(lat as string) : undefined,
        longitude: lng ? parseFloat(lng as string) : undefined,
        radius: radius ? parseFloat(radius as string) : undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any
      };

      logger.info(`Restaurant list request: ${JSON.stringify(params)}`);

      const result = await restaurantService.listRestaurants(params);

      res.status(200).json({
        success: true,
        data: result.restaurants.map(restaurant => ({
          id: restaurant.id,
          googlePlaceId: restaurant.googlePlaceId,
          name: restaurant.name,
          address: restaurant.address,
          walletAddress: restaurant.walletAddress,
          location: {
            latitude: parseFloat(restaurant.latitude.toString()),
            longitude: parseFloat(restaurant.longitude.toString())
          },
          totalCoinsReceived: restaurant.totalCoinsReceived,
          lastRankingUpdate: restaurant.lastRankingUpdate,
          createdAt: restaurant.createdAt,
          googleData: restaurant.googleData,
          distance: restaurant.distance
        })),
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('Error listing restaurants:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/restaurants/search
   * Search restaurants by name, location, cuisine type
   */
  async searchRestaurants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        q: query,
        name,
        location,
        cuisine,
        lat,
        lng,
        radius,
        page,
        limit
      } = req.query;

      const params = {
        query: query as string,
        name: name as string,
        location: location as string,
        cuisineType: cuisine as string,
        latitude: lat ? parseFloat(lat as string) : undefined,
        longitude: lng ? parseFloat(lng as string) : undefined,
        radius: radius ? parseFloat(radius as string) : undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined
      };

      logger.info(`Restaurant search request: ${JSON.stringify(params)}`);

      const result = await restaurantService.searchRestaurants(params);

      res.status(200).json({
        success: true,
        data: result.restaurants.map(restaurant => ({
          id: restaurant.id,
          googlePlaceId: restaurant.googlePlaceId,
          name: restaurant.name,
          address: restaurant.address,
          walletAddress: restaurant.walletAddress,
          location: {
            latitude: parseFloat(restaurant.latitude.toString()),
            longitude: parseFloat(restaurant.longitude.toString())
          },
          totalCoinsReceived: restaurant.totalCoinsReceived,
          lastRankingUpdate: restaurant.lastRankingUpdate,
          createdAt: restaurant.createdAt,
          googleData: restaurant.googleData,
          distance: restaurant.distance
        })),
        pagination: result.pagination,
        searchParams: params
      });

    } catch (error) {
      logger.error('Error searching restaurants:', error);
      next(error);
    }
  }

  /**
   * POST /api/v1/restaurants/qr/verify
   * Verify QR code data
   */
  async verifyQRCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { qrCodeData } = req.body;

      if (!qrCodeData) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'QR code data is required'
        });
        return;
      }

      logger.info('QR code verification request');

      const verification = restaurantService.verifyQRCodeData(qrCodeData);

      if (!verification.valid) {
        res.status(400).json({
          success: false,
          error: 'Invalid QR Code',
          message: verification.error
        });
        return;
      }

      // Get restaurant details if QR code is valid
      const restaurant = await restaurantService.getRestaurantByPlaceId(verification.data.googlePlaceId);

      res.status(200).json({
        success: true,
        message: 'QR code is valid',
        data: {
          qrData: verification.data,
          restaurant: restaurant ? {
            id: restaurant.id,
            googlePlaceId: restaurant.googlePlaceId,
            name: restaurant.name,
            address: restaurant.address,
            walletAddress: restaurant.walletAddress,
            location: {
              latitude: parseFloat(restaurant.latitude.toString()),
              longitude: parseFloat(restaurant.longitude.toString())
            },
            totalCoinsReceived: restaurant.totalCoinsReceived,
            googleData: restaurant.googleData
          } : null
        }
      });

    } catch (error) {
      logger.error('Error verifying QR code:', error);
      next(error);
    }
  }
}

export const restaurantController = new RestaurantController();