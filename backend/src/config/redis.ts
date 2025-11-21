import { createClient } from 'redis';
import { config } from './index';
import { logger } from '../utils/logger';

export const redisClient = createClient({
  url: config.redisUrl,
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('✅ Redis Client Connected');
});

export async function connectRedis() {
  try {
    await redisClient.connect();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    // Don't exit - Redis is not critical for basic functionality
  }
}

export async function disconnectRedis() {
  try {
    await redisClient.quit();
    logger.info('Redis disconnected');
  } catch (error) {
    logger.error('Error disconnecting from Redis:', error);
  }
}
