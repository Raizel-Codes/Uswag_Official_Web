-- AlterTable
ALTER TABLE "User" ADD COLUMN "awaitingPasswordSetup" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "MemberProfile" ADD COLUMN "studentIdHash" TEXT;
ALTER TABLE "MemberProfile" ADD COLUMN "studentIdCiphertext" TEXT;
ALTER TABLE "MemberProfile" ADD COLUMN "submittedByProxy" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MemberProfile" ADD COLUMN "proxyName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MemberProfile_studentIdHash_key" ON "MemberProfile"("studentIdHash");
