import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Stress Test
 *
 * Purpose: Find the breaking point of the system
 *
 * Scenario:
 * - Gradually increase load beyond expected capacity
 * - Continue until system shows degradation
 * - Identify maximum sustainable load
 *
 * Success Criteria:
 * - Identify max concurrent users
 * - Error rate stays < 1% until breaking point
 * - System recovers gracefully when load decreases
 */

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Warm up
    { duration: '5m', target: 200 },   // Expected peak load
    { duration: '2m', target: 300 },   // Beyond expected
    { duration: '5m', target: 400 },   // Push further
    { duration: '2m', target: 500 },   // Stress level
    { duration: '5m', target: 600 },   // Breaking point?
    { duration: '2m', target: 0 },     // Recovery
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1500'],  // More lenient
    'http_req_failed': ['rate<0.1'],      // Allow 10% error rate at stress
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000';

export function setup() {
  console.log('Starting stress test...');
  console.log('Finding breaking point...');
  return { baseUrl: BASE_URL };
}

export default function () {
  // Test most resource-intensive endpoints

  const email = `stress.${__VU}.${__ITER}@example.com`;
  const password = 'StressTest123!';

  // Register (heavy database operation)
  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({
      name: `Stress User ${__VU}`,
      email: email,
      password: password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  let token;
  if (registerRes.status === 201) {
    token = registerRes.json('data.accessToken');
  } else {
    // Login if user exists
    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email, password }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (loginRes.status === 200) {
      token = loginRes.json('data.accessToken');
    }
  }

  if (token) {
    // Create group (database write)
    const groupRes = http.post(
      `${BASE_URL}/groups`,
      JSON.stringify({
        name: `Stress Group ${__VU}-${__ITER}`,
        description: 'Stress test',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const groupId = groupRes.json('data.id');

    // Create expense (complex calculation)
    if (groupId) {
      http.post(
        `${BASE_URL}/expenses`,
        JSON.stringify({
          description: 'Stress test expense',
          amount: 100.00,
          groupId: groupId,
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

    // List operations (database reads)
    http.get(`${BASE_URL}/expenses`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    http.get(`${BASE_URL}/groups`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  }

  sleep(1);
}

export function teardown(data) {
  console.log('Stress test completed');
  console.log('Review metrics to identify breaking point');
}
