import { afterEach, beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import App from '../app';
import { prisma } from '../config/database';
import { redisClient } from '../config/redis';

describe('Transaction Endpoints', () => {
  let app: App;
  let server: any;
  let testUser: any;
  let testRestaurant: any;
  let authToken: string;
  let freshUser: any;
  let freshToken: string;

  beforeAll(async () => {
    // Initialize app
    app = new App();
    server = app.getApp();
    
    // Connect to Redis if not already connected
    if (!redisClient.isClientConnected()) {
      await redisClient.connect();
    }

    // Clean up existing test data
    await prisma.transaction.deleteMany({});
    await prisma.dailyReward.deleteMany({});
    await prisma.restaurant.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user
    testUser = await prisma.user.create({
      data: {
        originCountry: 'USA',
        arrivalDate: new Date('2024-01-01'),
        departureDate: new Date('2024-01-10'),
        walletAddress: '0x1234567890123456789012345678901234567890',
      },
    });

    // Create test restaurant
    testRestaurant = await prisma.restaurant.create({
      data: {
        googlePlaceId: 'test_place_123',
        name: 'Test Restaurant',
        address: '123 Test Street, Hong Kong',
        latitude: 22.3193,
        longitude: 114.1694,
        walletAddress: '0x0987654321098765432109876543210987654321',
        qrCodeData: 'test_qr_data',
      },
    });

    // Create auth token for testing
    const jwt = require('jsonwebtoken');
    const { config } = require('../config/environment');
    authToken = jwt.sign(
      { userId: testUser.id, walletAddress: testUser.walletAddress },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // Create session in Redis for auth
    const { sessionService } = require('../services/sessionService');
    await sessionService.createSession(testUser.id, authToken);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.transaction.deleteMany({});
    await prisma.dailyReward.deleteMany({});
    await prisma.restaurant.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('POST /api/v1/transactions', () => {
    it('should record a transaction successfully', async () => {
      const response = await request(server)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          restaurantId: testRestaurant.id,
          amount: 2,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.transaction).toBeDefined();
      expect(response.body.data.transaction.amount).toBe(2);
      expect(response.body.data.transaction.userId).toBe(testUser.id);
      expect(response.body.data.transaction.restaurantId).toBe(testRestaurant.id);
    });

    it('should fail without authentication', async () => {
      const response = await request(server)
        .post('/api/v1/transactions')
        .send({
          restaurantId: testRestaurant.id,
          amount: 1,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid amount', async () => {
      const response = await request(server)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          restaurantId: testRestaurant.id,
          amount: 5, // Invalid amount (max is 3)
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should fail when daily limit is exceeded', async () => {
      // Create a new user for this test to avoid interference
      const limitTestUser = await prisma.user.create({
        data: {
          originCountry: 'Japan',
          arrivalDate: new Date('2024-01-01'),
          departureDate: new Date('2024-01-10'),
          walletAddress: '0x2222222222222222222222222222222222222222',
        },
      });

      // Create multiple restaurants to avoid per-restaurant daily limits
      const restaurants = [];
      for (let i = 0; i < 5; i++) {
        const restaurant = await prisma.restaurant.create({
          data: {
            googlePlaceId: `test_place_limit_${i}`,
            name: `Test Restaurant ${i}`,
            address: `${i} Test Street, Hong Kong`,
            latitude: 22.3193 + i * 0.001,
            longitude: 114.1694 + i * 0.001,
            walletAddress: `0x${i.toString().padStart(40, '0')}987654321098765432109876543210987654321`,
            qrCodeData: `test_qr_data_${i}`,
          },
        });
        restaurants.push(restaurant);
      }

      const jwt = require('jsonwebtoken');
      const { config } = require('../config/environment');
      const limitTestToken = jwt.sign(
        { userId: limitTestUser.id, walletAddress: limitTestUser.walletAddress },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      const { sessionService } = require('../services/sessionService');
      await sessionService.createSession(limitTestUser.id, limitTestToken);

      // Give exactly 10 coins (the daily limit) - 5 transactions of 2 coins each to different restaurants
      for (let i = 0; i < 5; i++) {
        const restaurant = restaurants[i];
        if (!restaurant) continue;
        
        const response = await request(server)
          .post('/api/v1/transactions')
          .set('Authorization', `Bearer ${limitTestToken}`)
          .send({
            restaurantId: restaurant.id,
            amount: 2,
          });
        
        // All 5 transactions should succeed (5 * 2 = 10 coins, which is exactly the limit)
        expect(response.status).toBe(201);
      }

      // Create one more restaurant for the failing transaction to avoid restaurant daily limit
      const failRestaurant = await prisma.restaurant.create({
        data: {
          googlePlaceId: 'test_place_fail',
          name: 'Fail Test Restaurant',
          address: '999 Fail Street, Hong Kong',
          latitude: 22.3193,
          longitude: 114.1694,
          walletAddress: '0x9999999999999999999999999999999999999999',
          qrCodeData: 'test_qr_data_fail',
        },
      });

      // Now try to give 1 more coin, which should fail due to daily limit
      const failResponse = await request(server)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${limitTestToken}`)
        .send({
          restaurantId: failRestaurant.id,
          amount: 1,
        });

      console.log('Fail response:', failResponse.status, failResponse.body);

      expect(failResponse.status).toBe(400);
      expect(failResponse.body.error).toBe('Daily limit exceeded');

      // Clean up the fail restaurant too
      await prisma.restaurant.delete({ where: { id: failRestaurant.id } });

      // Clean up
      await prisma.transaction.deleteMany({ where: { userId: limitTestUser.id } });
      await prisma.dailyReward.deleteMany({ where: { userId: limitTestUser.id } });
      await prisma.restaurant.deleteMany({ 
        where: { 
          id: { in: restaurants.map(r => r.id) } 
        } 
      });
      await prisma.user.delete({ where: { id: limitTestUser.id } });
    });
  });

  describe('GET /api/v1/transactions/user', () => {
    it('should get user transaction history', async () => {
      const response = await request(server)
        .get('/api/v1/transactions/user')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await request(server)
        .get('/api/v1/transactions/user?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should fail without authentication', async () => {
      const response = await request(server)
        .get('/api/v1/transactions/user');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/transactions/restaurant/:restaurantId', () => {
    it('should get restaurant transaction history', async () => {
      const response = await request(server)
        .get(`/api/v1/transactions/restaurant/${testRestaurant.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
    });

    it('should fail with invalid restaurant ID', async () => {
      const response = await request(server)
        .get('/api/v1/transactions/restaurant/invalid-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/transactions/validate/:restaurantId', () => {
    beforeEach(async () => {
      // Create a fresh user for validation tests
      freshUser = await prisma.user.create({
        data: {
          originCountry: 'Canada',
          arrivalDate: new Date('2024-01-01'),
          departureDate: new Date('2024-01-10'),
          walletAddress: '0x1111111111111111111111111111111111111111',
        },
      });

      const jwt = require('jsonwebtoken');
      const { config } = require('../config/environment');
      freshToken = jwt.sign(
        { userId: freshUser.id, walletAddress: freshUser.walletAddress },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      const { sessionService } = require('../services/sessionService');
      await sessionService.createSession(freshUser.id, freshToken);
    });

    afterEach(async () => {
      if (freshUser) {
        await prisma.transaction.deleteMany({ where: { userId: freshUser.id } });
        await prisma.dailyReward.deleteMany({ where: { userId: freshUser.id } });
        await prisma.user.delete({ where: { id: freshUser.id } });
      }
    });

    it('should validate transaction successfully for new user', async () => {
      const response = await request(server)
        .get(`/api/v1/transactions/validate/${testRestaurant.id}?amount=2`)
        .set('Authorization', `Bearer ${freshToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.canTransact).toBe(true);
      expect(response.body.data.dailyCoinsGiven).toBe(0);
      expect(response.body.data.dailyCoinsRemaining).toBe(10);
    });

    it('should fail validation without authentication', async () => {
      const response = await request(server)
        .get(`/api/v1/transactions/validate/${testRestaurant.id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/transactions/user/daily-distribution', () => {
    it('should get daily distribution for authenticated user', async () => {
      const response = await request(server)
        .get('/api/v1/transactions/user/daily-distribution')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.date).toBeDefined();
      expect(response.body.data.coinsGiven).toBeGreaterThanOrEqual(0);
      expect(response.body.data.restaurantsVisited).toBeGreaterThanOrEqual(0);
    });

    it('should get daily distribution for specific date', async () => {
      const testDate = '2024-01-01';
      const response = await request(server)
        .get(`/api/v1/transactions/user/daily-distribution?date=${testDate}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.date).toBe(testDate);
    });

    it('should fail without authentication', async () => {
      const response = await request(server)
        .get('/api/v1/transactions/user/daily-distribution');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/transactions/user/daily-history', () => {
    it('should get daily history for authenticated user', async () => {
      const response = await request(server)
        .get('/api/v1/transactions/user/daily-history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalDays).toBeGreaterThanOrEqual(0);
      expect(response.body.data.completedDays).toBeGreaterThanOrEqual(0);
      expect(response.body.data.currentStreak).toBeGreaterThanOrEqual(0);
      expect(response.body.data.dailyRecords).toBeInstanceOf(Array);
    });

    it('should fail without authentication', async () => {
      const response = await request(server)
        .get('/api/v1/transactions/user/daily-history');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});