/**
 * Feature Flags Configuration
 *
 * This module centralizes feature flag configuration to make it easy to
 * enable/disable optional components for simplified deployment.
 *
 * All feature flags are controlled via environment variables in .env file.
 */

/**
 * Parse boolean environment variable
 * Accepts: 'true', '1', 'yes' as true, everything else as false
 */
const parseBoolean = (value: string | undefined, defaultValue: boolean = false): boolean => {
  if (!value) return defaultValue;
  return ['true', '1', 'yes'].includes(value.toLowerCase());
};

/**
 * Feature flags object
 * All optional features that can be enabled/disabled for deployment
 */
export const features = {
  /**
   * Receipt OCR Processing
   * Requires: Google Cloud Vision or AWS Textract credentials
   * Cost: ~$50-100/month
   * Impact if disabled: Users can upload receipts but no automatic text extraction
   */
  ocr: {
    enabled: parseBoolean(process.env.ENABLE_OCR),
    provider: process.env.OCR_PROVIDER || 'google',
    confidenceThreshold: parseFloat(process.env.OCR_CONFIDENCE_THRESHOLD || '0.8'),
    maxRetries: parseInt(process.env.OCR_MAX_RETRIES || '3'),
  },

  /**
   * Email Notifications
   * Requires: SendGrid or Resend API key
   * Cost: Free tier (100 emails/day) or ~$20/month
   * Impact if disabled: No password reset emails, no notification emails
   */
  email: {
    enabled: parseBoolean(process.env.ENABLE_EMAIL_NOTIFICATIONS),
    from: process.env.EMAIL_FROM || 'noreply@splittab.com',
  },

  /**
   * Real-time Updates via WebSockets
   * Requires: WebSocket support on hosting platform
   * Cost: Minimal (included in most hosting)
   * Impact if disabled: Users must refresh page to see updates
   */
  realtime: {
    enabled: parseBoolean(process.env.ENABLE_REALTIME_UPDATES, true), // Enabled by default
  },

  /**
   * Background Job Processing
   * Requires: Redis instance for Bull queue
   * Cost: Included if using Redis for sessions
   * Impact if disabled: OCR processing becomes synchronous (slower response)
   */
  backgroundJobs: {
    enabled: parseBoolean(process.env.ENABLE_BACKGROUND_JOBS),
    concurrency: parseInt(process.env.OCR_QUEUE_CONCURRENCY || '5'),
  },

  /**
   * Push Notifications
   * Requires: APNs certificates (iOS), FCM setup (Android)
   * Cost: Free
   * Impact if disabled: No push notifications to mobile devices
   */
  pushNotifications: {
    enabled: parseBoolean(process.env.ENABLE_PUSH_NOTIFICATIONS),
  },

  /**
   * File Storage Provider
   * Options: 's3' (AWS S3) or 'local' (server filesystem)
   * Cost: S3 ~$5-10/month, Local is free
   * Note: Local storage not recommended for production (no redundancy)
   */
  fileStorage: {
    provider: (process.env.FILE_STORAGE_PROVIDER || 'local') as 's3' | 'local',
    uploadDir: process.env.UPLOAD_DIR || './uploads/receipts',
  },

  /**
   * OAuth Authentication Providers
   * Requires: OAuth credentials from Google/Apple
   * Cost: Free
   * Impact if disabled: Only email/password authentication available
   */
  oauth: {
    google: {
      enabled: parseBoolean(process.env.ENABLE_GOOGLE_OAUTH),
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    apple: {
      enabled: parseBoolean(process.env.ENABLE_APPLE_SIGNIN),
      clientId: process.env.APPLE_CLIENT_ID,
      teamId: process.env.APPLE_TEAM_ID,
      keyId: process.env.APPLE_KEY_ID,
      privateKey: process.env.APPLE_PRIVATE_KEY,
    },
  },

  /**
   * Error Tracking and Monitoring
   * Requires: Sentry account and DSN
   * Cost: Free tier (10k events/month)
   * Impact if disabled: No centralized error tracking
   */
  monitoring: {
    sentry: {
      enabled: parseBoolean(process.env.ENABLE_SENTRY),
      dsn: process.env.SENTRY_DSN,
    },
  },
};

/**
 * Helper function to check if a feature is enabled
 */
export const isFeatureEnabled = (featurePath: string): boolean => {
  const parts = featurePath.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = features;

  for (const part of parts) {
    if (current[part] === undefined) {
      return false;
    }
    current = current[part];
  }

  return current === true || current?.enabled === true;
};

/**
 * Get feature configuration
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getFeatureConfig = (featurePath: string): any => {
  const parts = featurePath.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = features;

  for (const part of parts) {
    if (current[part] === undefined) {
      return null;
    }
    current = current[part];
  }

  return current;
};

/**
 * Log feature flags status on startup
 * Note: This uses a callback pattern to avoid circular dependency with logger
 */
export const logFeatureFlags = (logFn: (message: string) => void = console.log): void => {
  // eslint-disable-next-line no-console
  logFn('🎯 Feature Flags Configuration:');
  // eslint-disable-next-line no-console
  logFn(`  OCR Processing: ${features.ocr.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  // eslint-disable-next-line no-console
  logFn(`  Email Notifications: ${features.email.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  // eslint-disable-next-line no-console
  logFn(`  Real-time Updates: ${features.realtime.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  // eslint-disable-next-line no-console
  logFn(`  Background Jobs: ${features.backgroundJobs.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  // eslint-disable-next-line no-console
  logFn(
    `  Push Notifications: ${features.pushNotifications.enabled ? '✅ Enabled' : '❌ Disabled'}`
  );
  // eslint-disable-next-line no-console
  logFn(`  File Storage: ${features.fileStorage.provider === 's3' ? '☁️  AWS S3' : '📁 Local'}`);
  // eslint-disable-next-line no-console
  logFn(`  Google OAuth: ${features.oauth.google.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  // eslint-disable-next-line no-console
  logFn(`  Apple Sign-In: ${features.oauth.apple.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  // eslint-disable-next-line no-console
  logFn(`  Sentry Monitoring: ${features.monitoring.sentry.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  // eslint-disable-next-line no-console
  logFn('');
};

/**
 * Validate that required services are configured when features are enabled
 */
export const validateFeatureConfiguration = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // OCR validation
  if (features.ocr.enabled) {
    if (features.ocr.provider === 'google' || features.ocr.provider === 'both') {
      if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
        errors.push('OCR is enabled but GOOGLE_CLOUD_PROJECT_ID is not configured');
      }
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        errors.push('OCR is enabled but GOOGLE_APPLICATION_CREDENTIALS is not configured');
      }
    }
    if (features.ocr.provider === 'aws' || features.ocr.provider === 'both') {
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        errors.push('OCR is enabled but AWS credentials are not configured');
      }
    }
  }

  // Email validation
  if (features.email.enabled) {
    if (!process.env.EMAIL_API_KEY) {
      errors.push('Email notifications are enabled but EMAIL_API_KEY is not configured');
    }
  }

  // Background jobs validation
  if (features.backgroundJobs.enabled) {
    if (!process.env.REDIS_URL) {
      errors.push('Background jobs are enabled but REDIS_URL is not configured');
    }
  }

  // File storage validation
  if (features.fileStorage.provider === 's3') {
    if (!process.env.AWS_S3_BUCKET) {
      errors.push('S3 storage is enabled but AWS_S3_BUCKET is not configured');
    }
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      errors.push('S3 storage is enabled but AWS credentials are not configured');
    }
  }

  // OAuth validation
  if (features.oauth.google.enabled) {
    if (!features.oauth.google.clientId || !features.oauth.google.clientSecret) {
      errors.push('Google OAuth is enabled but credentials are not configured');
    }
  }
  if (features.oauth.apple.enabled) {
    if (!features.oauth.apple.clientId || !features.oauth.apple.teamId) {
      errors.push('Apple Sign-In is enabled but credentials are not configured');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export default features;
