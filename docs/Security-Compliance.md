# Security & Compliance

## Overview

This document outlines security measures, compliance requirements, and best practices for SplitTab to ensure user data protection and regulatory compliance.

**Version**: 1.0
**Last Updated**: 2025-11-21

---

## Security Principles

### Core Security Principles

1. **Defense in Depth**: Multiple layers of security
2. **Least Privilege**: Minimal access rights for users and systems
3. **Secure by Default**: Security built-in, not bolted-on
4. **Zero Trust**: Never trust, always verify
5. **Privacy First**: User data privacy is paramount

---

## Authentication & Authorization

### Password Security

#### Password Requirements
```typescript
const passwordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // Optional but recommended
  preventCommonPasswords: true,
  preventEmailAsPassword: true
}
```

#### Password Hashing
- **Algorithm**: bcrypt
- **Cost Factor**: 12 (adjustable based on hardware)
- **Never** store plaintext passwords
- **Never** log passwords

```typescript
import bcrypt from 'bcrypt';

// Hashing
const hashedPassword = await bcrypt.hash(password, 12);

// Verification
const isValid = await bcrypt.compare(password, hashedPassword);
```

#### Password Reset
1. Generate cryptographically random token (256-bit)
2. Store hash of token in database
3. Token expires in 1 hour
4. Single-use only
5. Invalidate after password change

```typescript
import crypto from 'crypto';

// Generate reset token
const resetToken = crypto.randomBytes(32).toString('hex');
const resetTokenHash = crypto
  .createHash('sha256')
  .update(resetToken)
  .digest('hex');

// Store resetTokenHash and expiry in database
```

---

### JWT Token Security

#### Access Token
```typescript
const accessTokenPayload = {
  sub: userId,
  email: user.email,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
  type: 'access'
};

const accessToken = jwt.sign(accessTokenPayload, ACCESS_TOKEN_SECRET);
```

#### Refresh Token
```typescript
const refreshTokenPayload = {
  sub: userId,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
  type: 'refresh'
};

const refreshToken = jwt.sign(refreshTokenPayload, REFRESH_TOKEN_SECRET);
```

#### Token Storage
- **Web**: HTTP-only cookies (recommended) or localStorage (with XSS precautions)
- **iOS**: Keychain (encrypted)
- **Never** store tokens in:
  - URL parameters
  - localStorage (for sensitive data)
  - Session storage (insecure)
  - Cookies without HTTP-only flag

#### Token Rotation
- Rotate refresh tokens on use
- Invalidate old refresh tokens
- Detect token reuse (potential compromise)

---

### OAuth 2.0 (Social Login)

#### Supported Providers
- Google OAuth 2.0
- Apple Sign-In
- (Future: Facebook, GitHub)

#### OAuth Flow
1. User clicks "Sign in with Google"
2. Redirect to provider with client ID
3. User authorizes
4. Provider redirects back with authorization code
5. Exchange code for access token
6. Retrieve user profile
7. Create/link account
8. Issue SplitTab JWT tokens

#### Security Measures
- Use PKCE (Proof Key for Code Exchange)
- Validate state parameter
- Verify redirect URI
- Store OAuth tokens securely
- Regularly refresh tokens

---

### Two-Factor Authentication (2FA)

#### TOTP (Time-based One-Time Password)
```typescript
import speakeasy from 'speakeasy';

// Generate secret
const secret = speakeasy.generateSecret({
  name: 'SplitTab',
  issuer: 'SplitTab'
});

// Verify token
const verified = speakeasy.totp.verify({
  secret: secret.base32,
  encoding: 'base32',
  token: userToken,
  window: 2 // Allow 2 time steps (±60 seconds)
});
```

#### Implementation
- Optional for all users
- Required for business accounts
- QR code for easy setup
- Backup codes (10 single-use codes)
- Remember device option (30 days)

---

### Session Management

#### Session Security
```typescript
interface Session {
  id: string;
  userId: string;
  refreshToken: string; // Hashed
  deviceName: string;
  deviceType: 'ios' | 'web' | 'android';
  userAgent: string;
  ipAddress: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  revoked: boolean;
}
```

#### Session Features
- View active sessions
- Revoke individual sessions
- Revoke all sessions (logout everywhere)
- Automatic session expiry
- Detect suspicious sessions (new location/device)

---

## Data Security

### Encryption

#### Data at Rest
- **Database**: Encryption at rest (provider-managed keys)
- **File Storage**: Server-side encryption (S3/R2)
- **Sensitive Fields**: Application-level encryption
  - SSN, tax ID (if stored)
  - Bank account details
  - Payment card info (never store CVV)

#### Data in Transit
- **TLS 1.3**: All API communication
- **Certificate Pinning**: iOS app (optional)
- **HSTS**: Strict-Transport-Security header
- **Secure WebSockets**: WSS protocol

#### Application-Level Encryption
```typescript
import crypto from 'crypto';

// Encryption
function encrypt(text: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    iv: iv.toString('hex'),
    encrypted: encrypted.toString('hex'),
    authTag: authTag.toString('hex')
  });
}

// Decryption
function decrypt(encryptedData: string, key: string): string {
  const { iv, encrypted, authTag } = JSON.parse(encryptedData);
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
}
```

---

### Data Access Control

#### Role-Based Access Control (RBAC)

```typescript
enum Permission {
  // Group permissions
  GROUP_VIEW = 'group:view',
  GROUP_EDIT = 'group:edit',
  GROUP_DELETE = 'group:delete',
  GROUP_MANAGE_MEMBERS = 'group:manage_members',

  // Expense permissions
  EXPENSE_VIEW = 'expense:view',
  EXPENSE_CREATE = 'expense:create',
  EXPENSE_EDIT_OWN = 'expense:edit_own',
  EXPENSE_EDIT_ANY = 'expense:edit_any',
  EXPENSE_DELETE_OWN = 'expense:delete_own',
  EXPENSE_DELETE_ANY = 'expense:delete_any',

  // Settlement permissions
  SETTLEMENT_CREATE = 'settlement:create',
  SETTLEMENT_CONFIRM = 'settlement:confirm',
}

const rolePermissions = {
  admin: [
    Permission.GROUP_VIEW,
    Permission.GROUP_EDIT,
    Permission.GROUP_DELETE,
    Permission.GROUP_MANAGE_MEMBERS,
    Permission.EXPENSE_VIEW,
    Permission.EXPENSE_CREATE,
    Permission.EXPENSE_EDIT_ANY,
    Permission.EXPENSE_DELETE_ANY,
    Permission.SETTLEMENT_CREATE,
    Permission.SETTLEMENT_CONFIRM,
  ],
  member: [
    Permission.GROUP_VIEW,
    Permission.EXPENSE_VIEW,
    Permission.EXPENSE_CREATE,
    Permission.EXPENSE_EDIT_OWN,
    Permission.EXPENSE_DELETE_OWN,
    Permission.SETTLEMENT_CREATE,
    Permission.SETTLEMENT_CONFIRM,
  ],
  viewer: [
    Permission.GROUP_VIEW,
    Permission.EXPENSE_VIEW,
  ]
};
```

#### Data Isolation
- Users can only access their own data
- Group members can only access group data
- Enforce at database query level
- Validate ownership before operations

```typescript
// Example: Verify user has access to expense
async function verifyExpenseAccess(userId: string, expenseId: string) {
  const expense = await db.expense.findUnique({
    where: { id: expenseId },
    include: {
      group: {
        include: {
          members: true
        }
      }
    }
  });

  if (!expense) {
    throw new NotFoundError('Expense not found');
  }

  const isMember = expense.group.members.some(m => m.userId === userId);
  if (!isMember) {
    throw new ForbiddenError('Access denied');
  }

  return expense;
}
```

---

## Input Validation & Sanitization

### Validation Strategy

#### Schema Validation (Zod)
```typescript
import { z } from 'zod';

const expenseSchema = z.object({
  amount: z.number().positive().max(999999.99),
  currency: z.string().length(3).toUpperCase(),
  description: z.string().min(1).max(200).trim(),
  category: z.enum(['food_dining', 'groceries', /* ... */]),
  date: z.date().max(new Date()),
  groupId: z.string().uuid(),
  participants: z.array(
    z.object({
      userId: z.string().uuid(),
      paidAmount: z.number().min(0),
      owedAmount: z.number().min(0)
    })
  ).min(1)
}).refine(
  data => {
    const totalPaid = data.participants.reduce((sum, p) => sum + p.paidAmount, 0);
    return Math.abs(totalPaid - data.amount) < 0.01;
  },
  { message: 'Total paid must equal amount' }
);
```

#### Sanitization
```typescript
import DOMPurify from 'dompurify';
import validator from 'validator';

// HTML sanitization (for rich text)
const sanitizedHtml = DOMPurify.sanitize(userInput);

// Email validation
const isValidEmail = validator.isEmail(email);

// URL validation
const isValidUrl = validator.isURL(url);

// Escape SQL (use parameterized queries instead)
// Escape HTML
const escaped = validator.escape(userInput);
```

---

## Protection Against Common Attacks

### SQL Injection Prevention

#### Use Parameterized Queries
```typescript
// ✅ SAFE - Parameterized query
const user = await db.user.findUnique({
  where: { email: userEmail }
});

// ❌ UNSAFE - String concatenation
const query = `SELECT * FROM users WHERE email = '${userEmail}'`;
```

#### Use ORM (Prisma)
- Automatic parameterization
- Type-safe queries
- SQL injection protection built-in

---

### Cross-Site Scripting (XSS) Prevention

#### Content Security Policy (CSP)
```typescript
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self' https://api.splittab.com"
  );
  next();
});
```

#### Output Encoding
- Escape user-generated content
- Use React (automatic escaping)
- Sanitize HTML if accepting rich text

#### Input Validation
- Validate all user inputs
- Whitelist allowed characters
- Reject suspicious patterns

---

### Cross-Site Request Forgery (CSRF) Prevention

#### CSRF Tokens
```typescript
import csrf from 'csurf';

// Enable CSRF protection
app.use(csrf({ cookie: true }));

// Include token in forms
app.get('/form', (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});
```

#### SameSite Cookies
```typescript
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
});
```

#### Verify Origin Header
```typescript
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://splittab.com',
    'https://www.splittab.com'
  ];

  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
});
```

---

### Rate Limiting

#### API Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true, // Only count failed attempts
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
```

#### Account Lockout
```typescript
// After 5 failed login attempts
if (user.failedLoginAttempts >= 5) {
  const lockoutEndTime = user.lastFailedAttempt.getTime() + (15 * 60 * 1000);
  if (Date.now() < lockoutEndTime) {
    throw new Error('Account temporarily locked. Try again in 15 minutes.');
  }
  // Reset counter after lockout period
  user.failedLoginAttempts = 0;
}
```

---

### File Upload Security

#### Validation
```typescript
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';

const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/heic',
      'application/pdf'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Verify actual file type (not just extension)
async function verifyFileType(buffer: Buffer) {
  const type = await fileTypeFromBuffer(buffer);
  const allowed = ['jpg', 'png', 'heic', 'pdf'];

  if (!type || !allowed.includes(type.ext)) {
    throw new Error('Invalid file type');
  }
}
```

#### Virus Scanning
```typescript
import ClamScan from 'clamscan';

const clamscan = await new ClamScan().init({
  clamdscan: {
    host: 'clamav-service',
    port: 3310
  }
});

const { isInfected, viruses } = await clamscan.scanFile(filePath);
if (isInfected) {
  throw new Error(`File infected: ${viruses.join(', ')}`);
}
```

#### Secure Storage
- Store files outside web root
- Generate random filenames (UUIDs)
- Serve files through application (not directly)
- Use signed URLs with expiration

```typescript
import { S3 } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Generate signed URL (expires in 1 hour)
const command = new GetObjectCommand({
  Bucket: 'splittab-receipts',
  Key: fileKey
});

const signedUrl = await getSignedUrl(s3Client, command, {
  expiresIn: 3600
});
```

---

## Privacy & Compliance

### GDPR Compliance

#### Data Processing Principles
1. **Lawfulness, fairness, transparency**
2. **Purpose limitation**: Only use data for stated purposes
3. **Data minimization**: Collect only necessary data
4. **Accuracy**: Keep data accurate and up-to-date
5. **Storage limitation**: Delete data when no longer needed
6. **Integrity and confidentiality**: Secure data
7. **Accountability**: Demonstrate compliance

#### User Rights
- **Right to Access**: Export all user data
- **Right to Rectification**: Edit personal information
- **Right to Erasure**: Delete account and data
- **Right to Restrict Processing**: Limit data usage
- **Right to Data Portability**: Export in standard format (JSON)
- **Right to Object**: Opt-out of certain processing

#### Data Export
```typescript
async function exportUserData(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  const groups = await db.group.findMany({
    where: { members: { some: { userId } } }
  });
  const expenses = await db.expense.findMany({
    where: { participants: { some: { userId } } }
  });
  const settlements = await db.settlement.findMany({
    where: { OR: [{ payerId: userId }, { payeeId: userId }] }
  });

  return {
    user,
    groups,
    expenses,
    settlements,
    exportedAt: new Date(),
    format: 'json'
  };
}
```

#### Data Deletion
```typescript
async function deleteUserData(userId: string) {
  // Anonymize user data instead of hard delete
  await db.user.update({
    where: { id: userId },
    data: {
      email: `deleted_${userId}@deleted.local`,
      name: 'Deleted User',
      profilePictureUrl: null,
      phoneNumber: null,
      deletedAt: new Date()
    }
  });

  // Remove from groups
  await db.groupMember.updateMany({
    where: { userId },
    data: { leftAt: new Date() }
  });

  // Keep expenses (with anonymized creator)
  // Preserve financial records for audit
}
```

---

### CCPA Compliance (California)

#### "Do Not Sell My Personal Information"
- Clear opt-out mechanism
- Respect "Do Not Sell" signals
- No discrimination for opting out

#### Consumer Rights
- Right to know what data is collected
- Right to delete personal information
- Right to opt-out of sale of personal information
- Right to non-discrimination

---

### PCI DSS (Payment Card Industry)

#### If Handling Payment Cards
1. **Build and maintain secure network**
2. **Protect cardholder data**
3. **Maintain vulnerability management**
4. **Implement strong access control**
5. **Monitor and test networks**
6. **Maintain information security policy**

#### Recommendation: Use Stripe
- Stripe handles PCI compliance
- Never touch card data
- Use Stripe.js for card collection
- Tokenization handles security

---

## Audit Logging

### Audit Events
```typescript
interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
  result: 'success' | 'failure';
}

// Log critical actions
const auditEvents = [
  'user.login',
  'user.logout',
  'user.password_change',
  'user.delete',
  'expense.create',
  'expense.update',
  'expense.delete',
  'settlement.create',
  'settlement.confirm',
  'group.create',
  'group.delete',
  'group.member_add',
  'group.member_remove'
];
```

### Audit Log Retention
- **Security logs**: 1 year minimum
- **Financial transactions**: 7 years (regulatory requirement)
- **User activity**: 90 days
- **Admin actions**: Indefinite

---

## Incident Response

### Security Incident Response Plan

#### 1. Detection
- Automated alerts (Sentry, DataDog)
- User reports
- Security monitoring
- Penetration testing

#### 2. Containment
- Isolate affected systems
- Revoke compromised credentials
- Block malicious IPs
- Preserve evidence

#### 3. Eradication
- Identify root cause
- Patch vulnerabilities
- Remove malware/backdoors
- Update dependencies

#### 4. Recovery
- Restore from backups
- Verify system integrity
- Gradual service restoration
- Monitor for recurrence

#### 5. Post-Incident
- Incident report
- Lessons learned
- Update security measures
- User notification (if required)

### Breach Notification
- **GDPR**: Notify within 72 hours
- **CCPA**: Notify without unreasonable delay
- Notify affected users
- Report to authorities (if required)

---

## Security Testing

### Types of Testing

#### 1. Vulnerability Scanning
- Automated scanning (Snyk, OWASP ZAP)
- Dependency scanning
- Container scanning
- Infrastructure scanning

#### 2. Penetration Testing
- Annual third-party pentest
- Focus areas:
  - Authentication bypass
  - Authorization issues
  - SQL injection
  - XSS
  - CSRF
  - API vulnerabilities

#### 3. Security Code Review
- Manual code review
- Automated SAST (Static Analysis)
- Focus on:
  - Authentication logic
  - Authorization checks
  - Data validation
  - Cryptography usage

#### 4. Bug Bounty Program (Future)
- Responsible disclosure policy
- Defined scope
- Reward structure
- Hall of fame

---

## Security Headers

```typescript
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // HSTS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  next();
});
```

---

## Third-Party Security

### Vendor Security Assessment
- Review security practices
- Check compliance certifications
- Evaluate data handling
- Review SLA and incident response

### Third-Party Services
| Service | Data Shared | Security Measures |
|---------|-------------|-------------------|
| Stripe | Payment info | PCI DSS compliant |
| Plaid | Bank credentials | SOC 2 Type II |
| Google Cloud Vision | Receipt images | Data encryption, retention policy |
| SendGrid | Email addresses | SOC 2, GDPR compliant |
| Sentry | Error logs | Data scrubbing, retention limits |

---

## Employee Security

### Access Control
- Least privilege principle
- Role-based access
- MFA required for all accounts
- Regular access reviews

### Security Training
- Annual security training
- Phishing awareness
- Secure coding practices
- Incident response procedures

### Acceptable Use Policy
- Company device usage
- Password management
- Data handling
- Reporting procedures

---

## Compliance Checklist

### MVP Launch
- [ ] HTTPS everywhere
- [ ] Password hashing (bcrypt)
- [ ] JWT token security
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] File upload security
- [ ] Audit logging
- [ ] Privacy policy
- [ ] Terms of service
- [ ] GDPR data export
- [ ] GDPR data deletion
- [ ] Security headers

### Production
- [ ] SOC 2 Type II certification (Year 2)
- [ ] Annual penetration test
- [ ] Vulnerability scanning
- [ ] Incident response plan
- [ ] Disaster recovery plan
- [ ] Employee security training
- [ ] Third-party security reviews
- [ ] Bug bounty program
- [ ] Regular security audits

---

**Document Version**: 1.0
**Last Updated**: 2025-11-21
**Status**: Draft
**Next Review**: Quarterly
