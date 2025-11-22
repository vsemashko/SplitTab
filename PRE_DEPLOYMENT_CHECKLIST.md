# ✅ Pre-Deployment Checklist

**Use this checklist before deploying to production to ensure everything is ready.**

---

## 📋 Day Before Deployment

### 1. Code Quality ✅
- [ ] All tests passing locally: `npm test`
- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Linter clean: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] No `console.log` statements in production code
- [ ] All TODOs and FIXMEs resolved or documented

### 2. Environment Configuration 🔧
- [ ] Created `.env.production` file
- [ ] Validated environment variables: `./scripts/check-env.sh`
- [ ] All placeholders replaced with real values
- [ ] JWT secrets generated (64+ characters)
- [ ] JWT access and refresh secrets are different
- [ ] `NODE_ENV=production`
- [ ] CORS origins updated for production domains
- [ ] No sensitive data in git history

### 3. Third-Party Services 🔑
- [ ] **Google Cloud Platform**
  - [ ] OAuth credentials created
  - [ ] Vision API enabled
  - [ ] Service account JSON downloaded
  - [ ] Redirect URIs configured for production
  - [ ] Tested with validation script

- [ ] **Apple Developer**
  - [ ] Enrolled in program ($99/year)
  - [ ] App ID registered
  - [ ] Service ID configured
  - [ ] Private key (.p8) generated and saved
  - [ ] Return URLs configured for production

- [ ] **Email Service (SendGrid/Resend)**
  - [ ] Account created
  - [ ] Sender email verified
  - [ ] API key generated
  - [ ] Test email sent successfully

- [ ] **AWS S3**
  - [ ] Account created
  - [ ] S3 bucket created (unique name)
  - [ ] CORS configured
  - [ ] IAM user created with S3 access
  - [ ] Access key and secret saved

- [ ] **Sentry**
  - [ ] Account created
  - [ ] 3 projects created (backend, web, iOS)
  - [ ] DSNs copied
  - [ ] Test error sent and visible

- [ ] **Railway (or hosting provider)**
  - [ ] Account created
  - [ ] Payment method added
  - [ ] CLI installed: `npm install -g @railway/cli`
  - [ ] Logged in: `railway login`

- [ ] **Vercel**
  - [ ] Account created
  - [ ] CLI installed: `npm install -g vercel`
  - [ ] Logged in: `vercel login`

- [ ] Service validation passed: `./scripts/validate-services.sh`

### 4. Database 🗄️
- [ ] Latest schema in Prisma
- [ ] All migrations created and tested
- [ ] No pending schema changes
- [ ] Seed data prepared (if needed)
- [ ] Backup strategy defined
- [ ] Connection pooling configured

### 5. Security 🔐
- [ ] Passwords hashed with bcrypt
- [ ] JWT tokens expire appropriately
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Helmet middleware active
- [ ] Input validation with Zod on all endpoints
- [ ] No SQL injection vulnerabilities
- [ ] XSS protection enabled
- [ ] HTTPS enforced (in production)
- [ ] Secrets not in git
- [ ] `.env.production` in `.gitignore`

### 6. Documentation 📚
- [ ] README updated with deployment info
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Deployment guide available
- [ ] Runbook created for operations
- [ ] Known issues documented

---

## 📋 Deployment Day

### Morning: Backend Deployment (2-3 hours)

#### Step 1: Final Pre-Flight (30 min)
- [ ] Latest code pulled from main branch
- [ ] All tests passing: `npm test`
- [ ] Build successful: `npm run build`
- [ ] `.env.production` ready with all values
- [ ] `google-cloud-credentials.json` in place
- [ ] Backup of current production (if redeploying)

#### Step 2: Deploy to Railway (1 hour)
- [ ] Run deployment script: `./railway-deploy.sh`
- [ ] Verify deployment URL received
- [ ] Migrations applied successfully
- [ ] No errors in deployment logs: `railway logs`

#### Step 3: Smoke Test Backend (30 min)
- [ ] Health check passing: `curl https://your-backend.railway.app/api/v1/health`
- [ ] Run comprehensive tests: `./scripts/test-deployment.sh https://your-backend.railway.app`
- [ ] All tests passing
- [ ] Response times acceptable (< 500ms)
- [ ] Check Sentry - no errors
- [ ] Check Railway dashboard - metrics healthy

#### Step 4: Backend Configuration (30 min)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Environment variables verified in Railway dashboard
- [ ] Database connection verified
- [ ] Redis connection verified
- [ ] Background jobs running (check logs)

---

### Afternoon: Frontend Deployment (2-3 hours)

#### Step 5: Web App to Vercel (1 hour)
- [ ] Update `web/.env.production.local`:
  ```bash
  NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
  NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
  NEXT_PUBLIC_SENTRY_DSN=your-web-sentry-dsn
  ```
- [ ] Deploy: `cd web && vercel --prod`
- [ ] Verify deployment URL
- [ ] Test web app loads
- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test creating expense
- [ ] Test all core features
- [ ] Check console for errors (F12)
- [ ] Test on mobile browser
- [ ] Custom domain configured (optional)

#### Step 6: iOS to TestFlight (2 hours)
- [ ] Update `ios/SplitTab/Config.swift`:
  ```swift
  static let baseURL = "https://your-backend.railway.app/api/v1"
  static let sentryDSN = "your-ios-sentry-dsn"
  ```
- [ ] Clean build folder (⇧⌘K)
- [ ] Archive: Product → Archive
- [ ] Distribute → App Store Connect
- [ ] Upload to TestFlight
- [ ] Verify upload in App Store Connect
- [ ] Configure TestFlight info (what to test, etc.)
- [ ] Add internal testers
- [ ] Test build installed on device
- [ ] Test core features on device
- [ ] Check crashes in App Store Connect

---

## 📋 Post-Deployment

### Immediate (Within 1 hour)

#### Monitoring Setup
- [ ] Sentry alerts configured
  - [ ] Email on critical errors
  - [ ] Slack integration (optional)
- [ ] Railway alerts configured
  - [ ] CPU/Memory thresholds
  - [ ] Billing alerts
- [ ] Uptime monitoring (UptimeRobot/Pingdom)
  - [ ] Monitor `/health` endpoint
  - [ ] Alert on downtime

#### Health Checks (Run every 15 min for first hour)
- [ ] Backend health: `curl https://your-backend.railway.app/api/v1/health`
- [ ] Check Sentry dashboard - error count
- [ ] Check Railway metrics - response times
- [ ] Check Vercel analytics - page views
- [ ] No spike in errors
- [ ] Response times normal

### First 24 Hours

#### Test Critical Paths
- [ ] **Web App**
  - [ ] Register new account
  - [ ] Login with email
  - [ ] Login with Google OAuth
  - [ ] Create group
  - [ ] Create expense (all split methods)
  - [ ] Upload receipt
  - [ ] View balances
  - [ ] Create settlement

- [ ] **iOS App**
  - [ ] Sign in with Apple
  - [ ] Register with email
  - [ ] Create expense
  - [ ] Camera upload
  - [ ] View groups
  - [ ] Notifications work

#### Monitoring
- [ ] Check Sentry every 4 hours
- [ ] Fix any P0 critical errors immediately
- [ ] Monitor response times
- [ ] Check database performance
- [ ] Monitor costs (Railway, AWS)

---

## 📋 Beta Launch (Day 2-7)

### Beta Tester Onboarding
- [ ] Send invitations (see BETA_TESTING_GUIDE.md)
- [ ] Create feedback form (Google Forms/Typeform)
- [ ] Set up support email: beta@splittab.com
- [ ] Create Discord/Slack for testers (optional)
- [ ] Prepare FAQ document

### Invite Waves
- [ ] **Wave 1 (Day 1)**: 5-10 friends & family
- [ ] **Wave 2 (Day 3)**: 10-15 more testers
- [ ] **Wave 3 (Day 5)**: Public beta (r/betatesters, etc.)

### Daily Tasks
- [ ] Check Sentry for errors
- [ ] Respond to feedback within 24h
- [ ] Fix critical bugs immediately
- [ ] Monitor metrics:
  - [ ] Signups
  - [ ] Expenses created
  - [ ] Error rate
  - [ ] Retention

### Week 1 Checklist
- [ ] Day 1: Send invitations
- [ ] Day 3: Send check-in email
- [ ] Day 5: Post to r/betatesters
- [ ] Day 7: Send feedback survey

---

## 📋 Pre-Public Launch

### Final Checks (1-2 weeks after beta)
- [ ] All P0 critical bugs fixed
- [ ] All P1 high priority bugs fixed
- [ ] Test coverage > 50%
- [ ] Load testing completed
- [ ] Performance optimization done
- [ ] Security audit completed
- [ ] GDPR compliance reviewed
- [ ] Terms of Service finalized
- [ ] Privacy Policy finalized

### App Store Submission
- [ ] Screenshots prepared (6.5", 5.5")
- [ ] App icon (1024x1024)
- [ ] App description written
- [ ] Keywords selected
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Age rating questionnaire completed
- [ ] Submit for review

### Marketing Preparation
- [ ] Landing page ready
- [ ] Social media accounts created
- [ ] Product Hunt launch scheduled
- [ ] Hacker News Show HN prepared
- [ ] Press kit ready
- [ ] Launch announcement emails written

---

## 🚨 Rollback Plan

If something goes wrong:

### Backend Issues
```bash
# Check logs
railway logs

# Rollback to previous deployment
railway rollback

# Check specific service
railway status
```

### Database Issues
```bash
# Railway auto-backs up PostgreSQL
# Restore from backup in Railway dashboard

# If migration failed, rollback:
railway run npx prisma migrate resolve --rolled-back [migration-name]
```

### Emergency Contacts
- Railway support: support@railway.app
- Sentry: support@sentry.io
- Your team: [List emergency contacts]

---

## ✅ Final Sign-Off

**Deployer**: _________________
**Date**: _________________
**Backend URL**: _________________
**Web URL**: _________________
**TestFlight Link**: _________________

**Checklist completion**: _____ / _____ items

**Ready to deploy?** ☐ Yes ☐ No (fix issues first)

**Notes**:
-
-
-

---

**Good luck with your deployment! 🚀**

**Questions?** See `DEPLOYMENT_GUIDE.md` or `QUICK_DEPLOY.md`
