import { Client, PlaceDetailsRequest, PlaceDetailsResponse, PlacesNearbyRequest, PlacesNearbyResponse, TextSearchRequest, TextSearchResponse } from '@googlemaps/google-maps-services-js';
import { config } from '../config/environment';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GoogleRestaurant {
  placeId: string;
  name: string;
  address: string;
  location: Coordinates;
  rating?: number;
  priceLevel?: number;
  photos?: string[];
  isOpen?: boolean;
  types?: string[];
  vicinity?: string;
  businessStatus?: string;
}

export interface NearbyRestaurantsParams {
  location: Coordinates;
  radius: number;
  type?: string;
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface RestaurantSearchParams {
  query: string;
  location?: Coordinates;
  radius?: number;
}

class GoogleMapsService {
  private client: Client;
  private apiKey: string;
  private cachePrefix = 'gmaps:';
  private cacheTTL = 24 * 60 * 60; // 24 hours in seconds

  constructor() {
    this.client = new Client({});
    this.apiKey = config.googleMapsApiKey;
    
    if (!this.apiKey) {
      throw new Error('Google Maps API key is required');
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  public calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    
    return Math.round(distance * 1000) / 1000; // Round to 3 decimal places
  }

  /**
   * Search for nearby restaurants using GPS coordinates and radius
   */
  public async getNearbyRestaurants(params: NearbyRestaurantsParams): Promise<GoogleRestaurant[]> {
    const cacheKey = `${this.cachePrefix}nearby:${params.location.latitude}:${params.location.longitude}:${params.radius}:${params.type || 'restaurant'}`;
    
    try {
      // Check cache first
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        logger.info('Returning cached nearby restaurants');
        return cached;
      }

      const request: PlacesNearbyRequest = {
        params: {
          location: `${params.location.latitude},${params.location.longitude}`,
          radius: params.radius,
          type: params.type || 'restaurant',
          key: this.apiKey,
        },
      };

      if (params.keyword) {
        request.params.keyword = params.keyword;
      }

      if (params.minPrice !== undefined) {
        request.params.minprice = params.minPrice;
      }

      if (params.maxPrice !== undefined) {
        request.params.maxprice = params.maxPrice;
      }

      logger.info(`Searching nearby restaurants: lat=${params.location.latitude}, lng=${params.location.longitude}, radius=${params.radius}`);
      
      const response: PlacesNearbyResponse = await this.client.placesNearby(request);
      
      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Maps API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
      }

      const restaurants = this.transformPlacesToRestaurants(response.data.results || []);
      
      // Cache the results
      await this.setCache(cacheKey, restaurants);
      
      logger.info(`Found ${restaurants.length} nearby restaurants`);
      return restaurants;

    } catch (error) {
      logger.error('Error fetching nearby restaurants:', error);
      throw new Error(`Failed to fetch nearby restaurants: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get restaurant details using Google Place ID
   */
  public async getRestaurantDetails(placeId: string): Promise<GoogleRestaurant | null> {
    const cacheKey = `${this.cachePrefix}details:${placeId}`;
    
    try {
      // Check cache first
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        logger.info(`Returning cached restaurant details for place ID: ${placeId}`);
        return cached;
      }

      const request: PlaceDetailsRequest = {
        params: {
          place_id: placeId,
          fields: [
            'place_id',
            'name',
            'formatted_address',
            'geometry',
            'rating',
            'price_level',
            'photos',
            'opening_hours',
            'types',
            'vicinity',
            'business_status'
          ],
          key: this.apiKey,
        },
      };

      logger.info(`Fetching restaurant details for place ID: ${placeId}`);
      
      const response: PlaceDetailsResponse = await this.client.placeDetails(request);
      
      if (response.data.status !== 'OK') {
        if (response.data.status === 'NOT_FOUND') {
          logger.warn(`Restaurant not found for place ID: ${placeId}`);
          return null;
        }
        throw new Error(`Google Maps API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
      }

      const restaurant = this.transformPlaceToRestaurant(response.data.result);
      
      // Cache the result
      await this.setCache(cacheKey, restaurant);
      
      logger.info(`Retrieved restaurant details: ${restaurant.name}`);
      return restaurant;

    } catch (error) {
      logger.error(`Error fetching restaurant details for place ID ${placeId}:`, error);
      throw new Error(`Failed to fetch restaurant details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search restaurants by text query
   */
  public async searchRestaurants(params: RestaurantSearchParams): Promise<GoogleRestaurant[]> {
    const locationStr = params.location ? `${params.location.latitude},${params.location.longitude}` : '';
    const cacheKey = `${this.cachePrefix}search:${params.query}:${locationStr}:${params.radius || 0}`;
    
    try {
      // Check cache first
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        logger.info('Returning cached restaurant search results');
        return cached;
      }

      const request: TextSearchRequest = {
        params: {
          query: `${params.query} restaurant`,
          key: this.apiKey,
        },
      };

      if (params.location) {
        request.params.location = `${params.location.latitude},${params.location.longitude}`;
      }

      if (params.radius) {
        request.params.radius = params.radius;
      }

      logger.info(`Searching restaurants with query: ${params.query}`);
      
      const response: TextSearchResponse = await this.client.textSearch(request);
      
      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Maps API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
      }

      const restaurants = this.transformPlacesToRestaurants(response.data.results || []);
      
      // Cache the results
      await this.setCache(cacheKey, restaurants);
      
      logger.info(`Found ${restaurants.length} restaurants for query: ${params.query}`);
      return restaurants;

    } catch (error) {
      logger.error('Error searching restaurants:', error);
      throw new Error(`Failed to search restaurants: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transform Google Places API result to our restaurant format
   */
  private transformPlaceToRestaurant(place: any): GoogleRestaurant {
    return {
      placeId: place.place_id,
      name: place.name || 'Unknown Restaurant',
      address: place.formatted_address || place.vicinity || 'Address not available',
      location: {
        latitude: place.geometry?.location?.lat || 0,
        longitude: place.geometry?.location?.lng || 0,
      },
      rating: place.rating,
      priceLevel: place.price_level,
      photos: place.photos?.map((photo: any) => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${this.apiKey}`
      ) || [],
      isOpen: place.opening_hours?.open_now,
      types: place.types || [],
      vicinity: place.vicinity,
      businessStatus: place.business_status,
    };
  }

  /**
   * Transform multiple Google Places API results to our restaurant format
   */
  private transformPlacesToRestaurants(places: any[]): GoogleRestaurant[] {
    return places
      .filter(place => place.place_id && place.name)
      .map(place => this.transformPlaceToRestaurant(place));
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
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Clear cache for a specific pattern
   */
  public async clearCache(pattern?: string): Promise<void> {
    try {
      const searchPattern = pattern ? `${this.cachePrefix}${pattern}*` : `${this.cachePrefix}*`;
      const client = redisClient.getClient();
      const keys = await client.keys(searchPattern);
      
      if (keys.length > 0) {
        await client.del(keys);
        logger.info(`Cleared ${keys.length} cache entries matching pattern: ${searchPattern}`);
      }
    } catch (error) {
      logger.warn('Error clearing cache:', error);
    }
  }
}

export const googleMapsService = new GoogleMapsService();