#!/bin/bash

# SplitTab Railway Deployment Script
# This script automates the deployment of SplitTab backend to Railway

set -e  # Exit on error

echo "🚀 SplitTab Railway Deployment Script"
echo "======================================"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
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

# Check if we're in a Railway project
if ! railway status &> /dev/null; then
    echo "📁 No Railway project found. Initializing..."
    railway init
    echo "✅ Project initialized"
    echo ""

    echo "📦 Adding PostgreSQL..."
    railway add postgresql
    echo "✅ PostgreSQL added"
    echo ""

    echo "📦 Adding Redis..."
    railway add redis
    echo "✅ Redis added"
    echo ""
else
    echo "✅ Railway project detected"
    echo ""
fi

# Generate JWT secrets if not provided
if [ -z "$JWT_ACCESS_SECRET" ]; then
    echo "🔑 Generating JWT secrets..."
    export JWT_ACCESS_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    export JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    echo "✅ JWT secrets generated"
    echo ""
fi

# Set environment variables
echo "⚙️  Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set API_VERSION=v1
railway variables set JWT_ACCESS_SECRET="$JWT_ACCESS_SECRET"
railway variables set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
railway variables set JWT_ACCESS_EXPIRY=15m
railway variables set JWT_REFRESH_EXPIRY=30d
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set RATE_LIMIT_MAX_REQUESTS=100
railway variables set LOG_LEVEL=info
railway variables set OCR_CONFIDENCE_THRESHOLD=0.8
railway variables set OCR_MAX_RETRIES=3
railway variables set OCR_QUEUE_CONCURRENCY=5

echo "✅ Basic variables set"
echo ""

# Check for .env.production file with third-party credentials
if [ -f ".env.production" ]; then
    echo "📋 Found .env.production file. Loading third-party credentials..."

    # Source the file to get variables
    set -a
    source .env.production
    set +a

    # Set all variables from .env.production
    [ ! -z "$ALLOWED_ORIGINS" ] && railway variables set ALLOWED_ORIGINS="$ALLOWED_ORIGINS"
    [ ! -z "$EMAIL_FROM" ] && railway variables set EMAIL_FROM="$EMAIL_FROM"
    [ ! -z "$EMAIL_API_KEY" ] && railway variables set EMAIL_API_KEY="$EMAIL_API_KEY"
    [ ! -z "$GOOGLE_CLIENT_ID" ] && railway variables set GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID"
    [ ! -z "$GOOGLE_CLIENT_SECRET" ] && railway variables set GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET"
    [ ! -z "$APPLE_CLIENT_ID" ] && railway variables set APPLE_CLIENT_ID="$APPLE_CLIENT_ID"
    [ ! -z "$APPLE_TEAM_ID" ] && railway variables set APPLE_TEAM_ID="$APPLE_TEAM_ID"
    [ ! -z "$APPLE_KEY_ID" ] && railway variables set APPLE_KEY_ID="$APPLE_KEY_ID"
    [ ! -z "$APPLE_PRIVATE_KEY" ] && railway variables set APPLE_PRIVATE_KEY="$APPLE_PRIVATE_KEY"
    [ ! -z "$AWS_ACCESS_KEY_ID" ] && railway variables set AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID"
    [ ! -z "$AWS_SECRET_ACCESS_KEY" ] && railway variables set AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"
    [ ! -z "$AWS_REGION" ] && railway variables set AWS_REGION="$AWS_REGION"
    [ ! -z "$AWS_S3_BUCKET" ] && railway variables set AWS_S3_BUCKET="$AWS_S3_BUCKET"
    [ ! -z "$OCR_PROVIDER" ] && railway variables set OCR_PROVIDER="$OCR_PROVIDER"
    [ ! -z "$GOOGLE_CLOUD_PROJECT_ID" ] && railway variables set GOOGLE_CLOUD_PROJECT_ID="$GOOGLE_CLOUD_PROJECT_ID"
    [ ! -z "$SENTRY_DSN" ] && railway variables set SENTRY_DSN="$SENTRY_DSN"

    # Handle Google Cloud credentials file
    if [ -f "google-cloud-credentials.json" ]; then
        echo "📄 Found Google Cloud credentials. Converting to base64..."
        GCP_CREDS_BASE64=$(cat google-cloud-credentials.json | base64 | tr -d '\n')
        railway variables set GOOGLE_APPLICATION_CREDENTIALS_BASE64="$GCP_CREDS_BASE64"
        echo "✅ Google Cloud credentials set"
    fi

    echo "✅ Third-party credentials loaded"
    echo ""
else
    echo "⚠️  No .env.production file found"
    echo "📝 Please create .env.production with your third-party API keys"
    echo "   See .env.production.example for reference"
    echo ""
fi

# Deploy the application
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo ""

# Run database migrations
echo "🗄️  Running database migrations..."
railway run npx prisma migrate deploy

echo "✅ Migrations complete!"
echo ""

# Get the deployment URL
echo "🌐 Getting deployment URL..."
RAILWAY_URL=$(railway status 2>/dev/null | grep -oP 'https://[^\s]+' | head -1)

if [ ! -z "$RAILWAY_URL" ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🎉 Your backend is live at:"
    echo "   $RAILWAY_URL"
    echo ""
    echo "📊 Test your deployment:"
    echo "   curl $RAILWAY_URL/api/v1/health"
    echo ""
else
    echo "⚠️  Could not retrieve deployment URL"
    echo "   Run 'railway status' to get your URL"
    echo ""
fi

echo "📝 Next steps:"
echo "   1. Test the health endpoint"
echo "   2. Update your frontend NEXT_PUBLIC_API_URL"
echo "   3. Deploy your web app to Vercel"
echo "   4. Update iOS Config.swift with backend URL"
echo ""
echo "🎊 Happy deploying!"
