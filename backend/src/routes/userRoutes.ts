import { Router } from 'express';
import { transactionHistoryValidation, userController } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/profile', authenticateToken, userController.getProfile.bind(userController));

/**
 * @swagger
 * /users/statistics:
 *   get:
 *     tags: [Users]
 *     summary: Get user statistics
 *     description: Get comprehensive statistics for the authenticated user including coins given, restaurants visited, etc.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
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
 *                     totalCoinsGiven:
 *                       type: integer
 *                       description: Total smile coins given to restaurants
 *                     totalTransactions:
 *                       type: integer
 *                       description: Total number of transactions
 *                     restaurantsVisited:
 *                       type: integer
 *                       description: Number of unique restaurants visited
 *                     daysInHongKong:
 *                       type: integer
 *                       description: Number of days spent in Hong Kong
 *                     averageCoinsPerDay:
 *                       type: number
 *                       format: float
 *                       description: Average coins given per day
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/statistics', authenticateToken, userController.getStatistics.bind(userController));

/**
 * @swagger
 * /users/daily-rewards:
 *   get:
 *     tags: [Users]
 *     summary: Get user's daily rewards progress
 *     description: Retrieve the user's daily coin rewards and distribution progress
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daily rewards progress retrieved successfully
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
 *                     dailyRewards:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           coinsReceived:
 *                             type: integer
 *                           coinsGiven:
 *                             type: integer
 *                           allCoinsGiven:
 *                             type: boolean
 *                     totalDays:
 *                       type: integer
 *                     completedDays:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/daily-rewards', authenticateToken, userController.getDailyRewards.bind(userController));

/**
 * @swagger
 * /users/transactions:
 *   get:
 *     tags: [Users]
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
 *                         $ref: '#/components/schemas/Transaction'
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
router.get('/transactions', authenticateToken, transactionHistoryValidation, userController.getTransactionHistory.bind(userController));

/**
 * @swagger
 * /users/wallet/balance:
 *   get:
 *     tags: [Users]
 *     summary: Get user's wallet balance
 *     description: Get the user's current smile coin balance from blockchain (integration point with blockchain teammate)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully
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
 *                     balance:
 *                       type: integer
 *                       description: Current smile coin balance
 *                     walletAddress:
 *                       type: string
 *                       description: User's blockchain wallet address
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *                       description: Last balance update timestamp
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       503:
 *         description: Blockchain service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/wallet/balance', authenticateToken, userController.getWalletBalance.bind(userController));

export default router;