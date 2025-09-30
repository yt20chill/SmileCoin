// Test setup file
import { prisma } from '../config/database';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/tourist_rewards_test';

// Mock Redis for tests to avoid connection issues
const mockRedisStore = new Map();

jest.mock('../config/redis', () => ({
  redisClient: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    isClientConnected: jest.fn().mockReturnValue(true),
    get: jest.fn().mockImplementation((key: string) => {
      return Promise.resolve(mockRedisStore.get(key) || null);
    }),
    set: jest.fn().mockImplementation((key: string, value: string, ttl?: number) => {
      mockRedisStore.set(key, value);
      return Promise.resolve('OK');
    }),
    setEx: jest.fn().mockImplementation((key: string, ttl: number, value: string) => {
      mockRedisStore.set(key, value);
      return Promise.resolve('OK');
    }),
    del: jest.fn().mockImplementation((key: string) => {
      const existed = mockRedisStore.has(key);
      mockRedisStore.delete(key);
      return Promise.resolve(existed ? 1 : 0);
    }),
    exists: jest.fn().mockImplementation((key: string) => {
      return Promise.resolve(mockRedisStore.has(key) ? 1 : 0);
    }),
    keys: jest.fn().mockResolvedValue([]),
    flushAll: jest.fn().mockImplementation(() => {
      mockRedisStore.clear();
      return Promise.resolve('OK');
    }),
    getClient: jest.fn().mockReturnValue({
      flushAll: jest.fn().mockImplementation(() => {
        mockRedisStore.clear();
        return Promise.resolve('OK');
      }),
      keys: jest.fn().mockResolvedValue([]),
      del: jest.fn().mockImplementation((key: string) => {
        const existed = mockRedisStore.has(key);
        mockRedisStore.delete(key);
        return Promise.resolve(existed ? 1 : 0);
      })
    })
  }
}));

// Mock Google Maps service to avoid API calls in tests
jest.mock('../services/googleMapsService', () => ({
  GoogleMapsService: {
    getInstance: jest.fn().mockReturnValue({
      getRestaurantDetails: jest.fn().mockResolvedValue({
        placeId: 'test_place_id',
        name: 'Test Restaurant',
        address: '123 Test Street',
        latitude: 22.3193,
        longitude: 114.1694,
        rating: 4.5,
        priceLevel: 2,
        photos: [],
        openingHours: null,
        types: ['restaurant'],
        vicinity: 'Test Area',
        businessStatus: 'OPERATIONAL'
      }),
      searchNearbyRestaurants: jest.fn().mockResolvedValue([]),
      searchRestaurants: jest.fn().mockResolvedValue([])
    })
  }
}));

// Global test teardown
afterAll(async () => {
  // Clean up database connection
  await prisma.$disconnect();
});

// Mock console methods in tests to reduce noise
if (process.env.NODE_ENV === 'test') {
  // Temporarily disable console mocking to see debug output
  // console.log = jest.fn();
  // console.info = jest.fn();
  // console.warn = jest.fn();
  // console.error = jest.fn();
}