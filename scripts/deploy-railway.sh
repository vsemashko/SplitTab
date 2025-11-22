#!/bin/bash

# SplitTab Backend Deployment Script for Railway
# This script automates the deployment of the SplitTab backend to Railway

set -e  # Exit on error

echo "🚀 SplitTab Backend - Railway Deployment Script"
echo "================================================"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo "Install it with: npm install -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI found"
echo ""

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway..."
    railway login
fi

echo "✅ Logged in to Railway"
echo ""

# Prompt for environment variables
echo "📋 Please provide the following information:"
echo ""

read -p "Enter your domain (e.g., splittab.com): " DOMAIN
read -p "Enter Google Client ID: " GOOGLE_CLIENT_ID
read -s -p "Enter Google Client Secret: " GOOGLE_CLIENT_SECRET
echo ""
read -p "Enter Google Cloud Project ID: " GOOGLE_CLOUD_PROJECT_ID
read -p "Enter Apple Client ID: " APPLE_CLIENT_ID
read -p "Enter Apple Team ID: " APPLE_TEAM_ID
read -p "Enter Apple Key ID: " APPLE_KEY_ID
read -s -p "Enter Apple Private Key (multiline, end with Ctrl+D): " APPLE_PRIVATE_KEY
echo ""
read -s -p "Enter SendGrid API Key: " EMAIL_API_KEY
echo ""
read -p "Enter AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -s -p "Enter AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
echo ""
read -p "Enter AWS S3 Bucket Name: " AWS_S3_BUCKET
read -p "Enter Sentry DSN: " SENTRY_DSN
echo ""

# Pre-generated secure secrets (from deployment guide)
JWT_ACCESS_SECRET="sLd/yAdXdCwxybT4ht1JCb7SIB8RORSOgFvDIFBeR8ai2Yve4xRL+I38z8aOnx459KemwXizjKeCAdA04/gWLw=="
JWT_REFRESH_SECRET="cYs97jI4AcBrmDKHDrkid66kFztaRt/jv5a4oh3mGaFiFe2acSm6aNdgwaf6JWR7PDYJC5yp+XRzS5A0SD1iSg=="

echo ""
echo "📦 Setting environment variables in Railway..."
echo ""

# Set all environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set API_VERSION=v1

railway variables set JWT_ACCESS_SECRET="$JWT_ACCESS_SECRET"
railway variables set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
railway variables set JWT_ACCESS_EXPIRY=15m
railway variables set JWT_REFRESH_EXPIRY=30d

railway variables set ALLOWED_ORIGINS="https://$DOMAIN,https://www.$DOMAIN"

railway variables set EMAIL_FROM="noreply@$DOMAIN"
railway variables set EMAIL_API_KEY="$EMAIL_API_KEY"

railway variables set GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID"
railway variables set GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET"
railway variables set GOOGLE_CLOUD_PROJECT_ID="$GOOGLE_CLOUD_PROJECT_ID"

railway variables set APPLE_CLIENT_ID="$APPLE_CLIENT_ID"
railway variables set APPLE_TEAM_ID="$APPLE_TEAM_ID"
railway variables set APPLE_KEY_ID="$APPLE_KEY_ID"
railway variables set APPLE_PRIVATE_KEY="$APPLE_PRIVATE_KEY"

railway variables set AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID"
railway variables set AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"
railway variables set AWS_REGION=us-east-1
railway variables set AWS_S3_BUCKET="$AWS_S3_BUCKET"

railway variables set SENTRY_DSN="$SENTRY_DSN"

railway variables set OCR_PROVIDER=google
railway variables set OCR_CONFIDENCE_THRESHOLD=0.8
railway variables set OCR_MAX_RETRIES=3

railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set RATE_LIMIT_MAX_REQUESTS=100

railway variables set MAX_FILE_SIZE=5242880

echo "✅ Environment variables set successfully"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/../backend"

echo "🚀 Deploying backend to Railway..."
railway up

echo ""
echo "📊 Running database migrations..."
railway run npx prisma migrate deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 Testing deployment..."
RAILWAY_URL=$(railway domain)

if [ -n "$RAILWAY_URL" ]; then
    echo "Railway URL: $RAILWAY_URL"
    echo ""
    echo "Testing health endpoint..."
    curl -f "$RAILWAY_URL/health" || echo "⚠️  Health check failed - backend may still be starting up"
else
    echo "⚠️  Could not get Railway URL. Check Railway dashboard for deployment status."
fi

echo ""
echo "================================================"
echo "✅ Backend deployment complete!"
echo ""
echo "Next steps:"
echo "1. Verify health check: curl https://your-url.railway.app/health"
echo "2. Configure custom domain in Railway dashboard (optional)"
echo "3. Update CORS origins if using custom domain"
echo "4. Deploy web app to Vercel (run scripts/deploy-vercel.sh)"
echo ""
