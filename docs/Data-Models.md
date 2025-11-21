# Data Models & Database Schema

## Overview

This document defines the complete data model for SplitTab, including database schemas, relationships, validation rules, and migration strategies.

**Version**: 1.0
**Last Updated**: 2025-11-21
**Database**: PostgreSQL 15+

---

## Schema Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│    Users    │────────<│ Group Members│>────────│   Groups    │
└─────────────┘         └──────────────┘         └─────────────┘
       │                                                  │
       │                                                  │
       │  ┌──────────────────────────────────────────────┘
       │  │
       │  │              ┌─────────────┐
       │  └──────────────│  Expenses   │
       │                 └─────────────┘
       │                        │
       │                        │
       │         ┌──────────────┴──────────────┐
       │         │                             │
       │  ┌──────────────────┐         ┌──────────────┐
       └──│Expense           │         │  Receipts    │
          │Participants      │         └──────────────┘
          └──────────────────┘
       │
       │         ┌──────────────┐
       └─────────│ Settlements  │
                 └──────────────┘
```

---

## Core Tables

### Users

Stores user account information and preferences.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255), -- NULL for OAuth users
  name VARCHAR(100) NOT NULL,
  profile_picture_url TEXT,
  phone_number VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,

  -- Preferences
  default_currency CHAR(3) DEFAULT 'USD',
  timezone VARCHAR(50) DEFAULT 'UTC',
  language CHAR(2) DEFAULT 'en',

  -- OAuth
  google_id VARCHAR(255),
  apple_id VARCHAR(255),

  -- Security
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(32),

  -- Metadata
  last_login_at TIMESTAMP,
  last_login_ip INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP -- Soft delete
);

-- Indexes
CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE UNIQUE INDEX idx_users_apple_id ON users(apple_id) WHERE apple_id IS NOT NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

**Validation Rules**:
- `email`: Valid email format, lowercase
- `password_hash`: bcrypt hash, cost factor 12
- `name`: 1-100 characters, no special chars
- `default_currency`: ISO 4217 currency code
- `timezone`: IANA timezone identifier
- `language`: ISO 639-1 language code

---

### Groups

Represents a group of users sharing expenses.

```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  group_type VARCHAR(20) DEFAULT 'other',
  image_url TEXT,

  -- Settings
  default_currency CHAR(3) DEFAULT 'USD',
  simplify_debts BOOLEAN DEFAULT TRUE,
  require_expense_approval BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP -- Soft delete
);

-- Indexes
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_groups_created_at ON groups(created_at DESC);
CREATE INDEX idx_groups_type ON groups(group_type);
```

**Group Types**:
- `friends`: Friend group
- `trip`: Travel/trip group
- `home`: Household/roommates
- `couple`: Two-person relationship
- `event`: Event/party
- `project`: Project/team
- `other`: General group

**Validation Rules**:
- `name`: 1-100 characters
- `group_type`: Must be one of valid types
- `default_currency`: ISO 4217 currency code

---

### Group Members

Join table for user-group relationships with roles.

```sql
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',

  -- Metadata
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP, -- NULL if still a member
  invited_by UUID REFERENCES users(id),

  UNIQUE(group_id, user_id)
);

-- Indexes
CREATE INDEX idx_group_members_group ON group_members(group_id) WHERE left_at IS NULL;
CREATE INDEX idx_group_members_user ON group_members(user_id) WHERE left_at IS NULL;
CREATE INDEX idx_group_members_joined_at ON group_members(joined_at DESC);
```

**Roles**:
- `admin`: Full permissions
- `member`: Standard permissions
- `viewer`: Read-only access

**Business Rules**:
- Group must have at least one admin
- When last admin leaves, promote another member
- Cannot remove self if last admin

---

### Expenses

Stores expense details.

```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL, -- NULL for personal expenses

  -- Expense details
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  description VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  notes TEXT,

  -- Dates
  date DATE NOT NULL,

  -- Metadata
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP, -- Soft delete
  deleted_by UUID REFERENCES users(id),

  -- Split details (JSONB for flexibility)
  split_method VARCHAR(20) DEFAULT 'equal', -- equal, exact, percentage, shares, item
  split_data JSONB, -- Method-specific data

  -- Recurring expense link
  recurring_expense_id UUID REFERENCES recurring_expenses(id),

  -- Trip link (Phase 3)
  trip_id UUID REFERENCES trips(id)
);

-- Indexes
CREATE INDEX idx_expenses_group ON expenses(group_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_created_by ON expenses(created_by);
CREATE INDEX idx_expenses_date ON expenses(date DESC);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_created_at ON expenses(created_at DESC);
CREATE INDEX idx_expenses_trip ON expenses(trip_id) WHERE trip_id IS NOT NULL;
```

**Categories** (Predefined):
- `food_dining`: Food & Dining
- `groceries`: Groceries
- `transportation`: Transportation
- `entertainment`: Entertainment
- `utilities`: Utilities
- `rent`: Rent & Mortgage
- `shopping`: Shopping
- `healthcare`: Healthcare
- `travel`: Travel
- `other`: Other

**Split Methods**:
- `equal`: Split equally among participants
- `exact`: Exact amounts specified
- `percentage`: Percentage-based split
- `shares`: Share/ratio-based split
- `item`: Itemized split

**Validation Rules**:
- `amount`: > 0, max 999,999.99
- `currency`: ISO 4217 code
- `description`: 1-200 characters
- `date`: Cannot be more than 1 year in future

---

### Expense Participants

Links users to expenses with their share details.

```sql
CREATE TABLE expense_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),

  -- Financial details
  paid_amount DECIMAL(15, 2) DEFAULT 0 CHECK (paid_amount >= 0),
  owed_amount DECIMAL(15, 2) DEFAULT 0 CHECK (owed_amount >= 0),

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(expense_id, user_id)
);

-- Indexes
CREATE INDEX idx_expense_participants_expense ON expense_participants(expense_id);
CREATE INDEX idx_expense_participants_user ON expense_participants(user_id);
CREATE INDEX idx_expense_participants_user_expense ON expense_participants(user_id, expense_id);
```

**Business Rules**:
- `paid_amount`: What this user paid towards the expense
- `owed_amount`: What this user owes for the expense
- Net contribution: `paid_amount - owed_amount`
- Sum of all `paid_amount` must equal expense `amount`
- Sum of all `owed_amount` must equal expense `amount`

**Example**:
```
Expense: $100 dinner, Alice paid
- Alice: paid_amount = 100, owed_amount = 50 (net: +50)
- Bob: paid_amount = 0, owed_amount = 50 (net: -50)
```

---

### Settlements

Records payments between users.

```sql
CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL, -- NULL for non-group settlements

  -- Payment details
  payer_id UUID NOT NULL REFERENCES users(id),
  payee_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',

  -- Payment info
  payment_method VARCHAR(50), -- cash, bank_transfer, venmo, paypal, etc.
  reference_number VARCHAR(100),
  notes TEXT,

  -- Confirmation
  confirmed BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMP,
  confirmed_by UUID REFERENCES users(id),

  -- Dates
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP, -- Soft delete

  -- Payment provider details (Phase 2)
  payment_provider VARCHAR(50), -- stripe, paypal, venmo
  payment_provider_id VARCHAR(255),
  payment_status VARCHAR(20), -- initiated, processing, completed, failed

  CHECK (payer_id != payee_id)
);

-- Indexes
CREATE INDEX idx_settlements_payer ON settlements(payer_id);
CREATE INDEX idx_settlements_payee ON settlements(payee_id);
CREATE INDEX idx_settlements_group ON settlements(group_id);
CREATE INDEX idx_settlements_date ON settlements(date DESC);
CREATE INDEX idx_settlements_created_at ON settlements(created_at DESC);
CREATE INDEX idx_settlements_confirmed ON settlements(confirmed);
```

**Payment Methods**:
- `cash`: Cash payment
- `bank_transfer`: Bank transfer
- `venmo`: Venmo
- `paypal`: PayPal
- `zelle`: Zelle
- `cash_app`: Cash App
- `stripe`: Stripe (in-app)
- `other`: Other

**Validation Rules**:
- `amount`: > 0, max 999,999.99
- `payer_id` ≠ `payee_id`
- `date`: Cannot be in future

---

### Receipts

Stores receipt images and OCR data.

```sql
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,

  -- File details
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_name VARCHAR(255),
  file_type VARCHAR(50), -- image/jpeg, image/png, application/pdf
  file_size INTEGER, -- bytes

  -- OCR details
  ocr_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  ocr_data JSONB, -- Extracted data
  ocr_confidence DECIMAL(5, 2), -- 0-100
  ocr_error TEXT,

  -- Metadata
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_receipts_expense ON receipts(expense_id);
CREATE INDEX idx_receipts_uploaded_by ON receipts(uploaded_by);
CREATE INDEX idx_receipts_ocr_status ON receipts(ocr_status);
CREATE INDEX idx_receipts_created_at ON receipts(created_at DESC);
```

**OCR Data Structure** (JSONB):
```json
{
  "total": 45.67,
  "subtotal": 42.00,
  "tax": 3.15,
  "tip": 0.52,
  "merchant_name": "Restaurant ABC",
  "merchant_address": "123 Main St",
  "date": "2025-11-21",
  "time": "18:30",
  "items": [
    {
      "name": "Burger",
      "quantity": 2,
      "price": 15.00
    },
    {
      "name": "Fries",
      "quantity": 1,
      "price": 5.00
    }
  ],
  "payment_method": "VISA *1234"
}
```

---

### Notifications

Stores notification history.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Notification details
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,

  -- Related entities
  expense_id UUID REFERENCES expenses(id),
  settlement_id UUID REFERENCES settlements(id),
  group_id UUID REFERENCES groups(id),

  -- Delivery
  channels VARCHAR(50)[], -- ['push', 'email', 'in_app']
  delivered_at TIMESTAMP,

  -- User interaction
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  clicked BOOLEAN DEFAULT FALSE,
  clicked_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '30 days'
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);
```

**Notification Types**:
- `expense_created`
- `expense_updated`
- `expense_deleted`
- `settlement_created`
- `settlement_confirmed`
- `payment_reminder`
- `group_invitation`
- `member_joined`
- `member_left`

---

### Sessions

Stores user sessions and refresh tokens.

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Token details
  refresh_token VARCHAR(255) NOT NULL UNIQUE,
  device_name VARCHAR(100),
  device_type VARCHAR(20), -- ios, web, android
  user_agent TEXT,
  ip_address INET,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_revoked ON sessions(revoked);
```

---

## Phase 2 Tables

### Recurring Expenses

Defines recurring expense templates.

```sql
CREATE TABLE recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,

  -- Expense template
  amount DECIMAL(15, 2),
  amount_varies BOOLEAN DEFAULT FALSE,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  description VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  notes TEXT,

  -- Recurrence settings
  frequency VARCHAR(20) NOT NULL, -- daily, weekly, monthly, yearly, custom
  interval INTEGER DEFAULT 1, -- Every X days/weeks/months
  day_of_week INTEGER, -- 0-6 for weekly (0 = Sunday)
  day_of_month INTEGER, -- 1-31 for monthly

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE, -- NULL for never-ending
  max_occurrences INTEGER, -- NULL for unlimited
  occurrences_created INTEGER DEFAULT 0,

  -- Payer rotation
  rotate_payer BOOLEAN DEFAULT FALSE,
  payer_rotation JSONB, -- Array of user IDs in rotation order
  current_payer_index INTEGER DEFAULT 0,

  -- Split details
  split_method VARCHAR(20) DEFAULT 'equal',
  split_data JSONB,

  -- Status
  active BOOLEAN DEFAULT TRUE,
  paused BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_created_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_recurring_expenses_group ON recurring_expenses(group_id);
CREATE INDEX idx_recurring_expenses_active ON recurring_expenses(active, paused);
CREATE INDEX idx_recurring_expenses_next_due ON recurring_expenses(start_date)
  WHERE active = TRUE AND paused = FALSE;
```

---

### Comments

User comments on expenses.

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),

  -- Comment details
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id), -- For threading

  -- Mentions
  mentions UUID[], -- Array of mentioned user IDs

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  edited BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_comments_expense ON comments(expense_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
```

---

## Phase 3 Tables

### Trips

Trip planning and budgets.

```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  destination VARCHAR(200),
  image_url TEXT,

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Budget
  total_budget DECIMAL(15, 2),
  budget_currency CHAR(3) DEFAULT 'USD',
  budget_data JSONB, -- Category-wise budgets

  -- Status
  status VARCHAR(20) DEFAULT 'planning', -- planning, active, completed, archived

  -- Metadata
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CHECK (end_date >= start_date)
);

-- Indexes
CREATE INDEX idx_trips_created_by ON trips(created_by);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_dates ON trips(start_date, end_date);
```

### Trip Members

```sql
CREATE TABLE trip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(20) DEFAULT 'participant', -- organizer, participant

  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(trip_id, user_id)
);

-- Indexes
CREATE INDEX idx_trip_members_trip ON trip_members(trip_id);
CREATE INDEX idx_trip_members_user ON trip_members(user_id);
```

---

### Loans

Track loans between users.

```sql
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parties
  lender_id UUID NOT NULL REFERENCES users(id),
  borrower_id UUID NOT NULL REFERENCES users(id),

  -- Loan details
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  purpose TEXT,

  -- Interest
  interest_rate DECIMAL(5, 2) DEFAULT 0, -- Percentage
  interest_type VARCHAR(20), -- simple, compound

  -- Payment
  payment_schedule VARCHAR(20), -- one_time, installment
  installment_amount DECIMAL(15, 2),
  installment_frequency VARCHAR(20), -- weekly, monthly

  -- Dates
  date_borrowed DATE NOT NULL,
  date_due DATE,

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, paid, overdue
  amount_paid DECIMAL(15, 2) DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CHECK (lender_id != borrower_id)
);

-- Indexes
CREATE INDEX idx_loans_lender ON loans(lender_id);
CREATE INDEX idx_loans_borrower ON loans(borrower_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_due_date ON loans(date_due);
```

---

## Materialized Views

### Group Balances

Pre-computed balances for performance.

```sql
CREATE MATERIALIZED VIEW group_balances AS
SELECT
  group_id,
  user_id,
  SUM(paid_amount - owed_amount) as net_balance,
  SUM(paid_amount) as total_paid,
  SUM(owed_amount) as total_owed,
  COUNT(DISTINCT expense_id) as expense_count,
  MAX(e.created_at) as last_expense_at
FROM expense_participants ep
JOIN expenses e ON e.id = ep.expense_id
WHERE e.deleted_at IS NULL
GROUP BY group_id, user_id;

-- Indexes
CREATE UNIQUE INDEX idx_group_balances_group_user ON group_balances(group_id, user_id);
CREATE INDEX idx_group_balances_net ON group_balances(net_balance);

-- Refresh strategy: Every 5 minutes or on-demand
```

### User Balances

Pre-computed user-to-user balances.

```sql
CREATE MATERIALIZED VIEW user_balances AS
WITH all_balances AS (
  -- From expenses
  SELECT
    ep1.user_id as user1_id,
    ep2.user_id as user2_id,
    SUM(
      CASE
        WHEN ep1.paid_amount > ep1.owed_amount
        THEN (ep1.paid_amount - ep1.owed_amount) * (ep2.owed_amount / (SELECT SUM(owed_amount) FROM expense_participants WHERE expense_id = ep1.expense_id AND user_id != ep1.user_id))
        ELSE 0
      END
    ) as balance
  FROM expense_participants ep1
  JOIN expense_participants ep2 ON ep1.expense_id = ep2.expense_id AND ep1.user_id != ep2.user_id
  JOIN expenses e ON e.id = ep1.expense_id
  WHERE e.deleted_at IS NULL
  GROUP BY ep1.user_id, ep2.user_id

  UNION ALL

  -- From settlements (reduce balance)
  SELECT
    payee_id as user1_id,
    payer_id as user2_id,
    -SUM(amount) as balance
  FROM settlements
  WHERE deleted_at IS NULL AND confirmed = TRUE
  GROUP BY payee_id, payer_id
)
SELECT
  user1_id,
  user2_id,
  SUM(balance) as net_balance
FROM all_balances
GROUP BY user1_id, user2_id
HAVING SUM(balance) != 0;

-- Indexes
CREATE UNIQUE INDEX idx_user_balances_users ON user_balances(user1_id, user2_id);
CREATE INDEX idx_user_balances_user1 ON user_balances(user1_id);
CREATE INDEX idx_user_balances_user2 ON user_balances(user2_id);
```

---

## Data Validation Rules

### Application-Level Validations

```typescript
// User validation
const userSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  name: z.string().min(1).max(100),
  defaultCurrency: z.string().length(3).toUpperCase(),
  timezone: z.string().min(1),
});

// Expense validation
const expenseSchema = z.object({
  amount: z.number().positive().max(999999.99),
  currency: z.string().length(3).toUpperCase(),
  description: z.string().min(1).max(200),
  category: z.enum(['food_dining', 'groceries', /* ... */]),
  date: z.date().max(new Date()),
  groupId: z.string().uuid().optional(),
  splitMethod: z.enum(['equal', 'exact', 'percentage', 'shares', 'item']),
});

// Settlement validation
const settlementSchema = z.object({
  payerId: z.string().uuid(),
  payeeId: z.string().uuid(),
  amount: z.number().positive().max(999999.99),
  currency: z.string().length(3).toUpperCase(),
  paymentMethod: z.string().optional(),
  date: z.date().max(new Date()),
}).refine(data => data.payerId !== data.payeeId, {
  message: "Payer and payee must be different",
});
```

---

## Database Triggers

### Update Timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... (apply to all relevant tables)
```

### Expense Balance Validation

```sql
CREATE OR REPLACE FUNCTION validate_expense_balance()
RETURNS TRIGGER AS $$
DECLARE
  expense_amount DECIMAL;
  total_paid DECIMAL;
  total_owed DECIMAL;
BEGIN
  SELECT amount INTO expense_amount FROM expenses WHERE id = NEW.expense_id;

  SELECT SUM(paid_amount), SUM(owed_amount) INTO total_paid, total_owed
  FROM expense_participants WHERE expense_id = NEW.expense_id;

  IF total_paid != expense_amount THEN
    RAISE EXCEPTION 'Total paid (%) does not match expense amount (%)', total_paid, expense_amount;
  END IF;

  IF total_owed != expense_amount THEN
    RAISE EXCEPTION 'Total owed (%) does not match expense amount (%)', total_owed, expense_amount;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER check_expense_balance
  AFTER INSERT OR UPDATE ON expense_participants
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION validate_expense_balance();
```

---

## Migration Strategy

### Migration Tools
- **Primary**: Prisma Migrate
- **Alternative**: db-migrate or custom SQL scripts

### Migration Workflow

```bash
# Create migration
npx prisma migrate dev --name add_trips_table

# Apply migration (production)
npx prisma migrate deploy

# Rollback (manual SQL if needed)
```

### Sample Migration

```sql
-- Migration: 001_create_core_tables.sql
BEGIN;

-- Create users table
CREATE TABLE users (
  -- ... schema
);

-- Create groups table
CREATE TABLE groups (
  -- ... schema
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
-- ... more indexes

COMMIT;
```

### Data Migration (Existing Data)

```sql
-- Example: Add new column with default
ALTER TABLE expenses ADD COLUMN trip_id UUID REFERENCES trips(id);

-- Backfill data
UPDATE expenses SET trip_id = NULL WHERE trip_id IS NULL;

-- Add index
CREATE INDEX idx_expenses_trip ON expenses(trip_id) WHERE trip_id IS NOT NULL;
```

---

## Data Archival Strategy

### Archival Rules
- **Deleted Users**: Anonymize after 90 days
- **Old Expenses**: Archive expenses older than 2 years
- **Old Notifications**: Delete notifications older than 90 days
- **Old Sessions**: Delete expired sessions after 30 days

### Archival Process

```sql
-- Archive old expenses
CREATE TABLE expenses_archive (LIKE expenses INCLUDING ALL);

-- Move old expenses
INSERT INTO expenses_archive
SELECT * FROM expenses
WHERE created_at < CURRENT_DATE - INTERVAL '2 years'
  AND deleted_at IS NOT NULL;

-- Delete from main table
DELETE FROM expenses
WHERE id IN (SELECT id FROM expenses_archive);
```

---

## Performance Considerations

### Query Optimization

```sql
-- Use EXPLAIN ANALYZE for slow queries
EXPLAIN ANALYZE
SELECT * FROM expenses
WHERE group_id = 'xxx'
  AND deleted_at IS NULL
ORDER BY date DESC
LIMIT 20;

-- Add covering indexes
CREATE INDEX idx_expenses_group_date_cover
ON expenses(group_id, date DESC)
INCLUDE (amount, description, category)
WHERE deleted_at IS NULL;
```

### Partitioning (Future)

```sql
-- Partition expenses by date (when table grows large)
CREATE TABLE expenses (
  -- ... columns
) PARTITION BY RANGE (date);

CREATE TABLE expenses_2024 PARTITION OF expenses
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE expenses_2025 PARTITION OF expenses
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-21
**Status**: Draft
**Next Review**: Before Phase 1 implementation
