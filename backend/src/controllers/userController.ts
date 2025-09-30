import { NextFunction, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { userService } from '../services/userService';

export class UserController {
  /**
   * Get user profile (same as auth profile but accessible via /users route)
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

      const user = await userService.getUserById(req.user.userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user statistics
   */
  async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const statistics = await userService.getUserStatistics(req.user.userId);

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's daily rewards progress
   */
  async getDailyRewards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const progress = await userService.getDailyRewardsProgress(req.user.userId);

      res.status(200).json({
        success: true,
        data: progress,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's transaction history
   */
  async getTransactionHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await userService.getTransactionHistory(req.user.userId, limit, offset);

      res.status(200).json({
        success: true,
        data: result.transactions,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's wallet balance (placeholder for blockchain integration)
   */
  async getWalletBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      // This is a placeholder - blockchain teammate will implement actual balance checking
      // For now, we'll calculate based on daily rewards and transactions
      const statistics = await userService.getUserStatistics(req.user.userId);
      
      // Mock calculation: assume user gets 10 coins daily and has given some away
      const mockBalance = {
        totalCoinsReceived: statistics.totalDaysActive * 10, // Assuming 10 coins per active day
        totalCoinsGiven: statistics.totalCoinsGiven,
        currentBalance: (statistics.totalDaysActive * 10) - statistics.totalCoinsGiven,
        walletAddress: req.user.walletAddress,
        lastUpdated: new Date().toISOString(),
      };

      res.status(200).json({
        success: true,
        data: mockBalance,
        message: 'This is a mock balance calculation. Blockchain integration will provide real balance.',
      });
    } catch (error) {
      next(error);
    }
  }
}

// Validation middleware
export const transactionHistoryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
];

export const userController = new UserController();