# Performance Testing with k6

This directory contains k6 performance test scripts for the SplitTab API.

## Prerequisites

Install k6:

```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows (with Chocolatey)
choco install k6

# Or download from: https://k6.io/docs/getting-started/installation/
```

## Test Scripts

### 1. Load Test (`load-test.js`)

**Purpose**: Test system performance under expected load

**Scenario**:
- Ramp up from 0 to 200 concurrent users
- Maintain load for 5 minutes
- Test all major endpoints

**Run**:
```bash
# Against local
k6 run load-test.js

# Against staging
k6 run --env API_URL=https://api-staging.splittab.com load-test.js

# With results output
k6 run --out json=results.json load-test.js
```

**Thresholds**:
- p95 response time < 500ms
- p99 response time < 1000ms
- Error rate < 1%

---

### 2. Spike Test (`spike-test.js`)

**Purpose**: Test system recovery from sudden traffic spikes

**Scenario**:
- Normal load: 100 users
- Sudden spike to 1000 users
- Return to normal
- Measure recovery time

**Run**:
```bash
k6 run spike-test.js
```

**Thresholds**:
- p95 response time < 2000ms (during spike)
- Error rate < 5% (during spike)
- System recovers within 1 minute

---

### 3. Stress Test (`stress-test.js`)

**Purpose**: Find the breaking point of the system

**Scenario**:
- Gradually increase load: 100 → 600 users
- Identify maximum capacity
- Test graceful degradation

**Run**:
```bash
k6 run stress-test.js
```

**Goals**:
- Identify max concurrent users
- Observe system behavior at limits
- Verify graceful degradation

---

### 4. Soak Test (`soak-test.js`)

**Purpose**: Test system stability over extended period

**Scenario**:
- Maintain 100 users for 2 hours
- Detect memory leaks
- Monitor performance degradation

**Run**:
```bash
k6 run soak-test.js
```

**Monitor**:
- Memory usage (should stay stable)
- Response times (should not degrade)
- Error rates (should stay < 1%)

---

## Running Tests

### Basic Usage

```bash
# Local environment
k6 run load-test.js

# Staging environment
k6 run --env API_URL=https://api-staging.splittab.com load-test.js

# Production (be careful!)
k6 run --env API_URL=https://api.splittab.com load-test.js
```

### Advanced Options

```bash
# Custom number of users
k6 run --vus 50 --duration 30s load-test.js

# Output results to file
k6 run --out json=results.json load-test.js

# With summary
k6 run --summary-export=summary.json load-test.js

# Cloud execution (requires k6 cloud account)
k6 cloud load-test.js
```

## Analyzing Results

### View Results

```bash
# Real-time terminal output shows:
- Active VUs (virtual users)
- Response times (min, avg, max, p95, p99)
- Request rate
- Error rate
- Threshold pass/fail status
```

### Generate HTML Report

```bash
# Run test with JSON output
k6 run --out json=results.json load-test.js

# Convert to HTML (using k6-reporter or custom tool)
# Install: npm install -g k6-reporter
k6-reporter results.json
```

### Key Metrics to Monitor

1. **Response Time**
   - p95 < 500ms (95th percentile)
   - p99 < 1000ms (99th percentile)
   - max should not exceed 5000ms

2. **Throughput**
   - Requests per second
   - Should scale linearly with users (up to capacity)

3. **Error Rate**
   - Target: < 1%
   - Any 5xx errors are critical

4. **System Resources** (monitor separately)
   - CPU usage < 80%
   - Memory usage stable (no leaks)
   - Database connections < 90% of pool

## Performance Benchmarks

### Expected Results

| Test Type | Users | Duration | p95 Target | Error Rate |
|-----------|-------|----------|------------|------------|
| Load | 200 | 15 min | < 500ms | < 1% |
| Spike | 1000 peak | 5 min | < 2000ms | < 5% |
| Stress | 600 | 20 min | < 1500ms | < 10% |
| Soak | 100 | 2 hours | < 500ms | < 1% |

### API Endpoint Targets

| Endpoint | p95 Target | Notes |
|----------|------------|-------|
| GET /health | < 50ms | Health check |
| POST /auth/login | < 1000ms | Includes bcrypt |
| POST /auth/register | < 1200ms | Includes bcrypt + email |
| GET /expenses | < 300ms | List view |
| POST /expenses | < 800ms | Includes calculations |
| GET /settlements/suggestions | < 500ms | Complex algorithm |

## Troubleshooting

### High Error Rates

```bash
# Check error details
k6 run --http-debug load-test.js

# Common causes:
- Database connection pool exhausted
- Rate limiting triggered
- Authentication failures
- Server capacity exceeded
```

### Slow Response Times

```bash
# Profile specific endpoints
k6 run --tag endpoint=expenses load-test.js

# Check:
- Database query performance
- Missing indexes
- N+1 query problems
- Large payload sizes
```

### Memory Issues

```bash
# Run soak test and monitor:
docker stats  # If using Docker

# Check for:
- Memory leaks (gradually increasing)
- Connection leaks (unclosed DB connections)
- Cache not being cleared
```

## CI/CD Integration

Add to `.github/workflows/performance.yml`:

```yaml
name: Performance Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run load test
        run: |
          k6 run --env API_URL=${{ secrets.STAGING_API_URL }} \
                 --out json=results.json \
                 performance-tests/load-test.js

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: k6-results
          path: results.json
```

## Best Practices

1. **Start Small**: Begin with load test before spike/stress tests
2. **Staging First**: Always test on staging before production
3. **Monitor Everything**: Watch server metrics during tests
4. **Baseline**: Establish baseline performance before changes
5. **Isolate**: Test one thing at a time
6. **Real Data**: Use production-like data volumes
7. **Cleanup**: Clean up test data after tests

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- [Performance Testing Guide](https://k6.io/docs/test-types/introduction/)
- [k6 Cloud](https://k6.io/cloud/)

## Support

For issues or questions:
- Check logs: `k6 run --http-debug test.js`
- k6 Community: https://community.k6.io/
- Documentation: https://k6.io/docs/
