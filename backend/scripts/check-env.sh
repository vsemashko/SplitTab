#!/bin/bash

# Environment Variable Checker
# Validates that all required environment variables are set

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Environment Variable Checker"
echo "================================"
echo ""

ENV_FILE="${1:-.env.production}"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ $ENV_FILE not found!${NC}"
    echo ""
    echo "Create it from the template:"
    echo "  cp .env.production.example $ENV_FILE"
    echo ""
    exit 1
fi

echo "📋 Checking: $ENV_FILE"
echo ""

# Load environment
set -a
source "$ENV_FILE"
set +a

MISSING_VARS=()
PLACEHOLDER_VARS=()
WEAK_VARS=()

# Required variables
REQUIRED_VARS=(
    "NODE_ENV"
    "PORT"
    "DATABASE_URL"
    "REDIS_URL"
    "JWT_ACCESS_SECRET"
    "JWT_REFRESH_SECRET"
    "ALLOWED_ORIGINS"
)

# Optional but recommended
RECOMMENDED_VARS=(
    "EMAIL_FROM"
    "EMAIL_API_KEY"
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "AWS_S3_BUCKET"
    "SENTRY_DSN"
)

# Placeholders to detect
PLACEHOLDERS=(
    "your-"
    "change-this"
    "example"
    "placeholder"
    "CHANGE_THIS"
    "YOUR_"
)

echo "1️⃣  Required Variables"
echo "======================"

for VAR in "${REQUIRED_VARS[@]}"; do
    VALUE="${!VAR}"
    echo -n "  $VAR... "

    if [ -z "$VALUE" ]; then
        echo -e "${RED}✗ Missing${NC}"
        MISSING_VARS+=("$VAR")
    else
        # Check for placeholders
        IS_PLACEHOLDER=false
        for PLACEHOLDER in "${PLACEHOLDERS[@]}"; do
            if [[ "$VALUE" == *"$PLACEHOLDER"* ]]; then
                IS_PLACEHOLDER=true
                break
            fi
        done

        if [ "$IS_PLACEHOLDER" = true ]; then
            echo -e "${YELLOW}⚠ Placeholder${NC}"
            PLACEHOLDER_VARS+=("$VAR")
        else
            echo -e "${GREEN}✓ Set${NC}"
        fi
    fi
done

echo ""
echo "2️⃣  Recommended Variables"
echo "========================="

for VAR in "${RECOMMENDED_VARS[@]}"; do
    VALUE="${!VAR}"
    echo -n "  $VAR... "

    if [ -z "$VALUE" ]; then
        echo -e "${YELLOW}⚠ Not set${NC}"
    else
        # Check for placeholders
        IS_PLACEHOLDER=false
        for PLACEHOLDER in "${PLACEHOLDERS[@]}"; do
            if [[ "$VALUE" == *"$PLACEHOLDER"* ]]; then
                IS_PLACEHOLDER=true
                break
            fi
        done

        if [ "$IS_PLACEHOLDER" = true ]; then
            echo -e "${YELLOW}⚠ Placeholder${NC}"
            PLACEHOLDER_VARS+=("$VAR")
        else
            echo -e "${GREEN}✓ Set${NC}"
        fi
    fi
done

echo ""
echo "3️⃣  Security Checks"
echo "==================="

# JWT secrets strength
echo -n "  JWT_ACCESS_SECRET length... "
if [ ${#JWT_ACCESS_SECRET} -lt 32 ]; then
    echo -e "${RED}✗ Too short (${#JWT_ACCESS_SECRET} chars, need 32+)${NC}"
    WEAK_VARS+=("JWT_ACCESS_SECRET")
else
    echo -e "${GREEN}✓ Good (${#JWT_ACCESS_SECRET} chars)${NC}"
fi

echo -n "  JWT_REFRESH_SECRET length... "
if [ ${#JWT_REFRESH_SECRET} -lt 32 ]; then
    echo -e "${RED}✗ Too short (${#JWT_REFRESH_SECRET} chars, need 32+)${NC}"
    WEAK_VARS+=("JWT_REFRESH_SECRET")
else
    echo -e "${GREEN}✓ Good (${#JWT_REFRESH_SECRET} chars)${NC}"
fi

echo -n "  JWT secrets different... "
if [ "$JWT_ACCESS_SECRET" = "$JWT_REFRESH_SECRET" ]; then
    echo -e "${RED}✗ Same value${NC}"
    WEAK_VARS+=("JWT_SECRETS_MATCH")
else
    echo -e "${GREEN}✓ Different${NC}"
fi

echo -n "  NODE_ENV... "
if [ "$NODE_ENV" = "production" ]; then
    echo -e "${GREEN}✓ production${NC}"
elif [ "$NODE_ENV" = "development" ]; then
    echo -e "${YELLOW}⚠ development (change to 'production')${NC}"
else
    echo -e "${YELLOW}⚠ $NODE_ENV${NC}"
fi

echo -n "  ALLOWED_ORIGINS... "
if [[ "$ALLOWED_ORIGINS" == *"localhost"* ]]; then
    echo -e "${YELLOW}⚠ Contains localhost${NC}"
elif [ -z "$ALLOWED_ORIGINS" ]; then
    echo -e "${RED}✗ Not set${NC}"
else
    echo -e "${GREEN}✓ Configured${NC}"
fi

echo ""
echo "================================"
echo "📊 Summary"
echo "================================"
echo ""

TOTAL_ISSUES=$((${#MISSING_VARS[@]} + ${#PLACEHOLDER_VARS[@]} + ${#WEAK_VARS[@]}))

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}Missing variables (${#MISSING_VARS[@]}):${NC}"
    for VAR in "${MISSING_VARS[@]}"; do
        echo "  - $VAR"
    done
    echo ""
fi

if [ ${#PLACEHOLDER_VARS[@]} -gt 0 ]; then
    echo -e "${YELLOW}Placeholder values detected (${#PLACEHOLDER_VARS[@]}):${NC}"
    for VAR in "${PLACEHOLDER_VARS[@]}"; do
        echo "  - $VAR"
    done
    echo ""
fi

if [ ${#WEAK_VARS[@]} -gt 0 ]; then
    echo -e "${YELLOW}Security concerns (${#WEAK_VARS[@]}):${NC}"
    for VAR in "${WEAK_VARS[@]}"; do
        echo "  - $VAR"
    done
    echo ""
fi

if [ $TOTAL_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ Environment configuration looks good!${NC}"
    echo ""
    echo "Next step: Validate service credentials"
    echo "  ./scripts/validate-services.sh"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠️  Found $TOTAL_ISSUES issue(s)${NC}"
    echo ""
    echo "Fix these issues before deploying:"
    echo "  1. Fill in missing variables"
    echo "  2. Replace placeholder values with real credentials"
    echo "  3. Use strong, random JWT secrets"
    echo ""
    echo "Generate secure JWT secrets:"
    echo "  openssl rand -base64 64"
    echo ""
    exit 1
fi
