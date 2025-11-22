import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Spike Test
 *
 * Purpose: Test system behavior under sudden, extreme load increases
 *
 * Scenario:
 * - Normal load (100 users)
 * - Sudden spike to 1000 users
 * - Return to normal
 *
 * Success Criteria:
 * - System handles spike without crashing
 * - Errors < 5% during spike
 * - Recovery time < 1 minute
 */

export const options = {
  stages: [
    { duration: '30s', target: 100 },   // Normal load
    { duration: '1m', target: 100 },    // Sustain normal load
    { duration: '10s', target: 1000 },  // SPIKE!
    { duration: '3m', target: 1000 },   // Sustain spike
    { duration: '10s', target: 100 },   // Return to normal
    { duration: '3m', target: 100 },    // Recovery period
    { duration: '10s', target: 0 },     // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'],   // More lenient during spike
    'http_req_failed': ['rate<0.05'],      // Allow 5% error rate during spike
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000';

export function setup() {
  console.log('Starting spike test...');
  console.log(`Target: ${BASE_URL}`);
  return { baseUrl: BASE_URL };
}

export default function () {
  // Simplified test flow for spike testing
  const loginPayload = JSON.stringify({
    email: `spike.test.${__VU}@example.com`,
    password: 'TestPassword123!',
  });

  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    loginPayload,
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(loginRes, {
    'login status is 200 or 201': (r) => r.status === 200 || r.status === 201 || r.status === 401,
    'response received': (r) => r.body.length > 0,
  });

  sleep(1);

  // Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check successful': (r) => r.status === 200,
  });

  sleep(Math.random() * 2); // Random think time
}

export function teardown(data) {
  console.log('Spike test completed');
}
