import request from 'supertest';
import App from '../app';
import { redisClient } from '../config/redis';

// Mock the Google Maps service
jest.mock('../services/googleMapsService', () => ({
  googleMapsService: {
    getNearbyRestaurants: jest.fn(),
    getRestaurantDetails: jest.fn(),
    searchRestaurants: jest.fn(),
    calculateDistance: jest.fn(),
    clearCache: jest.fn(),
  },
}));

describe('Restaurant Routes', () => {
  let app: any;
  const mockGoogleMapsService = require('../services/googleMapsService').googleMapsService;

  beforeAll(async () => {
    app = new App().getApp();
    
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/restaurants/nearby', () => {
    it('should return nearby restaurants with valid parameters', async () => {
      const mockRestaurants = [
        {
          placeId: 'test_place_1',
          name: 'Test Restaurant 1',
          address: 'Test Address 1',
          location: { latitude: 22.3193, longitude: 114.1694 },
          rating: 4.5,
        },
        {
          placeId: 'test_place_2',
          name: 'Test Restaurant 2',
          address: 'Test Address 2',
          location: { latitude: 22.3200, longitude: 114.1700 },
          rating: 4.0,
        },
      ];

      mockGoogleMapsService.getNearbyRestaurants.mockResolvedValue(mockRestaurants);
      mockGoogleMapsService.calculateDistance.mockReturnValue(0.5);

      const response = await request(app)
        .get('/api/v1/restaurants/nearby')
        .query({
          lat: 22.3193,
          lng: 114.1694,
          radius: 1000,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('distance');
      expect(response.body.meta.count).toBe(2);
    });

    it('should return 400 for invalid latitude', async () => {
      const response = await request(app)
        .get('/api/v1/restaurants/nearby')
        .query({
          lat: 200, // Invalid latitude
          lng: 114.1694,
          radius: 1000,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for missing required parameters', async () => {
      const response = await request(app)
        .get('/api/v1/restaurants/nearby')
        .query({
          lat: 22.3193,
          // Missing lng and radius
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors gracefully', async () => {
      mockGoogleMapsService.getNearbyRestaurants.mockRejectedValue(
        new Error('Google Maps API error')
      );

      const response = await request(app)
        .get('/api/v1/restaurants/nearby')
        .query({
          lat: 22.3193,
          lng: 114.1694,
          radius: 1000,
        });

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/v1/restaurants/details/:placeId', () => {
    it('should return restaurant details for valid place ID', async () => {
      const mockRestaurant = {
        placeId: 'test_place_id',
        name: 'Test Restaurant',
        address: 'Test Address',
        location: { latitude: 22.3193, longitude: 114.1694 },
        rating: 4.5,
        priceLevel: 2,
      };

      mockGoogleMapsService.getRestaurantDetails.mockResolvedValue(mockRestaurant);

      const response = await request(app)
        .get('/api/v1/restaurants/details/test_place_id');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockRestaurant);
    });

    it('should return 404 for non-existent place ID', async () => {
      mockGoogleMapsService.getRestaurantDetails.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/restaurants/details/nonexistent_place_id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Restaurant not found');
    });

    it('should return 400 for invalid place ID format', async () => {
      const response = await request(app)
        .get('/api/v1/restaurants/details/short'); // Too short

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/v1/restaurants/search', () => {
    it('should return search results for valid query', async () => {
      const mockRestaurants = [
        {
          placeId: 'search_result_1',
          name: 'Pizza Restaurant',
          address: 'Pizza Address',
          location: { latitude: 22.3193, longitude: 114.1694 },
          rating: 4.2,
        },
      ];

      mockGoogleMapsService.searchRestaurants.mockResolvedValue(mockRestaurants);

      const response = await request(app)
        .get('/api/v1/restaurants/search')
        .query({
          q: 'pizza',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta.query).toBe('pizza');
    });

    it('should include distance when location is provided', async () => {
      const mockRestaurants = [
        {
          placeId: 'search_result_1',
          name: 'Pizza Restaurant',
          address: 'Pizza Address',
          location: { latitude: 22.3193, longitude: 114.1694 },
          rating: 4.2,
        },
      ];

      mockGoogleMapsService.searchRestaurants.mockResolvedValue(mockRestaurants);
      mockGoogleMapsService.calculateDistance.mockReturnValue(1.2);

      const response = await request(app)
        .get('/api/v1/restaurants/search')
        .query({
          q: 'pizza',
          lat: 22.3200,
          lng: 114.1700,
        });

      expect(response.status).toBe(200);
      expect(response.body.data[0]).toHaveProperty('distance');
      expect(response.body.meta.searchLocation).toBeDefined();
    });

    it('should return 400 for empty query', async () => {
      const response = await request(app)
        .get('/api/v1/restaurants/search')
        .query({
          q: '', // Empty query
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/v1/restaurants/distance', () => {
    it('should calculate distance between two coordinates', async () => {
      mockGoogleMapsService.calculateDistance.mockReturnValue(1.5);

      const response = await request(app)
        .post('/api/v1/restaurants/distance')
        .send({
          from: { latitude: 22.3193, longitude: 114.1694 },
          to: { latitude: 22.3200, longitude: 114.1700 },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.distance).toBe(1.5);
      expect(response.body.data.unit).toBe('kilometers');
    });

    it('should return 400 for invalid coordinates', async () => {
      const response = await request(app)
        .post('/api/v1/restaurants/distance')
        .send({
          from: { latitude: 200, longitude: 114.1694 }, // Invalid latitude
          to: { latitude: 22.3200, longitude: 114.1700 },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /api/v1/restaurants/cache', () => {
    it('should clear cache successfully', async () => {
      mockGoogleMapsService.clearCache.mockResolvedValue();

      const response = await request(app)
        .delete('/api/v1/restaurants/cache');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cache cleared successfully');
    });

    it('should clear cache with pattern', async () => {
      mockGoogleMapsService.clearCache.mockResolvedValue();

      const response = await request(app)
        .delete('/api/v1/restaurants/cache')
        .query({ pattern: 'nearby' });

      expect(response.status).toBe(200);
      expect(mockGoogleMapsService.clearCache).toHaveBeenCalledWith('nearby');
    });
  });
});