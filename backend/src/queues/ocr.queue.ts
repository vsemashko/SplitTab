import Queue from 'bull';
import { logger } from '../utils/logger';

// Queue configuration
const redisConfig = {
  host: process.env.BULL_REDIS_HOST || 'localhost',
  port: parseInt(process.env.BULL_REDIS_PORT || '6379', 10),
  password: process.env.BULL_REDIS_PASSWORD || undefined,
};

// Job data interface
export interface OCRJobData {
  receiptId: string;
  filePath: string;
  retryCount?: number;
}

// Create OCR queue
export const ocrQueue = new Queue<OCRJobData>('ocr-processing', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: parseInt(process.env.OCR_MAX_RETRIES || '3', 10),
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 seconds initial delay
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500, // Keep last 500 failed jobs
  },
});

// Queue event handlers
ocrQueue.on('error', (error) => {
  logger.error('OCR Queue error:', error);
});

ocrQueue.on('waiting', (jobId) => {
  logger.debug(`OCR Job ${jobId} is waiting`);
});

ocrQueue.on('active', (job) => {
  logger.info(`OCR Job ${job.id} started processing receipt: ${job.data.receiptId}`);
});

ocrQueue.on('completed', (job, _result) => {
  logger.info(`OCR Job ${job.id} completed for receipt: ${job.data.receiptId}`);
});

ocrQueue.on('failed', (job, error) => {
  logger.error(`OCR Job ${job?.id} failed for receipt: ${job?.data.receiptId}`, error);
});

ocrQueue.on('stalled', (job) => {
  logger.warn(`OCR Job ${job.id} stalled for receipt: ${job.data.receiptId}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing OCR queue...');
  await ocrQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing OCR queue...');
  await ocrQueue.close();
  process.exit(0);
});

/**
 * Add OCR job to queue
 */
export async function addOCRJob(data: OCRJobData): Promise<void> {
  try {
    const job = await ocrQueue.add(data, {
      jobId: `ocr-${data.receiptId}`, // Use receiptId as jobId to prevent duplicates
      priority: 1, // Higher priority = processed first
    });

    logger.info(`OCR job ${job.id} added to queue for receipt: ${data.receiptId}`);
  } catch (error) {
    logger.error('Error adding OCR job to queue:', error);
    throw error;
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    ocrQueue.getWaitingCount(),
    ocrQueue.getActiveCount(),
    ocrQueue.getCompletedCount(),
    ocrQueue.getFailedCount(),
    ocrQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

/**
 * Clean old jobs from queue
 */
export async function cleanQueue() {
  try {
    // Remove completed jobs older than 24 hours
    await ocrQueue.clean(24 * 60 * 60 * 1000, 'completed');
    // Remove failed jobs older than 7 days
    await ocrQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
    logger.info('Queue cleaned successfully');
  } catch (error) {
    logger.error('Error cleaning queue:', error);
  }
}

export default ocrQueue;
