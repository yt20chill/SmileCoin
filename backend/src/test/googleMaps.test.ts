import { redisClient } from '../config/redis';
import { googleMapsService } from '../services/googleMapsService';

// Mock the Google Maps client
jest.mock('@googlemaps/google-maps-services-js');

describe('GoogleMapsService', () => {
  beforeAll(async () => {
    // Ensure Redis connection for tests
    if (!redisClient.isClientConnected()) {
      await redisClient.connect();
    }
  });

  afterAll(async () => {
    // Clean up Redis connection
    if (redisClient.isClientConnected()) {
      await redisClient.disconnect();
    }
  });

  beforeEach(async () => {
    // Clear cache before each test
    await googleMapsService.clearCache();
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates correctly', () => {
      const coord1 = { latitude: 22.3193, longitude: 114.1694 }; // Hong Kong
      const coord2 = { latitude: 22.2783, longitude: 114.1747 }; // Tsim Sha Tsui

      const distance = googleMapsService.calculateDistance(coord1, coord2);
      
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(10); // Should be less than 10km
    });

    it('should return 0 for same coordinates', () => {
      const coord = { latitude: 22.3193, longitude: 114.1694 };
      
      const distance = googleMapsService.calculateDistance(coord, coord);
      
      expect(distance).toBe(0);
    });
  });

  describe('getNearbyRestaurants', () => {
    it('should handle API errors gracefully', async () => {
      const params = {
        location: { latitude: 22.3193, longitude: 114.1694 },
        radius: 1000,
      };

      // Mock API error
      const mockClient = require('@googlemaps/google-maps-services-js').Client;
      mockClient.prototype.placesNearby = jest.fn().mockRejectedValue(new Error('API Error'));

      await expect(googleMapsService.getNearbyRestaurants(params))
        .rejects.toThrow('Failed to fetch nearby restaurants');
    });

    it('should validate input parameters', async () => {
      const invalidParams = {
        location: { latitude: 200, longitude: 300 }, // Invalid coordinates
        radius: 1000,
      };

      // This should be handled by the route validation, but service should handle gracefully
      await expect(googleMapsService.getNearbyRestaurants(invalidParams))
        .rejects.toThrow();
    });
  });

  describe('getRestaurantDetails', () => {
    it('should return null for non-existent place ID', async () => {
      const mockClient = require('@googlemaps/google-maps-services-js').Client;
      mockClient.prototype.placeDetails = jest.fn().mockResolvedValue({
        data: { 
          status: 'NOT_FOUND',
          result: null
        }
      });

      const result = await googleMapsService.getRestaurantDetails('invalid_place_id');
      
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      const mockClient = require('@googlemaps/google-maps-services-js').Client;
      mockClient.prototype.placeDetails = jest.fn().mockRejectedValue(new Error('API Error'));

      await expect(googleMapsService.getRestaurantDetails('some_place_id'))
        .rejects.toThrow('Failed to fetch restaurant details');
    });
  });

  describe('searchRestaurants', () => {
    it('should handle empty search results', async () => {
      const mockClient = require('@googlemaps/google-maps-services-js').Client;
      mockClient.prototype.textSearch = jest.fn().mockResolvedValue({
        data: { 
          status: 'ZERO_RESULTS', 
          results: [] 
        }
      });

      const params = {
        query: 'nonexistent restaurant',
        location: { latitude: 22.3193, longitude: 114.1694 },
      };

      const results = await googleMapsService.searchRestaurants(params);
      
      expect(results).toEqual([]);
    });
  });

  describe('caching', () => {
    it('should cache and retrieve results', async () => {
      const mockClient = require('@googlemaps/google-maps-services-js').Client;
      const mockResults = [
        {
          place_id: 'test_place_id',
          name: 'Test Restaurant',
          formatted_address: 'Test Address',
          geometry: { location: { lat: 22.3193, lng: 114.1694 } },
          rating: 4.5,
        }
      ];

      mockClient.prototype.placesNearby = jest.fn().mockResolvedValue({
        data: { 
          status: 'OK', 
          results: mockResults 
        }
      });

      const params = {
        location: { latitude: 22.3193, longitude: 114.1694 },
        radius: 1000,
      };

      // First call should hit the API
      const firstResult = await googleMapsService.getNearbyRestaurants(params);
      expect(mockClient.prototype.placesNearby).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const secondResult = await googleMapsService.getNearbyRestaurants(params);
      expect(mockClient.prototype.placesNearby).toHaveBeenCalledTimes(1); // Still 1, not 2

      expect(firstResult).toEqual(secondResult);
    });

    it('should clear cache correctly', async () => {
      // Add some test data to cache first
      const mockClient = require('@googlemaps/google-maps-services-js').Client;
      mockClient.prototype.placesNearby = jest.fn().mockResolvedValue({
        data: { status: 'OK', results: [] }
      });

      const params = {
        location: { latitude: 22.3193, longitude: 114.1694 },
        radius: 1000,
      };

      await googleMapsService.getNearbyRestaurants(params);
      
      // Clear cache
      await googleMapsService.clearCache();

      // Next call should hit API again
      await googleMapsService.getNearbyRestaurants(params);
      expect(mockClient.prototype.placesNearby).toHaveBeenCalledTimes(2);
    });
  });
});