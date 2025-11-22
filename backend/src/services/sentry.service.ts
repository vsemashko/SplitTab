import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { config } from '../config';
import { Application } from 'express';

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initializeSentry(_app: Application): void {
  // Only initialize Sentry if DSN is configured
  if (!config.sentry.dsn) {
    if (config.nodeEnv === 'production') {
      console.warn('⚠️  Sentry DSN not configured in production environment');
    }
    return;
  }

  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.nodeEnv,

    // Performance Monitoring
    tracesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev

    // Profiling
    profilesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0,
    integrations: [
      // Profiling integration
      nodeProfilingIntegration(),
    ],

    // Ignore specific errors
    ignoreErrors: [
      // Ignore common non-critical errors
      'ECONNRESET',
      'EPIPE',
      'ETIMEDOUT',
      'ENOTFOUND',
      // Ignore validation errors (handled by application)
      'ValidationError',
      // Ignore authentication errors (expected)
      'UnauthorizedError',
      'AuthenticationError',
    ],

    // Before send hook - filter or modify events before sending
    beforeSend(event, _hint) {
      // Don't send events in development unless explicitly enabled
      if (config.nodeEnv === 'development' && !process.env.SENTRY_DEBUG) {
        return null;
      }

      // Filter out sensitive data
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      // Add custom context
      event.contexts = {
        ...event.contexts,
        app: {
          name: 'SplitTab Backend',
          version: process.env.npm_package_version || '1.0.0',
        },
      };

      return event;
    },

    // Release tracking
    release: process.env.SENTRY_RELEASE || process.env.npm_package_version,

    // Enable debug mode in development
    debug: config.nodeEnv === 'development' && !!process.env.SENTRY_DEBUG,
  });

  console.log('✅ Sentry initialized successfully');
}

/**
 * Sentry request handler middleware
 * Must be the first middleware
 */
export const sentryRequestHandler = () => {
  return (req: any, _res: any, next: any) => {
    Sentry.setContext('request', {
      url: req.url,
      method: req.method,
      headers: req.headers,
    });
    next();
  };
};

/**
 * Sentry tracing middleware
 * Captures performance data
 */
export const sentryTracingHandler = () => {
  return (_req: any, _res: any, next: any) => {
    // Tracing is handled automatically in Sentry v8+
    next();
  };
};

/**
 * Sentry error handler middleware
 * Must be before any other error middleware but after all controllers
 */
export const sentryErrorHandler = () => {
  return (error: any, _req: any, _res: any, next: any) => {
    // Capture all errors with status code >= 500
    if (error.statusCode && error.statusCode >= 500) {
      Sentry.captureException(error);
    }

    // Capture specific error types
    if (
      error.name === 'DatabaseError' ||
      error.name === 'InternalServerError' ||
      error.name === 'RedisError'
    ) {
      Sentry.captureException(error);
    }

    next(error);
  };
};

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (!config.sentry.dsn) return;

  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('additional', context);
    }
    Sentry.captureException(error);
  });
}

/**
 * Capture message manually
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  if (!config.sentry.dsn) return;

  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string }): void {
  if (!config.sentry.dsn) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context
 */
export function clearUser(): void {
  if (!config.sentry.dsn) return;

  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, any>,
  level: Sentry.SeverityLevel = 'info'
): void {
  if (!config.sentry.dsn) return;

  Sentry.addBreadcrumb({
    message,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Start a span for performance monitoring
 */
export function startTransaction(name: string, op: string): any {
  if (!config.sentry.dsn) return undefined;

  return Sentry.startSpan(
    {
      name,
      op,
    },
    (span) => {
      return span;
    }
  );
}

/**
 * Flush Sentry events (useful for graceful shutdown)
 */
export async function flushSentry(timeout: number = 2000): Promise<boolean> {
  if (!config.sentry.dsn) return true;

  try {
    return await Sentry.flush(timeout);
  } catch (error) {
    console.error('Error flushing Sentry:', error);
    return false;
  }
}

export default {
  initializeSentry,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  startTransaction,
  flushSentry,
};
