import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';
import { ApiError } from './errorHandler';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new ApiError(401, 'No authentication token provided');
    }

    // Verify token
    const payload = verifyAccessToken(token);

    // Verify user still exists and is not deleted
    const user = await prisma.user.findUnique({
      where: { id: payload.userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new ApiError(401, 'User not found or has been deleted');
    }

    // Attach user to request
    req.user = {
      userId: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is provided, but doesn't require it
 */
export const optionalAuthenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const payload = verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId, deletedAt: null },
        select: {
          id: true,
          email: true,
        },
      });

      if (user) {
        req.user = {
          userId: user.id,
          email: user.email,
        };
      }
    }

    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

/**
 * Require email verification middleware
 * Must be used after authenticate middleware
 */
export const requireEmailVerification = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        emailVerified: true,
      },
    });

    if (!user?.emailVerified) {
      throw new ApiError(403, 'Email verification required');
    }

    next();
  } catch (error) {
    next(error);
  }
};
