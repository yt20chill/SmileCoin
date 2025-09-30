import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { transactionController } from '../controllers/transactionController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

/**
 * @route POST /api/v1/transactions
 * @desc Record a new transaction
 * @access Private
 */
router.post(
  '/',
  requireAuth,
  validate([
    body('restaurantId')
      .isString()
      .notEmpty()
      .withMessage('Restaurant ID is required'),
    body('amount')
      .isInt({ min: 1, max: 3 })
      .withMessage('Amount must be between 1 and 3 coins'),
  ]),
  transactionController.recordTransaction
);

/**
 * @route GET /api/v1/transactions/user
 * @desc Get transaction history for authenticated user
 * @access Private
 */
router.get(
  '/user',
  requireAuth,
  validate([
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ]),
  transactionController.getUserTransactionHistory
);

/**
 * @route GET /api/v1/transactions/restaurant/:restaurantId
 * @desc Get transaction history for a specific restaurant
 * @access Public (for restaurant dashboard)
 */
router.get(
  '/restaurant/:restaurantId',
  validate([
    param('restaurantId')
      .isString()
      .notEmpty()
      .withMessage('Restaurant ID is required'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ]),
  transactionController.getRestaurantTransactionHistory
);

/**
 * @route GET /api/v1/transactions/user/daily-distribution
 * @desc Get user's daily coin distribution tracking
 * @access Private
 */
router.get(
  '/user/daily-distribution',
  requireAuth,
  validate([
    query('date')
      .optional()
      .isISO8601()
      .withMessage('Date must be in ISO 8601 format (YYYY-MM-DD)'),
  ]),
  transactionController.getUserDailyDistribution
);

/**
 * @route GET /api/v1/transactions/user/daily-history
 * @desc Get user's complete daily history
 * @access Private
 */
router.get(
  '/user/daily-history',
  requireAuth,
  transactionController.getUserDailyHistory
);

/**
 * @route GET /api/v1/transactions/validate/:restaurantId
 * @desc Validate if user can give coins to a restaurant
 * @access Private
 */
router.get(
  '/validate/:restaurantId',
  requireAuth,
  validate([
    param('restaurantId')
      .isString()
      .notEmpty()
      .withMessage('Restaurant ID is required'),
    query('amount')
      .optional()
      .isInt({ min: 1, max: 3 })
      .withMessage('Amount must be between 1 and 3 coins'),
  ]),
  transactionController.validateTransaction
);

export default router;