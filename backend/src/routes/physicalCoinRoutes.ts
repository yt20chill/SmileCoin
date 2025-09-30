import { Router } from 'express';
import {
    dailyProgressValidation,
    physicalCoinController,
    updateCoinsGivenValidation,
} from '../controllers/physicalCoinController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /physical-coin/progress/summary:
 *   get:
 *     tags: [Physical Coins]
 *     summary: Get physical coin progress summary
 *     description: Get a summary of the user's progress toward earning a physical smile coin souvenir
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress summary retrieved successfully
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
 *                     totalDays:
 *                       type: integer
 *                       description: Total days of stay in Hong Kong
 *                     completedDays:
 *                       type: integer
 *                       description: Days where all coins were given out
 *                     remainingDays:
 *                       type: integer
 *                       description: Days remaining until departure
 *                     isEligible:
 *                       type: boolean
 *                       description: Whether user is eligible for physical coin
 *                     completionPercentage:
 *                       type: number
 *                       format: float
 *                       description: Percentage of days completed
 *                     voucherGenerated:
 *                       type: boolean
 *                       description: Whether voucher has been generated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/progress/summary',
  authenticateToken,
  physicalCoinController.getProgressSummary.bind(physicalCoinController)
);

/**
 * @route   GET /api/physical-coin/progress/daily
 * @desc    Get user's detailed daily progress
 * @access  Private
 */
router.get(
  '/progress/daily',
  authenticateToken,
  dailyProgressValidation,
  physicalCoinController.getDailyProgress.bind(physicalCoinController)
);

/**
 * @route   GET /api/physical-coin/voucher/eligibility
 * @desc    Check if user is eligible for physical coin voucher
 * @access  Private
 */
router.get(
  '/voucher/eligibility',
  authenticateToken,
  physicalCoinController.checkVoucherEligibility.bind(physicalCoinController)
);

/**
 * @swagger
 * /physical-coin/voucher/generate:
 *   post:
 *     tags: [Physical Coins]
 *     summary: Generate physical coin voucher
 *     description: Generate a voucher for physical smile coin souvenir collection (only for eligible users who gave all coins every day)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Voucher generated successfully
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
 *                   example: "Physical coin voucher generated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     voucherId:
 *                       type: string
 *                       description: Unique voucher identifier
 *                     qrCode:
 *                       type: string
 *                       description: QR code for voucher redemption
 *                     collectionInstructions:
 *                       type: string
 *                       description: Instructions for collecting physical coin
 *                     expiryDate:
 *                       type: string
 *                       format: date-time
 *                       description: Voucher expiry date
 *       400:
 *         description: User not eligible for voucher
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Not eligible"
 *               message: "User has not completed all daily coin distributions"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         description: Voucher already generated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/voucher/generate',
  authenticateToken,
  physicalCoinController.generateVoucher.bind(physicalCoinController)
);

/**
 * @route   GET /api/physical-coin/voucher
 * @desc    Get user's existing voucher
 * @access  Private
 */
router.get(
  '/voucher',
  authenticateToken,
  physicalCoinController.getVoucher.bind(physicalCoinController)
);

/**
 * @route   POST /api/physical-coin/track-daily
 * @desc    Track daily coin distribution (internal endpoint)
 * @access  Private
 */
router.post(
  '/track-daily',
  authenticateToken,
  physicalCoinController.trackDailyDistribution.bind(physicalCoinController)
);

/**
 * @route   POST /api/physical-coin/update-coins-given
 * @desc    Update coins given by user (internal endpoint)
 * @access  Private
 */
router.post(
  '/update-coins-given',
  authenticateToken,
  updateCoinsGivenValidation,
  physicalCoinController.updateCoinsGiven.bind(physicalCoinController)
);

export default router;