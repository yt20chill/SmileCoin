import { Request, Response } from 'express';
import { transactionService } from '../services/transactionService';

export class TransactionController {
  /**
   * Record a new transaction (non-blockchain)
   * POST /api/v1/transactions
   */
  async recordTransaction(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User must be authenticated to record transactions'
        });
        return;
      }

      const { restaurantId, amount } = req.body;

      const result = await transactionService.recordTransaction({
        userId,
        restaurantId,
        amount
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Transaction recorded successfully'
      });
    } catch (error: any) {
      console.error('Error recording transaction:', error);
      
      if (error.message.includes('daily limit') || error.message.includes('Daily coin limit')) {
        res.status(400).json({
          success: false,
          error: 'Daily limit exceeded',
          message: error.message
        });
        return;
      }

      if (error.message.includes('insufficient coins')) {
        res.status(400).json({
          success: false,
          error: 'Insufficient coins',
          message: error.message
        });
        return;
      }

      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Resource not found',
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to record transaction'
      });
    }
  }

  /**
   * Get transaction history for authenticated user
   * GET /api/v1/transactions/user
   */
  async getUserTransactionHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User must be authenticated to view transaction history'
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await transactionService.getUserTransactionHistory(userId, { page, limit });

      res.status(200).json({
        success: true,
        data: result.transactions,
        pagination: result.pagination,
        message: 'Transaction history retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error getting user transaction history:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve transaction history'
      });
    }
  }

  /**
   * Get transaction history for a specific restaurant
   * GET /api/v1/transactions/restaurant/:restaurantId
   */
  async getRestaurantTransactionHistory(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId } = req.params;
      
      if (!restaurantId) {
        res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Restaurant ID is required'
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await transactionService.getRestaurantTransactionHistory(restaurantId, { page, limit });

      res.status(200).json({
        success: true,
        data: result.transactions,
        pagination: result.pagination,
        message: 'Restaurant transaction history retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error getting restaurant transaction history:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Restaurant not found',
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve restaurant transaction history'
      });
    }
  }

  /**
   * Get user's daily coin distribution tracking
   * GET /api/v1/transactions/user/daily-distribution
   */
  async getUserDailyDistribution(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User must be authenticated to view daily distribution'
        });
        return;
      }

      const date = req.query.date as string;
      const result = await transactionService.getUserDailyDistribution(userId, date);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Daily distribution retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error getting user daily distribution:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve daily distribution'
      });
    }
  }

  /**
   * Get user's daily coin distribution history
   * GET /api/v1/transactions/user/daily-history
   */
  async getUserDailyHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User must be authenticated to view daily history'
        });
        return;
      }

      const result = await transactionService.getUserDailyHistory(userId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Daily history retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error getting user daily history:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve daily history'
      });
    }
  }

  /**
   * Validate if user can give coins to a restaurant
   * GET /api/v1/transactions/validate/:restaurantId
   */
  async validateTransaction(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User must be authenticated to validate transactions'
        });
        return;
      }

      const { restaurantId } = req.params;
      
      if (!restaurantId) {
        res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Restaurant ID is required'
        });
        return;
      }

      const amount = parseInt(req.query.amount as string) || 1;

      const validation = await transactionService.validateTransaction(userId, restaurantId, amount);

      res.status(200).json({
        success: true,
        data: validation,
        message: 'Transaction validation completed'
      });
    } catch (error: any) {
      console.error('Error validating transaction:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to validate transaction'
      });
    }
  }
}

export const transactionController = new TransactionController();