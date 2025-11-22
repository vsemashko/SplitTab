# Third-Party Services Setup Guide

This guide provides detailed instructions for setting up all third-party services required by SplitTab.

## Table of Contents

1. [Google Cloud Platform](#google-cloud-platform)
2. [Apple Developer Account](#apple-developer-account)
3. [Email Service (SendGrid/Resend)](#email-service-sendgridresend)
4. [AWS S3 Storage](#aws-s3-storage)
5. [Sentry Error Tracking](#sentry-error-tracking)
6. [GitHub Secrets Configuration](#github-secrets-configuration)

---

## Google Cloud Platform

Google Cloud is used for OAuth authentication and Vision API for OCR.

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a Project" → "New Project"
3. Enter project details:
   - **Project name**: `SplitTab Production`
   - **Organization**: Your organization
   - **Location**: Your organization folder
4. Click "Create"

### Step 2: Enable Required APIs

```bash
# Enable APIs using gcloud CLI
gcloud services enable vision.googleapis.com
gcloud services enable oauth2.googleapis.com
gcloud services enable iamcredentials.googleapis.com

# Or enable via Console:
# Navigation Menu → APIs & Services → Library
# Search and enable:
# - Cloud Vision API
# - Google+ API (for OAuth)
```

### Step 3: Setup OAuth 2.0 Credentials

1. **Navigate to Credentials**
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"

2. **Configure OAuth Consent Screen** (first time only)
   - Click "Configure Consent Screen"
   - Select "External" user type
   - Fill in application information:
     - **App name**: SplitTab
     - **User support email**: support@splittab.com
     - **App logo**: Upload SplitTab logo (120x120px)
     - **Application home page**: https://splittab.com
     - **Privacy policy**: https://splittab.com/privacy
     - **Terms of service**: https://splittab.com/terms
   - Add scopes:
     - `email`
     - `profile`
     - `openid`
   - Add test users (for development)
   - Click "Save and Continue"

3. **Create OAuth Client**
   - Return to Credentials → Create Credentials → OAuth client ID
   - Application type: **Web application**
   - Name: `SplitTab Web Client`
   - Authorized JavaScript origins:
     ```
     https://splittab.com
     https://www.splittab.com
     https://staging.splittab.com (for staging)
     http://localhost:3000 (for development)
     ```
   - Authorized redirect URIs:
     ```
     https://splittab.com/auth/google/callback
     https://www.splittab.com/auth/google/callback
     https://staging.splittab.com/auth/google/callback
     http://localhost:3000/auth/google/callback
     ```
   - Click "Create"

4. **Save Credentials**
   - Copy the **Client ID** and **Client Secret**
   - Store securely - you'll need these for environment variables

   ```env
   GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnop.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Step 4: Setup Vision API for OCR

1. **Create Service Account**
   - Go to IAM & Admin → Service Accounts
   - Click "Create Service Account"
   - Service account details:
     - **Name**: `splittab-vision-api`
     - **Description**: Service account for Vision API OCR
   - Click "Create and Continue"

2. **Grant Permissions**
   - Select role: **Cloud Vision API User**
   - Click "Continue" → "Done"

3. **Create Key**
   - Click on the service account you just created
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose **JSON** format
   - Click "Create"
   - A JSON file will download - **keep this secure!**

4. **Configure Application**
   ```bash
   # Upload the JSON key to your server
   # For Railway:
   railway run --environment production -- \
     sh -c 'cat > /app/google-credentials.json' < service-account-key.json

   # Set environment variable
   GOOGLE_APPLICATION_CREDENTIALS=/app/google-credentials.json
   GOOGLE_CLOUD_PROJECT_ID=splittab-production-123456
   ```

   Alternatively, encode as base64 for environment variable:
   ```bash
   cat service-account-key.json | base64 -w 0
   # Then in your application:
   GOOGLE_CREDENTIALS_BASE64=<base64-encoded-json>
   ```

### Step 5: Configure Vision API Settings

1. **Set Quotas** (optional)
   - Go to APIs & Services → Cloud Vision API → Quotas
   - Monitor usage and set alerts
   - Default: 1,000 requests/month free

2. **Enable Billing**
   - Go to Billing → Link a billing account
   - Set up budget alerts

### Google Cloud Configuration Summary

```env
# OAuth
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx

# Vision API
GOOGLE_CLOUD_PROJECT_ID=splittab-production-123456
GOOGLE_APPLICATION_CREDENTIALS=/app/google-credentials.json
# OR
GOOGLE_CREDENTIALS_BASE64=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsC...

# OCR Settings
OCR_PROVIDER=google
OCR_CONFIDENCE_THRESHOLD=0.85
OCR_MAX_RETRIES=3
```

---

## Apple Developer Account

Required for "Sign in with Apple" functionality.

### Step 1: Enroll in Apple Developer Program

1. Go to [Apple Developer](https://developer.apple.com)
2. Click "Account"
3. Enroll in Apple Developer Program ($99/year)
4. Complete enrollment process

### Step 2: Register App ID

1. **Navigate to Identifiers**
   - Log in to [Apple Developer Account](https://developer.apple.com/account)
   - Certificates, Identifiers & Profiles → Identifiers
   - Click "+" to add new identifier

2. **Register App ID**
   - Select "App IDs" → Continue
   - Select "App" → Continue
   - Configure App ID:
     - **Description**: SplitTab
     - **Bundle ID**: `com.splittab.app`
     - **Capabilities**: Check "Sign in with Apple"
   - Click "Continue" → "Register"

### Step 3: Create Service ID

1. **Create Service ID**
   - Identifiers → Click "+"
   - Select "Services IDs" → Continue
   - Service ID details:
     - **Description**: SplitTab Web
     - **Identifier**: `com.splittab.web`
   - Check "Sign in with Apple"
   - Click "Configure"

2. **Configure Service**
   - **Primary App ID**: Select `com.splittab.app`
   - **Domains and Subdomains**:
     ```
     splittab.com
     www.splittab.com
     staging.splittab.com (for staging)
     ```
   - **Return URLs**:
     ```
     https://splittab.com/auth/apple/callback
     https://www.splittab.com/auth/apple/callback
     https://staging.splittab.com/auth/apple/callback
     ```
   - Click "Save" → "Continue" → "Register"

### Step 4: Create Private Key

1. **Generate Key**
   - Certificates, Identifiers & Profiles → Keys
   - Click "+" to create new key
   - Key details:
     - **Key Name**: SplitTab Sign in with Apple Key
     - **Enable**: Check "Sign in with Apple"
   - Click "Configure"
   - Select your Primary App ID: `com.splittab.app`
   - Click "Save" → "Continue" → "Register"

2. **Download Key**
   - Click "Download"
   - Save the `.p8` file securely
   - **Note the Key ID** (10-character string)
   - You can only download this once!

3. **Find Team ID**
   - Go to Account → Membership
   - Copy your **Team ID**

### Step 5: Configure Application

```env
# Apple Sign In
APPLE_CLIENT_ID=com.splittab.web
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_KEY_ID=XXXXXXXXXX
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgxxxxxxxxxxxxxxxx
...
-----END PRIVATE KEY-----
```

For Railway/environment variables, encode the private key:

```bash
# Convert .p8 key to single line
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' AuthKey_XXXXXXXXXX.p8

# Set as environment variable
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIGTA....\n-----END PRIVATE KEY-----"
```

### Apple Developer Configuration Summary

```env
APPLE_CLIENT_ID=com.splittab.web
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_KEY_ID=XXXXXXXXXX
APPLE_PRIVATE_KEY=<private-key-content>
```

---

## Email Service (SendGrid/Resend)

Choose between SendGrid or Resend for transactional emails.

### Option 1: SendGrid (Recommended)

#### Step 1: Create SendGrid Account

1. Go to [SendGrid](https://signup.sendgrid.com)
2. Sign up for free account (100 emails/day free)
3. Verify email address
4. Complete profile setup

#### Step 2: Verify Sender Domain

1. **Single Sender Verification** (Quick start)
   - Settings → Sender Authentication
   - Click "Verify a Single Sender"
   - Fill in details:
     - **From Email**: noreply@splittab.com
     - **From Name**: SplitTab
     - **Reply To**: support@splittab.com
   - Click "Create"
   - Verify email sent to address

2. **Domain Authentication** (Production recommended)
   - Settings → Sender Authentication
   - Click "Authenticate Your Domain"
   - Choose your DNS host
   - Enter domain: `splittab.com`
   - Add DNS records provided by SendGrid:
     ```
     # CNAME records
     Type: CNAME
     Host: em1234.splittab.com
     Value: u1234567.wl123.sendgrid.net

     Type: CNAME
     Host: s1._domainkey.splittab.com
     Value: s1.domainkey.u1234567.wl123.sendgrid.net

     Type: CNAME
     Host: s2._domainkey.splittab.com
     Value: s2.domainkey.u1234567.wl123.sendgrid.net
     ```
   - Click "Verify"

#### Step 3: Create API Key

1. **Generate API Key**
   - Settings → API Keys
   - Click "Create API Key"
   - API Key details:
     - **Name**: SplitTab Production
     - **Permissions**: Full Access (or Restricted with Mail Send)
   - Click "Create & View"
   - **Copy the API key** - you won't see it again!

2. **Configure Application**
   ```env
   EMAIL_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=noreply@splittab.com
   EMAIL_FROM_NAME=SplitTab
   ```

#### Step 4: Setup Email Templates

1. **Create Templates**
   - Email API → Dynamic Templates
   - Click "Create a Dynamic Template"
   - Templates to create:
     - Welcome Email
     - Password Reset
     - Email Verification
     - Expense Notification
     - Settlement Reminder

2. **Design Template** (example: Welcome Email)
   - Click on template → "Add Version"
   - Choose "Blank Template" or "Code Editor"
   - Use this example:

   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <meta charset="utf-8">
     <style>
       body { font-family: Arial, sans-serif; }
       .container { max-width: 600px; margin: 0 auto; padding: 20px; }
       .header { background: #4F46E5; color: white; padding: 20px; }
       .content { padding: 20px; background: #f9fafb; }
     </style>
   </head>
   <body>
     <div class="container">
       <div class="header">
         <h1>Welcome to SplitTab!</h1>
       </div>
       <div class="content">
         <p>Hi {{firstName}},</p>
         <p>Thanks for joining SplitTab! We're excited to help you split bills and manage expenses with friends.</p>
         <a href="{{verificationLink}}" style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; margin: 20px 0;">
           Verify Your Email
         </a>
       </div>
     </div>
   </body>
   </html>
   ```

   - Save template and note the Template ID

### Option 2: Resend (Alternative)

#### Step 1: Create Resend Account

1. Go to [Resend](https://resend.com)
2. Sign up (free tier: 100 emails/day)
3. Verify email

#### Step 2: Add Domain

1. **Add Domain**
   - Click "Domains" → "Add Domain"
   - Enter: `splittab.com`
   - Add DNS records:
     ```
     Type: TXT
     Name: _resend
     Value: resend-verification-xxxxxxxx

     Type: MX
     Name: @
     Priority: 10
     Value: mx.resend.com

     Type: TXT
     Name: @
     Value: v=spf1 include:spf.resend.com ~all
     ```
   - Click "Verify Domain"

#### Step 3: Create API Key

1. **Generate API Key**
   - Click "API Keys" → "Create API Key"
   - Name: Production
   - Permission: Full Access
   - Copy the key

2. **Configure Application**
   ```env
   EMAIL_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=noreply@splittab.com
   EMAIL_PROVIDER=resend
   ```

### Email Service Configuration Summary

```env
# SendGrid
EMAIL_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@splittab.com
EMAIL_FROM_NAME=SplitTab
EMAIL_REPLY_TO=support@splittab.com

# Templates (optional)
EMAIL_TEMPLATE_WELCOME=d-xxxxxxxxxxxxxxxxxxxx
EMAIL_TEMPLATE_PASSWORD_RESET=d-xxxxxxxxxxxxxxxxxxxx
EMAIL_TEMPLATE_VERIFICATION=d-xxxxxxxxxxxxxxxxxxxx
```

---

## AWS S3 Storage

AWS S3 is used for storing receipt images and other user uploads.

### Step 1: Create AWS Account

1. Go to [AWS Console](https://aws.amazon.com)
2. Create account or sign in
3. Complete billing setup

### Step 2: Create S3 Bucket

```bash
# Using AWS CLI
aws s3 mb s3://splittab-prod-uploads --region us-east-1

# Configure bucket settings
aws s3api put-bucket-versioning \
  --bucket splittab-prod-uploads \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket splittab-prod-uploads \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket splittab-prod-uploads \
  --public-access-block-configuration \
    BlockPublicAcls=true,\
    IgnorePublicAcls=true,\
    BlockPublicPolicy=true,\
    RestrictPublicBuckets=true
```

Or using the AWS Console:

1. Navigate to S3 → Create bucket
2. Bucket settings:
   - **Name**: `splittab-prod-uploads`
   - **Region**: us-east-1
   - **Block all public access**: ✓ Enabled
   - **Versioning**: Enabled
   - **Encryption**: AES-256
3. Click "Create bucket"

### Step 3: Configure CORS

```bash
# Create cors.json
cat > cors.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://splittab.com", "https://www.splittab.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

# Apply CORS configuration
aws s3api put-bucket-cors \
  --bucket splittab-prod-uploads \
  --cors-configuration file://cors.json
```

### Step 4: Create IAM User

```bash
# Create IAM user
aws iam create-user --user-name splittab-s3-user

# Create policy
cat > s3-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::splittab-prod-uploads",
        "arn:aws:s3:::splittab-prod-uploads/*"
      ]
    }
  ]
}
EOF

# Create and attach policy
aws iam create-policy \
  --policy-name SplitTabS3Access \
  --policy-document file://s3-policy.json

aws iam attach-user-policy \
  --user-name splittab-s3-user \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/SplitTabS3Access

# Create access key
aws iam create-access-key --user-name splittab-s3-user
```

**Save the access key credentials:**

```json
{
  "AccessKey": {
    "AccessKeyId": "AKIAXXXXXXXXXXXXXXXXX",
    "SecretAccessKey": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

### Step 5: Configure Lifecycle Policy

```bash
# Create lifecycle policy
cat > lifecycle.json <<EOF
{
  "Rules": [
    {
      "Id": "DeleteOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 90
      }
    },
    {
      "Id": "TransitionToIA",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        }
      ]
    }
  ]
}
EOF

# Apply lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
  --bucket splittab-prod-uploads \
  --lifecycle-configuration file://lifecycle.json
```

### AWS S3 Configuration Summary

```env
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=splittab-prod-uploads

# Optional: CloudFront CDN
AWS_CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
AWS_CLOUDFRONT_DOMAIN=d1234567890abc.cloudfront.net
```

---

## Sentry Error Tracking

Sentry provides error tracking and performance monitoring.

### Step 1: Create Sentry Account

1. Go to [Sentry.io](https://sentry.io)
2. Sign up for free account
3. Verify email

### Step 2: Create Project

1. **Create Organization**
   - Organization name: SplitTab
   - Click "Create Organization"

2. **Create Project**
   - Select platform: **Node.js**
   - Alert frequency: Default
   - Project name: `splittab-backend`
   - Click "Create Project"

3. **Get DSN**
   - Copy the DSN from the setup page
   - Format: `https://xxxxx@o123456.ingest.sentry.io/7890123`

### Step 3: Configure Integration

The backend already has Sentry configured in `backend/src/index.ts`:

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: 0.1,
});
```

### Step 4: Configure Alerts

1. **Create Alert Rules**
   - Go to Alerts → Create Alert
   - Alert type: "Issues"
   - Conditions:
     - When: An event is first seen
     - Or: An event occurs more than 100 times in 1 hour
   - Actions:
     - Send notification to: #alerts (Slack)
     - Send email to: dev-team@splittab.com

2. **Configure Integrations**
   - Settings → Integrations
   - Add Slack integration
   - Add GitHub integration (for linking commits)

### Step 5: Set Up Releases

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Configure
export SENTRY_AUTH_TOKEN=your-auth-token
export SENTRY_ORG=splittab
export SENTRY_PROJECT=splittab-backend

# Create release
sentry-cli releases new "v1.0.0"
sentry-cli releases set-commits "v1.0.0" --auto
sentry-cli releases finalize "v1.0.0"

# Add to deployment workflow
sentry-cli releases deploys "v1.0.0" new -e production
```

### Sentry Configuration Summary

```env
SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/7890123
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# For CI/CD
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=splittab
SENTRY_PROJECT=splittab-backend
```

---

## GitHub Secrets Configuration

Add all secrets to GitHub for CI/CD workflows.

### Step 1: Access Repository Secrets

1. Go to GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"

### Step 2: Add Production Secrets

Add these secrets one by one:

```bash
# Database
PRODUCTION_DATABASE_URL=postgresql://user:pass@host:5432/splittab_prod
STAGING_DATABASE_URL=postgresql://user:pass@host:5432/splittab_staging

# Railway
RAILWAY_TOKEN=<railway-api-token>

# AWS (if using)
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1

# Google Cloud
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_CREDENTIALS_BASE64=<base64-encoded-json>

# Apple
APPLE_PRIVATE_KEY=<private-key-content>
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_KEY_ID=XXXXXXXXXX

# Email
EMAIL_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Sentry
SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/7890123
SENTRY_AUTH_TOKEN=your-auth-token

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX

# API Keys (for testing)
STAGING_API_KEY=<generate-random-key>

# Security
SNYK_TOKEN=<snyk-api-token>
```

### Step 3: Verify Secrets

```bash
# Test that secrets are available in workflow
# Add this to a test workflow:
- name: Test secrets
  env:
    DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
  run: |
    if [ -z "$DATABASE_URL" ]; then
      echo "DATABASE_URL not set!"
      exit 1
    fi
    echo "Secrets configured correctly"
```

---

## Validation Checklist

After completing all setups:

- [ ] Google OAuth working
- [ ] Google Vision API OCR working
- [ ] Apple Sign In working
- [ ] Email sending working
- [ ] S3 file uploads working
- [ ] Sentry error tracking working
- [ ] All GitHub secrets configured
- [ ] All environment variables set
- [ ] All services tested in staging

---

## Cost Summary

| Service | Free Tier | Paid Plan (Est.) |
|---------|-----------|------------------|
| Google Cloud (Vision API) | 1,000 requests/month | $1.50/1,000 requests |
| Apple Developer | - | $99/year |
| SendGrid | 100 emails/day | $15-20/month (40k emails) |
| AWS S3 | 5 GB storage | $0.023/GB/month |
| Sentry | 5,000 errors/month | $26/month (50k errors) |
| **Total** | Free tier covers development | **~$50-80/month** |

---

## Support Resources

- **Google Cloud**: [support.google.com/cloud](https://support.google.com/cloud)
- **Apple Developer**: [developer.apple.com/support](https://developer.apple.com/support)
- **SendGrid**: [support.sendgrid.com](https://support.sendgrid.com)
- **AWS**: [aws.amazon.com/support](https://aws.amazon.com/support)
- **Sentry**: [sentry.io/support](https://sentry.io/support)

---

**Last Updated:** November 2025
**Maintained by:** SplitTab DevOps Team
