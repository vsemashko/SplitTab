import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { authService } from '../../src/services/auth.service';

const prisma = new PrismaClient();

describe('Group API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let member2Token: string;
  let member2Id: string;
  let nonMemberToken: string;
  let nonMemberId: string;
  let groupId: string;

  beforeAll(async () => {
    await prisma.$connect();

    // Create test users
    const user1 = await authService.register({
      email: 'groupadmin@example.com',
      password: 'SecurePass123',
      name: 'Group Admin',
    });
    authToken = user1.tokens.accessToken;
    userId = user1.user.id;

    const user2 = await authService.register({
      email: 'groupmember@example.com',
      password: 'SecurePass123',
      name: 'Group Member',
    });
    member2Token = user2.tokens.accessToken;
    member2Id = user2.user.id;

    const user3 = await authService.register({
      email: 'nonmember@example.com',
      password: 'SecurePass123',
      name: 'Non Member',
    });
    nonMemberToken = user3.tokens.accessToken;
    nonMemberId = user3.user.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/groups', () => {
    it('should create a new group', async () => {
      const response = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Group',
          description: 'A test group',
          groupType: 'friends',
          defaultCurrency: 'USD',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.group.name).toBe('Test Group');
      expect(response.body.data.group.groupType).toBe('friends');
      expect(response.body.data.group.members).toBeDefined();
      expect(response.body.data.group.members.length).toBe(1);
      expect(response.body.data.group.members[0].role).toBe('admin');

      groupId = response.body.data.group.id;
    });

    it('should validate group data', async () => {
      await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Invalid: empty name
          groupType: 'friends',
        })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/v1/groups')
        .send({
          name: 'Test Group',
          groupType: 'friends',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/groups', () => {
    it('should get users groups', async () => {
      const response = await request(app)
        .get('/api/v1/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.groups)).toBe(true);
      expect(response.body.data.groups.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/v1/groups').expect(401);
    });
  });

  describe('GET /api/v1/groups/:id', () => {
    it('should get group details for members', async () => {
      const response = await request(app)
        .get(`/api/v1/groups/${groupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.group.id).toBe(groupId);
      expect(response.body.data.group.name).toBe('Test Group');
      expect(response.body.data.group.members).toBeDefined();
    });

    it('should not allow non-members to view group', async () => {
      await request(app)
        .get(`/api/v1/groups/${groupId}`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent group', async () => {
      await request(app)
        .get('/api/v1/groups/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app).get(`/api/v1/groups/${groupId}`).expect(401);
    });
  });

  describe('PUT /api/v1/groups/:id', () => {
    it('should update group as admin', async () => {
      const response = await request(app)
        .put(`/api/v1/groups/${groupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Group Name',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.group.name).toBe('Updated Group Name');
      expect(response.body.data.group.description).toBe('Updated description');
    });

    it('should require authentication', async () => {
      await request(app)
        .put(`/api/v1/groups/${groupId}`)
        .send({
          name: 'Hacked Name',
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/groups/:id/members', () => {
    it('should add member to group', async () => {
      const response = await request(app)
        .post(`/api/v1/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: member2Id,
          role: 'member',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.member.userId).toBe(member2Id);
      expect(response.body.data.member.role).toBe('member');
    });

    it('should not allow adding same member twice', async () => {
      await request(app)
        .post(`/api/v1/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: member2Id,
          role: 'member',
        })
        .expect(409);
    });

    it('should require userId', async () => {
      await request(app)
        .post(`/api/v1/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'member',
        })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app)
        .post(`/api/v1/groups/${groupId}/members`)
        .send({
          userId: nonMemberId,
          role: 'member',
        })
        .expect(401);
    });
  });

  describe('PATCH /api/v1/groups/:id/members/:userId/role', () => {
    it('should update member role as admin', async () => {
      const response = await request(app)
        .patch(`/api/v1/groups/${groupId}/members/${member2Id}/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'admin',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.member.role).toBe('admin');
    });

    it('should not allow demoting last admin', async () => {
      // First, demote member2 back to member
      await request(app)
        .patch(`/api/v1/groups/${groupId}/members/${member2Id}/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'member',
        })
        .expect(200);

      // Now try to demote the last admin (userId)
      await request(app)
        .patch(`/api/v1/groups/${groupId}/members/${userId}/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'member',
        })
        .expect(400);
    });

    it('should validate role', async () => {
      await request(app)
        .patch(`/api/v1/groups/${groupId}/members/${member2Id}/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'invalid-role',
        })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app)
        .patch(`/api/v1/groups/${groupId}/members/${member2Id}/role`)
        .send({
          role: 'admin',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/groups/:id/statistics', () => {
    it('should get group statistics for members', async () => {
      const response = await request(app)
        .get(`/api/v1/groups/${groupId}/statistics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toBeDefined();
      expect(response.body.data.statistics.totalExpenses).toBeDefined();
      expect(response.body.data.statistics.totalAmount).toBeDefined();
      expect(response.body.data.statistics.memberCount).toBeDefined();
      expect(response.body.data.statistics.settledAmount).toBeDefined();
      expect(response.body.data.statistics.pendingSettlements).toBeDefined();
    });

    it('should not allow non-members to view statistics', async () => {
      await request(app)
        .get(`/api/v1/groups/${groupId}/statistics`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app).get(`/api/v1/groups/${groupId}/statistics`).expect(401);
    });
  });

  describe('DELETE /api/v1/groups/:id/members/:userId', () => {
    it('should allow member to remove themselves', async () => {
      const response = await request(app)
        .delete(`/api/v1/groups/${groupId}/members/${member2Id}`)
        .set('Authorization', `Bearer ${member2Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removed');

      // Add them back for other tests
      await request(app)
        .post(`/api/v1/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: member2Id,
          role: 'member',
        });
    });

    it('should allow admin to remove other members', async () => {
      // Add non-member first
      await request(app)
        .post(`/api/v1/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: nonMemberId,
          role: 'member',
        });

      const response = await request(app)
        .delete(`/api/v1/groups/${groupId}/members/${nonMemberId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should not allow removing last admin', async () => {
      await request(app)
        .delete(`/api/v1/groups/${groupId}/members/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app).delete(`/api/v1/groups/${groupId}/members/${member2Id}`).expect(401);
    });
  });

  describe('DELETE /api/v1/groups/:id', () => {
    it('should delete group as admin', async () => {
      // Create a temporary group to delete
      const tempGroup = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Temp Group',
          groupType: 'friends',
        });

      const response = await request(app)
        .delete(`/api/v1/groups/${tempGroup.body.data.group.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });

    it('should require authentication', async () => {
      await request(app).delete(`/api/v1/groups/${groupId}`).expect(401);
    });
  });
});
