import App from './app';
import { prisma } from './config/database';
import { config } from './config/environment';
import { redisClient } from './config/redis';

async function startServer(): Promise<void> {
  try {
    // Initialize database connection
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Initialize Redis connection
    console.log('Connecting to Redis...');
    await redisClient.connect();
    console.log('✅ Redis connected successfully');

    // Create Express app
    const app = new App();
    const server = app.getApp();

    // Start server
    server.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📍 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${config.port}/health`);
      console.log(`🔗 API base: http://localhost:${config.port}/api/v1`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      try {
        await prisma.$disconnect();
        console.log('✅ Database disconnected');
        
        await redisClient.disconnect();
        console.log('✅ Redis disconnected');
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();