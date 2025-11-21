# SplitTab Backend Testing Guide

## Overview

The SplitTab backend has comprehensive test coverage including unit tests, integration tests, and API tests. All tests are written using Jest and Supertest.

## Test Structure

```
backend/tests/
├── unit/                    # Unit tests for utilities and helpers
│   ├── validation.test.ts   # Zod schema validation tests
│   ├── jwt.test.ts          # JWT utility function tests
│   └── middleware.test.ts   # Middleware unit tests
├── integration/             # Integration tests for services
│   ├── auth.test.ts         # Authentication service tests
│   └── database.test.ts     # Database operations tests
└── api/                     # End-to-end API tests
    ├── user.api.test.ts     # User API endpoint tests
    ├── group.api.test.ts    # Group API endpoint tests
    ├── expense.api.test.ts  # Expense API endpoint tests
    └── settlement.api.test.ts # Settlement API endpoint tests
```

## Prerequisites

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set Up Test Database**:
   ```bash
   # Copy test environment file
   cp .env.test .env.test.local

   # Update DATABASE_URL in .env.test.local
   # IMPORTANT: Database name MUST contain 'test'
   DATABASE_URL=postgresql://user:password@localhost:5432/splittab_test
   ```

3. **Start Test Database**:
   ```bash
   # Option 1: Using Docker Compose
   docker-compose up -d postgres redis

   # Option 2: Use your own PostgreSQL and Redis instances
   # Make sure they're running and accessible
   ```

4. **Run Migrations**:
   ```bash
   npm run migrate:deploy
   ```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Specific Test Suite
```bash
# Unit tests only
npm test -- tests/unit

# Integration tests only
npm test -- tests/integration

# API tests only
npm test -- tests/api

# Specific file
npm test -- tests/api/user.api.test.ts
```

### Run Tests with Verbose Output
```bash
npm test -- --verbose
```

## Test Coverage

### Unit Tests (40+ test cases)

**JWT Utilities** (`tests/unit/jwt.test.ts`):
- ✅ Token generation (access and refresh)
- ✅ Token verification and validation
- ✅ Token extraction from headers
- ✅ Payload validation
- ✅ Security (tampering, expiration)
- ✅ Error handling

**Middleware** (`tests/unit/middleware.test.ts`):
- ✅ Authentication middleware
- ✅ Optional authentication
- ✅ Email verification checks
- ✅ Request validation (body, query, params)
- ✅ Error handler middleware

**Validation Schemas** (`tests/unit/validation.test.ts`):
- ✅ User schema validation
- ✅ Group schema validation
- ✅ Expense schema validation
- ✅ Settlement schema validation
- ✅ Email and password requirements
- ✅ Custom refinements

### Integration Tests (50+ test cases)

**Authentication Service** (`tests/integration/auth.test.ts`):
- ✅ User registration
- ✅ User login/logout
- ✅ Token refresh
- ✅ Password reset flow
- ✅ Email verification flow
- ✅ Session management
- ✅ OAuth login

**Database Operations** (`tests/integration/database.test.ts`):
- ✅ CRUD operations for all models
- ✅ Foreign key constraints
- ✅ Cascade deletes
- ✅ Transactions (rollback and commit)
- ✅ Indexes and performance

### API Tests (80+ test cases)

**User API** (`tests/api/user.api.test.ts`):
- ✅ Profile retrieval and updates
- ✅ Account deletion
- ✅ Balance calculation
- ✅ User search
- ✅ Authorization checks

**Group API** (`tests/api/group.api.test.ts`):
- ✅ Group creation and management
- ✅ Member management
- ✅ Role updates
- ✅ Group statistics
- ✅ Admin permissions

**Expense API** (`tests/api/expense.api.test.ts`):
- ✅ Expense creation with participants
- ✅ Expense retrieval and filtering
- ✅ Split calculations (equal and percentage)
- ✅ Expense statistics
- ✅ Participant validation

**Settlement API** (`tests/api/settlement.api.test.ts`):
- ✅ Settlement creation
- ✅ Confirmation workflow
- ✅ Settlement suggestions (optimization)
- ✅ Status management
- ✅ Authorization checks

## Test Database Safety

The test suite includes multiple safety checks to prevent accidental testing on production databases:

1. **Environment Variable Check**: `DATABASE_URL` must contain the word "test"
2. **Setup Validation**: Tests will fail immediately if using non-test database
3. **Test Isolation**: Each test suite cleans up its own data

## Continuous Integration

The project includes GitHub Actions CI/CD that automatically:

1. Runs linting and formatting checks
2. Performs TypeScript type checking
3. Executes full test suite with coverage
4. Verifies build process
5. Runs security audits

See `.github/workflows/backend-ci.yml` for details.

## Writing New Tests

### Unit Test Example
```typescript
describe('MyFunction', () => {
  it('should do something', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

### API Test Example
```typescript
describe('POST /api/v1/resource', () => {
  it('should create resource', async () => {
    const response = await request(app)
      .post('/api/v1/resource')
      .set('Authorization', `Bearer ${token}`)
      .send(data)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.resource).toBeDefined();
  });
});
```

### Integration Test Example
```typescript
describe('Service Method', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Cleanup test data
    await prisma.model.deleteMany();
  });

  it('should perform operation', async () => {
    const result = await service.method(params);
    expect(result).toBeDefined();
  });
});
```

## Troubleshooting

### Tests Failing to Connect to Database
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env.test.local`
- Run migrations: `npm run migrate:deploy`

### Test Timeouts
- Increase timeout in `jest.config.js`
- Check database connection performance
- Ensure Redis is running for session tests

### Permission Errors
- Check database user permissions
- Ensure test database exists and is accessible

### Port Conflicts
- Stop other services using ports 5432 (PostgreSQL), 6379 (Redis), or 3000 (API)

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data in `afterEach` or `afterAll`
3. **Meaningful Names**: Use descriptive test names
4. **Arrange-Act-Assert**: Follow AAA pattern
5. **Edge Cases**: Test both success and failure scenarios
6. **Security**: Test authorization and authentication
7. **Performance**: Keep tests fast (< 30s per suite)

## Coverage Goals

- **Overall**: > 80%
- **Business Logic**: > 90%
- **API Controllers**: > 85%
- **Services**: > 90%
- **Utilities**: > 95%

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
