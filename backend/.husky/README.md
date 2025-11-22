# Git Hooks with Husky

This directory contains Git hooks managed by Husky to enforce code quality before commits and pushes.

## Setup

After cloning the repository, install dependencies:

```bash
cd backend
npm install
```

This will automatically set up the git hooks via the `prepare` script.

## Hooks

### Pre-commit Hook

Runs before every commit:
- **Lint-staged**: Automatically runs ESLint and Prettier on staged TypeScript files
- **Auto-fix**: Attempts to fix linting and formatting issues automatically
- **Staged files only**: Only checks files you're committing

**What it checks**:
- ESLint rules compliance
- Code formatting (Prettier)

**If it fails**: Fix the reported issues, stage the changes, and try committing again.

### Pre-push Hook

Runs before every push:
- **Type check**: Runs `tsc --noEmit` to verify TypeScript types
- **Build check**: Runs `npm run build` to ensure code compiles

**What it checks**:
- No TypeScript compilation errors
- Build succeeds

**If it fails**: Fix the TypeScript errors, commit the fixes, and try pushing again.

## Bypassing Hooks (Not Recommended)

In emergencies, you can bypass hooks:

```bash
# Skip pre-commit hook
git commit --no-verify -m "message"

# Skip pre-push hook
git push --no-verify
```

⚠️ **WARNING**: Only bypass hooks in emergencies. CI will still catch these issues.

## Troubleshooting

### Hooks not running

If hooks aren't running, re-initialize:

```bash
cd backend
npm run prepare
```

### Permission denied

Make hooks executable:

```bash
chmod +x .husky/pre-commit .husky/pre-push
```

### Husky not found

Ensure husky is installed:

```bash
npm install
```

## Benefits

✅ **Catch issues early**: Find problems before they reach CI
✅ **Faster feedback**: Get immediate feedback instead of waiting for CI
✅ **Cleaner history**: Prevent broken commits from entering the repository
✅ **Team consistency**: Everyone runs the same checks locally
✅ **Save CI time**: Reduce failed CI runs
