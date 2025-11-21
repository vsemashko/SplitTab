import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateUserSchema } from '../types/validation';

const router = Router();

/**
 * @route   GET /api/v1/users/search
 * @desc    Search users by name or email
 * @access  Private
 */
router.get('/search', authenticate, userController.searchUsers.bind(userController));

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', authenticate, userController.getUser.bind(userController));

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  validate(updateUserSchema),
  userController.updateUser.bind(userController)
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/:id', authenticate, userController.deleteUser.bind(userController));

/**
 * @route   GET /api/v1/users/:id/balance
 * @desc    Get user balance across all groups
 * @access  Private
 */
router.get('/:id/balance', authenticate, userController.getUserBalance.bind(userController));

export default router;
