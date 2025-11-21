import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { authService } from '../../src/services/auth.service';
import { groupService } from '../../src/services/group.service';

const prisma = new PrismaClient();

describe('Expense API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let _member2Token: string;
  let member2Id: string;
  let nonMemberToken: string;
  let nonMemberId: string;
  let groupId: string;
  let expenseId: string;

  beforeAll(async () => {
    await prisma.$connect();

    // Create test users
    const user1 = await authService.register({
      email: 'expenseuser1@example.com',
      password: 'SecurePass123',
      name: 'Expense User 1',
    });
    authToken = user1.tokens.accessToken;
    userId = user1.user.id;

    const user2 = await authService.register({
      email: 'expenseuser2@example.com',
      password: 'SecurePass123',
      name: 'Expense User 2',
    });
    _member2Token = user2.tokens.accessToken;
    member2Id = user2.user.id;

    const user3 = await authService.register({
      email: 'expensenonmember@example.com',
      password: 'SecurePass123',
      name: 'Non Member',
    });
    nonMemberToken = user3.tokens.accessToken;
    nonMemberId = user3.user.id;

    // Create test group
    const group = await groupService.createGroup({
      name: 'Expense Test Group',
      groupType: 'friends',
      createdById: userId,
      initialMembers: [member2Id],
    });
    groupId = group.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.expenseParticipant.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/expenses', () => {
    it('should create an expense', async () => {
      const response = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100,
          description: 'Dinner',
          category: 'food_dining',
          date: new Date().toISOString(),
          groupId: groupId,
          paidById: userId,
          participants: [
            {
              userId: userId,
              paidAmount: 100,
              owedAmount: 50,
            },
            {
              userId: member2Id,
              paidAmount: 0,
              owedAmount: 50,
            },
          ],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.expense.amount).toBe(100);
      expect(response.body.data.expense.description).toBe('Dinner');
      expect(response.body.data.expense.participants.length).toBe(2);

      expenseId = response.body.data.expense.id;
    });

    it('should validate expense data', async () => {
      await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: -10, // Invalid: negative amount
          description: 'Invalid',
          category: 'food_dining',
          date: new Date().toISOString(),
          groupId: groupId,
          paidById: userId,
          participants: [],
        })
        .expect(400);
    });

    it('should validate participant amounts sum to total', async () => {
      await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100,
          description: 'Invalid Split',
          category: 'food_dining',
          date: new Date().toISOString(),
          groupId: groupId,
          paidById: userId,
          participants: [
            {
              userId: userId,
              paidAmount: 50, // Total paid = 50, but amount = 100
              owedAmount: 50,
            },
            {
              userId: member2Id,
              paidAmount: 0,
              owedAmount: 50,
            },
          ],
        })
        .expect(400);
    });

    it('should not allow non-members to create expense', async () => {
      await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .send({
          amount: 100,
          description: 'Unauthorized',
          category: 'food_dining',
          date: new Date().toISOString(),
          groupId: groupId,
          paidById: nonMemberId,
          participants: [
            {
              userId: nonMemberId,
              paidAmount: 100,
              owedAmount: 100,
            },
          ],
        })
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/v1/expenses')
        .send({
          amount: 100,
          description: 'Dinner',
          category: 'food_dining',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/expenses/:id', () => {
    it('should get expense details for participants', async () => {
      const response = await request(app)
        .get(`/api/v1/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.expense.id).toBe(expenseId);
      expect(response.body.data.expense.description).toBe('Dinner');
      expect(response.body.data.expense.participants).toBeDefined();
      expect(response.body.data.expense.paidBy).toBeDefined();
      expect(response.body.data.expense.group).toBeDefined();
    });

    it('should not allow non-participants to view expense', async () => {
      await request(app)
        .get(`/api/v1/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent expense', async () => {
      await request(app)
        .get('/api/v1/expenses/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app).get(`/api/v1/expenses/${expenseId}`).expect(401);
    });
  });

  describe('GET /api/v1/expenses', () => {
    it('should get users expenses', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.expenses)).toBe(true);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.limit).toBeDefined();
      expect(response.body.data.offset).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .query({ limit: 5, offset: 0 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.limit).toBe(5);
      expect(response.body.data.offset).toBe(0);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/v1/expenses').expect(401);
    });
  });

  describe('GET /api/v1/groups/:groupId/expenses', () => {
    it('should get group expenses', async () => {
      const response = await request(app)
        .get(`/api/v1/groups/${groupId}/expenses`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.expenses)).toBe(true);
      expect(response.body.data.expenses.length).toBeGreaterThan(0);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get(`/api/v1/groups/${groupId}/expenses`)
        .query({ category: 'food_dining' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.expenses.forEach((expense: any) => {
        expect(expense.category).toBe('food_dining');
      });
    });

    it('should not allow non-members to view group expenses', async () => {
      await request(app)
        .get(`/api/v1/groups/${groupId}/expenses`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app).get(`/api/v1/groups/${groupId}/expenses`).expect(401);
    });
  });

  describe('PUT /api/v1/expenses/:id', () => {
    it('should update expense as creator', async () => {
      const response = await request(app)
        .put(`/api/v1/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated Dinner',
          amount: 120,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.expense.description).toBe('Updated Dinner');
      expect(response.body.data.expense.amount).toBe(120);
    });

    it('should require authentication', async () => {
      await request(app)
        .put(`/api/v1/expenses/${expenseId}`)
        .send({
          description: 'Hacked',
        })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/expenses/:id', () => {
    it('should delete expense as creator', async () => {
      // Create a temporary expense to delete
      const tempExpense = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 50,
          description: 'Temp Expense',
          category: 'other',
          date: new Date().toISOString(),
          groupId: groupId,
          paidById: userId,
          participants: [
            {
              userId: userId,
              paidAmount: 50,
              owedAmount: 50,
            },
          ],
        });

      const response = await request(app)
        .delete(`/api/v1/expenses/${tempExpense.body.data.expense.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });

    it('should require authentication', async () => {
      await request(app).delete(`/api/v1/expenses/${expenseId}`).expect(401);
    });
  });

  describe('POST /api/v1/expenses/calculate-split/equal', () => {
    it('should calculate equal split', async () => {
      const response = await request(app)
        .post('/api/v1/expenses/calculate-split/equal')
        .send({
          amount: 100,
          participantIds: [userId, member2Id],
          payerId: userId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.participants).toBeDefined();
      expect(response.body.data.participants.length).toBe(2);
      expect(response.body.data.participants[0].owedAmount).toBe(50);
      expect(response.body.data.participants[1].owedAmount).toBe(50);
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/v1/expenses/calculate-split/equal')
        .send({
          amount: 100,
          // Missing participantIds and payerId
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/expenses/calculate-split/percentage', () => {
    it('should calculate percentage split', async () => {
      const response = await request(app)
        .post('/api/v1/expenses/calculate-split/percentage')
        .send({
          amount: 100,
          participants: [
            { userId: userId, percentage: 60 },
            { userId: member2Id, percentage: 40 },
          ],
          payerId: userId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.participants).toBeDefined();
      expect(response.body.data.participants.length).toBe(2);
      expect(response.body.data.participants[0].owedAmount).toBe(60);
      expect(response.body.data.participants[1].owedAmount).toBe(40);
    });

    it('should validate percentages sum to 100', async () => {
      await request(app)
        .post('/api/v1/expenses/calculate-split/percentage')
        .send({
          amount: 100,
          participants: [
            { userId: userId, percentage: 50 },
            { userId: member2Id, percentage: 40 }, // Only 90%
          ],
          payerId: userId,
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/groups/:groupId/expenses/statistics', () => {
    it('should get expense statistics', async () => {
      const response = await request(app)
        .get(`/api/v1/groups/${groupId}/expenses/statistics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toBeDefined();
      expect(response.body.data.statistics.totalExpenses).toBeDefined();
      expect(response.body.data.statistics.totalAmount).toBeDefined();
      expect(response.body.data.statistics.byCategory).toBeDefined();
      expect(Array.isArray(response.body.data.statistics.byCategory)).toBe(true);
      expect(response.body.data.statistics.byMonth).toBeDefined();
      expect(Array.isArray(response.body.data.statistics.byMonth)).toBe(true);
      expect(response.body.data.statistics.topPayers).toBeDefined();
      expect(Array.isArray(response.body.data.statistics.topPayers)).toBe(true);
    });

    it('should not allow non-members to view statistics', async () => {
      await request(app)
        .get(`/api/v1/groups/${groupId}/expenses/statistics`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app).get(`/api/v1/groups/${groupId}/expenses/statistics`).expect(401);
    });
  });
});
