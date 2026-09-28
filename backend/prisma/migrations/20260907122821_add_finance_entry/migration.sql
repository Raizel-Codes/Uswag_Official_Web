-- CreateTable
CREATE TABLE "FinanceEntry" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "relatedMemberId" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinanceEntry_recordedById_idx" ON "FinanceEntry"("recordedById");

-- CreateIndex
CREATE INDEX "FinanceEntry_createdAt_idx" ON "FinanceEntry"("createdAt");

-- AddForeignKey
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
