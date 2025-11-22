import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class UserController {
  /**
   * Get user by ID
   * GET /api/v1/users/:id
   */
  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const user = await userService.getUserById(id);

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * PUT /api/v1/users/:id
   */
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Ensure user can only update their own profile
      if (req.user?.userId !== id) {
        throw new ApiError(403, 'You can only update your own profile');
      }

      const user = await userService.updateUser(id, req.body);

      logger.info(`User updated: ${user.email}`);

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user account
   * DELETE /api/v1/users/:id
   */
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Ensure user can only delete their own account
      if (req.user?.userId !== id) {
        throw new ApiError(403, 'You can only delete your own account');
      }

      await userService.deleteUser(id);

      logger.info(`User deleted: ${id}`);

      res.json({
        success: true,
        message: 'User account deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user balance
   * GET /api/v1/users/:id/balance
   */
  async getUserBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Ensure user can only view their own balance
      if (req.user?.userId !== id) {
        throw new ApiError(403, 'You can only view your own balance');
      }

      const balance = await userService.getUserBalance(id);

      res.json({
        success: true,
        data: { balance },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search users
   * GET /api/v1/users/search?q=query
   */
  async searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, limit } = req.query;

      if (!q || typeof q !== 'string') {
        throw new ApiError(400, 'Search query is required');
      }

      const limitNum = limit ? parseInt(limit as string, 10) : 10;

      const users = await userService.searchUsers(q, limitNum);

      res.json({
        success: true,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
