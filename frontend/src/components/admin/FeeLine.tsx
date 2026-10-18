import type { MemberProfile } from '@/types/member.types';
import { FEE_LABEL, FEE_TONE, feeBlockedReason, feeDetail } from '@/components/admin/fee';

/**
 * The fee standing of an application or an expired membership, with the reason when the Secretary
 * can't approve / renew yet. The server refuses it either way; this makes the refusal legible
 * before the button is pressed (CLAUDE.md: say why, don't just hide it).
 */
export default function FeeLine({ member }: { member: MemberProfile }) {
  if (!member.fee || (member.status !== 'pending' && member.status !== 'expired')) return null;
  const blocked = feeBlockedReason(member.fee);
  return (
    <div className="mt-1.5 space-y-1">
      <p className="text-[0.8125rem] flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={`mp-standing ${FEE_TONE[member.fee.state]}`}>{FEE_LABEL[member.fee.state]}</span>
        <span className="mp-muted">{feeDetail(member.fee)}</span>
      </p>
      {blocked && (
        <p id={`fee-block-${member.id}`} className="mp-muted text-[0.8125rem]">
          {blocked}
        </p>
      )}
    </div>
  );
}
