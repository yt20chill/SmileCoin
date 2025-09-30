import { NextFunction, Request, Response, Router } from 'express';
import { param, query, validationResult } from 'express-validator';
import { rankingController } from '../controllers/rankingController';

const router = Router();

/**
 * Validation middleware
 */
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    const firstError = errorArray[0];
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: firstError?.msg || 'Validation error',
      details: errorArray,
    });
    return;
  }
  next();
};

/**
 * @swagger
 * /rankings/overall:
 *   get:
 *     tags: [Rankings]
 *     summary: Get overall restaurant rankings
 *     description: Get restaurants ranked by total smile coins received from all tourists
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
 *         description: Number of restaurants per page
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *           format: double
 *           minimum: -90
 *           maximum: 90
 *         description: Latitude for location-based filtering (optional)
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *           format: double
 *           minimum: -180
 *           maximum: 180
 *         description: Longitude for location-based filtering (optional)
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           format: float
 *           minimum: 0.1
 *           maximum: 50
 *         description: Search radius in kilometers (optional)
 *     responses:
 *       200:
 *         description: Restaurant rankings retrieved successfully
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
 *                     rankings:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Restaurant'
 *                           - type: object
 *                             properties:
 *                               rank:
 *                                 type: integer
 *                                 description: Current ranking position
 *                               distance:
 *                                 type: number
 *                                 format: float
 *                                 description: Distance from search location (if provided)
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
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/overall', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
  query('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a valid number between -90 and 90'),
  query('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a valid number between -180 and 180'),
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 50 })
    .withMessage('Radius must be a number between 0.1 and 50 kilometers'),
], handleValidationErrors, rankingController.getOverallRankings.bind(rankingController));

/**
 * GET /api/v1/rankings/origin/:country
 * Get origin-based restaurant recommendations using user country data
 */
router.get('/origin/:country', [
  param('country')
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be a valid string between 2 and 100 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
  query('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a valid number between -90 and 90'),
  query('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a valid number between -180 and 180'),
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 50 })
    .withMessage('Radius must be a number between 0.1 and 50 kilometers'),
], handleValidationErrors, rankingController.getOriginBasedRankings.bind(rankingController));

/**
 * GET /api/v1/rankings/nearby
 * Get nearby restaurants ranking with GPS integration
 */
router.get('/nearby', [
  query('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a valid number between -90 and 90'),
  query('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a valid number between -180 and 180'),
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 50 })
    .withMessage('Radius must be a number between 0.1 and 50 kilometers'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
], handleValidationErrors, rankingController.getNearbyRankings.bind(rankingController));

/**
 * GET /api/v1/rankings/statistics/:restaurantId
 * Get restaurant statistics for web dashboard
 */
router.get('/statistics/:restaurantId', [
  param('restaurantId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Restaurant ID must be a valid string'),
], handleValidationErrors, rankingController.getRestaurantStatistics.bind(rankingController));

/**
 * @swagger
 * /rankings/refresh:
 *   post:
 *     tags: [Rankings]
 *     summary: Refresh restaurant rankings
 *     description: Manually refresh restaurant rankings for demo purposes. Recalculates all ranking data from current transactions.
 *     responses:
 *       200:
 *         description: Rankings refreshed successfully
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
 *                   example: "Rankings refreshed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedRestaurants:
 *                       type: integer
 *                       description: Number of restaurants updated
 *                     refreshTimestamp:
 *                       type: string
 *                       format: date-time
 *                       description: When the refresh was completed
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/refresh', rankingController.refreshRankings.bind(rankingController));

/**
 * GET /api/v1/rankings/top
 * Get top restaurants (shortcut for overall rankings with limit)
 */
router.get('/top', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be an integer between 1 and 50'),
], handleValidationErrors, rankingController.getTopRestaurants.bind(rankingController));

export default router;