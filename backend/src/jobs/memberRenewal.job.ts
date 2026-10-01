import cron from 'node-cron';
import { prisma } from '../config/db.js';
import { currentAcademicYear } from '../utils/academicYear.js';
import { logger } from '../utils/logger.js';

// Article III §3: membership is valid for one academic year. Once a member's year has ended this
// marks them EXPIRED, which switches off their digital card, event sign-ups and QR check-in until
// the Secretary renews them (POST /members/:memberId/renew).
//
// The server doesn't depend on this job to be correct: qr.service.ts and the member endpoints use
// effectiveStatus() (utils/academicYear.ts), which treats a lapsed membership as expired even
// before this has run. The job keeps the stored status — and the counts the officers see — in step.
// Like the Facebook sync it needs a persistent process, so it can't run on serverless.

let isRunning = false;

/** ACTIVE members whose academic year has ended, or whose own expiry date has passed. Read-only. */
export function findLapsedMembers(now: Date = new Date()) {
  return prisma.memberProfile.findMany({
    where: {
      status: 'ACTIVE',
      OR: [{ expiresAt: { lte: now } }, { academicYear: { lt: currentAcademicYear(now) } }],
    },
    select: { id: true, academicYear: true },
  });
}

/** Marks every lapsed member EXPIRED. Safe to run any time and as often as you like. */
export async function runMemberRenewal(now: Date = new Date()) {
  if (isRunning) return { expired: 0 };
  isRunning = true;
  try {
    const lapsed = await findLapsedMembers(now);
    if (lapsed.length === 0) return { expired: 0 };
    // Re-check the status in the update itself so a member the Secretary renewed in the meantime
    // isn't expired by a stale list.
    const { count } = await prisma.memberProfile.updateMany({
      where: { id: { in: lapsed.map((m) => m.id) }, status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    });
    // There is no acting user for an automatic change, and the audit log needs one, so the record
    // of who was expired lives in the server log.
    const years = [...new Set(lapsed.map((m) => m.academicYear))].sort().join(', ');
    logger.info(`Membership renewal: expired ${count} member(s) from academic year ${years} (current: ${currentAcademicYear(now)})`);
    return { expired: count };
  } catch (err) {
    logger.error('Membership renewal job failed', err);
    return { expired: 0 };
  } finally {
    isRunning = false;
  }
}

// Once on boot, so a restart after the year rolls over (or any downtime) catches up straight away,
// then every day just after midnight Manila time. Idempotent, so running twice is harmless.
export function startMemberRenewalJob() {
  void runMemberRenewal();
  cron.schedule('10 0 * * *', () => void runMemberRenewal(), { timezone: 'Asia/Manila' });
}
