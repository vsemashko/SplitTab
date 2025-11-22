import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { notFound } from './middleware/notFound';
import { apiLimiter } from './middleware/rateLimit';
import {
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
} from './services/sentry.service';

const app: Application = express();

// Sentry request handler MUST be the first middleware
app.use(sentryRequestHandler);

// Sentry tracing handler for performance monitoring
app.use(sentryTracingHandler);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// API routes
import apiRoutes from './routes';
app.use('/api/v1', apiRoutes);

// 404 handler
app.use(notFound);

// Sentry error handler MUST be before other error handlers
app.use(sentryErrorHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
