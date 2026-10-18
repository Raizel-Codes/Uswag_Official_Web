import cron from 'node-cron';
import { prisma } from '../config/db.js';
import { APPLICANT_DAYS, APPLICANT_WARNING_DAYS, PARTIAL_PAYMENT_MONTHS } from '../config/fee.js';
import { applicantDeadline, addDays, feeFor, getMembershipFee, isApplicant, isServingOfficer } from '../services/fee.service.js';
import { getMaintenance } from '../services/maintenance.service.js';
import { notifyUsers } from '../services/notification.service.js';
import { logger } from '../utils/logger.js';

// The two consequences of not paying the membership fee (see services/fee.service.ts):
//
//  1. A member who paid only part and let PARTIAL_PAYMENT_MONTHS pass without paying the rest goes
//     back to PENDING. Nothing is deleted: their record, attendance and the payments stay, and once
//     the balance is recorded the Secretary can approve them again.
//  2. An application nobody has paid for is removed APPLICANT_DAYS after it was made, so the sign-up
//     form can't pile up locked accounts. The person is told APPLICANT_WARNING_DAYS before, and the
//     Treasurer can give more time. Only someone who was NEVER approved and has NO payment recorded
//     is ever removed; a member, an officer, or anyone with a payment is not.
//
// Like the renewal job it is safe to run any time and as often as you like, runs once at boot (a
// sleeping free-tier server catches up on wake-up) and then every day after midnight Manila time.
// An automatic action has no acting user and the audit log needs one, so the record of who was
// removed or returned to pending lives in the server log.

let isRunning = false;
let lastRunAt: string | null = null;
let lastResult: { reverted: number; removed: number; warned: number } | null = null;
let lastError: string | null = null;

export function getFeeEnforcementStatus() {
  return { lastRunAt, lastResult, lastError, isRunning };
}

export async function runFeeEnforcement(now: Date = new Date()) {
  const result = { reverted: 0, removed: 0, warned: 0 };
  if (isRunning) return result;
  // Not while the site is in maintenance: a deploy may be mid-migration. The next run catches up.
  if ((await getMaintenance()).enabled) return result;
  isRunning = true;
  try {
    // 1. Part-payers whose time ran out.
    const active = await prisma.memberProfile.findMany({
      where: { status: 'ACTIVE', user: { isDeveloper: false } },
      select: { id: true, status: true, academicYear: true, joinedAt: true, qrIssuedAt: true, graceUntil: true, userId: true, user: { select: { name: true, role: true, officerPosition: true, isDeveloper: true } } },
    });
    const fees = await feeFor(active, now);
    const overdue = active.filter((p) => fees.get(p.id)?.state === 'overdue' && !isServingOfficer(p.user));
    if (overdue.length > 0) {
      const { count } = await prisma.memberProfile.updateMany({ where: { id: { in: overdue.map((p) => p.id) }, status: 'ACTIVE' }, data: { status: 'PENDING' } });
      result.reverted = count;
      logger.info(`Fee enforcement: returned ${count} member(s) to pending for an unpaid balance: ${overdue.map((p) => p.user.name).join(', ')}`);
      void notifyUsers(overdue.map((p) => p.userId), {
        kind: 'membership',
        title: 'Your membership is pending again',
        body: `The remaining balance wasn’t paid within ${PARTIAL_PAYMENT_MONTHS} months. Pay it to the Treasurer and the Secretary can approve you again.`,
        url: '/dashboard',
      });
    }

    // 2. Applications nobody paid for. "Nobody paid" = no dues entry of any kind linked to the account.
    const applicants = await prisma.memberProfile.findMany({
      where: { status: 'PENDING', qrIssuedAt: null, user: { isDeveloper: false, role: 'MEMBER', officerPosition: null } },
      select: { id: true, status: true, academicYear: true, joinedAt: true, qrIssuedAt: true, graceUntil: true, expiryWarnedAt: true, userId: true, user: { select: { name: true } } },
    });
    const paidIds = new Set(
      (await prisma.financeEntry.findMany({ where: { type: 'DUES', relatedMemberId: { in: applicants.map((a) => a.id) } }, select: { relatedMemberId: true } })).map((e) => e.relatedMemberId),
    );
    const warnFrom = (a: (typeof applicants)[number]) => addDays(applicantDeadline(a), -APPLICANT_WARNING_DAYS);
    const toRemove = applicants.filter((a) => isApplicant(a) && !paidIds.has(a.id) && applicantDeadline(a) <= now);
    const toWarn = applicants.filter((a) => !paidIds.has(a.id) && !a.expiryWarnedAt && applicantDeadline(a) > now && warnFrom(a) <= now);

    for (const a of toRemove) {
      // Re-check inside the transaction: a payment recorded a second ago must win over this stale list.
      const gone = await prisma.$transaction(async (tx) => {
        const payments = await tx.financeEntry.count({ where: { type: 'DUES', relatedMemberId: a.id } });
        const fresh = await tx.memberProfile.findUnique({ where: { id: a.id }, select: { status: true, qrIssuedAt: true, graceUntil: true, joinedAt: true } });
        if (payments > 0 || !fresh || fresh.status !== 'PENDING' || fresh.qrIssuedAt !== null || applicantDeadline(fresh) > now) return false;
        await tx.user.delete({ where: { id: a.userId } }); // the profile, notifications and push subscriptions go with it
        return true;
      });
      if (gone) {
        result.removed++;
        logger.info(`Fee enforcement: removed the unpaid application of ${a.user.name} (made ${a.joinedAt.toISOString()}, ${APPLICANT_DAYS} days with no payment recorded)`);
      }
    }

    if (toWarn.length > 0) {
      const { amount: currentFee } = await getMembershipFee(now);
      await prisma.memberProfile.updateMany({ where: { id: { in: toWarn.map((a) => a.id) } }, data: { expiryWarnedAt: now } });
      result.warned = toWarn.length;
      for (const a of toWarn) {
        void notifyUsers([a.userId], {
          kind: 'membership',
          title: 'Pay the membership fee to keep your application',
          body: `Your application is removed on ${applicantDeadline(a).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', timeZone: 'Asia/Manila' })} unless the ₱${currentFee} membership fee is paid to the Treasurer. You can apply again later.`,
          url: '/dashboard',
        });
      }
    }

    lastRunAt = new Date().toISOString();
    lastResult = result;
    lastError = null;
    return result;
  } catch (err) {
    lastRunAt = new Date().toISOString();
    lastError = err instanceof Error ? err.message : 'Fee enforcement failed';
    logger.error('Fee enforcement job failed', err);
    return result;
  } finally {
    isRunning = false;
  }
}

export function startFeeEnforcementJob() {
  void runFeeEnforcement();
  cron.schedule('20 0 * * *', () => void runFeeEnforcement(), { timezone: 'Asia/Manila' });
}
