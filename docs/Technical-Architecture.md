# Technical Architecture

## Overview

This document outlines the technical architecture for SplitTab, covering system design, technology stack, infrastructure, and implementation details.

**Version**: 1.0
**Last Updated**: 2025-11-21

---

## Architecture Principles

### Design Principles

1. **Scalability First**: Design for horizontal scaling from day one
2. **Security by Default**: Security at every layer
3. **Data Consistency**: ACID guarantees for financial operations
4. **Real-time Sync**: Low-latency updates across devices
5. **Offline Support**: Graceful degradation when offline
6. **API First**: Well-designed APIs for future integrations
7. **Monitoring & Observability**: Comprehensive logging and metrics

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Clients                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   iOS App    │  │   Web App    │  │  Mobile Web  │      │
│  │  (SwiftUI)   │  │ (React/Next) │  │  (PWA)       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS / WSS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer                           │
│                    (Cloudflare / AWS ALB)                    │
└─────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  API Server      │ │  API Server      │ │  API Server      │
│  (Node.js)       │ │  (Node.js)       │ │  (Node.js)       │
└──────────────────┘ └──────────────────┘ └──────────────────┘
              │             │             │
              └─────────────┼─────────────┘
                            │
              ┌─────────────┼─────────────────┐
              ▼             ▼                 ▼
┌──────────────────┐ ┌──────────────┐ ┌────────────────┐
│   PostgreSQL     │ │    Redis     │ │  File Storage  │
│   (Primary)      │ │   (Cache)    │ │    (S3/R2)     │
│                  │ │              │ │                │
│  ┌────────────┐  │ │  ┌────────┐  │ │                │
│  │  Replica   │  │ │  │ Queue  │  │ │                │
│  │  (Read)    │  │ │  │(BullMQ)│  │ │                │
│  └────────────┘  │ │  └────────┘  │ │                │
└──────────────────┘ └──────────────┘ └────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Background Workers                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  OCR Worker  │  │ Email Worker │  │ Sync Worker  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│  • Google Cloud Vision (OCR)                                 │
│  • Stripe (Payments)                                         │
│  • Plaid (Banking)                                           │
│  • SendGrid/Resend (Email)                                   │
│  • APNs / OneSignal (Push Notifications)                     │
│  • Exchange Rate API                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

#### iOS App
- **Language**: Swift 5.9+
- **UI Framework**: SwiftUI (iOS 15+)
- **Networking**: URLSession
- **Local Storage**: Core Data
- **Reactive**: Combine
- **Keychain**: Keychain Services
- **Image Loading**: Kingfisher or SDWebImage
- **Charts**: Swift Charts

#### Web App
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5+
- **UI Library**: React 18+
- **Styling**: Tailwind CSS 3+
- **Components**: shadcn/ui
- **State Management**: Zustand or Redux Toolkit
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts or Chart.js
- **Real-time**: Socket.io client

### Backend

#### API Server
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js or NestJS
- **Language**: TypeScript 5+
- **API Style**: RESTful (GraphQL consideration for Phase 3)
- **Validation**: Zod
- **Authentication**: JWT (jsonwebtoken)
- **Real-time**: Socket.io
- **File Upload**: Multer
- **Rate Limiting**: express-rate-limit
- **Logging**: Winston or Pino
- **Documentation**: Swagger/OpenAPI

#### Database
- **Primary**: PostgreSQL 15+
  - JSONB support for flexible schemas
  - Full-text search
  - Transactional guarantees
- **ORM**: Prisma or Drizzle ORM
- **Migrations**: Prisma Migrate or db-migrate
- **Connection Pool**: pg-pool

#### Caching & Queue
- **Cache**: Redis 7+
  - Session storage
  - API response caching
  - Rate limiting
- **Queue**: BullMQ (Redis-based)
  - Background jobs
  - Email sending
  - OCR processing
  - Notification delivery

#### File Storage
- **Service**: AWS S3 or Cloudflare R2
- **SDK**: AWS SDK for JavaScript
- **CDN**: CloudFlare CDN
- **Image Processing**: Sharp (Node.js)

### Infrastructure

#### Hosting (MVP)
- **API**: Railway, Render, or Fly.io
- **Database**: Managed PostgreSQL (Railway, Supabase)
- **Redis**: Upstash or Redis Cloud
- **Web**: Vercel or Netlify

#### Hosting (Production)
- **Cloud Provider**: AWS, GCP, or Azure
- **Container Orchestration**: Kubernetes (EKS, GKE)
- **Load Balancer**: AWS ALB / Cloudflare
- **CDN**: CloudFlare
- **DNS**: Cloudflare DNS

#### Monitoring & Analytics
- **Error Tracking**: Sentry
- **Application Monitoring**: DataDog or New Relic
- **Analytics**: PostHog or Mixpanel
- **Logging**: DataDog, CloudWatch, or Loki
- **Uptime Monitoring**: UptimeRobot or Pingdom

### DevOps

#### Version Control
- **Git**: GitHub
- **Branching**: Trunk-based development
- **Code Review**: GitHub Pull Requests

#### CI/CD
- **Platform**: GitHub Actions
- **Testing**: Jest, Playwright
- **Deployment**: Automated on merge to main
- **Environments**: Dev, Staging, Production

#### Infrastructure as Code
- **Tool**: Terraform or Pulumi
- **State Management**: Terraform Cloud or S3

---

## Data Architecture

### Database Design Principles

1. **Normalization**: 3NF for relational data
2. **Denormalization**: Strategic denormalization for performance
3. **Soft Deletes**: Preserve data for audit trails
4. **Timestamps**: created_at, updated_at on all tables
5. **UUIDs**: Primary keys for distributed systems
6. **Indexes**: Strategic indexing for query performance

### Core Entities

#### Users
- `id` (UUID, PK)
- `email` (unique, indexed)
- `password_hash`
- `name`
- `profile_picture_url`
- `default_currency`
- `timezone`
- `created_at`
- `updated_at`

#### Groups
- `id` (UUID, PK)
- `name`
- `group_type`
- `image_url`
- `default_currency`
- `simplify_debts` (boolean)
- `created_by` (FK → users)
- `created_at`
- `updated_at`

#### Group Members
- `id` (UUID, PK)
- `group_id` (FK → groups)
- `user_id` (FK → users)
- `role` (admin, member)
- `joined_at`
- `left_at` (nullable)

#### Expenses
- `id` (UUID, PK)
- `group_id` (FK → groups, nullable for personal)
- `amount` (decimal)
- `currency`
- `description`
- `category`
- `date`
- `notes`
- `created_by` (FK → users)
- `created_at`
- `updated_at`
- `deleted_at` (nullable, soft delete)

#### Expense Participants
- `id` (UUID, PK)
- `expense_id` (FK → expenses)
- `user_id` (FK → users)
- `paid_amount` (decimal) - what they paid
- `owed_amount` (decimal) - what they owe
- `created_at`

#### Settlements
- `id` (UUID, PK)
- `group_id` (FK → groups, nullable)
- `payer_id` (FK → users)
- `payee_id` (FK → users)
- `amount` (decimal)
- `currency`
- `payment_method`
- `reference_number`
- `notes`
- `confirmed` (boolean)
- `confirmed_at` (nullable)
- `date`
- `created_at`

#### Receipts
- `id` (UUID, PK)
- `expense_id` (FK → expenses)
- `file_url`
- `thumbnail_url`
- `file_type`
- `file_size`
- `ocr_data` (JSONB)
- `ocr_confidence` (decimal)
- `uploaded_by` (FK → users)
- `created_at`

### Database Indexing Strategy

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);

-- Groups
CREATE INDEX idx_groups_created_by ON groups(created_by);

-- Group Members
CREATE INDEX idx_group_members_group_user ON group_members(group_id, user_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);

-- Expenses
CREATE INDEX idx_expenses_group ON expenses(group_id);
CREATE INDEX idx_expenses_created_by ON expenses(created_by);
CREATE INDEX idx_expenses_date ON expenses(date DESC);
CREATE INDEX idx_expenses_deleted_at ON expenses(deleted_at) WHERE deleted_at IS NULL;

-- Expense Participants
CREATE INDEX idx_expense_participants_expense ON expense_participants(expense_id);
CREATE INDEX idx_expense_participants_user ON expense_participants(user_id);

-- Settlements
CREATE INDEX idx_settlements_payer ON settlements(payer_id);
CREATE INDEX idx_settlements_payee ON settlements(payee_id);
CREATE INDEX idx_settlements_group ON settlements(group_id);
```

### Caching Strategy

#### What to Cache
- **User Sessions**: 15 minutes
- **User Profiles**: 5 minutes
- **Group Data**: 5 minutes
- **Balance Calculations**: 2 minutes
- **Exchange Rates**: 1 hour
- **API Responses**: 1-5 minutes (based on endpoint)

#### Cache Invalidation
- **Time-based**: TTL expiration
- **Event-based**: Invalidate on write operations
- **Pattern-based**: Wildcard invalidation for related keys

```typescript
// Cache key patterns
const CACHE_KEYS = {
  user: (id: string) => `user:${id}`,
  userGroups: (id: string) => `user:${id}:groups`,
  group: (id: string) => `group:${id}`,
  groupExpenses: (id: string) => `group:${id}:expenses`,
  balance: (userId: string, otherId: string) => `balance:${userId}:${otherId}`,
  groupBalances: (groupId: string) => `group:${groupId}:balances`,
}
```

---

## API Design

### RESTful API Structure

#### Base URL
```
Production: https://api.splittab.com/v1
Staging: https://api-staging.splittab.com/v1
Development: http://localhost:3000/v1
```

#### Authentication
- **Method**: JWT Bearer Token
- **Header**: `Authorization: Bearer <token>`
- **Token Expiry**: 15 minutes (access), 30 days (refresh)

#### Standard Response Format

```typescript
// Success Response
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2025-11-21T12:00:00Z",
    "requestId": "req_123xyz"
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "field": "amount",
        "message": "Amount must be greater than 0"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-11-21T12:00:00Z",
    "requestId": "req_123xyz"
  }
}
```

#### Pagination
```typescript
// Request
GET /expenses?page=1&limit=20

// Response
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### Key Endpoints

#### Authentication
```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
POST   /auth/forgot-password
POST   /auth/reset-password
GET    /auth/me
```

#### Users
```
GET    /users/:id
PUT    /users/:id
DELETE /users/:id
GET    /users/:id/balances
GET    /users/:id/groups
```

#### Groups
```
GET    /groups
POST   /groups
GET    /groups/:id
PUT    /groups/:id
DELETE /groups/:id
GET    /groups/:id/members
POST   /groups/:id/members
DELETE /groups/:id/members/:userId
GET    /groups/:id/expenses
GET    /groups/:id/balances
```

#### Expenses
```
GET    /expenses
POST   /expenses
GET    /expenses/:id
PUT    /expenses/:id
DELETE /expenses/:id
POST   /expenses/:id/receipts
GET    /expenses/:id/receipts
```

#### Settlements
```
GET    /settlements
POST   /settlements
GET    /settlements/:id
PUT    /settlements/:id (confirm)
DELETE /settlements/:id
```

### Real-Time Events (WebSockets)

#### Socket.io Events

```typescript
// Client → Server
socket.emit('join-group', { groupId: 'xxx' });
socket.emit('leave-group', { groupId: 'xxx' });

// Server → Client
socket.on('expense-created', (data) => { /* ... */ });
socket.on('expense-updated', (data) => { /* ... */ });
socket.on('expense-deleted', (data) => { /* ... */ });
socket.on('settlement-created', (data) => { /* ... */ });
socket.on('balance-updated', (data) => { /* ... */ });
```

---

## Security Architecture

### Authentication & Authorization

#### JWT Token Strategy
```typescript
// Access Token (15 min)
{
  "sub": "user_id",
  "email": "user@example.com",
  "iat": 1700000000,
  "exp": 1700000900,
  "type": "access"
}

// Refresh Token (30 days)
{
  "sub": "user_id",
  "iat": 1700000000,
  "exp": 1702592000,
  "type": "refresh"
}
```

#### Password Security
- **Hashing**: bcrypt with cost factor 12
- **Requirements**: Min 8 chars, mix of upper/lower/numbers
- **Reset Tokens**: UUID, 1-hour expiry
- **Rate Limiting**: 5 failed attempts → 15-minute lockout

### API Security

#### Rate Limiting
```typescript
// Per endpoint limits
const rateLimits = {
  default: '100 req/15min',
  auth: '10 req/15min',
  upload: '20 req/hour',
  ocr: '50 req/day (free), unlimited (premium)'
}
```

#### Input Validation
- **Sanitization**: All inputs sanitized
- **Validation**: Zod schemas for all requests
- **SQL Injection**: Parameterized queries via ORM
- **XSS**: Output encoding, CSP headers

#### CORS Configuration
```typescript
const corsOptions = {
  origin: [
    'https://splittab.com',
    'https://www.splittab.com',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
  ].filter(Boolean),
  credentials: true,
  maxAge: 86400
}
```

### Data Encryption

#### In Transit
- **TLS 1.3**: All communication encrypted
- **Certificate**: Wildcard SSL from Let's Encrypt
- **HSTS**: Strict-Transport-Security header

#### At Rest
- **Database**: Encryption at rest (provider-managed)
- **Files**: Server-side encryption (S3/R2)
- **Sensitive Data**: Application-level encryption for PII

### Privacy & Compliance

#### GDPR Compliance
- **Data Export**: Users can export all data (JSON)
- **Right to Deletion**: Anonymize user data on deletion
- **Consent**: Explicit consent for data processing
- **Data Minimization**: Only collect necessary data

#### Audit Logging
```typescript
interface AuditLog {
  id: string;
  userId: string;
  action: string; // 'expense.create', 'user.delete'
  resource: string; // 'expense:123'
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata: Record<string, any>;
}
```

---

## Performance & Scalability

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response (p95) | < 200ms | DataDog APM |
| API Response (p99) | < 500ms | DataDog APM |
| Page Load (FCP) | < 1.5s | Lighthouse |
| Page Load (LCP) | < 2.5s | Lighthouse |
| Database Query | < 50ms | pg-stat-statements |
| Cache Hit Rate | > 80% | Redis metrics |

### Scalability Strategy

#### Horizontal Scaling
- **API Servers**: Stateless, scale to N instances
- **Database**: Read replicas for read-heavy operations
- **Cache**: Redis Cluster for distributed caching
- **File Storage**: Auto-scaling object storage

#### Database Optimization
```sql
-- Partitioning for large tables
CREATE TABLE expenses (
  -- ... columns
) PARTITION BY RANGE (date);

-- Materialized views for complex queries
CREATE MATERIALIZED VIEW group_balances AS
SELECT
  group_id,
  user_id,
  SUM(owed_amount - paid_amount) as balance
FROM expense_participants
GROUP BY group_id, user_id;

-- Refresh strategy
REFRESH MATERIALIZED VIEW CONCURRENTLY group_balances;
```

#### Caching Layers
```typescript
// Multi-level caching
async function getGroupExpenses(groupId: string) {
  // L1: Memory cache (in-process)
  let expenses = memoryCache.get(`expenses:${groupId}`);
  if (expenses) return expenses;

  // L2: Redis cache
  expenses = await redis.get(`expenses:${groupId}`);
  if (expenses) {
    memoryCache.set(`expenses:${groupId}`, expenses, 60);
    return JSON.parse(expenses);
  }

  // L3: Database
  expenses = await db.expenses.findMany({ where: { groupId } });
  await redis.setex(`expenses:${groupId}`, 300, JSON.stringify(expenses));
  memoryCache.set(`expenses:${groupId}`, expenses, 60);

  return expenses;
}
```

### CDN Strategy
- **Static Assets**: Images, CSS, JS via CDN
- **Receipt Images**: Served through CDN
- **Cache-Control**: Aggressive caching (1 year for immutable assets)
- **Image Optimization**: Automatic WebP conversion

---

## Disaster Recovery & High Availability

### Backup Strategy

#### Database Backups
- **Frequency**:
  - Full backup: Daily
  - Incremental: Every 6 hours
  - WAL archiving: Continuous
- **Retention**: 30 days
- **Testing**: Monthly restore tests
- **Storage**: Geographic redundancy

#### File Backups
- **Receipts**: S3 versioning enabled
- **Retention**: 1 year
- **Cross-region replication**: Enabled

### Disaster Recovery Plan

#### RTO & RPO Targets
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 15 minutes

#### Failover Strategy
1. Automated health checks
2. DNS failover to backup region
3. Database promotion (replica → primary)
4. Application deployment to backup region
5. Data validation and smoke tests

---

## Development Workflow

### Environment Strategy

```
┌──────────────┐
│ Development  │ - Local development
└──────────────┘ - Feature branches
       │
       ▼
┌──────────────┐
│   Staging    │ - Pre-production testing
└──────────────┘ - Automated tests
       │         - Manual QA
       ▼
┌──────────────┐
│  Production  │ - Live application
└──────────────┘ - Automated monitoring
```

### Git Workflow

```
main (production)
  │
  ├─ develop (staging)
  │   │
  │   ├─ feature/expense-scanning
  │   ├─ feature/payment-integration
  │   └─ bugfix/balance-calculation
  │
  └─ hotfix/critical-bug
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
      - run: npm run test:e2e

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: npm run deploy:staging

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Production
        run: npm run deploy:production
```

---

## Monitoring & Observability

### Metrics to Track

#### Application Metrics
- Request rate (req/sec)
- Error rate (%)
- Response time (p50, p95, p99)
- Active users (concurrent)
- Database connections
- Cache hit rate
- Queue length

#### Business Metrics
- User signups
- Expenses created
- Settlements completed
- Groups created
- OCR requests
- Payment transactions

### Alerting Strategy

```typescript
// Alert thresholds
const alerts = {
  errorRate: {
    warning: 1, // 1% error rate
    critical: 5 // 5% error rate
  },
  responseTime: {
    warning: 500, // 500ms p95
    critical: 1000 // 1s p95
  },
  uptime: {
    critical: 99.5 // Below 99.5% uptime
  }
}
```

### Logging Strategy

```typescript
// Log levels
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

// Structured logging
logger.info('Expense created', {
  expenseId: 'exp_123',
  userId: 'user_456',
  groupId: 'grp_789',
  amount: 50.00,
  currency: 'USD'
});
```

---

## Technical Debt Management

### Acceptable Technical Debt (MVP)
- Basic debt simplification algorithm
- Limited currency support
- No database sharding
- Simple notification system

### Technical Debt to Address (Post-MVP)
- Migrate to microservices (if needed)
- Implement GraphQL (if beneficial)
- Database sharding for scale
- Advanced caching strategies
- ML model optimization

---

**Document Version**: 1.0
**Last Updated**: 2025-11-21
**Status**: Draft
**Next Review**: After Phase 1 completion
