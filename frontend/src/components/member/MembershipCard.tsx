import { useEffect, useRef, type PointerEvent } from 'react';
import QRCode from 'qrcode';
import crestOnDark from '@/assets/images/logo-uswag-on-dark.svg';
import { prefersReducedMotion } from '@/lib/motion';
import type { MemberProfile } from '@/types/member.types';
import { STANDING_LABEL } from './standing';
import LockGlyph from '@/components/portal/LockGlyph';

/** Brand token → hex for the QR renderer (it can't take CSS variables). */
function token(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const CHIP_LABEL: Record<MemberProfile['status'], string> = {
  active: 'Member',
  pending: 'Pending',
  expired: 'Expired',
  rejected: 'Not issued',
};

/**
 * The digital membership card, after the id_card_v2.html member tier (slant foil, hatched
 * texture, round QR medallion) in the brand palette. With `qrValue` it's live; without it the
 * medallion is face down — for pending / expired / rejected members the server never issues a
 * QR, so there is nothing to draw. On a mouse/trackpad the card tilts and the foil catches the
 * light; on touch and under reduced motion it stays still (a steady card scans best).
 */
export default function MembershipCard({ profile, qrValue, serialNumber }: { profile: MemberProfile; qrValue?: string; serialNumber?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const locked = !qrValue;

  useEffect(() => {
    if (!qrValue || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, qrValue, {
      width: 440, // drawn at ~2x its displayed size
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: token('--color-deep', '#142718'), light: token('--color-mist', '#E7EFE4') },
    });
  }, [qrValue]);

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    const el = cardRef.current;
    if (!el || e.pointerType !== 'mouse' || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width; // 0..1
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--ry', `${(x - 0.5) * 12}deg`);
    el.style.setProperty('--rx', `${(0.5 - y) * 10}deg`);
    el.style.setProperty('--mp-sheen', `${Math.round(x * 100)}%`);
  }
  function onPointerLeave() {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--rx', '0deg');
    el.style.removeProperty('--mp-sheen');
  }

  return (
    <div className="mp-idcard-stage">
      <figure
        ref={cardRef}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className={`mp-idcard ${locked ? 'mp-idcard--locked' : ''}`}
        aria-label={locked ? `USWAG membership card for ${profile.name}, not issued (${STANDING_LABEL[profile.status]})` : `USWAG membership card for ${profile.name}`}
      >
        <span className="mp-idcard__band mp-idcard__band--one" aria-hidden="true" />
        <span className="mp-idcard__band mp-idcard__band--two" aria-hidden="true" />
        <span className="mp-idcard__sheen" aria-hidden="true" />

        <div className="mp-idcard__top">
          <span className="mp-idcard__crest" aria-hidden="true">
            <img src={crestOnDark} alt="" />
          </span>
          <div className="mp-idcard__org">
            <p className="mp-idcard__org-name">USWAG</p>
            <p className="mp-idcard__org-sub">NwSSU · Main Campus</p>
          </div>
        </div>

        <div className="mp-idcard__seal">
          <span className={`mp-idcard__chip ${profile.status === 'active' ? '' : `mp-idcard__chip--${profile.status}`}`}>
            {CHIP_LABEL[profile.status]}
          </span>
          <div className="mp-idcard__medallion">
            {locked ? (
              <span className="grid place-items-center gap-2 text-center px-6">
                <LockGlyph className="w-[9cqw] h-[9cqw] text-sage" />
                <span className="text-[max(12px,3.5cqw)] font-semibold text-mist">
                  {profile.status === 'expired' ? 'Card expired' : profile.status === 'rejected' ? 'No card issued' : 'Not issued yet'}
                </span>
              </span>
            ) : (
              <canvas ref={canvasRef} role="img" aria-label="Membership QR code" />
            )}
          </div>
          <p className="mp-idcard__hint">{locked ? 'Issued once active' : 'Scan to verify'}</p>
        </div>

        <figcaption className="mp-idcard__bottom">
          <div className="mp-idcard__divider" aria-hidden="true" />
          <p className="mp-idcard__name">{profile.name}</p>
          <p className="mp-idcard__role">
            {profile.status === 'active' ? 'Active Member' : STANDING_LABEL[profile.status]}
            {profile.collegeOrDept ? ` · ${profile.collegeOrDept}` : ''}
          </p>
          <div className="mp-idcard__meta">
            <div>
              <p className="mp-idcard__meta-label">Member ID</p>
              <p className="mp-idcard__meta-value">{serialNumber ?? '—'}</p>
            </div>
            <div className="text-right">
              <p className="mp-idcard__meta-label">A.Y.</p>
              <p className="mp-idcard__meta-value">{profile.academicYear.replace('-', '–')}</p>
            </div>
          </div>
        </figcaption>
      </figure>
    </div>
  );
}
