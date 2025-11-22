# SplitTab Deployment Quick Start

This guide gets you from code to production in the fastest way possible.

## Prerequisites Checklist

- [ ] GitHub account
- [ ] Railway account (or AWS account)
- [ ] Domain name (optional but recommended)
- [ ] Google Cloud account (for OAuth + OCR)
- [ ] Apple Developer account ($99/year)
- [ ] Sentry.io account (free tier)
- [ ] SendGrid or Resend account (free tier)

## 🚀 5-Minute Railway Deployment

### 1. Fork & Clone Repository

```bash
git clone https://github.com/yourusername/SplitTab.git
cd SplitTab
```

### 2. Set Up Railway Project

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create new project
railway init
```

### 3. Create Services

#### PostgreSQL Database
```bash
railway add postgres
```

#### Redis Cache
```bash
railway add redis
```

#### Backend API
```bash
# Link to your service
railway link

# Set environment variables
railway variables set NODE_ENV=production
railway variables set JWT_ACCESS_SECRET=$(openssl rand -base64 64)
railway variables set JWT_REFRESH_SECRET=$(openssl rand -base64 64)

# Deploy
cd backend && railway up
```

### 4. Configure Environment Variables

In Railway dashboard, add these required variables:

**Required:**
```bash
SENTRY_DSN=https://...@sentry.io/...
ALLOWED_ORIGINS=https://yourdomain.com
EMAIL_FROM=noreply@yourdomain.com
EMAIL_API_KEY=your_sendgrid_key
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=splittab-production
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CLOUD_PROJECT_ID=...
```

### 5. Run Database Migrations

```bash
railway run npx prisma migrate deploy
```

### 6. Verify Deployment

```bash
# Get your Railway URL
railway domain

# Test health endpoint
curl https://your-app.railway.app/health
```

## ✅ You're Live!

Your backend is now running in production!

## Next Steps

### 1. Set Up Domain (Optional)

In Railway dashboard:
1. Go to Settings → Domains
2. Add custom domain: `api.yourdomain.com`
3. Update DNS records as shown
4. Wait for SSL certificate (automatic)

### 2. Set Up Monitoring

1. **Sentry**: Already configured via `SENTRY_DSN`
2. **Railway Metrics**: Available in dashboard
3. **Custom Monitoring**: See [RUNBOOK.md](./RUNBOOK.md)

### 3. Configure CI/CD

Our GitHub Actions are already set up! Just add secrets to your GitHub repo:

**Settings → Secrets → Actions → New repository secret**

```
RAILWAY_TOKEN=... (from `railway whoami --token`)
SENTRY_AUTH_TOKEN=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

Now every push to `main` auto-deploys to staging!

### 4. Enable Production Deployments

For production deployments via tags:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers the production deployment workflow with approval gates.

## 🔥 Common Issues

### "Database connection failed"

Check that `DATABASE_URL` is set correctly:
```bash
railway variables get DATABASE_URL
```

### "Redis connection failed"

Verify Redis is running:
```bash
railway service
```

### "Migrations failed"

Reset and try again:
```bash
railway run npx prisma migrate reset --force
railway run npx prisma migrate deploy
```

## 📚 Full Documentation

- **Infrastructure Setup**: [INFRASTRUCTURE_SETUP.md](./INFRASTRUCTURE_SETUP.md)
- **Third-Party Services**: [THIRD_PARTY_SERVICES.md](./THIRD_PARTY_SERVICES.md)
- **Database Migrations**: [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md)
- **Operations Runbook**: [RUNBOOK.md](./RUNBOOK.md)

## 💰 Cost Estimate

**Railway (Recommended for MVP):**
- PostgreSQL: ~$5-10/month
- Redis: ~$5-10/month
- Backend API: ~$5-20/month
- Worker: ~$5-10/month
- **Total: ~$50-100/month**

**Third-Party Services (Free Tier):**
- Sentry: Free (10k events/month)
- SendGrid: Free (100 emails/day)
- Google Cloud: Pay-as-you-go (~$5-20/month)
- AWS S3: Pay-as-you-go (~$5-10/month)

**Total Estimated Cost: ~$60-130/month**

## 🎯 Production Checklist

Before going live to real users:

- [ ] All environment variables configured
- [ ] Database migrations tested in staging
- [ ] Domain and SSL configured
- [ ] Sentry error tracking working
- [ ] Email sending verified
- [ ] OAuth flows tested (Google, Apple)
- [ ] File uploads working (S3)
- [ ] OCR processing tested
- [ ] Load testing completed (see [RUNBOOK.md](./RUNBOOK.md))
- [ ] Security audit passed
- [ ] Monitoring and alerts configured
- [ ] Backup strategy in place
- [ ] Terms of Service published
- [ ] Privacy Policy published

## 🆘 Need Help?

- Check [RUNBOOK.md](./RUNBOOK.md) for troubleshooting
- Review [GitHub Issues](https://github.com/yourusername/SplitTab/issues)
- Join our Discord/Slack (if available)

## 🔐 Security Notes

- **NEVER** commit `.env` files
- **ALWAYS** use secrets management
- **ROTATE** JWT secrets regularly
- **ENABLE** two-factor auth on all services
- **MONITOR** Sentry for security alerts

---

**Ready to deploy?** Start with Step 1 above! 🚀
