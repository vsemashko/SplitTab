import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { ApiError } from '../middleware/errorHandler';
import { generateTokenPair, verifyRefreshToken, TokenPair } from '../utils/jwt';
import { userService } from './user.service';

const prisma = new PrismaClient();

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  defaultCurrency?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  tokens: TokenPair;
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    // Create user
    const user = await userService.createUser({
      email: data.email,
      password: data.password,
      name: data.name,
      defaultCurrency: data.defaultCurrency,
    });

    // Generate tokens
    const tokens = generateTokenPair(user.id, user.email);

    // Create session
    await this.createSession(user.id, tokens.refreshToken);

    return {
      user,
      tokens,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    // Verify credentials
    const user = await userService.verifyPassword(data.email, data.password);

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Generate tokens
    const tokens = generateTokenPair(user.id, user.email);

    // Create session
    await this.createSession(user.id, tokens.refreshToken);

    // Return user without password hash
    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  /**
   * Logout user (invalidate session)
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = verifyRefreshToken(refreshToken);

      // Delete session
      await prisma.session.deleteMany({
        where: {
          userId: payload.userId,
          token: refreshToken,
        },
      });
    } catch (error) {
      // Ignore errors during logout
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if session exists
    const session = await prisma.session.findFirst({
      where: {
        userId: payload.userId,
        token: refreshToken,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!session) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId, deletedAt: null },
    });

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    // Generate new token pair
    const tokens = generateTokenPair(user.id, user.email);

    // Update session with new refresh token
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return tokens;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ resetToken: string }> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase(), deletedAt: null },
    });

    if (!user) {
      // Don't reveal if user exists
      throw new ApiError(
        404,
        'If a user with this email exists, a password reset link has been sent'
      );
    }

    if (!user.passwordHash) {
      throw new ApiError(400, 'This account uses OAuth authentication and cannot reset password');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store hashed token in database (expires in 1 hour)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    // In production, send email with reset token
    // For now, return token (in production, this would be sent via email)
    return { resetToken };
  }

  /**
   * Reset password using reset token
   */
  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    // Hash the provided token
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date(),
        },
        deletedAt: null,
      },
    });

    if (!user) {
      throw new ApiError(400, 'Invalid or expired password reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      },
    });

    // Invalidate all existing sessions
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(userId: string): Promise<{ verificationToken: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.emailVerified) {
      throw new ApiError(400, 'Email is already verified');
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Store hashed token (expires in 24 hours)
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // In production, send email with verification link
    // For now, return token
    return { verificationToken };
  }

  /**
   * Verify email using verification token
   */
  async verifyEmail(verificationToken: string): Promise<void> {
    // Hash the provided token
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Find user with valid verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: {
          gt: new Date(),
        },
        deletedAt: null,
      },
    });

    if (!user) {
      throw new ApiError(400, 'Invalid or expired verification token');
    }

    // Mark email as verified and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * OAuth login/register
   */
  async oauthLogin(
    provider: string,
    oauthId: string,
    email: string,
    name: string,
    profilePictureUrl?: string
  ): Promise<AuthResponse> {
    // Check if user exists with this OAuth provider
    let user = await prisma.user.findFirst({
      where: {
        oauthProvider: provider,
        oauthId,
        deletedAt: null,
      },
    });

    // If not, check by email
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase(), deletedAt: null },
      });
    }

    // Create new user if doesn't exist
    if (!user) {
      const createdUser = await userService.createUser({
        email,
        name,
        oauthProvider: provider,
        oauthId,
      });

      // Update profile picture if provided
      if (profilePictureUrl) {
        await prisma.user.update({
          where: { id: createdUser.id },
          data: { profilePictureUrl },
        });
      }

      user = await prisma.user.findUnique({
        where: { id: createdUser.id },
      });
    } else {
      // Update OAuth info if user exists
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          oauthProvider: provider,
          oauthId,
          emailVerified: true, // OAuth emails are pre-verified
          profilePictureUrl: profilePictureUrl || user.profilePictureUrl,
          updatedAt: new Date(),
        },
      });
    }

    if (!user) {
      throw new ApiError(500, 'Failed to create or update user');
    }

    // Generate tokens
    const tokens = generateTokenPair(user.id, user.email);

    // Create session
    await this.createSession(user.id, tokens.refreshToken);

    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  /**
   * Create a session for refresh token
   */
  private async createSession(userId: string, refreshToken: string): Promise<void> {
    await prisma.session.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
  }

  /**
   * Get active sessions for user
   */
  async getUserSessions(userId: string): Promise<any[]> {
    return prisma.session.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Revoke all sessions for user
   */
  async revokeAllSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  /**
   * Revoke specific session
   */
  async revokeSession(sessionId: string, userId: string): Promise<void> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new ApiError(404, 'Session not found');
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });
  }
}

export const authService = new AuthService();
