# Claude Development Guidelines for SplitTab

This document provides guidelines for AI-assisted development on the SplitTab project.

## Pre-Commit Checklist

**IMPORTANT**: Before committing any changes, you MUST run the following checks and ensure they all pass:

### Backend (Node.js/TypeScript)

```bash
cd backend

# 1. Type checking
npm run type-check

# 2. Linting
npm run lint

# 3. Security audit
npm audit

# 4. Run tests (if available)
npm test

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

# 3. Security audit
npm audit

# 4. Format check
npm run format:check

# 5. Build check (if prebuild configured)
npm run prebuild --clean
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
3. **Run pre-commit checks** (see above)
4. Fix any issues
5. Commit with descriptive message
6. Push to remote
7. Create pull request

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

## Final Reminder

**NEVER commit code that:**
- Has linting errors
- Has type errors
- Fails tests
- Contains debug code
- Includes secrets or credentials
- Has unresolved security vulnerabilities (high/critical)

When in doubt, run the full pre-commit checklist!
