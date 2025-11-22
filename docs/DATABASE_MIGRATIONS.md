# Database Migration Strategy

This document outlines best practices, procedures, and strategies for managing database migrations in SplitTab.

## Table of Contents

1. [Overview](#overview)
2. [Migration Tools](#migration-tools)
3. [Development Workflow](#development-workflow)
4. [Testing Migrations](#testing-migrations)
5. [Production Deployment](#production-deployment)
6. [Rollback Procedures](#rollback-procedures)
7. [Zero-Downtime Migrations](#zero-downtime-migrations)
8. [Blue-Green Deployment](#blue-green-deployment)
9. [Common Scenarios](#common-scenarios)
10. [Troubleshooting](#troubleshooting)

---

## Overview

SplitTab uses **Prisma** as the ORM and migration tool. Prisma provides:

- Declarative schema definition
- Automatic migration generation
- Migration history tracking
- Type-safe database access
- Introspection capabilities

### Migration Philosophy

- **Always forward**: Prefer additive changes over destructive ones
- **Backward compatible**: Ensure old code works during deployment
- **Testable**: Test migrations on staging before production
- **Reversible**: Always have a rollback plan
- **Documented**: Document complex migrations

---

## Migration Tools

### Prisma CLI Commands

```bash
# Development: Create and apply migration
npx prisma migrate dev --name description_of_change

# Production: Apply pending migrations
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Reset database (DANGEROUS - dev only)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# Validate schema
npx prisma validate

# View database schema
npx prisma db pull

# Push schema without migration (dev only)
npx prisma db push
```

### Migration File Structure

```
backend/prisma/migrations/
├── 20240101000000_initial_schema/
│   └── migration.sql
├── 20240115120000_add_user_phone/
│   └── migration.sql
├── 20240201093000_add_expense_categories/
│   └── migration.sql
└── migration_lock.toml
```

---

## Development Workflow

### Step 1: Make Schema Changes

Edit `backend/prisma/schema.prisma`:

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  phoneNumber   String?  @unique  // NEW FIELD
  // ... other fields
}
```

### Step 2: Create Migration

```bash
cd backend

# Create migration with descriptive name
npx prisma migrate dev --name add_user_phone_number

# This will:
# 1. Generate migration SQL
# 2. Apply it to your dev database
# 3. Regenerate Prisma Client
```

### Step 3: Review Migration SQL

```sql
-- backend/prisma/migrations/20240115120000_add_user_phone_number/migration.sql
-- CreateTable or AlterTable
ALTER TABLE "users" ADD COLUMN "phone_number" TEXT;

-- Add unique constraint
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");
```

### Step 4: Test Migration

```bash
# Run tests to ensure nothing breaks
npm test

# Test specific migration scenarios
npm test -- --grep "user phone number"
```

### Step 5: Commit Migration

```bash
git add prisma/migrations
git add prisma/schema.prisma
git commit -m "feat: add phone number field to users"
```

---

## Testing Migrations

### Local Testing

```bash
# 1. Reset database to clean state
npx prisma migrate reset --force

# 2. Apply all migrations from scratch
npx prisma migrate deploy

# 3. Run application tests
npm test

# 4. Check migration status
npx prisma migrate status
```

### Staging Testing

```bash
# 1. Deploy to staging environment
git push origin main  # Triggers staging deployment

# 2. Migrations run automatically in deploy-staging.yml

# 3. Manual verification (if needed)
railway run --environment staging -- npx prisma migrate deploy

# 4. Test application with real data
curl https://staging.splittab.com/health
```

### Migration Validation Checklist

- [ ] Migration SQL reviewed and approved
- [ ] No data loss in migration
- [ ] Indexes created for new columns (if needed)
- [ ] Constraints validated
- [ ] Backward compatibility maintained
- [ ] Tests pass with new schema
- [ ] Migration tested on staging
- [ ] Performance impact assessed
- [ ] Rollback plan documented

---

## Production Deployment

### Pre-deployment Checklist

- [ ] Migration tested on staging
- [ ] Database backup created
- [ ] Rollback plan ready
- [ ] Team notified of deployment
- [ ] Maintenance window scheduled (if needed)
- [ ] Monitoring alerts configured

### Deployment Process

#### Automated (via GitHub Actions)

The production deployment workflow automatically handles migrations:

```yaml
# .github/workflows/deploy-production.yml
- name: Run database migrations
  working-directory: ./backend
  env:
    DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
  run: |
    echo "Running Prisma migrations on production..."
    npx prisma migrate deploy
```

#### Manual Deployment

```bash
# 1. Create database backup
railway backup create --service postgres --environment production

# OR for AWS RDS:
aws rds create-db-snapshot \
  --db-instance-identifier splittab-prod \
  --db-snapshot-identifier "backup-$(date +%Y%m%d-%H%M%S)"

# 2. Check pending migrations
railway run --environment production -- npx prisma migrate status

# 3. Apply migrations
railway run --environment production -- npx prisma migrate deploy

# 4. Verify migration
railway run --environment production -- \
  npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM users;"

# 5. Monitor application logs
railway logs --service backend --environment production
```

### Post-deployment Verification

```bash
# 1. Check application health
curl https://splittab.com/health
curl https://splittab.com/api/v1/health/db

# 2. Verify critical queries
curl -X POST https://splittab.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 3. Monitor error rates in Sentry
# Check Sentry dashboard for any new errors

# 4. Monitor database performance
# Check slow query logs
# Monitor connection pool usage
```

---

## Rollback Procedures

### Scenario 1: Migration Failed (Not Applied)

```bash
# If migration fails during `migrate deploy`, no action needed
# Fix the migration and retry

# 1. Fix schema or migration SQL
vim prisma/schema.prisma

# 2. Create new migration
npx prisma migrate dev --name fix_previous_migration

# 3. Deploy again
npx prisma migrate deploy
```

### Scenario 2: Migration Applied But Breaking

**Option A: Roll Forward (Preferred)**

```bash
# 1. Create compensating migration
npx prisma migrate dev --name rollback_user_phone

# Example: Remove the problematic field
# migration.sql:
# ALTER TABLE "users" DROP COLUMN "phone_number";

# 2. Deploy fix
npx prisma migrate deploy
```

**Option B: Database Restore (Last Resort)**

```bash
# 1. Stop application
railway service stop backend --environment production

# 2. Restore from backup
railway backup restore <backup-id> --environment production

# OR for AWS RDS:
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier splittab-prod-restored \
  --db-snapshot-identifier backup-20240115-120000

# 3. Update application to point to restored database

# 4. Redeploy previous version
git revert <commit-hash>
git push origin main

# 5. Start application
railway service start backend --environment production
```

### Scenario 3: Partial Migration (Some Servers Updated)

```bash
# In a rolling deployment, ensure backward compatibility

# 1. Deploy application code first (without migration)
git push origin main

# 2. Once all servers updated, run migration
npx prisma migrate deploy

# 3. This ensures old code works with new schema
```

---

## Zero-Downtime Migrations

### Multi-Phase Migration Strategy

#### Phase 1: Add New Column (Nullable)

```prisma
// Week 1: Add optional field
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  phoneNumber   String?  @unique  // Nullable initially
}
```

```bash
npx prisma migrate dev --name add_phone_number_nullable
```

#### Phase 2: Start Writing to New Column

```typescript
// Update application code to write to new field
async function createUser(data: CreateUserInput) {
  return prisma.user.create({
    data: {
      email: data.email,
      phoneNumber: data.phoneNumber, // Start writing
    },
  });
}
```

#### Phase 3: Backfill Data

```typescript
// Script to backfill existing records
async function backfillPhoneNumbers() {
  const users = await prisma.user.findMany({
    where: { phoneNumber: null },
  });

  for (const user of users) {
    // Get phone from external source or set default
    await prisma.user.update({
      where: { id: user.id },
      data: { phoneNumber: user.legacyPhone || null },
    });
  }
}
```

#### Phase 4: Make Field Required

```prisma
// Week 2: After backfill complete
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  phoneNumber   String   @unique  // Now required
}
```

```bash
npx prisma migrate dev --name make_phone_number_required
```

### Renaming Columns/Tables

**Bad Approach (Causes Downtime):**

```sql
-- Don't do this!
ALTER TABLE "users" RENAME COLUMN "email" TO "email_address";
```

**Good Approach (Zero Downtime):**

```sql
-- Step 1: Add new column
ALTER TABLE "users" ADD COLUMN "email_address" TEXT;

-- Step 2: Copy data
UPDATE "users" SET "email_address" = "email";

-- Step 3: Deploy code that writes to both columns

-- Step 4: After full deployment, drop old column
ALTER TABLE "users" DROP COLUMN "email";
```

### Removing Columns

**Multi-Phase Approach:**

```sql
-- Phase 1: Stop writing to column (code deploy)
-- (No DB changes yet)

-- Phase 2: Make column nullable (if needed)
ALTER TABLE "users" ALTER COLUMN "legacy_field" DROP NOT NULL;

-- Phase 3: Drop column (after confirming no usage)
ALTER TABLE "users" DROP COLUMN "legacy_field";
```

---

## Blue-Green Deployment

For critical migrations, use blue-green deployment strategy.

### Setup

```
┌─────────────────────────────────────────────────┐
│              Load Balancer                      │
└───────────┬─────────────────────┬───────────────┘
            │                     │
    ┌───────▼────────┐    ┌──────▼────────┐
    │  Blue (v1.0)   │    │ Green (v1.1)  │
    │  Old Version   │    │  New Version  │
    └───────┬────────┘    └──────┬────────┘
            │                     │
            └──────────┬──────────┘
                       │
                ┌──────▼──────┐
                │  Database   │
                └─────────────┘
```

### Deployment Steps

1. **Prepare Green Environment**
   ```bash
   # Deploy new version to green environment
   railway up --service backend-green --environment production
   ```

2. **Run Migration on Green**
   ```bash
   # Apply migrations (ensure backward compatible)
   railway run --service backend-green -- npx prisma migrate deploy
   ```

3. **Test Green Environment**
   ```bash
   # Smoke tests on green
   curl https://green.splittab.com/health
   ```

4. **Switch Traffic**
   ```bash
   # Update load balancer to point to green
   # Keep blue running for quick rollback
   ```

5. **Monitor**
   ```bash
   # Monitor metrics and errors
   # If issues detected, switch back to blue
   ```

6. **Decommission Blue**
   ```bash
   # After 24-48 hours, shut down blue
   railway service delete backend-blue
   ```

---

## Common Scenarios

### Adding a Non-Nullable Column with Default

```prisma
model User {
  id          String   @id @default(uuid())
  role        String   @default("user")  // NEW
}
```

Generated migration:

```sql
ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';
```

### Adding a Foreign Key

```prisma
model Expense {
  id          String   @id @default(uuid())
  categoryId  String?  // Start nullable
  category    Category? @relation(fields: [categoryId], references: [id])
}

model Category {
  id          String    @id @default(uuid())
  name        String
  expenses    Expense[]
}
```

### Creating Indexes

```prisma
model User {
  email       String   @unique
  createdAt   DateTime

  @@index([createdAt])
  @@index([email, createdAt])
}
```

Generated migration:

```sql
CREATE INDEX "users_created_at_idx" ON "users"("created_at");
CREATE INDEX "users_email_created_at_idx" ON "users"("email", "created_at");
```

### Changing Column Type

```sql
-- Phase 1: Add new column with new type
ALTER TABLE "users" ADD COLUMN "balance_decimal" DECIMAL(10,2);

-- Phase 2: Copy data with conversion
UPDATE "users" SET "balance_decimal" = CAST("balance_int" AS DECIMAL) / 100;

-- Phase 3: Deploy code using new column

-- Phase 4: Drop old column
ALTER TABLE "users" DROP COLUMN "balance_int";
ALTER TABLE "users" RENAME COLUMN "balance_decimal" TO "balance";
```

### Adding Unique Constraint

```sql
-- Check for duplicates first
SELECT email, COUNT(*)
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Clean up duplicates if any

-- Add unique constraint
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
```

---

## Troubleshooting

### Issue: Migration Fails with Lock Error

```
Error: P1001: Can't reach database server
```

**Solution:**

```bash
# Check database connections
railway run -- psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"

# Kill blocking queries
railway run -- psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction';"
```

### Issue: Schema Drift Detected

```
Error: P3006: Migration is not in sync with the database schema
```

**Solution:**

```bash
# Reset migration history (DANGEROUS)
npx prisma migrate resolve --applied "migration_name"

# Or create baseline
npx prisma migrate resolve --rolled-back "migration_name"
npx prisma migrate dev
```

### Issue: Out of Sync Migrations

```
Error: The migration has already been applied
```

**Solution:**

```bash
# Mark migration as applied without running
npx prisma migrate resolve --applied "20240115120000_add_phone"

# Verify status
npx prisma migrate status
```

### Issue: Performance Degradation After Migration

```bash
# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE phone_number = '+1234567890';

# Add missing index
CREATE INDEX CONCURRENTLY "users_phone_idx" ON "users"("phone_number");

# Update table statistics
ANALYZE users;
```

### Issue: Deadlock During Migration

```
ERROR: deadlock detected
```

**Solution:**

```sql
-- Use lighter locks when possible
ALTER TABLE "users" ADD COLUMN "new_field" TEXT;  -- Uses ACCESS EXCLUSIVE lock

-- Better: Use concurrent index creation
CREATE INDEX CONCURRENTLY "idx_name" ON "users"("field");

-- For large tables, consider:
-- 1. Adding column with no default
-- 2. Backfilling in batches
-- 3. Adding default later
```

---

## Best Practices Summary

### DO

✅ Test migrations on staging first
✅ Create database backups before migrations
✅ Use backward-compatible changes
✅ Add indexes concurrently for large tables
✅ Document complex migrations
✅ Use descriptive migration names
✅ Monitor application after deployment
✅ Keep migrations small and focused

### DON'T

❌ Skip testing on staging
❌ Run migrations without backups
❌ Make breaking changes without planning
❌ Add NOT NULL constraints without defaults
❌ Rename columns directly
❌ Delete data in migrations
❌ Combine schema changes with data changes
❌ Run migrations manually in production (use CI/CD)

---

## Emergency Contacts

- **Database Issues**: DBA Team - dba@splittab.com
- **Migration Failures**: DevOps Team - devops@splittab.com
- **Production Incidents**: On-call Engineer - oncall@splittab.com

---

## Additional Resources

- [Prisma Migration Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Zero-Downtime Deployments](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)

---

**Last Updated:** November 2025
**Maintained by:** SplitTab DevOps Team
