import { NextFunction, Request, Response, Router } from 'express';
import { param, query, validationResult } from 'express-validator';
import { dashboardController } from '../controllers/dashboardController';

const router = Router();

/**
 * Validation middleware
 */
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
    return;
  }
  next();
};

/**
 * GET /api/v1/restaurants/:id/dashboard/daily-stats
 * Get daily statistics for a restaurant with date filtering
 */
router.get('/restaurants/:id/dashboard/daily-stats', [
  param('id')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Restaurant ID must be a valid string'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('originCountry')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Origin country must be a string with maximum 100 characters'),
], handleValidationErrors, dashboardController.getDailyStats.bind(dashboardController));

/**
 * GET /api/v1/restaurants/:id/dashboard/total-stats
 * Get total statistics for a restaurant (total coins, ranking, trends)
 */
router.get('/restaurants/:id/dashboard/total-stats', [
  param('id')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Restaurant ID must be a valid string'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('originCountry')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Origin country must be a string with maximum 100 characters'),
], handleValidationErrors, dashboardController.getTotalStats.bind(dashboardController));

/**
 * GET /api/v1/restaurants/:id/dashboard/origin-breakdown
 * Get tourist origin breakdown showing country statistics
 */
router.get('/restaurants/:id/dashboard/origin-breakdown', [
  param('id')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Restaurant ID must be a valid string'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
], handleValidationErrors, dashboardController.getOriginBreakdown.bind(dashboardController));

/**
 * GET /api/v1/restaurants/:id/dashboard/performance-trends
 * Get performance trends with historical data analysis
 */
router.get('/restaurants/:id/dashboard/performance-trends', [
  param('id')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Restaurant ID must be a valid string'),
  query('period')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Period must be one of: daily, weekly, monthly'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
], handleValidationErrors, dashboardController.getPerformanceTrends.bind(dashboardController));

/**
 * GET /api/v1/restaurants/:id/dashboard/comparison
 * Get restaurant comparison and benchmarking data
 */
router.get('/restaurants/:id/dashboard/comparison', [
  param('id')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Restaurant ID must be a valid string'),
  query('compareWith')
    .optional()
    .isIn(['similar', 'top', 'nearby'])
    .withMessage('compareWith must be one of: similar, top, nearby'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be an integer between 1 and 50'),
], handleValidationErrors, dashboardController.getRestaurantComparison.bind(dashboardController));

/**
 * DELETE /api/v1/restaurants/:id/dashboard/cache
 * Clear dashboard cache for a specific restaurant
 */
router.delete('/restaurants/:id/dashboard/cache', [
  param('id')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Restaurant ID must be a valid string'),
], handleValidationErrors, dashboardController.clearRestaurantCache.bind(dashboardController));

/**
 * DELETE /api/v1/dashboard/cache
 * Clear all dashboard cache
 */
router.delete('/dashboard/cache', dashboardController.clearAllCache.bind(dashboardController));

export default router;