import { Request, Response, NextFunction } from 'express';
import { settlementService } from '../services/settlement.service';
import { ApiError } from '../middleware/errorHandler';
import logger from '../utils/logger';

export class SettlementController {
  /**
   * Create a new settlement
   * POST /api/v1/settlements
   */
  async createSettlement(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const settlement = await settlementService.createSettlement(req.body, req.user.userId);

      logger.info(`Settlement created: ${settlement.amount} by ${req.user.email}`);

      res.status(201).json({
        success: true,
        data: { settlement },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get settlement by ID
   * GET /api/v1/settlements/:id
   */
  async getSettlement(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;

      const settlement = await settlementService.getSettlementById(id);

      // Verify user is involved
      const isInvolved = settlement.payerId === req.user.userId || settlement.payeeId === req.user.userId;
      if (!isInvolved) {
        throw new ApiError(403, 'You must be involved in this settlement');
      }

      res.json({
        success: true,
        data: { settlement },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get settlements for a group
   * GET /api/v1/groups/:groupId/settlements
   */
  async getGroupSettlements(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { groupId } = req.params;
      const { status, limit, offset } = req.query;

      const options: any = {};

      if (status) options.status = status as 'pending' | 'confirmed' | 'cancelled';
      if (limit) options.limit = parseInt(limit as string, 10);
      if (offset) options.offset = parseInt(offset as string, 10);

      const result = await settlementService.getGroupSettlements(groupId, req.user.userId, options);

      res.json({
        success: true,
        data: {
          settlements: result.settlements,
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
   * Get user's settlements
   * GET /api/v1/settlements
   */
  async getUserSettlements(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { status, limit, offset } = req.query;

      const options: any = {};

      if (status) options.status = status as 'pending' | 'confirmed' | 'cancelled';
      if (limit) options.limit = parseInt(limit as string, 10);
      if (offset) options.offset = parseInt(offset as string, 10);

      const result = await settlementService.getUserSettlements(req.user.userId, options);

      res.json({
        success: true,
        data: {
          settlements: result.settlements,
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
   * Update settlement
   * PUT /api/v1/settlements/:id
   */
  async updateSettlement(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;

      const settlement = await settlementService.updateSettlement(id, req.body, req.user.userId);

      logger.info(`Settlement updated: ${id} by ${req.user.email}`);

      res.json({
        success: true,
        data: { settlement },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirm settlement
   * POST /api/v1/settlements/:id/confirm
   */
  async confirmSettlement(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;

      const settlement = await settlementService.confirmSettlement(id, req.user.userId);

      logger.info(`Settlement confirmed: ${id} by ${req.user.email}`);

      res.json({
        success: true,
        data: { settlement },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel settlement
   * POST /api/v1/settlements/:id/cancel
   */
  async cancelSettlement(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;

      const settlement = await settlementService.cancelSettlement(id, req.user.userId);

      logger.info(`Settlement cancelled: ${id} by ${req.user.email}`);

      res.json({
        success: true,
        data: { settlement },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete settlement
   * DELETE /api/v1/settlements/:id
   */
  async deleteSettlement(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;

      await settlementService.deleteSettlement(id, req.user.userId);

      logger.info(`Settlement deleted: ${id} by ${req.user.email}`);

      res.json({
        success: true,
        message: 'Settlement deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate suggested settlements for a group
   * GET /api/v1/groups/:groupId/settlements/suggestions
   */
  async calculateSuggestedSettlements(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { groupId } = req.params;

      const suggestions = await settlementService.calculateSuggestedSettlements(groupId, req.user.userId);

      res.json({
        success: true,
        data: { suggestions },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const settlementController = new SettlementController();
