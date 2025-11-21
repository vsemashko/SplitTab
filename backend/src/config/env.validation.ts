import { z } from 'zod';

/**
 * Environment variable validation schema
 * Validates and type-checks all environment variables at startup
 */
const envSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),
  API_VERSION: z.string().default('v1'),

  // Database
  DATABASE_URL: z.string().url('Invalid DATABASE_URL format'),

  // Redis
  REDIS_URL: z.string().url('Invalid REDIS_URL format').default('redis://localhost:6379'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),

  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).transform(Number).default('100'),

  // Email
  EMAIL_FROM: z.string().email().default('noreply@splittab.com'),
  EMAIL_API_KEY: z.string().optional(),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_PRIVATE_KEY: z.string().optional(),

  // File Upload & AWS
  UPLOAD_DIR: z.string().default('./uploads/receipts'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),

  // OCR Configuration
  OCR_PROVIDER: z.enum(['google', 'aws', 'both']).default('google'),
  GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  AWS_TEXTRACT_REGION: z.string().default('us-east-1'),
  OCR_CONFIDENCE_THRESHOLD: z
    .string()
    .regex(/^\d*\.?\d+$/)
    .transform(Number)
    .default('0.8'),
  OCR_MAX_RETRIES: z.string().regex(/^\d+$/).transform(Number).default('3'),

  // Background Jobs (Bull Queue)
  BULL_REDIS_HOST: z.string().default('localhost'),
  BULL_REDIS_PORT: z.string().regex(/^\d+$/).transform(Number).default('6379'),
  BULL_REDIS_PASSWORD: z.string().optional(),
  OCR_QUEUE_CONCURRENCY: z.string().regex(/^\d+$/).transform(Number).default('5'),

  // Monitoring & Logging
  SENTRY_DSN: z.string().url('Invalid SENTRY_DSN format').optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

/**
 * Production-specific validations
 * These environment variables are required in production
 */
const productionSchema = envSchema
  .refine(
    (data) => {
      if (data.NODE_ENV === 'production') {
        // Ensure JWT secrets are strong in production
        const required = [
          data.JWT_ACCESS_SECRET.length >= 64,
          data.JWT_REFRESH_SECRET.length >= 64,
        ];
        return required.every(Boolean);
      }
      return true;
    },
    {
      message: 'JWT secrets must be at least 64 characters in production',
    }
  )
  .refine(
    (data) => {
      if (data.NODE_ENV === 'production') {
        // Ensure monitoring is configured in production
        return !!data.SENTRY_DSN;
      }
      return true;
    },
    {
      message: 'SENTRY_DSN is required in production for error monitoring',
    }
  )
  .refine(
    (data) => {
      if (data.NODE_ENV === 'production') {
        // Ensure AWS is configured for file uploads
        const awsConfigured = !!(
          data.AWS_ACCESS_KEY_ID &&
          data.AWS_SECRET_ACCESS_KEY &&
          data.AWS_S3_BUCKET
        );
        return awsConfigured;
      }
      return true;
    },
    {
      message:
        'AWS credentials (ACCESS_KEY_ID, SECRET_ACCESS_KEY, S3_BUCKET) are required in production',
    }
  );

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 * Call this at application startup to fail fast if configuration is invalid
 */
export function validateEnv(): EnvConfig {
  try {
    const validated = productionSchema.parse(process.env);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      console.error('');

      error.issues.forEach((issue) => {
        console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
      });

      console.error('');
      console.error('Please check your .env file and ensure all required variables are set.');
      console.error('See .env.example for reference.');

      process.exit(1);
    }

    throw error;
  }
}

/**
 * Check if OCR provider is configured
 */
export function isOCRConfigured(env: EnvConfig): boolean {
  if (env.OCR_PROVIDER === 'google' || env.OCR_PROVIDER === 'both') {
    if (!env.GOOGLE_CLOUD_PROJECT_ID || !env.GOOGLE_APPLICATION_CREDENTIALS) {
      return false;
    }
  }

  if (env.OCR_PROVIDER === 'aws' || env.OCR_PROVIDER === 'both') {
    if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || !env.AWS_TEXTRACT_REGION) {
      return false;
    }
  }

  return true;
}

/**
 * Check if OAuth provider is configured
 */
export function isOAuthConfigured(env: EnvConfig, provider: 'google' | 'apple'): boolean {
  if (provider === 'google') {
    return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  }

  if (provider === 'apple') {
    return !!(
      env.APPLE_CLIENT_ID &&
      env.APPLE_TEAM_ID &&
      env.APPLE_KEY_ID &&
      env.APPLE_PRIVATE_KEY
    );
  }

  return false;
}
