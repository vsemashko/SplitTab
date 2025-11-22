import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Soak Test (Endurance Test)
 *
 * Purpose: Test system stability over extended period
 *
 * Scenario:
 * - Maintain steady load for extended time (2+ hours)
 * - Detect memory leaks, resource exhaustion
 * - Verify system remains stable
 *
 * Success Criteria:
 * - No performance degradation over time
 * - No memory leaks
 * - Error rate stays consistent < 1%
 * - Response times remain stable
 */

export const options = {
  stages: [
    { duration: '5m', target: 100 },    // Ramp up
    { duration: '2h', target: 100 },    // Soak for 2 hours
    { duration: '5m', target: 0 },      // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000';

export function setup() {
  console.log('Starting soak test (2 hour duration)...');
  console.log('Monitoring for memory leaks and performance degradation...');
  return { baseUrl: BASE_URL, startTime: Date.now() };
}

export default function (data) {
  const runTime = (Date.now() - data.startTime) / 1000 / 60; // minutes

  // Realistic user behavior
  const email = `soak.${__VU}@example.com`;
  const password = 'SoakTest123!';

  // Login
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  let token;
  if (loginRes.status === 401) {
    // Register if user doesn't exist
    const registerRes = http.post(
      `${BASE_URL}/auth/register`,
      JSON.stringify({
        name: `Soak User ${__VU}`,
        email,
        password,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    token = registerRes.json('data.accessToken');
  } else {
    token = loginRes.json('data.accessToken');
  }

  if (token) {
    // Typical user session

    // View dashboard (list expenses and groups)
    http.get(`${BASE_URL}/expenses`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    sleep(2);

    http.get(`${BASE_URL}/groups`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    sleep(3);

    // Occasionally create expense (10% of requests)
    if (Math.random() < 0.1) {
      const groupRes = http.get(`${BASE_URL}/groups`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const groups = groupRes.json('data');
      if (groups && groups.length > 0) {
        const groupId = groups[0].id;

        http.post(
          `${BASE_URL}/expenses`,
          JSON.stringify({
            description: `Soak test expense ${runTime.toFixed(0)}m`,
            amount: Math.random() * 100,
            groupId,
            splitMethod: 'equal',
            date: new Date().toISOString(),
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );
      }
    }

    sleep(5);

    // Check profile
    http.get(`${BASE_URL}/users/profile`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    sleep(2);

    // Check settlements
    const groupsRes = http.get(`${BASE_URL}/groups`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const groups = groupsRes.json('data');
    if (groups && groups.length > 0) {
      http.get(`${BASE_URL}/settlements/balances/${groups[0].id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
    }
  }

  // Realistic think time between actions
  sleep(Math.random() * 10 + 5); // 5-15 seconds
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000 / 60;
  console.log(`Soak test completed after ${duration.toFixed(1)} minutes`);
  console.log('Review metrics for performance degradation over time');
}
