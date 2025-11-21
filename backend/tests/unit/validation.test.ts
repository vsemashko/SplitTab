import {
  createUserSchema,
  createGroupSchema,
  createExpenseSchema,
  createSettlementSchema,
  emailSchema,
  passwordSchema,
} from '../../src/types/validation';

describe('Validation Schemas', () => {
  describe('Email Schema', () => {
    it('should validate correct email', () => {
      const result = emailSchema.parse('test@example.com');
      expect(result).toBe('test@example.com');
    });

    it('should lowercase email', () => {
      const result = emailSchema.parse('TEST@EXAMPLE.COM');
      expect(result).toBe('test@example.com');
    });

    it('should reject invalid email', () => {
      expect(() => emailSchema.parse('invalid-email')).toThrow();
    });
  });

  describe('Password Schema', () => {
    it('should validate strong password', () => {
      const result = passwordSchema.parse('SecurePass123');
      expect(result).toBe('SecurePass123');
    });

    it('should reject short password', () => {
      expect(() => passwordSchema.parse('Short1')).toThrow('at least 8 characters');
    });

    it('should reject password without uppercase', () => {
      expect(() => passwordSchema.parse('lowercase123')).toThrow('uppercase letter');
    });

    it('should reject password without lowercase', () => {
      expect(() => passwordSchema.parse('UPPERCASE123')).toThrow('lowercase letter');
    });

    it('should reject password without number', () => {
      expect(() => passwordSchema.parse('NoNumbers')).toThrow('one number');
    });
  });

  describe('Create User Schema', () => {
    it('should validate valid user data', () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test User',
      };

      const result = createUserSchema.parse(userData);
      expect(result.email).toBe('test@example.com');
      expect(result.password).toBe('SecurePass123');
      expect(result.name).toBe('Test User');
    });

    it('should accept optional currency', () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test User',
        defaultCurrency: 'USD',
      };

      const result = createUserSchema.parse(userData);
      expect(result.defaultCurrency).toBe('USD');
    });

    it('should reject empty name', () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123',
        name: '',
      };

      expect(() => createUserSchema.parse(userData)).toThrow();
    });
  });

  describe('Create Group Schema', () => {
    it('should validate valid group data', () => {
      const groupData = {
        name: 'Test Group',
        groupType: 'friends',
      };

      const result = createGroupSchema.parse(groupData);
      expect(result.name).toBe('Test Group');
      expect(result.groupType).toBe('friends');
    });

    it('should reject invalid group type', () => {
      const groupData = {
        name: 'Test Group',
        groupType: 'invalid',
      };

      expect(() => createGroupSchema.parse(groupData)).toThrow();
    });

    it('should accept description', () => {
      const groupData = {
        name: 'Test Group',
        description: 'This is a test group',
      };

      const result = createGroupSchema.parse(groupData);
      expect(result.description).toBe('This is a test group');
    });
  });

  describe('Create Expense Schema', () => {
    it('should validate valid expense data', () => {
      const expenseData = {
        amount: 100,
        description: 'Test expense',
        category: 'food_dining',
        date: '2025-11-21',
        participants: [
          { userId: '123e4567-e89b-12d3-a456-426614174000', paidAmount: 100, owedAmount: 50 },
          { userId: '123e4567-e89b-12d3-a456-426614174001', paidAmount: 0, owedAmount: 50 },
        ],
      };

      const result = createExpenseSchema.parse(expenseData);
      expect(result.amount).toBe(100);
      expect(result.description).toBe('Test expense');
      expect(result.participants).toHaveLength(2);
    });

    it('should reject expense with mismatched paid amount', () => {
      const expenseData = {
        amount: 100,
        description: 'Test expense',
        category: 'food_dining',
        date: '2025-11-21',
        participants: [
          { userId: '123e4567-e89b-12d3-a456-426614174000', paidAmount: 90, owedAmount: 50 },
          { userId: '123e4567-e89b-12d3-a456-426614174001', paidAmount: 0, owedAmount: 50 },
        ],
      };

      expect(() => createExpenseSchema.parse(expenseData)).toThrow('Total paid');
    });

    it('should reject expense with mismatched owed amount', () => {
      const expenseData = {
        amount: 100,
        description: 'Test expense',
        category: 'food_dining',
        date: '2025-11-21',
        participants: [
          { userId: '123e4567-e89b-12d3-a456-426614174000', paidAmount: 100, owedAmount: 40 },
          { userId: '123e4567-e89b-12d3-a456-426614174001', paidAmount: 0, owedAmount: 40 },
        ],
      };

      expect(() => createExpenseSchema.parse(expenseData)).toThrow('Total owed');
    });

    it('should reject expense with no participants', () => {
      const expenseData = {
        amount: 100,
        description: 'Test expense',
        category: 'food_dining',
        date: '2025-11-21',
        participants: [],
      };

      expect(() => createExpenseSchema.parse(expenseData)).toThrow();
    });
  });

  describe('Create Settlement Schema', () => {
    it('should validate valid settlement data', () => {
      const settlementData = {
        payerId: '123e4567-e89b-12d3-a456-426614174000',
        payeeId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 50,
      };

      const result = createSettlementSchema.parse(settlementData);
      expect(result.payerId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.payeeId).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(result.amount).toBe(50);
    });

    it('should reject settlement with same payer and payee', () => {
      const settlementData = {
        payerId: '123e4567-e89b-12d3-a456-426614174000',
        payeeId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 50,
      };

      expect(() => createSettlementSchema.parse(settlementData)).toThrow('must be different');
    });

    it('should reject negative amount', () => {
      const settlementData = {
        payerId: '123e4567-e89b-12d3-a456-426614174000',
        payeeId: '123e4567-e89b-12d3-a456-426614174001',
        amount: -50,
      };

      expect(() => createSettlementSchema.parse(settlementData)).toThrow();
    });
  });
});
