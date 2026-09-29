import { Link } from 'react-router-dom';
import type { MemberProfile } from '@/types/member.types';
import { LockGlyph } from './MemberTabBar';

/**
 * Why a destination is locked, in the server's own words (MemberProfile.standingNote), plus
 * the next step. Shown instead of the card / RSVP buttons for pending, expired and rejected
 * members — the destination stays visible and explains itself (CLAUDE.md).
 */
export default function StandingNote({ profile, what, onCardPage = false }: { profile: MemberProfile; what?: string; onCardPage?: boolean }) {
  if (profile.status === 'active') return null;
  const tone = profile.status === 'rejected' ? 'mp-note--danger' : 'mp-note--warn';
  return (
    <div className={`mp-note ${tone}`} role="note">
      <span className="mp-seal w-9 h-9" aria-hidden="true">
        <LockGlyph className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        {what && <p className="font-semibold">{what}</p>}
        <p className={what ? 'mp-muted mt-0.5' : ''}>
          {profile.standingNote ?? 'This is available to active members.'}
        </p>
        {profile.status === 'pending' ? (
          !onCardPage && <Link to="/dashboard/qr" className="mp-link inline-block mt-2 text-[0.875rem]">
            See what happens next
          </Link>
        ) : (
          <Link to="/contact" className="mp-link inline-block mt-2 text-[0.875rem]">
            Contact the Secretary
          </Link>
        )}
      </div>
    </div>
  );
}
