import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const prisma = new PrismaClient();

// Set up test environment variables before tests run
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET =
  'test-jwt-access-secret-key-minimum-32-characters-long-for-security';
process.env.JWT_REFRESH_SECRET =
  'test-jwt-refresh-secret-key-minimum-32-characters-long-for-security';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:3001';
process.env.PORT = '3000';
process.env.API_VERSION = 'v1';
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests
process.env.UPLOAD_DIR = './uploads/test';

/**
 * Global test setup - runs once before all tests
 */
beforeAll(async () => {
  // eslint-disable-next-line no-console
  console.log('🔧 Setting up test environment...');

  // Ensure we're using test database
  if (!process.env.DATABASE_URL?.includes('test')) {
    // eslint-disable-next-line no-console
    console.error(
      '❌ DATABASE_URL must contain "test" to prevent accidental test runs on production database'
    );
    process.exit(1);
  }

  try {
    // Connect to database
    await prisma.$connect();

    // Run migrations on test database
    // eslint-disable-next-line no-console
    console.log('📦 Running database migrations...');
    await execAsync('npx prisma migrate deploy', {
      env: { ...process.env },
    });

    // eslint-disable-next-line no-console
    console.log('✅ Test environment setup complete');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Test setup failed:', error);
    throw error;
  }
});

/**
 * Global test teardown - runs once after all tests
 */
afterAll(async () => {
  // eslint-disable-next-line no-console
  console.log('🧹 Cleaning up test environment...');

  try {
    await prisma.$disconnect();
    // eslint-disable-next-line no-console
    console.log('✅ Test environment cleanup complete');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Test cleanup failed:', error);
    throw error;
  }
});

beforeEach(() => {
  // Setup before each test if needed
});

afterEach(() => {
  // Cleanup after each test if needed
});
