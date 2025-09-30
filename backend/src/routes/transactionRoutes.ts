import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { transactionController } from '../controllers/transactionController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /transactions:
 *   post:
 *     tags: [Transactions]
 *     summary: Record a new smile coin transaction
 *     description: Record a transaction where a tourist gives smile coins to a restaurant. Validates daily limits and creates blockchain transaction.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantId
 *               - amount
 *             properties:
 *               restaurantId:
 *                 type: string
 *                 description: ID of the restaurant receiving coins
 *                 example: "restaurant-uuid-123"
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 3
 *                 description: Number of smile coins to give (1-3 per restaurant per day)
 *                 example: 2
 *               blockchainHash:
 *                 type: string
 *                 description: Blockchain transaction hash (provided by blockchain teammate)
 *                 example: "0xabc123def456..."
 *     responses:
 *       201:
 *         description: Transaction recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Transaction recorded successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Validation error or daily limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               dailyLimit:
 *                 summary: Daily limit exceeded
 *                 value:
 *                   error: "Daily limit exceeded"
 *                   message: "Cannot give more than 3 coins per restaurant per day"
 *               validation:
 *                 summary: Validation error
 *                 value:
 *                   error: "Validation failed"
 *                   message: "Amount must be between 1 and 3 coins"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Restaurant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /transactions/user:
 *   get:
 *     tags: [Transactions]
 *     summary: Get user's transaction history
 *     description: Retrieve paginated transaction history for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of transactions per page
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Transaction'
 *                           - type: object
 *                             properties:
 *                               restaurant:
 *                                 type: object
 *                                 properties:
 *                                   name:
 *                                     type: string
 *                                   address:
 *                                     type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
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