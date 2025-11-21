import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ApiError } from '../middleware/errorHandler';

export interface JwtPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate access token
 */
export function generateAccessToken(userId: string, email: string): string {
  if (!config.jwt.accessSecret) {
    throw new ApiError(500, 'JWT access secret not configured');
  }

  const payload: JwtPayload = {
    userId,
    email,
    type: 'access',
  };

  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry as string,
  } as jwt.SignOptions);
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId: string, email: string): string {
  if (!config.jwt.refreshSecret) {
    throw new ApiError(500, 'JWT refresh secret not configured');
  }

  const payload: JwtPayload = {
    userId,
    email,
    type: 'refresh',
  };

  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry as string,
  } as jwt.SignOptions);
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(userId: string, email: string): TokenPair {
  return {
    accessToken: generateAccessToken(userId, email),
    refreshToken: generateRefreshToken(userId, email),
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JwtPayload {
  if (!config.jwt.accessSecret) {
    throw new ApiError(500, 'JWT access secret not configured');
  }

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;

    if (decoded.type !== 'access') {
      throw new ApiError(401, 'Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, 'Access token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, 'Invalid access token');
    }
    throw error;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JwtPayload {
  if (!config.jwt.refreshSecret) {
    throw new ApiError(500, 'JWT refresh secret not configured');
  }

  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;

    if (decoded.type !== 'refresh') {
      throw new ApiError(401, 'Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, 'Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, 'Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Decode token without verification (useful for debugging)
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}
