import swaggerJSDoc from 'swagger-jsdoc';
import { config } from './environment';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tourist Rewards System API',
      version: '1.0.0',
      description: 'Backend API for Tourist Rewards System - A blockchain-based rewards platform for tourists and restaurants in Hong Kong',
      contact: {
        name: 'Tourist Rewards Team',
        email: 'support@touristrewards.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/v1`,
        description: 'Development server',
      },
      {
        url: 'https://api.touristrewards.com/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier',
            },
            originCountry: {
              type: 'string',
              description: 'User\'s country of origin',
              example: 'United States',
            },
            arrivalDate: {
              type: 'string',
              format: 'date-time',
              description: 'Date of arrival in Hong Kong',
            },
            departureDate: {
              type: 'string',
              format: 'date-time',
              description: 'Planned departure date from Hong Kong',
            },
            walletAddress: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'Ethereum wallet address',
              example: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
          },
          required: ['id', 'originCountry', 'arrivalDate', 'departureDate', 'walletAddress'],
        },
        Restaurant: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique restaurant identifier',
            },
            googlePlaceId: {
              type: 'string',
              description: 'Google Maps Place ID',
              example: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
            },
            name: {
              type: 'string',
              description: 'Restaurant name',
              example: 'Dim Sum Palace',
            },
            address: {
              type: 'string',
              description: 'Restaurant address',
              example: '123 Nathan Road, Tsim Sha Tsui, Hong Kong',
            },
            latitude: {
              type: 'number',
              format: 'double',
              description: 'Latitude coordinate',
              example: 22.3193,
            },
            longitude: {
              type: 'number',
              format: 'double',
              description: 'Longitude coordinate',
              example: 114.1694,
            },
            walletAddress: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'Restaurant\'s Ethereum wallet address',
            },
            totalCoinsReceived: {
              type: 'integer',
              description: 'Total smile coins received',
              example: 150,
            },
            qrCodeData: {
              type: 'string',
              description: 'QR code data for coin transfers',
            },
          },
          required: ['id', 'googlePlaceId', 'name', 'address', 'latitude', 'longitude', 'walletAddress'],
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique transaction identifier',
            },
            blockchainHash: {
              type: 'string',
              description: 'Blockchain transaction hash',
              example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            },
            fromAddress: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'Sender wallet address',
            },
            toAddress: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'Recipient wallet address',
            },
            amount: {
              type: 'integer',
              description: 'Number of smile coins transferred',
              minimum: 1,
              maximum: 3,
            },
            transactionDate: {
              type: 'string',
              format: 'date-time',
              description: 'Transaction timestamp',
            },
            userOriginCountry: {
              type: 'string',
              description: 'Origin country of the tourist who sent coins',
            },
          },
          required: ['id', 'blockchainHash', 'fromAddress', 'toAddress', 'amount', 'transactionDate'],
        },
        GoogleRestaurant: {
          type: 'object',
          properties: {
            placeId: {
              type: 'string',
              description: 'Google Maps Place ID',
            },
            name: {
              type: 'string',
              description: 'Restaurant name from Google Maps',
            },
            address: {
              type: 'string',
              description: 'Formatted address from Google Maps',
            },
            location: {
              type: 'object',
              properties: {
                latitude: { type: 'number', format: 'double' },
                longitude: { type: 'number', format: 'double' },
              },
            },
            rating: {
              type: 'number',
              format: 'float',
              description: 'Google Maps rating (1-5)',
            },
            priceLevel: {
              type: 'integer',
              description: 'Price level (0-4)',
              minimum: 0,
              maximum: 4,
            },
            photos: {
              type: 'array',
              items: { type: 'string' },
              description: 'Photo URLs from Google Maps',
            },
            isOpen: {
              type: 'boolean',
              description: 'Current open/closed status',
            },
            distance: {
              type: 'number',
              format: 'float',
              description: 'Distance from search location in kilometers',
            },
          },
        },
        DailyStats: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              format: 'date',
              description: 'Date for the statistics',
            },
            coinsReceived: {
              type: 'integer',
              description: 'Number of coins received on this date',
            },
            uniqueTourists: {
              type: 'integer',
              description: 'Number of unique tourists who gave coins',
            },
            transactions: {
              type: 'integer',
              description: 'Total number of transactions',
            },
          },
        },
        OriginStats: {
          type: 'object',
          properties: {
            country: {
              type: 'string',
              description: 'Tourist origin country',
            },
            coinsReceived: {
              type: 'integer',
              description: 'Total coins received from this country',
            },
            touristCount: {
              type: 'integer',
              description: 'Number of tourists from this country',
            },
            percentage: {
              type: 'number',
              format: 'float',
              description: 'Percentage of total coins from this country',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error type or code',
            },
            message: {
              type: 'string',
              description: 'Human-readable error message',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp',
            },
            path: {
              type: 'string',
              description: 'API endpoint path where error occurred',
            },
          },
          required: ['error', 'message'],
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Validation failed',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                  value: { type: 'string' },
                },
              },
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad request - validation error or invalid input',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized - invalid or missing authentication token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Authentication error',
                message: 'Invalid or missing token',
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Not found',
                message: 'The requested resource was not found',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Internal server error',
                message: 'Something went wrong',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'Users',
        description: 'User profile and account management',
      },
      {
        name: 'Restaurants',
        description: 'Restaurant management and discovery',
      },
      {
        name: 'Transactions',
        description: 'Smile coin transactions and history',
      },
      {
        name: 'Rankings',
        description: 'Restaurant rankings and statistics',
      },
      {
        name: 'Dashboard',
        description: 'Restaurant dashboard and analytics',
      },
      {
        name: 'Physical Coins',
        description: 'Physical coin souvenir tracking',
      },
      {
        name: 'Health',
        description: 'System health and monitoring',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/app.ts',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);