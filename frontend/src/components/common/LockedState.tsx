import { Link } from 'react-router-dom';
import LockGlyph from '@/components/portal/LockGlyph';

interface LockedStateProps {
  title: string;
  description: string;
  /** Where the related (usually read-only) view lives, or who to contact. */
  redirectLabel?: string;
  /** Makes redirectLabel a link to that view. */
  to?: string;
}

// The "explained permission boundary" pattern (CLAUDE.md "Roles & permissions"): the
// destination stays visible, says plainly why it's out of scope for this role, and points to
// where the related view lives. Never silently hide a scope boundary. Rendered inside the
// portal shell, so it uses the portal's plate card + seal.
export default function LockedState({ title, description, redirectLabel, to }: LockedStateProps) {
  return (
    <div className="mp-card p-8 sm:p-10 text-center max-w-xl mx-auto" role="note">
      <span className="mp-seal w-14 h-14 mx-auto" aria-hidden="true">
        <LockGlyph className="w-6 h-6" />
      </span>
      <h2 className="mp-h3 mt-5" style={{ fontSize: '1.125rem' }}>{title}</h2>
      <p className="mp-muted mt-2 text-[0.9375rem] leading-relaxed max-w-[46ch] mx-auto">{description}</p>
      {redirectLabel &&
        (to ? (
          <Link to={to} className="mp-btn mp-btn--ghost mt-6">
            {redirectLabel}
          </Link>
        ) : (
          <p className="mp-eyebrow mt-6">{redirectLabel}</p>
        ))}
    </div>
  );
}
