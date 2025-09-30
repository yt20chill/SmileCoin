import { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authService } from '../services/authService';
import { CreateUserRequest } from '../types';

export class AuthController {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('Register endpoint hit with body:', req.body);
      
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const userData: CreateUserRequest = req.body;
      console.log('Calling authService.registerUser with:', userData);
      
      const result = await authService.registerUser(userData);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      console.error('Registration error:', error);
      next(error);
    }
  }

  /**
   * Login user with wallet address
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const { walletAddress } = req.body;
      const result = await authService.loginUser(walletAddress);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const result = await authService.logoutUser(req.user.userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const profile = await authService.getUserProfile(req.user.userId);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh user session
   */
  async refreshSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const result = await authService.refreshSession(req.user.userId);

      res.status(200).json({
        success: true,
        message: 'Session refreshed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify token endpoint (for debugging/testing)
   */
  async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Invalid token',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
          userId: req.user.userId,
          walletAddress: req.user.walletAddress,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

// Validation middleware
export const registerValidation = [
  body('originCountry')
    .notEmpty()
    .withMessage('Origin country is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Origin country must be between 2 and 100 characters'),
  
  body('arrivalDate')
    .notEmpty()
    .withMessage('Arrival date is required')
    .isISO8601()
    .withMessage('Arrival date must be a valid ISO 8601 date'),
  
  body('departureDate')
    .notEmpty()
    .withMessage('Departure date is required')
    .isISO8601()
    .withMessage('Departure date must be a valid ISO 8601 date'),
  
  body('walletAddress')
    .notEmpty()
    .withMessage('Wallet address is required')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Wallet address must be a valid Ethereum address'),
];

export const loginValidation = [
  body('walletAddress')
    .notEmpty()
    .withMessage('Wallet address is required')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Wallet address must be a valid Ethereum address'),
];

export const authController = new AuthController();