import { Router } from 'express';
import { authController, loginValidation, registerValidation } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new tourist user
 *     description: Register a new user with travel details and blockchain wallet address. No email or password required for privacy-first approach.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originCountry
 *               - arrivalDate
 *               - departureDate
 *               - walletAddress
 *             properties:
 *               originCountry:
 *                 type: string
 *                 description: Tourist's country of origin
 *                 example: "United States"
 *               arrivalDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date of arrival in Hong Kong
 *                 example: "2024-01-15T10:00:00Z"
 *               departureDate:
 *                 type: string
 *                 format: date-time
 *                 description: Planned departure date from Hong Kong
 *                 example: "2024-01-22T15:00:00Z"
 *               walletAddress:
 *                 type: string
 *                 pattern: "^0x[a-fA-F0-9]{40}$"
 *                 description: Ethereum wallet address for blockchain transactions
 *                 example: "0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4"
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                   example: "User registered successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       description: JWT authentication token
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: Wallet address already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Conflict"
 *               message: "Wallet address already registered"
 */
router.post('/register', registerValidation, authController.register.bind(authController));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user with wallet address
 *     description: Authenticate user using only wallet address (no password required for privacy-first approach)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 pattern: "^0x[a-fA-F0-9]{40}$"
 *                 description: Ethereum wallet address
 *                 example: "0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       description: JWT authentication token
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: Invalid wallet address or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Authentication failed"
 *               message: "Invalid wallet address"
 */
router.post('/login', loginValidation, authController.login.bind(authController));

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout user and invalidate session
 *     description: Logout the authenticated user and invalidate their session token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: "Logout successful"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/logout', authenticateToken, authController.logout.bind(authController));

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     tags: [Authentication]
 *     summary: Get user profile with statistics
 *     description: Retrieve the authenticated user's profile information including coin balance and transaction statistics
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
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalCoinsGiven:
 *                           type: integer
 *                           description: Total coins given to restaurants
 *                         totalTransactions:
 *                           type: integer
 *                           description: Total number of transactions
 *                         daysInHongKong:
 *                           type: integer
 *                           description: Number of days spent in Hong Kong
 *                         physicalCoinProgress:
 *                           type: object
 *                           properties:
 *                             daysCompleted:
 *                               type: integer
 *                             totalDays:
 *                               type: integer
 *                             isEligible:
 *                               type: boolean
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/profile', authenticateToken, authController.getProfile.bind(authController));

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh user session token
 *     description: Refresh the user's JWT token to extend session
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                     token:
 *                       type: string
 *                       description: New JWT authentication token
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/refresh', authenticateToken, authController.refreshSession.bind(authController));

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     tags: [Authentication]
 *     summary: Verify token validity
 *     description: Verify if the provided JWT token is valid (useful for debugging and testing)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
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
 *                   example: "Token is valid"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     walletAddress:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/verify', authenticateToken, authController.verifyToken.bind(authController));

export default router;