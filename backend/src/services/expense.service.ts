import { PrismaClient, Expense, Prisma } from '@prisma/client';
import { ApiError, NotFoundError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

// Define expense category type since it's not an enum in Prisma schema
export type ExpenseCategory = string;

// Define type for expense with relations
export type ExpenseWithRelations = Prisma.ExpenseGetPayload<{
  include: {
    participants: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            email: true;
            profilePictureUrl: true;
          };
        };
      };
    };
    paidBy: {
      select: {
        id: true;
        name: true;
        email: true;
        profilePictureUrl: true;
      };
    };
    group: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

export interface ExpenseParticipantData {
  userId: string;
  paidAmount: number;
  owedAmount: number;
}

export interface CreateExpenseData {
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: Date;
  groupId: string;
  paidById: string;
  receiptUrl?: string;
  notes?: string;
  participants: ExpenseParticipantData[];
  splitMethod?: 'equal' | 'exact' | 'percentage';
}

export interface UpdateExpenseData {
  amount?: number;
  description?: string;
  category?: ExpenseCategory;
  date?: Date;
  receiptUrl?: string;
  notes?: string;
  participants?: ExpenseParticipantData[];
}

export class ExpenseService {
  /**
   * Create a new expense
   */
  async createExpense(data: CreateExpenseData, userId: string): Promise<Expense> {
    // Verify group exists and user is a member
    const group = await prisma.group.findUnique({
      where: { id: data.groupId, deletedAt: null },
      include: {
        members: true,
      },
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    const isMember = group.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ApiError(403, 'You must be a member of the group to create an expense');
    }

    // Verify payer is a group member
    const isPayer = group.members.some((m) => m.userId === data.paidById);
    if (!isPayer) {
      throw new ApiError(400, 'Payer must be a member of the group');
    }

    // Verify all participants are group members
    for (const participant of data.participants) {
      const isParticipantMember = group.members.some((m) => m.userId === participant.userId);
      if (!isParticipantMember) {
        throw new ApiError(400, `User ${participant.userId} is not a member of the group`);
      }
    }

    // Validate participant amounts
    this.validateParticipantAmounts(data.amount, data.participants);

    // Create expense with participants
    const expense = await prisma.expense.create({
      data: {
        amount: data.amount,
        description: data.description,
        category: data.category,
        date: data.date,
        groupId: data.groupId,
        paidById: data.paidById,
        receiptUrl: data.receiptUrl,
        notes: data.notes,
        splitMethod: data.splitMethod || 'equal',
        participants: {
          create: data.participants.map((p) => ({
            userId: p.userId,
            paidAmount: p.paidAmount,
            owedAmount: p.owedAmount,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePictureUrl: true,
              },
            },
          },
        },
        paidBy: {
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

    return expense;
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(id: string): Promise<ExpenseWithRelations> {
    const expense = await prisma.expense.findUnique({
      where: { id, deletedAt: null },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePictureUrl: true,
              },
            },
          },
        },
        paidBy: {
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

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    return expense;
  }

  /**
   * Get all expenses for a group
   */
  async getGroupExpenses(
    groupId: string,
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      category?: ExpenseCategory;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{ expenses: Expense[]; total: number }> {
    // Verify user is member of group
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ApiError(403, 'You must be a member of the group to view expenses');
    }

    const where: any = {
      groupId,
      deletedAt: null,
    };

    if (options?.category) {
      where.category = options.category;
    }

    if (options?.startDate || options?.endDate) {
      where.date = {};
      if (options.startDate) {
        where.date.gte = options.startDate;
      }
      if (options.endDate) {
        where.date.lte = options.endDate;
      }
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          participants: {
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
          paidBy: {
            select: {
              id: true,
              name: true,
              profilePictureUrl: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      prisma.expense.count({ where }),
    ]);

    return { expenses, total };
  }

  /**
   * Get user's expenses across all groups
   */
  async getUserExpenses(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{ expenses: Expense[]; total: number }> {
    const where = {
      deletedAt: null,
      participants: {
        some: {
          userId,
        },
      },
    };

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          participants: {
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
          paidBy: {
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
          date: 'desc',
        },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      prisma.expense.count({ where }),
    ]);

    return { expenses, total };
  }

  /**
   * Update expense
   */
  async updateExpense(id: string, data: UpdateExpenseData, userId: string): Promise<Expense> {
    // Check if expense exists
    const expense = await prisma.expense.findUnique({
      where: { id, deletedAt: null },
      include: {
        group: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    // Check if user is admin or the one who created the expense
    if (!expense.group) {
      throw new ApiError(400, 'Expense is not associated with a group');
    }
    const member = expense.group.members.find((m) => m.userId === userId);
    if (!member) {
      throw new ApiError(403, 'You must be a member of the group');
    }

    const canEdit = member.role === 'admin' || expense.paidById === userId;
    if (!canEdit) {
      throw new ApiError(403, 'Only group admins or the expense creator can edit this expense');
    }

    // If participants are being updated, validate amounts
    if (data.participants) {
      const amount = data.amount || Number(expense.amount);
      this.validateParticipantAmounts(amount, data.participants);

      // Delete existing participants and create new ones
      await prisma.expenseParticipant.deleteMany({
        where: { expenseId: id },
      });
    }

    // Update expense
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.date !== undefined && { date: data.date }),
        ...(data.receiptUrl !== undefined && { receiptUrl: data.receiptUrl }),
        ...(data.notes !== undefined && { notes: data.notes }),
        updatedAt: new Date(),
        ...(data.participants && {
          participants: {
            create: data.participants.map((p) => ({
              userId: p.userId,
              paidAmount: p.paidAmount,
              owedAmount: p.owedAmount,
            })),
          },
        }),
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePictureUrl: true,
              },
            },
          },
        },
        paidBy: {
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

    return updatedExpense;
  }

  /**
   * Delete expense
   */
  async deleteExpense(id: string, userId: string): Promise<void> {
    const expense = await prisma.expense.findUnique({
      where: { id, deletedAt: null },
      include: {
        group: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    // Check if user is admin or the one who created the expense
    if (!expense.group) {
      throw new ApiError(400, 'Expense is not associated with a group');
    }
    const member = expense.group.members.find((m) => m.userId === userId);
    if (!member) {
      throw new ApiError(403, 'You must be a member of the group');
    }

    const canDelete = member.role === 'admin' || expense.paidById === userId;
    if (!canDelete) {
      throw new ApiError(403, 'Only group admins or the expense creator can delete this expense');
    }

    // Soft delete expense
    await prisma.expense.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Calculate equal split for participants
   */
  calculateEqualSplit(
    amount: number,
    participantIds: string[],
    payerId: string
  ): ExpenseParticipantData[] {
    const perPersonAmount = amount / participantIds.length;

    return participantIds.map((userId) => ({
      userId,
      paidAmount: userId === payerId ? amount : 0,
      owedAmount: perPersonAmount,
    }));
  }

  /**
   * Calculate percentage split for participants
   */
  calculatePercentageSplit(
    amount: number,
    participants: Array<{ userId: string; percentage: number }>,
    payerId: string
  ): ExpenseParticipantData[] {
    // Validate percentages sum to 100
    const totalPercentage = participants.reduce((sum, p) => sum + p.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new ApiError(400, 'Percentages must sum to 100');
    }

    return participants.map((p) => ({
      userId: p.userId,
      paidAmount: p.userId === payerId ? amount : 0,
      owedAmount: (amount * p.percentage) / 100,
    }));
  }

  /**
   * Validate participant amounts
   */
  private validateParticipantAmounts(
    totalAmount: number,
    participants: ExpenseParticipantData[]
  ): void {
    if (participants.length === 0) {
      throw new ApiError(400, 'Expense must have at least one participant');
    }

    const totalPaid = participants.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalOwed = participants.reduce((sum, p) => sum + p.owedAmount, 0);

    // Allow small floating point differences (0.01)
    if (Math.abs(totalPaid - totalAmount) > 0.01) {
      throw new ApiError(
        400,
        `Total paid amount (${totalPaid}) must equal expense amount (${totalAmount})`
      );
    }

    if (Math.abs(totalOwed - totalAmount) > 0.01) {
      throw new ApiError(
        400,
        `Total owed amount (${totalOwed}) must equal expense amount (${totalAmount})`
      );
    }
  }

  /**
   * Get expense statistics for a group
   */
  async getGroupExpenseStatistics(
    groupId: string,
    userId: string
  ): Promise<{
    totalExpenses: number;
    totalAmount: number;
    byCategory: Array<{ category: ExpenseCategory; count: number; total: number }>;
    byMonth: Array<{ month: string; count: number; total: number }>;
    topPayers: Array<{ userId: string; userName: string; totalPaid: number }>;
  }> {
    // Verify user is member
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ApiError(403, 'You must be a member of the group');
    }

    const expenses = await prisma.expense.findMany({
      where: { groupId, deletedAt: null },
      include: {
        participants: true,
        paidBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // By category
    const categoryMap = new Map<ExpenseCategory, { count: number; total: number }>();
    expenses.forEach((expense) => {
      const existing = categoryMap.get(expense.category) || { count: 0, total: 0 };
      categoryMap.set(expense.category, {
        count: existing.count + 1,
        total: existing.total + Number(expense.amount),
      });
    });

    const byCategory = Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      count: stats.count,
      total: stats.total,
    }));

    // By month (last 12 months)
    const monthMap = new Map<string, { count: number; total: number }>();
    expenses.forEach((expense) => {
      const monthKey = expense.date.toISOString().slice(0, 7); // YYYY-MM
      const existing = monthMap.get(monthKey) || { count: 0, total: 0 };
      monthMap.set(monthKey, {
        count: existing.count + 1,
        total: existing.total + Number(expense.amount),
      });
    });

    const byMonth = Array.from(monthMap.entries())
      .map(([month, stats]) => ({
        month,
        count: stats.count,
        total: stats.total,
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12);

    // Top payers
    const payerMap = new Map<string, { name: string; totalPaid: number }>();
    expenses.forEach((expense) => {
      const existing = payerMap.get(expense.paidById) || {
        name: expense.paidBy.name,
        totalPaid: 0,
      };
      payerMap.set(expense.paidById, {
        name: existing.name,
        totalPaid: existing.totalPaid + Number(expense.amount),
      });
    });

    const topPayers = Array.from(payerMap.entries())
      .map(([userId, data]) => ({
        userId,
        userName: data.name,
        totalPaid: data.totalPaid,
      }))
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 10);

    return {
      totalExpenses,
      totalAmount,
      byCategory,
      byMonth,
      topPayers,
    };
  }
}

export const expenseService = new ExpenseService();
