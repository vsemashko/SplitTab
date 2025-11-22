# Infrastructure Setup Guide

This guide provides step-by-step instructions for deploying SplitTab to production infrastructure.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Railway Deployment (Recommended)](#railway-deployment-recommended)
3. [AWS Deployment (Alternative)](#aws-deployment-alternative)
4. [Database Setup](#database-setup)
5. [Redis Setup](#redis-setup)
6. [Environment Variables](#environment-variables)
7. [Domain and SSL Setup](#domain-and-ssl-setup)
8. [Monitoring and Observability](#monitoring-and-observability)
9. [Scaling Configuration](#scaling-configuration)
10. [Disaster Recovery](#disaster-recovery)

---

## Prerequisites

Before starting, ensure you have:

- [ ] GitHub repository with SplitTab code
- [ ] Domain name (e.g., splittab.com)
- [ ] Cloud provider account (Railway or AWS)
- [ ] Third-party service accounts (Google Cloud, SendGrid, etc.)
- [ ] SSL certificate (or use Let's Encrypt)
- [ ] Command line tools: `git`, `docker`, `railway` or `aws-cli`

---

## Railway Deployment (Recommended)

Railway provides the simplest deployment path for SplitTab with minimal configuration.

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up using your GitHub account
3. Verify your email address
4. Add payment method (required for production)

### Step 2: Create New Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init
```

### Step 3: Provision Database

1. In Railway dashboard, click "New" → "Database" → "PostgreSQL"
2. Railway will automatically provision a PostgreSQL database
3. Note the connection string from the "Connect" tab

```bash
# Get database URL
railway variables

# Should show:
# DATABASE_URL=postgresql://user:pass@host:port/dbname
```

### Step 4: Provision Redis

1. Click "New" → "Database" → "Redis"
2. Railway will provision a Redis instance
3. Note the connection string

```bash
# Redis URL will be automatically added
# REDIS_URL=redis://default:pass@host:port
```

### Step 5: Deploy Backend Service

1. Create `railway.json` in the backend directory:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 2,
    "startCommand": "node dist/index.js",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

2. Deploy the backend:

```bash
cd backend
railway up
```

### Step 6: Deploy Worker Service

1. Create a new service for the OCR worker
2. Use the same codebase but different start command

```bash
# In Railway dashboard
# Service: worker
# Start Command: node dist/workers/ocr.worker.js
```

### Step 7: Configure Environment Variables

In Railway dashboard, go to Variables and add:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# JWT Secrets (generate strong secrets)
JWT_ACCESS_SECRET=<generate-32-char-random-string>
JWT_REFRESH_SECRET=<generate-32-char-random-string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# CORS
ALLOWED_ORIGINS=https://splittab.com,https://www.splittab.com

# See THIRD_PARTY_SERVICES.md for these values
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
SENTRY_DSN=...
```

### Step 8: Setup Custom Domain

1. In Railway, go to Settings → Domains
2. Click "Custom Domain"
3. Add your domain: `api.splittab.com`
4. Update DNS records with provided values:

```
Type: CNAME
Name: api
Value: <railway-provided-domain>
```

5. SSL certificate will be automatically provisioned

### Step 9: Enable Deployment Protection

1. Go to Settings → Deployments
2. Enable:
   - [ ] Health check monitoring
   - [ ] Auto-deploy from main branch
   - [ ] Deployment notifications

### Railway Deployment Checklist

- [ ] PostgreSQL database provisioned
- [ ] Redis instance provisioned
- [ ] Backend service deployed
- [ ] Worker service deployed
- [ ] Environment variables configured
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Health checks passing
- [ ] Auto-scaling configured

---

## AWS Deployment (Alternative)

For more control and flexibility, deploy to AWS using ECS, RDS, and ElastiCache.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Route 53 (DNS)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Application Load Balancer (ALB)                │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                  │
┌───────▼────────┐                ┌──────▼────────┐
│   ECS Service  │                │  ECS Service  │
│   (Backend)    │                │   (Worker)    │
│   Fargate      │                │   Fargate     │
└───────┬────────┘                └──────┬────────┘
        │                                 │
        └─────────────┬───────────────────┘
                      │
        ┌─────────────┴──────────────┐
        │                            │
┌───────▼────────┐          ┌───────▼────────┐
│   RDS          │          │  ElastiCache   │
│   PostgreSQL   │          │  Redis         │
└────────────────┘          └────────────────┘
```

### Step 1: Setup VPC and Networking

```bash
# Create VPC
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=splittab-vpc}]'

# Create subnets (public and private)
aws ec2 create-subnet \
  --vpc-id vpc-xxxxx \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=splittab-public-1a}]'

aws ec2 create-subnet \
  --vpc-id vpc-xxxxx \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=splittab-public-1b}]'

# Create Internet Gateway
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=splittab-igw}]'

aws ec2 attach-internet-gateway \
  --vpc-id vpc-xxxxx \
  --internet-gateway-id igw-xxxxx
```

### Step 2: Setup RDS PostgreSQL

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name splittab-db-subnet \
  --db-subnet-group-description "SplitTab database subnet group" \
  --subnet-ids subnet-xxxxx subnet-yyyyy

# Create security group for RDS
aws ec2 create-security-group \
  --group-name splittab-db-sg \
  --description "Security group for SplitTab RDS" \
  --vpc-id vpc-xxxxx

# Allow PostgreSQL traffic
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 5432 \
  --source-group sg-yyyyy  # ECS security group

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier splittab-prod \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username splittab_admin \
  --master-user-password <strong-password> \
  --allocated-storage 100 \
  --storage-type gp3 \
  --storage-encrypted \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name splittab-db-subnet \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --multi-az \
  --publicly-accessible false \
  --auto-minor-version-upgrade true \
  --db-name splittab_prod
```

### Step 3: Setup ElastiCache Redis

```bash
# Create cache subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name splittab-redis-subnet \
  --cache-subnet-group-description "SplitTab Redis subnet group" \
  --subnet-ids subnet-xxxxx subnet-yyyyy

# Create security group for Redis
aws ec2 create-security-group \
  --group-name splittab-redis-sg \
  --description "Security group for SplitTab Redis" \
  --vpc-id vpc-xxxxx

# Allow Redis traffic
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 6379 \
  --source-group sg-yyyyy  # ECS security group

# Create Redis cluster
aws elasticache create-replication-group \
  --replication-group-id splittab-redis-prod \
  --replication-group-description "SplitTab production Redis" \
  --engine redis \
  --engine-version 7.0 \
  --cache-node-type cache.t3.medium \
  --num-cache-clusters 2 \
  --automatic-failover-enabled \
  --multi-az-enabled \
  --cache-subnet-group-name splittab-redis-subnet \
  --security-group-ids sg-xxxxx \
  --at-rest-encryption-enabled \
  --transit-encryption-enabled \
  --snapshot-retention-limit 7 \
  --snapshot-window "03:00-05:00"
```

### Step 4: Setup ECR for Docker Images

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name splittab/backend \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256

# Get login credentials
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push image
docker build -t splittab/backend:latest ./backend
docker tag splittab/backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/splittab/backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/splittab/backend:latest
```

### Step 5: Setup ECS Cluster

```bash
# Create ECS cluster
aws ecs create-cluster \
  --cluster-name splittab-production \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy \
    capacityProvider=FARGATE,weight=1 \
    capacityProvider=FARGATE_SPOT,weight=4

# Create task execution role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://task-execution-assume-role.json

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```

### Step 6: Create ECS Task Definition

Create `task-definition.json`:

```json
{
  "family": "splittab-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/splittab/backend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:region:account:secret:prod/database-url"},
        {"name": "REDIS_URL", "valueFrom": "arn:aws:secretsmanager:region:account:secret:prod/redis-url"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/splittab-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

Register task definition:

```bash
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json
```

### Step 7: Create Application Load Balancer

```bash
# Create security group for ALB
aws ec2 create-security-group \
  --group-name splittab-alb-sg \
  --description "Security group for SplitTab ALB" \
  --vpc-id vpc-xxxxx

# Allow HTTP and HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Create ALB
aws elbv2 create-load-balancer \
  --name splittab-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4

# Create target group
aws elbv2 create-target-group \
  --name splittab-backend-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxx \
  --target-type ip \
  --health-check-enabled \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

### Step 8: Create ECS Service

```bash
# Create service
aws ecs create-service \
  --cluster splittab-production \
  --service-name backend \
  --task-definition splittab-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-xxxxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=3000" \
  --health-check-grace-period-seconds 60 \
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100,deploymentCircuitBreaker={enable=true,rollback=true}" \
  --enable-execute-command
```

### AWS Deployment Checklist

- [ ] VPC and networking configured
- [ ] RDS PostgreSQL database created
- [ ] ElastiCache Redis cluster created
- [ ] ECR repository created
- [ ] Docker images built and pushed
- [ ] ECS cluster created
- [ ] Task definitions registered
- [ ] Application Load Balancer configured
- [ ] ECS services running
- [ ] Auto-scaling configured
- [ ] CloudWatch monitoring enabled
- [ ] Route 53 DNS configured
- [ ] SSL certificate installed

---

## Database Setup

### Initial Database Configuration

```bash
# Run migrations
cd backend
npx prisma migrate deploy

# Verify schema
npx prisma db pull
npx prisma validate

# (Optional) Seed initial data
npx prisma db seed
```

### Database Optimization

```sql
-- Enable connection pooling
ALTER SYSTEM SET max_connections = 100;

-- Configure work memory
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET shared_buffers = '256MB';

-- Enable query planning
ALTER SYSTEM SET effective_cache_size = '1GB';

-- Reload configuration
SELECT pg_reload_conf();

-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_phone ON users(phone_number);
CREATE INDEX CONCURRENTLY idx_expenses_group ON expenses(group_id);
CREATE INDEX CONCURRENTLY idx_settlements_from_to ON settlements(from_user_id, to_user_id);
```

---

## Redis Setup

### Redis Configuration

```bash
# For Railway/managed Redis, configuration is automatic

# For self-hosted Redis, add to redis.conf:
maxmemory 512mb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
```

### Redis Monitoring

```bash
# Monitor Redis performance
redis-cli INFO stats
redis-cli INFO memory
redis-cli SLOWLOG GET 10
```

---

## Environment Variables

### Production Environment Variables

```env
# Application
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:password@host:5432/splittab_prod
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://default:password@host:6379
REDIS_TLS=true

# JWT Configuration
JWT_ACCESS_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-random-string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# CORS
ALLOWED_ORIGINS=https://splittab.com,https://www.splittab.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=splittab-prod-uploads

# OCR Services
OCR_PROVIDER=google
GOOGLE_CLOUD_PROJECT_ID=splittab-prod
GOOGLE_APPLICATION_CREDENTIALS=/app/google-credentials.json
AWS_TEXTRACT_REGION=us-east-1
OCR_CONFIDENCE_THRESHOLD=0.85

# OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxx
APPLE_CLIENT_ID=com.splittab.app
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_KEY_ID=XXXXXXXXXX

# Email (SendGrid)
EMAIL_FROM=noreply@splittab.com
EMAIL_API_KEY=SG.xxxxxxxxxxxxxx

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Logging
LOG_LEVEL=info
```

### Generating Secure Secrets

```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate API keys
openssl rand -hex 32
```

---

## Domain and SSL Setup

### DNS Configuration

Add these DNS records:

```
# A records (if using static IP)
Type: A
Name: api.splittab.com
Value: <load-balancer-ip>
TTL: 300

# CNAME records (for Railway/managed services)
Type: CNAME
Name: api
Value: <provided-domain>.railway.app
TTL: 300

# CAA records (for SSL)
Type: CAA
Name: @
Value: 0 issue "letsencrypt.org"
TTL: 3600
```

### SSL Certificate (Let's Encrypt)

```bash
# Using Certbot
sudo certbot certonly --standalone -d api.splittab.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Monitoring and Observability

### CloudWatch (AWS) Setup

```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/splittab-backend

# Create custom metrics
aws cloudwatch put-metric-alarm \
  --alarm-name splittab-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

### Sentry Integration

```typescript
// Already configured in backend/src/index.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

---

## Scaling Configuration

### Auto-scaling for Railway

Railway automatically scales based on load. Configure in `railway.json`:

```json
{
  "deploy": {
    "numReplicas": 2,
    "scalingRules": {
      "minReplicas": 2,
      "maxReplicas": 10,
      "cpuThreshold": 70,
      "memoryThreshold": 80
    }
  }
}
```

### Auto-scaling for AWS ECS

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/splittab-production/backend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# CPU-based scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/splittab-production/backend \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://cpu-scaling-policy.json
```

---

## Disaster Recovery

### Backup Strategy

1. **Database Backups**
   - Automated daily backups (Railway/RDS)
   - 30-day retention
   - Point-in-time recovery enabled

2. **Application State**
   - Docker images stored in ECR/GHCR
   - Configuration in GitHub
   - Secrets in AWS Secrets Manager

3. **File Storage**
   - S3 versioning enabled
   - Cross-region replication configured

### Recovery Procedures

See [RUNBOOK.md](./RUNBOOK.md) for detailed disaster recovery procedures.

---

## Cost Optimization

### Railway Costs (Estimated)

- Database (PostgreSQL): $15-30/month
- Redis: $10-20/month
- Backend services: $25-50/month
- **Total: ~$50-100/month**

### AWS Costs (Estimated)

- RDS (db.t3.medium): $60/month
- ElastiCache (cache.t3.medium): $40/month
- ECS Fargate: $50-100/month
- ALB: $20/month
- Data transfer: $10-30/month
- **Total: ~$180-250/month**

---

## Support and Troubleshooting

For issues:
1. Check [RUNBOOK.md](./RUNBOOK.md) for common problems
2. Review application logs
3. Check service health dashboards
4. Contact DevOps team

---

**Last Updated:** November 2025
**Maintained by:** SplitTab DevOps Team
