#!/bin/bash

# SplitTab Web App Deployment Script for Vercel
# This script automates the deployment of the SplitTab web app to Vercel

set -e  # Exit on error

echo "🚀 SplitTab Web App - Vercel Deployment Script"
echo "=============================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo "Install it with: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found"
echo ""

# Prompt for environment variables
echo "📋 Please provide the following information:"
echo ""

read -p "Enter your backend API URL (e.g., https://api.splittab.com): " API_URL
read -p "Enter your Google Client ID: " GOOGLE_CLIENT_ID
read -p "Enter your Apple Client ID: " APPLE_CLIENT_ID
read -p "Enter your app domain (e.g., https://splittab.com): " APP_URL
read -p "Enter Sentry DSN for web (optional, press Enter to skip): " SENTRY_DSN

echo ""

# Navigate to web directory
cd "$(dirname "$0")/../web"

echo "🚀 Deploying web app to Vercel..."
echo ""

# Deploy to Vercel
vercel --prod

echo ""
echo "📊 Setting environment variables..."
echo ""

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL production <<< "$API_URL"
vercel env add NEXT_PUBLIC_API_VERSION production <<< "v1"
vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID production <<< "$GOOGLE_CLIENT_ID"
vercel env add NEXT_PUBLIC_APPLE_CLIENT_ID production <<< "$APPLE_CLIENT_ID"
vercel env add NEXT_PUBLIC_APP_NAME production <<< "SplitTab"
vercel env add NEXT_PUBLIC_APP_URL production <<< "$APP_URL"
vercel env add NEXT_PUBLIC_ENABLE_ANALYTICS production <<< "true"
vercel env add NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS production <<< "false"

if [ -n "$SENTRY_DSN" ]; then
    vercel env add NEXT_PUBLIC_SENTRY_DSN production <<< "$SENTRY_DSN"
fi

echo ""
echo "✅ Environment variables set successfully"
echo ""

echo "🚀 Redeploying with environment variables..."
vercel --prod

echo ""
echo "================================================"
echo "✅ Web app deployment complete!"
echo ""
echo "Next steps:"
echo "1. Visit your Vercel URL and test the app"
echo "2. Try registering a new account"
echo "3. Test login with Google OAuth"
echo "4. Create a test expense"
echo "5. Configure custom domain in Vercel dashboard (optional)"
echo "6. Update backend ALLOWED_ORIGINS if using custom domain"
echo ""
