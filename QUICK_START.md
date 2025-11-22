# SplitTab - Quick Start Deployment Guide

**Ready to deploy in 3 simple steps!** ⚡

---

## 🎯 TL;DR - Get Live in 1-2 Days

1. **Get API Keys** (1-2 days) - Sign up for required services
2. **Deploy Backend** (30 min) - Run `./scripts/deploy-railway.sh`
3. **Deploy Web App** (15 min) - Run `./scripts/deploy-vercel.sh`
4. **Beta Test** (1-2 weeks) - Invite users, gather feedback

**Total cost**: $55-130/month

---

## 📋 Pre-Deployment Checklist

Before you start, create accounts for these services:

- [ ] **Railway** - Backend hosting (https://railway.app)
- [ ] **Vercel** - Web app hosting (https://vercel.com)
- [ ] **Google Cloud** - OAuth + OCR (https://console.cloud.google.com)
- [ ] **Apple Developer** - iOS app ($99/year) (https://developer.apple.com)
- [ ] **SendGrid** - Email service (https://sendgrid.com)
- [ ] **AWS** - S3 file storage (https://aws.amazon.com)
- [ ] **Sentry** - Error tracking (https://sentry.io)

**Estimated time**: 3-5 hours to get all API keys

📖 **Detailed setup guide**: See `DEPLOYMENT_READY.md` (Phase 1)

---

## 🚀 Step 1: Get API Keys (Day 1-2)

### Google Cloud Platform (~2 hours)
1. Create project at https://console.cloud.google.com
2. Enable Cloud Vision API + Google+ API
3. Create OAuth 2.0 credentials
4. Save Client ID and Secret

### Apple Developer (~1 hour)
1. Enroll at https://developer.apple.com ($99/year)
2. Create App ID for SplitTab
3. Configure "Sign in with Apple"
4. Generate authentication key

### SendGrid (~30 min)
1. Sign up at https://sendgrid.com
2. Create API key
3. Verify sender email

### AWS S3 (~1 hour)
1. Create account at https://aws.amazon.com
2. Create S3 bucket: `splittab-receipts-production`
3. Create IAM user with S3 access
4. Save access key and secret

### Sentry (~30 min)
1. Sign up at https://sentry.io
2. Create project: "SplitTab Backend"
3. Copy DSN

**Save all these credentials securely** - you'll need them for deployment!

---

## 🚀 Step 2: Deploy Backend to Railway (30 min)

### Quick Method (Automated)

```bash
cd scripts
./deploy-railway.sh
```

The script will:
- ✅ Check Railway CLI is installed
- ✅ Prompt for all API keys
- ✅ Set all environment variables
- ✅ Deploy backend
- ✅ Run database migrations
- ✅ Test health endpoint

### Manual Method

```bash
# Install CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init

# Add services
railway add postgresql
railway add redis

# Set variables (see DEPLOYMENT_READY.md for full list)
railway variables set NODE_ENV=production
railway variables set JWT_ACCESS_SECRET=<your-secret>
# ... (set all other variables)

# Deploy
cd backend
railway up

# Run migrations
railway run npx prisma migrate deploy
```

### Verify Deployment

```bash
# Get URL
railway domain

# Test health
curl https://your-app.railway.app/health
# Should return: {"status":"ok"}
```

**🎉 Backend is live!**

---

## 🚀 Step 3: Deploy Web App to Vercel (15 min)

### Quick Method (Automated)

```bash
cd scripts
./deploy-vercel.sh
```

The script will:
- ✅ Check Vercel CLI is installed
- ✅ Deploy web app
- ✅ Prompt for configuration
- ✅ Set environment variables
- ✅ Redeploy with config

### Manual Method

```bash
# Install CLI
npm install -g vercel

# Login and deploy
cd web
vercel login
vercel --prod

# Set environment variables in Vercel dashboard
# - NEXT_PUBLIC_API_URL=https://your-backend.railway.app
# - NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-id>
# - NEXT_PUBLIC_APPLE_CLIENT_ID=<your-id>
# - NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Redeploy
vercel --prod
```

### Test Web App

1. Visit your Vercel URL
2. Register a new account
3. Check email for verification
4. Login with Google OAuth
5. Create a test expense

**🎉 Web app is live!**

---

## 🚀 Step 4: Deploy iOS to TestFlight (Optional, 2 hours)

### Prerequisites
- Mac with Xcode installed
- Apple Developer account active

### Steps

1. **Update configuration** in `ios/SplitTab/Config/Config.xcconfig`:
   ```
   DEVELOPMENT_TEAM = YOUR_TEAM_ID
   API_BASE_URL_RELEASE = https:/\/\/your-backend.railway.app
   ```

2. **Open in Xcode**:
   ```bash
   cd ios
   open SplitTab.xcodeproj
   ```

3. **Configure signing**:
   - Select project → SplitTab target
   - Signing & Capabilities
   - Select your team

4. **Archive and upload**:
   - Product → Archive
   - Distribute App → App Store Connect
   - Upload to TestFlight

5. **Invite testers** in App Store Connect

**🎉 iOS app on TestFlight!**

---

## 🎯 Step 5: Beta Testing (1-2 weeks)

### Recruit Testers (20-50 users)

**Week 1**:
- Email friends & family (10-15 people)
- Post on r/betatesters
- Share on Product Hunt Ship
- Tweet about it

**Week 2**:
- Monitor Sentry for errors
- Fix critical bugs
- Gather feedback
- Iterate on UX

### Success Metrics

- [ ] 20+ beta users signed up
- [ ] 100+ expenses created
- [ ] 10+ active groups
- [ ] < 5% error rate
- [ ] All critical bugs fixed

---

## 📊 What's Next?

### Production Launch (Week 3-4)

1. **Polish based on beta feedback** (Week 3)
   - Fix bugs
   - Improve UX
   - Optimize performance

2. **iOS App Store submission** (Week 4)
   - Prepare screenshots
   - Write description
   - Submit for review

3. **Launch day** 🚀
   - Announce on Product Hunt
   - Post on Hacker News
   - Share on social media
   - Monitor closely

---

## 💰 Cost Breakdown

| Service | Monthly Cost |
|---------|--------------|
| Railway (Backend) | $50-100 |
| Vercel (Web) | Free |
| SendGrid (Email) | Free-$20 |
| AWS S3 (Storage) | $5-10 |
| Sentry (Errors) | Free |
| **Total** | **$55-130** |

**One-time**: Apple Developer $99/year

---

## 🆘 Troubleshooting

### "Railway CLI not found"
```bash
npm install -g @railway/cli
```

### "Vercel CLI not found"
```bash
npm install -g vercel
```

### "Database connection failed"
```bash
# Check DATABASE_URL is set
railway variables get DATABASE_URL

# Verify PostgreSQL is running
railway status
```

### "OAuth error: redirect_uri_mismatch"
- Check Google Cloud Console → Credentials
- Add exact redirect URI: `https://yourdomain.com/auth/google/callback`
- Must match exactly (including https://)

### "Email not sending"
- Verify SendGrid API key is correct
- Check sender email is verified in SendGrid
- Look for errors in Sentry

### "S3 upload failed"
- Verify AWS credentials are correct
- Check S3 bucket exists
- Verify IAM user has S3 permissions
- Check CORS policy is configured

---

## 📚 Full Documentation

- **DEPLOYMENT_READY.md** - Complete deployment guide
- **NEXT_STEPS.md** - Week-by-week roadmap
- **docs/DEPLOYMENT_QUICK_START.md** - Railway guide
- **docs/THIRD_PARTY_SERVICES.md** - Service setup
- **docs/RUNBOOK.md** - Daily operations
- **docs/BETA_LAUNCH_GUIDE.md** - Beta testing

---

## ✅ Deployment Checklist

**Pre-Deployment**:
- [ ] All API keys obtained
- [ ] Railway account created
- [ ] Vercel account created
- [ ] Credentials saved securely

**Backend**:
- [ ] Railway CLI installed
- [ ] Backend deployed
- [ ] Migrations run
- [ ] Health check passing

**Web**:
- [ ] Vercel CLI installed
- [ ] Web app deployed
- [ ] Environment variables set
- [ ] Login/signup tested

**iOS** (Optional):
- [ ] Xcode configured
- [ ] TestFlight upload complete
- [ ] Beta testers invited

**Testing**:
- [ ] Register flow works
- [ ] Email delivery works
- [ ] OAuth login works
- [ ] Create expense works
- [ ] Receipt upload works

**Monitoring**:
- [ ] Sentry tracking errors
- [ ] Railway metrics visible
- [ ] Daily monitoring set up

---

## 🎉 You're Ready!

Your SplitTab MVP is **100% complete** and ready to deploy!

**Start here**: Get your API keys from the services listed above, then run the deployment scripts.

**Timeline**:
- Day 1-2: Get API keys
- Day 3: Deploy backend + web
- Week 2: Beta testing
- Week 3-4: Production launch

**Questions?** Check the full docs or open an issue on GitHub.

**Good luck! 🚀**
