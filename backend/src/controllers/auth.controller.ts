import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class AuthController {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, defaultCurrency } = req.body;

      const result = await authService.register({
        email,
        password,
        name,
        defaultCurrency,
      });

      logger.info(`New user registered: ${email}`);

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const result = await authService.login({ email, password });

      logger.info(`User logged in: ${email}`);

      res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ApiError(400, 'Refresh token required');
      }

      await authService.logout(refreshToken);

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ApiError(400, 'Refresh token required');
      }

      const tokens = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * GET /api/v1/auth/me
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const { userService } = require('../services/user.service');
      const user = await userService.getUserById(req.user.userId);

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   * POST /api/v1/auth/password/reset-request
   */
  async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      const result = await authService.requestPasswordReset(email);

      // In production, the token would be sent via email
      // For development/testing, we return it in the response
      const isDevelopment = process.env.NODE_ENV === 'development';

      res.json({
        success: true,
        message: 'If a user with this email exists, a password reset link has been sent',
        ...(isDevelopment && { resetToken: result.resetToken }),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   * POST /api/v1/auth/password/reset
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { resetToken, newPassword } = req.body;

      if (!resetToken || !newPassword) {
        throw new ApiError(400, 'Reset token and new password required');
      }

      await authService.resetPassword(resetToken, newPassword);

      logger.info('Password reset successful');

      res.json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password (when logged in)
   * POST /api/v1/auth/password/change
   */
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new ApiError(400, 'Current password and new password required');
      }

      const { userService } = require('../services/user.service');
      await userService.updatePassword(req.user.userId, currentPassword, newPassword);

      logger.info(`Password changed for user: ${req.user.email}`);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send email verification
   * POST /api/v1/auth/email/verify-request
   */
  async sendEmailVerification(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const result = await authService.sendEmailVerification(req.user.userId);

      const isDevelopment = process.env.NODE_ENV === 'development';

      res.json({
        success: true,
        message: 'Verification email sent',
        ...(isDevelopment && { verificationToken: result.verificationToken }),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify email
   * POST /api/v1/auth/email/verify
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { verificationToken } = req.body;

      if (!verificationToken) {
        throw new ApiError(400, 'Verification token required');
      }

      await authService.verifyEmail(verificationToken);

      logger.info('Email verified successfully');

      res.json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user sessions
   * GET /api/v1/auth/sessions
   */
  async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const sessions = await authService.getUserSessions(req.user.userId);

      res.json({
        success: true,
        data: { sessions },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke all sessions
   * DELETE /api/v1/auth/sessions
   */
  async revokeAllSessions(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      await authService.revokeAllSessions(req.user.userId);

      logger.info(`All sessions revoked for user: ${req.user.email}`);

      res.json({
        success: true,
        message: 'All sessions revoked successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke specific session
   * DELETE /api/v1/auth/sessions/:sessionId
   */
  async revokeSession(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const { sessionId } = req.params;

      await authService.revokeSession(sessionId, req.user.userId);

      logger.info(`Session ${sessionId} revoked for user: ${req.user.email}`);

      res.json({
        success: true,
        message: 'Session revoked successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
