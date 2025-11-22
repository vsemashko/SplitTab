#!/bin/bash

# SplitTab Service Validation Script
# Tests all third-party service credentials to ensure they're configured correctly

set -e

echo "🔍 SplitTab Service Validation"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f ".env.production" ]; then
    echo "📋 Loading .env.production..."
    set -a
    source .env.production
    set +a
    echo "✅ Environment loaded"
    echo ""
else
    echo "❌ .env.production not found!"
    echo "   Create this file with your production credentials"
    exit 1
fi

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test function
test_service() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    SERVICE=$1
    echo -n "Testing $SERVICE... "
}

pass_test() {
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}✓ PASS${NC}"
}

fail_test() {
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo -e "${RED}✗ FAIL${NC}: $1"
}

warn_test() {
    echo -e "${YELLOW}⚠ WARN${NC}: $1"
}

echo "🔐 Testing JWT Configuration..."
echo "================================"

# Test JWT secrets
test_service "JWT Access Secret"
if [ -z "$JWT_ACCESS_SECRET" ]; then
    fail_test "Not set"
elif [ ${#JWT_ACCESS_SECRET} -lt 32 ]; then
    fail_test "Too short (minimum 32 characters)"
else
    pass_test
fi

test_service "JWT Refresh Secret"
if [ -z "$JWT_REFRESH_SECRET" ]; then
    fail_test "Not set"
elif [ ${#JWT_REFRESH_SECRET} -lt 32 ]; then
    fail_test "Too short (minimum 32 characters)"
elif [ "$JWT_ACCESS_SECRET" = "$JWT_REFRESH_SECRET" ]; then
    fail_test "Should be different from access secret"
else
    pass_test
fi

echo ""
echo "📧 Testing Email Service..."
echo "==========================="

test_service "Email Configuration"
if [ -z "$EMAIL_FROM" ]; then
    fail_test "EMAIL_FROM not set"
elif [ -z "$EMAIL_API_KEY" ]; then
    fail_test "EMAIL_API_KEY not set"
else
    # Test SendGrid
    if [[ $EMAIL_API_KEY == SG.* ]]; then
        echo -n "SendGrid... "
        RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $EMAIL_API_KEY" \
            https://api.sendgrid.com/v3/user/profile)

        if [ "$RESPONSE" = "200" ]; then
            pass_test
        else
            fail_test "Invalid API key (HTTP $RESPONSE)"
        fi
    # Test Resend
    elif [[ $EMAIL_API_KEY == re_* ]]; then
        echo -n "Resend... "
        RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $EMAIL_API_KEY" \
            https://api.resend.com/emails)

        if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "422" ]; then
            pass_test
        else
            fail_test "Invalid API key (HTTP $RESPONSE)"
        fi
    else
        warn_test "Unknown email provider (cannot validate)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
fi

echo ""
echo "☁️  Testing AWS Services..."
echo "=========================="

test_service "AWS Credentials"
if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    fail_test "AWS_ACCESS_KEY_ID not set"
elif [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    fail_test "AWS_SECRET_ACCESS_KEY not set"
elif [ -z "$AWS_S3_BUCKET" ]; then
    fail_test "AWS_S3_BUCKET not set"
else
    # Test AWS credentials by listing S3 bucket
    echo -n "S3 Access... "
    if command -v aws &> /dev/null; then
        export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_DEFAULT_REGION=$AWS_REGION
        if aws s3 ls s3://$AWS_S3_BUCKET &> /dev/null; then
            pass_test
        else
            fail_test "Cannot access bucket $AWS_S3_BUCKET"
        fi
    else
        warn_test "AWS CLI not installed (cannot validate)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
fi

echo ""
echo "🔍 Testing Google Cloud Services..."
echo "===================================="

test_service "Google OAuth"
if [ -z "$GOOGLE_CLIENT_ID" ]; then
    fail_test "GOOGLE_CLIENT_ID not set"
elif [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    fail_test "GOOGLE_CLIENT_SECRET not set"
else
    # Basic validation - check format
    if [[ $GOOGLE_CLIENT_ID == *.apps.googleusercontent.com ]]; then
        pass_test
    else
        warn_test "Format looks unusual (should end with .apps.googleusercontent.com)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
fi

test_service "Google Cloud Vision"
if [ -z "$GOOGLE_CLOUD_PROJECT_ID" ]; then
    fail_test "GOOGLE_CLOUD_PROJECT_ID not set"
elif [ ! -f "google-cloud-credentials.json" ] && [ -z "$GOOGLE_APPLICATION_CREDENTIALS_BASE64" ]; then
    fail_test "Neither google-cloud-credentials.json nor GOOGLE_APPLICATION_CREDENTIALS_BASE64 found"
else
    pass_test
fi

echo ""
echo "🍎 Testing Apple Sign In..."
echo "==========================="

test_service "Apple Configuration"
if [ -z "$APPLE_CLIENT_ID" ]; then
    fail_test "APPLE_CLIENT_ID not set"
elif [ -z "$APPLE_TEAM_ID" ]; then
    fail_test "APPLE_TEAM_ID not set"
elif [ -z "$APPLE_KEY_ID" ]; then
    fail_test "APPLE_KEY_ID not set"
elif [ -z "$APPLE_PRIVATE_KEY" ]; then
    fail_test "APPLE_PRIVATE_KEY not set"
else
    # Check format
    if [[ $APPLE_PRIVATE_KEY == *"BEGIN PRIVATE KEY"* ]]; then
        pass_test
    else
        fail_test "APPLE_PRIVATE_KEY doesn't look like a valid private key"
    fi
fi

echo ""
echo "🐛 Testing Sentry..."
echo "==================="

test_service "Sentry DSN"
if [ -z "$SENTRY_DSN" ]; then
    warn_test "Not set (optional but recommended)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    # Test Sentry DSN format and connectivity
    if [[ $SENTRY_DSN == https://*@*.ingest.sentry.io/* ]]; then
        echo -n "Format valid... "
        # Extract the URL and test connectivity
        if curl -s --head "$SENTRY_DSN" | head -n 1 | grep "HTTP" > /dev/null; then
            pass_test
        else
            warn_test "Cannot verify connectivity (may still work)"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        fi
    else
        fail_test "Invalid DSN format"
    fi
fi

echo ""
echo "🗄️  Testing Database Configuration..."
echo "====================================="

test_service "Database URL"
if [ -z "$DATABASE_URL" ]; then
    warn_test "Not set (Railway will provide this automatically)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    # Validate PostgreSQL URL format
    if [[ $DATABASE_URL == postgresql://* ]] || [[ $DATABASE_URL == postgres://* ]]; then
        pass_test
    else
        fail_test "Invalid PostgreSQL URL format"
    fi
fi

test_service "Redis URL"
if [ -z "$REDIS_URL" ]; then
    warn_test "Not set (Railway will provide this automatically)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    # Validate Redis URL format
    if [[ $REDIS_URL == redis://* ]]; then
        pass_test
    else
        fail_test "Invalid Redis URL format"
    fi
fi

echo ""
echo "🌐 Testing CORS Configuration..."
echo "================================"

test_service "CORS Origins"
if [ -z "$ALLOWED_ORIGINS" ]; then
    fail_test "ALLOWED_ORIGINS not set"
else
    # Check if it contains production URLs
    if [[ $ALLOWED_ORIGINS == *"localhost"* ]]; then
        warn_test "Contains localhost (should include production URLs)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        pass_test
    fi
fi

echo ""
echo "================================"
echo "📊 Validation Results"
echo "================================"
echo ""
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All validations passed!${NC}"
    echo ""
    echo "🚀 You're ready to deploy!"
    echo "   Run: ./railway-deploy.sh"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some validations failed${NC}"
    echo ""
    echo "📝 Fix the failed items and run this script again"
    echo "   See SERVICE_SETUP_CHECKLIST.md for setup instructions"
    echo ""
    exit 1
fi
