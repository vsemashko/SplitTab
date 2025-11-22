# ⚡ Quick Deploy Reference Card

**Get SplitTab to production in 1 day!**

---

## 🎯 Morning (4 hours): Service Setup

### 1. Google Cloud Platform (2 hours)
```bash
# 1. Go to: https://console.cloud.google.com
# 2. Create project: splittab-prod
# 3. Enable: Google+ API, Cloud Vision API
# 4. Create OAuth 2.0 credentials
# 5. Create service account, download JSON
# 6. Save to: backend/google-cloud-credentials.json
```

**Save these**:
- ✏️ Client ID: `__________________.apps.googleusercontent.com`
- ✏️ Client Secret: `__________________`
- ✏️ Project ID: `__________________`

### 2. SendGrid (30 min)
```bash
# 1. Sign up: https://sendgrid.com
# 2. Verify sender email
# 3. Create API key (Full Access)
```

**Save this**:
- ✏️ API Key: `SG.__________________`

### 3. AWS S3 (1 hour)
```bash
# 1. Sign up: https://aws.amazon.com
# 2. Create bucket: splittab-receipts-prod
# 3. Configure CORS
# 4. Create IAM user with S3 access
```

**Save these**:
- ✏️ Access Key: `AKIA__________________`
- ✏️ Secret Key: `__________________`

### 4. Sentry (30 min)
```bash
# 1. Sign up: https://sentry.io
# 2. Create projects: backend, web, ios
# 3. Copy DSNs
```

**Save these**:
- ✏️ Backend DSN: `https://__________________`
- ✏️ Web DSN: `https://__________________`
- ✏️ iOS DSN: `https://__________________`

---

## 🚀 Afternoon (4 hours): Deployment

### 1. Backend to Railway (1 hour)
```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Deploy (from backend folder)
cd backend
./railway-deploy.sh

# ✅ Backend URL: https://________.railway.app
```

### 2. Web to Vercel (30 min)
```bash
# Install CLI
npm install -g vercel

# Update web/.env.production.local
cat > web/.env.production.local << EOF
NEXT_PUBLIC_API_URL=https://YOUR_BACKEND.railway.app/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_SENTRY_DSN=your-web-sentry-dsn
EOF

# Deploy
cd web
vercel --prod

# ✅ Web URL: https://________.vercel.app
```

### 3. iOS to TestFlight (2 hours)
```bash
# 1. Open ios/SplitTab.xcodeproj in Xcode
# 2. Update Config.swift:
#    - baseURL = "https://YOUR_BACKEND.railway.app/api/v1"
#    - sentryDSN = "your-ios-sentry-dsn"
# 3. Product → Archive
# 4. Distribute → App Store Connect → Upload
# 5. App Store Connect → TestFlight → Add testers

# ✅ TestFlight: Ready for beta testers
```

### 4. Test Everything (30 min)
```bash
# Backend health check
curl https://YOUR_BACKEND.railway.app/api/v1/health

# Create test user
curl -X POST https://YOUR_BACKEND.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","name":"Test"}'

# Web app
# Visit: https://YOUR_WEB.vercel.app
# Register, login, create expense

# iOS app
# Install from TestFlight
# Sign in, create expense
```

---

## 📋 Environment Variables Quick Copy

### backend/.env.production
```bash
NODE_ENV=production
PORT=3000
API_VERSION=v1

# JWT (generate with: openssl rand -base64 64)
JWT_ACCESS_SECRET=YOUR_64_CHAR_SECRET_HERE
JWT_REFRESH_SECRET=YOUR_64_CHAR_SECRET_HERE

# CORS
ALLOWED_ORIGINS=https://your-web.vercel.app,https://yourdomain.com

# Email
EMAIL_FROM=noreply@yourdomain.com
EMAIL_API_KEY=SG.your-sendgrid-key

# Google OAuth
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret

# AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=splittab-receipts-prod

# Google Cloud Vision
GOOGLE_CLOUD_PROJECT_ID=splittab-prod
OCR_PROVIDER=google

# Sentry
SENTRY_DSN=https://your-sentry-dsn

# Logging
LOG_LEVEL=info
```

---

## ✅ Deployment Checklist

### Pre-Deploy
- [ ] All services set up (Google, AWS, SendGrid, Sentry)
- [ ] `.env.production` file created with real values
- [ ] `google-cloud-credentials.json` in backend folder
- [ ] Railway CLI installed and logged in
- [ ] Vercel CLI installed and logged in

### Deploy
- [ ] Backend deployed to Railway
- [ ] Database migrations run
- [ ] Web app deployed to Vercel
- [ ] iOS app uploaded to TestFlight

### Post-Deploy
- [ ] Backend health check passing
- [ ] Can register and login on web
- [ ] Can create expense on web
- [ ] iOS app working in TestFlight
- [ ] Sentry receiving events

---

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check logs
railway logs

# Check environment variables
railway variables

# Re-run migrations
railway run npx prisma migrate deploy
```

### CORS errors
```bash
# Update ALLOWED_ORIGINS
railway variables set ALLOWED_ORIGINS=https://your-web.vercel.app

# Redeploy
railway up
```

### Database connection failed
```bash
# Check DATABASE_URL is set (Railway does this automatically)
railway variables | grep DATABASE_URL

# If missing, re-add PostgreSQL
railway add postgresql
```

---

## 📊 Cost Summary

| Service | Cost |
|---------|------|
| Railway (Backend + DB + Redis) | $50-100/mo |
| Vercel (Web) | Free |
| SendGrid (Email) | Free (100/day) |
| AWS S3 | $5-10/mo |
| Sentry | Free (10k events/mo) |
| **Total** | **~$60-130/mo** |

---

## 🎉 Success Criteria

You're successfully deployed when:
- ✅ `curl YOUR_BACKEND/api/v1/health` returns 200
- ✅ Can register account on web app
- ✅ Can create expense on web app
- ✅ Can install iOS app from TestFlight
- ✅ No errors in Sentry

---

## 📱 Beta Testing

### Invite Beta Testers
```bash
# iOS TestFlight
# 1. App Store Connect → TestFlight
# 2. Add external testers (emails)
# 3. They receive invite email

# Web App
# Just share the URL: https://your-web.vercel.app
```

### Target: 20-50 beta users
- Friends & family: 10-15 users
- r/betatesters: 5-10 users
- Product Hunt Ship: 5-10 users
- Hacker News: 5-10 users

---

## 📈 Monitoring

### Daily Checks
```bash
# Sentry: Check error count
# https://sentry.io/organizations/your-org/issues/

# Railway: Check performance
# https://railway.app/dashboard

# Vercel: Check deployments
# https://vercel.com/dashboard
```

---

## 🚀 Next Steps

After successful deployment:
1. Invite 20-50 beta testers
2. Gather feedback
3. Fix critical bugs
4. Iterate based on user needs
5. Launch publicly in 2-4 weeks

---

**Need more details?** See:
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `SERVICE_SETUP_CHECKLIST.md` - Detailed setup checklist
- `docs/RUNBOOK.md` - Operations guide

---

**Get help**: engineering@splittab.com

**Let's ship it! 🚀**
