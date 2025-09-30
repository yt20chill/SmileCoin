import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface EnvironmentConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  googleMapsApiKey: string;
  corsOrigins: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET'
  ];

  // Check for required environment variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL!,
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    corsOrigins: process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:8081',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  };
};

export const config = getEnvironmentConfig();