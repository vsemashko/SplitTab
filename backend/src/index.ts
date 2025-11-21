import { createServer } from 'http';
import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { socketService } from './services/socket.service';
import { initializeSentry, flushSentry } from './services/sentry.service';

const PORT = config.port || 3000;

async function startServer() {
  try {
    // Initialize Sentry error tracking (must be first)
    initializeSentry(app);

    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');

    // Create HTTP server (needed for Socket.IO)
    const httpServer = createServer(app);

    // Initialize Socket.IO
    socketService.initialize(httpServer);
    logger.info('Socket.IO initialized successfully');

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api/${config.apiVersion}`);
      logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      logger.info('Shutdown signal received: closing server');

      httpServer.close(() => {
        logger.info('HTTP server closed');
      });

      socketService.close();
      logger.info('Socket.IO server closed');

      // Flush Sentry events before exit
      await flushSentry(2000);
      logger.info('Sentry events flushed');

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
