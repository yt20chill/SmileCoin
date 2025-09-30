import { NextFunction, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { physicalCoinService } from '../services/physicalCoinService';

export class PhysicalCoinController {
  /**
   * Get user's physical coin progress summary
   */
  async getProgressSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const summary = await physicalCoinService.getProgressSummary(req.user.userId);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's detailed daily progress
   */
  async getDailyProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const limit = parseInt(req.query.limit as string) || 30;
      const progress = await physicalCoinService.getDailyProgress(req.user.userId, limit);

      res.status(200).json({
        success: true,
        data: progress,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check voucher eligibility for current user
   */
  async checkVoucherEligibility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const isEligible = await physicalCoinService.checkVoucherEligibility(req.user.userId);

      res.status(200).json({
        success: true,
        data: {
          isEligible,
          userId: req.user.userId,
          checkedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate voucher for eligible user
   */
  async generateVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      try {
        const voucher = await physicalCoinService.generateVoucher(req.user.userId);

        res.status(201).json({
          success: true,
          data: voucher,
          message: 'Physical coin voucher generated successfully',
        });
      } catch (error: any) {
        if (error.message === 'User is not eligible for physical coin voucher') {
          res.status(400).json({
            success: false,
            error: 'Not eligible for voucher',
            message: 'You must complete all daily coin distributions for your entire trip to be eligible for a physical coin souvenir.',
          });
          return;
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's existing voucher
   */
  async getVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const voucher = await physicalCoinService.getUserVoucher(req.user.userId);

      if (!voucher) {
        res.status(404).json({
          success: false,
          error: 'No voucher found',
          message: 'You have not generated a physical coin voucher yet.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: voucher,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Track daily coin distribution (called when user receives daily coins)
   */
  async trackDailyDistribution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const date = req.body.date ? new Date(req.body.date) : new Date();
      
      await physicalCoinService.trackDailyDistribution(req.user.userId, date);

      res.status(200).json({
        success: true,
        message: 'Daily coin distribution tracked successfully',
        data: {
          userId: req.user.userId,
          date: date.toISOString().split('T')[0],
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update coins given (called when user gives coins to restaurants)
   */
  async updateCoinsGiven(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const { amount, date } = req.body;
      const transactionDate = date ? new Date(date) : new Date();

      await physicalCoinService.updateCoinsGiven(req.user.userId, amount, transactionDate);

      res.status(200).json({
        success: true,
        message: 'Coins given updated successfully',
        data: {
          userId: req.user.userId,
          amount,
          date: transactionDate.toISOString().split('T')[0],
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

// Validation middleware
export const dailyProgressValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

export const updateCoinsGivenValidation = [
  // No validation needed since this is an internal endpoint called by transaction service
];

export const physicalCoinController = new PhysicalCoinController();