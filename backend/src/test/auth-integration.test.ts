import request from 'supertest';
import App from '../app';
import { prisma } from '../config/database';

describe('Authentication Integration Tests', () => {
  let app: App;
  let server: any;

  beforeAll(async () => {
    app = new App();
    server = app.getApp();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.transaction.deleteMany();
    await prisma.dailyReward.deleteMany();
    await prisma.user.deleteMany();
    await prisma.restaurant.deleteMany();
  });

  afterAll(async () => {
    // Clean up database after all tests
    await prisma.transaction.deleteMany();
    await prisma.dailyReward.deleteMany();
    await prisma.user.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    const validUserData = {
      originCountry: 'United States',
      arrivalDate: '2024-01-15T10:00:00Z',
      departureDate: '2024-01-22T15:00:00Z',
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
    };

    it('should register a new user successfully', async () => {
      const response = await request(server)
        .post('/api/v1/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            originCountry: validUserData.originCountry,
            walletAddress: validUserData.walletAddress,
          },
          token: expect.any(String),
        },
      });

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { walletAddress: validUserData.walletAddress },
      });
      expect(user).toBeTruthy();
      expect(user?.originCountry).toBe(validUserData.originCountry);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        originCountry: 'United States',
        // Missing other required fields
      };

      const response = await request(server)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
        details: expect.any(Array),
      });
    });

    it('should return 400 for invalid wallet address format', async () => {
      const invalidData = {
        ...validUserData,
        walletAddress: 'invalid-wallet-address',
      };

      const response = await request(server)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringContaining('wallet address'),
          }),
        ]),
      });
    });

    it('should return 400 for invalid date format', async () => {
      const invalidData = {
        ...validUserData,
        arrivalDate: 'invalid-date',
      };

      const response = await request(server)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringContaining('date'),
          }),
        ]),
      });
    });

    it('should return 409 for duplicate wallet address', async () => {
      // First registration
      await request(server)
        .post('/api/v1/auth/register')
        .send(validUserData)
        .expect(201);

      // Second registration with same wallet address
      const response = await request(server)
        .post('/api/v1/auth/register')
        .send(validUserData)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Wallet address already registered',
      });
    });

    it('should validate departure date is after arrival date', async () => {
      const invalidData = {
        ...validUserData,
        arrivalDate: '2024-01-22T10:00:00Z',
        departureDate: '2024-01-15T15:00:00Z',
      };

      const response = await request(server)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringContaining('departure'),
          }),
        ]),
      });
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const userData = {
      originCountry: 'United States',
      arrivalDate: '2024-01-15T10:00:00Z',
      departureDate: '2024-01-22T15:00:00Z',
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
    };

    beforeEach(async () => {
      // Create a user for login tests
      await request(server)
        .post('/api/v1/auth/register')
        .send(userData);
    });

    it('should login user successfully', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({ walletAddress: userData.walletAddress })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            originCountry: userData.originCountry,
            walletAddress: userData.walletAddress,
          },
          token: expect.any(String),
        },
      });
    });

    it('should return 401 for non-existent wallet address', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({ walletAddress: '0x1234567890123456789012345678901234567890' })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Authentication failed',
      });
    });

    it('should return 400 for missing wallet address', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
      });
    });

    it('should return 400 for invalid wallet address format', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({ walletAddress: 'invalid-wallet' })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
      });
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      // Register and login to get auth token
      const registerResponse = await request(server)
        .post('/api/v1/auth/register')
        .send({
          originCountry: 'United States',
          arrivalDate: '2024-01-15T10:00:00Z',
          departureDate: '2024-01-22T15:00:00Z',
          walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
        });

      authToken = registerResponse.body.data.token;
      userId = registerResponse.body.data.user.id;
    });

    it('should return user profile with statistics', async () => {
      const response = await request(server)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            id: userId,
            originCountry: 'United States',
            walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
          },
          statistics: {
            totalCoinsGiven: expect.any(Number),
            totalTransactions: expect.any(Number),
            daysInHongKong: expect.any(Number),
            physicalCoinProgress: {
              daysCompleted: expect.any(Number),
              totalDays: expect.any(Number),
              isEligible: expect.any(Boolean),
            },
          },
        },
      });
    });

    it('should return 401 for missing auth token', async () => {
      const response = await request(server)
        .get('/api/v1/auth/profile')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Authentication error',
      });
    });

    it('should return 401 for invalid auth token', async () => {
      const response = await request(server)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Authentication error',
      });
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register to get auth token
      const registerResponse = await request(server)
        .post('/api/v1/auth/register')
        .send({
          originCountry: 'United States',
          arrivalDate: '2024-01-15T10:00:00Z',
          departureDate: '2024-01-22T15:00:00Z',
          walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
        });

      authToken = registerResponse.body.data.token;
    });

    it('should logout user successfully', async () => {
      const response = await request(server)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Logout successful',
      });
    });

    it('should return 401 for missing auth token', async () => {
      const response = await request(server)
        .post('/api/v1/auth/logout')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Authentication error',
      });
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register to get auth token
      const registerResponse = await request(server)
        .post('/api/v1/auth/register')
        .send({
          originCountry: 'United States',
          arrivalDate: '2024-01-15T10:00:00Z',
          departureDate: '2024-01-22T15:00:00Z',
          walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
        });

      authToken = registerResponse.body.data.token;
    });

    it('should refresh token successfully', async () => {
      const response = await request(server)
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          token: expect.any(String),
        },
      });

      // New token should be different from old token
      expect(response.body.data.token).not.toBe(authToken);
    });

    it('should return 401 for missing auth token', async () => {
      const response = await request(server)
        .post('/api/v1/auth/refresh')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Authentication error',
      });
    });
  });

  describe('GET /api/v1/auth/verify', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      // Register to get auth token
      const registerResponse = await request(server)
        .post('/api/v1/auth/register')
        .send({
          originCountry: 'United States',
          arrivalDate: '2024-01-15T10:00:00Z',
          departureDate: '2024-01-22T15:00:00Z',
          walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
        });

      authToken = registerResponse.body.data.token;
      userId = registerResponse.body.data.user.id;
    });

    it('should verify token successfully', async () => {
      const response = await request(server)
        .get('/api/v1/auth/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Token is valid',
        data: {
          userId: userId,
          walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
        },
      });
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(server)
        .get('/api/v1/auth/verify')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Authentication error',
      });
    });
  });
});