import { NextFunction, Request, Response, Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { googleMapsService, NearbyRestaurantsParams, RestaurantSearchParams } from '../services/googleMapsService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Validation middleware
 */
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
    return;
  }
  next();
};

/**
 * GET /api/v1/restaurants/nearby
 * Search for nearby restaurants using GPS coordinates and radius
 */
router.get('/nearby', [
  query('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a valid number between -90 and 90'),
  query('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a valid number between -180 and 180'),
  query('radius')
    .isInt({ min: 100, max: 50000 })
    .withMessage('Radius must be an integer between 100 and 50000 meters'),
  query('type')
    .optional()
    .isString()
    .withMessage('Type must be a string'),
  query('keyword')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Keyword must be a string with maximum 100 characters'),
  query('minPrice')
    .optional()
    .isInt({ min: 0, max: 4 })
    .withMessage('Min price must be an integer between 0 and 4'),
  query('maxPrice')
    .optional()
    .isInt({ min: 0, max: 4 })
    .withMessage('Max price must be an integer between 0 and 4'),
], handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius, type, keyword, minPrice, maxPrice } = req.query;

    const params: NearbyRestaurantsParams = {
      location: {
        latitude: parseFloat(lat as string),
        longitude: parseFloat(lng as string),
      },
      radius: parseInt(radius as string, 10),
      type: type as string,
      keyword: keyword as string,
      minPrice: minPrice ? parseInt(minPrice as string, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice as string, 10) : undefined,
    };

    logger.info(`Nearby restaurants request: ${JSON.stringify(params)}`);

    const restaurants = await googleMapsService.getNearbyRestaurants(params);

    // Calculate distances and sort by distance
    const restaurantsWithDistance = restaurants.map(restaurant => ({
      ...restaurant,
      distance: googleMapsService.calculateDistance(params.location, restaurant.location),
    })).sort((a, b) => a.distance - b.distance);

    res.status(200).json({
      success: true,
      data: restaurantsWithDistance,
      meta: {
        count: restaurantsWithDistance.length,
        searchLocation: params.location,
        searchRadius: params.radius,
      },
    });

  } catch (error) {
    logger.error('Error in nearby restaurants endpoint:', error);
    next(error);
  }
});

/**
 * GET /api/v1/restaurants/details/:placeId
 * Get restaurant details using Google Place ID
 */
router.get('/details/:placeId', [
  param('placeId')
    .isString()
    .isLength({ min: 10, max: 200 })
    .withMessage('Place ID must be a valid string'),
], handleValidationErrors, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { placeId } = req.params;

    logger.info(`Restaurant details request for place ID: ${placeId}`);

    const restaurant = await googleMapsService.getRestaurantDetails(placeId as string);

    if (!restaurant) {
      res.status(404).json({
        success: false,
        error: 'Restaurant not found',
        message: `No restaurant found with place ID: ${placeId}`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: restaurant,
    });

  } catch (error) {
    logger.error('Error in restaurant details endpoint:', error);
    next(error);
  }
});

/**
 * GET /api/v1/restaurants/search
 * Search restaurants by text query
 */
router.get('/search', [
  query('q')
    .isString()
    .isLength({ min: 1, max: 200 })
    .withMessage('Query must be a non-empty string with maximum 200 characters'),
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
    .isInt({ min: 100, max: 50000 })
    .withMessage('Radius must be an integer between 100 and 50000 meters'),
], handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, lat, lng, radius } = req.query;

    const params: RestaurantSearchParams = {
      query: q as string,
    };

    if (lat && lng) {
      params.location = {
        latitude: parseFloat(lat as string),
        longitude: parseFloat(lng as string),
      };
    }

    if (radius) {
      params.radius = parseInt(radius as string, 10);
    }

    logger.info(`Restaurant search request: ${JSON.stringify(params)}`);

    const restaurants = await googleMapsService.searchRestaurants(params);

    // If location is provided, calculate distances and sort by distance
    let restaurantsWithDistance = restaurants;
    if (params.location) {
      restaurantsWithDistance = restaurants.map(restaurant => ({
        ...restaurant,
        distance: googleMapsService.calculateDistance(params.location!, restaurant.location),
      })).sort((a, b) => a.distance - b.distance);
    }

    res.status(200).json({
      success: true,
      data: restaurantsWithDistance,
      meta: {
        count: restaurantsWithDistance.length,
        query: params.query,
        searchLocation: params.location || null,
        searchRadius: params.radius || null,
      },
    });

  } catch (error) {
    logger.error('Error in restaurant search endpoint:', error);
    next(error);
  }
});

/**
 * POST /api/v1/restaurants/distance
 * Calculate distance between two coordinates
 */
router.post('/distance', [
  body('from.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('From latitude must be a valid number between -90 and 90'),
  body('from.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('From longitude must be a valid number between -180 and 180'),
  body('to.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('To latitude must be a valid number between -90 and 90'),
  body('to.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('To longitude must be a valid number between -180 and 180'),
], handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.body;

    const distance = googleMapsService.calculateDistance(from, to);

    res.status(200).json({
      success: true,
      data: {
        distance,
        unit: 'kilometers',
        from,
        to,
      },
    });

  } catch (error) {
    logger.error('Error in distance calculation endpoint:', error);
    next(error);
  }
});

/**
 * DELETE /api/v1/restaurants/cache
 * Clear Google Maps API cache (for development/testing)
 */
router.delete('/cache', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pattern } = req.query;

    await googleMapsService.clearCache(pattern as string);

    res.status(200).json({
      success: true,
      message: 'Cache cleared successfully',
      pattern: pattern || 'all Google Maps cache',
    });

  } catch (error) {
    logger.error('Error clearing cache:', error);
    next(error);
  }
});

export default router;