import { Router } from 'express';
import { groupController } from '../controllers/group.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createGroupSchema, updateGroupSchema } from '../types/validation';

const router = Router();

/**
 * @route   GET /api/v1/groups
 * @desc    Get user's groups
 * @access  Private
 */
router.get('/', authenticate, groupController.getUserGroups.bind(groupController));

/**
 * @route   POST /api/v1/groups
 * @desc    Create a new group
 * @access  Private
 */
router.post('/', authenticate, validate(createGroupSchema), groupController.createGroup.bind(groupController));

/**
 * @route   GET /api/v1/groups/:id
 * @desc    Get group by ID
 * @access  Private
 */
router.get('/:id', authenticate, groupController.getGroup.bind(groupController));

/**
 * @route   PUT /api/v1/groups/:id
 * @desc    Update group
 * @access  Private (Admin only)
 */
router.put('/:id', authenticate, validate(updateGroupSchema), groupController.updateGroup.bind(groupController));

/**
 * @route   DELETE /api/v1/groups/:id
 * @desc    Delete group
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, groupController.deleteGroup.bind(groupController));

/**
 * @route   POST /api/v1/groups/:id/members
 * @desc    Add member to group
 * @access  Private (Admin only)
 */
router.post('/:id/members', authenticate, groupController.addMember.bind(groupController));

/**
 * @route   DELETE /api/v1/groups/:id/members/:userId
 * @desc    Remove member from group
 * @access  Private (Admin or self)
 */
router.delete('/:id/members/:userId', authenticate, groupController.removeMember.bind(groupController));

/**
 * @route   PATCH /api/v1/groups/:id/members/:userId/role
 * @desc    Update member role
 * @access  Private (Admin only)
 */
router.patch('/:id/members/:userId/role', authenticate, groupController.updateMemberRole.bind(groupController));

/**
 * @route   GET /api/v1/groups/:id/statistics
 * @desc    Get group statistics
 * @access  Private (Members only)
 */
router.get('/:id/statistics', authenticate, groupController.getGroupStatistics.bind(groupController));

export default router;
