// Seed script for local development. Run with: npx prisma db seed
// (add "prisma": { "seed": "tsx prisma/seed.ts" } to package.json once ready).
//
// Seed the President, VP, and one of each Officer Admin position so the
// officer-admin.html role-switching prototype has real accounts to log
// into during development, plus a handful of test members.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('devpassword123', 12);

  await prisma.user.create({
    data: {
      name: 'Miguel Castillo',
      email: 'miguel.castillo@nwssu.edu.ph',
      passwordHash,
      role: 'SUPER_ADMIN',
      officerPosition: 'PRESIDENT',
      collegeOrDept: 'BS Political Science',
    },
  });

  // Seed remaining officers
  const officers = [
    { name: 'Liza Ramos', email: 'liza.ramos@nwssu.edu.ph', role: 'OFFICER_ADMIN', officerPosition: 'VICE_PRESIDENT', collegeOrDept: 'BS Social Work' },
    { name: 'Nico Fernandez', email: 'nico.fernandez@nwssu.edu.ph', role: 'OFFICER_ADMIN', officerPosition: 'SECRETARY', collegeOrDept: 'BS Education' },
    { name: 'Patricia Sy', email: 'patricia.sy@nwssu.edu.ph', role: 'OFFICER_ADMIN', officerPosition: 'TREASURER', collegeOrDept: 'BS Accountancy' },
    { name: 'Dennis Villar', email: 'dennis.villar@nwssu.edu.ph', role: 'OFFICER_ADMIN', officerPosition: 'AUDITOR', collegeOrDept: 'BS Accountancy' },
    { name: 'Elton Mercado', email: 'elton.mercado@nwssu.edu.ph', role: 'OFFICER_ADMIN', officerPosition: 'BUSINESS_MANAGER', collegeOrDept: 'BS Accountancy' },
    { name: 'Grace Tolentino', email: 'grace.tolentino@nwssu.edu.ph', role: 'OFFICER_ADMIN', officerPosition: 'PRO', collegeOrDept: 'College of Business' },
  ];

  for (const officer of officers) {
    await prisma.user.create({
      data: {
        ...officer,
        passwordHash,
        role: officer.role as any,
        officerPosition: officer.officerPosition as any,
      },
    });
  }

  // Seed members with MemberProfile
  const members = [
    { name: 'Andrea Reyes', email: 'andrea.reyes@nwssu.edu.ph', collegeOrDept: 'BS Information Technology', status: 'ACTIVE', serialNumber: 'UW-2026-004821', avatarText: 'AR' },
    { name: 'Joseph Cabrera', email: 'joseph.cabrera@nwssu.edu.ph', collegeOrDept: 'BS Criminology', status: 'ACTIVE', serialNumber: 'UW-2026-004822', avatarText: 'JC' },
    { name: 'Jasmine Lopez', email: 'jasmine.lopez@nwssu.edu.ph', collegeOrDept: 'BS Education', status: 'PENDING', serialNumber: 'UW-PENDING-0001' },
    { name: 'Kyla Tan', email: 'kyla.tan@nwssu.edu.ph', collegeOrDept: 'BS Information Technology', status: 'ACTIVE', serialNumber: 'UW-2026-004823' },
    { name: 'Maricel Fajardo', email: 'maricel.fajardo@nwssu.edu.ph', collegeOrDept: 'BS Nursing', status: 'EXPIRED', serialNumber: 'UW-2025-003190' },
  ];

  for (const member of members) {
    await prisma.user.create({
      data: {
        name: member.name,
        email: member.email,
        passwordHash,
        role: 'MEMBER',
        collegeOrDept: member.collegeOrDept,
        memberProfile: {
          create: {
            status: member.status as any,
            serialNumber: member.serialNumber,
            academicYear: '2026-2027',
          }
        }
      },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
