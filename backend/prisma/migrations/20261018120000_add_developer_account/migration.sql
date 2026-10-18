-- AlterTable: the site developer's view-only account, and "must choose a new password at next login".
ALTER TABLE "User" ADD COLUMN "isDeveloper" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
