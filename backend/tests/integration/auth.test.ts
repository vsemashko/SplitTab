import { PrismaClient } from '@prisma/client';
import { authService } from '../../src/services/auth.service';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

describe('Authentication Service', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('Register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test User',
      };

      const result = await authService.register(userData);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.name).toBe('Test User');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();

      // Verify password is hashed
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });
      expect(user?.passwordHash).toBeDefined();
      expect(user?.passwordHash).not.toBe('SecurePass123');
    });

    it('should create a session on register', async () => {
      const userData = {
        email: 'session@example.com',
        password: 'SecurePass123',
        name: 'Session User',
      };

      const result = await authService.register(userData);

      const sessions = await prisma.session.findMany({
        where: { userId: result.user.id },
      });

      expect(sessions).toHaveLength(1);
      expect(sessions[0].token).toBe(result.tokens.refreshToken);
    });

    it('should reject duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePass123',
        name: 'First User',
      };

      await authService.register(userData);

      await expect(
        authService.register({
          ...userData,
          name: 'Second User',
        })
      ).rejects.toThrow('User with this email already exists');
    });

    it('should convert email to lowercase', async () => {
      const userData = {
        email: 'UPPERCASE@EXAMPLE.COM',
        password: 'SecurePass123',
        name: 'Test User',
      };

      const result = await authService.register(userData);

      expect(result.user.email).toBe('uppercase@example.com');
    });
  });

  describe('Login', () => {
    beforeEach(async () => {
      // Create test user
      await authService.register({
        email: 'login@example.com',
        password: 'SecurePass123',
        name: 'Login User',
      });
    });

    it('should login with correct credentials', async () => {
      const result = await authService.login({
        email: 'login@example.com',
        password: 'SecurePass123',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('login@example.com');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should reject incorrect password', async () => {
      await expect(
        authService.login({
          email: 'login@example.com',
          password: 'WrongPassword123',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should reject non-existent email', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'SecurePass123',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should be case-insensitive for email', async () => {
      const result = await authService.login({
        email: 'LOGIN@EXAMPLE.COM',
        password: 'SecurePass123',
      });

      expect(result.user.email).toBe('login@example.com');
    });
  });

  describe('Refresh Token', () => {
    let refreshToken: string;
    let userId: string;

    beforeEach(async () => {
      const result = await authService.register({
        email: 'refresh@example.com',
        password: 'SecurePass123',
        name: 'Refresh User',
      });
      refreshToken = result.tokens.refreshToken;
      userId = result.user.id;
    });

    it('should refresh access token with valid refresh token', async () => {
      const tokens = await authService.refreshToken(refreshToken);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.refreshToken).not.toBe(refreshToken); // Should be new token
    });

    it('should reject invalid refresh token', async () => {
      await expect(authService.refreshToken('invalid-token')).rejects.toThrow();
    });

    it('should reject expired session', async () => {
      // Manually expire the session
      await prisma.session.updateMany({
        where: { userId },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow();
    });
  });

  describe('Logout', () => {
    let refreshToken: string;
    let userId: string;

    beforeEach(async () => {
      const result = await authService.register({
        email: 'logout@example.com',
        password: 'SecurePass123',
        name: 'Logout User',
      });
      refreshToken = result.tokens.refreshToken;
      userId = result.user.id;
    });

    it('should delete session on logout', async () => {
      await authService.logout(refreshToken);

      const sessions = await prisma.session.findMany({
        where: { userId },
      });

      expect(sessions).toHaveLength(0);
    });

    it('should handle logout with invalid token gracefully', async () => {
      await expect(authService.logout('invalid-token')).resolves.not.toThrow();
    });
  });

  describe('Password Reset', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await authService.register({
        email: 'reset@example.com',
        password: 'OldPassword123',
        name: 'Reset User',
      });
      userId = result.user.id;
    });

    it('should generate password reset token', async () => {
      const result = await authService.requestPasswordReset('reset@example.com');

      expect(result.resetToken).toBeDefined();

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      expect(user?.passwordResetToken).toBeDefined();
      expect(user?.passwordResetExpires).toBeDefined();
    });

    it('should not reveal if email does not exist', async () => {
      await expect(authService.requestPasswordReset('nonexistent@example.com')).rejects.toThrow(
        'If a user with this email exists'
      );
    });

    it('should reset password with valid token', async () => {
      const { resetToken } = await authService.requestPasswordReset('reset@example.com');

      await authService.resetPassword(resetToken, 'NewPassword123');

      // Try logging in with new password
      const result = await authService.login({
        email: 'reset@example.com',
        password: 'NewPassword123',
      });

      expect(result.user).toBeDefined();
    });

    it('should invalidate all sessions after password reset', async () => {
      // Create multiple sessions
      await authService.login({
        email: 'reset@example.com',
        password: 'OldPassword123',
      });

      const { resetToken } = await authService.requestPasswordReset('reset@example.com');
      await authService.resetPassword(resetToken, 'NewPassword123');

      const sessions = await prisma.session.findMany({
        where: { userId },
      });

      expect(sessions).toHaveLength(0);
    });

    it('should reject expired reset token', async () => {
      const { resetToken } = await authService.requestPasswordReset('reset@example.com');

      // Manually expire the token
      await prisma.user.update({
        where: { id: userId },
        data: { passwordResetExpires: new Date(Date.now() - 1000) },
      });

      await expect(authService.resetPassword(resetToken, 'NewPassword123')).rejects.toThrow(
        'Invalid or expired password reset token'
      );
    });
  });

  describe('Email Verification', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await authService.register({
        email: 'verify@example.com',
        password: 'SecurePass123',
        name: 'Verify User',
      });
      userId = result.user.id;
    });

    it('should send email verification token', async () => {
      const result = await authService.sendEmailVerification(userId);

      expect(result.verificationToken).toBeDefined();

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      expect(user?.emailVerificationToken).toBeDefined();
      expect(user?.emailVerificationExpires).toBeDefined();
    });

    it('should verify email with valid token', async () => {
      const { verificationToken } = await authService.sendEmailVerification(userId);

      await authService.verifyEmail(verificationToken);

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      expect(user?.emailVerified).toBe(true);
      expect(user?.emailVerificationToken).toBeNull();
      expect(user?.emailVerificationExpires).toBeNull();
    });

    it('should reject already verified email', async () => {
      const { verificationToken } = await authService.sendEmailVerification(userId);
      await authService.verifyEmail(verificationToken);

      await expect(authService.sendEmailVerification(userId)).rejects.toThrow(
        'Email is already verified'
      );
    });

    it('should reject expired verification token', async () => {
      const { verificationToken } = await authService.sendEmailVerification(userId);

      // Manually expire the token
      await prisma.user.update({
        where: { id: userId },
        data: { emailVerificationExpires: new Date(Date.now() - 1000) },
      });

      await expect(authService.verifyEmail(verificationToken)).rejects.toThrow(
        'Invalid or expired verification token'
      );
    });
  });

  describe('Session Management', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await authService.register({
        email: 'sessions@example.com',
        password: 'SecurePass123',
        name: 'Sessions User',
      });
      userId = result.user.id;
    });

    it('should get user sessions', async () => {
      // Create multiple sessions
      await authService.login({
        email: 'sessions@example.com',
        password: 'SecurePass123',
      });

      const sessions = await authService.getUserSessions(userId);

      expect(sessions.length).toBeGreaterThanOrEqual(2);
    });

    it('should revoke all sessions', async () => {
      // Create multiple sessions
      await authService.login({
        email: 'sessions@example.com',
        password: 'SecurePass123',
      });

      await authService.revokeAllSessions(userId);

      const sessions = await prisma.session.findMany({
        where: { userId },
      });

      expect(sessions).toHaveLength(0);
    });

    it('should revoke specific session', async () => {
      const sessions = await prisma.session.findMany({
        where: { userId },
      });

      const sessionToRevoke = sessions[0];

      await authService.revokeSession(sessionToRevoke.id, userId);

      const remainingSessions = await prisma.session.findMany({
        where: { userId },
      });

      expect(remainingSessions.length).toBe(sessions.length - 1);
    });

    it('should not allow revoking another users session', async () => {
      const otherUser = await authService.register({
        email: 'other@example.com',
        password: 'SecurePass123',
        name: 'Other User',
      });

      const sessions = await prisma.session.findMany({
        where: { userId },
      });

      await expect(authService.revokeSession(sessions[0].id, otherUser.user.id)).rejects.toThrow(
        'Session not found'
      );
    });
  });

  describe('OAuth Login', () => {
    it('should create new user with OAuth', async () => {
      const result = await authService.oauthLogin('google', 'google-123', 'oauth@example.com', 'OAuth User');

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('oauth@example.com');
      expect(result.user.emailVerified).toBe(true);
      expect(result.tokens.accessToken).toBeDefined();
    });

    it('should login existing user with OAuth', async () => {
      // Create user first
      const first = await authService.oauthLogin('google', 'google-123', 'oauth@example.com', 'OAuth User');

      // Login again with same OAuth
      const second = await authService.oauthLogin('google', 'google-123', 'oauth@example.com', 'OAuth User');

      expect(second.user.id).toBe(first.user.id);
    });

    it('should update OAuth info for existing email user', async () => {
      // Create regular user
      await authService.register({
        email: 'existing@example.com',
        password: 'SecurePass123',
        name: 'Existing User',
      });

      // Login with OAuth using same email
      const result = await authService.oauthLogin('google', 'google-123', 'existing@example.com', 'Existing User');

      const user = await prisma.user.findUnique({
        where: { id: result.user.id },
      });

      expect(user?.oauthProvider).toBe('google');
      expect(user?.oauthId).toBe('google-123');
      expect(user?.emailVerified).toBe(true);
    });
  });
});
