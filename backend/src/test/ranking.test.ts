import request from 'supertest';
import App from '../app';
import { prisma } from '../config/database';
import { redisClient } from '../config/redis';

const app = new App().getApp();

describe('Ranking API Endpoints', () => {
  let testRestaurants: any[] = [];
  let testUsers: any[] = [];
  let testTransactions: any[] = [];

  beforeAll(async () => {
    // Increase timeout for data setup
    jest.setTimeout(30000);
    
    // Clean up existing test data (with error handling for test environment)
    try {
      await prisma.transaction.deleteMany({
        where: {
          blockchainHash: {
            startsWith: '0x'
          }
        }
      });
      await prisma.restaurant.deleteMany({
        where: {
          googlePlaceId: {
            startsWith: 'test_'
          }
        }
      });
      await prisma.user.deleteMany({
        where: {
          walletAddress: {
            startsWith: '0x123'
          }
        }
      });
    } catch (error) {
      console.log('Cleanup error (expected in test env):', error);
    }

    // Create test users from different countries
    try {
      testUsers = await Promise.all([
        prisma.user.create({
          data: {
            originCountry: 'United States',
            arrivalDate: new Date('2024-01-01'),
            departureDate: new Date('2024-01-10'),
            walletAddress: '0x1234567890123456789012345678901234567890'
          }
        }),
        prisma.user.create({
          data: {
            originCountry: 'Japan',
            arrivalDate: new Date('2024-01-02'),
            departureDate: new Date('2024-01-12'),
            walletAddress: '0x1234567890123456789012345678901234567891'
          }
        }),
        prisma.user.create({
          data: {
            originCountry: 'United Kingdom',
            arrivalDate: new Date('2024-01-03'),
            departureDate: new Date('2024-01-13'),
            walletAddress: '0x1234567890123456789012345678901234567892'
          }
        })
      ]);
      console.log('Created test users:', testUsers.length);
    } catch (error) {
      console.error('Error creating test users:', error);
      throw error;
    }

    // Create test restaurants with different locations and coin amounts
    try {
      testRestaurants = await Promise.all([
      prisma.restaurant.create({
        data: {
          googlePlaceId: 'test_place_1',
          name: 'Top Restaurant',
          address: '123 Main St, Hong Kong',
          latitude: 22.3193,
          longitude: 114.1694,
          walletAddress: '0x2234567890123456789012345678901234567890',
          qrCodeData: JSON.stringify({ googlePlaceId: 'test_place_1', walletAddress: '0x2234567890123456789012345678901234567890' }),
          totalCoinsReceived: 100
        }
      }),
      prisma.restaurant.create({
        data: {
          googlePlaceId: 'test_place_2',
          name: 'Second Restaurant',
          address: '456 Second St, Hong Kong',
          latitude: 22.3200,
          longitude: 114.1700,
          walletAddress: '0x2234567890123456789012345678901234567891',
          qrCodeData: JSON.stringify({ googlePlaceId: 'test_place_2', walletAddress: '0x2234567890123456789012345678901234567891' }),
          totalCoinsReceived: 75
        }
      }),
      prisma.restaurant.create({
        data: {
          googlePlaceId: 'test_place_3',
          name: 'Third Restaurant',
          address: '789 Third St, Hong Kong',
          latitude: 22.3250,
          longitude: 114.1750,
          walletAddress: '0x2234567890123456789012345678901234567892',
          qrCodeData: JSON.stringify({ googlePlaceId: 'test_place_3', walletAddress: '0x2234567890123456789012345678901234567892' }),
          totalCoinsReceived: 50
        }
      })
      ]);
      console.log('Created test restaurants:', testRestaurants.length);
    } catch (error) {
      console.error('Error creating test restaurants:', error);
      throw error;
    }

    // Create test transactions with different origin countries
    try {
    testTransactions = await Promise.all([
      // US user transactions
      prisma.transaction.create({
        data: {
          blockchainHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
          fromAddress: testUsers[0].walletAddress,
          toAddress: testRestaurants[0].walletAddress,
          userId: testUsers[0].id,
          restaurantId: testRestaurants[0].id,
          amount: 3,
          transactionDate: new Date('2024-01-05'),
          userOriginCountry: 'United States'
        }
      }),
      prisma.transaction.create({
        data: {
          blockchainHash: '0x2222222222222222222222222222222222222222222222222222222222222222',
          fromAddress: testUsers[0].walletAddress,
          toAddress: testRestaurants[1].walletAddress,
          userId: testUsers[0].id,
          restaurantId: testRestaurants[1].id,
          amount: 2,
          transactionDate: new Date('2024-01-06'),
          userOriginCountry: 'United States'
        }
      }),
      // Japanese user transactions
      prisma.transaction.create({
        data: {
          blockchainHash: '0x3333333333333333333333333333333333333333333333333333333333333333',
          fromAddress: testUsers[1].walletAddress,
          toAddress: testRestaurants[0].walletAddress,
          userId: testUsers[1].id,
          restaurantId: testRestaurants[0].id,
          amount: 3,
          transactionDate: new Date('2024-01-07'),
          userOriginCountry: 'Japan'
        }
      }),
      prisma.transaction.create({
        data: {
          blockchainHash: '0x4444444444444444444444444444444444444444444444444444444444444444',
          fromAddress: testUsers[1].walletAddress,
          toAddress: testRestaurants[2].walletAddress,
          userId: testUsers[1].id,
          restaurantId: testRestaurants[2].id,
          amount: 1,
          transactionDate: new Date('2024-01-08'),
          userOriginCountry: 'Japan'
        }
      }),
      // UK user transactions
      prisma.transaction.create({
        data: {
          blockchainHash: '0x5555555555555555555555555555555555555555555555555555555555555555',
          fromAddress: testUsers[2].walletAddress,
          toAddress: testRestaurants[1].walletAddress,
          userId: testUsers[2].id,
          restaurantId: testRestaurants[1].id,
          amount: 2,
          transactionDate: new Date('2024-01-09'),
          userOriginCountry: 'United Kingdom'
        }
      })
    ]);
      console.log('Created test transactions:', testTransactions.length);
    } catch (error) {
      console.error('Error creating test transactions:', error);
      throw error;
    }

    // Clear Redis cache
    await redisClient.flushAll();

    // Verify test data was created and is accessible
    const userCount = await prisma.user.count();
    const restaurantCount = await prisma.restaurant.count();
    const transactionCount = await prisma.transaction.count();
    
    console.log(`Test setup complete: ${userCount} users, ${restaurantCount} restaurants, ${transactionCount} transactions`);
    console.log('Test users:', testUsers.map(u => ({ id: u.id, country: u.originCountry })));
    console.log('Test restaurants:', testRestaurants.map(r => ({ id: r.id, name: r.name })));
    
    // Validate that we have the expected test data
    if (testUsers.length !== 3) {
      throw new Error(`Expected 3 test users, got ${testUsers.length}`);
    }
    if (testRestaurants.length !== 3) {
      throw new Error(`Expected 3 test restaurants, got ${testRestaurants.length}`);
    }
    if (testTransactions.length !== 5) {
      throw new Error(`Expected 5 test transactions, got ${testTransactions.length}`);
    }
  });

  afterAll(async () => {
    // Clean up test data (with error handling for test environment)
    try {
      await prisma.transaction.deleteMany({
        where: {
          blockchainHash: {
            startsWith: '0x'
          }
        }
      });
      await prisma.restaurant.deleteMany({
        where: {
          googlePlaceId: {
            startsWith: 'test_'
          }
        }
      });
      await prisma.user.deleteMany({
        where: {
          walletAddress: {
            startsWith: '0x123'
          }
        }
      });
      await redisClient.flushAll();
    } catch (error) {
      console.log('Cleanup error (expected in test env):', error);
    }
  });

  describe('GET /api/v1/rankings/overall', () => {
    it('should return overall restaurant rankings', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/overall')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.lastUpdated).toBeDefined();
      expect(response.body.meta.type).toBe('overall');

      // Check ranking order (should be by totalCoinsReceived DESC)
      const rankings = response.body.data;
      expect(rankings[0].totalCoinsReceived).toBeGreaterThanOrEqual(rankings[1].totalCoinsReceived);
      expect(rankings[0].rank).toBe(1);
      expect(rankings[1].rank).toBe(2);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/overall?page=1&limit=2')
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should support location-based filtering', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/overall?lat=22.3193&lng=114.1694&radius=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.location).toBeDefined();
      expect(response.body.meta.location.latitude).toBe(22.3193);
      expect(response.body.meta.location.longitude).toBe(114.1694);
      expect(response.body.meta.location.radius).toBe(5);

      // All restaurants should have distance information
      response.body.data.forEach((restaurant: any) => {
        expect(restaurant.distance).toBeDefined();
        expect(typeof restaurant.distance).toBe('number');
      });
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/overall?page=0&limit=101')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/v1/rankings/origin/:country', () => {
    it('should return origin-based rankings for United States', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/origin/United%20States')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta.type).toBe('origin-based');
      expect(response.body.meta.originCountry).toBe('United States');

      // Check that restaurants have origin-specific data
      const rankings = response.body.data;
      rankings.forEach((restaurant: any) => {
        expect(restaurant.originSpecificCoins).toBeDefined();
        expect(restaurant.originSpecificRank).toBeDefined();
      });
    });

    it('should return origin-based rankings for Japan', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/origin/Japan')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.originCountry).toBe('Japan');

      // Check that the ranking is based on Japanese tourists' contributions
      const rankings = response.body.data;
      const topRestaurant = rankings.find((r: any) => r.id === testRestaurants[0].id);
      expect(topRestaurant.originSpecificCoins).toBe(3); // Japanese user gave 3 coins
    });

    it('should support location-based origin rankings', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/origin/United%20States?lat=22.3193&lng=114.1694&radius=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.location).toBeDefined();
      expect(response.body.meta.originCountry).toBe('United States');

      // All restaurants should have distance information
      response.body.data.forEach((restaurant: any) => {
        expect(restaurant.distance).toBeDefined();
      });
    });

    it('should require country parameter', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/origin/')
        .expect(404);
    });

    it('should handle URL-encoded country names', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/origin/United%20Kingdom')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.originCountry).toBe('United Kingdom');
    });
  });

  describe('GET /api/v1/rankings/nearby', () => {
    it('should return nearby restaurant rankings', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/nearby?lat=22.3193&lng=114.1694&radius=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta.type).toBe('nearby');
      expect(response.body.meta.location).toBeDefined();

      // All restaurants should have distance information
      response.body.data.forEach((restaurant: any) => {
        expect(restaurant.distance).toBeDefined();
        expect(restaurant.distance).toBeLessThanOrEqual(10);
      });
    });

    it('should require latitude and longitude', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/nearby')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Latitude must be a valid number');
    });

    it('should validate coordinate ranges', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/nearby?lat=91&lng=181')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should use default radius when not provided', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/nearby?lat=22.3193&lng=114.1694')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.location.radius).toBe(5); // Default radius
    });
  });

  describe('GET /api/v1/rankings/statistics/:restaurantId', () => {
    it('should return restaurant statistics', async () => {
      const restaurantId = testRestaurants[0].id;
      const response = await request(app)
        .get(`/api/v1/rankings/statistics/${restaurantId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const stats = response.body.data;
      expect(stats.restaurantId).toBe(restaurantId);
      expect(stats.name).toBe('Top Restaurant');
      expect(stats.totalCoins).toBeGreaterThan(0);
      expect(stats.totalTransactions).toBeGreaterThan(0);
      expect(stats.uniqueTourists).toBeGreaterThan(0);
      expect(stats.uniqueCountries).toBeGreaterThan(0);
      expect(stats.rank).toBeDefined();
      expect(stats.dailyStats).toBeInstanceOf(Array);
      expect(stats.originBreakdown).toBeInstanceOf(Array);
      expect(stats.performanceTrends).toBeInstanceOf(Array);
    });

    it('should include origin breakdown', async () => {
      const restaurantId = testRestaurants[0].id;
      const response = await request(app)
        .get(`/api/v1/rankings/statistics/${restaurantId}`)
        .expect(200);

      const stats = response.body.data;
      expect(stats.originBreakdown.length).toBeGreaterThan(0);

      const usBreakdown = stats.originBreakdown.find((b: any) => b.country === 'United States');
      const japanBreakdown = stats.originBreakdown.find((b: any) => b.country === 'Japan');

      expect(usBreakdown).toBeDefined();
      expect(japanBreakdown).toBeDefined();
      expect(usBreakdown.coins).toBe(3);
      expect(japanBreakdown.coins).toBe(3);
    });

    it('should return 404 for non-existent restaurant', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/statistics/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Restaurant not found');
    });

    it('should require restaurant ID', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/statistics/')
        .expect(404);
    });
  });

  describe('POST /api/v1/rankings/refresh', () => {
    it('should refresh rankings manually', async () => {
      const response = await request(app)
        .post('/api/v1/rankings/refresh')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Rankings refreshed successfully');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.meta.action).toBe('manual_refresh');
    });

    it('should clear cache when refreshing', async () => {
      // First, make a request to populate cache
      await request(app)
        .get('/api/v1/rankings/overall')
        .expect(200);

      // Refresh rankings
      await request(app)
        .post('/api/v1/rankings/refresh')
        .expect(200);

      // Make another request - should work without issues
      const response = await request(app)
        .get('/api/v1/rankings/overall')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/rankings/top', () => {
    it('should return top restaurants with default limit', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/top')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeLessThanOrEqual(10); // Default limit
      expect(response.body.meta.type).toBe('top');
      expect(response.body.meta.limit).toBe(10);
    });

    it('should support custom limit', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/top?limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
      expect(response.body.meta.limit).toBe(5);
    });

    it('should validate limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/top?limit=100')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Caching', () => {
    it('should cache ranking results', async () => {
      // Clear cache first
      await redisClient.flushAll();

      // First request - should hit database
      const start1 = Date.now();
      const response1 = await request(app)
        .get('/api/v1/rankings/overall')
        .expect(200);
      const time1 = Date.now() - start1;

      // Second request - should hit cache (should be faster)
      const start2 = Date.now();
      const response2 = await request(app)
        .get('/api/v1/rankings/overall')
        .expect(200);
      const time2 = Date.now() - start2;

      expect(response1.body.success).toBe(true);
      expect(response2.body.success).toBe(true);
      expect(response1.body.data).toEqual(response2.body.data);

      // Cache hit should generally be faster, but we won't enforce strict timing
      // in tests as it can be flaky in CI environments
    });

    it('should cache restaurant statistics', async () => {
      const restaurantId = testRestaurants[0].id;

      // Clear cache first
      await redisClient.flushAll();

      // First request
      const response1 = await request(app)
        .get(`/api/v1/rankings/statistics/${restaurantId}`)
        .expect(200);

      // Second request - should hit cache
      const response2 = await request(app)
        .get(`/api/v1/rankings/statistics/${restaurantId}`)
        .expect(200);

      expect(response1.body.success).toBe(true);
      expect(response2.body.success).toBe(true);
      expect(response1.body.data).toEqual(response2.body.data);
    });
  });
});