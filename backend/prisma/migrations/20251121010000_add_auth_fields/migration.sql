-- Add OAuth fields
ALTER TABLE "User" ADD COLUMN "oauthProvider" TEXT;
ALTER TABLE "User" ADD COLUMN "oauthId" TEXT;

-- Add password reset fields
ALTER TABLE "User" ADD COLUMN "passwordResetToken" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordResetExpires" TIMESTAMP(3);

-- Add email verification fields
ALTER TABLE "User" ADD COLUMN "emailVerificationToken" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerificationExpires" TIMESTAMP(3);

-- Update Session table: rename refreshToken to token
ALTER TABLE "Session" RENAME COLUMN "refreshToken" TO "token";

-- Update Settlement table: replace confirmed with status
ALTER TABLE "Settlement" ADD COLUMN "status" TEXT DEFAULT 'pending';

-- Migrate existing confirmed data to status
UPDATE "Settlement" SET "status" = 'confirmed' WHERE "confirmed" = true;
UPDATE "Settlement" SET "status" = 'pending' WHERE "confirmed" = false OR "confirmed" IS NULL;

-- Drop old confirmed-related columns
ALTER TABLE "Settlement" DROP COLUMN "confirmed";
ALTER TABLE "Settlement" DROP COLUMN "confirmedAt";
ALTER TABLE "Settlement" DROP COLUMN "confirmedBy";

-- Update Expense table: add paidById and receiptUrl, change structure
ALTER TABLE "Expense" ADD COLUMN "paidById" TEXT;
ALTER TABLE "Expense" ADD COLUMN "receiptUrl" TEXT;

-- Migrate existing createdBy to paidById
UPDATE "Expense" SET "paidById" = "createdBy";

-- Drop old Expense columns
ALTER TABLE "Expense" DROP COLUMN "createdBy";
ALTER TABLE "Expense" DROP COLUMN "deletedBy";
ALTER TABLE "Expense" DROP COLUMN "splitData";

-- Add foreign key for Expense.paidById
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Update indexes on Settlement (drop confirmed index, add status index)
DROP INDEX IF EXISTS "Settlement_confirmed_idx";
CREATE INDEX "Settlement_status_idx" ON "Settlement"("status");

-- Update indexes on Expense (change createdBy to paidById)
DROP INDEX IF EXISTS "Expense_createdBy_idx";
CREATE INDEX "Expense_paidById_idx" ON "Expense"("paidById");

-- Make paidById NOT NULL (after migration)
ALTER TABLE "Expense" ALTER COLUMN "paidById" SET NOT NULL;
