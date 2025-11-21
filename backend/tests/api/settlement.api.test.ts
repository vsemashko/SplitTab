import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { authService } from '../../src/services/auth.service';
import { groupService } from '../../src/services/group.service';
import { expenseService } from '../../src/services/expense.service';

const prisma = new PrismaClient();

describe('Settlement API Integration Tests', () => {
  let payerToken: string;
  let payerId: string;
  let payeeToken: string;
  let payeeId: string;
  let nonMemberToken: string;
  let nonMemberId: string;
  let groupId: string;
  let settlementId: string;

  beforeAll(async () => {
    await prisma.$connect();

    // Create test users
    const payer = await authService.register({
      email: 'payer@example.com',
      password: 'SecurePass123',
      name: 'Payer User',
    });
    payerToken = payer.tokens.accessToken;
    payerId = payer.user.id;

    const payee = await authService.register({
      email: 'payee@example.com',
      password: 'SecurePass123',
      name: 'Payee User',
    });
    payeeToken = payee.tokens.accessToken;
    payeeId = payee.user.id;

    const nonMember = await authService.register({
      email: 'settlementnonmember@example.com',
      password: 'SecurePass123',
      name: 'Non Member',
    });
    nonMemberToken = nonMember.tokens.accessToken;
    nonMemberId = nonMember.user.id;

    // Create test group
    const group = await groupService.createGroup({
      name: 'Settlement Test Group',
      groupType: 'friends',
      createdById: payerId,
      initialMembers: [payeeId],
    });
    groupId = group.id;

    // Create an expense to generate a balance
    await expenseService.createExpense(
      {
        amount: 100,
        description: 'Lunch',
        category: 'food_dining',
        date: new Date(),
        groupId: groupId,
        paidById: payeeId,
        participants: [
          {
            userId: payerId,
            paidAmount: 0,
            owedAmount: 50,
          },
          {
            userId: payeeId,
            paidAmount: 100,
            owedAmount: 50,
          },
        ],
      },
      payeeId
    );
  });

  afterAll(async () => {
    // Cleanup
    await prisma.settlement.deleteMany();
    await prisma.expenseParticipant.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/settlements', () => {
    it('should create a settlement', async () => {
      const response = await request(app)
        .post('/api/v1/settlements')
        .set('Authorization', `Bearer ${payerToken}`)
        .send({
          amount: 50,
          payerId: payerId,
          payeeId: payeeId,
          groupId: groupId,
          notes: 'Payment for lunch',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settlement.amount).toBe(50);
      expect(response.body.data.settlement.payerId).toBe(payerId);
      expect(response.body.data.settlement.payeeId).toBe(payeeId);
      expect(response.body.data.settlement.status).toBe('pending');

      settlementId = response.body.data.settlement.id;
    });

    it('should validate settlement data', async () => {
      await request(app)
        .post('/api/v1/settlements')
        .set('Authorization', `Bearer ${payerToken}`)
        .send({
          amount: -10, // Invalid: negative amount
          payerId: payerId,
          payeeId: payeeId,
          groupId: groupId,
        })
        .expect(400);
    });

    it('should not allow payer and payee to be the same', async () => {
      await request(app)
        .post('/api/v1/settlements')
        .set('Authorization', `Bearer ${payerToken}`)
        .send({
          amount: 50,
          payerId: payerId,
          payeeId: payerId, // Same as payer
          groupId: groupId,
        })
        .expect(400);
    });

    it('should not allow non-members to create settlement', async () => {
      await request(app)
        .post('/api/v1/settlements')
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .send({
          amount: 50,
          payerId: nonMemberId,
          payeeId: payeeId,
          groupId: groupId,
        })
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/v1/settlements')
        .send({
          amount: 50,
          payerId: payerId,
          payeeId: payeeId,
          groupId: groupId,
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/settlements/:id', () => {
    it('should get settlement details for involved parties', async () => {
      const response = await request(app)
        .get(`/api/v1/settlements/${settlementId}`)
        .set('Authorization', `Bearer ${payerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settlement.id).toBe(settlementId);
      expect(response.body.data.settlement.payer).toBeDefined();
      expect(response.body.data.settlement.payee).toBeDefined();
      expect(response.body.data.settlement.group).toBeDefined();
    });

    it('should not allow non-involved parties to view settlement', async () => {
      await request(app)
        .get(`/api/v1/settlements/${settlementId}`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent settlement', async () => {
      await request(app)
        .get('/api/v1/settlements/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${payerToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app).get(`/api/v1/settlements/${settlementId}`).expect(401);
    });
  });

  describe('GET /api/v1/settlements', () => {
    it('should get users settlements', async () => {
      const response = await request(app)
        .get('/api/v1/settlements')
        .set('Authorization', `Bearer ${payerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.settlements)).toBe(true);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.limit).toBeDefined();
      expect(response.body.data.offset).toBeDefined();
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/settlements')
        .query({ status: 'pending' })
        .set('Authorization', `Bearer ${payerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.settlements.forEach((settlement: any) => {
        expect(settlement.status).toBe('pending');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/settlements')
        .query({ limit: 5, offset: 0 })
        .set('Authorization', `Bearer ${payerToken}`)
        .expect(200);

      expect(response.body.data.limit).toBe(5);
      expect(response.body.data.offset).toBe(0);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/v1/settlements').expect(401);
    });
  });

  describe('GET /api/v1/groups/:groupId/settlements', () => {
    it('should get group settlements', async () => {
      const response = await request(app)
        .get(`/api/v1/groups/${groupId}/settlements`)
        .set('Authorization', `Bearer ${payerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.settlements)).toBe(true);
      expect(response.body.data.settlements.length).toBeGreaterThan(0);
    });

    it('should not allow non-members to view group settlements', async () => {
      await request(app)
        .get(`/api/v1/groups/${groupId}/settlements`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app).get(`/api/v1/groups/${groupId}/settlements`).expect(401);
    });
  });

  describe('PUT /api/v1/settlements/:id', () => {
    it('should update settlement as involved party', async () => {
      const response = await request(app)
        .put(`/api/v1/settlements/${settlementId}`)
        .set('Authorization', `Bearer ${payerToken}`)
        .send({
          notes: 'Updated payment note',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settlement.notes).toBe('Updated payment note');
    });

    it('should require authentication', async () => {
      await request(app)
        .put(`/api/v1/settlements/${settlementId}`)
        .send({
          notes: 'Hacked',
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/settlements/:id/confirm', () => {
    it('should confirm settlement as payee', async () => {
      const response = await request(app)
        .post(`/api/v1/settlements/${settlementId}/confirm`)
        .set('Authorization', `Bearer ${payeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settlement.status).toBe('confirmed');
    });

    it('should not allow confirming already confirmed settlement', async () => {
      await request(app)
        .post(`/api/v1/settlements/${settlementId}/confirm`)
        .set('Authorization', `Bearer ${payeeToken}`)
        .expect(400);
    });

    it('should not allow payer to confirm', async () => {
      // Create new settlement
      const newSettlement = await request(app)
        .post('/api/v1/settlements')
        .set('Authorization', `Bearer ${payerToken}`)
        .send({
          amount: 25,
          payerId: payerId,
          payeeId: payeeId,
          groupId: groupId,
        });

      await request(app)
        .post(`/api/v1/settlements/${newSettlement.body.data.settlement.id}/confirm`)
        .set('Authorization', `Bearer ${payerToken}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app).post(`/api/v1/settlements/${settlementId}/confirm`).expect(401);
    });
  });

  describe('POST /api/v1/settlements/:id/cancel', () => {
    it('should cancel settlement as involved party', async () => {
      // Create new settlement to cancel
      const newSettlement = await request(app)
        .post('/api/v1/settlements')
        .set('Authorization', `Bearer ${payerToken}`)
        .send({
          amount: 30,
          payerId: payerId,
          payeeId: payeeId,
          groupId: groupId,
        });

      const response = await request(app)
        .post(`/api/v1/settlements/${newSettlement.body.data.settlement.id}/cancel`)
        .set('Authorization', `Bearer ${payerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settlement.status).toBe('cancelled');
    });

    it('should not allow cancelling confirmed settlement', async () => {
      await request(app)
        .post(`/api/v1/settlements/${settlementId}/cancel`)
        .set('Authorization', `Bearer ${payerToken}`)
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app).post(`/api/v1/settlements/${settlementId}/cancel`).expect(401);
    });
  });

  describe('DELETE /api/v1/settlements/:id', () => {
    it('should delete settlement as involved party', async () => {
      // Create temporary settlement to delete
      const tempSettlement = await request(app)
        .post('/api/v1/settlements')
        .set('Authorization', `Bearer ${payerToken}`)
        .send({
          amount: 20,
          payerId: payerId,
          payeeId: payeeId,
          groupId: groupId,
        });

      const response = await request(app)
        .delete(`/api/v1/settlements/${tempSettlement.body.data.settlement.id}`)
        .set('Authorization', `Bearer ${payerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });

    it('should not allow deleting confirmed settlement', async () => {
      await request(app)
        .delete(`/api/v1/settlements/${settlementId}`)
        .set('Authorization', `Bearer ${payerToken}`)
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app).delete(`/api/v1/settlements/${settlementId}`).expect(401);
    });
  });

  describe('GET /api/v1/groups/:groupId/settlements/suggestions', () => {
    it('should calculate suggested settlements', async () => {
      const response = await request(app)
        .get(`/api/v1/groups/${groupId}/settlements/suggestions`)
        .set('Authorization', `Bearer ${payerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestions).toBeDefined();
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);

      // Since we have an unbalanced expense, should have suggestions
      if (response.body.data.suggestions.length > 0) {
        const suggestion = response.body.data.suggestions[0];
        expect(suggestion.payerId).toBeDefined();
        expect(suggestion.payerName).toBeDefined();
        expect(suggestion.payeeId).toBeDefined();
        expect(suggestion.payeeName).toBeDefined();
        expect(suggestion.amount).toBeDefined();
      }
    });

    it('should not allow non-members to view suggestions', async () => {
      await request(app)
        .get(`/api/v1/groups/${groupId}/settlements/suggestions`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app).get(`/api/v1/groups/${groupId}/settlements/suggestions`).expect(401);
    });
  });
});
