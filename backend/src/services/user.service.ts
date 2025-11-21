import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ApiError, NotFoundError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export interface CreateUserData {
  email: string;
  password?: string;
  name: string;
  defaultCurrency?: string;
  phoneNumber?: string;
  oauthProvider?: string;
  oauthId?: string;
}

export interface UpdateUserData {
  name?: string;
  defaultCurrency?: string;
  phoneNumber?: string;
  emailVerified?: boolean;
  profilePictureUrl?: string;
}

export class UserService {
  /**
   * Create a new user
   */
  async createUser(data: CreateUserData): Promise<Omit<User, 'passwordHash'>> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    // Hash password if provided
    let passwordHash: string | null = null;
    if (data.password) {
      passwordHash = await bcrypt.hash(data.password, 12);
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
        defaultCurrency: data.defaultCurrency || 'USD',
        phoneNumber: data.phoneNumber,
        oauthProvider: data.oauthProvider,
        oauthId: data.oauthId,
      },
    });

    // Return user without password hash
    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        groupMemberships: {
          include: {
            group: true,
          },
          where: {
            group: {
              deletedAt: null,
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase(), deletedAt: null },
    });

    return user;
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserData): Promise<Omit<User, 'passwordHash'>> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    const { passwordHash: _passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.passwordHash) {
      throw new ApiError(400, 'User does not have a password set (OAuth user)');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Verify user password
   */
  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase(), deletedAt: null },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Soft delete user
   */
  async deleteUser(id: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Verify user email
   */
  async verifyEmail(id: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await prisma.user.update({
      where: { id },
      data: {
        emailVerified: true,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get user's balance across all groups
   */
  async getUserBalance(id: string): Promise<{
    totalOwed: number;
    totalOwedToMe: number;
    netBalance: number;
    byGroup: Array<{
      groupId: string;
      groupName: string;
      balance: number;
    }>;
  }> {
    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get all groups user is part of
    const groupMemberships = await prisma.groupMember.findMany({
      where: {
        userId: id,
        group: {
          deletedAt: null,
        },
      },
      include: {
        group: true,
      },
    });

    const balanceByGroup: Array<{
      groupId: string;
      groupName: string;
      balance: number;
    }> = [];

    let totalOwed = 0;
    let totalOwedToMe = 0;

    for (const membership of groupMemberships) {
      const groupBalance = await this.calculateGroupBalance(id, membership.groupId);

      balanceByGroup.push({
        groupId: membership.groupId,
        groupName: membership.group.name,
        balance: groupBalance,
      });

      if (groupBalance < 0) {
        totalOwed += Math.abs(groupBalance);
      } else {
        totalOwedToMe += groupBalance;
      }
    }

    return {
      totalOwed,
      totalOwedToMe,
      netBalance: totalOwedToMe - totalOwed,
      byGroup: balanceByGroup,
    };
  }

  /**
   * Calculate user's balance in a specific group
   * Positive = others owe this user
   * Negative = this user owes others
   */
  private async calculateGroupBalance(userId: string, groupId: string): Promise<number> {
    // Get all expenses in this group where user is a participant
    const expenses = await prisma.expense.findMany({
      where: {
        groupId,
        deletedAt: null,
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        participants: true,
      },
    });

    let balance = 0;

    for (const expense of expenses) {
      const userParticipant = expense.participants.find((p) => p.userId === userId);
      if (userParticipant) {
        // What user paid minus what they owe
        balance += Number(userParticipant.paidAmount) - Number(userParticipant.owedAmount);
      }
    }

    // Subtract confirmed settlements where user is payer
    const settlementsAsPayer = await prisma.settlement.findMany({
      where: {
        groupId,
        payerId: userId,
        status: 'confirmed',
        deletedAt: null,
      },
    });

    for (const settlement of settlementsAsPayer) {
      balance -= Number(settlement.amount);
    }

    // Add confirmed settlements where user is payee
    const settlementsAsPayee = await prisma.settlement.findMany({
      where: {
        groupId,
        payeeId: userId,
        status: 'confirmed',
        deletedAt: null,
      },
    });

    for (const settlement of settlementsAsPayee) {
      balance += Number(settlement.amount);
    }

    return balance;
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string, limit: number = 10): Promise<Array<Omit<User, 'passwordHash'>>> {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
    });

    return users.map((user) => {
      const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }
}

export const userService = new UserService();
