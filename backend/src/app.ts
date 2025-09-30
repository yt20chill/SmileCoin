import compression from 'compression';
import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import * as swaggerUi from 'swagger-ui-express';

import { corsOptions } from './config/cors';
import { prisma } from './config/database';
import { config } from './config/environment';
import { redisClient } from './config/redis';
import { swaggerSpec } from './config/swagger';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS
    this.app.use(cors(corsOptions));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimitWindowMs,
      max: config.rateLimitMaxRequests,
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Compression
    this.app.use(compression());

    // Logging
    if (config.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Trust proxy for rate limiting and IP detection
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    // API Documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Tourist Rewards API Documentation',
    }));

    // Swagger JSON endpoint
    this.app.get('/api-docs.json', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    // Health check endpoint
    this.app.get('/health', async (req: Request, res: Response) => {
      try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;
        
        // Check Redis connection
        const redisStatus = redisClient.isClientConnected();

        res.status(200).json({
          status: 'OK',
          timestamp: new Date().toISOString(),
          services: {
            database: 'connected',
            redis: redisStatus ? 'connected' : 'disconnected',
          },
        });
      } catch (error) {
        res.status(503).json({
          status: 'ERROR',
          timestamp: new Date().toISOString(),
          error: 'Service unavailable',
        });
      }
    });

    // Import and use API routes
    const routes = require('./routes').default;
    this.app.use('/api/v1', routes);

    // API info endpoint
    this.app.get('/api/v1', (req: Request, res: Response) => {
      res.status(200).json({
        message: 'Tourist Rewards API v1',
        timestamp: new Date().toISOString(),
        endpoints: {
          auth: '/api/v1/auth',
          users: '/api/v1/users',
          restaurants: '/api/v1/restaurants',
          rankings: '/api/v1/rankings',
          health: '/health',
        },
      });
    });

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
      });
    });
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction): void => {
      console.error('Global error handler:', error);

      // Prisma errors
      if (error.name === 'PrismaClientKnownRequestError') {
        res.status(400).json({
          error: 'Database error',
          message: config.nodeEnv === 'development' ? error.message : 'Invalid request',
        });
        return;
      }

      // Validation errors
      if (error.name === 'ValidationError') {
        res.status(400).json({
          error: 'Validation error',
          message: error.message,
        });
        return;
      }

      // JWT errors
      if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
          error: 'Authentication error',
          message: 'Invalid token',
        });
        return;
      }

      // Default error
      res.status(500).json({
        error: 'Internal server error',
        message: config.nodeEnv === 'development' ? error.message : 'Something went wrong',
      });
    });
  }

  public getApp(): Application {
    return this.app;
  }
}

export default App;