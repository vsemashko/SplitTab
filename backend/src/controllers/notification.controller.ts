import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class NotificationController {
  /**
   * Get user's notifications
   * GET /api/v1/notifications
   */
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { read, type, category, priority, limit, offset } = req.query;

      const filters: {
        read?: boolean;
        type?: string;
        category?: string;
        priority?: string;
        limit?: number;
        offset?: number;
      } = {};
      if (read !== undefined) filters.read = read === 'true';
      if (type) filters.type = type as string;
      if (category) filters.category = category as string;
      if (priority) filters.priority = priority as string;
      if (limit) filters.limit = parseInt(limit as string, 10);
      if (offset) filters.offset = parseInt(offset as string, 10);

      const result = await notificationService.getUserNotifications(req.user.userId, filters);

      res.json({
        success: true,
        data: {
          notifications: result.notifications,
          total: result.total,
          unreadCount: result.unreadCount,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single notification
   * GET /api/v1/notifications/:id
   */
  async getNotification(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;
      const notification = await notificationService.getNotificationById(id, req.user.userId);

      res.json({
        success: true,
        data: { notification },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read
   * PATCH /api/v1/notifications/:id/read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;
      const notification = await notificationService.markAsRead(id, req.user.userId);

      logger.info(`Notification ${id} marked as read by ${req.user.email}`);

      res.json({
        success: true,
        data: { notification },
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   * PATCH /api/v1/notifications/mark-all-read
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const count = await notificationService.markAllAsRead(req.user.userId);

      logger.info(`All notifications marked as read by ${req.user.email} (${count} notifications)`);

      res.json({
        success: true,
        data: { count },
        message: `${count} notifications marked as read`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete notification
   * DELETE /api/v1/notifications/:id
   */
  async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;
      await notificationService.deleteNotification(id, req.user.userId);

      logger.info(`Notification ${id} deleted by ${req.user.email}`);

      res.json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete all notifications
   * DELETE /api/v1/notifications
   */
  async deleteAllNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const count = await notificationService.deleteAllNotifications(req.user.userId);

      logger.info(`All notifications deleted by ${req.user.email} (${count} notifications)`);

      res.json({
        success: true,
        data: { count },
        message: `${count} notifications deleted`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread count
   * GET /api/v1/notifications/unread/count
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const result = await notificationService.getUserNotifications(req.user.userId, {
        limit: 0,
      });

      res.json({
        success: true,
        data: { unreadCount: result.unreadCount },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
