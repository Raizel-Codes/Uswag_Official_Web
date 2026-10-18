-- Membership fee tracking: which membership year a dues payment covers, and the applicant grace period.
ALTER TABLE "FinanceEntry" ADD COLUMN "academicYear" TEXT;
CREATE INDEX "FinanceEntry_relatedMemberId_idx" ON "FinanceEntry"("relatedMemberId");

ALTER TABLE "MemberProfile" ADD COLUMN "graceUntil" TIMESTAMP(3);
ALTER TABLE "MemberProfile" ADD COLUMN "expiryWarnedAt" TIMESTAMP(3);

-- Applications already waiting when the 7-day rule starts get a full week from now, so nobody is
-- removed on the first run for having applied before the rule existed.
UPDATE "MemberProfile" SET "graceUntil" = NOW() + INTERVAL '7 days' WHERE "status" = 'PENDING' AND "qrIssuedAt" IS NULL;
