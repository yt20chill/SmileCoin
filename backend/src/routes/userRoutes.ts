import { Router } from 'express';
import { transactionHistoryValidation, userController } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, userController.getProfile.bind(userController));

/**
 * @route   GET /api/users/statistics
 * @desc    Get user statistics (coins given, restaurants visited, etc.)
 * @access  Private
 */
router.get('/statistics', authenticateToken, userController.getStatistics.bind(userController));

/**
 * @route   GET /api/users/daily-rewards
 * @desc    Get user's daily rewards progress
 * @access  Private
 */
router.get('/daily-rewards', authenticateToken, userController.getDailyRewards.bind(userController));

/**
 * @route   GET /api/users/transactions
 * @desc    Get user's transaction history with pagination
 * @access  Private
 */
router.get('/transactions', authenticateToken, transactionHistoryValidation, userController.getTransactionHistory.bind(userController));

/**
 * @route   GET /api/users/wallet/balance
 * @desc    Get user's wallet balance (placeholder for blockchain integration)
 * @access  Private
 */
router.get('/wallet/balance', authenticateToken, userController.getWalletBalance.bind(userController));

export default router;