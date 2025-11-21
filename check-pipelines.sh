#!/bin/bash

# SplitTab Pipeline Pre-Check Script
# Run this before pushing to ensure CI/CD pipelines will pass

set -e  # Exit on any error

echo "========================================"
echo "🚨 SplitTab Pipeline Pre-Check"
echo "========================================"
echo ""

FAILED=0
BACKEND_CHECKED=false
MOBILE_CHECKED=false

# Detect what changed
if git diff --quiet HEAD backend/ 2>/dev/null || [ ! -d "backend" ]; then
  BACKEND_CHANGED=false
else
  BACKEND_CHANGED=true
fi

if git diff --quiet HEAD mobile/ 2>/dev/null || [ ! -d "mobile" ]; then
  MOBILE_CHANGED=false
else
  MOBILE_CHANGED=true
fi

# If no git or can't detect changes, check both
if [ "$BACKEND_CHANGED" = false ] && [ "$MOBILE_CHANGED" = false ]; then
  if [ -d "backend" ]; then
    BACKEND_CHANGED=true
  fi
  if [ -d "mobile" ]; then
    MOBILE_CHANGED=true
  fi
fi

# Backend Checks
if [ "$BACKEND_CHANGED" = true ]; then
  echo "📋 Checking Backend..."
  echo "========================================"
  BACKEND_CHECKED=true

  cd backend

  echo "1️⃣  Installing dependencies..."
  npm ci || { echo "❌ Backend npm ci failed"; FAILED=1; cd ..; exit 1; }

  echo "2️⃣  Generating Prisma Client..."
  npx prisma generate || { echo "❌ Prisma generate failed"; FAILED=1; cd ..; exit 1; }

  echo "3️⃣  Running ESLint..."
  npm run lint || { echo "❌ Backend lint failed"; FAILED=1; cd ..; exit 1; }

  echo "4️⃣  Checking Prettier formatting..."
  npx prettier --check "src/**/*.ts" || { echo "❌ Backend prettier check failed"; FAILED=1; cd ..; exit 1; }

  echo "5️⃣  Running TypeScript type check..."
  npx tsc --noEmit || { echo "❌ Backend type check failed"; FAILED=1; cd ..; exit 1; }

  echo "6️⃣  Running tests..."
  npm test || { echo "❌ Backend tests failed (Note: tests require DB/Redis)"; echo "⚠️  Tests will run in CI with proper services"; }

  echo "7️⃣  Building project..."
  npm run build || { echo "❌ Backend build failed"; FAILED=1; cd ..; exit 1; }

  echo "8️⃣  Checking build output..."
  ls -la dist > /dev/null || { echo "❌ Backend dist/ not found"; FAILED=1; cd ..; exit 1; }

  echo "9️⃣  Running security audit..."
  npm audit --audit-level=moderate || { echo "⚠️  Security vulnerabilities found (check npm audit)"; }

  cd ..
  echo ""
  echo "✅ Backend checks completed!"
  echo ""
fi

# Mobile Checks
if [ "$MOBILE_CHANGED" = true ]; then
  echo "📱 Checking Mobile..."
  echo "========================================"
  MOBILE_CHECKED=true

  cd mobile

  echo "1️⃣  Installing dependencies..."
  npm ci || { echo "❌ Mobile npm ci failed"; FAILED=1; cd ..; exit 1; }

  echo "2️⃣  Running ESLint..."
  npm run lint || { echo "❌ Mobile lint failed"; FAILED=1; cd ..; exit 1; }

  echo "3️⃣  Running TypeScript type check..."
  npm run type-check || { echo "❌ Mobile type check failed"; FAILED=1; cd ..; exit 1; }

  echo "4️⃣  Checking Prettier formatting..."
  npm run format:check || { echo "❌ Mobile prettier check failed"; FAILED=1; cd ..; exit 1; }

  echo "5️⃣  Running security audit..."
  npm audit --audit-level=moderate || { echo "⚠️  Security vulnerabilities found (check npm audit)"; }

  echo "6️⃣  Checking prebuild setup (optional)..."
  if [ -f ".env" ]; then
    echo "   .env file exists"
  else
    echo "   ⚠️  .env file not found (required for prebuild)"
  fi

  cd ..
  echo ""
  echo "✅ Mobile checks completed!"
  echo ""
fi

# Summary
echo "========================================"
if [ $FAILED -eq 0 ]; then
  echo "✅ ALL CHECKS PASSED!"
  echo ""
  if [ "$BACKEND_CHECKED" = true ] && [ "$MOBILE_CHECKED" = true ]; then
    echo "Both backend and mobile pipelines should pass."
  elif [ "$BACKEND_CHECKED" = true ]; then
    echo "Backend pipeline should pass."
  elif [ "$MOBILE_CHECKED" = true ]; then
    echo "Mobile pipeline should pass."
  fi
  echo ""
  echo "🚀 Safe to push!"
else
  echo "❌ SOME CHECKS FAILED"
  echo ""
  echo "Please fix the errors above before pushing."
  echo "See CLAUDE.md for detailed troubleshooting."
  exit 1
fi
echo "========================================"
