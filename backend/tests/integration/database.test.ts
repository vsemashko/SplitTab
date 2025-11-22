import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.notification.deleteMany();
    await prisma.settlement.deleteMany();
    await prisma.expenseParticipant.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as value`;
      expect(result).toBeDefined();
    });

    it('should execute raw queries', async () => {
      const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
      expect(result).toBeDefined();
    });
  });

  describe('User Model CRUD', () => {
    it('should create a user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: await bcrypt.hash('SecurePass123', 12),
          name: 'Test User',
          emailVerified: true,
        },
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.emailVerified).toBe(true);
    });

    it('should enforce unique email constraint', async () => {
      await prisma.user.create({
        data: {
          email: 'duplicate@example.com',
          passwordHash: await bcrypt.hash('SecurePass123', 12),
          name: 'First User',
        },
      });

      await expect(
        prisma.user.create({
          data: {
            email: 'duplicate@example.com',
            passwordHash: await bcrypt.hash('SecurePass123', 12),
            name: 'Second User',
          },
        })
      ).rejects.toThrow();
    });

    it('should read a user by id', async () => {
      const created = await prisma.user.create({
        data: {
          email: 'read@example.com',
          passwordHash: await bcrypt.hash('SecurePass123', 12),
          name: 'Read User',
        },
      });

      const user = await prisma.user.findUnique({
        where: { id: created.id },
      });

      expect(user).toBeDefined();
      expect(user?.email).toBe('read@example.com');
    });

    it('should update a user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'update@example.com',
          passwordHash: await bcrypt.hash('SecurePass123', 12),
          name: 'Original Name',
        },
      });

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { name: 'Updated Name' },
      });

      expect(updated.name).toBe('Updated Name');
    });

    it('should soft delete a user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'delete@example.com',
          passwordHash: await bcrypt.hash('SecurePass123', 12),
          name: 'Delete User',
        },
      });

      const deleted = await prisma.user.update({
        where: { id: user.id },
        data: { deletedAt: new Date() },
      });

      expect(deleted.deletedAt).toBeDefined();
    });
  });

  describe('Group Model CRUD', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'grouptest@example.com',
          passwordHash: await bcrypt.hash('SecurePass123', 12),
          name: 'Group Test User',
        },
      });
    });

    it('should create a group', async () => {
      const group = await prisma.group.create({
        data: {
          name: 'Test Group',
          groupType: 'friends',
          createdBy: testUser.id,
        },
      });

      expect(group.id).toBeDefined();
      expect(group.name).toBe('Test Group');
      expect(group.groupType).toBe('friends');
    });

    it('should create group with members', async () => {
      const group = await prisma.group.create({
        data: {
          name: 'Group With Members',
          groupType: 'trip',
          createdBy: testUser.id,
          members: {
            create: {
              userId: testUser.id,
              role: 'admin',
            },
          },
        },
        include: {
          members: true,
        },
      });

      expect(group.members).toHaveLength(1);
      expect(group.members[0].role).toBe('admin');
    });

    it('should cascade delete group members when group is deleted', async () => {
      const group = await prisma.group.create({
        data: {
          name: 'Cascade Test',
          groupType: 'home',
          createdBy: testUser.id,
          members: {
            create: {
              userId: testUser.id,
              role: 'admin',
            },
          },
        },
      });

      await prisma.group.delete({
        where: { id: group.id },
      });

      const members = await prisma.groupMember.findMany({
        where: { groupId: group.id },
      });

      expect(members).toHaveLength(0);
    });
  });

  describe('Expense Model CRUD', () => {
    let testUser1: any;
    let testUser2: any;
    let testGroup: any;

    beforeEach(async () => {
      testUser1 = await prisma.user.create({
        data: {
          email: 'expense1@example.com',
          passwordHash: await bcrypt.hash('SecurePass123', 12),
          name: 'Expense User 1',
        },
      });

      testUser2 = await prisma.user.create({
        data: {
          email: 'expense2@example.com',
          passwordHash: await bcrypt.hash('SecurePass123', 12),
          name: 'Expense User 2',
        },
      });

      testGroup = await prisma.group.create({
        data: {
          name: 'Expense Test Group',
          groupType: 'friends',
          createdBy: testUser1.id,
        },
      });
    });

    it('should create an expense with participants', async () => {
      const expense = await prisma.expense.create({
        data: {
          amount: 100,
          description: 'Test Expense',
          category: 'food_dining',
          date: new Date(),
          groupId: testGroup.id,
          paidById: testUser1.id,
          participants: {
            create: [
              {
                userId: testUser1.id,
                paidAmount: 100,
                owedAmount: 50,
              },
              {
                userId: testUser2.id,
                paidAmount: 0,
                owedAmount: 50,
              },
            ],
          },
        },
        include: {
          participants: true,
        },
      });

      expect(expense.id).toBeDefined();
      expect(expense.amount).toBe(100);
      expect(expense.participants).toHaveLength(2);

      const totalPaid = expense.participants.reduce((sum, p) => sum + p.paidAmount, 0);
      const totalOwed = expense.participants.reduce((sum, p) => sum + p.owedAmount, 0);

      expect(totalPaid).toBe(100);
      expect(totalOwed).toBe(100);
    });

    it('should retrieve expense with all relations', async () => {
      const created = await prisma.expense.create({
        data: {
          amount: 75,
          description: 'Dinner',
          category: 'food_dining',
          date: new Date(),
          groupId: testGroup.id,
          paidById: testUser1.id,
          participants: {
            create: [
              {
                userId: testUser1.id,
                paidAmount: 75,
                owedAmount: 37.5,
              },
              {
                userId: testUser2.id,
                paidAmount: 0,
                owedAmount: 37.5,
              },
            ],
          },
        },
      });

      const expense = await prisma.expense.findUnique({
        where: { id: created.id },
        include: {
          paidBy: true,
          group: true,
          participants: {
            include: {
              user: true,
            },
          },
        },
      });

      expect(expense).toBeDefined();
      expect(expense?.paidBy.name).toBe('Expense User 1');
      expect(expense?.group.name).toBe('Expense Test Group');
      expect(expense?.participants).toHaveLength(2);
    });

    it('should cascade delete participants when expense is deleted', async () => {
      const expense = await prisma.expense.create({
        data: {
          amount: 50,
          description: 'Delete Test',
          category: 'other',
          date: new Date(),
          groupId: testGroup.id,
          paidById: testUser1.id,
          participants: {
            create: [
              {
                userId: testUser1.id,
                paidAmount: 50,
                owedAmount: 25,
              },
              {
                userId: testUser2.id,
                paidAmount: 0,
                owedAmount: 25,
              },
            ],
          },
        },
      });

      await prisma.expense.delete({
        where: { id: expense.id },
      });

      const participants = await prisma.expenseParticipant.findMany({
        where: { expenseId: expense.id },
      });

      expect(participants).toHaveLength(0);
    });
  });

  describe('Settlement Model CRUD', () => {
    let testUser1: any;
    let testUser2: any;
    let testGroup: any;

    beforeEach(async () => {
      testUser1 = await prisma.user.create({
        data: {
          email: 'settlement1@example.com',
          passwordHash: await bcrypt.hash('SecurePass123', 12),
          name: 'Settlement User 1',
        },
      });

      testUser2 = await prisma.user.create({
        data: {
          email: 'settlement2@example.com',
          passwordHash: await bcrypt.hash('SecurePass123', 12),
          name: 'Settlement User 2',
        },
      });

      testGroup = await prisma.group.create({
        data: {
          name: 'Settlement Test Group',
          groupType: 'friends',
          createdBy: testUser1.id,
        },
      });
    });

    it('should create a settlement', async () => {
      const settlement = await prisma.settlement.create({
        data: {
          amount: 50,
          payerId: testUser1.id,
          payeeId: testUser2.id,
          groupId: testGroup.id,
        },
      });

      expect(settlement.id).toBeDefined();
      expect(settlement.amount).toBe(50);
      expect(settlement.status).toBe('pending');
      expect(settlement.payerId).toBe(testUser1.id);
      expect(settlement.payeeId).toBe(testUser2.id);
    });

    it('should update settlement status', async () => {
      const settlement = await prisma.settlement.create({
        data: {
          amount: 25,
          payerId: testUser1.id,
          payeeId: testUser2.id,
          groupId: testGroup.id,
        },
      });

      const updated = await prisma.settlement.update({
        where: { id: settlement.id },
        data: { status: 'confirmed' },
      });

      expect(updated.status).toBe('confirmed');
    });

    it('should retrieve settlement with relations', async () => {
      const created = await prisma.settlement.create({
        data: {
          amount: 100,
          payerId: testUser1.id,
          payeeId: testUser2.id,
          groupId: testGroup.id,
        },
      });

      const settlement = await prisma.settlement.findUnique({
        where: { id: created.id },
        include: {
          payer: true,
          payee: true,
          group: true,
        },
      });

      expect(settlement).toBeDefined();
      expect(settlement?.payer.name).toBe('Settlement User 1');
      expect(settlement?.payee.name).toBe('Settlement User 2');
      expect(settlement?.group.name).toBe('Settlement Test Group');
    });
  });

  describe('Transactions', () => {
    it('should rollback on error', async () => {
      const email = 'transaction@example.com';

      try {
        await prisma.$transaction(async (tx) => {
          await tx.user.create({
            data: {
              email,
              passwordHash: await bcrypt.hash('SecurePass123', 12),
              name: 'Transaction User',
            },
          });

          // This should cause rollback due to duplicate email
          await tx.user.create({
            data: {
              email, // Same email - will fail
              passwordHash: await bcrypt.hash('SecurePass123', 12),
              name: 'Duplicate User',
            },
          });
        });
      } catch (error) {
        // Expected to fail
      }

      const users = await prisma.user.findMany({
        where: { email },
      });

      expect(users).toHaveLength(0); // Should be rolled back
    });

    it('should commit successful transaction', async () => {
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: 'txsuccess@example.com',
            passwordHash: await bcrypt.hash('SecurePass123', 12),
            name: 'TX Success User',
          },
        });

        const group = await tx.group.create({
          data: {
            name: 'TX Success Group',
            groupType: 'friends',
            createdBy: user.id,
          },
        });

        return { user, group };
      });

      expect(result.user.id).toBeDefined();
      expect(result.group.id).toBeDefined();

      const user = await prisma.user.findUnique({
        where: { id: result.user.id },
      });
      const group = await prisma.group.findUnique({
        where: { id: result.group.id },
      });

      expect(user).toBeDefined();
      expect(group).toBeDefined();
    });
  });

  describe('Indexes', () => {
    it('should efficiently query by indexed email field', async () => {
      // Create multiple users
      await prisma.user.createMany({
        data: [
          {
            email: 'index1@example.com',
            passwordHash: await bcrypt.hash('SecurePass123', 12),
            name: 'Index User 1',
          },
          {
            email: 'index2@example.com',
            passwordHash: await bcrypt.hash('SecurePass123', 12),
            name: 'Index User 2',
          },
          {
            email: 'index3@example.com',
            passwordHash: await bcrypt.hash('SecurePass123', 12),
            name: 'Index User 3',
          },
        ],
      });

      const user = await prisma.user.findUnique({
        where: { email: 'index2@example.com' },
      });

      expect(user).toBeDefined();
      expect(user?.name).toBe('Index User 2');
    });
  });
});
