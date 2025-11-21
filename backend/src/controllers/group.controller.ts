import { Request, Response, NextFunction } from 'express';
import { groupService } from '../services/group.service';
import { ApiError } from '../middleware/errorHandler';
import logger from '../utils/logger';

export class GroupController {
  /**
   * Create a new group
   * POST /api/v1/groups
   */
  async createGroup(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const group = await groupService.createGroup({
        ...req.body,
        createdById: req.user.userId,
      });

      logger.info(`Group created: ${group.name} by ${req.user.email}`);

      res.status(201).json({
        success: true,
        data: { group },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get group by ID
   * GET /api/v1/groups/:id
   */
  async getGroup(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;

      // Verify user is a member
      const isMember = await groupService.isMember(id, req.user.userId);
      if (!isMember) {
        throw new ApiError(403, 'You must be a member of this group');
      }

      const group = await groupService.getGroupById(id);

      res.json({
        success: true,
        data: { group },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's groups
   * GET /api/v1/groups
   */
  async getUserGroups(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const groups = await groupService.getUserGroups(req.user.userId);

      res.json({
        success: true,
        data: { groups },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update group
   * PUT /api/v1/groups/:id
   */
  async updateGroup(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;

      const group = await groupService.updateGroup(id, req.user.userId, req.body);

      logger.info(`Group updated: ${group.name} by ${req.user.email}`);

      res.json({
        success: true,
        data: { group },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete group
   * DELETE /api/v1/groups/:id
   */
  async deleteGroup(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;

      await groupService.deleteGroup(id, req.user.userId);

      logger.info(`Group deleted: ${id} by ${req.user.email}`);

      res.json({
        success: true,
        message: 'Group deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add member to group
   * POST /api/v1/groups/:id/members
   */
  async addMember(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;
      const { userId, role } = req.body;

      if (!userId) {
        throw new ApiError(400, 'User ID is required');
      }

      const member = await groupService.addMember(id, { userId, role });

      logger.info(`Member added to group ${id}: ${userId}`);

      res.status(201).json({
        success: true,
        data: { member },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove member from group
   * DELETE /api/v1/groups/:id/members/:userId
   */
  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id, userId } = req.params;

      await groupService.removeMember(id, userId, req.user.userId);

      logger.info(`Member removed from group ${id}: ${userId}`);

      res.json({
        success: true,
        message: 'Member removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update member role
   * PATCH /api/v1/groups/:id/members/:userId/role
   */
  async updateMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id, userId } = req.params;
      const { role } = req.body;

      if (!role || (role !== 'admin' && role !== 'member')) {
        throw new ApiError(400, 'Valid role is required (admin or member)');
      }

      const member = await groupService.updateMemberRole(id, userId, role, req.user.userId);

      logger.info(`Member role updated in group ${id}: ${userId} to ${role}`);

      res.json({
        success: true,
        data: { member },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get group statistics
   * GET /api/v1/groups/:id/statistics
   */
  async getGroupStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;

      // Verify user is a member
      const isMember = await groupService.isMember(id, req.user.userId);
      if (!isMember) {
        throw new ApiError(403, 'You must be a member of this group');
      }

      const statistics = await groupService.getGroupStatistics(id);

      res.json({
        success: true,
        data: { statistics },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const groupController = new GroupController();
