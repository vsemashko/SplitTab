# 🔑 Third-Party Services Setup Checklist

This checklist helps you track which services you've set up. Check off each item as you complete it.

**Estimated Total Time**: 4-6 hours
**Cost**: $99/year + $60-130/month

---

## ✅ Setup Progress Tracker

### 1. Google Cloud Platform (2 hours)
**Cost**: Free tier (1,000 Vision API requests/month)

- [ ] Created Google Cloud account
- [ ] Created project: `splittab-prod`
- [ ] Enabled Google+ API (for OAuth)
- [ ] Enabled Cloud Vision API (for OCR)
- [ ] Created OAuth 2.0 credentials
  - [ ] Configured consent screen
  - [ ] Added authorized redirect URIs:
    - [ ] Development: `http://localhost:3000/api/v1/auth/google/callback`
    - [ ] Production: `https://YOUR_DOMAIN/api/v1/auth/google/callback`
    - [ ] Web app: `https://YOUR_WEB_APP/auth/callback`
  - [ ] Copied Client ID: `_____________________`
  - [ ] Copied Client Secret: `_____________________`
- [ ] Created service account for Vision API
  - [ ] Downloaded JSON key file
  - [ ] Renamed to `google-cloud-credentials.json`
  - [ ] Placed in `backend/` directory
- [ ] **Updated .env.production**:
  ```bash
  GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=your-client-secret
  GOOGLE_CLOUD_PROJECT_ID=splittab-prod
  ```

**Documentation**: https://console.cloud.google.com

---

### 2. Apple Developer Account (1 hour)
**Cost**: $99/year

- [ ] Enrolled in Apple Developer Program ($99/year)
- [ ] Account activated (can take 24-48 hours)
- [ ] Registered App ID
  - [ ] Bundle ID: `com.yourcompany.splittab`
  - [ ] Enabled "Sign in with Apple" capability
- [ ] Created Service ID
  - [ ] Identifier: `com.yourcompany.splittab.web`
  - [ ] Enabled "Sign in with Apple"
  - [ ] Configured Website URLs:
    - [ ] Domain: `_____________________`
    - [ ] Return URL: `https://YOUR_DOMAIN/api/v1/auth/apple/callback`
- [ ] Generated private key (.p8 file)
  - [ ] Downloaded and saved securely
  - [ ] Copied Key ID: `_____________________`
  - [ ] Copied Team ID: `_____________________`
- [ ] **Updated .env.production**:
  ```bash
  APPLE_CLIENT_ID=com.yourcompany.splittab.web
  APPLE_TEAM_ID=YOUR_TEAM_ID
  APPLE_KEY_ID=YOUR_KEY_ID
  APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
  ```

**Documentation**: https://developer.apple.com/account

---

### 3. Email Service (30 minutes)
**Cost**: Free tier (100 emails/day), then $19.95/month

**Option A: SendGrid** (Recommended)
- [ ] Created SendGrid account
- [ ] Verified sender email address
- [ ] Created API key
  - [ ] Name: `SplitTab Production`
  - [ ] Permissions: Full Access
  - [ ] Copied API key: `SG._____________________`
- [ ] **Updated .env.production**:
  ```bash
  EMAIL_FROM=noreply@yourdomain.com
  EMAIL_API_KEY=SG.your-sendgrid-api-key
  ```

**Option B: Resend** (Alternative)
- [ ] Created Resend account
- [ ] Added domain (or using onboarding.resend.dev)
- [ ] Created API key
  - [ ] Copied API key: `re._____________________`
- [ ] **Updated .env.production**:
  ```bash
  EMAIL_FROM=noreply@yourdomain.com
  EMAIL_API_KEY=re.your-resend-api-key
  ```

**Documentation**:
- SendGrid: https://sendgrid.com
- Resend: https://resend.com

---

### 4. AWS Account & S3 (1 hour)
**Cost**: ~$5-10/month (pay-as-you-go)

- [ ] Created AWS account
- [ ] Created S3 bucket
  - [ ] Bucket name: `splittab-receipts-prod` (must be unique)
  - [ ] Region: `us-east-1` (or preferred)
  - [ ] Disabled "Block all public access" (for CORS)
  - [ ] Enabled versioning
- [ ] Configured CORS policy
  - [ ] Added allowed origins (localhost + production domains)
- [ ] Created IAM user
  - [ ] Username: `splittab-s3-user`
  - [ ] Access type: Programmatic
  - [ ] Attached policy: `AmazonS3FullAccess`
  - [ ] Copied Access Key ID: `AKIA_____________________`
  - [ ] Copied Secret Access Key: `_____________________`
- [ ] Verified Textract availability in region (for OCR)
- [ ] **Updated .env.production**:
  ```bash
  AWS_ACCESS_KEY_ID=AKIA...
  AWS_SECRET_ACCESS_KEY=your-secret-key
  AWS_REGION=us-east-1
  AWS_S3_BUCKET=splittab-receipts-prod
  AWS_TEXTRACT_REGION=us-east-1
  ```

**Documentation**: https://console.aws.amazon.com

---

### 5. Sentry Error Tracking (30 minutes)
**Cost**: Free tier (10,000 events/month)

- [ ] Created Sentry account
- [ ] Created Backend project
  - [ ] Platform: Node.js
  - [ ] Project name: `splittab-backend`
  - [ ] Copied DSN: `https://___@___.ingest.sentry.io/___`
- [ ] Created Web project
  - [ ] Platform: Next.js
  - [ ] Project name: `splittab-web`
  - [ ] Copied DSN: `https://___@___.ingest.sentry.io/___`
- [ ] Created iOS project
  - [ ] Platform: iOS
  - [ ] Project name: `splittab-ios`
  - [ ] Copied DSN: `https://___@___.ingest.sentry.io/___`
- [ ] **Updated .env.production** (backend):
  ```bash
  SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
  ```
- [ ] **Updated web/.env.production.local**:
  ```bash
  NEXT_PUBLIC_SENTRY_DSN=https://your-web-sentry-dsn
  ```
- [ ] **Updated ios/SplitTab/Config.swift**:
  ```swift
  static let sentryDSN = "https://your-ios-sentry-dsn"
  ```

**Documentation**: https://sentry.io

---

### 6. Railway (Hosting Platform) (30 minutes)
**Cost**: $50-100/month

- [ ] Created Railway account
- [ ] Added payment method
- [ ] Installed Railway CLI: `npm install -g @railway/cli`
- [ ] Logged in: `railway login`

**No additional configuration needed** - will be done during deployment

**Documentation**: https://railway.app

---

### 7. Vercel (Web Hosting) (15 minutes)
**Cost**: Free tier

- [ ] Created Vercel account
- [ ] Connected GitHub repository
- [ ] Installed Vercel CLI: `npm install -g vercel`
- [ ] Logged in: `vercel login`

**No additional configuration needed** - will be done during deployment

**Documentation**: https://vercel.com

---

### 8. Domain Name (Optional but Recommended) (30 minutes)
**Cost**: $15/year

- [ ] Registered domain name
  - [ ] Domain: `_____________________`
  - [ ] Registrar: (Namecheap, Google Domains, etc.)
- [ ] DNS configured:
  - [ ] A record for API: `api.yourdomain.com` → Railway
  - [ ] CNAME for web: `app.yourdomain.com` → Vercel
  - [ ] MX records for email (if using custom domain)
- [ ] SSL certificates configured (auto via Railway/Vercel)

---

## 📝 Configuration Files Summary

Once all services are set up, you should have updated these files:

### Backend Configuration
- [ ] `backend/.env.production` - All backend environment variables
- [ ] `backend/google-cloud-credentials.json` - GCP service account key
- [ ] All values in .env.production are filled in (no placeholders)

### Web Configuration
- [ ] `web/.env.production.local` - Web app environment variables
- [ ] API URL points to deployed backend
- [ ] Sentry DSN configured

### iOS Configuration
- [ ] `ios/SplitTab/Config.swift` - iOS configuration
- [ ] Backend URL updated
- [ ] Sentry DSN updated
- [ ] Bundle ID matches Apple Developer account

---

## ✅ Final Verification Checklist

Before deploying, verify:

- [ ] All API keys are valid (test each service)
- [ ] No placeholder values remain in config files
- [ ] .env.production is in .gitignore (NEVER commit secrets!)
- [ ] All credentials are stored securely (password manager)
- [ ] Backup copies of all keys/credentials saved
- [ ] Team members have access to credentials (if applicable)

---

## 🚀 Ready to Deploy?

Once all items are checked:

1. **Deploy Backend**: Run `./backend/railway-deploy.sh`
2. **Deploy Web**: Run `cd web && vercel --prod`
3. **Deploy iOS**: Archive and upload to TestFlight

See `DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

---

## 📞 Support

If you encounter issues:
- Check service status pages
- Review API documentation
- Contact service support teams
- See `docs/THIRD_PARTY_SERVICES.md` for detailed setup guides

---

## 💾 Backup Your Credentials

**IMPORTANT**: Save all credentials securely!

Recommended tools:
- 1Password
- LastPass
- Bitwarden
- Encrypted file

Store:
- All API keys
- Service account JSON files
- Apple .p8 private key
- JWT secrets
- Database passwords

---

**Last Updated**: 2025-11-22
**Next Review**: After first deployment
