import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import Logo from '@/components/common/Logo';
import type { MemberProfile } from '@/types/member.types';
import { STANDING_LABEL } from './standing';
import { LockGlyph } from './MemberTabBar';

/** Brand token → hex for the QR renderer (it can't take CSS variables). */
function token(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/**
 * The digital membership card: a Deep Forest vault plate with the signed QR in a Sage-framed
 * window. Without `qrValue` it renders face down (locked) — for pending / expired / rejected
 * members the server never issues a QR, so there is nothing to draw.
 */
export default function MembershipCard({ profile, qrValue, serialNumber }: { profile: MemberProfile; qrValue?: string; serialNumber?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const locked = !qrValue;

  useEffect(() => {
    if (!qrValue || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, qrValue, {
      width: 480, // drawn at 2x, displayed at up to 240px
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: token('--color-deep', '#142718'), light: '#ffffff' },
    });
  }, [qrValue]);

  return (
    <figure
      className={`mp-idcard mp-vault mp-vault--framed mp-on-dark ${locked ? 'mp-idcard--locked' : ''}`}
      aria-label={locked ? 'Membership card (not issued)' : `Membership card for ${profile.name}`}
    >
      <div className="relative flex items-center justify-between gap-3">
        <Logo variant="onDark" size={28} wordmarkFont="heading" />
        <span className={`mp-standing mp-standing--${profile.status}`} style={{ fontSize: '0.6875rem' }}>
          {STANDING_LABEL[profile.status]}
        </span>
      </div>

      <div className="relative mt-5">
        {locked ? (
          <div className="mp-idcard__qr flex-col gap-3 text-center">
            <span className="mp-seal w-14 h-14" aria-hidden="true">
              <LockGlyph className="w-6 h-6" />
            </span>
            <p className="text-[0.875rem] font-semibold text-mist px-6">
              {profile.status === 'expired' ? 'Card expired' : profile.status === 'rejected' ? 'No card issued' : 'Card not issued yet'}
            </p>
          </div>
        ) : (
          <div className="mp-idcard__qr">
            <canvas ref={canvasRef} role="img" aria-label="Your membership QR code" />
          </div>
        )}
      </div>

      <figcaption className="relative mt-5">
        <p className="font-heading font-semibold text-[1.25rem] leading-tight text-mist">{profile.name}</p>
        <p className="mp-muted text-[0.875rem] mt-1">
          {profile.collegeOrDept}
          {profile.yearLevel ? ` · ${profile.yearLevel}` : ''}
        </p>
        <div className="flex items-end justify-between gap-3 mt-4 pt-4 border-t border-[rgb(152_203_176/0.3)]">
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-sage">Serial</p>
            <p className="font-mono text-[0.875rem] text-mist mt-0.5">{serialNumber ?? '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-sage">Academic year</p>
            <p className="mp-num text-[0.9375rem] text-mist mt-0.5">{profile.academicYear.replace('-', '–')}</p>
          </div>
        </div>
      </figcaption>
    </figure>
  );
}
