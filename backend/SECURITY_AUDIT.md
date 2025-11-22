# Security Audit Report - SplitTab Backend

**Audit Date:** 2025-11-22
**Auditor:** Security Review
**Scope:** SplitTab Backend API (Node.js/Express/Prisma)
**Overall Security Score:** 6.5/10

---

## Executive Summary

The SplitTab backend demonstrates good foundational security practices including password hashing, JWT authentication, input validation, and ORM usage. However, several critical and high-severity vulnerabilities were identified that require immediate attention, particularly around rate limiting implementation, authorization checks, and API security configurations.

**Risk Distribution:**
- Critical: 4 issues
- High: 5 issues
- Medium: 6 issues
- Low: 4 issues

---

## Critical Findings (Immediate Action Required)

### 1. Missing Rate Limiting on Authentication Endpoints
**Severity:** CRITICAL
**CWE:** CWE-307 (Improper Restriction of Excessive Authentication Attempts)
**Files:**
- `/home/user/SplitTab/backend/src/routes/auth.routes.ts`
- `/home/user/SplitTab/backend/src/middleware/rateLimit.ts`

**Issue:**
The `authLimiter` middleware is defined in `rateLimit.ts` (5 requests per 15 minutes) but is NOT applied to authentication endpoints in `auth.routes.ts`. This allows unlimited brute-force attacks on login, registration, and password reset endpoints.

**Evidence:**
```typescript
// rateLimit.ts - Defined but unused
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts...',
});

// auth.routes.ts - Missing authLimiter
router.post('/login', validate(loginSchema), authController.login.bind(authController));
router.post('/register', validate(createUserSchema), authController.register.bind(authController));
```

**Impact:**
- Unlimited brute-force attacks on user credentials
- Account enumeration via timing attacks
- Potential account takeover

**Recommendation:**
```typescript
// auth.routes.ts
import { authLimiter } from '../middleware/rateLimit';

router.post('/login', authLimiter, validate(loginSchema), authController.login.bind(authController));
router.post('/register', authLimiter, validate(createUserSchema), authController.register.bind(authController));
router.post('/password/reset-request', authLimiter, authController.requestPasswordReset.bind(authController));
router.post('/password/reset', authLimiter, authController.resetPassword.bind(authController));
```

---

### 2. Unauthenticated Utility Endpoints Exposure
**Severity:** CRITICAL
**CWE:** CWE-306 (Missing Authentication for Critical Function)
**File:** `/home/user/SplitTab/backend/src/routes/expense.routes.ts` (Lines 29-46)

**Issue:**
Two expense calculation endpoints are exposed without authentication, allowing anyone to use server resources:

```typescript
// Public endpoints - no authentication!
router.post('/calculate-split/equal', expenseController.calculateEqualSplit.bind(expenseController));
router.post('/calculate-split/percentage', expenseController.calculatePercentageSplit.bind(expenseController));
```

**Impact:**
- Computational resource abuse (DoS potential)
- Server resource exhaustion
- Unnecessary attack surface

**Recommendation:**
Add authentication middleware:
```typescript
router.post('/calculate-split/equal', authenticate, expenseController.calculateEqualSplit.bind(expenseController));
router.post('/calculate-split/percentage', authenticate, expenseController.calculatePercentageSplit.bind(expenseController));
```

---

### 3. Missing Authorization Check in Group Member Addition
**Severity:** CRITICAL
**CWE:** CWE-862 (Missing Authorization)
**File:** `/home/user/SplitTab/backend/src/controllers/group.controller.ts` (Lines 137-161)

**Issue:**
The `addMember` controller function does NOT verify that the requesting user is a group admin before allowing them to add members. Any group member can add other members.

**Evidence:**
```typescript
async addMember(req: Request, res: Response, next: NextFunction) {
  // No authorization check here!
  const { id } = req.params;
  const { userId, role } = req.body;

  const member = await groupService.addMember(id, { userId, role });
  // ...
}
```

The service layer (`groupService.addMember`) also doesn't verify admin permissions.

**Impact:**
- Any member can add unauthorized users to groups
- Privilege escalation (members adding themselves as admins)
- Data exposure to unauthorized users

**Recommendation:**
Add admin authorization check:
```typescript
async addMember(req: Request, res: Response, next: NextFunction) {
  if (!req.user) throw new ApiError(401, 'Authentication required');

  const { id } = req.params;

  // Verify requesting user is admin
  const isAdmin = await groupService.isAdmin(id, req.user.userId);
  if (!isAdmin) {
    throw new ApiError(403, 'Only group admins can add members');
  }

  const { userId, role } = req.body;
  const member = await groupService.addMember(id, { userId, role });
  // ...
}
```

---

### 4. Sensitive Data Exposure in Development Mode
**Severity:** CRITICAL
**CWE:** CWE-209 (Generation of Error Message Containing Sensitive Information)
**Files:**
- `/home/user/SplitTab/backend/src/controllers/auth.controller.ts` (Lines 150, 229)

**Issue:**
Password reset tokens and email verification tokens are returned in API responses during development mode. These tokens should NEVER be in API responses, even in development.

**Evidence:**
```typescript
// Lines 150-151
res.json({
  ...(isDevelopment && { resetToken: result.resetToken }),
});

// Lines 229-230
res.json({
  ...(isDevelopment && { verificationToken: result.verificationToken }),
});
```

**Impact:**
- Token exposure in logs, browser history, and monitoring tools
- Potential account takeover if logs are compromised
- Bad security practices in development affecting production mindset

**Recommendation:**
Remove token exposure entirely. For testing, use email mock services or logging:
```typescript
res.json({
  success: true,
  message: 'If a user with this email exists, a password reset link has been sent',
  // Never include: resetToken
});

// For development testing, log to console only
if (isDevelopment) {
  logger.debug(`Reset token for testing: ${result.resetToken}`);
}
```

---

## High Severity Findings

### 5. Missing Rate Limiting on File Upload Endpoints
**Severity:** HIGH
**CWE:** CWE-770 (Allocation of Resources Without Limits)
**File:** `/home/user/SplitTab/backend/src/routes/receipt.routes.ts`

**Issue:**
The `uploadLimiter` middleware (20 uploads per hour) is defined but NOT applied to the receipt upload endpoint.

**Evidence:**
```typescript
// uploadLimiter defined in rateLimit.ts but not used
router.post('/upload', authenticate, upload.single('receipt'), receiptController.uploadReceipt);
```

**Impact:**
- Storage exhaustion attacks
- Server resource abuse
- Increased cloud storage costs

**Recommendation:**
```typescript
import { uploadLimiter } from '../middleware/rateLimit';
router.post('/upload', authenticate, uploadLimiter, upload.single('receipt'), receiptController.uploadReceipt);
```

---

### 6. Insufficient JWT Secret Strength Enforcement
**Severity:** HIGH
**CWE:** CWE-326 (Inadequate Encryption Strength)
**File:** `/home/user/SplitTab/backend/src/config/env.validation.ts` (Lines 22-25)

**Issue:**
JWT secrets only require 32 characters minimum in non-production environments, and 64 characters in production. This is below cryptographic best practices (should be 256 bits = 64 hex chars minimum always).

**Evidence:**
```typescript
JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
```

**Impact:**
- Weaker JWT tokens in development/testing
- Potential brute-force attacks on JWT signatures
- Development practices affecting production security

**Recommendation:**
```typescript
JWT_ACCESS_SECRET: z.string().min(64, 'JWT_ACCESS_SECRET must be at least 64 characters'),
JWT_REFRESH_SECRET: z.string().min(64, 'JWT_REFRESH_SECRET must be at least 64 characters'),
```

---

### 7. Missing CSRF Protection
**Severity:** HIGH
**CWE:** CWE-352 (Cross-Site Request Forgery)
**File:** `/home/user/SplitTab/backend/src/app.ts`

**Issue:**
No CSRF protection middleware is implemented. State-changing operations (POST, PUT, DELETE) can be triggered via CSRF attacks.

**Impact:**
- Unauthorized actions on behalf of authenticated users
- Account modifications, expense creation, group deletion via CSRF

**Recommendation:**
Implement CSRF protection using `csurf` middleware:
```typescript
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Provide CSRF token endpoint
app.get('/api/v1/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

Or use double-submit cookie pattern with custom middleware.

---

### 8. Weak CORS Configuration
**Severity:** HIGH
**CWE:** CWE-942 (Permissive Cross-domain Policy)
**File:** `/home/user/SplitTab/backend/src/app.ts` (Lines 27-33)

**Issue:**
CORS configuration allows multiple origins via environment variable without validation. Wildcards or overly permissive origins could be configured.

**Evidence:**
```typescript
cors({
  origin: config.allowedOrigins, // Split from env var, no validation
  credentials: true,
})
```

**Impact:**
- Potential for malicious sites to make authenticated requests
- Data exfiltration via XSS on trusted domains
- Credential theft if misconfigured

**Recommendation:**
Add origin validation:
```typescript
cors({
  origin: (origin, callback) => {
    if (!origin || config.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600, // 10 minutes
})
```

---

### 9. No Email Verification Enforcement on Critical Operations
**Severity:** HIGH
**CWE:** CWE-306 (Missing Authentication for Critical Function)
**File:** `/home/user/SplitTab/backend/src/middleware/auth.ts` (Lines 100-125)

**Issue:**
The `requireEmailVerification` middleware exists but is NOT used on any routes. Unverified users can perform all operations including financial transactions.

**Impact:**
- Fake accounts can create expenses, groups, and settlements
- Email-based account recovery is unreliable
- Spam and abuse potential

**Recommendation:**
Apply email verification to critical routes:
```typescript
// In routes/group.routes.ts
router.post('/', authenticate, requireEmailVerification, validate(createGroupSchema), groupController.createGroup);

// In routes/expense.routes.ts
router.post('/', authenticate, requireEmailVerification, validate(createExpenseSchema), expenseController.createExpense);

// In routes/settlement.routes.ts
router.post('/', authenticate, requireEmailVerification, validate(createSettlementSchema), settlementController.createSettlement);
```

---

## Medium Severity Findings

### 10. No Account Lockout Mechanism
**Severity:** MEDIUM
**CWE:** CWE-307 (Improper Restriction of Excessive Authentication Attempts)
**File:** `/home/user/SplitTab/backend/src/services/auth.service.ts`

**Issue:**
No account lockout after multiple failed login attempts. Rate limiting alone may not prevent distributed brute-force attacks.

**Recommendation:**
Implement account lockout tracking:
- Track failed login attempts in database
- Lock account after 5 failed attempts
- Require password reset or time-based unlock (30 minutes)

---

### 11. Missing Secure Cookie Configuration for Refresh Tokens
**Severity:** MEDIUM
**CWE:** CWE-614 (Sensitive Cookie in HTTPS Session Without 'Secure' Attribute)
**File:** `/home/user/SplitTab/backend/src/controllers/auth.controller.ts`

**Issue:**
Refresh tokens are returned in JSON response body instead of secure HTTP-only cookies.

**Impact:**
- XSS vulnerabilities can steal refresh tokens
- Tokens stored in localStorage are vulnerable

**Recommendation:**
Return refresh tokens as HTTP-only, secure cookies:
```typescript
res.cookie('refreshToken', tokens.refreshToken, {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
});
```

---

### 12. Insufficient Content Security Policy
**Severity:** MEDIUM
**CWE:** CWE-1021 (Improper Restriction of Rendered UI Layers)
**File:** `/home/user/SplitTab/backend/src/app.ts` (Line 24)

**Issue:**
Helmet is used with default settings, but no custom CSP headers configured for API.

**Recommendation:**
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'none'"],
      styleSrc: ["'none'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

---

### 13. User Enumeration via Search Endpoint
**Severity:** MEDIUM
**CWE:** CWE-200 (Exposure of Sensitive Information)
**File:** `/home/user/SplitTab/backend/src/services/user.service.ts` (Lines 358-374)

**Issue:**
User search endpoint allows case-insensitive searches on email addresses without rate limiting, enabling user enumeration.

**Evidence:**
```typescript
async searchUsers(query: string, limit: number = 10) {
  // No authorization check, allows email enumeration
  OR: [
    { name: { contains: query, mode: 'insensitive' } },
    { email: { contains: query, mode: 'insensitive' } },
  ]
}
```

**Recommendation:**
- Require minimum query length (3+ characters)
- Rate limit search requests aggressively
- Only allow searching within user's groups
- Don't expose email addresses to non-group members

---

### 14. Unvalidated Password Reset Token Expiry
**Severity:** MEDIUM
**CWE:** CWE-640 (Weak Password Recovery Mechanism)
**File:** `/home/user/SplitTab/backend/src/services/auth.service.ts` (Line 181)

**Issue:**
Password reset tokens expire in 1 hour, which may be too long for a highly sensitive operation.

**Recommendation:**
Reduce expiry to 15-30 minutes:
```typescript
passwordResetExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
```

---

### 15. Missing Input Sanitization on File Names
**Severity:** MEDIUM
**CWE:** CWE-73 (External Control of File Name or Path)
**File:** `/home/user/SplitTab/backend/src/utils/fileUpload.ts` (Line 34)

**Issue:**
File extension is taken directly from original filename without sanitization. Malicious filenames could cause issues.

**Evidence:**
```typescript
filename: (_req, file, cb) => {
  const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`; // Unsanitized
  cb(null, uniqueName);
}
```

**Recommendation:**
```typescript
filename: (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
  const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf', '.heic', '.heif'];
  const safeExt = allowedExts.includes(ext) ? ext : '.bin';
  const uniqueName = `${uuidv4()}${safeExt}`;
  cb(null, uniqueName);
}
```

---

## Low Severity Findings

### 16. Stack Traces Exposed in Development
**Severity:** LOW
**CWE:** CWE-209 (Generation of Error Message Containing Sensitive Information)
**File:** `/home/user/SplitTab/backend/src/middleware/errorHandler.ts` (Line 28)

**Issue:**
Stack traces are exposed in error responses during development mode.

**Recommendation:**
Acceptable for development, but ensure NODE_ENV=production in production.

---

### 17. Missing X-Content-Type-Options Header
**Severity:** LOW
**CWE:** CWE-430 (Deployment of Wrong Handler)
**File:** `/home/user/SplitTab/backend/src/app.ts`

**Issue:**
Helmet provides this by default, but verify it's not disabled.

**Recommendation:**
Explicitly set:
```typescript
app.use(helmet({ noSniff: true }));
```

---

### 18. No Request ID Tracking
**Severity:** LOW
**CWE:** CWE-778 (Insufficient Logging)
**File:** `/home/user/SplitTab/backend/src/middleware/requestLogger.ts`

**Issue:**
Error responses reference `x-request-id` header but no middleware generates it.

**Recommendation:**
Add request ID middleware:
```typescript
import { v4 as uuidv4 } from 'uuid';

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});
```

---

### 19. Insufficient Password Reset Attempt Logging
**Severity:** LOW
**CWE:** CWE-778 (Insufficient Logging)
**File:** `/home/user/SplitTab/backend/src/services/auth.service.ts`

**Issue:**
Password reset attempts are not logged for security monitoring.

**Recommendation:**
Add logging for password reset requests and completions.

---

## Positive Security Practices Found

1. **Strong Password Hashing**: bcrypt with cost factor 12 ✓
2. **SQL Injection Prevention**: Using Prisma ORM with parameterized queries ✓
3. **Input Validation**: Comprehensive Zod schemas ✓
4. **JWT Best Practices**: Separate access/refresh tokens with type validation ✓
5. **Password Complexity**: Requires uppercase, lowercase, numbers, min 8 chars ✓
6. **Soft Deletes**: Implemented for data recovery ✓
7. **Environment Validation**: Strong env var validation at startup ✓
8. **Session Management**: Proper session expiry and revocation ✓
9. **Authorization Checks**: Most endpoints verify group membership ✓
10. **Helmet Usage**: Basic security headers configured ✓

---

## Dependency Security Review

**Package.json Analysis:**

Critical dependencies to monitor:
- `jsonwebtoken: ^9.0.2` - Check for CVEs regularly
- `bcrypt: ^5.1.1` - Verify latest version
- `express: ^4.18.2` - Known vulnerabilities in older versions
- `multer: ^1.4.5-lts.1` - File upload vulnerabilities
- `socket.io: ^4.8.1` - WebSocket security issues

**Recommendation:**
Run `npm audit` regularly and keep dependencies updated:
```bash
npm audit
npm audit fix
npm outdated
```

---

## Compliance Considerations

### OWASP Top 10 2021 Coverage

1. **A01: Broken Access Control** - ⚠️ CRITICAL issues found (Missing auth checks)
2. **A02: Cryptographic Failures** - ⚠️ HIGH (Weak JWT secret validation)
3. **A03: Injection** - ✓ GOOD (Prisma prevents SQL injection)
4. **A04: Insecure Design** - ⚠️ MEDIUM (Missing CSRF, lockout mechanism)
5. **A05: Security Misconfiguration** - ⚠️ HIGH (Missing rate limiters, weak CORS)
6. **A06: Vulnerable Components** - ⚠️ MEDIUM (Need dependency updates)
7. **A07: Identification & Authentication** - ⚠️ CRITICAL (No rate limiting on auth)
8. **A08: Software and Data Integrity** - ✓ GOOD (Proper validation)
9. **A09: Security Logging** - ⚠️ LOW (Insufficient logging)
10. **A10: Server-Side Request Forgery** - ✓ N/A (No SSRF vectors found)

---

## Recommended Remediation Priority

### Phase 1 (Immediate - Within 1 week)
1. Apply `authLimiter` to all authentication endpoints
2. Add authentication to utility endpoints
3. Fix missing authorization check in `addMember`
4. Remove sensitive token exposure in dev mode
5. Apply `uploadLimiter` to file upload endpoints

### Phase 2 (High Priority - Within 2 weeks)
6. Implement CSRF protection
7. Strengthen CORS configuration
8. Enforce email verification on critical operations
9. Increase JWT secret minimum length to 64 chars
10. Implement account lockout mechanism

### Phase 3 (Medium Priority - Within 1 month)
11. Move refresh tokens to HTTP-only cookies
12. Add custom CSP headers
13. Restrict user search/enumeration
14. Reduce password reset token expiry
15. Sanitize file upload names
16. Add request ID middleware

### Phase 4 (Ongoing)
17. Regular dependency updates
18. Security logging improvements
19. Penetration testing
20. Security awareness training

---

## Testing Recommendations

1. **Automated Security Testing:**
   - Set up OWASP ZAP or Burp Suite scans
   - Integrate `npm audit` into CI/CD
   - Add security-focused unit tests

2. **Manual Testing:**
   - Test rate limiting on all auth endpoints
   - Verify authorization on all protected resources
   - Test file upload with malicious files
   - Attempt CSRF attacks on state-changing operations

3. **Code Review Checklist:**
   - Every new route has authentication
   - Every admin operation checks authorization
   - All user input is validated
   - Rate limiting applied where appropriate

---

## Conclusion

The SplitTab backend has a solid security foundation but requires immediate attention to critical vulnerabilities, particularly around rate limiting implementation and authorization checks. The development team demonstrates good security awareness with password hashing, input validation, and session management, but operational security practices need improvement.

**Overall Risk Assessment:** MEDIUM-HIGH

With the recommended fixes implemented, the security posture would improve to HIGH (8.5/10).

---

## References

- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [CWE Top 25 Most Dangerous Software Weaknesses](https://cwe.mitre.org/top25/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Report Generated:** 2025-11-22
**Next Review Date:** 2025-12-22 (Monthly review recommended)
