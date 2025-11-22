# 🚀 SplitTab Deployment Guide

**Quick Start to Production**

This guide explains how to deploy SplitTab with flexible configuration options, allowing you to start with minimal features and scale up as needed.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Deployment Options](#deployment-options)
- [Feature Flags](#feature-flags)
- [Quick Deploy Scenarios](#quick-deploy-scenarios)
- [Step-by-Step Deployment](#step-by-step-deployment)
- [Third-Party Services](#third-party-services)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

SplitTab is designed with **optional features** that you can enable/disable based on your deployment needs. This allows you to:

- **Start Simple**: Deploy with minimal third-party dependencies
- **Reduce Costs**: Disable expensive features initially
- **Scale Gradually**: Add features as your user base grows

### What's Required (Cannot Disable)
- PostgreSQL database
- Redis (for sessions)
- Backend API server
- Web/iOS frontend

### What's Optional (Can Disable)
- Receipt OCR processing
- Email notifications
- Real-time WebSocket updates
- Background job processing
- OAuth authentication
- Push notifications
- AWS S3 file storage
- Error tracking (Sentry)

---

## 🎛️ Feature Flags

All optional features are controlled via environment variables in the backend `.env` file.

### Available Feature Flags

| Feature Flag | Default | Cost Impact | Description |
|--------------|---------|-------------|-------------|
| `ENABLE_OCR` | `false` | 💰💰💰 High | Receipt OCR with Google Cloud/AWS |
| `ENABLE_EMAIL_NOTIFICATIONS` | `false` | 💰 Low | Password reset & notification emails |
| `ENABLE_REALTIME_UPDATES` | `true` | 💰 Minimal | WebSocket real-time updates |
| `ENABLE_BACKGROUND_JOBS` | `false` | 💰 Minimal | Bull queue for async processing |
| `ENABLE_PUSH_NOTIFICATIONS` | `false` | Free | Mobile push notifications |
| `ENABLE_GOOGLE_OAUTH` | `false` | Free | Google Sign-In |
| `ENABLE_APPLE_SIGNIN` | `false` | $99/year | Apple Sign-In |
| `ENABLE_SENTRY` | `false` | Free tier | Error tracking & monitoring |
| `FILE_STORAGE_PROVIDER` | `local` | 💰 Low | `s3` or `local` file storage |

### How to Configure

Edit your `backend/.env` file:

```env
# Minimal deployment (lowest cost)
ENABLE_OCR=false
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_REALTIME_UPDATES=false
ENABLE_BACKGROUND_JOBS=false
FILE_STORAGE_PROVIDER=local

# Full-featured deployment
ENABLE_OCR=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_REALTIME_UPDATES=true
ENABLE_BACKGROUND_JOBS=true
FILE_STORAGE_PROVIDER=s3
```

---

## 🚀 Quick Deploy Scenarios

### Scenario A: Minimal Deployment (Fastest, Cheapest)

**Use Case**: Get to production ASAP with minimal setup
**Monthly Cost**: ~$50-60
**Setup Time**: 1-2 hours

**Configuration**:
```env
ENABLE_OCR=false
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_REALTIME_UPDATES=false
ENABLE_BACKGROUND_JOBS=false
ENABLE_GOOGLE_OAUTH=false
ENABLE_APPLE_SIGNIN=false
ENABLE_SENTRY=false
FILE_STORAGE_PROVIDER=local
```

**Required Services**:
- ✅ Railway (PostgreSQL + Redis + Backend): $50-60/month
- ✅ Vercel (Web): Free

**What Works**:
- ✅ Email/password authentication
- ✅ All expense tracking features
- ✅ Group management
- ✅ Settlement tracking
- ✅ Receipt upload (no OCR)
- ✅ All analytics

**What Doesn't Work**:
- ❌ OAuth login
- ❌ Automatic receipt text extraction
- ❌ Email notifications
- ❌ Real-time updates (must refresh)
- ❌ Password reset emails

---

### Scenario B: Recommended Deployment (Balanced)

**Use Case**: Production-ready with good UX
**Monthly Cost**: ~$80-110
**Setup Time**: 3-5 hours

**Configuration**:
```env
ENABLE_OCR=false  # Add later when you have budget
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_REALTIME_UPDATES=true
ENABLE_BACKGROUND_JOBS=false  # Not needed without OCR
ENABLE_GOOGLE_OAUTH=true
ENABLE_APPLE_SIGNIN=false  # Add when publishing to App Store
ENABLE_SENTRY=true
FILE_STORAGE_PROVIDER=s3
```

**Required Services**:
- ✅ Railway (PostgreSQL + Redis + Backend): $50-60/month
- ✅ Vercel (Web): Free
- ✅ SendGrid (Email): Free tier or $20/month
- ✅ AWS S3 (File storage): $5-10/month
- ✅ Google Cloud (OAuth only): Free
- ✅ Sentry (Errors): Free tier

**What Works**:
- ✅ Email/password authentication
- ✅ Google OAuth login
- ✅ All expense features
- ✅ Receipt upload (no OCR)
- ✅ Email notifications
- ✅ Real-time updates
- ✅ Password reset
- ✅ Error tracking

**What Doesn't Work**:
- ❌ Automatic receipt OCR
- ❌ Apple Sign-In
- ❌ Push notifications

---

### Scenario C: Full-Featured Deployment

**Use Case**: Complete experience, ready to scale
**Monthly Cost**: ~$130-190
**Setup Time**: 1 day

**Configuration**:
```env
ENABLE_OCR=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_REALTIME_UPDATES=true
ENABLE_BACKGROUND_JOBS=true
ENABLE_GOOGLE_OAUTH=true
ENABLE_APPLE_SIGNIN=true
ENABLE_SENTRY=true
FILE_STORAGE_PROVIDER=s3
```

**Required Services**:
- ✅ Railway (scaled up): $100-130/month
- ✅ Vercel (Web): Free
- ✅ SendGrid (Email): $20/month
- ✅ AWS S3 (Storage): $10-20/month
- ✅ Google Cloud (OAuth + OCR): $20-40/month
- ✅ AWS Textract (OCR backup): Pay-per-use
- ✅ Apple Developer: $99/year
- ✅ Sentry: Free tier

**Everything Works** ✅

---

## 📝 Step-by-Step Deployment

### Prerequisites

- GitHub account
- Railway account (or AWS/other cloud)
- Vercel account
- Apple Developer account (for iOS)

### Step 1: Prepare Environment Variables

1. **Copy example file**:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Generate secrets**:
   ```bash
   # JWT secrets (REQUIRED)
   openssl rand -base64 32  # Copy to JWT_ACCESS_SECRET
   openssl rand -base64 32  # Copy to JWT_REFRESH_SECRET
   ```

3. **Choose your deployment scenario** (A, B, or C above)

4. **Configure feature flags** based on chosen scenario

### Step 2: Set Up Third-Party Services

Based on your chosen scenario, set up only the required services:

#### Required for All Scenarios:
- None! Railway provides PostgreSQL and Redis.

#### If `ENABLE_EMAIL_NOTIFICATIONS=true`:

**Option A: SendGrid (Recommended)**
1. Go to [sendgrid.com](https://sendgrid.com)
2. Create account (free tier: 100 emails/day)
3. Create API key
4. Add to `.env`:
   ```env
   EMAIL_API_KEY=SG.your-key-here
   EMAIL_FROM=noreply@yourdomain.com
   ```

**Option B: Resend**
1. Go to [resend.com](https://resend.com)
2. Create account
3. Add domain
4. Create API key
5. Add to `.env` (same as above)

#### If `ENABLE_GOOGLE_OAUTH=true`:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/v1/auth/google/callback` (dev)
   - `https://your-domain.com/api/v1/auth/google/callback` (prod)
6. Copy credentials to `.env`:
   ```env
   GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-secret
   ```

#### If `FILE_STORAGE_PROVIDER=s3`:

1. Go to [AWS Console](https://console.aws.amazon.com)
2. Create S3 bucket (e.g., `splittab-receipts`)
3. Configure CORS:
   ```json
   [{
     "AllowedOrigins": ["*"],
     "AllowedMethods": ["GET", "PUT", "POST"],
     "AllowedHeaders": ["*"]
   }]
   ```
4. Create IAM user with S3 access
5. Generate access key
6. Add to `.env`:
   ```env
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_S3_BUCKET=splittab-receipts
   AWS_REGION=us-east-1
   ```

#### If `ENABLE_OCR=true`:

**Google Cloud Vision**:
1. Enable Cloud Vision API in Google Cloud Console
2. Create service account
3. Download JSON credentials
4. Add to `.env`:
   ```env
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS=./google-cloud-credentials.json
   OCR_PROVIDER=google
   ```

**AWS Textract** (optional backup):
1. Use same AWS credentials from S3 setup
2. Ensure IAM user has Textract permissions
3. Set in `.env`:
   ```env
   OCR_PROVIDER=both  # Use both Google and AWS
   ```

#### If `ENABLE_SENTRY=true`:

1. Go to [sentry.io](https://sentry.io)
2. Create account (free: 10k events/month)
3. Create new project
4. Copy DSN
5. Add to `.env`:
   ```env
   SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   ```

### Step 3: Deploy Backend to Railway

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**:
   ```bash
   railway login
   ```

3. **Create project**:
   ```bash
   railway init
   ```

4. **Add services**:
   ```bash
   railway add postgresql
   railway add redis
   ```

5. **Set environment variables**:
   ```bash
   # Copy all from your .env file
   railway variables set NODE_ENV=production
   railway variables set PORT=3000
   railway variables set DATABASE_URL=$(railway variables get DATABASE_URL)
   railway variables set REDIS_URL=$(railway variables get REDIS_URL)
   # ... copy all other variables from your .env
   ```

6. **Deploy**:
   ```bash
   cd backend
   railway up
   ```

7. **Run migrations**:
   ```bash
   railway run npx prisma migrate deploy
   railway run npx prisma generate
   ```

8. **Get your backend URL**:
   ```bash
   railway domain
   # Output: https://your-app.railway.app
   ```

### Step 4: Deploy Web to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd web
   vercel --prod
   ```

4. **Set environment variables in Vercel dashboard**:
   - `NEXT_PUBLIC_API_URL`: Your Railway backend URL
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: (if OAuth enabled)

5. **Test**:
   Open your Vercel URL and test the app

### Step 5: Deploy iOS to TestFlight

1. **Open Xcode**:
   ```bash
   cd ios
   open SplitTab.xcodeproj
   ```

2. **Update configuration**:
   - Set your Team in Signing & Capabilities
   - Update bundle identifier
   - Set version to 1.0.0
   - Update API URL in `Utilities/AppConfig.swift`:
     ```swift
     static var apiHost: String {
         #if DEBUG
         return "localhost:3000"
         #else
         return "your-app.railway.app"  // Your Railway URL
         #endif
     }
     ```

3. **Archive and upload**:
   - Product → Archive
   - Distribute App → App Store Connect
   - Upload to TestFlight

4. **Submit for review** (internal testing)

---

## 🔧 Troubleshooting

### Backend won't start

**Check feature flag configuration**:
```bash
railway logs
```

Look for warnings like:
- ❌ "OCR is enabled but GOOGLE_CLOUD_PROJECT_ID is not configured"
- ❌ "Email notifications are enabled but EMAIL_API_KEY is not configured"

**Solution**: Either configure the service or disable the feature flag.

### Web app can't connect to API

1. Check `NEXT_PUBLIC_API_URL` in Vercel dashboard
2. Ensure CORS is configured in backend `.env`:
   ```env
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
   ```
3. Check Railway logs for errors

### Receipt upload works but no OCR

This is expected if:
- `ENABLE_OCR=false` (by design)
- `ENABLE_BACKGROUND_JOBS=false` (OCR requires background jobs)
- Google Cloud or AWS not configured

Check backend logs for:
- ✅ "OCR disabled - skipping for receipt: xxx"
- ✅ "Background jobs disabled - OCR not available"

### Email notifications not sending

1. Check `ENABLE_EMAIL_NOTIFICATIONS=true`
2. Verify `EMAIL_API_KEY` is set
3. Check SendGrid/Resend dashboard for errors
4. Test API key:
   ```bash
   curl -X POST https://api.sendgrid.com/v3/mail/send \
     -H "Authorization: Bearer $EMAIL_API_KEY" \
     -H "Content-Type: application/json"
   ```

---

## 📊 Cost Breakdown by Scenario

### Minimal (Scenario A)
- Railway: $50-60/month
- **Total: $50-60/month**

### Recommended (Scenario B)
- Railway: $50-60/month
- SendGrid: $0-20/month
- AWS S3: $5-10/month
- **Total: $55-90/month**

### Full-Featured (Scenario C)
- Railway: $100-130/month
- SendGrid: $20/month
- AWS S3: $10-20/month
- Google Cloud: $20-40/month
- Apple Developer: $99/year (~$8/month)
- **Total: $158-218/month**

---

## 🎯 Quick Reference

### Enable Feature
```env
ENABLE_OCR=true
```

### Disable Feature
```env
ENABLE_OCR=false
```

### Check Feature Status
Look for this in backend startup logs:
```
🎯 Feature Flags Configuration:
  OCR Processing: ✅ Enabled
  Email Notifications: ❌ Disabled
  Real-time Updates: ✅ Enabled
  ...
```

### Validate Configuration
Backend will log warnings on startup if features are enabled but not configured properly.

---

## 🚀 Quick Start Commands

```bash
# Backend (Railway)
railway login
railway init
railway add postgresql redis
railway up
railway run npx prisma migrate deploy

# Web (Vercel)
vercel login
cd web
vercel --prod

# iOS (Xcode)
cd ios
open SplitTab.xcodeproj
# Product → Archive → Distribute
```

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [SendGrid API](https://docs.sendgrid.com)
- [Google Cloud Vision](https://cloud.google.com/vision/docs)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3)
- [Sentry Documentation](https://docs.sentry.io)

---

**Need Help?**
- Email: support@splittab.com
- Docs: /home/user/SplitTab/docs/
- Issues: GitHub Issues

**Last Updated**: 2025-11-22
