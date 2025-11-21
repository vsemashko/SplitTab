import dotenv from 'dotenv';
import path from 'path';
import { validateEnv, type EnvConfig } from './env.validation';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Validate environment variables at startup (fails fast if invalid)
const env: EnvConfig = validateEnv();

interface Config {
  nodeEnv: string;
  port: number;
  apiVersion: string;
  databaseUrl: string;
  redisUrl: string;
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiry: string;
    refreshExpiry: string;
  };
  allowedOrigins: string[];
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  email: {
    from: string;
    apiKey: string;
  };
  oauth: {
    google: {
      clientId: string;
      clientSecret: string;
    };
    apple: {
      clientId: string;
      teamId: string;
      keyId: string;
      privateKey: string;
    };
  };
  aws: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    s3Bucket: string;
  };
  sentry: {
    dsn: string;
  };
  logLevel: string;
}

export const config: Config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  apiVersion: env.API_VERSION,
  databaseUrl: env.DATABASE_URL,
  redisUrl: env.REDIS_URL,
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiry: env.JWT_ACCESS_EXPIRY,
    refreshExpiry: env.JWT_REFRESH_EXPIRY,
  },
  allowedOrigins: env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()),
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  email: {
    from: env.EMAIL_FROM,
    apiKey: env.EMAIL_API_KEY || '',
  },
  oauth: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID || '',
      clientSecret: env.GOOGLE_CLIENT_SECRET || '',
    },
    apple: {
      clientId: env.APPLE_CLIENT_ID || '',
      teamId: env.APPLE_TEAM_ID || '',
      keyId: env.APPLE_KEY_ID || '',
      privateKey: env.APPLE_PRIVATE_KEY || '',
    },
  },
  aws: {
    accessKeyId: env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY || '',
    region: env.AWS_REGION,
    s3Bucket: env.AWS_S3_BUCKET || '',
  },
  sentry: {
    dsn: env.SENTRY_DSN || '',
  },
  logLevel: env.LOG_LEVEL,
};

export default config;
