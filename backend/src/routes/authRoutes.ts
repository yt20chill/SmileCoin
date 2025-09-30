import { Router } from 'express';
import { authController, loginValidation, registerValidation } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with travel details and wallet address
 * @access  Public
 */
router.post('/register', registerValidation, authController.register.bind(authController));

/**
 * @route   POST /api/auth/login
 * @desc    Login user with wallet address (no password required)
 * @access  Public
 */
router.post('/login', loginValidation, authController.login.bind(authController));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate session
 * @access  Private
 */
router.post('/logout', authenticateToken, authController.logout.bind(authController));

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile with statistics
 * @access  Private
 */
router.get('/profile', authenticateToken, authController.getProfile.bind(authController));

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh user session token
 * @access  Private
 */
router.post('/refresh', authenticateToken, authController.refreshSession.bind(authController));

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token validity (for debugging/testing)
 * @access  Private
 */
router.get('/verify', authenticateToken, authController.verifyToken.bind(authController));

export default router;