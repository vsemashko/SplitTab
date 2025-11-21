import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, optionalAuthenticate, requireEmailVerification } from '../../src/middleware/auth';
import { validate, validateQuery, validateParams } from '../../src/middleware/validate';
import { errorHandler, ApiError } from '../../src/middleware/errorHandler';
import { generateAccessToken } from '../../src/utils/jwt';
import { z } from 'zod';

const prisma = new PrismaClient();

describe('Middleware Tests', () => {
  describe('Authentication Middleware', () => {
    let userId: string;
    let validToken: string;

    beforeAll(async () => {
      await prisma.$connect();

      // Create test user
      const user = await prisma.user.create({
        data: {
          email: 'middleware@example.com',
          passwordHash: 'hashedpassword',
          name: 'Middleware Test User',
          emailVerified: true,
        },
      });
      userId = user.id;
      validToken = generateAccessToken(userId, user.email);
    });

    afterAll(async () => {
      await prisma.user.deleteMany();
      await prisma.$disconnect();
    });

    describe('authenticate middleware', () => {
      it('should attach user to request with valid token', async () => {
        const req = {
          headers: {
            authorization: `Bearer ${validToken}`,
          },
        } as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await authenticate(req, res, next);

        expect(req.user).toBeDefined();
        expect(req.user?.userId).toBe(userId);
        expect(req.user?.email).toBe('middleware@example.com');
        expect(next).toHaveBeenCalled();
      });

      it('should reject request without authorization header', async () => {
        const req = {
          headers: {},
        } as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await authenticate(req, res, next);

        expect(req.user).toBeUndefined();
        expect(next).toHaveBeenCalledWith(expect.any(ApiError));
        expect((next as jest.Mock).mock.calls[0][0].message).toContain('No authentication token');
      });

      it('should reject request with invalid token', async () => {
        const req = {
          headers: {
            authorization: 'Bearer invalid.token.here',
          },
        } as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await authenticate(req, res, next);

        expect(req.user).toBeUndefined();
        expect(next).toHaveBeenCalledWith(expect.any(Error));
      });

      it('should reject request with malformed authorization header', async () => {
        const req = {
          headers: {
            authorization: 'NotBearer token',
          },
        } as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await authenticate(req, res, next);

        expect(req.user).toBeUndefined();
        expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      });

      it('should reject token for deleted user', async () => {
        // Create and delete a user
        const deletedUser = await prisma.user.create({
          data: {
            email: 'deleted@example.com',
            passwordHash: 'hashedpassword',
            name: 'Deleted User',
            deletedAt: new Date(),
          },
        });

        const deletedUserToken = generateAccessToken(deletedUser.id, deletedUser.email);

        const req = {
          headers: {
            authorization: `Bearer ${deletedUserToken}`,
          },
        } as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await authenticate(req, res, next);

        expect(req.user).toBeUndefined();
        expect(next).toHaveBeenCalledWith(expect.any(ApiError));
        expect((next as jest.Mock).mock.calls[0][0].message).toContain('not found');

        await prisma.user.delete({ where: { id: deletedUser.id } });
      });
    });

    describe('optionalAuthenticate middleware', () => {
      it('should attach user with valid token', async () => {
        const req = {
          headers: {
            authorization: `Bearer ${validToken}`,
          },
        } as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await optionalAuthenticate(req, res, next);

        expect(req.user).toBeDefined();
        expect(req.user?.userId).toBe(userId);
        expect(next).toHaveBeenCalled();
      });

      it('should not attach user without token but still call next', async () => {
        const req = {
          headers: {},
        } as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await optionalAuthenticate(req, res, next);

        expect(req.user).toBeUndefined();
        expect(next).toHaveBeenCalled();
        expect(next).not.toHaveBeenCalledWith(expect.any(Error));
      });

      it('should not attach user with invalid token but still call next', async () => {
        const req = {
          headers: {
            authorization: 'Bearer invalid.token.here',
          },
        } as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await optionalAuthenticate(req, res, next);

        expect(req.user).toBeUndefined();
        expect(next).toHaveBeenCalled();
        expect(next).not.toHaveBeenCalledWith(expect.any(Error));
      });
    });

    describe('requireEmailVerification middleware', () => {
      it('should allow verified users to proceed', async () => {
        const req = {
          user: { userId, email: 'middleware@example.com' },
        } as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await requireEmailVerification(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(next).not.toHaveBeenCalledWith(expect.any(Error));
      });

      it('should reject unverified users', async () => {
        // Create unverified user
        const unverifiedUser = await prisma.user.create({
          data: {
            email: 'unverified@example.com',
            passwordHash: 'hashedpassword',
            name: 'Unverified User',
            emailVerified: false,
          },
        });

        const req = {
          user: { userId: unverifiedUser.id, email: 'unverified@example.com' },
        } as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await requireEmailVerification(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ApiError));
        expect((next as jest.Mock).mock.calls[0][0].message).toContain('Email verification required');

        await prisma.user.delete({ where: { id: unverifiedUser.id } });
      });

      it('should reject if no user in request', async () => {
        const req = {} as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await requireEmailVerification(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      });
    });
  });

  describe('Validation Middleware', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      age: z.number().min(0),
    });

    describe('validate (body validation)', () => {
      it('should validate valid body data', async () => {
        const req = {
          body: { name: 'John', age: 25 },
        } as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        const middleware = validate(testSchema);
        await middleware(req, res, next);

        expect(req.body.name).toBe('John');
        expect(req.body.age).toBe(25);
        expect(next).toHaveBeenCalled();
        expect(next).not.toHaveBeenCalledWith(expect.any(Error));
      });

      it('should reject invalid body data', async () => {
        const req = {
          body: { name: '', age: -5 },
        } as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        const middleware = validate(testSchema);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ApiError));
        const error = (next as jest.Mock).mock.calls[0][0];
        expect(error.statusCode).toBe(400);
      });

      it('should reject missing required fields', async () => {
        const req = {
          body: { name: 'John' }, // Missing age
        } as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        const middleware = validate(testSchema);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      });

      it('should transform data according to schema', async () => {
        const emailSchema = z.object({
          email: z.string().email().toLowerCase(),
        });

        const req = {
          body: { email: 'TEST@EXAMPLE.COM' },
        } as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        const middleware = validate(emailSchema);
        await middleware(req, res, next);

        expect(req.body.email).toBe('test@example.com');
        expect(next).toHaveBeenCalled();
      });
    });

    describe('validateQuery (query validation)', () => {
      it('should validate valid query parameters', async () => {
        const querySchema = z.object({
          page: z.string().transform(Number),
          limit: z.string().transform(Number),
        });

        const req = {
          query: { page: '1', limit: '10' },
        } as any;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        const middleware = validateQuery(querySchema);
        await middleware(req, res, next);

        expect(req.query.page).toBe(1);
        expect(req.query.limit).toBe(10);
        expect(next).toHaveBeenCalled();
      });

      it('should reject invalid query parameters', async () => {
        const querySchema = z.object({
          page: z.string().transform(Number).refine((n) => n > 0),
        });

        const req = {
          query: { page: '-1' },
        } as any;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        const middleware = validateQuery(querySchema);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      });
    });

    describe('validateParams (params validation)', () => {
      it('should validate valid route parameters', async () => {
        const paramsSchema = z.object({
          id: z.string().uuid(),
        });

        const req = {
          params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        } as any;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        const middleware = validateParams(paramsSchema);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(next).not.toHaveBeenCalledWith(expect.any(Error));
      });

      it('should reject invalid route parameters', async () => {
        const paramsSchema = z.object({
          id: z.string().uuid(),
        });

        const req = {
          params: { id: 'not-a-uuid' },
        } as any;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        const middleware = validateParams(paramsSchema);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      });
    });
  });

  describe('Error Handler Middleware', () => {
    it('should handle ApiError with correct status code', () => {
      const error = new ApiError(404, 'Not found');
      const req = {} as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const next = jest.fn() as NextFunction;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not found',
      });
    });

    it('should handle generic errors with 500 status', () => {
      const error = new Error('Something went wrong');
      const req = {} as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const next = jest.fn() as NextFunction;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
      });
    });

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Dev error');
      const req = {} as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const next = jest.fn() as NextFunction;

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: expect.any(String),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Prod error');
      const req = {} as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const next = jest.fn() as NextFunction;

      errorHandler(error, req, res, next);

      expect(res.json).not.toHaveBeenCalledWith(
        expect.objectContaining({
          stack: expect.any(String),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });
});
