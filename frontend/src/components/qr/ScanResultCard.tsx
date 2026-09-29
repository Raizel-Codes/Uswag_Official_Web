import type { ScanVerificationResponse } from '@/types/qr.types';
import { positionLabel } from '@/components/admin/positions';
import type { OfficerPosition } from '@/types/auth.types';

const CONFIG = {
  valid: { cls: 'ap-result--valid', mark: '✓' },
  invalid: { cls: 'ap-result--invalid', mark: '✕' },
  expired: { cls: 'ap-result--expired', mark: '!' },
} as const;

const MEMBER_LABEL = { valid: 'Valid · Checked in', invalid: 'Invalid', expired: 'Expired membership' } as const;
const MEMBER_BADGE = { valid: 'mp-standing--active', invalid: 'mp-standing--rejected', expired: 'mp-standing--expired' } as const;
// An officer's own ID reuses the same plate + tones, but never "expired" or "checked in" —
// checking an officer's ID isn't event attendance (see scan.controller.ts), and an officer
// account doesn't lapse the way a membership does.
const OFFICER_LABEL = { valid: 'Officer verified', invalid: 'Not a valid officer ID' } as const;
const OFFICER_BADGE = { valid: 'mp-standing--active', invalid: 'mp-standing--rejected' } as const;

/**
 * The valid / invalid / expired outcome of one scan, as a plate with the outcome's colour down
 * the left. Every state renders explicitly — never collapsed into a generic error — so the
 * officer at the door knows exactly what to tell the member. Renders inside the admin console.
 *
 * `mode` says which console mode produced this result (member-card scanning vs. an officer ID
 * check) — the caller always knows this, since it's the mode it was in when it scanned. The
 * response shape alone can't say: an `invalid` result has neither `member` nor `officer`
 * populated either way, so guessing from the payload would misattribute it.
 */
export default function ScanResultCard({ result, mode }: { result: ScanVerificationResponse; mode: 'event' | 'officer' }) {
  const cfg = CONFIG[result.status];

  if (mode === 'officer') {
    const status = result.status === 'expired' ? 'invalid' : result.status; // no "expired" concept for officer IDs
    return (
      <div className={`mp-card ap-result ${cfg.cls} p-5 flex items-center gap-4`}>
        <span className="mp-seal w-12 h-12 text-[1.125rem] font-bold" aria-hidden="true">{cfg.mark}</span>
        <div className="min-w-0 flex-1">
          <span className={`mp-standing ${OFFICER_BADGE[status]}`}>{OFFICER_LABEL[status]}</span>
          <p className="mp-h3 mt-2 truncate" style={{ fontSize: '1.125rem' }}>{result.officer?.name ?? 'Unrecognised officer ID'}</p>
          <p className="mp-muted text-[0.875rem] mt-0.5">
            {result.officer ? positionLabel(result.officer.officerPosition as OfficerPosition) : result.reason ?? 'Verification failed'}
            {' · '}
            {new Date(result.scannedAt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
      </div>
    );
  }

  const name = result.member?.name ?? 'Card not recognised';
  const sub = result.status === 'valid' ? result.member?.serialNumber : result.reason ?? 'Verification failed';

  return (
    <div className={`mp-card ap-result ${cfg.cls} p-5 flex items-center gap-4`}>
      <span className="mp-seal w-12 h-12 text-[1.125rem] font-bold" aria-hidden="true">{cfg.mark}</span>
      <div className="min-w-0 flex-1">
        <span className={`mp-standing ${MEMBER_BADGE[result.status]}`}>{MEMBER_LABEL[result.status]}</span>
        <p className="mp-h3 mt-2 truncate" style={{ fontSize: '1.125rem' }}>{name}</p>
        <p className="mp-muted text-[0.875rem] mt-0.5">
          {sub}
          {' · '}
          {new Date(result.scannedAt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
