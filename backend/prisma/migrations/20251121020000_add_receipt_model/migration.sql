-- CreateTable: Receipt
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "ocrStatus" TEXT NOT NULL DEFAULT 'pending',
    "ocrProcessedAt" TIMESTAMP(3),
    "ocrConfidence" DOUBLE PRECISION,
    "ocrData" JSONB,
    "ocrError" TEXT,
    "merchantName" TEXT,
    "totalAmount" DECIMAL(15,2),
    "currency" CHAR(3),
    "receiptDate" TIMESTAMP(3),
    "tax" DECIMAL(15,2),
    "tip" DECIMAL(15,2),
    "subtotal" DECIMAL(15,2),
    "lineItems" JSONB,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Receipt_expenseId_idx" ON "Receipt"("expenseId");

-- CreateIndex
CREATE INDEX "Receipt_uploadedById_idx" ON "Receipt"("uploadedById");

-- CreateIndex
CREATE INDEX "Receipt_ocrStatus_idx" ON "Receipt"("ocrStatus");

-- CreateIndex
CREATE INDEX "Receipt_createdAt_idx" ON "Receipt"("createdAt");

-- CreateIndex
CREATE INDEX "Receipt_receiptDate_idx" ON "Receipt"("receiptDate");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Remove old receiptUrl column from Expense table (if exists)
-- This is replaced by the new Receipt table with proper OCR support
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Expense' AND column_name = 'receiptUrl'
    ) THEN
        ALTER TABLE "Expense" DROP COLUMN "receiptUrl";
    END IF;
END $$;
