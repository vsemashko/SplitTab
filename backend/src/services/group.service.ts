import { PrismaClient, Group, GroupMember } from '@prisma/client';
import { ApiError, NotFoundError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

// Type alias for group types
type GroupType = 'friends' | 'trip' | 'home' | 'couple' | 'event' | 'project' | 'other';

export interface CreateGroupData {
  name: string;
  description?: string;
  groupType?: GroupType;
  defaultCurrency?: string;
  createdById: string;
  initialMembers?: string[]; // User IDs to add as members
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  groupType?: GroupType;
  defaultCurrency?: string;
}

export interface AddMemberData {
  userId: string;
  role?: 'admin' | 'member';
}

export class GroupService {
  /**
   * Create a new group
   */
  async createGroup(data: CreateGroupData): Promise<Group> {
    // Verify creator exists
    const creator = await prisma.user.findUnique({
      where: { id: data.createdById, deletedAt: null },
    });

    if (!creator) {
      throw new NotFoundError('Creator user not found');
    }

    // Create group with creator as admin member
    const group = await prisma.group.create({
      data: {
        name: data.name,
        description: data.description,
        groupType: data.groupType || 'other',
        defaultCurrency: data.defaultCurrency || 'USD',
        createdById: data.createdById,
        members: {
          create: {
            userId: data.createdById,
            role: 'admin',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                profilePictureUrl: true,
              },
            },
          },
        },
      },
    });

    // Add initial members if provided
    if (data.initialMembers && data.initialMembers.length > 0) {
      for (const userId of data.initialMembers) {
        if (userId !== data.createdById) {
          // Don't add creator again
          await this.addMember(group.id, { userId, role: 'member' });
        }
      }
    }

    return group;
  }

  /**
   * Get group by ID
   */
  async getGroupById(id: string): Promise<Group & { members: GroupMember[] }> {
    const group = await prisma.group.findUnique({
      where: { id, deletedAt: null },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                profilePictureUrl: true,
                defaultCurrency: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    return group;
  }

  /**
   * Get all groups for a user
   */
  async getUserGroups(userId: string): Promise<Group[]> {
    const groupMemberships = await prisma.groupMember.findMany({
      where: {
        userId,
        group: {
          deletedAt: null,
        },
      },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profilePictureUrl: true,
                  },
                },
              },
            },
            _count: {
              select: {
                expenses: true,
              },
            },
          },
        },
      },
      orderBy: {
        group: {
          updatedAt: 'desc',
        },
      },
    });

    return groupMemberships.map((membership) => membership.group);
  }

  /**
   * Update group
   */
  async updateGroup(id: string, userId: string, data: UpdateGroupData): Promise<Group> {
    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id, deletedAt: null },
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Check if user is admin
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          userId,
          groupId: id,
        },
      },
    });

    if (!member || member.role !== 'admin') {
      throw new ApiError(403, 'Only group admins can update group details');
    }

    // Update group
    const updatedGroup = await prisma.group.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                profilePictureUrl: true,
              },
            },
          },
        },
      },
    });

    return updatedGroup;
  }

  /**
   * Add member to group
   */
  async addMember(groupId: string, data: AddMemberData): Promise<GroupMember> {
    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user is already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          userId: data.userId,
          groupId,
        },
      },
    });

    if (existingMember) {
      throw new ApiError(409, 'User is already a member of this group');
    }

    // Add member
    const member = await prisma.groupMember.create({
      data: {
        userId: data.userId,
        groupId,
        role: data.role || 'member',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    return member;
  }

  /**
   * Remove member from group
   */
  async removeMember(groupId: string, userId: string, requestingUserId: string): Promise<void> {
    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Check if requesting user is admin or removing themselves
    const requestingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          userId: requestingUserId,
          groupId,
        },
      },
    });

    if (!requestingMember) {
      throw new ApiError(403, 'You are not a member of this group');
    }

    const isSelfRemoval = userId === requestingUserId;
    const isAdmin = requestingMember.role === 'admin';

    if (!isSelfRemoval && !isAdmin) {
      throw new ApiError(403, 'Only admins can remove other members');
    }

    // Check if member exists
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          userId,
          groupId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError('Member not found in this group');
    }

    // Don't allow removing the last admin
    if (member.role === 'admin') {
      const adminCount = await prisma.groupMember.count({
        where: {
          groupId,
          role: 'admin',
        },
      });

      if (adminCount <= 1) {
        throw new ApiError(400, 'Cannot remove the last admin from the group');
      }
    }

    // Remove member
    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          userId,
          groupId,
        },
      },
    });
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    groupId: string,
    userId: string,
    newRole: 'admin' | 'member',
    requestingUserId: string
  ): Promise<GroupMember> {
    // Check if requesting user is admin
    const requestingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          userId: requestingUserId,
          groupId,
        },
      },
    });

    if (!requestingMember || requestingMember.role !== 'admin') {
      throw new ApiError(403, 'Only admins can update member roles');
    }

    // Check if member exists
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          userId,
          groupId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError('Member not found in this group');
    }

    // Don't allow demoting the last admin
    if (member.role === 'admin' && newRole === 'member') {
      const adminCount = await prisma.groupMember.count({
        where: {
          groupId,
          role: 'admin',
        },
      });

      if (adminCount <= 1) {
        throw new ApiError(400, 'Cannot demote the last admin');
      }
    }

    // Update role
    const updatedMember = await prisma.groupMember.update({
      where: {
        groupId_userId: {
          userId,
          groupId,
        },
      },
      data: {
        role: newRole,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    return updatedMember;
  }

  /**
   * Soft delete group
   */
  async deleteGroup(id: string, userId: string): Promise<void> {
    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id, deletedAt: null },
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Check if user is admin
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          userId,
          groupId: id,
        },
      },
    });

    if (!member || member.role !== 'admin') {
      throw new ApiError(403, 'Only group admins can delete the group');
    }

    // Soft delete group
    await prisma.group.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Check if user is member of group
   */
  async isMember(groupId: string, userId: string): Promise<boolean> {
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          userId,
          groupId,
        },
      },
    });

    return !!member;
  }

  /**
   * Check if user is admin of group
   */
  async isAdmin(groupId: string, userId: string): Promise<boolean> {
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          userId,
          groupId,
        },
      },
    });

    return member?.role === 'admin';
  }

  /**
   * Get group statistics
   */
  async getGroupStatistics(groupId: string): Promise<{
    totalExpenses: number;
    totalAmount: number;
    memberCount: number;
    settledAmount: number;
    pendingSettlements: number;
  }> {
    const group = await prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    const [expenses, members, settlements] = await Promise.all([
      prisma.expense.findMany({
        where: { groupId, deletedAt: null },
      }),
      prisma.groupMember.count({
        where: { groupId },
      }),
      prisma.settlement.findMany({
        where: { groupId, deletedAt: null },
      }),
    ]);

    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    const settledAmount = settlements
      .filter((s) => s.status === 'confirmed')
      .reduce((sum, settlement) => sum + settlement.amount, 0);

    const pendingSettlements = settlements.filter((s) => s.status === 'pending').length;

    return {
      totalExpenses,
      totalAmount,
      memberCount: members,
      settledAmount,
      pendingSettlements,
    };
  }
}

export const groupService = new GroupService();
