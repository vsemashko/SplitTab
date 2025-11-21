import { PrismaClient, Notification } from '@prisma/client';
import { ApiError, NotFoundError } from '../middleware/errorHandler';
import { socketService } from './socket.service';

const prisma = new PrismaClient();

export interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  actionUrl?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  expiresAt?: Date;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationData): Promise<Notification> {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: (data.data as any) || null,
        actionUrl: data.actionUrl,
        priority: data.priority || 'normal',
        category: data.category,
        expiresAt: data.expiresAt,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send real-time notification via Socket.IO
    socketService.sendNotification(data.userId, notification);

    return notification;
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(id: string, userId: string): Promise<Notification> {
    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    // Only notification owner can view
    if (notification.userId !== userId) {
      throw new ApiError(403, 'You do not have permission to view this notification');
    }

    return notification;
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(
    userId: string,
    filters: {
      read?: boolean;
      type?: string;
      category?: string;
      priority?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const where: any = {
      userId,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    };

    if (filters.read !== undefined) {
      where.read = filters.read;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: filters.offset || 0,
        take: filters.limit || 50,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId,
          read: false,
          OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        },
      }),
    ]);

    return { notifications, total, unreadCount };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.getNotificationById(id, userId);

    if (notification.read) {
      return notification;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: string, userId: string): Promise<void> {
    const notification = await this.getNotificationById(id, userId);

    await prisma.notification.delete({
      where: { id: notification.id },
    });
  }

  /**
   * Delete all notifications for user
   */
  async deleteAllNotifications(userId: string): Promise<number> {
    const result = await prisma.notification.deleteMany({
      where: { userId },
    });

    return result.count;
  }

  /**
   * Delete old/expired notifications
   */
  async cleanupExpiredNotifications(): Promise<number> {
    const result = await prisma.notification.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    return result.count;
  }

  /**
   * Helper: Create receipt processed notification
   */
  async notifyReceiptProcessed(
    userId: string,
    receiptId: string,
    merchantName?: string,
    confidence?: number
  ): Promise<Notification> {
    const title = 'Receipt Processed';
    const message = merchantName
      ? `Your receipt from ${merchantName} has been processed successfully${confidence ? ` with ${Math.round(confidence * 100)}% confidence` : ''}.`
      : 'Your receipt has been processed successfully.';

    return await this.createNotification({
      userId,
      type: 'receipt_processed',
      title,
      message,
      data: {
        receiptId,
        merchantName,
        confidence,
      },
      actionUrl: `/receipts/${receiptId}`,
      category: 'receipt',
      priority: 'normal',
    });
  }

  /**
   * Helper: Create receipt OCR failed notification
   */
  async notifyReceiptOCRFailed(
    userId: string,
    receiptId: string,
    error?: string
  ): Promise<Notification> {
    return await this.createNotification({
      userId,
      type: 'receipt_ocr_failed',
      title: 'Receipt Processing Failed',
      message: error
        ? `We could not process your receipt: ${error}. You can retry or enter the details manually.`
        : 'We could not process your receipt. You can retry or enter the details manually.',
      data: {
        receiptId,
        error,
      },
      actionUrl: `/receipts/${receiptId}`,
      category: 'receipt',
      priority: 'normal',
    });
  }

  /**
   * Helper: Create expense created notification
   */
  async notifyExpenseCreated(
    userId: string,
    expenseId: string,
    description: string,
    amount: number,
    currency: string
  ): Promise<Notification> {
    return await this.createNotification({
      userId,
      type: 'expense_created',
      title: 'New Expense Added',
      message: `${description} - ${amount} ${currency}`,
      data: {
        expenseId,
        description,
        amount,
        currency,
      },
      actionUrl: `/expenses/${expenseId}`,
      category: 'expense',
      priority: 'normal',
    });
  }

  /**
   * Helper: Create payment received notification
   */
  async notifyPaymentReceived(
    userId: string,
    settlementId: string,
    payerName: string,
    amount: number,
    currency: string
  ): Promise<Notification> {
    return await this.createNotification({
      userId,
      type: 'payment_received',
      title: 'Payment Received',
      message: `${payerName} paid you ${amount} ${currency}`,
      data: {
        settlementId,
        payerName,
        amount,
        currency,
      },
      actionUrl: `/settlements/${settlementId}`,
      category: 'payment',
      priority: 'high',
    });
  }
}

export const notificationService = new NotificationService();
