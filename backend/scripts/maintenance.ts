// Break-glass for the maintenance switch: flip it from your own machine, straight on the database in .env,
// without signing in. For when the site is down, or you can't sign in, and you need to reopen it (or close
// it). A running server notices within about 5 seconds.
//
//   npm run maintenance -- status
//   npm run maintenance -- on 90 Updating the database    (minutes, then an optional message; 60 if no minutes)
//   npm run maintenance -- on --force                     (skips the warning about scans in progress)
//   npm run maintenance -- off
//
// The change is recorded in the audit log under the developer account (if one exists), like the console's.

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // "[60]" is read as 60: square brackets in a usage line mean "optional", but they get typed.
  const [command, ...rest] = process.argv.slice(2).filter((a) => a !== '--force').map((a) => a.replace(/^[(.*)]$/, '$1'));
  const force = process.argv.includes('--force');
  const dev = await prisma.user.findFirst({ where: { isDeveloper: true }, select: { id: true } });
  const record = async (action: string, metadata: object) => {
    if (dev) await prisma.auditLogEntry.create({ data: { actorId: dev.id, action, targetType: 'Site', metadata: { ...metadata, via: 'script' } } });
  };
  const current = await prisma.siteMaintenance.findUnique({ where: { id: 1 } });

  if (command === 'status' || !command) {
    console.log(current?.enabled ? `Maintenance is ON since ${current.startedAt?.toISOString()}, estimated end ${current.endsAt?.toISOString()}.` : 'Maintenance is off.');
    return;
  }

  if (command === 'off') {
    if (!current?.enabled) return console.log('Maintenance is already off.');
    await prisma.siteMaintenance.update({ where: { id: 1 }, data: { enabled: false, startedAt: null, endsAt: null, message: null, setById: dev?.id ?? null } });
    await record('maintenance.off', { minutesOn: current.startedAt ? Math.round((Date.now() - current.startedAt.getTime()) / 60_000) : null });
    return console.log('Maintenance is OFF. The site reopens within a few seconds.');
  }

  if (command === 'on') {
    if (current?.enabled) throw new Error('Maintenance is already on. Turn it off first, or extend it from the /dev console.');
    const first = Number(rest[0]);
    const minutes = Number.isFinite(first) && rest[0] !== undefined ? Math.round(first) : 60;
    const message = (Number.isFinite(first) ? rest.slice(1) : rest).join(' ').replace(/\s+/g, ' ').trim().slice(0, 200) || null;
    if (minutes < 5 || minutes > 720) throw new Error('Choose between 5 and 720 minutes.');
    if (!force) {
      const scans = await prisma.attendanceRecord.count({ where: { scannedAt: { gt: new Date(Date.now() - 10 * 60_000) } } });
      if (scans > 0) throw new Error(`${scans} scan(s) in the last 10 minutes: an event may be running. Maintenance stops scanning for everyone. Add --force if you're sure.`);
    }
    const now = new Date();
    const endsAt = new Date(now.getTime() + minutes * 60_000);
    await prisma.siteMaintenance.upsert({
      where: { id: 1 },
      create: { id: 1, enabled: true, startedAt: now, endsAt, message, setById: dev?.id ?? null },
      update: { enabled: true, startedAt: now, endsAt, message, setById: dev?.id ?? null },
    });
    await record('maintenance.on', { minutes, endsAt: endsAt.toISOString(), message });
    return console.log(`Maintenance is ON for about ${minutes} minutes (until ${endsAt.toISOString()}). Turn it off with: npm run maintenance -- off`);
  }

  throw new Error('Use: status | on [minutes] [message] | off');
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
