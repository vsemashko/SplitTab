import { createServer } from 'http';
import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { socketService } from './services/socket.service';
import { initializeSentry, flushSentry } from './services/sentry.service';
import { features, logFeatureFlags, validateFeatureConfiguration } from './config/features';

const PORT = config.port || 3000;

async function startServer() {
  try {
    // Log feature flags status
    logger.info('🎯 Starting SplitTab Backend...');
    logFeatureFlags();

    // Validate feature configuration
    const validation = validateFeatureConfiguration();
    if (!validation.valid) {
      logger.warn('⚠️  Feature configuration warnings:');
      validation.errors.forEach((error) => logger.warn(`  - ${error}`));
      logger.warn('  Some features may not work correctly. Check your .env file.');
    }

    // Initialize Sentry error tracking (if enabled)
    if (features.monitoring.sentry.enabled) {
      initializeSentry(app);
      logger.info('✅ Sentry error tracking initialized');
    } else {
      logger.info('⏭️  Sentry disabled - no error tracking');
    }

    // Connect to database
    await connectDatabase();
    logger.info('✅ Database connected successfully');

    // Connect to Redis
    await connectRedis();
    logger.info('✅ Redis connected successfully');

    // Create HTTP server (needed for Socket.IO)
    const httpServer = createServer(app);

    // Initialize Socket.IO (if real-time updates enabled)
    if (features.realtime.enabled) {
      socketService.initialize(httpServer);
      logger.info('✅ Socket.IO initialized - Real-time updates enabled');
    } else {
      logger.info('⏭️  Socket.IO disabled - Real-time updates disabled');
    }

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info('');
      logger.info('='.repeat(60));
      logger.info(`🚀 SplitTab Backend Server Started Successfully`);
      logger.info('='.repeat(60));
      logger.info(`📝 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api/${config.apiVersion}`);
      if (features.realtime.enabled) {
        logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
      }
      logger.info('='.repeat(60));
      logger.info('');
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      logger.info('Shutdown signal received: closing server');

      httpServer.close(() => {
        logger.info('HTTP server closed');
      });

      // Close Socket.IO if it was enabled
      if (features.realtime.enabled) {
        socketService.close();
        logger.info('Socket.IO server closed');
      }

      // Flush Sentry events before exit (if enabled)
      if (features.monitoring.sentry.enabled) {
        await flushSentry(2000);
        logger.info('Sentry events flushed');
      }

      process.exit(0);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
