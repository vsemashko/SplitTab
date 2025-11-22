#!/bin/bash

# SplitTab Post-Deployment Testing Script
# Runs comprehensive tests against a deployed backend

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🧪 SplitTab Deployment Testing"
echo "=============================="
echo ""

# Get backend URL
if [ -z "$1" ]; then
    echo "Usage: ./test-deployment.sh <backend-url>"
    echo ""
    echo "Example:"
    echo "  ./test-deployment.sh https://splittab-backend.railway.app"
    echo ""
    exit 1
fi

BACKEND_URL=$1
API_URL="$BACKEND_URL/api/v1"

echo "🎯 Testing: $API_URL"
echo ""

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

test_endpoint() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "  $1... "
}

pass_test() {
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}✓${NC}"
}

fail_test() {
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo -e "${RED}✗${NC} $1"
}

# Store tokens for authenticated requests
ACCESS_TOKEN=""
TEST_USER_EMAIL="test-$(date +%s)@splittab-test.com"
TEST_USER_PASSWORD="Test123!@#"

echo "1️⃣  Health & Basic Endpoints"
echo "============================="

test_endpoint "Health check"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
if [ "$RESPONSE" = "200" ]; then
    pass_test
else
    fail_test "HTTP $RESPONSE"
fi

test_endpoint "API root"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL")
if [ "$RESPONSE" = "200" ]; then
    pass_test
else
    fail_test "HTTP $RESPONSE"
fi

echo ""
echo "2️⃣  Authentication Flow"
echo "======================="

test_endpoint "Register new user"
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\",\"name\":\"Test User\"}")

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -1)
BODY=$(echo "$REGISTER_RESPONSE" | head -1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    ACCESS_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    if [ ! -z "$ACCESS_TOKEN" ]; then
        pass_test
    else
        fail_test "No access token returned"
    fi
else
    fail_test "HTTP $HTTP_CODE"
fi

test_endpoint "Login"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -1)
BODY=$(echo "$LOGIN_RESPONSE" | head -1)

if [ "$HTTP_CODE" = "200" ]; then
    NEW_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    if [ ! -z "$NEW_TOKEN" ]; then
        ACCESS_TOKEN=$NEW_TOKEN
        pass_test
    else
        fail_test "No access token returned"
    fi
else
    fail_test "HTTP $HTTP_CODE"
fi

test_endpoint "Get current user profile"
if [ ! -z "$ACCESS_TOKEN" ]; then
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/users/me" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    if [ "$RESPONSE" = "200" ]; then
        pass_test
    else
        fail_test "HTTP $RESPONSE"
    fi
else
    fail_test "No access token available"
fi

echo ""
echo "3️⃣  Group Management"
echo "===================="

GROUP_ID=""

test_endpoint "Create group"
if [ ! -z "$ACCESS_TOKEN" ]; then
    CREATE_GROUP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/groups" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"Test Group","description":"Automated test group"}')

    HTTP_CODE=$(echo "$CREATE_GROUP_RESPONSE" | tail -1)
    BODY=$(echo "$CREATE_GROUP_RESPONSE" | head -1)

    if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
        GROUP_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
        pass_test
    else
        fail_test "HTTP $HTTP_CODE"
    fi
else
    fail_test "No access token available"
fi

test_endpoint "List groups"
if [ ! -z "$ACCESS_TOKEN" ]; then
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/groups" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    if [ "$RESPONSE" = "200" ]; then
        pass_test
    else
        fail_test "HTTP $RESPONSE"
    fi
else
    fail_test "No access token available"
fi

test_endpoint "Get group details"
if [ ! -z "$ACCESS_TOKEN" ] && [ ! -z "$GROUP_ID" ]; then
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/groups/$GROUP_ID" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    if [ "$RESPONSE" = "200" ]; then
        pass_test
    else
        fail_test "HTTP $RESPONSE"
    fi
else
    fail_test "No access token or group ID available"
fi

echo ""
echo "4️⃣  Expense Management"
echo "======================"

EXPENSE_ID=""

test_endpoint "Create expense"
if [ ! -z "$ACCESS_TOKEN" ] && [ ! -z "$GROUP_ID" ]; then
    CREATE_EXPENSE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/expenses" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"groupId\":\"$GROUP_ID\",\"amount\":100.00,\"description\":\"Test Expense\",\"category\":\"food\",\"splitMethod\":\"equal\"}")

    HTTP_CODE=$(echo "$CREATE_EXPENSE_RESPONSE" | tail -1)
    BODY=$(echo "$CREATE_EXPENSE_RESPONSE" | head -1)

    if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
        EXPENSE_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
        pass_test
    else
        fail_test "HTTP $HTTP_CODE"
    fi
else
    fail_test "No access token or group ID available"
fi

test_endpoint "List expenses"
if [ ! -z "$ACCESS_TOKEN" ]; then
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/expenses" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    if [ "$RESPONSE" = "200" ]; then
        pass_test
    else
        fail_test "HTTP $RESPONSE"
    fi
else
    fail_test "No access token available"
fi

echo ""
echo "5️⃣  Security Tests"
echo "=================="

test_endpoint "Reject unauthenticated requests"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/users/me")
if [ "$RESPONSE" = "401" ]; then
    pass_test
else
    fail_test "Should return 401, got $RESPONSE"
fi

test_endpoint "Reject invalid tokens"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/users/me" \
    -H "Authorization: Bearer invalid_token_12345")
if [ "$RESPONSE" = "401" ]; then
    pass_test
else
    fail_test "Should return 401, got $RESPONSE"
fi

test_endpoint "CORS headers present"
CORS_HEADER=$(curl -s -I "$API_URL/health" | grep -i "access-control-allow")
if [ ! -z "$CORS_HEADER" ]; then
    pass_test
else
    fail_test "No CORS headers found"
fi

echo ""
echo "6️⃣  Error Handling"
echo "=================="

test_endpoint "Handle invalid JSON"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{invalid json}")
if [ "$RESPONSE" = "400" ]; then
    pass_test
else
    fail_test "Should return 400, got $RESPONSE"
fi

test_endpoint "Handle missing fields"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com"}')
if [ "$RESPONSE" = "400" ] || [ "$RESPONSE" = "422" ]; then
    pass_test
else
    fail_test "Should return 400/422, got $RESPONSE"
fi

test_endpoint "Handle 404 Not Found"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/nonexistent-endpoint")
if [ "$RESPONSE" = "404" ]; then
    pass_test
else
    fail_test "Should return 404, got $RESPONSE"
fi

echo ""
echo "================================"
echo "📊 Test Results"
echo "================================"
echo ""
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "🎉 Your deployment is working correctly!"
    echo ""
    echo "Next steps:"
    echo "  1. Deploy web app to Vercel"
    echo "  2. Upload iOS app to TestFlight"
    echo "  3. Invite beta testers"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "📝 Check your deployment logs:"
    echo "   railway logs"
    echo ""
    echo "🐛 Check Sentry for errors:"
    echo "   https://sentry.io"
    echo ""
    exit 1
fi
