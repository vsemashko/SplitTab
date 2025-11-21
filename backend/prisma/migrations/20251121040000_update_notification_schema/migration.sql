-- AlterTable: Update Notification schema
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "data" JSONB;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "actionUrl" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "priority" TEXT DEFAULT 'normal';
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "category" TEXT;

-- Drop old columns if they exist (safe approach)
ALTER TABLE "Notification" DROP COLUMN IF EXISTS "expenseId" CASCADE;
ALTER TABLE "Notification" DROP COLUMN IF EXISTS "settlementId" CASCADE;
ALTER TABLE "Notification" DROP COLUMN IF EXISTS "groupId" CASCADE;
ALTER TABLE "Notification" DROP COLUMN IF EXISTS "channels" CASCADE;
ALTER TABLE "Notification" DROP COLUMN IF EXISTS "deliveredAt" CASCADE;
ALTER TABLE "Notification" DROP COLUMN IF EXISTS "clicked" CASCADE;
ALTER TABLE "Notification" DROP COLUMN IF EXISTS "clickedAt" CASCADE;

-- Update expiresAt to be nullable
ALTER TABLE "Notification" ALTER COLUMN "expiresAt" DROP NOT NULL;
ALTER TABLE "Notification" ALTER COLUMN "expiresAt" DROP DEFAULT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS "Notification_type_idx" ON "Notification"("type");
CREATE INDEX IF NOT EXISTS "Notification_category_idx" ON "Notification"("category");
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_read_idx" ON "Notification"("read");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");
