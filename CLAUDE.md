# Claude Development Guidelines for SplitTab

This document provides guidelines for AI-assisted development on the SplitTab project.

---

## 🚨 CRITICAL: PRE-PUSH PIPELINE CHECKLIST 🚨

**MANDATORY**: Before pushing ANY changes, you MUST run ALL checks below and ensure they pass. These commands mirror EXACTLY what the CI/CD pipelines run. If these checks fail locally, the pipeline WILL fail.

### 🎯 Quick Check Script

**EASIEST WAY**: Run the automated check script from the project root:

```bash
./check-pipelines.sh
```

This script will:
- Automatically detect which parts of the codebase changed
- Run all the exact checks that the CI/CD pipelines will run
- Give you a clear pass/fail result
- Tell you exactly what failed if something doesn't pass

**If the script passes, your pipelines will pass!**

Alternatively, you can run checks manually (see sections below).

### 📋 Backend Pipeline Checks (Runs on `backend/**` changes)

**IMPORTANT**: The backend pipeline includes 5 jobs that ALL must pass:

#### 1. Lint & Format Check
```bash
cd backend
npm ci                                    # Clean install dependencies
npm run lint                              # ESLint check
npx prettier --check "src/**/*.ts"        # Prettier format check
```

#### 2. TypeScript Type Check
```bash
cd backend
npm ci                                    # Clean install dependencies
npx prisma generate                       # Generate Prisma Client (REQUIRED!)
npx tsc --noEmit                         # TypeScript type check
```

#### 3. Tests (Requires Database & Redis)
```bash
cd backend
npm ci                                    # Clean install dependencies
npx prisma generate                       # Generate Prisma Client
# Pipeline runs: npx prisma migrate deploy
# Pipeline runs: npm test -- --coverage
npm test                                  # Run tests locally
```

**Note**: Tests require PostgreSQL and Redis. Pipeline uses Docker services, but you can skip tests locally if you don't have them set up. The pipeline WILL run them.

#### 4. Build Check
```bash
cd backend
npm ci                                    # Clean install dependencies
npx prisma generate                       # Generate Prisma Client (REQUIRED!)
npm run build                             # Build TypeScript to dist/
ls -la dist                              # Verify build output exists
```

#### 5. Security Audit
```bash
cd backend
npm audit --audit-level=moderate         # Check for vulnerabilities
```

**Note**: Security audit has `continue-on-error: true` in pipeline, but you should still check and address issues.

---

### 📱 Mobile Pipeline Checks (Runs on `mobile/**` changes)

**IMPORTANT**: The mobile pipeline includes 3 jobs that ALL must pass:

#### 1. Lint & Type Check
```bash
cd mobile
npm ci                                    # Clean install dependencies
npm run lint                              # ESLint check
npm run type-check                        # TypeScript type check
npm run format:check                      # Prettier format check
```

#### 2. Security Scan
```bash
cd mobile
npm ci                                    # Clean install dependencies
npm audit --audit-level=moderate         # Check for vulnerabilities
```

#### 3. Build Check
```bash
cd mobile
npm ci                                    # Clean install dependencies

# Create .env file (pipeline does this)
echo "API_BASE_URL=http://localhost:3000/api" > .env
echo "WS_URL=ws://localhost:3000" >> .env
echo "APP_ENV=development" >> .env

npm run prebuild                         # Run Expo prebuild
ls -la ios                               # Verify iOS directory exists
ls -la android                           # Verify Android directory exists
```

---

## 🔴 PRE-PUSH CHECKLIST (Step-by-Step)

Use this checklist before EVERY push:

### If You Modified Backend Files:

- [ ] `cd backend && npm ci`
- [ ] `npx prisma generate` (if schema changed)
- [ ] `npm run lint` - All ESLint checks pass
- [ ] `npx prettier --check "src/**/*.ts"` - All files formatted
- [ ] `npx tsc --noEmit` - No TypeScript errors
- [ ] `npm test` - All tests pass (if possible locally)
- [ ] `npm run build` - Build succeeds and dist/ exists
- [ ] `npm audit --audit-level=moderate` - No critical vulnerabilities

### If You Modified Mobile Files:

- [ ] `cd mobile && npm ci`
- [ ] `npm run lint` - All ESLint checks pass
- [ ] `npm run type-check` - No TypeScript errors
- [ ] `npm run format:check` - All files formatted
- [ ] `npm audit --audit-level=moderate` - No critical vulnerabilities
- [ ] Create `.env` file (if testing prebuild)
- [ ] `npm run prebuild` - Prebuild succeeds (optional locally)

### If Any Check Fails:

**🛑 DO NOT PUSH** - Fix all issues first, then re-run checks.

Common fixes:
- **Lint errors**: `npm run lint:fix`
- **Format errors**: `npm run format` (backend) or `npm run format` (mobile)
- **Type errors**: Fix the TypeScript issues manually
- **Build errors**: Check imports, Prisma generation, circular dependencies
- **Test failures**: Fix the failing tests
- **Audit issues**: `npm audit fix` (use caution with `--force`)

---

## Pre-Commit Checklist (Before Committing)

**IMPORTANT**: Before committing any changes locally:

### Backend (Node.js/TypeScript)

```bash
cd backend

# 1. Generate Prisma Client (if schema changed)
npx prisma generate

# 2. Type checking
npx tsc --noEmit

# 3. Linting
npm run lint

# 4. Format check
npx prettier --check "src/**/*.ts"

# 5. Build check
npm run build
```

### Mobile (React Native/Expo)

```bash
cd mobile

# 1. Type checking
npm run type-check

# 2. Linting
npm run lint

# 3. Format check
npm run format:check
```

## Commit Guidelines

### Before Every Commit:

1. **Run all linters and fix issues**
   - Fix all ESLint errors and warnings
   - Format code with Prettier
   - Resolve all TypeScript type errors

2. **Run security audits**
   - Check `npm audit` output
   - Address any high/critical vulnerabilities
   - Document any accepted vulnerabilities with justification

3. **Run tests**
   - All existing tests must pass
   - Add tests for new functionality
   - Maintain or improve test coverage

4. **Verify build**
   - Ensure the project builds without errors
   - Check for any build warnings

5. **Review changes**
   - Use `git diff` to review all changes
   - Ensure no debug code or console.logs remain
   - Verify no sensitive data is being committed

### If Any Check Fails:

**DO NOT COMMIT** - Fix all issues first, then re-run checks.

### Commit Message Format:

```
<emoji> <type>: <subject>

<body>

<footer>
```

Examples:
- `🐛 Fix: Resolve authentication token refresh issue`
- `✨ Feature: Add expense splitting by percentage`
- `🔧 Refactor: Improve API error handling`
- `📱 Mobile: Implement home dashboard`
- `🧪 Test: Add unit tests for balance calculation`

## Code Quality Standards

### TypeScript

- Use strict mode
- Define explicit types (avoid `any`)
- Use interfaces for object shapes
- Leverage union types and type guards

### React/React Native

- Use functional components with hooks
- Implement proper error boundaries
- Use memo/useMemo/useCallback appropriately
- Follow React best practices

### API Development

- Validate all inputs with Zod
- Implement proper error handling
- Use TypeScript types for requests/responses
- Document endpoints

### Security

- Never commit secrets or API keys
- Use environment variables for configuration
- Sanitize all user inputs
- Implement proper authentication checks

## Project Structure

### Backend (`/backend`)
- `/src/api` - API route handlers
- `/src/services` - Business logic
- `/src/db` - Database models and migrations
- `/src/utils` - Utility functions
- `/src/types` - TypeScript types

### Mobile (`/mobile`)
- `/src/screens` - Screen components
- `/src/components` - Reusable UI components
- `/src/navigation` - Navigation configuration
- `/src/store` - State management (Zustand)
- `/src/api` - API client and endpoints
- `/src/services` - Business logic services
- `/src/utils` - Utility functions
- `/src/types` - TypeScript types

## Development Workflow

1. Create/checkout feature branch
2. Implement changes
3. **Run pre-commit checks** (see Pre-Commit Checklist above)
4. Fix any issues
5. Commit with descriptive message
6. **🚨 CRITICAL: Run PRE-PUSH CHECKLIST** (see above) - This ensures pipelines pass!
7. Push to remote
8. Verify CI/CD pipelines pass
9. Create pull request

## Testing Requirements

- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests for React components
- E2E tests for critical user flows (when available)

## Documentation

- Update README when adding new features
- Document complex algorithms and business logic
- Add JSDoc comments for public APIs
- Update implementation plans as phases complete

## Common Issues and Solutions

### Linting Errors
```bash
npm run lint:fix  # Auto-fix many issues
```

### Type Errors
```bash
npm run type-check  # Show all type errors
```

### Audit Vulnerabilities
```bash
npm audit fix  # Auto-fix vulnerabilities
npm audit fix --force  # Force fix (use with caution)
```

### Build Failures
- Clear caches: `rm -rf node_modules package-lock.json && npm install`
- Check for circular dependencies
- Verify all imports are correct

## Performance Considerations

- Optimize database queries (use indexes, limit results)
- Implement pagination for large datasets
- Use React.memo for expensive components
- Lazy load routes and components
- Monitor bundle size

## Accessibility

- Use semantic HTML/React Native components
- Add appropriate ARIA labels
- Ensure keyboard navigation works
- Test with screen readers
- Maintain color contrast ratios (WCAG AA)

## 🚨 FINAL CRITICAL REMINDERS 🚨

### NEVER Push Code That:

- ❌ Has linting errors (`npm run lint` fails)
- ❌ Has type errors (`npm run type-check` or `npx tsc --noEmit` fails)
- ❌ Has format errors (`npm run format:check` or `npx prettier --check` fails)
- ❌ Fails tests (`npm test` fails)
- ❌ Fails to build (`npm run build` fails)
- ❌ Contains debug code or console.logs
- ❌ Includes secrets, credentials, or API keys
- ❌ Has unresolved security vulnerabilities (high/critical)
- ❌ Missing Prisma Client generation (backend)
- ❌ Missing .env file setup (mobile prebuild)

### ALWAYS Before Pushing:

✅ Run the **PRE-PUSH PIPELINE CHECKLIST** at the top of this document
✅ Ensure ALL checks pass locally
✅ Fix ANY failures before pushing
✅ Verify the exact commands the pipeline will run
✅ Double-check that `npm ci` installs cleanly

### Pipeline Failure Prevention:

The CI/CD pipelines run on:
- **Backend**: Any changes to `backend/**` or `.github/workflows/backend-ci.yml`
- **Mobile**: Any changes to `mobile/**` or `.github/workflows/mobile-ci.yml`

Each pipeline has multiple jobs (lint, typecheck, test, build, security). **ALL** must pass for the pipeline to succeed.

**If you push code that fails the pipeline:**
1. The pipeline will fail publicly
2. You'll need to fix the issues
3. You'll need to push again
4. This wastes time and CI/CD resources

**Save time by running all checks locally first!**

---

### Quick Command Reference:

**Backend Pre-Push:**
```bash
cd backend && npm ci && npx prisma generate && npm run lint && npx prettier --check "src/**/*.ts" && npx tsc --noEmit && npm test && npm run build && npm audit --audit-level=moderate
```

**Mobile Pre-Push:**
```bash
cd mobile && npm ci && npm run lint && npm run type-check && npm run format:check && npm audit --audit-level=moderate
```

**When in doubt, run the full PRE-PUSH CHECKLIST from the top of this document!**
