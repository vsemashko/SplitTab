# SplitTab - Monitoring & Observability

**Version**: 1.0
**Date**: November 22, 2025
**Status**: Production Ready
**Owner**: DevOps & SRE Team

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Error Tracking (Sentry)](#error-tracking-sentry)
3. [Application Performance Monitoring](#application-performance-monitoring)
4. [Metrics & Dashboards](#metrics--dashboards)
5. [Logging](#logging)
6. [Alerting](#alerting)
7. [Health Checks](#health-checks)
8. [Uptime Monitoring](#uptime-monitoring)
9. [Database Monitoring](#database-monitoring)
10. [Frontend Monitoring](#frontend-monitoring)

---

## 🎯 Overview

Comprehensive monitoring and observability setup for SplitTab to ensure:
- **Rapid incident detection** (< 1 minute)
- **Quick root cause analysis** (< 5 minutes)
- **Proactive issue prevention**
- **Performance optimization insights**
- **User experience monitoring**

### Monitoring Stack

| Component | Tool | Purpose |
|-----------|------|---------|
| Error Tracking | Sentry | Real-time error monitoring |
| APM | Sentry Performance | Application performance |
| Metrics | Prometheus + Grafana | System & business metrics |
| Logging | Winston + CloudWatch | Centralized logging |
| Uptime | UptimeRobot / Pingdom | Endpoint availability |
| Database | PostgreSQL Stats | Query performance |
| Frontend | Sentry + Web Vitals | User experience |

---

## 🔴 Error Tracking (Sentry)

### 1. Backend Setup

Already configured in `backend/src/config/sentry.ts`:

```typescript
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: `splittab-backend@${process.env.npm_package_version}`,

      // Performance Monitoring
      tracesSampleRate: 1.0, // 100% in staging, reduce to 0.1 in production

      // Profiling
      profilesSampleRate: 1.0,
      integrations: [
        new ProfilingIntegration(),
      ],

      // Filter sensitive data
      beforeSend(event, hint) {
        // Remove sensitive information
        if (event.request) {
          delete event.request.cookies;
          if (event.request.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
          }
        }

        // Remove passwords from request data
        if (event.request?.data) {
          const data = JSON.parse(JSON.stringify(event.request.data));
          if (data.password) data.password = '[REDACTED]';
          if (data.newPassword) data.newPassword = '[REDACTED]';
          event.request.data = data;
        }

        return event;
      },
    });
  }
}
```

### 2. Error Capturing

**Automatic Capture** (already implemented):
```typescript
// In app.ts
import * as Sentry from '@sentry/node';

// Request handler (must be first)
app.use(Sentry.Handlers.requestHandler());

// Tracing handler
app.use(Sentry.Handlers.tracingHandler());

// ... your routes ...

// Error handler (must be last)
app.use(Sentry.Handlers.errorHandler());
```

**Manual Capture**:
```typescript
import * as Sentry from '@sentry/node';

// Capture exception
try {
  // risky operation
} catch (error) {
  Sentry.captureException(error);
  throw error;
}

// Capture message
Sentry.captureMessage('Something went wrong', 'warning');

// Add context
Sentry.setContext('business', {
  userId: req.user.id,
  groupId: groupId,
  operation: 'create_expense',
});
```

### 3. Sentry Configuration

**Environment Variables**:
```env
SENTRY_DSN=https://[key]@o[org].ingest.sentry.io/[project]
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% in production
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

**Sentry Project Settings**:
1. Create project: `splittab-backend`
2. Enable:
   - Performance Monitoring
   - Profiling
   - Release tracking
   - Issue alerts
3. Set up integrations:
   - Slack (for alerts)
   - GitHub (for commit tracking)
4. Configure alerts (see Alerting section)

---

### 4. Frontend Sentry Setup

**Web (Next.js)**:

Create `web/sentry.client.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions

  integrations: [
    new Sentry.BrowserTracing({
      tracingOrigins: ['localhost', 'splittab.com', /^\//],
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

**iOS**:

Add to `ios/SplitTab/AppDelegate.swift`:
```swift
import Sentry

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        SentrySDK.start { options in
            options.dsn = ProcessInfo.processInfo.environment["SENTRY_DSN"]
            options.debug = false
            options.tracesSampleRate = 1.0
            options.enableAutoSessionTracking = true
            options.sessionTrackingIntervalMillis = 30000
        }
        return true
    }
}
```

---

## ⚡ Application Performance Monitoring

### 1. Transaction Tracking

**Automatic Instrumentation**:
Sentry automatically tracks:
- HTTP requests
- Database queries
- External API calls

**Custom Transactions**:
```typescript
import * as Sentry from '@sentry/node';

async function processExpense(expenseId: string) {
  const transaction = Sentry.startTransaction({
    op: 'process.expense',
    name: 'Process Expense',
  });

  try {
    // Step 1: Fetch expense
    const span1 = transaction.startChild({
      op: 'db.query',
      description: 'Fetch expense from DB',
    });
    const expense = await db.expense.findUnique({ where: { id: expenseId } });
    span1.finish();

    // Step 2: Calculate splits
    const span2 = transaction.startChild({
      op: 'calculation',
      description: 'Calculate expense splits',
    });
    const splits = calculateSplits(expense);
    span2.finish();

    // Step 3: Update balances
    const span3 = transaction.startChild({
      op: 'db.update',
      description: 'Update user balances',
    });
    await updateBalances(splits);
    span3.finish();

    transaction.setStatus('ok');
  } catch (error) {
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
}
```

### 2. Performance Budgets

Set alerts in Sentry for:
- API response time p95 > 500ms
- Database query time p95 > 100ms
- Large transaction duration > 5s

---

## 📊 Metrics & Dashboards

### 1. Prometheus Metrics

Add Prometheus client to backend:

```bash
cd backend
npm install prom-client
```

Create `backend/src/middleware/metrics.ts`:
```typescript
import promClient from 'prom-client';

// Create registry
export const register = new promClient.Registry();

// Default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const activeUsers = new promClient.Gauge({
  name: 'active_users_total',
  help: 'Number of active users',
  registers: [register],
});

export const expensesCreated = new promClient.Counter({
  name: 'expenses_created_total',
  help: 'Total number of expenses created',
  labelNames: ['group_id', 'split_method'],
  registers: [register],
});

export const settlementsCompleted = new promClient.Counter({
  name: 'settlements_completed_total',
  help: 'Total number of settlements completed',
  registers: [register],
});

export const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});
```

**Metrics Endpoint**:
```typescript
// In app.ts
import { register } from './middleware/metrics';

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

**Middleware to Track Requests**:
```typescript
import { httpRequestDuration, httpRequestTotal } from './middleware/metrics';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
  });

  next();
}
```

---

### 2. Business Metrics

Track key business events:

```typescript
import { expensesCreated, settlementsCompleted, activeUsers } from './middleware/metrics';

// In expense.controller.ts
async create(req: Request, res: Response) {
  const expense = await expenseService.create(req.body);

  // Track metric
  expensesCreated.inc({
    group_id: expense.groupId,
    split_method: expense.splitMethod,
  });

  res.status(201).json({ data: expense });
}

// In settlement.controller.ts
async create(req: Request, res: Response) {
  const settlement = await settlementService.create(req.body);

  // Track metric
  settlementsCompleted.inc();

  res.status(201).json({ data: settlement });
}

// Update active users periodically
setInterval(async () => {
  const count = await redis.scard('active_users');
  activeUsers.set(count);
}, 60000); // Every minute
```

---

### 3. Grafana Dashboards

**Setup Grafana**:
```bash
# Using Docker
docker run -d \
  --name=grafana \
  -p 3000:3000 \
  -e GF_SECURITY_ADMIN_PASSWORD=admin \
  grafana/grafana
```

**Add Prometheus Data Source**:
1. Configuration → Data Sources → Add Prometheus
2. URL: `http://prometheus:9090`
3. Save & Test

**Import Dashboards**:

Create `monitoring/grafana-dashboard.json`:
```json
{
  "dashboard": {
    "title": "SplitTab API Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "Active Users",
        "targets": [
          {
            "expr": "active_users_total"
          }
        ]
      },
      {
        "title": "Expenses Created",
        "targets": [
          {
            "expr": "rate(expenses_created_total[1h])"
          }
        ]
      },
      {
        "title": "Database Query Duration",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m]))"
          }
        ]
      }
    ]
  }
}
```

---

## 📝 Logging

### 1. Winston Configuration

Already configured in `backend/src/config/logger.ts`.

**Log Levels**:
- `error`: Errors and exceptions
- `warn`: Warning conditions
- `info`: Informational messages
- `http`: HTTP requests
- `debug`: Debug messages

**Usage**:
```typescript
import logger from './config/logger';

// Different log levels
logger.error('Failed to process payment', { userId, error });
logger.warn('Rate limit approaching', { userId, requests });
logger.info('User logged in', { userId });
logger.http(`${req.method} ${req.path}`, { statusCode: res.statusCode });
logger.debug('Cache miss', { key });
```

---

### 2. Structured Logging

Always use structured logs:
```typescript
// ❌ Bad
logger.info(`User ${userId} created expense ${expenseId}`);

// ✅ Good
logger.info('Expense created', {
  userId,
  expenseId,
  groupId,
  amount,
  splitMethod,
  timestamp: new Date().toISOString(),
});
```

---

### 3. Log Aggregation

**CloudWatch Logs** (if using AWS):

Install CloudWatch transport:
```bash
npm install winston-cloudwatch
```

Add to logger:
```typescript
import CloudWatchTransport from 'winston-cloudwatch';

const logger = winston.createLogger({
  transports: [
    new CloudWatchTransport({
      logGroupName: 'splittab-api',
      logStreamName: process.env.NODE_ENV,
      awsRegion: 'us-east-1',
    }),
  ],
});
```

**Alternative: Papertrail, LogDNA, Datadog**

---

## 🔔 Alerting

### 1. Sentry Alerts

Configure in Sentry Project Settings → Alerts:

#### Critical Alerts (Immediate)
- **Error Spike**
  - Condition: Errors > 10 in 5 minutes
  - Action: Slack #incidents + PagerDuty

- **New Error Type**
  - Condition: First occurrence
  - Action: Slack #dev

- **Performance Degradation**
  - Condition: p95 response time > 1000ms for 10 minutes
  - Action: Slack #dev

#### High Priority Alerts (15 min delay)
- **Error Rate Increase**
  - Condition: Error rate > 1% for 15 minutes
  - Action: Slack #dev

- **Slow Transactions**
  - Condition: Transaction duration > 5s
  - Action: Slack #dev

---

### 2. Prometheus Alerting

Create `monitoring/prometheus-alerts.yml`:
```yaml
groups:
  - name: api_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"

      # API slow response
      - alert: SlowAPIResponse
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "API response time is slow"
          description: "p95 response time is {{ $value }}s"

      # Database slow queries
      - alert: SlowDatabaseQueries
        expr: histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Database queries are slow"
          description: "p95 query time is {{ $value }}s"

      # High CPU usage
      - alert: HighCPUUsage
        expr: process_cpu_seconds_total > 0.8
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is {{ $value }}%"

      # High memory usage
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / 1024 / 1024 / 1024 > 1.5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }}GB"
```

---

### 3. Alert Routing

**Alertmanager Configuration**:
```yaml
# monitoring/alertmanager.yml
global:
  slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 5m
  repeat_interval: 12h
  receiver: 'slack-notifications'

  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
      continue: true

    - match:
        severity: warning
      receiver: 'slack-notifications'

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
```

---

## 🏥 Health Checks

### 1. Application Health

Already implemented at `GET /health`:

```typescript
// backend/src/routes/health.routes.ts
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    checks: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'healthy';
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'degraded';
  }

  // Check Redis
  try {
    await redis.ping();
    health.checks.redis = 'healthy';
  } catch (error) {
    health.checks.redis = 'unhealthy';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

---

### 2. Readiness & Liveness Probes

**Kubernetes Setup**:
```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: api
      image: splittab/api:latest
      livenessProbe:
        httpGet:
          path: /health
          port: 5000
        initialDelaySeconds: 30
        periodSeconds: 10
        timeoutSeconds: 5
        failureThreshold: 3
      readinessProbe:
        httpGet:
          path: /health/ready
          port: 5000
        initialDelaySeconds: 10
        periodSeconds: 5
        timeoutSeconds: 3
        failureThreshold: 3
```

---

## ⏰ Uptime Monitoring

### 1. External Monitoring

**UptimeRobot** (Free tier):
1. Sign up at https://uptimerobot.com
2. Add monitors:
   - `https://api.splittab.com/health` (every 5 min)
   - `https://splittab.com` (every 5 min)
3. Configure alerts:
   - Email
   - Slack
   - SMS (paid)

**Pingdom** (Alternative):
- More detailed checks
- Global locations
- Real user monitoring

---

### 2. Status Page

**statuspage.io**:
1. Create status page: https://status.splittab.com
2. Add components:
   - API
   - Web Application
   - iOS App
   - Database
3. Configure integrations with monitoring tools
4. Display uptime percentages

---

## 💾 Database Monitoring

### 1. PostgreSQL Metrics

**Enable pg_stat_statements**:
```sql
-- In PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slow queries
SELECT
  query,
  calls,
  total_time / 1000 / 60 AS total_minutes,
  mean_time / 1000 AS avg_seconds,
  max_time / 1000 AS max_seconds
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries averaging > 100ms
ORDER BY mean_time DESC
LIMIT 20;
```

**Track Key Metrics**:
```sql
-- Connection count
SELECT count(*) FROM pg_stat_activity;

-- Database size
SELECT pg_size_pretty(pg_database_size('splittab'));

-- Cache hit ratio (should be > 99%)
SELECT
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) AS cache_hit_ratio
FROM pg_statio_user_tables;
```

---

### 2. Database Alerts

Monitor:
- Connection pool exhaustion (> 80% used)
- Slow queries (> 1s)
- Database size growth rate
- Replication lag
- Failed queries
- Lock contention

---

## 🌐 Frontend Monitoring

### 1. Web Vitals

Track Core Web Vitals:

```typescript
// web/src/lib/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import * as Sentry from '@sentry/nextjs';

export function reportWebVitals(metric: any) {
  // Send to Sentry
  Sentry.metrics.distribution(metric.name, metric.value, {
    unit: metric.unit,
  });

  // Send to analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_category: 'Web Vitals',
    });
  }
}

// In pages/_app.tsx
export { reportWebVitals };
```

**Targets**:
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1

---

### 2. User Session Recording

**Sentry Session Replay**:
```typescript
// In sentry.client.config.ts
Sentry.init({
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0,  // 100% of error sessions
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

---

## 📊 Monitoring Checklist

### Before Beta Launch
- [ ] Sentry configured for backend, web, iOS
- [ ] Error alerts set up (Slack integration)
- [ ] Performance monitoring active
- [ ] Health check endpoint working
- [ ] Uptime monitoring configured (UptimeRobot)
- [ ] Basic Grafana dashboard created
- [ ] Logs aggregated to CloudWatch/Papertrail
- [ ] Database slow query monitoring enabled

### Before Production Launch
- [ ] All monitoring tools production-ready
- [ ] Alert thresholds tuned based on beta data
- [ ] On-call rotation established
- [ ] Runbook created for common issues
- [ ] Status page live
- [ ] Incident response process documented
- [ ] Monitoring SLAs defined

---

## 📞 Support & Resources

**Monitoring Tools**:
- Sentry: https://sentry.io/splittab
- Grafana: https://grafana.splittab.com
- Status Page: https://status.splittab.com

**Documentation**:
- Sentry Docs: https://docs.sentry.io/
- Prometheus Docs: https://prometheus.io/docs/
- Grafana Docs: https://grafana.com/docs/

---

**Last Updated**: November 22, 2025
**Next Review**: After beta launch
**Version**: 1.0
