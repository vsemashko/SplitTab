import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/v1/notifications/unread/count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get(
  '/unread/count',
  authenticate,
  notificationController.getUnreadCount.bind(notificationController)
);

/**
 * @route   PATCH /api/v1/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.patch(
  '/mark-all-read',
  authenticate,
  notificationController.markAllAsRead.bind(notificationController)
);

/**
 * @route   GET /api/v1/notifications
 * @desc    Get user's notifications
 * @access  Private
 */
router.get('/', authenticate, notificationController.getNotifications.bind(notificationController));

/**
 * @route   DELETE /api/v1/notifications
 * @desc    Delete all notifications
 * @access  Private
 */
router.delete(
  '/',
  authenticate,
  notificationController.deleteAllNotifications.bind(notificationController)
);

/**
 * @route   GET /api/v1/notifications/:id
 * @desc    Get single notification
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  notificationController.getNotification.bind(notificationController)
);

/**
 * @route   PATCH /api/v1/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.patch(
  '/:id/read',
  authenticate,
  notificationController.markAsRead.bind(notificationController)
);

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  notificationController.deleteNotification.bind(notificationController)
);

export default router;
