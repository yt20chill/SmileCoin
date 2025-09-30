// Using Jest test framework (no imports needed)
import request from 'supertest';
import App from '../app';
import { prisma } from '../config/database';
import { redisClient } from '../config/redis';

const app = new App().getApp();

describe('Dashboard API Endpoints', () => {
  let testRestaurantId: string;
  let testUserId: string;
  let testTransactionId: string;

  beforeAll(async () => {
    // Increase timeout for data setup
    jest.setTimeout(30000);
    
    console.log('Starting dashboard test setup...');
    
    // Clean up any existing test data
    await prisma.transaction.deleteMany({
      where: {
        OR: [
          { user: { originCountry: 'TEST_COUNTRY' } },
          { restaurant: { name: { contains: 'Test Dashboard Restaurant' } } }
        ]
      }
    });
    await prisma.dailyReward.deleteMany({
      where: { user: { originCountry: 'TEST_COUNTRY' } }
    });
    await prisma.user.deleteMany({
      where: { originCountry: 'TEST_COUNTRY' }
    });
    await prisma.restaurant.deleteMany({
      where: { name: { contains: 'Test Dashboard Restaurant' } }
    });

    // Create test user
    try {
      const testUser = await prisma.user.create({
        data: {
          originCountry: 'TEST_COUNTRY',
          arrivalDate: new Date('2024-01-01'),
          departureDate: new Date('2024-01-15'),
          walletAddress: '0x1234567890123456789012345678901234567890',
        },
      });
      testUserId = testUser.id;
      console.log('Created test user with ID:', testUserId);
    } catch (error) {
      console.error('Error creating test user:', error);
      throw error;
    }

    // Create test restaurant
    try {
      const testRestaurant = await prisma.restaurant.create({
        data: {
          googlePlaceId: 'test_place_id_dashboard',
          name: 'Test Dashboard Restaurant',
          address: '123 Test Street, Hong Kong',
          latitude: 22.3193,
          longitude: 114.1694,
          walletAddress: '0x0987654321098765432109876543210987654321',
          qrCodeData: 'test_qr_data_dashboard',
          totalCoinsReceived: 50,
        },
      });
      testRestaurantId = testRestaurant.id;
      console.log('Created test restaurant with ID:', testRestaurantId);
    } catch (error) {
      console.error('Error creating test restaurant:', error);
      throw error;
    }

    // Create test transactions with different dates and origins
    const transactions = [
      {
        blockchainHash: '0xtest1',
        fromAddress: '0x1234567890123456789012345678901234567890',
        toAddress: '0x0987654321098765432109876543210987654321',
        userId: testUserId,
        restaurantId: testRestaurantId,
        amount: 3,
        transactionDate: new Date('2024-01-01'),
        userOriginCountry: 'TEST_COUNTRY',
      },
      {
        blockchainHash: '0xtest2',
        fromAddress: '0x1234567890123456789012345678901234567890',
        toAddress: '0x0987654321098765432109876543210987654321',
        userId: testUserId,
        restaurantId: testRestaurantId,
        amount: 2,
        transactionDate: new Date('2024-01-02'),
        userOriginCountry: 'TEST_COUNTRY',
      },
      {
        blockchainHash: '0xtest3',
        fromAddress: '0x1234567890123456789012345678901234567890',
        toAddress: '0x0987654321098765432109876543210987654321',
        userId: testUserId,
        restaurantId: testRestaurantId,
        amount: 1,
        transactionDate: new Date('2024-01-03'),
        userOriginCountry: 'ANOTHER_COUNTRY',
      },
    ];

    try {
      for (const transaction of transactions) {
        await prisma.transaction.create({ data: transaction });
      }
      console.log('Created', transactions.length, 'test transactions');
    } catch (error) {
      console.error('Error creating test transactions:', error);
      throw error;
    }

    // Validate test data was created properly
    console.log('Dashboard test setup complete:');
    console.log('- testUserId:', testUserId);
    console.log('- testRestaurantId:', testRestaurantId);
    
    if (!testUserId) {
      throw new Error('Test user ID is undefined');
    }
    if (!testRestaurantId) {
      throw new Error('Test restaurant ID is undefined');
    }
    
    // Verify data exists in database
    const userExists = await prisma.user.findUnique({ where: { id: testUserId } });
    const restaurantExists = await prisma.restaurant.findUnique({ where: { id: testRestaurantId } });
    
    if (!userExists) {
      throw new Error('Test user not found in database');
    }
    if (!restaurantExists) {
      throw new Error('Test restaurant not found in database');
    }
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.transaction.deleteMany({
      where: {
        OR: [
          { user: { originCountry: 'TEST_COUNTRY' } },
          { restaurant: { name: { contains: 'Test Dashboard Restaurant' } } }
        ]
      }
    });
    await prisma.dailyReward.deleteMany({
      where: { user: { originCountry: 'TEST_COUNTRY' } }
    });
    await prisma.user.deleteMany({
      where: { originCountry: 'TEST_COUNTRY' }
    });
    await prisma.restaurant.deleteMany({
      where: { name: { contains: 'Test Dashboard Restaurant' } }
    });

    // Clear Redis cache
    await redisClient.flushAll();
  });

  describe('GET /api/v1/restaurants/:id/dashboard/daily-stats', () => {
    it('should get daily statistics for a restaurant', async () => {
      console.log('Test running with testRestaurantId:', testRestaurantId);
      const response = await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/daily-stats`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta.restaurantId).toBe(testRestaurantId);
      expect(response.body.meta.totalDays).toBeGreaterThan(0);
      expect(response.body.meta.totalCoins).toBeGreaterThan(0);
    });

    it('should filter daily statistics by date range', async () => {
      const response = await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/daily-stats`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-02'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should filter daily statistics by origin country', async () => {
      const response = await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/daily-stats`)
        .query({
          originCountry: 'TEST_COUNTRY'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return 404 for missing restaurant ID in URL', async () => {
      const response = await request(app)
        .get('/api/v1/restaurants//dashboard/daily-stats')
        .expect(404);

      expect(response.body.error).toBe('Route not found');
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/daily-stats`)
        .query({
          startDate: 'invalid-date'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/v1/restaurants/:id/dashboard/total-stats', () => {
    it('should get total statistics for a restaurant', async () => {
      const response = await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/total-stats`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalCoins');
      expect(response.body.data).toHaveProperty('totalTransactions');
      expect(response.body.data).toHaveProperty('uniqueTourists');
      expect(response.body.data).toHaveProperty('averageCoinsPerDay');
      expect(response.body.data).toHaveProperty('rankingPosition');
      expect(response.body.data).toHaveProperty('totalRestaurants');
      expect(response.body.data).toHaveProperty('percentileRank');
      expect(response.body.data.totalCoins).toBeGreaterThan(0);
      expect(response.body.data.rankingPosition).toBeGreaterThan(0);
    });

    it('should filter total statistics by date range', async () => {
      const response = await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/total-stats`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-02'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalCoins');
      expect(response.body.meta.filters.startDate).toBeDefined();
      expect(response.body.meta.filters.endDate).toBeDefined();
    });
  });

  describe('GET /api/v1/restaurants/:id/dashboard/origin-breakdown', () => {
    it('should get origin breakdown for a restaurant', async () => {
      const response = await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/origin-breakdown`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta.totalCountries).toBeGreaterThan(0);
      expect(response.body.meta.totalCoins).toBeGreaterThan(0);
      
      if (response.body.data.length > 0) {
        const firstOrigin = response.body.data[0];
        expect(firstOrigin).toHaveProperty('country');
        expect(firstOrigin).toHaveProperty('coinsReceived');
        expect(firstOrigin).toHaveProperty('touristCount');
        expect(firstOrigin).toHaveProperty('percentage');
        expect(firstOrigin).toHaveProperty('averageCoinsPerTourist');
      }
    });

    it('should limit origin breakdown results', async () => {
      const response = await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/origin-breakdown`)
        .query({ limit: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /api/v1/restaurants/:id/dashboard/performance-trends', () => {
    it('should get daily performance trends for a restaurant', async () => {
      const response = await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/performance-trends`)
        .query({ period: 'daily' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta.period).toBe('daily');
      expect(response.body.meta.totalPeriods).toBeGreaterThanOrEqual(0);
      
      if (response.body.data.length > 0) {
        const firstTrend = response.body.data[0];
        expect(firstTrend).toHaveProperty('period');
        expect(firstTrend).toHaveProperty('coinsReceived');
        expect(firstTrend).toHaveProperty('uniqueTourists');
        expect(firstTrend).toHaveProperty('transactions');
        expect(firstTrend).toHaveProperty('growthRate');
      }
    });

    it('should get weekly performance trends for a restaurant', async () => {
      const response = await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/performance-trends`)
        .query({ period: 'weekly' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.period).toBe('weekly');
    });

    it('should get monthly performance trends for a restaurant', async () => {
      const response = await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/performance-trends`)
        .query({ period: 'monthly' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.period).toBe('monthly');
    });

    it('should return 400 for invalid period', async () => {
      const response = await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/performance-trends`)
        .query({ period: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/v1/restaurants/:id/dashboard/comparison', () => {
    it('should get similar restaurant comparison', async () => {
      const response = await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/comparison`)
        .query({ compareWith: 'similar' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta.compareWith).toBe('similar');
      
      if (response.body.data.length > 0) {
        const firstComparison = response.body.data[0];
        expect(firstComparison).toHaveProperty('restaurantId');
        expect(firstComparison).toHaveProperty('name');
        expect(firstComparison).toHaveProperty('totalCoins');
        expect(firstComparison).toHaveProperty('rankingPosition');
        expect(firstComparison).toHaveProperty('averageCoinsPerDay');
        expect(firstComparison).toHaveProperty('uniqueTourists');
      }
    });

    it('should get top restaurant comparison', async () => {
      const response = await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/comparison`)
        .query({ compareWith: 'top', limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.compareWith).toBe('top');
      expect(response.body.meta.limit).toBe(5);
    });

    it('should get nearby restaurant comparison', async () => {
      const response = await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/comparison`)
        .query({ compareWith: 'nearby' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.compareWith).toBe('nearby');
    });

    it('should return 400 for invalid compareWith parameter', async () => {
      const response = await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/comparison`)
        .query({ compareWith: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid limit parameter', async () => {
      const response = await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/comparison`)
        .query({ limit: 100 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /api/v1/restaurants/:id/dashboard/cache', () => {
    it('should clear dashboard cache for a specific restaurant', async () => {
      const response = await request(app)
        .delete(`/api/v1/restaurants/${testRestaurantId}/dashboard/cache`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Dashboard cache cleared successfully');
      expect(response.body.restaurantId).toBe(testRestaurantId);
    });
  });

  describe('DELETE /api/v1/dashboard/cache', () => {
    it('should clear all dashboard cache', async () => {
      const response = await request(app)
        .delete('/api/v1/dashboard/cache')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('All dashboard cache cleared successfully');
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent restaurant ID gracefully', async () => {
      const nonExistentId = 'non-existent-id';
      
      const response = await request(app)
        .get(`/api/v1/restaurants/${nonExistentId}/dashboard/daily-stats`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(0); // Should return empty array for non-existent restaurant
    });

    it('should validate date ranges properly', async () => {
      const response = await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/daily-stats`)
        .query({
          startDate: '2024-01-10',
          endDate: '2024-01-01' // End date before start date
        })
        .expect(200); // Should still work, just return empty or filtered results

      expect(response.body.success).toBe(true);
    });
  });

  describe('Caching', () => {
    it('should cache dashboard results', async () => {
      // First request - should hit database
      const response1 = await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/total-stats`)
        .expect(200);

      // Second request - should hit cache
      const response2 = await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/total-stats`)
        .expect(200);

      expect(response1.body.data).toEqual(response2.body.data);
    });

    it('should clear cache when requested', async () => {
      // Make a request to populate cache
      await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/total-stats`)
        .expect(200);

      // Clear cache
      await request(app)
        .delete(`/api/v1/restaurants/${testRestaurantId}/dashboard/cache`)
        .expect(200);

      // Make another request - should hit database again
      const response = await request(app)
        .get(`/api/v1/restaurants/${testRestaurantId}/dashboard/total-stats`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});