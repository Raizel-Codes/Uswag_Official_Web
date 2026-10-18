// Creates (or resets) the site developer's account: a Super Admin that can see the whole site and
// change none of it (src/middlewares/auth.middleware.ts), is never listed as an officer, and can open
// the /dev console. Run it yourself, from the backend folder, against the database in .env:
//
//   PowerShell:  $env:DEV_EMAIL="you@example.com"; npm run dev:account
//   optional:    $env:DEV_NAME="Your Name"   $env:DEV_PASSWORD="a temporary password (8+ characters)"
//   remove it:   $env:DEV_EMAIL="you@example.com"; npm run dev:account -- --remove
//
// With no DEV_PASSWORD a random one is made and printed once. Either way it is only temporary: the
// account is flagged mustChangePassword, so the first login has to choose a new one before anything
// else works. Running it again for the same email resets the password and signs the account out
// everywhere. The password never goes in the code, the repo or the database in plain text.

import 'dotenv/config';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.DEV_EMAIL?.trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('Set DEV_EMAIL to the email you will sign in with.');

  const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
  if (existing && !existing.isDeveloper) throw new Error(`${email} already belongs to a regular account. Use a different email for the developer account.`);

  if (process.argv.includes('--remove')) {
    if (!existing) throw new Error(`No developer account for ${email}.`);
    await prisma.user.delete({ where: { id: existing.id } });
    console.log(`Removed the developer account ${email}.`);
    return;
  }

  const supplied = process.env.DEV_PASSWORD;
  if (supplied !== undefined && supplied.length < 8) throw new Error('DEV_PASSWORD must be at least 8 characters.');
  const password = supplied ?? crypto.randomBytes(12).toString('base64url');
  const passwordHash = await bcrypt.hash(password, 12);
  const name = process.env.DEV_NAME?.trim() || 'Site Developer';

  const data = {
    name,
    email,
    passwordHash,
    role: 'SUPER_ADMIN' as const,
    officerPosition: null,
    collegeOrDept: 'Developer',
    isDeveloper: true,
    mustChangePassword: true,
    awaitingPasswordSetup: false,
  };
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { ...data, tokenVersion: { increment: 1 } } });
  } else {
    await prisma.user.create({ data });
  }

  console.log(`${existing ? 'Reset' : 'Created'} the developer account: ${email}`);
  if (supplied === undefined) console.log(`Temporary password (shown once): ${password}`);
  console.log('Sign in, then choose your own password when asked. Then open /dev.');
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
