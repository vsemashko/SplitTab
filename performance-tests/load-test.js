import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const expensesListDuration = new Trend('expenses_list_duration');
const createExpenseDuration = new Trend('create_expense_duration');

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1000ms
    'http_req_failed': ['rate<0.01'],                  // Error rate < 1%
    'errors': ['rate<0.01'],                           // Custom error rate < 1%
    'login_duration': ['p(95)<1000'],                  // Login p95 < 1s
    'expenses_list_duration': ['p(95)<500'],           // Expenses list p95 < 500ms
    'create_expense_duration': ['p(95)<800'],          // Create expense p95 < 800ms
  },
};

// Configuration
const BASE_URL = __ENV.API_URL || 'http://localhost:5000';
const TEST_USER_EMAIL = `test.user.${__VU}.${__ITER}@example.com`;
const TEST_USER_PASSWORD = 'TestPassword123!';

export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);

  // Verify API is reachable
  const healthCheck = http.get(`${BASE_URL}/health`);
  check(healthCheck, {
    'API is reachable': (r) => r.status === 200,
  });

  return { baseUrl: BASE_URL };
}

export default function (data) {
  let accessToken;
  let groupId;
  let expenseId;

  // 1. Authentication Flow
  group('Authentication', function () {
    // Register new user
    const registerPayload = JSON.stringify({
      name: `Test User ${__VU}`,
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    const registerRes = http.post(
      `${BASE_URL}/auth/register`,
      registerPayload,
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'register' },
      }
    );

    const registerSuccess = check(registerRes, {
      'register status is 201': (r) => r.status === 201,
      'register has user data': (r) => r.json('data.user') !== undefined,
    });

    if (!registerSuccess) {
      // If user already exists, just login
      const loginPayload = JSON.stringify({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });

      const loginRes = http.post(
        `${BASE_URL}/auth/login`,
        loginPayload,
        {
          headers: { 'Content-Type': 'application/json' },
          tags: { name: 'login' },
        }
      );

      loginDuration.add(loginRes.timings.duration);

      const loginCheck = check(loginRes, {
        'login status is 200': (r) => r.status === 200,
        'login has access token': (r) => r.json('data.accessToken') !== undefined,
        'login has refresh token': (r) => r.json('data.refreshToken') !== undefined,
      });

      errorRate.add(!loginCheck);

      if (loginCheck) {
        accessToken = loginRes.json('data.accessToken');
      } else {
        console.error(`Login failed: ${loginRes.status} - ${loginRes.body}`);
        return; // Skip rest of iteration if login fails
      }
    } else {
      accessToken = registerRes.json('data.accessToken');
    }
  });

  sleep(1);

  // 2. Group Management
  group('Group Management', function () {
    // Create group
    const createGroupPayload = JSON.stringify({
      name: `Test Group ${__VU}-${__ITER}`,
      description: 'Load test group',
    });

    const createGroupRes = http.post(
      `${BASE_URL}/groups`,
      createGroupPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        tags: { name: 'create_group' },
      }
    );

    const groupCheck = check(createGroupRes, {
      'create group status is 201': (r) => r.status === 201,
      'create group has id': (r) => r.json('data.id') !== undefined,
    });

    errorRate.add(!groupCheck);

    if (groupCheck) {
      groupId = createGroupRes.json('data.id');
    }

    sleep(0.5);

    // Get groups list
    const getGroupsRes = http.get(
      `${BASE_URL}/groups`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        tags: { name: 'get_groups' },
      }
    );

    check(getGroupsRes, {
      'get groups status is 200': (r) => r.status === 200,
      'get groups response time < 500ms': (r) => r.timings.duration < 500,
    });
  });

  sleep(1);

  // 3. Expense Management
  group('Expense Management', function () {
    // Create expense
    const createExpensePayload = JSON.stringify({
      description: `Test Expense ${__ITER}`,
      amount: 100.00 + (__VU % 50),
      groupId: groupId,
      splitMethod: 'equal',
      date: new Date().toISOString(),
      category: 'food',
    });

    const createExpenseRes = http.post(
      `${BASE_URL}/expenses`,
      createExpensePayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        tags: { name: 'create_expense' },
      }
    );

    createExpenseDuration.add(createExpenseRes.timings.duration);

    const expenseCheck = check(createExpenseRes, {
      'create expense status is 201': (r) => r.status === 201,
      'create expense has id': (r) => r.json('data.id') !== undefined,
      'create expense response time < 800ms': (r) => r.timings.duration < 800,
    });

    errorRate.add(!expenseCheck);

    if (expenseCheck) {
      expenseId = createExpenseRes.json('data.id');
    }

    sleep(0.5);

    // Get expenses list
    const getExpensesRes = http.get(
      `${BASE_URL}/expenses`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        tags: { name: 'get_expenses' },
      }
    );

    expensesListDuration.add(getExpensesRes.timings.duration);

    check(getExpensesRes, {
      'get expenses status is 200': (r) => r.status === 200,
      'get expenses is array': (r) => Array.isArray(r.json('data')),
      'get expenses response time < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(0.5);

    // Get single expense
    if (expenseId) {
      const getExpenseRes = http.get(
        `${BASE_URL}/expenses/${expenseId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          tags: { name: 'get_expense' },
        }
      );

      check(getExpenseRes, {
        'get expense status is 200': (r) => r.status === 200,
        'get expense has correct id': (r) => r.json('data.id') === expenseId,
      });
    }
  });

  sleep(1);

  // 4. Settlement Management
  group('Settlement Management', function () {
    // Get balances
    if (groupId) {
      const getBalancesRes = http.get(
        `${BASE_URL}/settlements/balances/${groupId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          tags: { name: 'get_balances' },
        }
      );

      check(getBalancesRes, {
        'get balances status is 200': (r) => r.status === 200,
        'get balances is array': (r) => Array.isArray(r.json('data')),
        'get balances response time < 500ms': (r) => r.timings.duration < 500,
      });

      sleep(0.5);

      // Get settlement suggestions
      const getSuggestionsRes = http.get(
        `${BASE_URL}/settlements/suggestions/${groupId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          tags: { name: 'get_suggestions' },
        }
      );

      check(getSuggestionsRes, {
        'get suggestions status is 200': (r) => r.status === 200,
        'get suggestions is array': (r) => Array.isArray(r.json('data')),
      });
    }
  });

  sleep(2);

  // 5. User Profile
  group('User Profile', function () {
    const getProfileRes = http.get(
      `${BASE_URL}/users/profile`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        tags: { name: 'get_profile' },
      }
    );

    check(getProfileRes, {
      'get profile status is 200': (r) => r.status === 200,
      'get profile has user data': (r) => r.json('data.email') !== undefined,
    });
  });

  sleep(1);
}

export function teardown(data) {
  console.log('Load test completed');
}

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = `
${indent}Load Test Summary
${indent}================
${indent}
${indent}Test Duration: ${data.state.testRunDurationMs / 1000}s
${indent}Total Requests: ${data.metrics.http_reqs.values.count}
${indent}Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s
${indent}
${indent}Response Times:
${indent}  min: ${data.metrics.http_req_duration.values.min.toFixed(2)}ms
${indent}  avg: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
${indent}  p95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
${indent}  p99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms
${indent}  max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms
${indent}
${indent}Error Rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%
${indent}`;

  return summary;
}
