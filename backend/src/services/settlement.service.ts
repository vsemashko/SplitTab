import { PrismaClient, Settlement } from '@prisma/client';
import { ApiError, NotFoundError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export interface CreateSettlementData {
  amount: number;
  payerId: string;
  payeeId: string;
  groupId: string;
  notes?: string;
}

export interface UpdateSettlementData {
  amount?: number;
  notes?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
}

export class SettlementService {
  /**
   * Create a new settlement
   */
  async createSettlement(data: CreateSettlementData, userId: string): Promise<Settlement> {
    // Verify group exists
    const group = await prisma.group.findUnique({
      where: { id: data.groupId, deletedAt: null },
      include: {
        members: true,
      },
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Verify user is member
    const isMember = group.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ApiError(403, 'You must be a member of the group to create a settlement');
    }

    // Verify payer and payee are different
    if (data.payerId === data.payeeId) {
      throw new ApiError(400, 'Payer and payee must be different users');
    }

    // Verify both payer and payee are group members
    const isPayerMember = group.members.some((m) => m.userId === data.payerId);
    const isPayeeMember = group.members.some((m) => m.userId === data.payeeId);

    if (!isPayerMember) {
      throw new ApiError(400, 'Payer must be a member of the group');
    }

    if (!isPayeeMember) {
      throw new ApiError(400, 'Payee must be a member of the group');
    }

    // Verify amount is positive
    if (data.amount <= 0) {
      throw new ApiError(400, 'Settlement amount must be positive');
    }

    // Create settlement
    const settlement = await prisma.settlement.create({
      data: {
        amount: data.amount,
        payerId: data.payerId,
        payeeId: data.payeeId,
        groupId: data.groupId,
        notes: data.notes,
        status: 'pending',
      },
      include: {
        payer: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePictureUrl: true,
          },
        },
        payee: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePictureUrl: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return settlement;
  }

  /**
   * Get settlement by ID
   */
  async getSettlementById(id: string): Promise<Settlement> {
    const settlement = await prisma.settlement.findUnique({
      where: { id, deletedAt: null },
      include: {
        payer: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePictureUrl: true,
          },
        },
        payee: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePictureUrl: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!settlement) {
      throw new NotFoundError('Settlement not found');
    }

    return settlement;
  }

  /**
   * Get all settlements for a group
   */
  async getGroupSettlements(
    groupId: string,
    userId: string,
    options?: {
      status?: 'pending' | 'confirmed' | 'cancelled';
      limit?: number;
      offset?: number;
    }
  ): Promise<{ settlements: Settlement[]; total: number }> {
    // Verify user is member
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          userId,
          groupId,
        },
      },
    });

    if (!member) {
      throw new ApiError(403, 'You must be a member of the group');
    }

    const where: any = {
      groupId,
      deletedAt: null,
    };

    if (options?.status) {
      where.status = options.status;
    }

    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where,
        include: {
          payer: {
            select: {
              id: true,
              name: true,
              profilePictureUrl: true,
            },
          },
          payee: {
            select: {
              id: true,
              name: true,
              profilePictureUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      prisma.settlement.count({ where }),
    ]);

    return { settlements, total };
  }

  /**
   * Get user's settlements (where they are payer or payee)
   */
  async getUserSettlements(
    userId: string,
    options?: {
      status?: 'pending' | 'confirmed' | 'cancelled';
      limit?: number;
      offset?: number;
    }
  ): Promise<{ settlements: Settlement[]; total: number }> {
    const where: any = {
      deletedAt: null,
      OR: [{ payerId: userId }, { payeeId: userId }],
    };

    if (options?.status) {
      where.status = options.status;
    }

    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where,
        include: {
          payer: {
            select: {
              id: true,
              name: true,
              profilePictureUrl: true,
            },
          },
          payee: {
            select: {
              id: true,
              name: true,
              profilePictureUrl: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      prisma.settlement.count({ where }),
    ]);

    return { settlements, total };
  }

  /**
   * Update settlement
   */
  async updateSettlement(
    id: string,
    data: UpdateSettlementData,
    userId: string
  ): Promise<Settlement> {
    const settlement = await prisma.settlement.findUnique({
      where: { id, deletedAt: null },
      include: {
        group: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!settlement) {
      throw new NotFoundError('Settlement not found');
    }

    if (!settlement.group) {
      throw new ApiError(404, 'Associated group not found');
    }

    // Check if user is involved in the settlement or is a group admin
    const member = settlement.group.members.find((m) => m.userId === userId);
    if (!member) {
      throw new ApiError(403, 'You must be a member of the group');
    }

    const isInvolved = settlement.payerId === userId || settlement.payeeId === userId;
    const isAdmin = member.role === 'admin';

    if (!isInvolved && !isAdmin) {
      throw new ApiError(403, 'Only involved parties or group admins can update this settlement');
    }

    // Update settlement
    const updatedSettlement = await prisma.settlement.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.status !== undefined && { status: data.status }),
        updatedAt: new Date(),
      },
      include: {
        payer: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePictureUrl: true,
          },
        },
        payee: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePictureUrl: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updatedSettlement;
  }

  /**
   * Confirm settlement (mark as paid)
   */
  async confirmSettlement(id: string, userId: string): Promise<Settlement> {
    const settlement = await prisma.settlement.findUnique({
      where: { id, deletedAt: null },
    });

    if (!settlement) {
      throw new NotFoundError('Settlement not found');
    }

    // Only payee can confirm
    if (settlement.payeeId !== userId) {
      throw new ApiError(403, 'Only the payee can confirm a settlement');
    }

    if (settlement.status === 'confirmed') {
      throw new ApiError(400, 'Settlement is already confirmed');
    }

    if (settlement.status === 'cancelled') {
      throw new ApiError(400, 'Cannot confirm a cancelled settlement');
    }

    return this.updateSettlement(id, { status: 'confirmed' }, userId);
  }

  /**
   * Cancel settlement
   */
  async cancelSettlement(id: string, userId: string): Promise<Settlement> {
    const settlement = await prisma.settlement.findUnique({
      where: { id, deletedAt: null },
    });

    if (!settlement) {
      throw new NotFoundError('Settlement not found');
    }

    // Only payer or payee can cancel
    const isInvolved = settlement.payerId === userId || settlement.payeeId === userId;
    if (!isInvolved) {
      throw new ApiError(403, 'Only involved parties can cancel a settlement');
    }

    if (settlement.status === 'confirmed') {
      throw new ApiError(400, 'Cannot cancel a confirmed settlement');
    }

    return this.updateSettlement(id, { status: 'cancelled' }, userId);
  }

  /**
   * Delete settlement
   */
  async deleteSettlement(id: string, userId: string): Promise<void> {
    const settlement = await prisma.settlement.findUnique({
      where: { id, deletedAt: null },
      include: {
        group: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!settlement) {
      throw new NotFoundError('Settlement not found');
    }

    if (!settlement.group) {
      throw new ApiError(404, 'Associated group not found');
    }

    // Check if user is admin or involved in settlement
    const member = settlement.group.members.find((m) => m.userId === userId);
    if (!member) {
      throw new ApiError(403, 'You must be a member of the group');
    }

    const isInvolved = settlement.payerId === userId || settlement.payeeId === userId;
    const isAdmin = member.role === 'admin';

    if (!isInvolved && !isAdmin) {
      throw new ApiError(403, 'Only involved parties or group admins can delete this settlement');
    }

    // Cannot delete confirmed settlements
    if (settlement.status === 'confirmed') {
      throw new ApiError(400, 'Cannot delete a confirmed settlement');
    }

    // Soft delete
    await prisma.settlement.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Calculate suggested settlements for a group
   * Uses greedy algorithm to minimize number of transactions
   */
  async calculateSuggestedSettlements(
    groupId: string,
    userId: string
  ): Promise<
    Array<{
      payerId: string;
      payerName: string;
      payeeId: string;
      payeeName: string;
      amount: number;
    }>
  > {
    // Verify user is member
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          userId,
          groupId,
        },
      },
    });

    if (!member) {
      throw new ApiError(403, 'You must be a member of the group');
    }

    // Get all group members
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Calculate balance for each member
    const balances = new Map<string, { name: string; balance: number }>();

    for (const member of members) {
      // Get all expenses where user is a participant
      const expenses = await prisma.expense.findMany({
        where: {
          groupId,
          deletedAt: null,
          participants: {
            some: {
              userId: member.userId,
            },
          },
        },
        include: {
          participants: true,
        },
      });

      let balance = 0;

      // Calculate from expenses
      for (const expense of expenses) {
        const participant = expense.participants.find((p) => p.userId === member.userId);
        if (participant) {
          balance += Number(participant.paidAmount) - Number(participant.owedAmount);
        }
      }

      // Subtract confirmed settlements where user is payer
      const settlementsAsPayer = await prisma.settlement.findMany({
        where: {
          groupId,
          payerId: member.userId,
          status: 'confirmed',
          deletedAt: null,
        },
      });

      balance -= settlementsAsPayer.reduce((sum, s) => sum + Number(s.amount), 0);

      // Add confirmed settlements where user is payee
      const settlementsAsPayee = await prisma.settlement.findMany({
        where: {
          groupId,
          payeeId: member.userId,
          status: 'confirmed',
          deletedAt: null,
        },
      });

      balance += settlementsAsPayee.reduce((sum, s) => sum + Number(s.amount), 0);

      balances.set(member.userId, {
        name: member.user.name,
        balance,
      });
    }

    // Separate into creditors (positive balance) and debtors (negative balance)
    const creditors: Array<{ userId: string; name: string; amount: number }> = [];
    const debtors: Array<{ userId: string; name: string; amount: number }> = [];

    for (const [userId, data] of balances.entries()) {
      if (data.balance > 0.01) {
        creditors.push({ userId, name: data.name, amount: data.balance });
      } else if (data.balance < -0.01) {
        debtors.push({ userId, name: data.name, amount: Math.abs(data.balance) });
      }
    }

    // Sort by amount (largest first)
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    // Greedy algorithm to minimize transactions
    const settlements: Array<{
      payerId: string;
      payerName: string;
      payeeId: string;
      payeeName: string;
      amount: number;
    }> = [];

    let i = 0;
    let j = 0;

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];

      const settleAmount = Math.min(creditor.amount, debtor.amount);

      if (settleAmount > 0.01) {
        settlements.push({
          payerId: debtor.userId,
          payerName: debtor.name,
          payeeId: creditor.userId,
          payeeName: creditor.name,
          amount: Math.round(settleAmount * 100) / 100, // Round to 2 decimals
        });
      }

      creditor.amount -= settleAmount;
      debtor.amount -= settleAmount;

      if (creditor.amount < 0.01) i++;
      if (debtor.amount < 0.01) j++;
    }

    return settlements;
  }
}

export const settlementService = new SettlementService();
