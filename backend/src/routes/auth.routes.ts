import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createUserSchema, loginSchema, updatePasswordSchema } from '../types/validation';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(createUserSchema), authController.register.bind(authController));

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validate(loginSchema), authController.login.bind(authController));

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post('/logout', authController.logout.bind(authController));

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', authController.refreshToken.bind(authController));

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser.bind(authController));

/**
 * @route   POST /api/v1/auth/password/reset-request
 * @desc    Request password reset
 * @access  Public
 */
router.post('/password/reset-request', authController.requestPasswordReset.bind(authController));

/**
 * @route   POST /api/v1/auth/password/reset
 * @desc    Reset password
 * @access  Public
 */
router.post('/password/reset', authController.resetPassword.bind(authController));

/**
 * @route   POST /api/v1/auth/password/change
 * @desc    Change password (when logged in)
 * @access  Private
 */
router.post(
  '/password/change',
  authenticate,
  validate(updatePasswordSchema),
  authController.changePassword.bind(authController)
);

/**
 * @route   POST /api/v1/auth/email/verify-request
 * @desc    Send email verification
 * @access  Private
 */
router.post(
  '/email/verify-request',
  authenticate,
  authController.sendEmailVerification.bind(authController)
);

/**
 * @route   POST /api/v1/auth/email/verify
 * @desc    Verify email
 * @access  Public
 */
router.post('/email/verify', authController.verifyEmail.bind(authController));

/**
 * @route   GET /api/v1/auth/sessions
 * @desc    Get user sessions
 * @access  Private
 */
router.get('/sessions', authenticate, authController.getSessions.bind(authController));

/**
 * @route   DELETE /api/v1/auth/sessions
 * @desc    Revoke all sessions
 * @access  Private
 */
router.delete('/sessions', authenticate, authController.revokeAllSessions.bind(authController));

/**
 * @route   DELETE /api/v1/auth/sessions/:sessionId
 * @desc    Revoke specific session
 * @access  Private
 */
router.delete(
  '/sessions/:sessionId',
  authenticate,
  authController.revokeSession.bind(authController)
);

export default router;
