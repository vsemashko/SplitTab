import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const prisma = new PrismaClient();

/**
 * Global test setup - runs once before all tests
 */
beforeAll(async () => {
  console.log('🔧 Setting up test environment...');

  // Ensure we're using test database
  if (!process.env.DATABASE_URL?.includes('test')) {
    console.error('❌ DATABASE_URL must contain "test" to prevent accidental test runs on production database');
    process.exit(1);
  }

  try {
    // Connect to database
    await prisma.$connect();

    // Run migrations on test database
    console.log('📦 Running database migrations...');
    await execAsync('npx prisma migrate deploy', {
      env: { ...process.env },
    });

    console.log('✅ Test environment setup complete');
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    throw error;
  }
});

/**
 * Global test teardown - runs once after all tests
 */
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');

  try {
    await prisma.$disconnect();
    console.log('✅ Test environment cleanup complete');
  } catch (error) {
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
