/**
 * Jest environment setup
 * Loads test environment variables before Jest runs
 */
const dotenv = require('dotenv');
const path = require('path');

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

// Ensure we're in test mode
process.env.NODE_ENV = 'test';

// Verify database URL contains 'test' to prevent accidental use of production database
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('test')) {
  console.error('❌ ERROR: DATABASE_URL must contain "test" to prevent accidental test runs on production database');
  console.error('Current DATABASE_URL:', process.env.DATABASE_URL);
  process.exit(1);
}

console.log('✅ Test environment variables loaded');
console.log('📊 DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')); // Hide password in logs
