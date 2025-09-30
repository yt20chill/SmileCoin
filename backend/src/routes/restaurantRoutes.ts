import { NextFunction, Request, Response, Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { restaurantController } from '../controllers/restaurantController';
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
 * POST /api/v1/restaurants/register
 * Register a new restaurant using Google Place ID
 */
router.post('/register', [
  body('googlePlaceId')
    .isString()
    .isLength({ min: 10, max: 200 })
    .withMessage('Google Place ID must be a valid string'),
  body('walletAddress')
    .isString()
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Wallet address must be a valid Ethereum address'),
], handleValidationErrors, restaurantController.registerRestaurant.bind(restaurantController));

/**
 * @swagger
 * /restaurants/qr/verify:
 *   post:
 *     tags: [Restaurants]
 *     summary: Verify restaurant QR code
 *     description: Verify QR code data scanned by tourists to ensure it belongs to a valid registered restaurant. Used before coin transactions.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qrCodeData
 *             properties:
 *               qrCodeData:
 *                 type: string
 *                 description: QR code data string (JSON format containing restaurant info)
 *                 example: '{"googlePlaceId":"ChIJN1t_tDeuEmsRUsoyG83frY4","walletAddress":"0x1111111111111111111111111111111111111111"}'
 *     responses:
 *       200:
 *         description: QR code verified successfully
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
 *                   example: "QR code verified successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     restaurant:
 *                       $ref: '#/components/schemas/Restaurant'
 *                     isValid:
 *                       type: boolean
 *                       description: Whether the QR code is valid
 *                     canReceiveCoins:
 *                       type: boolean
 *                       description: Whether restaurant can currently receive coins
 *       400:
 *         description: Invalid QR code data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidFormat:
 *                 summary: Invalid QR code format
 *                 value:
 *                   error: "Invalid QR code"
 *                   message: "QR code data is not valid JSON"
 *               missingData:
 *                 summary: Missing required data
 *                 value:
 *                   error: "Invalid QR code"
 *                   message: "QR code missing required restaurant information"
 *       404:
 *         description: Restaurant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Restaurant not found"
 *               message: "No restaurant found matching QR code data"
 */
router.post('/qr/verify', [
  body('qrCodeData')
    .isString()
    .isLength({ min: 1 })
    .withMessage('QR code data must be a non-empty string'),
], handleValidationErrors, restaurantController.verifyQRCode.bind(restaurantController));

/**
 * @swagger
 * /restaurants/search/advanced:
 *   get:
 *     tags: [Restaurants]
 *     summary: Advanced restaurant search
 *     description: Advanced search for restaurants with multiple filter options including name, location, cuisine type, and geographic filtering with pagination.
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *         description: General search query
 *         example: "seafood restaurant"
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *         description: Restaurant name filter
 *         example: "Golden Dragon"
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *         description: Location/area filter
 *         example: "Tsim Sha Tsui"
 *       - in: query
 *         name: cuisine
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Cuisine type filter
 *         example: "Chinese"
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *           format: double
 *           minimum: -90
 *           maximum: 90
 *         description: Latitude for location-based filtering
 *         example: 22.3193
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *           format: double
 *           minimum: -180
 *           maximum: 180
 *         description: Longitude for location-based filtering
 *         example: 114.1694
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           format: float
 *           minimum: 0.1
 *           maximum: 50
 *         description: Search radius in kilometers
 *         example: 2.5
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
 *           default: 20
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Advanced search results retrieved successfully
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
 *                     restaurants:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/GoogleRestaurant'
 *                           - type: object
 *                             properties:
 *                               distance:
 *                                 type: number
 *                                 format: float
 *                                 description: Distance from search location (if provided)
 *                               matchScore:
 *                                 type: number
 *                                 format: float
 *                                 description: Relevance score for search query
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
 *                 meta:
 *                   type: object
 *                   properties:
 *                     searchCriteria:
 *                       type: object
 *                       description: Applied search filters
 *                     executionTime:
 *                       type: number
 *                       format: float
 *                       description: Search execution time in milliseconds
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         description: Search service error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/search/advanced', [
  query('q')
    .optional()
    .isString()
    .isLength({ min: 1, max: 200 })
    .withMessage('Query must be a non-empty string with maximum 200 characters'),
  query('name')
    .optional()
    .isString()
    .isLength({ min: 1, max: 200 })
    .withMessage('Name must be a non-empty string with maximum 200 characters'),
  query('location')
    .optional()
    .isString()
    .isLength({ min: 1, max: 200 })
    .withMessage('Location must be a non-empty string with maximum 200 characters'),
  query('cuisine')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Cuisine type must be a non-empty string with maximum 100 characters'),
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
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
], handleValidationErrors, restaurantController.searchRestaurants.bind(restaurantController));

/**
 * @swagger
 * /restaurants/place/{placeId}:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get restaurant by Google Place ID
 *     description: Retrieve restaurant information using Google Maps Place ID. Returns both our database record and Google Maps data.
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 10
 *           maxLength: 200
 *         description: Google Maps Place ID
 *         example: "ChIJN1t_tDeuEmsRUsoyG83frY4"
 *     responses:
 *       200:
 *         description: Restaurant found successfully
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
 *                     restaurant:
 *                       $ref: '#/components/schemas/Restaurant'
 *                     googleData:
 *                       $ref: '#/components/schemas/GoogleRestaurant'
 *                     isRegistered:
 *                       type: boolean
 *                       description: Whether restaurant is registered in our system
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Restaurant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Not found"
 *               message: "Restaurant with Place ID not found"
 */
router.get('/place/:placeId', [
  param('placeId')
    .isString()
    .isLength({ min: 10, max: 200 })
    .withMessage('Place ID must be a valid string'),
], handleValidationErrors, restaurantController.getRestaurantByPlaceId.bind(restaurantController));

/**
 * @swagger
 * /restaurants/{id}/profile:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get restaurant profile with analytics
 *     description: Get comprehensive restaurant profile including Google Maps data, statistics, and performance metrics
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant ID (UUID)
 *         example: "restaurant-uuid-123"
 *     responses:
 *       200:
 *         description: Restaurant profile retrieved successfully
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
 *                     restaurant:
 *                       $ref: '#/components/schemas/Restaurant'
 *                     googleData:
 *                       $ref: '#/components/schemas/GoogleRestaurant'
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalCoinsReceived:
 *                           type: integer
 *                           description: Total smile coins received
 *                         totalTransactions:
 *                           type: integer
 *                           description: Total number of transactions
 *                         averageRating:
 *                           type: number
 *                           format: float
 *                           description: Average coins per transaction
 *                         rankPosition:
 *                           type: integer
 *                           description: Current ranking position
 *                         topOriginCountries:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/OriginStats'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/profile', [
  param('id')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Restaurant ID must be a valid string'),
], handleValidationErrors, restaurantController.getRestaurantProfile.bind(restaurantController));

/**
 * @swagger
 * /restaurants:
 *   get:
 *     tags: [Restaurants]
 *     summary: List registered restaurants
 *     description: Get a paginated list of restaurants registered in the system with optional filtering and sorting
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
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 200
 *         description: Search query for restaurant name or address
 *         example: "dim sum"
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *           format: double
 *           minimum: -90
 *           maximum: 90
 *         description: Latitude for location-based filtering
 *         example: 22.3193
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *           format: double
 *           minimum: -180
 *           maximum: 180
 *         description: Longitude for location-based filtering
 *         example: 114.1694
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           format: float
 *           minimum: 0.1
 *           maximum: 50
 *         description: Search radius in kilometers
 *         example: 5.0
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, totalCoins, distance, createdAt]
 *           default: totalCoins
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Restaurants retrieved successfully
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
 *                     restaurants:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Restaurant'
 *                           - type: object
 *                             properties:
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
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
  query('search')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Search query must be a string with maximum 200 characters'),
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
  query('sortBy')
    .optional()
    .isIn(['name', 'totalCoins', 'distance', 'createdAt'])
    .withMessage('Sort by must be one of: name, totalCoins, distance, createdAt'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),
], handleValidationErrors, restaurantController.listRestaurants.bind(restaurantController));

/**
 * @swagger
 * /restaurants/nearby:
 *   get:
 *     tags: [Restaurants]
 *     summary: Find nearby restaurants using GPS
 *     description: Search for restaurants near a specific location using Google Maps Places API. Returns restaurants with distance calculations and sorting.
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *           minimum: -90
 *           maximum: 90
 *         description: Latitude coordinate
 *         example: 22.3193
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *           minimum: -180
 *           maximum: 180
 *         description: Longitude coordinate
 *         example: 114.1694
 *       - in: query
 *         name: radius
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 100
 *           maximum: 50000
 *         description: Search radius in meters
 *         example: 5000
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Place type filter (e.g., restaurant, cafe)
 *         example: "restaurant"
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search keyword for filtering results
 *         example: "dim sum"
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 4
 *         description: Minimum price level (0=Free, 1=Inexpensive, 2=Moderate, 3=Expensive, 4=Very Expensive)
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 4
 *         description: Maximum price level (0=Free, 1=Inexpensive, 2=Moderate, 3=Expensive, 4=Very Expensive)
 *     responses:
 *       200:
 *         description: Nearby restaurants found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/GoogleRestaurant'
 *                       - type: object
 *                         properties:
 *                           distance:
 *                             type: number
 *                             format: float
 *                             description: Distance from search location in kilometers
 *                 meta:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       description: Number of restaurants found
 *                     searchLocation:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                         longitude:
 *                           type: number
 *                     searchRadius:
 *                       type: integer
 *                       description: Search radius in meters
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         description: Google Maps API error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "External API error"
 *               message: "Google Maps API request failed"
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
 * @swagger
 * /restaurants/details/{placeId}:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get detailed restaurant information
 *     description: Retrieve comprehensive restaurant details from Google Maps Places API using Place ID. Includes photos, reviews, opening hours, and contact information.
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 10
 *           maxLength: 200
 *         description: Google Maps Place ID
 *         example: "ChIJN1t_tDeuEmsRUsoyG83frY4"
 *     responses:
 *       200:
 *         description: Restaurant details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/GoogleRestaurant'
 *                     - type: object
 *                       properties:
 *                         openingHours:
 *                           type: object
 *                           properties:
 *                             openNow:
 *                               type: boolean
 *                             periods:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   open:
 *                                     type: object
 *                                     properties:
 *                                       day:
 *                                         type: integer
 *                                       time:
 *                                         type: string
 *                                   close:
 *                                     type: object
 *                                     properties:
 *                                       day:
 *                                         type: integer
 *                                       time:
 *                                         type: string
 *                             weekdayText:
 *                               type: array
 *                               items:
 *                                 type: string
 *                         reviews:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               authorName:
 *                                 type: string
 *                               rating:
 *                                 type: integer
 *                               text:
 *                                 type: string
 *                               time:
 *                                 type: integer
 *                         website:
 *                           type: string
 *                           format: uri
 *                         phoneNumber:
 *                           type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Restaurant not found in Google Maps
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Not found"
 *               message: "No restaurant found with place ID: ChIJN1t_tDeuEmsRUsoyG83frY4"
 *       500:
 *         description: Google Maps API error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /restaurants/search:
 *   get:
 *     tags: [Restaurants]
 *     summary: Search restaurants by text query
 *     description: Search for restaurants using text query with optional location-based filtering. Uses Google Maps Places API for comprehensive search results.
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *         description: Search query (restaurant name, cuisine type, etc.)
 *         example: "dim sum restaurant"
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *           format: double
 *           minimum: -90
 *           maximum: 90
 *         description: Latitude for location-based search (optional)
 *         example: 22.3193
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *           format: double
 *           minimum: -180
 *           maximum: 180
 *         description: Longitude for location-based search (optional)
 *         example: 114.1694
 *       - in: query
 *         name: radius
 *         schema:
 *           type: integer
 *           minimum: 100
 *           maximum: 50000
 *         description: Search radius in meters (optional, requires lat/lng)
 *         example: 5000
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/GoogleRestaurant'
 *                       - type: object
 *                         properties:
 *                           distance:
 *                             type: number
 *                             format: float
 *                             description: Distance from search location (if lat/lng provided)
 *                 meta:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       description: Number of restaurants found
 *                     query:
 *                       type: string
 *                       description: Search query used
 *                     searchLocation:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         latitude:
 *                           type: number
 *                         longitude:
 *                           type: number
 *                     searchRadius:
 *                       type: integer
 *                       nullable: true
 *                       description: Search radius used (if provided)
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         description: Google Maps API error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /restaurants/distance:
 *   post:
 *     tags: [Restaurants]
 *     summary: Calculate distance between coordinates
 *     description: Calculate the distance between two geographic coordinates using the Haversine formula. Useful for determining walking distance to restaurants.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - from
 *               - to
 *             properties:
 *               from:
 *                 type: object
 *                 required:
 *                   - latitude
 *                   - longitude
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     format: double
 *                     minimum: -90
 *                     maximum: 90
 *                     description: Starting point latitude
 *                     example: 22.3193
 *                   longitude:
 *                     type: number
 *                     format: double
 *                     minimum: -180
 *                     maximum: 180
 *                     description: Starting point longitude
 *                     example: 114.1694
 *               to:
 *                 type: object
 *                 required:
 *                   - latitude
 *                   - longitude
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     format: double
 *                     minimum: -90
 *                     maximum: 90
 *                     description: Destination latitude
 *                     example: 22.3200
 *                   longitude:
 *                     type: number
 *                     format: double
 *                     minimum: -180
 *                     maximum: 180
 *                     description: Destination longitude
 *                     example: 114.1700
 *     responses:
 *       200:
 *         description: Distance calculated successfully
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
 *                     distance:
 *                       type: number
 *                       format: float
 *                       description: Distance in kilometers
 *                       example: 0.85
 *                     unit:
 *                       type: string
 *                       example: "kilometers"
 *                     from:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                         longitude:
 *                           type: number
 *                     to:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                         longitude:
 *                           type: number
 *       400:
 *         $ref: '#/components/responses/BadRequest'
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
 * @swagger
 * /restaurants/cache:
 *   delete:
 *     tags: [Restaurants]
 *     summary: Clear Google Maps API cache
 *     description: Clear cached Google Maps API responses for development and testing purposes. Helps ensure fresh data during development.
 *     parameters:
 *       - in: query
 *         name: pattern
 *         schema:
 *           type: string
 *         description: Cache key pattern to clear (optional, clears all if not provided)
 *         example: "places:*"
 *     responses:
 *       200:
 *         description: Cache cleared successfully
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
 *                   example: "Cache cleared successfully"
 *                 pattern:
 *                   type: string
 *                   description: Pattern that was cleared
 *                   example: "all Google Maps cache"
 *       500:
 *         description: Cache clearing failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Cache error"
 *               message: "Failed to clear cache"
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