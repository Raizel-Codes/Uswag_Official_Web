-- CreateTable: the membership fee over time, so the Treasurer can change it without a redeploy
-- (see services/fee.service.ts). With no rows the starting fee in config/fee.ts applies.
CREATE TABLE "MembershipFeeRate" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "setById" TEXT,

    CONSTRAINT "MembershipFeeRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MembershipFeeRate_effectiveFrom_idx" ON "MembershipFeeRate"("effectiveFrom");
