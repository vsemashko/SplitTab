# Claude Agent Instructions for SplitTab

## Code Quality Requirements

Before committing or pushing any changes, you MUST ensure:

### 1. Linting
- Run `npm run lint` in the appropriate directory (backend/web)
- Fix all ESLint errors and warnings
- Use `npm run lint:fix` to automatically fix issues when possible
- Ensure no linting errors remain before proceeding

### 2. Formatting
- Run `npm run format:check` to verify Prettier formatting
- Use `npm run format` to automatically format all files
- Ensure all files follow the project's Prettier configuration
- Verify no formatting errors remain

### 3. Type Checking
- Run `npm run typecheck` to verify TypeScript types
- Fix all type errors
- Do not use `any` types unless absolutely necessary and properly documented
- Ensure type safety across all changes

### 4. Testing
- Run `npm test` to execute all unit and integration tests
- Ensure all tests pass
- Add new tests for new functionality
- Update existing tests if behavior changes
- Aim for adequate test coverage

### 5. Build Verification
- Run `npm run build` to ensure the project builds successfully
- Verify no build errors or warnings
- Check that all dependencies are properly installed

## Pre-Push Checklist

Before pushing any changes to the repository:

1. ✅ All linting errors fixed (`npm run lint`)
2. ✅ All files properly formatted (`npm run format:check`)
3. ✅ All type errors resolved (`npm run typecheck`)
4. ✅ All tests passing (`npm test`)
5. ✅ Build succeeds without errors (`npm run build`)

## Workflow

1. Make code changes
2. Run pre-commit checks (linting + formatting - automatically done via husky)
3. Commit changes
4. Run pre-push checks (linting + formatting + typecheck + tests + build)
5. Push to remote

## CI/CD Pipeline

All pushes to branches matching `main`, `develop`, or `claude/**` will trigger:
- Lint & Format Check
- TypeScript Type Check
- Unit & Integration Tests
- Build Check
- Security Audit
- Prisma Schema Validation

Ensure all checks pass before creating or updating pull requests.

## Notes

- The pre-commit hook uses `lint-staged` to automatically fix and format changed files
- The pre-push hook runs comprehensive checks to catch issues before CI
- If any check fails, fix the issues before pushing
- Use `git commit --no-verify` only in exceptional circumstances (not recommended)
