import { Request, Response, NextFunction } from 'express';
import { expenseService } from '../services/expense.service';
import { ApiError } from '../middleware/errorHandler';
import logger from '../utils/logger';

export class ExpenseController {
  /**
   * Create a new expense
   * POST /api/v1/expenses
   */
  async createExpense(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const expense = await expenseService.createExpense(req.body, req.user.userId);

      logger.info(`Expense created: ${expense.description} by ${req.user.email}`);

      res.status(201).json({
        success: true,
        data: { expense },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get expense by ID
   * GET /api/v1/expenses/:id
   */
  async getExpense(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;

      const expense = await expenseService.getExpenseById(id);

      // Verify user is a participant
      const isParticipant = expense.participants.some(
        (p: { userId: string }) => p.userId === req.user?.userId
      );
      if (!isParticipant) {
        throw new ApiError(403, 'You must be a participant in this expense');
      }

      res.json({
        success: true,
        data: { expense },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get expenses for a group
   * GET /api/v1/groups/:groupId/expenses
   */
  async getGroupExpenses(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { groupId } = req.params;
      const { limit, offset, category, startDate, endDate } = req.query;

      type ExpenseCategory =
        | 'food_dining'
        | 'groceries'
        | 'transportation'
        | 'entertainment'
        | 'utilities'
        | 'rent'
        | 'shopping'
        | 'healthcare'
        | 'travel'
        | 'other';

      const options: {
        limit?: number;
        offset?: number;
        category?: ExpenseCategory;
        startDate?: Date;
        endDate?: Date;
      } = {};

      if (limit) options.limit = parseInt(limit as string, 10);
      if (offset) options.offset = parseInt(offset as string, 10);
      if (category) options.category = category as ExpenseCategory;
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);

      const result = await expenseService.getGroupExpenses(groupId, req.user.userId, options);

      res.json({
        success: true,
        data: {
          expenses: result.expenses,
          total: result.total,
          limit: options.limit || 50,
          offset: options.offset || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's expenses across all groups
   * GET /api/v1/expenses
   */
  async getUserExpenses(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { limit, offset } = req.query;

      const options: {
        limit?: number;
        offset?: number;
      } = {};

      if (limit) options.limit = parseInt(limit as string, 10);
      if (offset) options.offset = parseInt(offset as string, 10);

      const result = await expenseService.getUserExpenses(req.user.userId, options);

      res.json({
        success: true,
        data: {
          expenses: result.expenses,
          total: result.total,
          limit: options.limit || 50,
          offset: options.offset || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update expense
   * PUT /api/v1/expenses/:id
   */
  async updateExpense(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;

      const expense = await expenseService.updateExpense(id, req.body, req.user.userId);

      logger.info(`Expense updated: ${expense.description} by ${req.user.email}`);

      res.json({
        success: true,
        data: { expense },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete expense
   * DELETE /api/v1/expenses/:id
   */
  async deleteExpense(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;

      await expenseService.deleteExpense(id, req.user.userId);

      logger.info(`Expense deleted: ${id} by ${req.user.email}`);

      res.json({
        success: true,
        message: 'Expense deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate equal split
   * POST /api/v1/expenses/calculate-split/equal
   */
  async calculateEqualSplit(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount, participantIds, payerId } = req.body;

      if (!amount || !participantIds || !payerId) {
        throw new ApiError(400, 'Amount, participant IDs, and payer ID are required');
      }

      if (!Array.isArray(participantIds) || participantIds.length === 0) {
        throw new ApiError(400, 'Participant IDs must be a non-empty array');
      }

      const participants = expenseService.calculateEqualSplit(amount, participantIds, payerId);

      res.json({
        success: true,
        data: { participants },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate percentage split
   * POST /api/v1/expenses/calculate-split/percentage
   */
  async calculatePercentageSplit(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount, participants, payerId } = req.body;

      if (!amount || !participants || !payerId) {
        throw new ApiError(400, 'Amount, participants, and payer ID are required');
      }

      if (!Array.isArray(participants) || participants.length === 0) {
        throw new ApiError(400, 'Participants must be a non-empty array');
      }

      const result = expenseService.calculatePercentageSplit(amount, participants, payerId);

      res.json({
        success: true,
        data: { participants: result },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get expense statistics for a group
   * GET /api/v1/groups/:groupId/expenses/statistics
   */
  async getGroupExpenseStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { groupId } = req.params;

      const statistics = await expenseService.getGroupExpenseStatistics(groupId, req.user.userId);

      res.json({
        success: true,
        data: { statistics },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const expenseController = new ExpenseController();
