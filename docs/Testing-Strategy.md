# Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for SplitTab, covering all testing levels from unit tests to production monitoring.

**Version**: 1.0
**Last Updated**: 2025-11-21

---

## Testing Philosophy

### Core Principles

1. **Test Early, Test Often**: Integrate testing throughout development
2. **Automate Everything**: Manual testing only for exploratory work
3. **Fast Feedback**: Tests should run quickly
4. **Confidence**: Tests should catch real bugs, not create noise
5. **Maintainability**: Tests should be easy to maintain

### Testing Pyramid

```
           /\
          /  \
         / E2E \         10% - End-to-End Tests
        /______\
       /        \
      /Integration\     30% - Integration Tests
     /____________\
    /              \
   /  Unit Tests   \   60% - Unit Tests
  /________________\
```

---

## Unit Testing

### Scope
- Individual functions and methods
- Business logic
- Utilities and helpers
- Pure functions
- Component logic (without UI)

### Target Coverage
- **Overall**: 80% code coverage
- **Critical paths**: 95% coverage
- **Utilities**: 100% coverage

### Technology Stack

#### Backend
```json
{
  "framework": "Jest",
  "mocking": "@jest/globals",
  "assertions": "Jest matchers",
  "coverage": "Jest coverage"
}
```

#### Frontend (Web)
```json
{
  "framework": "Jest",
  "testing-library": "@testing-library/react",
  "mocking": "MSW (Mock Service Worker)",
  "coverage": "Jest coverage"
}
```

#### iOS
```json
{
  "framework": "XCTest",
  "mocking": "OCMock or manual mocks",
  "coverage": "Xcode Code Coverage"
}
```

---

### Unit Test Examples

#### Backend: Business Logic
```typescript
import { calculateBalances } from './balance-calculator';

describe('Balance Calculator', () => {
  describe('calculateBalances', () => {
    it('should calculate simple two-person balance', () => {
      const expense = {
        amount: 100,
        participants: [
          { userId: 'user1', paidAmount: 100, owedAmount: 50 },
          { userId: 'user2', paidAmount: 0, owedAmount: 50 }
        ]
      };

      const balances = calculateBalances([expense]);

      expect(balances).toEqual([
        { from: 'user2', to: 'user1', amount: 50 }
      ]);
    });

    it('should handle multiple expenses', () => {
      const expenses = [
        {
          amount: 100,
          participants: [
            { userId: 'user1', paidAmount: 100, owedAmount: 50 },
            { userId: 'user2', paidAmount: 0, owedAmount: 50 }
          ]
        },
        {
          amount: 60,
          participants: [
            { userId: 'user2', paidAmount: 60, owedAmount: 30 },
            { userId: 'user1', paidAmount: 0, owedAmount: 30 }
          ]
        }
      ];

      const balances = calculateBalances(expenses);

      expect(balances).toEqual([
        { from: 'user2', to: 'user1', amount: 20 }
      ]);
    });

    it('should simplify debts across three people', () => {
      // Test debt simplification algorithm
    });
  });
});
```

#### Frontend: Component Logic
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpenseForm } from './ExpenseForm';

describe('ExpenseForm', () => {
  it('should validate required fields', async () => {
    render(<ExpenseForm onSubmit={jest.fn()} />);

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/amount is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/description is required/i)).toBeInTheDocument();
  });

  it('should calculate equal split correctly', () => {
    const { getByLabelText, getByText } = render(
      <ExpenseForm participants={['user1', 'user2', 'user3']} />
    );

    const amountInput = getByLabelText(/amount/i);
    fireEvent.change(amountInput, { target: { value: '90' } });

    expect(getByText('$30.00')).toBeInTheDocument(); // per person
  });

  it('should validate that total paid equals amount', async () => {
    // Test validation logic
  });
});
```

#### iOS: Model Tests
```swift
import XCTest
@testable import SplitTab

class ExpenseTests: XCTestCase {
    func testExpenseInitialization() {
        let expense = Expense(
            amount: 100.00,
            currency: "USD",
            description: "Dinner",
            category: .foodDining
        )

        XCTAssertEqual(expense.amount, 100.00)
        XCTAssertEqual(expense.currency, "USD")
        XCTAssertEqual(expense.description, "Dinner")
    }

    func testEqualSplit() {
        let expense = Expense(amount: 90.00)
        let participants = [User(id: "1"), User(id: "2"), User(id: "3")]

        let split = expense.calculateEqualSplit(participants: participants)

        XCTAssertEqual(split.count, 3)
        XCTAssertEqual(split[0].owedAmount, 30.00)
        XCTAssertEqual(split[1].owedAmount, 30.00)
        XCTAssertEqual(split[2].owedAmount, 30.00)
    }
}
```

---

## Integration Testing

### Scope
- API endpoints
- Database operations
- External service integrations
- Multi-component interactions
- Authentication flows

### Target Coverage
- All API endpoints
- All database queries
- Critical user flows

### Technology Stack

```json
{
  "framework": "Jest",
  "http-testing": "Supertest",
  "database": "Test database (PostgreSQL)",
  "fixtures": "Custom test data seeders"
}
```

---

### Integration Test Examples

#### API Endpoint Tests
```typescript
import request from 'supertest';
import { app } from '../app';
import { db } from '../database';

describe('POST /expenses', () => {
  let authToken: string;
  let groupId: string;

  beforeAll(async () => {
    // Set up test database
    await db.migrate.latest();
    // Create test user and get auth token
    const user = await createTestUser();
    authToken = await generateAuthToken(user.id);
    // Create test group
    const group = await createTestGroup(user.id);
    groupId = group.id;
  });

  afterAll(async () => {
    // Clean up
    await db.migrate.rollback();
  });

  it('should create an expense', async () => {
    const expenseData = {
      groupId,
      amount: 45.50,
      currency: 'USD',
      description: 'Dinner',
      category: 'food_dining',
      date: '2025-11-21',
      participants: [
        { userId: 'user1', paidAmount: 45.50, owedAmount: 22.75 },
        { userId: 'user2', paidAmount: 0, owedAmount: 22.75 }
      ]
    };

    const response = await request(app)
      .post('/api/v1/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .send(expenseData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.amount).toBe(45.50);
    expect(response.body.data.description).toBe('Dinner');
  });

  it('should return 401 without auth token', async () => {
    await request(app)
      .post('/api/v1/expenses')
      .send({})
      .expect(401);
  });

  it('should validate expense data', async () => {
    const invalidData = {
      groupId,
      amount: -10, // Invalid: negative amount
      description: ''
    };

    const response = await request(app)
      .post('/api/v1/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidData)
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should update group balances after creating expense', async () => {
    // Create expense
    await createExpense({ /* ... */ });

    // Verify balances updated
    const balances = await getGroupBalances(groupId);
    expect(balances[0].netBalance).toBe(22.75);
    expect(balances[1].netBalance).toBe(-22.75);
  });
});
```

#### Database Integration Tests
```typescript
describe('Expense Repository', () => {
  it('should create expense with participants transactionally', async () => {
    const expense = {
      amount: 100,
      description: 'Test',
      participants: [/* ... */]
    };

    const created = await expenseRepository.create(expense);

    // Verify expense created
    expect(created.id).toBeDefined();

    // Verify participants created
    const participants = await db.expenseParticipant.findMany({
      where: { expenseId: created.id }
    });
    expect(participants).toHaveLength(2);
  });

  it('should rollback transaction if participants invalid', async () => {
    const invalidExpense = {
      amount: 100,
      participants: [] // Invalid: no participants
    };

    await expect(
      expenseRepository.create(invalidExpense)
    ).rejects.toThrow();

    // Verify no expense created
    const count = await db.expense.count();
    expect(count).toBe(0);
  });
});
```

---

## End-to-End (E2E) Testing

### Scope
- Critical user journeys
- Complete workflows
- Cross-platform scenarios
- Real browser/device testing

### Critical Flows to Test
1. User registration and login
2. Create group and invite members
3. Add expense with split
4. Record settlement
5. View balances and activity
6. Receipt scanning and OCR
7. Payment integration flow

### Technology Stack

#### Web
```json
{
  "framework": "Playwright",
  "browsers": ["chromium", "firefox", "webkit"],
  "parallel": true,
  "video-on-failure": true
}
```

#### iOS
```json
{
  "framework": "XCUITest",
  "simulators": ["iPhone 13", "iPhone 15 Pro"],
  "real-device-testing": "BrowserStack or AWS Device Farm"
}
```

---

### E2E Test Examples

#### Web: Complete User Flow
```typescript
import { test, expect } from '@playwright/test';

test.describe('Expense Creation Flow', () => {
  test('should create expense from start to finish', async ({ page }) => {
    // Login
    await page.goto('https://app.splittab.com/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');

    // Navigate to group
    await page.click('text=Roommates');
    await expect(page).toHaveURL(/\/groups\/.*/);

    // Click add expense
    await page.click('[data-testid="add-expense-button"]');

    // Fill expense form
    await page.fill('[name="amount"]', '45.50');
    await page.fill('[name="description"]', 'Dinner at Italian restaurant');
    await page.selectOption('[name="category"]', 'food_dining');

    // Select participants
    await page.click('[data-testid="participant-alice"]');
    await page.click('[data-testid="participant-bob"]');

    // Choose split method (equal)
    await page.click('text=Split equally');

    // Verify split preview
    await expect(page.locator('text=You: $22.75')).toBeVisible();
    await expect(page.locator('text=Alice: $22.75')).toBeVisible();

    // Save expense
    await page.click('button:has-text("Save Expense")');

    // Verify success
    await expect(page.locator('text=Expense saved successfully')).toBeVisible();
    await expect(page.locator('text=Dinner at Italian restaurant')).toBeVisible();

    // Verify balance updated
    await expect(page.locator('[data-testid="balance-summary"]')).toContainText('$22.75');
  });
});
```

#### iOS: Complete Flow
```swift
import XCTest

class ExpenseCreationUITests: XCTestCase {
    var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testCreateExpense() throws {
        // Login
        let emailField = app.textFields["Email"]
        emailField.tap()
        emailField.typeText("test@example.com")

        let passwordField = app.secureTextFields["Password"]
        passwordField.tap()
        passwordField.typeText("password123")

        app.buttons["Login"].tap()

        // Wait for dashboard
        XCTAssertTrue(app.staticTexts["Dashboard"].waitForExistence(timeout: 5))

        // Tap group
        app.buttons["Roommates"].tap()

        // Tap add expense
        app.buttons["Add Expense"].tap()

        // Fill form
        let amountField = app.textFields["Amount"]
        amountField.tap()
        amountField.typeText("45.50")

        let descriptionField = app.textFields["Description"]
        descriptionField.tap()
        descriptionField.typeText("Dinner at Italian restaurant")

        // Select category
        app.buttons["Category"].tap()
        app.buttons["Food & Dining"].tap()

        // Select participants
        app.buttons["Alice"].tap()
        app.buttons["Bob"].tap()

        // Tap save
        app.buttons["Save"].tap()

        // Verify success
        XCTAssertTrue(app.staticTexts["Expense saved"].exists)
        XCTAssertTrue(app.staticTexts["Dinner at Italian restaurant"].exists)
    }
}
```

---

## Performance Testing

### Scope
- API response times
- Database query performance
- Page load times
- Mobile app responsiveness

### Tools
- **Load Testing**: k6, Artillery
- **Database**: EXPLAIN ANALYZE
- **Web Performance**: Lighthouse, WebPageTest
- **iOS Performance**: Xcode Instruments

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response (p95) | < 200ms | k6 |
| API Response (p99) | < 500ms | k6 |
| Database Query | < 50ms | pg_stat_statements |
| Page Load (FCP) | < 1.5s | Lighthouse |
| Page Load (LCP) | < 2.5s | Lighthouse |
| App Launch Time | < 2s | Xcode Instruments |

---

### Load Testing Example

```javascript
// k6 load test script
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'], // 95% < 200ms, 99% < 500ms
    http_req_failed: ['rate<0.01'], // Error rate < 1%
  },
};

export default function () {
  const baseUrl = 'https://api.splittab.com/v1';
  const token = 'YOUR_AUTH_TOKEN';

  // Get expenses
  const res = http.get(`${baseUrl}/expenses`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
```

---

## Accessibility Testing

### Scope
- Keyboard navigation
- Screen reader support
- Color contrast
- Touch target sizes
- ARIA labels

### Tools
- **Web**: axe-core, Lighthouse, WAVE
- **iOS**: Accessibility Inspector, VoiceOver

### Accessibility Checklist

#### Web
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] Proper heading hierarchy
- [ ] ARIA labels on icons/buttons
- [ ] Color contrast ratio ≥ 4.5:1
- [ ] Alt text on images
- [ ] Form labels associated
- [ ] Skip links for main content

#### iOS
- [ ] VoiceOver support
- [ ] Dynamic Type support
- [ ] Sufficient touch targets (44×44pt)
- [ ] Reduce Motion support
- [ ] High Contrast support

---

### Accessibility Test Example

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<ExpenseForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be keyboard navigable', () => {
    const { getByRole } = render(<ExpenseForm />);

    const amountInput = getByRole('textbox', { name: /amount/i });
    const descriptionInput = getByRole('textbox', { name: /description/i });
    const submitButton = getByRole('button', { name: /save/i });

    // Tab through elements
    amountInput.focus();
    expect(document.activeElement).toBe(amountInput);

    userEvent.tab();
    expect(document.activeElement).toBe(descriptionInput);

    userEvent.tab();
    expect(document.activeElement).toBe(submitButton);
  });
});
```

---

## Security Testing

### Scope
- Authentication vulnerabilities
- Authorization bypasses
- SQL injection
- XSS attacks
- CSRF protection
- Rate limiting

### Tools
- **Automated**: OWASP ZAP, Snyk
- **Manual**: Burp Suite
- **Dependencies**: npm audit, Dependabot

### Security Test Examples

```typescript
describe('Security', () => {
  describe('SQL Injection', () => {
    it('should prevent SQL injection in search', async () => {
      const maliciousInput = "'; DROP TABLE users; --";

      const response = await request(app)
        .get(`/api/v1/expenses?search=${maliciousInput}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should not execute SQL, should treat as string
      expect(response.body.data).toEqual([]);

      // Verify users table still exists
      const users = await db.user.findMany();
      expect(users).toBeDefined();
    });
  });

  describe('XSS', () => {
    it('should escape user input in expense description', async () => {
      const xssPayload = '<script>alert("XSS")</script>';

      const response = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: xssPayload,
          amount: 10,
          // ... other fields
        })
        .expect(201);

      // Verify script tags are escaped
      expect(response.body.data.description).not.toContain('<script>');
      expect(response.body.data.description).toContain('&lt;script&gt;');
    });
  });

  describe('Authorization', () => {
    it('should prevent accessing other users expenses', async () => {
      const otherUserExpense = await createExpense({ userId: 'other-user' });

      await request(app)
        .get(`/api/v1/expenses/${otherUserExpense.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const attempts = [];

      // Try to login 11 times
      for (let i = 0; i < 11; i++) {
        attempts.push(
          request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'test@example.com', password: 'wrong' })
        );
      }

      const responses = await Promise.all(attempts);

      // 11th request should be rate limited
      expect(responses[10].status).toBe(429);
    });
  });
});
```

---

## Regression Testing

### Scope
- Previously fixed bugs
- Critical functionality
- High-risk areas

### Strategy
- **Automated**: Add test for each fixed bug
- **Regression Suite**: Run before each release
- **CI/CD**: Run on every commit

### Bug Fix Test Template

```typescript
describe('Bug #123: Incorrect balance calculation', () => {
  it('should correctly calculate balance with multiple currencies', async () => {
    // Reproduce bug scenario
    const expense1 = await createExpense({
      amount: 100,
      currency: 'USD'
    });

    const expense2 = await createExpense({
      amount: 50,
      currency: 'EUR'
    });

    // Verify fix
    const balances = await getBalances(userId);
    expect(balances.totalOwed).toBe(/* expected value */);

    // Verify doesn't regress
    // ... additional assertions
  });
});
```

---

## Test Data Management

### Test Database Strategy

```typescript
// Setup test database
beforeAll(async () => {
  // Use separate test database
  process.env.DATABASE_URL = 'postgresql://localhost/splittab_test';

  // Run migrations
  await db.migrate.latest();
});

// Clean up between tests
beforeEach(async () => {
  // Truncate all tables
  await db.raw('TRUNCATE TABLE users, groups, expenses CASCADE');
});

afterAll(async () => {
  // Close connections
  await db.destroy();
});
```

### Test Data Factories

```typescript
// User factory
export function createTestUser(overrides = {}) {
  return {
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Test User',
    defaultCurrency: 'USD',
    ...overrides
  };
}

// Expense factory
export function createTestExpense(overrides = {}) {
  return {
    amount: 100,
    currency: 'USD',
    description: 'Test Expense',
    category: 'food_dining',
    date: new Date(),
    participants: [],
    ...overrides
  };
}
```

---

## Continuous Integration Testing

### CI Pipeline

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-videos
          path: test-results/

  ios-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - run: xcodebuild test -scheme SplitTab -destination 'platform=iOS Simulator,name=iPhone 15 Pro'
```

---

## Test Metrics & Reporting

### Key Metrics

1. **Code Coverage**
   - Target: 80% overall
   - Critical paths: 95%
   - Report in CI/CD

2. **Test Execution Time**
   - Unit tests: < 2 minutes
   - Integration tests: < 5 minutes
   - E2E tests: < 15 minutes

3. **Flaky Tests**
   - Track flaky test rate
   - Target: < 1%
   - Quarantine flaky tests

4. **Bug Escape Rate**
   - Bugs found in production / total bugs
   - Target: < 5%

### Reporting

```typescript
// Generate test report
import { reporters } from '@jest/reporters';

export default {
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'SplitTab Test Report',
        outputPath: './test-reports/index.html'
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: './test-reports',
        outputName: 'junit.xml'
      }
    ]
  ]
};
```

---

## Manual Testing

### Exploratory Testing

#### Test Charters
1. **Expense Creation**: Explore edge cases in expense creation
2. **Split Calculations**: Test unusual split scenarios
3. **Multi-Currency**: Test currency conversion edge cases
4. **Offline Mode**: Test offline behavior and sync

#### Testing Sessions
- **Duration**: 90 minutes
- **Frequency**: Weekly
- **Participants**: Developers, QA, Product
- **Output**: Bug reports, test ideas

### User Acceptance Testing (UAT)

#### Process
1. Feature complete in staging
2. Create test scenarios
3. Recruit beta testers
4. Provide test instructions
5. Collect feedback
6. Prioritize issues
7. Fix critical issues
8. Re-test
9. Release

---

## Testing Checklist

### Pre-Release Checklist

#### Automated Tests
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Code coverage ≥ 80%
- [ ] No known flaky tests

#### Manual Tests
- [ ] Exploratory testing complete
- [ ] UAT feedback addressed
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsive testing
- [ ] Accessibility audit
- [ ] Performance testing
- [ ] Security scan

#### Platform Specific

**iOS**
- [ ] Test on physical devices
- [ ] Test on different iOS versions (15, 16, 17)
- [ ] Test on different screen sizes
- [ ] VoiceOver testing
- [ ] Dark mode testing

**Web**
- [ ] Cross-browser testing
- [ ] Mobile browser testing
- [ ] Keyboard navigation
- [ ] Screen reader testing (NVDA, JAWS)

---

## Test Maintenance

### Best Practices

1. **Keep Tests Fast**
   - Mock external dependencies
   - Use in-memory databases for unit tests
   - Parallelize test execution

2. **Avoid Brittle Tests**
   - Don't test implementation details
   - Use semantic selectors (role, label)
   - Avoid hard-coded waits

3. **Refactor Tests**
   - DRY principle
   - Shared test utilities
   - Regular cleanup

4. **Document Tests**
   - Clear test names
   - Comments for complex logic
   - README for test setup

### Test Review Process

- All code changes require tests
- Tests reviewed during code review
- Test coverage tracked in PR
- Flaky tests addressed immediately

---

**Document Version**: 1.0
**Last Updated**: 2025-11-21
**Status**: Draft
**Next Review**: Quarterly
