import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { redisClient } from '../config/redis';
import { AuthController } from '../controllers/authController';

// Mock dependencies
jest.mock('../config/database');
jest.mock('../config/redis');
jest.mock('jsonwebtoken');

describe('AuthController Unit Tests', () => {
  let authController: AuthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    authController = new AuthController();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    beforeEach(() => {
      mockRequest = {
        body: {
          originCountry: 'United States',
          arrivalDate: '2024-01-15T10:00:00Z',
          departureDate: '2024-01-22T15:00:00Z',
          walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
        },
      };
    });

    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        originCountry: 'United States',
        arrivalDate: new Date('2024-01-15T10:00:00Z'),
        departureDate: new Date('2024-01-22T15:00:00Z'),
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockToken = 'mock-jwt-token';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);
      (redisClient.setEx as jest.Mock).mockResolvedValue('OK');

      await authController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { walletAddress: mockRequest.body.walletAddress },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          originCountry: mockRequest.body.originCountry,
          arrivalDate: new Date(mockRequest.body.arrivalDate),
          departureDate: new Date(mockRequest.body.departureDate),
          walletAddress: mockRequest.body.walletAddress,
        },
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, walletAddress: mockUser.walletAddress },
        expect.any(String),
        { expiresIn: '24h' }
      );
      expect(redisClient.setEx).toHaveBeenCalledWith(
        `session:${mockUser.id}`,
        86400,
        mockToken
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: mockUser.id,
            originCountry: mockUser.originCountry,
            arrivalDate: mockUser.arrivalDate,
            departureDate: mockUser.departureDate,
            walletAddress: mockUser.walletAddress,
            createdAt: mockUser.createdAt,
          },
          token: mockToken,
        },
      });
    });

    it('should return 409 if wallet address already exists', async () => {
      const existingUser = {
        id: 'existing-user',
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      await authController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Wallet address already registered',
        message: 'A user with this wallet address already exists',
      });
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(dbError);

      await authController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });

    it('should validate required fields', async () => {
      mockRequest.body = {
        originCountry: 'United States',
        // Missing arrivalDate, departureDate, walletAddress
      };

      await authController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        message: 'Missing required fields: arrivalDate, departureDate, walletAddress',
      });
    });

    it('should validate wallet address format', async () => {
      mockRequest.body.walletAddress = 'invalid-wallet-address';

      await authController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        message: 'Invalid wallet address format',
      });
    });

    it('should validate date formats', async () => {
      mockRequest.body.arrivalDate = 'invalid-date';

      await authController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        message: 'Invalid date format for arrivalDate',
      });
    });

    it('should validate departure date is after arrival date', async () => {
      mockRequest.body.arrivalDate = '2024-01-22T10:00:00Z';
      mockRequest.body.departureDate = '2024-01-15T15:00:00Z';

      await authController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        message: 'Departure date must be after arrival date',
      });
    });
  });

  describe('login', () => {
    beforeEach(() => {
      mockRequest = {
        body: {
          walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
        },
      };
    });

    it('should login user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        originCountry: 'United States',
        arrivalDate: new Date('2024-01-15T10:00:00Z'),
        departureDate: new Date('2024-01-22T15:00:00Z'),
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockToken = 'mock-jwt-token';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);
      (redisClient.setEx as jest.Mock).mockResolvedValue('OK');

      await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { walletAddress: mockRequest.body.walletAddress },
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, walletAddress: mockUser.walletAddress },
        expect.any(String),
        { expiresIn: '24h' }
      );
      expect(redisClient.setEx).toHaveBeenCalledWith(
        `session:${mockUser.id}`,
        86400,
        mockToken
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: mockUser.id,
            originCountry: mockUser.originCountry,
            arrivalDate: mockUser.arrivalDate,
            departureDate: mockUser.departureDate,
            walletAddress: mockUser.walletAddress,
            createdAt: mockUser.createdAt,
          },
          token: mockToken,
        },
      });
    });

    it('should return 401 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication failed',
        message: 'Invalid wallet address',
      });
    });

    it('should validate wallet address format', async () => {
      mockRequest.body.walletAddress = 'invalid-wallet';

      await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        message: 'Invalid wallet address format',
      });
    });

    it('should handle missing wallet address', async () => {
      mockRequest.body = {};

      await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        message: 'Wallet address is required',
      });
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      mockRequest = {
        user: {
          userId: 'user-123',
          walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
        },
      };
    });

    it('should logout user successfully', async () => {
      (redisClient.del as jest.Mock).mockResolvedValue(1);

      await authController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(redisClient.del).toHaveBeenCalledWith('session:user-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful',
      });
    });

    it('should handle Redis errors gracefully', async () => {
      const redisError = new Error('Redis connection failed');
      (redisClient.del as jest.Mock).mockRejectedValue(redisError);

      await authController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(redisError);
    });
  });

  describe('getProfile', () => {
    beforeEach(() => {
      mockRequest = {
        user: {
          userId: 'user-123',
          walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
        },
      };
    });

    it('should return user profile with statistics', async () => {
      const mockUser = {
        id: 'user-123',
        originCountry: 'United States',
        arrivalDate: new Date('2024-01-15T10:00:00Z'),
        departureDate: new Date('2024-01-22T15:00:00Z'),
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTransactions = [
        { amount: 2 },
        { amount: 1 },
        { amount: 3 },
      ];

      const mockDailyRewards = [
        { rewardDate: new Date('2024-01-15'), allCoinsGiven: true },
        { rewardDate: new Date('2024-01-16'), allCoinsGiven: true },
        { rewardDate: new Date('2024-01-17'), allCoinsGiven: false },
      ];

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);
      (prisma.dailyReward.findMany as jest.Mock).mockResolvedValue(mockDailyRewards);

      await authController.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: {
            id: mockUser.id,
            originCountry: mockUser.originCountry,
            arrivalDate: mockUser.arrivalDate,
            departureDate: mockUser.departureDate,
            walletAddress: mockUser.walletAddress,
            createdAt: mockUser.createdAt,
          },
          statistics: {
            totalCoinsGiven: 6,
            totalTransactions: 3,
            daysInHongKong: 7,
            physicalCoinProgress: {
              daysCompleted: 2,
              totalDays: 7,
              isEligible: false,
            },
          },
        },
      });
    });

    it('should return 404 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await authController.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
        message: 'User profile not found',
      });
    });
  });

  describe('verifyToken', () => {
    beforeEach(() => {
      mockRequest = {
        user: {
          userId: 'user-123',
          walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
        },
      };
    });

    it('should verify token successfully', async () => {
      await authController.verifyToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token is valid',
        data: {
          userId: 'user-123',
          walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
        },
      });
    });
  });

  describe('refreshSession', () => {
    beforeEach(() => {
      mockRequest = {
        user: {
          userId: 'user-123',
          walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
        },
      };
    });

    it('should refresh session token successfully', async () => {
      const newToken = 'new-jwt-token';
      (jwt.sign as jest.Mock).mockReturnValue(newToken);
      (redisClient.setEx as jest.Mock).mockResolvedValue('OK');

      await authController.refreshSession(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-123', walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4' },
        expect.any(String),
        { expiresIn: '24h' }
      );
      expect(redisClient.setEx).toHaveBeenCalledWith(
        'session:user-123',
        86400,
        newToken
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          token: newToken,
        },
      });
    });
  });
});