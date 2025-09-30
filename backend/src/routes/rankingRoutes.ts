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
 * GET /api/v1/rankings/overall
 * Get overall restaurant rankings based on total smile coins
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
 * POST /api/v1/rankings/refresh
 * Manual ranking refresh endpoint for demo purposes
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