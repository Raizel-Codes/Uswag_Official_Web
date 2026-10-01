-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetIdMatched" BOOLEAN,
ADD COLUMN     "passwordResetRequestedAt" TIMESTAMP(3);
