import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Load environment variables
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tourist Rewards Blockchain Infrastructure API',
      version: '1.0.0',
      description: 'API for managing SmileCoin transactions, tourist wallets, and restaurant rewards on blockchain',
      contact: {
        name: 'Tourist Rewards Team',
        email: 'support@touristrewards.com'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    },
    security: [
      {
        ApiKeyAuth: []
      }
    ]
  },
  apis: ['./src/api/routes/*.ts', './src/api/app.ts'], // Path to the API files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Key authentication middleware
const authenticateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.header('X-API-Key');
  
  if (!apiKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required'
    });
    return;
  }

  // In production, this should validate against a database
  const validApiKeys = process.env.API_KEYS?.split(',') || ['dev-api-key'];
  
  if (!validApiKeys.includes(apiKey)) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
    return;
  }

  next();
};

// Swagger documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Tourist Rewards API Documentation'
}));

// Swagger JSON endpoint
app.get('/docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API server
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: development
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: API information
 *     description: Returns basic information about the API
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 documentation:
 *                   type: string
 */
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Tourist Rewards Blockchain Infrastructure API',
    version: '1.0.0',
    documentation: '/docs'
  });
});

// Apply API key authentication to all /api routes
app.use('/api', authenticateApiKey);

// Import routes
import touristRoutes from './routes/tourists';
import restaurantRoutes from './routes/restaurants';
import blockchainRoutes from './routes/blockchain';
import monitoringRoutes, { initializeMonitoring } from './routes/monitoring';

// Initialize monitoring service
if (process.env.CONTRACT_ADDRESS && process.env.RPC_URL) {
  initializeMonitoring({
    rpcUrl: process.env.RPC_URL,
    contractAddress: process.env.CONTRACT_ADDRESS,
    networkName: process.env.NETWORK_NAME || 'hardhat',
    gasPriceThresholdGwei: parseInt(process.env.GAS_PRICE_THRESHOLD_GWEI || '50'),
    healthCheckIntervalMs: parseInt(process.env.HEALTH_CHECK_INTERVAL_MS || '30000'),
    alertWebhookUrl: process.env.ALERT_WEBHOOK_URL
  });
}

// Register routes
app.use('/api/tourists', touristRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Blockchain-specific error types
export enum BlockchainErrorCode {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  DAILY_LIMIT_EXCEEDED = 'DAILY_LIMIT_EXCEEDED',
  TOURIST_NOT_REGISTERED = 'TOURIST_NOT_REGISTERED',
  RESTAURANT_NOT_REGISTERED = 'RESTAURANT_NOT_REGISTERED',
  COINS_EXPIRED = 'COINS_EXPIRED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  GAS_LIMIT_EXCEEDED = 'GAS_LIMIT_EXCEEDED',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND'
}

export class BlockchainError extends Error {
  constructor(
    public code: BlockchainErrorCode,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'BlockchainError';
  }
}

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (err instanceof BlockchainError) {
    res.status(400).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
    return;
  }

  // Handle ethers.js errors
  if (err.code === 'INSUFFICIENT_FUNDS') {
    res.status(400).json({
      error: {
        code: BlockchainErrorCode.INSUFFICIENT_BALANCE,
        message: 'Insufficient balance for transaction'
      }
    });
    return;
  }

  if (err.code === 'NETWORK_ERROR') {
    res.status(503).json({
      error: {
        code: BlockchainErrorCode.NETWORK_ERROR,
        message: 'Blockchain network error. Please try again later.'
      }
    });
    return;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.details || err.message
      }
    });
    return;
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    }
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Tourist Rewards API server running on port ${PORT}`);
    console.log(`📚 Environment: ${process.env.NODE_ENV}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`📖 API Documentation: http://localhost:${PORT}/docs`);
  });
}

export { app };