import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { authService } from '../../src/services/auth.service';

const prisma = new PrismaClient();

describe('User API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let otherUserId: string;
  let otherAuthToken: string;

  beforeAll(async () => {
    await prisma.$connect();

    // Create test users
    const user1 = await authService.register({
      email: 'userapi@example.com',
      password: 'SecurePass123',
      name: 'User API Test',
    });
    authToken = user1.tokens.accessToken;
    userId = user1.user.id;

    const user2 = await authService.register({
      email: 'otheruser@example.com',
      password: 'SecurePass123',
      name: 'Other User',
    });
    otherAuthToken = user2.tokens.accessToken;
    otherUserId = user2.user.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /api/v1/users/:id', () => {
    it('should get user by id', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(userId);
      expect(response.body.data.user.email).toBe('userapi@example.com');
      expect(response.body.data.user.name).toBe('User API Test');
    });

    it('should require authentication', async () => {
      await request(app).get(`/api/v1/users/${userId}`).expect(401);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('should update own profile', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          phoneNumber: '+1234567890',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe('Updated Name');
      expect(response.body.data.user.phoneNumber).toBe('+1234567890');
    });

    it('should not allow updating other users profile', async () => {
      await request(app)
        .put(`/api/v1/users/${otherUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Hacker Name',
        })
        .expect(403);
    });

    it('should validate update data', async () => {
      await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Invalid: empty name
        })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app)
        .put(`/api/v1/users/${userId}`)
        .send({
          name: 'Updated Name',
        })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should not allow deleting other users account', async () => {
      await request(app)
        .delete(`/api/v1/users/${otherUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should delete own account', async () => {
      // Create a temporary user to delete
      const tempUser = await authService.register({
        email: 'deleteme@example.com',
        password: 'SecurePass123',
        name: 'Delete Me',
      });

      const response = await request(app)
        .delete(`/api/v1/users/${tempUser.user.id}`)
        .set('Authorization', `Bearer ${tempUser.tokens.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify user is soft deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: tempUser.user.id },
      });
      expect(deletedUser?.deletedAt).not.toBeNull();
    });

    it('should require authentication', async () => {
      await request(app).delete(`/api/v1/users/${userId}`).expect(401);
    });
  });

  describe('GET /api/v1/users/:id/balance', () => {
    it('should get user balance', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${userId}/balance`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBeDefined();
      expect(response.body.data.balance.totalOwed).toBeDefined();
      expect(response.body.data.balance.totalOwedToMe).toBeDefined();
      expect(response.body.data.balance.netBalance).toBeDefined();
      expect(response.body.data.balance.byGroup).toBeDefined();
      expect(Array.isArray(response.body.data.balance.byGroup)).toBe(true);
    });

    it('should not allow viewing other users balance', async () => {
      await request(app)
        .get(`/api/v1/users/${otherUserId}/balance`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app).get(`/api/v1/users/${userId}/balance`).expect(401);
    });
  });

  describe('GET /api/v1/users/search', () => {
    it('should search users by name', async () => {
      const response = await request(app)
        .get('/api/v1/users/search')
        .query({ q: 'User API' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);
      expect(response.body.data.users[0].name).toContain('User API');
    });

    it('should search users by email', async () => {
      const response = await request(app)
        .get('/api/v1/users/search')
        .query({ q: 'userapi@' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);
    });

    it('should limit search results', async () => {
      const response = await request(app)
        .get('/api/v1/users/search')
        .query({ q: 'user', limit: 5 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.users.length).toBeLessThanOrEqual(5);
    });

    it('should require search query', async () => {
      await request(app)
        .get('/api/v1/users/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/v1/users/search').query({ q: 'test' }).expect(401);
    });
  });
});
