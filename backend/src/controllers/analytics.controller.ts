import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class AnalyticsController {
  /**
   * Get user's overall analytics
   * GET /api/v1/analytics/overview
   */
  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const userId = req.user.userId;

      // Get counts and statistics
      const [
        receiptsCount,
        expensesCount,
        groupsCount,
        receiptsOCRStats,
        totalExpenseAmount,
        recentActivity,
      ] = await Promise.all([
        prisma.receipt.count({ where: { uploadedById: userId, deletedAt: null } }),
        prisma.expense.count({ where: { paidById: userId, deletedAt: null } }),
        prisma.groupMember.count({ where: { userId } }),
        prisma.receipt.groupBy({
          by: ['ocrStatus'],
          where: { uploadedById: userId, deletedAt: null },
          _count: true,
        }),
        prisma.expense.aggregate({
          where: { paidById: userId, deletedAt: null },
          _sum: { amount: true },
        }),
        prisma.receipt.findMany({
          where: { uploadedById: userId, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            merchantName: true,
            totalAmount: true,
            currency: true,
            ocrStatus: true,
            createdAt: true,
          },
        }),
      ]);

      const ocrStatusBreakdown = receiptsOCRStats.reduce(
        (acc, stat) => {
          acc[stat.ocrStatus] = stat._count;
          return acc;
        },
        {} as Record<string, number>
      );

      res.json({
        success: true,
        data: {
          receipts: {
            total: receiptsCount,
            ocrStatus: ocrStatusBreakdown,
          },
          expenses: {
            total: expensesCount,
            totalAmount: totalExpenseAmount._sum.amount?.toString() || '0',
          },
          groups: {
            total: groupsCount,
          },
          recentActivity,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get receipt analytics
   * GET /api/v1/analytics/receipts
   */
  async getReceiptAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const userId = req.user.userId;
      const { startDate, endDate } = req.query;

      const where: any = { uploadedById: userId, deletedAt: null };

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      // Get receipt statistics
      const [totalReceipts, byStatus, byMerchant, averageConfidence, totalAmount, byCurrency] =
        await Promise.all([
          prisma.receipt.count({ where }),
          prisma.receipt.groupBy({
            by: ['ocrStatus'],
            where,
            _count: true,
          }),
          prisma.receipt.groupBy({
            by: ['merchantName'],
            where: { ...where, merchantName: { not: null } },
            _count: true,
            _sum: { totalAmount: true },
            orderBy: { _count: { merchantName: 'desc' } },
            take: 10,
          }),
          prisma.receipt.aggregate({
            where: { ...where, ocrStatus: 'completed' },
            _avg: { ocrConfidence: true },
          }),
          prisma.receipt.aggregate({
            where: { ...where, totalAmount: { not: null } },
            _sum: { totalAmount: true },
          }),
          prisma.receipt.groupBy({
            by: ['currency'],
            where: { ...where, currency: { not: null } },
            _count: true,
            _sum: { totalAmount: true },
          }),
        ]);

      res.json({
        success: true,
        data: {
          total: totalReceipts,
          byStatus: byStatus.map((s) => ({
            status: s.ocrStatus,
            count: s._count,
          })),
          topMerchants: byMerchant.map((m) => ({
            merchant: m.merchantName,
            count: m._count,
            totalAmount: m._sum.totalAmount?.toString() || '0',
          })),
          averageOCRConfidence: averageConfidence._avg.ocrConfidence || 0,
          totalAmount: totalAmount._sum.totalAmount?.toString() || '0',
          byCurrency: byCurrency.map((c) => ({
            currency: c.currency,
            count: c._count,
            totalAmount: c._sum.totalAmount?.toString() || '0',
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get expense analytics
   * GET /api/v1/analytics/expenses
   */
  async getExpenseAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const userId = req.user.userId;
      const { startDate, endDate } = req.query;

      const where: any = { paidById: userId, deletedAt: null };

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      // Get expense statistics
      const [totalExpenses, byCategory, byCurrency, totalAmount, averageAmount] = await Promise.all(
        [
          prisma.expense.count({ where }),
          prisma.expense.groupBy({
            by: ['category'],
            where,
            _count: true,
            _sum: { amount: true },
            orderBy: { _sum: { amount: 'desc' } },
          }),
          prisma.expense.groupBy({
            by: ['currency'],
            where,
            _count: true,
            _sum: { amount: true },
          }),
          prisma.expense.aggregate({
            where,
            _sum: { amount: true },
          }),
          prisma.expense.aggregate({
            where,
            _avg: { amount: true },
          }),
        ]
      );

      res.json({
        success: true,
        data: {
          total: totalExpenses,
          byCategory: byCategory.map((c) => ({
            category: c.category,
            count: c._count,
            totalAmount: c._sum.amount?.toString() || '0',
          })),
          byCurrency: byCurrency.map((c) => ({
            currency: c.currency,
            count: c._count,
            totalAmount: c._sum.amount?.toString() || '0',
          })),
          totalAmount: totalAmount._sum.amount?.toString() || '0',
          averageAmount: averageAmount._avg.amount?.toString() || '0',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get spending trends
   * GET /api/v1/analytics/trends
   */
  async getSpendingTrends(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const userId = req.user.userId;
      const { period = 'month' } = req.query; // day, week, month, year

      // Calculate date range based on period
      const now = new Date();
      const startDate = new Date();

      switch (period) {
        case 'day':
          startDate.setDate(now.getDate() - 30); // Last 30 days
          break;
        case 'week':
          startDate.setDate(now.getDate() - 84); // Last 12 weeks
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'month':
        default:
          startDate.setMonth(now.getMonth() - 12); // Last 12 months
          break;
      }

      const expenses = await prisma.expense.findMany({
        where: {
          paidById: userId,
          deletedAt: null,
          createdAt: { gte: startDate },
        },
        select: {
          amount: true,
          currency: true,
          category: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      // Group by time period
      const trendsData: Record<string, { total: number; count: number }> = {};

      expenses.forEach((expense) => {
        let key: string;
        const date = new Date(expense.createdAt);

        switch (period) {
          case 'day':
            key = date.toISOString().split('T')[0];
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0];
            break;
          case 'year':
            key = date.getFullYear().toString();
            break;
          case 'month':
          default:
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
        }

        if (!trendsData[key]) {
          trendsData[key] = { total: 0, count: 0 };
        }

        trendsData[key].total += parseFloat(expense.amount.toString());
        trendsData[key].count += 1;
      });

      const trends = Object.entries(trendsData)
        .map(([period, data]) => ({
          period,
          total: data.total.toFixed(2),
          count: data.count,
          average: (data.total / data.count).toFixed(2),
        }))
        .sort((a, b) => a.period.localeCompare(b.period));

      res.json({
        success: true,
        data: { trends, period },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
