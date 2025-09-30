import request from 'supertest';
import App from '../app';
import { prisma } from '../config/database';

describe('Authentication System E2E Tests', () => {
  let app: App;
  let server: any;

  beforeAll(async () => {
    // Initialize app
    app = new App();
    server = app.getApp();
    
    // Redis connection is handled in global setup
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await prisma.user.deleteMany({
        where: {
          walletAddress: {
            contains: 'test',
          },
        },
      });
    } catch (error) {
      console.log('Cleanup error (expected in test env):', error);
    }
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        originCountry: 'United States',
        arrivalDate: '2025-12-01T00:00:00.000Z',
        departureDate: '2025-12-10T00:00:00.000Z',
        walletAddress: '0xtest1234567890123456789012345678901234567890',
      };

      const response = await request(server)
        .post('/api/v1/auth/register')
        .send(userData);

      console.log('Register response:', response.status, response.body);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.originCountry).toBe(userData.originCountry);
      expect(response.body.data.user.walletAddress).toBe(userData.walletAddress);
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject registration with invalid wallet address', async () => {
      const userData = {
        originCountry: 'United States',
        arrivalDate: '2025-12-01T00:00:00.000Z',
        departureDate: '2025-12-10T00:00:00.000Z',
        walletAddress: 'invalid-wallet-address',
      };

      const response = await request(server)
        .post('/api/v1/auth/register')
        .send(userData);

      console.log('Invalid wallet response:', response.status, response.body);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject registration with departure date before arrival date', async () => {
      const userData = {
        originCountry: 'United States',
        arrivalDate: '2025-12-10T00:00:00.000Z',
        departureDate: '2025-12-01T00:00:00.000Z',
        walletAddress: '0xtest2234567890123456789012345678901234567890',
      };

      const response = await request(server)
        .post('/api/v1/auth/register')
        .send(userData);

      console.log('Invalid dates response:', response.status, response.body);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let testWalletAddress: string;

    beforeAll(async () => {
      // Create a test user for login tests
      testWalletAddress = '0xtest3234567890123456789012345678901234567890';
      
      const registerResponse = await request(server)
        .post('/api/v1/auth/register')
        .send({
          originCountry: 'Canada',
          arrivalDate: '2025-12-01T00:00:00.000Z',
          departureDate: '2025-12-10T00:00:00.000Z',
          walletAddress: testWalletAddress,
        });
      
      console.log('Setup user for login tests:', registerResponse.status);
    });

    it('should login user with valid wallet address', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({ walletAddress: testWalletAddress });

      console.log('Login response:', response.status, response.body);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.walletAddress).toBe(testWalletAddress);
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject login with non-existent wallet address', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({ walletAddress: '0xtest9999999999999999999999999999999999999999' });

      console.log('Non-existent wallet response:', response.status, response.body);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should reject login with invalid wallet address format', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({ walletAddress: 'invalid-address' });

      console.log('Invalid format response:', response.status, response.body);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    let authToken: string;

    beforeAll(async () => {
      // Register and login to get auth token
      const walletAddress = '0xtest4234567890123456789012345678901234567890';
      
      const registerResponse = await request(server)
        .post('/api/v1/auth/register')
        .send({
          originCountry: 'United Kingdom',
          arrivalDate: '2025-12-01T00:00:00.000Z',
          departureDate: '2025-12-10T00:00:00.000Z',
          walletAddress,
        });

      console.log('Setup user for profile tests:', registerResponse.status);

      const loginResponse = await request(server)
        .post('/api/v1/auth/login')
        .send({ walletAddress });

      authToken = loginResponse.body.data.token;
      console.log('Got auth token for profile tests');
    });

    it('should get user profile with valid token', async () => {
      const response = await request(server)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      console.log('Profile response:', response.status, response.body);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.originCountry).toBe('United Kingdom');
      expect(response.body.data.statistics).toBeDefined();
    });

    it('should reject profile request without token', async () => {
      const response = await request(server)
        .get('/api/v1/auth/profile');

      console.log('No token response:', response.status, response.body);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    it('should reject profile request with invalid token', async () => {
      const response = await request(server)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      console.log('Invalid token response:', response.status, response.body);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let authToken: string;

    beforeAll(async () => {
      // Register and login to get auth token
      const walletAddress = '0xtest5234567890123456789012345678901234567890';
      
      const registerResponse = await request(server)
        .post('/api/v1/auth/register')
        .send({
          originCountry: 'Australia',
          arrivalDate: '2025-12-01T00:00:00.000Z',
          departureDate: '2025-12-10T00:00:00.000Z',
          walletAddress,
        });

      console.log('Setup user for logout tests:', registerResponse.status);

      const loginResponse = await request(server)
        .post('/api/v1/auth/login')
        .send({ walletAddress });

      authToken = loginResponse.body.data.token;
      console.log('Got auth token for logout tests');
    });

    it('should logout user successfully', async () => {
      const response = await request(server)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      console.log('Logout response:', response.status, response.body);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Logged out successfully');
    });

    it('should reject subsequent requests with logged out token', async () => {
      const response = await request(server)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      console.log('Post-logout profile response:', response.status, response.body);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Session expired');
    });
  });

  describe('GET /api/v1/users/statistics', () => {
    let authToken: string;

    beforeAll(async () => {
      // Register and login to get auth token
      const walletAddress = '0xtest6234567890123456789012345678901234567890';
      
      const registerResponse = await request(server)
        .post('/api/v1/auth/register')
        .send({
          originCountry: 'Germany',
          arrivalDate: '2025-12-01T00:00:00.000Z',
          departureDate: '2025-12-15T00:00:00.000Z',
          walletAddress,
        });

      const loginResponse = await request(server)
        .post('/api/v1/auth/login')
        .send({ walletAddress });

      authToken = loginResponse.body.data.token;
    });

    it('should get user statistics with valid token', async () => {
      const response = await request(server)
        .get('/api/v1/users/statistics')
        .set('Authorization', `Bearer ${authToken}`);

      console.log('Statistics response:', response.status, response.body);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalCoinsGiven');
      expect(response.body.data).toHaveProperty('totalTransactions');
      expect(response.body.data).toHaveProperty('uniqueRestaurantsVisited');
      expect(response.body.data).toHaveProperty('currentStreak');
      expect(response.body.data).toHaveProperty('daysUntilDeparture');
    });
  });
});