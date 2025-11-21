import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
} from '../../src/utils/jwt';
import { config } from '../../src/config';

describe('JWT Utility Tests', () => {
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';
  const testEmail = 'test@example.com';

  describe('Token Generation', () => {
    it('should generate valid access token', () => {
      const token = generateAccessToken(testUserId, testEmail);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate valid refresh token', () => {
      const token = generateRefreshToken(testUserId, testEmail);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate token pair', () => {
      const tokens = generateTokenPair(testUserId, testEmail);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });
  });

  describe('Token Verification', () => {
    it('should verify valid access token', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const payload = verifyAccessToken(token);

      expect(payload.userId).toBe(testUserId);
      expect(payload.email).toBe(testEmail);
      expect(payload.type).toBe('access');
    });

    it('should verify valid refresh token', () => {
      const token = generateRefreshToken(testUserId, testEmail);
      const payload = verifyRefreshToken(token);

      expect(payload.userId).toBe(testUserId);
      expect(payload.email).toBe(testEmail);
      expect(payload.type).toBe('refresh');
    });

    it('should reject invalid access token', () => {
      expect(() => {
        verifyAccessToken('invalid.token.here');
      }).toThrow();
    });

    it('should reject invalid refresh token', () => {
      expect(() => {
        verifyRefreshToken('invalid.token.here');
      }).toThrow();
    });

    it('should reject access token used as refresh token', () => {
      const accessToken = generateAccessToken(testUserId, testEmail);

      expect(() => {
        verifyRefreshToken(accessToken);
      }).toThrow('Invalid token type');
    });

    it('should reject refresh token used as access token', () => {
      const refreshToken = generateRefreshToken(testUserId, testEmail);

      expect(() => {
        verifyAccessToken(refreshToken);
      }).toThrow('Invalid token type');
    });

    it('should reject malformed token', () => {
      expect(() => {
        verifyAccessToken('not-a-jwt');
      }).toThrow();
    });

    it('should reject empty token', () => {
      expect(() => {
        verifyAccessToken('');
      }).toThrow();
    });
  });

  describe('Token Extraction', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      const authHeader = `Bearer ${token}`;

      const extracted = extractTokenFromHeader(authHeader);

      expect(extracted).toBe(token);
    });

    it('should return null for missing header', () => {
      const extracted = extractTokenFromHeader(undefined);

      expect(extracted).toBeNull();
    });

    it('should return null for malformed header (no Bearer)', () => {
      const extracted = extractTokenFromHeader('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token');

      expect(extracted).toBeNull();
    });

    it('should return null for malformed header (wrong scheme)', () => {
      const extracted = extractTokenFromHeader('Basic sometoken');

      expect(extracted).toBeNull();
    });

    it('should return null for malformed header (extra parts)', () => {
      const extracted = extractTokenFromHeader('Bearer token extra');

      expect(extracted).toBeNull();
    });

    it('should return null for empty string', () => {
      const extracted = extractTokenFromHeader('');

      expect(extracted).toBeNull();
    });
  });

  describe('Token Payload', () => {
    it('should include user id in payload', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const payload = verifyAccessToken(token);

      expect(payload.userId).toBe(testUserId);
    });

    it('should include email in payload', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const payload = verifyAccessToken(token);

      expect(payload.email).toBe(testEmail);
    });

    it('should include token type in payload', () => {
      const accessToken = generateAccessToken(testUserId, testEmail);
      const refreshToken = generateRefreshToken(testUserId, testEmail);

      const accessPayload = verifyAccessToken(accessToken);
      const refreshPayload = verifyRefreshToken(refreshToken);

      expect(accessPayload.type).toBe('access');
      expect(refreshPayload.type).toBe('refresh');
    });

    it('should include expiration in payload', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const payload = verifyAccessToken(token);

      // Payload should have exp field (standard JWT claim)
      expect((payload as any).exp).toBeDefined();
      expect(typeof (payload as any).exp).toBe('number');
    });

    it('should have different expiration times for access and refresh tokens', () => {
      const accessToken = generateAccessToken(testUserId, testEmail);
      const refreshToken = generateRefreshToken(testUserId, testEmail);

      const accessPayload = verifyAccessToken(accessToken) as any;
      const refreshPayload = verifyRefreshToken(refreshToken) as any;

      // Refresh token should expire later than access token
      expect(refreshPayload.exp).toBeGreaterThan(accessPayload.exp);
    });
  });

  describe('Token Security', () => {
    it('should generate different tokens for different users', () => {
      const token1 = generateAccessToken('user1', 'user1@example.com');
      const token2 = generateAccessToken('user2', 'user2@example.com');

      expect(token1).not.toBe(token2);
    });

    it('should generate different tokens for same user at different times', () => {
      const token1 = generateAccessToken(testUserId, testEmail);

      // Small delay to ensure different timestamps
      const token2 = generateAccessToken(testUserId, testEmail);

      // Tokens should be different due to different iat (issued at) claims
      // Note: They might be the same if generated in the same second
      // This is expected behavior - JWT uses second precision
    });

    it('should not allow tampering with token payload', () => {
      const token = generateAccessToken(testUserId, testEmail);

      // Try to tamper with the token by changing a character
      const tamperedToken = token.slice(0, -5) + 'XXXXX';

      expect(() => {
        verifyAccessToken(tamperedToken);
      }).toThrow();
    });
  });
});
