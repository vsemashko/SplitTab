# 🚀 SplitTab Deployment Guide
**Version**: 1.0
**Last Updated**: 2025-11-22
**Status**: Ready for Production Deployment

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Google Cloud Platform account
- [ ] Apple Developer account ($99/year)
- [ ] Railway or AWS account
- [ ] Vercel account (free tier)
- [ ] SendGrid or Resend account
- [ ] AWS account (for S3)
- [ ] Sentry.io account (free tier)
- [ ] Domain name (optional but recommended)

**Estimated Setup Time**: 6-8 hours
**Monthly Cost**: $60-130

---

## 🎯 Quick Start (30-Minute Path)

If you want to get running ASAP, follow this minimal path:

### 1. Railway Deployment (15 min)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# From project root
cd backend
railway init

# Add services
railway add postgresql redis

# Deploy
railway up
```

### 2. Set Critical Environment Variables (10 min)
```bash
# Generate secure secrets
railway variables set JWT_ACCESS_SECRET=$(openssl rand -base64 32)
railway variables set JWT_REFRESH_SECRET=$(openssl rand -base64 32)
railway variables set NODE_ENV=production

# Set database URL (auto-populated by Railway)
# Railway automatically sets DATABASE_URL from PostgreSQL service
```

### 3. Run Migrations (5 min)
```bash
railway run npx prisma migrate deploy
```

✅ **You now have a working backend API!**

Visit: `https://your-app.railway.app/api/v1/health`

---

## 📖 Complete Deployment Guide

### Phase 1: Third-Party Service Setup (Day 1)

#### 1.1 Google Cloud Platform (~2 hours)

**Step 1: Create Project**
1. Go to https://console.cloud.google.com
2. Click "Create Project"
3. Name: `splittab-prod`
4. Click "Create"

**Step 2: Enable APIs**
1. Navigate to "APIs & Services" → "Library"
2. Search and enable:
   - Google+ API (for OAuth)
   - Cloud Vision API (for OCR)

**Step 3: Create OAuth Credentials**
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Configure consent screen:
   - User Type: External
   - App name: SplitTab
   - Support email: your-email@example.com
4. Add scopes: email, profile
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/v1/auth/google/callback` (development)
   - `https://your-domain.com/api/v1/auth/google/callback` (production)
   - `https://your-web-app.vercel.app/auth/callback` (web app)
6. Click "Create"
7. **Save**: Client ID and Client Secret

**Step 4: Create Service Account (for Vision API)**
1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Name: `splittab-ocr`
4. Grant role: "Cloud Vision API User"
5. Click "Create Key" → JSON
6. **Download JSON file** (save as `google-cloud-credentials.json`)

**Cost**: Free tier includes:
- Vision API: 1,000 requests/month free
- OAuth: Free unlimited

---

#### 1.2 Apple Developer Setup (~1 hour)

**Prerequisites**: Apple Developer Account ($99/year)

**Step 1: Register App ID**
1. Go to https://developer.apple.com/account
2. Navigate to "Certificates, Identifiers & Profiles"
3. Click "Identifiers" → "+"
4. Select "App IDs" → Continue
5. Description: `SplitTab`
6. Bundle ID: `com.yourcompany.splittab`
7. Enable "Sign in with Apple"
8. Click "Register"

**Step 2: Configure Sign in with Apple**
1. Click "Identifiers" → "+" again
2. Select "Services IDs" → Continue
3. Description: `SplitTab Web`
4. Identifier: `com.yourcompany.splittab.web`
5. Enable "Sign in with Apple"
6. Configure:
   - Primary App ID: (select your app)
   - Website URLs:
     - Domain: `your-domain.com`
     - Return URLs: `https://your-domain.com/api/v1/auth/apple/callback`
7. Click "Save"

**Step 3: Generate Private Key**
1. Click "Keys" → "+"
2. Key Name: `SplitTab Sign in with Apple Key`
3. Enable "Sign in with Apple"
4. Configure: Select your Primary App ID
5. Click "Register"
6. **Download .p8 file** (you can only download once!)
7. **Save**: Key ID, Team ID, and .p8 file contents

**Update Environment Variables**:
```bash
APPLE_CLIENT_ID=com.yourcompany.splittab.web
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_KEY_ID=YOUR_KEY_ID
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour key content\n-----END PRIVATE KEY-----"
```

---

#### 1.3 Email Service Setup (~30 minutes)

**Option A: SendGrid (Recommended)**

1. Go to https://sendgrid.com/
2. Sign up (free tier: 100 emails/day)
3. Verify your sender email:
   - Settings → Sender Authentication
   - Click "Verify a Single Sender"
   - Enter your email (e.g., `noreply@yourdomain.com`)
   - Click verification link in email
4. Create API Key:
   - Settings → API Keys
   - Click "Create API Key"
   - Name: `SplitTab Production`
   - Permissions: "Full Access"
   - Click "Create & View"
   - **Copy API Key** (shown only once!)

**Environment Variables**:
```bash
EMAIL_FROM=noreply@yourdomain.com
EMAIL_API_KEY=SG.your-sendgrid-api-key
```

**Option B: Resend (Alternative)**

1. Go to https://resend.com/
2. Sign up (free tier: 100 emails/day)
3. Add your domain (or use onboarding.resend.dev for testing)
4. Create API Key:
   - Settings → API Keys
   - Click "Create API Key"
   - **Copy API Key**

**Environment Variables**:
```bash
EMAIL_FROM=noreply@yourdomain.com
EMAIL_API_KEY=re_your-resend-api-key
```

---

#### 1.4 AWS S3 Setup (~1 hour)

**Step 1: Create AWS Account**
1. Go to https://aws.amazon.com/
2. Sign up (free tier: 5GB storage, 20,000 GET requests/month)

**Step 2: Create S3 Bucket**
1. Navigate to S3 service
2. Click "Create bucket"
3. Bucket name: `splittab-receipts-prod` (must be globally unique)
4. Region: `us-east-1` (or your preferred region)
5. **Uncheck** "Block all public access" (we'll configure CORS)
6. Enable versioning (recommended)
7. Click "Create bucket"

**Step 3: Configure CORS**
1. Click on your bucket
2. Go to "Permissions" → "Cross-origin resource sharing (CORS)"
3. Add CORS configuration:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": [
            "http://localhost:3000",
            "https://your-domain.com",
            "https://your-web-app.vercel.app"
        ],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

**Step 4: Create IAM User**
1. Navigate to IAM service
2. Click "Users" → "Add users"
3. Username: `splittab-s3-user`
4. Access type: "Programmatic access"
5. Click "Next: Permissions"
6. Click "Attach existing policies directly"
7. Search and select: `AmazonS3FullAccess`
8. Click "Next" → "Create user"
9. **Download CSV** with Access Key ID and Secret Access Key

**Step 5: Enable Textract (Optional - for OCR)**
1. Navigate to AWS Textract
2. Ensure it's available in your region
3. No additional setup needed (uses same IAM credentials)

**Environment Variables**:
```bash
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=splittab-receipts-prod
AWS_TEXTRACT_REGION=us-east-1
```

**Cost**: ~$5-10/month for 1000 users

---

#### 1.5 Sentry Setup (~30 minutes)

**Step 1: Create Account**
1. Go to https://sentry.io/
2. Sign up (free tier: 10,000 events/month)

**Step 2: Create Project**
1. Click "Create Project"
2. Platform: "Node.js"
3. Project name: `splittab-backend`
4. Click "Create Project"

**Step 3: Get DSN**
1. Navigate to Settings → Projects → splittab-backend
2. Click "Client Keys (DSN)"
3. **Copy DSN** (looks like: `https://xxx@xxx.ingest.sentry.io/xxx`)

**Step 4: Create Frontend Project (Web)**
1. Click "Create Project"
2. Platform: "Next.js"
3. Project name: `splittab-web`
4. **Copy DSN**

**Step 5: Create iOS Project**
1. Click "Create Project"
2. Platform: "iOS"
3. Project name: `splittab-ios`
4. **Copy DSN**

**Environment Variables**:
```bash
# Backend
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Web (.env.local)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# iOS (Config.swift)
sentryDSN = "https://xxx@xxx.ingest.sentry.io/xxx"
```

---

### Phase 2: Backend Deployment (Day 2)

#### 2.1 Railway Deployment (Recommended for MVP)

**Why Railway?**
- Simplest deployment (one command)
- Integrated PostgreSQL + Redis
- Automatic SSL certificates
- Fair pricing ($50-100/month)

**Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
```

**Step 2: Login**
```bash
railway login
```

**Step 3: Initialize Project**
```bash
cd backend
railway init
# Enter project name: splittab-backend
```

**Step 4: Add Services**
```bash
# Add PostgreSQL
railway add postgresql

# Add Redis
railway add redis
```

**Step 5: Set Environment Variables**
```bash
# Generate secure JWT secrets
railway variables set JWT_ACCESS_SECRET=$(openssl rand -base64 32)
railway variables set JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Set environment
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set API_VERSION=v1

# CORS (update with your actual domains)
railway variables set ALLOWED_ORIGINS=https://your-web-app.vercel.app,https://your-domain.com

# Rate limiting
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set RATE_LIMIT_MAX_REQUESTS=100

# Email (use your SendGrid/Resend key)
railway variables set EMAIL_FROM=noreply@yourdomain.com
railway variables set EMAIL_API_KEY=your-email-api-key

# Google OAuth
railway variables set GOOGLE_CLIENT_ID=your-google-client-id
railway variables set GOOGLE_CLIENT_SECRET=your-google-client-secret

# Apple Sign-In
railway variables set APPLE_CLIENT_ID=com.yourcompany.splittab.web
railway variables set APPLE_TEAM_ID=YOUR_TEAM_ID
railway variables set APPLE_KEY_ID=YOUR_KEY_ID
railway variables set APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour key\n-----END PRIVATE KEY-----"

# AWS S3
railway variables set AWS_ACCESS_KEY_ID=AKIA...
railway variables set AWS_SECRET_ACCESS_KEY=your-secret-key
railway variables set AWS_REGION=us-east-1
railway variables set AWS_S3_BUCKET=splittab-receipts-prod

# OCR
railway variables set OCR_PROVIDER=google
railway variables set GOOGLE_CLOUD_PROJECT_ID=splittab-prod
railway variables set OCR_CONFIDENCE_THRESHOLD=0.8
railway variables set OCR_MAX_RETRIES=3

# Background jobs
railway variables set OCR_QUEUE_CONCURRENCY=5

# Sentry
railway variables set SENTRY_DSN=your-sentry-dsn

# Logging
railway variables set LOG_LEVEL=info
```

**Step 6: Upload Google Cloud Credentials**
```bash
# Railway doesn't support file uploads directly
# Convert JSON to base64 and set as env var
cat google-cloud-credentials.json | base64 | railway variables set GOOGLE_APPLICATION_CREDENTIALS_BASE64=$(cat -)

# Update your code to decode this in src/config/index.ts
```

**Step 7: Deploy**
```bash
railway up
```

**Step 8: Run Migrations**
```bash
railway run npx prisma migrate deploy
```

**Step 9: Get Your URL**
```bash
railway status
# Copy the URL (e.g., https://splittab-backend.railway.app)
```

**Step 10: Test**
```bash
curl https://your-backend.railway.app/api/v1/health
# Should return: {"status":"ok","timestamp":"..."}
```

**✅ Backend deployed!**

---

#### 2.2 Alternative: AWS Deployment

See `docs/INFRASTRUCTURE_SETUP.md` for AWS deployment guide.

---

### Phase 3: Web App Deployment (Day 2)

#### 3.1 Vercel Deployment

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Login**
```bash
vercel login
```

**Step 3: Configure Environment Variables**

Create `web/.env.production.local`:
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_SENTRY_DSN=your-web-sentry-dsn
NEXT_PUBLIC_APP_NAME=SplitTab
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**Step 4: Deploy**
```bash
cd web
vercel --prod
```

**Step 5: Set Environment Variables in Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add all variables from `.env.production.local`
5. Redeploy: `vercel --prod`

**Step 6: Configure Custom Domain (Optional)**
1. In Vercel dashboard, go to "Settings" → "Domains"
2. Add your domain (e.g., `app.splittab.com`)
3. Follow DNS configuration instructions

**✅ Web app deployed!**

Visit: `https://your-web-app.vercel.app`

---

### Phase 4: iOS App Deployment (Day 3)

#### 4.1 TestFlight Release

**Step 1: Update Configuration**
1. Open `ios/SplitTab.xcodeproj` in Xcode
2. Update `Config.swift`:
```swift
static let baseURL = "https://your-backend.railway.app/api/v1"
static let sentryDSN = "your-ios-sentry-dsn"
```

**Step 2: Update Bundle ID**
1. Select project in Xcode
2. Go to "Signing & Capabilities"
3. Team: Select your Apple Developer team
4. Bundle Identifier: `com.yourcompany.splittab`

**Step 3: Archive**
1. In Xcode menu: Product → Archive
2. Wait for build to complete
3. Click "Distribute App"
4. Select "App Store Connect"
5. Select "Upload"
6. Follow wizard (keep default options)
7. Click "Upload"

**Step 4: Configure in App Store Connect**
1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: SplitTab
   - Primary Language: English
   - Bundle ID: com.yourcompany.splittab
   - SKU: splittab-ios
4. Create app

**Step 5: Add to TestFlight**
1. Go to "TestFlight" tab
2. Select your uploaded build
3. Fill in "Test Information"
4. Add internal testers (emails)
5. Click "Start Testing"

**Step 6: Invite Beta Testers**
1. Go to "TestFlight" → "Internal Testing"
2. Click "+" to add testers
3. Enter emails
4. They'll receive invite via email

**✅ iOS app in TestFlight!**

Testers can download via TestFlight app.

---

## 🧪 Post-Deployment Testing

### Smoke Tests (Run After Each Deployment)

**Backend API**:
```bash
BASE_URL=https://your-backend.railway.app/api/v1

# Health check
curl $BASE_URL/health

# Register user
curl -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Login
curl -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

**Web App**:
- [ ] Load homepage
- [ ] Register new account
- [ ] Login
- [ ] Create group
- [ ] Create expense
- [ ] View balances

**iOS App**:
- [ ] Launch app
- [ ] Sign in with Apple
- [ ] Create expense
- [ ] Upload receipt photo
- [ ] View settlements

---

## 📊 Monitoring Setup

### Sentry Configuration
1. Check error rates in Sentry dashboard
2. Set up alerts:
   - Email on critical errors
   - Slack integration (optional)

### Railway Monitoring
1. Check deployment logs: `railway logs`
2. Monitor CPU/memory usage in dashboard
3. Set up billing alerts

### Vercel Analytics
1. Enable Web Analytics in Vercel dashboard
2. Track page views and performance

---

## 🔄 Deployment Workflow

### For Backend Updates
```bash
cd backend
git pull origin main
railway up
railway run npx prisma migrate deploy
```

### For Web Updates
```bash
cd web
git pull origin main
vercel --prod
```

### For iOS Updates
1. Update version in Xcode
2. Archive and upload
3. Submit new build to TestFlight

---

## ⚠️ Troubleshooting

### Issue: Database Migration Fails
```bash
# Reset and re-run
railway run npx prisma migrate reset --force
railway run npx prisma migrate deploy
```

### Issue: Environment Variables Not Loading
```bash
# Check variables are set
railway variables

# Re-set specific variable
railway variables set KEY=value

# Restart service
railway up
```

### Issue: Build Fails
```bash
# Check logs
railway logs

# Local build test
npm run build

# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

### Issue: CORS Errors
```bash
# Update ALLOWED_ORIGINS
railway variables set ALLOWED_ORIGINS=https://your-web-app.vercel.app,https://your-domain.com

# Redeploy
railway up
```

---

## 📝 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing locally
- [ ] Environment variables documented
- [ ] Secrets generated (JWT keys)
- [ ] Third-party accounts created
- [ ] Domain registered (optional)

### Deployment
- [ ] Backend deployed to Railway
- [ ] Database migrations applied
- [ ] Web app deployed to Vercel
- [ ] iOS app uploaded to TestFlight
- [ ] All services can communicate

### Post-Deployment
- [ ] Smoke tests passing
- [ ] Sentry receiving events
- [ ] Monitoring dashboards set up
- [ ] Billing alerts configured
- [ ] Beta testers invited
- [ ] Support email configured

---

## 💰 Cost Summary

**Monthly Operating Costs**:
- Railway (Backend + DB + Redis): $50-100
- Vercel (Web hosting): $0 (free tier)
- SendGrid (Email): $0-20
- AWS S3 (Storage): $5-10
- Sentry (Errors): $0 (free tier)
- **Total**: ~$60-130/month

**One-Time Costs**:
- Apple Developer: $99/year
- Domain: $15/year (optional)

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ Production backend API
- ✅ Live web application
- ✅ iOS app in TestFlight
- ✅ Monitoring and error tracking
- ✅ Ready for beta users

**Next**: Invite 20-50 beta users and gather feedback!

---

**Need Help?**
- Check `docs/RUNBOOK.md` for operations guide
- See `docs/INFRASTRUCTURE_SETUP.md` for advanced configurations
- Contact: engineering@splittab.com
