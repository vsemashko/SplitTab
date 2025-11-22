# Operations Runbook

This runbook provides procedures for common operational tasks, incident response, and troubleshooting for SplitTab.

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Deployment Procedures](#deployment-procedures)
3. [Rollback Procedures](#rollback-procedures)
4. [Monitoring and Alerting](#monitoring-and-alerting)
5. [Incident Response](#incident-response)
6. [Common Issues and Solutions](#common-issues-and-solutions)
7. [Database Operations](#database-operations)
8. [Performance Troubleshooting](#performance-troubleshooting)
9. [Security Incidents](#security-incidents)
10. [Maintenance Tasks](#maintenance-tasks)

---

## Quick Reference

### Emergency Contacts

| Role | Contact | Phone | Slack |
|------|---------|-------|-------|
| On-Call Engineer | oncall@splittab.com | +1-XXX-XXX-XXXX | @oncall |
| DevOps Lead | devops@splittab.com | +1-XXX-XXX-XXXX | @devops-lead |
| Database Admin | dba@splittab.com | +1-XXX-XXX-XXXX | @dba |
| Security Team | security@splittab.com | +1-XXX-XXX-XXXX | @security |

### Critical URLs

- **Production API**: https://splittab.com
- **Staging API**: https://staging.splittab.com
- **Health Check**: https://splittab.com/health
- **Sentry**: https://sentry.io/organizations/splittab
- **Railway Dashboard**: https://railway.app
- **AWS Console**: https://console.aws.amazon.com
- **Status Page**: https://status.splittab.com

### Quick Commands

```bash
# Check service status
railway status --environment production

# View logs
railway logs --service backend --environment production

# Connect to database
railway connect postgres --environment production

# Deploy latest version
git tag v1.0.0 && git push origin v1.0.0

# Rollback deployment
railway rollback --service backend --environment production

# Scale service
railway scale backend --replicas 4 --environment production
```

---

## Deployment Procedures

### Standard Deployment (Staging)

**Trigger:** Push to `main` or `develop` branch

**Process:**

1. **Pre-deployment**
   ```bash
   # Verify CI passes
   gh run list --workflow=ci.yml --branch main --limit 1

   # Check staging health
   curl https://staging.splittab.com/health
   ```

2. **Automatic Deployment**
   - GitHub Actions triggers `deploy-staging.yml`
   - Workflow runs automatically
   - Monitor progress in Actions tab

3. **Verification**
   ```bash
   # Check deployment status
   gh run list --workflow=deploy-staging.yml --limit 1

   # Test API health
   curl -f https://staging.splittab.com/health
   curl -f https://staging.splittab.com/api/v1/health

   # Run smoke tests
   npm run test:smoke -- --env staging
   ```

4. **Post-deployment**
   - Monitor Sentry for new errors
   - Check application logs
   - Verify metrics in monitoring dashboard

### Production Deployment

**Trigger:** Create a new release/tag

**Process:**

1. **Pre-deployment Checklist**
   - [ ] All tests passing on `main`
   - [ ] Deployed to staging successfully
   - [ ] Smoke tests passed on staging
   - [ ] Database migrations reviewed
   - [ ] Team notified in #deployments
   - [ ] No ongoing incidents

2. **Create Release**
   ```bash
   # Create and push tag
   git checkout main
   git pull origin main
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0

   # OR create via GitHub
   gh release create v1.0.0 --title "v1.0.0" --notes "Release notes here"
   ```

3. **Monitor Deployment**
   ```bash
   # Watch GitHub Actions
   gh run watch

   # Monitor logs in real-time
   railway logs --service backend --environment production --follow
   ```

4. **Verification**
   ```bash
   # Health checks
   curl -f https://splittab.com/health
   curl -f https://splittab.com/api/v1/health/db
   curl -f https://splittab.com/api/v1/health/redis

   # Test critical endpoints
   curl -X POST https://splittab.com/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

5. **Post-deployment**
   - Monitor Sentry error rates
   - Check response times
   - Verify database performance
   - Update status page
   - Notify team of successful deployment

### Manual Deployment (Emergency)

```bash
# 1. Build Docker image
cd backend
docker build -t splittab/backend:emergency-v1.0.1 .

# 2. Push to registry
docker push splittab/backend:emergency-v1.0.1

# 3. Deploy via Railway
railway up --service backend --environment production

# 4. Verify deployment
railway logs --service backend --environment production --follow
```

---

## Rollback Procedures

### Automatic Rollback

GitHub Actions includes automatic rollback on deployment failure.

### Manual Rollback (Railway)

```bash
# 1. Check deployment history
railway deployments list --service backend --environment production

# 2. Identify last known good deployment
# Output example:
# ID: dep_abc123 | Status: SUCCESS | Version: v1.0.0 | Date: 2024-01-15

# 3. Rollback to specific deployment
railway rollback dep_abc123 --service backend --environment production

# 4. Verify rollback
curl https://splittab.com/health
railway logs --service backend --environment production
```

### Manual Rollback (AWS ECS)

```bash
# 1. List task definitions
aws ecs list-task-definitions --family-prefix splittab-backend

# 2. Update service to previous task definition
aws ecs update-service \
  --cluster splittab-production \
  --service backend \
  --task-definition splittab-backend:5  # Previous version

# 3. Wait for deployment to complete
aws ecs wait services-stable \
  --cluster splittab-production \
  --services backend
```

### Database Rollback

See [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md#rollback-procedures) for detailed procedures.

Quick rollback:

```bash
# 1. Stop writing to database
railway service stop backend --environment production

# 2. Restore from backup
railway backup restore <backup-id> --environment production

# 3. Deploy previous application version
git revert <migration-commit>
git push origin main
```

---

## Monitoring and Alerting

### Key Metrics

Monitor these metrics continuously:

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|-------------------|
| Error Rate | > 1% | > 5% |
| Response Time (p95) | > 500ms | > 2000ms |
| CPU Usage | > 70% | > 90% |
| Memory Usage | > 80% | > 95% |
| Database Connections | > 70% of max | > 90% of max |
| Redis Memory | > 80% | > 95% |
| Disk Space | > 75% | > 90% |

### Monitoring Tools

#### 1. Sentry (Error Tracking)

```bash
# View recent errors
open https://sentry.io/organizations/splittab/issues/

# Check error trends
sentry-cli events list --project splittab-backend

# Filter by environment
# Sentry Dashboard -> Filters -> environment:production
```

#### 2. Railway Metrics (if using Railway)

```bash
# View metrics
railway metrics --service backend --environment production

# Monitor resource usage
railway status --service backend --environment production
```

#### 3. AWS CloudWatch (if using AWS)

```bash
# View recent logs
aws logs tail /ecs/splittab-backend --follow

# Get metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=backend \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### Alert Configuration

#### Critical Alerts (PagerDuty/On-call)

- Service down (health check fails)
- Database connectivity lost
- Redis unavailable
- Error rate > 5%
- Response time p95 > 2s

#### Warning Alerts (Slack)

- Error rate > 1%
- High memory usage (> 80%)
- High CPU usage (> 70%)
- Slow queries detected
- Certificate expiring soon

### Setting Up Alerts

**Sentry:**

```bash
# Sentry -> Alerts -> Create Alert
# Condition: Error count > 100 in 1 hour
# Action: Send to Slack #alerts
```

**CloudWatch:**

```bash
# Create alarm
aws cloudwatch put-metric-alarm \
  --alarm-name splittab-high-error-rate \
  --alarm-description "Alert when error rate exceeds 5%" \
  --metric-name 5XXError \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:alerts
```

---

## Incident Response

### Incident Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| P0 (Critical) | Complete service outage | Immediate | API down, database unavailable |
| P1 (High) | Major functionality broken | < 15 min | Login broken, payments failing |
| P2 (Medium) | Partial functionality impacted | < 1 hour | Slow response times, minor features down |
| P3 (Low) | Minor issues | < 4 hours | UI bugs, non-critical features |

### Incident Response Workflow

#### 1. Detection

```bash
# Monitor alerts in #alerts channel
# Check Sentry for new issues
# Review monitoring dashboards
```

#### 2. Acknowledge

```bash
# Post in #incidents channel
# Example:
# "🚨 INCIDENT DETECTED - P1
# Issue: Users unable to login
# Started: 2024-01-15 14:30 UTC
# Investigating: @engineer"
```

#### 3. Assess

```bash
# Check service health
curl https://splittab.com/health

# Check logs
railway logs --service backend --environment production --tail 100

# Check error tracking
open https://sentry.io/organizations/splittab/issues/

# Check database
railway connect postgres --environment production
# Run: SELECT COUNT(*) FROM users;
```

#### 4. Mitigate

Common mitigation strategies:

- **Service Down**: Rollback to last known good version
- **Database Issues**: Scale up resources, optimize queries
- **High Traffic**: Scale horizontally, enable rate limiting
- **Memory Leak**: Restart service, investigate in staging

#### 5. Resolve

```bash
# Deploy fix
git commit -m "fix: resolve login issue"
git push origin main

# OR rollback
railway rollback dep_abc123 --service backend --environment production

# Verify resolution
curl https://splittab.com/health
```

#### 6. Communicate

```bash
# Update #incidents channel
# Example:
# "✅ INCIDENT RESOLVED - P1
# Issue: Users unable to login
# Root Cause: Database connection pool exhausted
# Fix: Increased connection pool size
# Duration: 23 minutes
# Post-mortem: [Link to doc]"
```

#### 7. Post-mortem

Create post-mortem document:

```markdown
# Incident Post-mortem: Login Service Outage

**Date:** 2024-01-15
**Duration:** 23 minutes
**Severity:** P1

## Summary
Users were unable to login due to database connection pool exhaustion.

## Timeline
- 14:30 UTC: Alerts triggered for login failures
- 14:32 UTC: Engineer acknowledged and began investigation
- 14:40 UTC: Root cause identified
- 14:45 UTC: Fix deployed
- 14:53 UTC: Service fully restored

## Root Cause
Database connection pool configured for 10 connections, but traffic spike required 50+ connections.

## Resolution
Increased connection pool to 50 connections and added monitoring.

## Action Items
- [ ] Add alerts for connection pool usage
- [ ] Implement auto-scaling for connection pools
- [ ] Load test with 10x expected traffic
```

---

## Common Issues and Solutions

### Issue: Service Health Check Failing

**Symptoms:**
- Health endpoint returns 500
- Load balancer marks service unhealthy

**Diagnosis:**
```bash
# Check service logs
railway logs --service backend --environment production --tail 50

# Check health endpoint directly
curl -v https://splittab.com/health

# Check database connectivity
railway connect postgres --environment production
```

**Solution:**
```bash
# If database issue - check connections
SELECT count(*) FROM pg_stat_activity;

# If memory issue - restart service
railway restart backend --environment production

# If persistent - rollback
railway rollback dep_abc123 --service backend --environment production
```

### Issue: High Error Rate

**Symptoms:**
- Sentry showing spike in errors
- Users reporting issues

**Diagnosis:**
```bash
# Check Sentry
open https://sentry.io/organizations/splittab/issues/

# Check logs for patterns
railway logs --service backend --environment production | grep ERROR

# Check specific endpoint
curl -X POST https://splittab.com/api/v1/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"description":"test","amount":100}'
```

**Solution:**
```bash
# If recent deployment - rollback
railway rollback --service backend

# If bad data - fix data
railway connect postgres --environment production
# Run fix query

# If code bug - deploy hotfix
git commit -m "hotfix: fix expense creation"
git tag v1.0.1
git push origin v1.0.1
```

### Issue: Slow Response Times

**Symptoms:**
- p95 latency > 2s
- Users reporting slow app

**Diagnosis:**
```bash
# Check slow queries
railway connect postgres --environment production

# Run:
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

# Check Redis performance
redis-cli --latency-history

# Check service resources
railway metrics --service backend --environment production
```

**Solution:**
```bash
# If database - optimize queries
CREATE INDEX CONCURRENTLY idx_expenses_user_id ON expenses(user_id);

# If memory - scale up
railway scale backend --memory 2048 --environment production

# If traffic - scale out
railway scale backend --replicas 4 --environment production

# If cache miss - warm up cache
npm run cache:warm
```

### Issue: Database Connection Pool Exhausted

**Symptoms:**
- Error: "Too many clients already"
- Connection timeouts

**Diagnosis:**
```bash
# Check active connections
railway connect postgres --environment production

SELECT count(*) FROM pg_stat_activity;
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

**Solution:**
```bash
# Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND state_change < NOW() - INTERVAL '5 minutes';

# Increase pool size (environment variable)
railway variables set DATABASE_POOL_MAX=50 --environment production

# Restart service
railway restart backend --environment production
```

### Issue: Redis Memory Full

**Symptoms:**
- Error: "OOM command not allowed"
- Cache misses increasing

**Diagnosis:**
```bash
# Check Redis memory
redis-cli INFO memory

# Check keys
redis-cli DBSIZE
redis-cli --bigkeys
```

**Solution:**
```bash
# Flush old keys
redis-cli FLUSHDB

# OR increase memory
railway scale redis --memory 1024 --environment production

# OR configure eviction policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Issue: OCR Queue Backlog

**Symptoms:**
- Receipt processing delayed
- Queue length increasing

**Diagnosis:**
```bash
# Check Bull queue
railway logs --service worker --environment production

# Check queue length (in application)
curl https://splittab.com/api/v1/admin/queue/stats
```

**Solution:**
```bash
# Scale worker service
railway scale worker --replicas 3 --environment production

# Increase concurrency (environment variable)
railway variables set OCR_QUEUE_CONCURRENCY=10 --environment production

# Drain queue (if needed)
curl -X POST https://splittab.com/api/v1/admin/queue/drain \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Database Operations

### Backup and Restore

**Create Manual Backup:**

```bash
# Railway
railway backup create --service postgres --environment production

# AWS RDS
aws rds create-db-snapshot \
  --db-instance-identifier splittab-prod \
  --db-snapshot-identifier manual-backup-$(date +%Y%m%d-%H%M%S)
```

**Restore from Backup:**

```bash
# Railway
railway backup list --service postgres
railway backup restore <backup-id> --environment production

# AWS RDS
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier splittab-prod-restored \
  --db-snapshot-identifier manual-backup-20240115-143000
```

### Database Maintenance

**Vacuum and Analyze:**

```bash
railway connect postgres --environment production

# Run maintenance
VACUUM ANALYZE;

# Or specific table
VACUUM ANALYZE users;
```

**Reindex:**

```bash
# Rebuild indexes
REINDEX TABLE users;
REINDEX DATABASE splittab_prod;
```

**Check Table Bloat:**

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS external_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

---

## Performance Troubleshooting

### Identify Slow Endpoints

```bash
# Check Sentry performance
open https://sentry.io/organizations/splittab/performance/

# Or check logs
railway logs --service backend | grep "response_time" | sort -k5 -rn | head -20
```

### Database Query Optimization

```sql
-- Enable query timing
\timing

-- Explain query
EXPLAIN ANALYZE
SELECT e.*, u.email
FROM expenses e
JOIN users u ON e.user_id = u.id
WHERE e.group_id = 'abc-123'
ORDER BY e.created_at DESC
LIMIT 20;

-- Add missing index
CREATE INDEX CONCURRENTLY idx_expenses_group_created
ON expenses(group_id, created_at DESC);
```

### Memory Profiling

```bash
# Check memory usage
railway metrics --service backend --environment production

# Take heap snapshot (development)
node --inspect dist/index.js
# Chrome DevTools -> Memory -> Take Heap Snapshot
```

### Load Testing

```bash
# Using Artillery
npm install -g artillery

# Create test scenario
cat > load-test.yml <<EOF
config:
  target: "https://staging.splittab.com"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Login flow"
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "test@example.com"
            password: "test123"
EOF

# Run test
artillery run load-test.yml
```

---

## Security Incidents

### Suspected Breach

**Immediate Actions:**

1. **Isolate**
   ```bash
   # Disable affected accounts
   railway connect postgres --environment production
   # UPDATE users SET status = 'suspended' WHERE id = 'user-id';
   ```

2. **Investigate**
   ```bash
   # Check access logs
   railway logs --service backend --environment production | grep "user-id"

   # Check Sentry for suspicious activity
   ```

3. **Notify**
   - Alert security team
   - Notify affected users
   - Prepare public statement if needed

4. **Remediate**
   ```bash
   # Force password reset
   UPDATE users SET password_reset_required = true;

   # Invalidate all sessions
   redis-cli FLUSHDB
   ```

### Leaked Secrets

**Immediate Actions:**

1. **Rotate Compromised Secrets**
   ```bash
   # Generate new secrets
   NEW_SECRET=$(openssl rand -hex 32)

   # Update in Railway
   railway variables set JWT_ACCESS_SECRET=$NEW_SECRET --environment production

   # Or AWS Secrets Manager
   aws secretsmanager update-secret \
     --secret-id prod/jwt-secret \
     --secret-string $NEW_SECRET
   ```

2. **Invalidate Sessions**
   ```bash
   # Clear Redis
   redis-cli FLUSHDB
   ```

3. **Deploy Updated Application**
   ```bash
   # Restart with new secrets
   railway restart backend --environment production
   ```

4. **Audit Access**
   ```bash
   # Check who accessed the secret
   # Review GitHub audit logs
   # Review cloud provider audit logs
   ```

---

## Maintenance Tasks

### Weekly Tasks

- [ ] Review error reports in Sentry
- [ ] Check database performance metrics
- [ ] Review slow query log
- [ ] Check backup status
- [ ] Review security alerts

### Monthly Tasks

- [ ] Update dependencies
- [ ] Review and optimize database indexes
- [ ] Analyze cost metrics
- [ ] Review and update documentation
- [ ] Test disaster recovery procedures

### Quarterly Tasks

- [ ] Security audit
- [ ] Performance review
- [ ] Capacity planning
- [ ] Review and update runbook
- [ ] Team training on incident response

### Dependency Updates

```bash
# Check outdated packages
cd backend
npm outdated

# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Run tests
npm test

# Deploy to staging
git commit -m "chore: update dependencies"
git push origin main
```

---

## Useful Scripts

### Health Check Script

```bash
#!/bin/bash
# health-check.sh

check_endpoint() {
  url=$1
  if curl -f -s "$url" > /dev/null; then
    echo "✅ $url is healthy"
    return 0
  else
    echo "❌ $url is down"
    return 1
  fi
}

check_endpoint "https://splittab.com/health"
check_endpoint "https://splittab.com/api/v1/health/db"
check_endpoint "https://splittab.com/api/v1/health/redis"
```

### Log Analysis Script

```bash
#!/bin/bash
# analyze-errors.sh

railway logs --service backend --environment production --since 1h \
  | grep ERROR \
  | cut -d' ' -f5- \
  | sort | uniq -c | sort -rn \
  | head -20
```

### Database Stats Script

```bash
#!/bin/bash
# db-stats.sh

railway connect postgres --environment production <<EOF
\timing
SELECT 'Total Users:' as metric, count(*) as value FROM users
UNION ALL
SELECT 'Total Expenses:', count(*) FROM expenses
UNION ALL
SELECT 'Total Groups:', count(*) FROM groups
UNION ALL
SELECT 'Database Size:', pg_size_pretty(pg_database_size('splittab_prod'));
EOF
```

---

## Additional Resources

- [Infrastructure Setup](./INFRASTRUCTURE_SETUP.md)
- [Database Migrations](./DATABASE_MIGRATIONS.md)
- [Third Party Services](./THIRD_PARTY_SERVICES.md)
- [Railway Documentation](https://docs.railway.app)
- [AWS Documentation](https://docs.aws.amazon.com)
- [Sentry Documentation](https://docs.sentry.io)

---

**Last Updated:** November 2025
**Maintained by:** SplitTab DevOps Team
**On-call Rotation:** [Link to PagerDuty schedule]
