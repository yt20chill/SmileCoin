import { Prisma, Restaurant } from '@prisma/client';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';
import { googleMapsService, GoogleRestaurant } from './googleMapsService';

export interface RestaurantRegistrationData {
  googlePlaceId: string;
  walletAddress: string;
}

export interface RestaurantWithGoogleData extends Restaurant {
  googleData?: GoogleRestaurant;
  distance?: number;
}

export interface RestaurantListParams {
  page?: number;
  limit?: number;
  search?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  sortBy?: 'name' | 'totalCoins' | 'distance' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedRestaurants {
  restaurants: RestaurantWithGoogleData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class RestaurantService {
  private cachePrefix = 'restaurant:';
  private cacheTTL = 60 * 60; // 1 hour in seconds

  /**
   * Register a new restaurant using Google Place ID
   */
  async registerRestaurant(data: RestaurantRegistrationData): Promise<Restaurant> {
    try {
      // Check if restaurant already exists
      const existingRestaurant = await prisma.restaurant.findUnique({
        where: { googlePlaceId: data.googlePlaceId }
      });

      if (existingRestaurant) {
        throw new Error('Restaurant with this Google Place ID already exists');
      }

      // Check if wallet address is already used
      const existingWallet = await prisma.restaurant.findUnique({
        where: { walletAddress: data.walletAddress }
      });

      if (existingWallet) {
        throw new Error('Wallet address is already in use');
      }

      // Get restaurant details from Google Maps
      const googleData = await googleMapsService.getRestaurantDetails(data.googlePlaceId);
      
      if (!googleData) {
        throw new Error('Restaurant not found in Google Maps');
      }

      // Generate QR code data
      const qrCodeData = this.generateQRCodeData(data.googlePlaceId, data.walletAddress);

      // Create restaurant in database
      const restaurant = await prisma.restaurant.create({
        data: {
          googlePlaceId: data.googlePlaceId,
          name: googleData.name,
          address: googleData.address,
          latitude: new Prisma.Decimal(googleData.location.latitude),
          longitude: new Prisma.Decimal(googleData.location.longitude),
          walletAddress: data.walletAddress,
          qrCodeData,
          totalCoinsReceived: 0,
          dailyCoinsCache: {},
        }
      });

      logger.info(`Restaurant registered: ${restaurant.name} (${restaurant.id})`);
      
      // Clear relevant caches
      await this.clearRestaurantCaches();

      return restaurant;

    } catch (error) {
      logger.error('Error registering restaurant:', error);
      throw error;
    }
  }

  /**
   * Get restaurant profile with Google Maps data
   */
  async getRestaurantProfile(restaurantId: string): Promise<RestaurantWithGoogleData | null> {
    try {
      const cacheKey = `${this.cachePrefix}profile:${restaurantId}`;
      
      // Check cache first
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId }
      });

      if (!restaurant) {
        return null;
      }

      // Get fresh Google Maps data
      const googleData = await googleMapsService.getRestaurantDetails(restaurant.googlePlaceId);

      const restaurantWithGoogleData: RestaurantWithGoogleData = {
        ...restaurant,
        googleData: googleData || undefined
      };

      // Cache the result
      await this.setCache(cacheKey, restaurantWithGoogleData);

      return restaurantWithGoogleData;

    } catch (error) {
      logger.error(`Error getting restaurant profile for ID ${restaurantId}:`, error);
      throw error;
    }
  }

  /**
   * Get restaurant profile by Google Place ID
   */
  async getRestaurantByPlaceId(googlePlaceId: string): Promise<RestaurantWithGoogleData | null> {
    try {
      const restaurant = await prisma.restaurant.findUnique({
        where: { googlePlaceId }
      });

      if (!restaurant) {
        return null;
      }

      return this.getRestaurantProfile(restaurant.id);

    } catch (error) {
      logger.error(`Error getting restaurant by place ID ${googlePlaceId}:`, error);
      throw error;
    }
  }

  /**
   * List restaurants with pagination and filtering
   */
  async listRestaurants(params: RestaurantListParams): Promise<PaginatedRestaurants> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        latitude,
        longitude,
        radius,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = params;

      const skip = (page - 1) * limit;
      const take = Math.min(limit, 100); // Max 100 items per page

      // Build where clause
      const where: Prisma.RestaurantWhereInput = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } }
        ];
      }

      // If location-based search is requested, we'll handle distance filtering after the query
      let restaurants: Restaurant[];
      let total: number;

      if (latitude && longitude && radius) {
        // For location-based search, get all restaurants first, then filter by distance
        const allRestaurants = await prisma.restaurant.findMany({
          where,
          orderBy: this.buildOrderBy(sortBy, sortOrder),
        });

        // Filter by distance
        const restaurantsWithDistance = allRestaurants
          .map(restaurant => ({
            ...restaurant,
            distance: googleMapsService.calculateDistance(
              { latitude, longitude },
              { 
                latitude: parseFloat(restaurant.latitude.toString()), 
                longitude: parseFloat(restaurant.longitude.toString()) 
              }
            )
          }))
          .filter(restaurant => restaurant.distance <= radius);

        // Sort by distance if requested
        if (sortBy === 'distance') {
          restaurantsWithDistance.sort((a, b) => 
            sortOrder === 'asc' ? a.distance - b.distance : b.distance - a.distance
          );
        }

        total = restaurantsWithDistance.length;
        restaurants = restaurantsWithDistance.slice(skip, skip + take);

      } else {
        // Regular query without location filtering
        [restaurants, total] = await Promise.all([
          prisma.restaurant.findMany({
            where,
            skip,
            take,
            orderBy: this.buildOrderBy(sortBy, sortOrder),
          }),
          prisma.restaurant.count({ where })
        ]);
      }

      // Enhance with Google Maps data for each restaurant
      const restaurantsWithGoogleData: RestaurantWithGoogleData[] = await Promise.all(
        restaurants.map(async (restaurant) => {
          try {
            const googleData = await googleMapsService.getRestaurantDetails(restaurant.googlePlaceId);
            return {
              ...restaurant,
              googleData: googleData || undefined,
              distance: (restaurant as any).distance
            };
          } catch (error) {
            logger.warn(`Failed to get Google data for restaurant ${restaurant.id}:`, error);
            return {
              ...restaurant,
              distance: (restaurant as any).distance
            };
          }
        })
      );

      const totalPages = Math.ceil(total / take);

      return {
        restaurants: restaurantsWithGoogleData,
        pagination: {
          page,
          limit: take,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      };

    } catch (error) {
      logger.error('Error listing restaurants:', error);
      throw error;
    }
  }

  /**
   * Search restaurants by various criteria
   */
  async searchRestaurants(params: {
    query?: string;
    name?: string;
    location?: string;
    cuisineType?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedRestaurants> {
    try {
      const {
        query,
        name,
        location,
        cuisineType,
        latitude,
        longitude,
        radius,
        page = 1,
        limit = 20
      } = params;

      // Build search criteria
      const searchCriteria: RestaurantListParams = {
        page,
        limit,
        latitude,
        longitude,
        radius,
        sortBy: latitude && longitude ? 'distance' : 'totalCoins',
        sortOrder: 'desc'
      };

      // Combine search terms
      const searchTerms: string[] = [];
      if (query) searchTerms.push(query);
      if (name) searchTerms.push(name);
      if (location) searchTerms.push(location);
      if (cuisineType) searchTerms.push(cuisineType);

      if (searchTerms.length > 0) {
        searchCriteria.search = searchTerms.join(' ');
      }

      return this.listRestaurants(searchCriteria);

    } catch (error) {
      logger.error('Error searching restaurants:', error);
      throw error;
    }
  }

  /**
   * Generate QR code data containing Place ID and wallet address
   */
  private generateQRCodeData(googlePlaceId: string, walletAddress: string): string {
    const qrData = {
      googlePlaceId,
      walletAddress,
      timestamp: Date.now(),
      version: '1.0'
    };

    // Create a hash for verification
    const dataString = JSON.stringify(qrData);
    const hash = crypto.createHash('sha256').update(dataString).digest('hex').substring(0, 8);
    
    return JSON.stringify({
      ...qrData,
      hash
    });
  }

  /**
   * Verify QR code data
   */
  verifyQRCodeData(qrCodeData: string): { valid: boolean; data?: any; error?: string } {
    try {
      const parsed = JSON.parse(qrCodeData);
      
      if (!parsed.googlePlaceId || !parsed.walletAddress || !parsed.hash) {
        return { valid: false, error: 'Missing required fields in QR code' };
      }

      // Verify hash
      const { hash, ...dataForHash } = parsed;
      const expectedHash = crypto.createHash('sha256')
        .update(JSON.stringify(dataForHash))
        .digest('hex')
        .substring(0, 8);

      if (hash !== expectedHash) {
        return { valid: false, error: 'Invalid QR code hash' };
      }

      return { valid: true, data: parsed };

    } catch (error) {
      return { valid: false, error: 'Invalid QR code format' };
    }
  }

  /**
   * Build Prisma orderBy clause
   */
  private buildOrderBy(sortBy: string, sortOrder: string): Prisma.RestaurantOrderByWithRelationInput {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    switch (sortBy) {
      case 'name':
        return { name: order };
      case 'totalCoins':
        return { totalCoinsReceived: order };
      case 'createdAt':
        return { createdAt: order };
      default:
        return { createdAt: order };
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
  private async setCache(key: string, data: any): Promise<void> {
    try {
      await redisClient.set(key, JSON.stringify(data), this.cacheTTL);
    } catch (error) {
      logger.warn(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Clear restaurant-related caches
   */
  private async clearRestaurantCaches(): Promise<void> {
    try {
      const client = redisClient.getClient();
      const keys = await client.keys(`${this.cachePrefix}*`);
      
      if (keys.length > 0) {
        await client.del(keys);
        logger.info(`Cleared ${keys.length} restaurant cache entries`);
      }
    } catch (error) {
      logger.warn('Error clearing restaurant caches:', error);
    }
  }
}

export const restaurantService = new RestaurantService();