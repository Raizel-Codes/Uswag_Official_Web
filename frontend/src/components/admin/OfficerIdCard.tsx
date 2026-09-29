import { useEffect, useId, useRef, type PointerEvent, type ReactNode } from 'react';
import QRCode from 'qrcode';
import crestOnDark from '@/assets/images/logo-uswag-on-dark.svg';
import { prefersReducedMotion } from '@/lib/motion';
import type { AuthUser, OfficerPosition } from '@/types/auth.types';
import { positionLabel } from './positions';
import { currentAcademicYear, officerIdLabel } from './format';

/** Brand token → hex for the QR renderer (it can't take CSS variables). */
function token(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/**
 * The rank seal's centre mark, one per position so the cards read as ranks at a glance. Drawn
 * in a 30-unit box centred on (0,0); the seal translates it below centre, under the arced label.
 * `filled` marks are solid, the rest are engraved outlines.
 */
const EMBLEM: Record<OfficerPosition, { filled?: boolean; pips: number; mark: ReactNode }> = {
  // Four-point star, three pips: the highest office (id_card_v2.html, officer tier)
  president: { filled: true, pips: 3, mark: <path d="M0,-15 L3.6,-3.6 L15,0 L3.6,3.6 L0,15 L-3.6,3.6 L-15,0 L-3.6,-3.6 Z" /> },
  // The same star, engraved rather than struck: second office
  vice_president: { pips: 2, mark: <path d="M0,-15 L3.6,-3.6 L15,0 L3.6,3.6 L0,15 L-3.6,3.6 L-15,0 L-3.6,-3.6 Z" /> },
  // Open book: minutes and the record
  secretary: {
    pips: 1,
    mark: (
      <>
        <path d="M-13,-8 C-7,-10 -2,-9 0,-6 C2,-9 7,-10 13,-8 L13,8 C7,6 2,7 0,9 C-2,7 -7,6 -13,8 Z" />
        <path d="M0,-6 L0,9" />
      </>
    ),
  },
  // Struck coin: the treasury
  treasurer: {
    pips: 1,
    mark: (
      <>
        <circle r="11" />
        <circle r="7" />
        <path d="M0,-3 L3,0 L0,3 L-3,0 Z" />
      </>
    ),
  },
  // Balance scale: oversight, not the field (Article VI)
  auditor: {
    pips: 1,
    mark: (
      <>
        <path d="M0,-11 L0,9 M-6,9 L6,9 M-11,-7 L11,-7" />
        <path d="M-11,-7 L-15,1 L-7,1 Z M11,-7 L7,1 L15,1 Z" />
      </>
    ),
  },
  // Briefcase: purchasing and suppliers
  business_manager: {
    pips: 1,
    mark: (
      <>
        <rect x="-12" y="-5" width="24" height="15" rx="2" />
        <path d="M-4,-5 L-4,-9 L4,-9 L4,-5 M-12,1 L12,1" />
      </>
    ),
  },
  // Broadcast rings: public relations
  pro: {
    pips: 1,
    mark: (
      <>
        <circle r="2.2" className="oc-seal__fill" />
        <path d="M-6,-6 A8.5,8.5 0 0,0 -6,6 M6,-6 A8.5,8.5 0 0,1 6,6 M-10.5,-10.5 A15,15 0 0,0 -10.5,10.5 M10.5,-10.5 A15,15 0 0,1 10.5,10.5" />
      </>
    ),
  },
};

// The seal's arc holds ~12 letters at full size; longer titles use their short form.
const SEAL_LABEL: Record<OfficerPosition, string> = {
  president: 'PRESIDENT',
  vice_president: 'VICE PRESIDENT',
  secretary: 'SECRETARY',
  treasurer: 'TREASURER',
  auditor: 'AUDITOR',
  business_manager: 'BUSINESS MGR.',
  pro: 'PUBLIC RELATIONS',
};

/**
 * An officer's own digital ID — the id_card_v2.html **officer** tier, built on its own .oc-card
 * styles (admin.css) rather than on the member card's .mp-idcard, so none of the member tier's
 * slant foil or round medallion can leak in: a double engraved frame over guilloché linework, a
 * struck rank seal per position, a square notched QR plate, and "Office of the ___" between
 * rule marks. Every officer position gets one, including the Auditor — this is identity, not
 * scan permission (see backend/src/services/qr.service.ts buildOfficerQrValue).
 */
export default function OfficerIdCard({ user, qrValue }: { user: AuthUser; qrValue?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const uid = useId().replace(/:/g, '');

  useEffect(() => {
    if (!qrValue || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, qrValue, {
      width: 440, // drawn at ~3x its displayed size
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: token('--color-deep', '#142718'), light: token('--color-mist', '#E7EFE4') },
    });
  }, [qrValue]);

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    const el = cardRef.current;
    if (!el || e.pointerType !== 'mouse' || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
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

  const pos = user.officerPosition ?? null;
  const emblem = pos ? EMBLEM[pos] : EMBLEM.vice_president;
  const sealLabel = pos ? SEAL_LABEL[pos] : 'OFFICER';
  const title = positionLabel(pos);
  // Rank pips under the emblem, kept symmetrical: one centred, two flanking, or all three.
  const centre = [46, 72, 1.6];
  const flank = [
    [38, 70, 1.2],
    [54, 70, 1.2],
  ];
  const pips = emblem.pips === 1 ? [centre] : emblem.pips === 2 ? flank : [centre, ...flank];

  return (
    <div className="oc-stage">
      <figure
        ref={cardRef}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className="oc-card"
        aria-label={`USWAG officer ID for ${user.name}, ${title}`}
      >
        <span className="oc-card__glow" aria-hidden="true" />
        <span className="oc-card__sheen" aria-hidden="true" />

        <div className="oc-card__top">
          <span className="oc-card__crest" aria-hidden="true">
            <img src={crestOnDark} alt="" />
          </span>
          <div className="text-right">
            <p className="oc-card__org">USWAG</p>
            <p className="oc-card__org-sub">NwSSU · Main Campus</p>
          </div>
        </div>

        <div className="oc-card__zone">
          <div className="oc-seal" aria-hidden="true">
            <svg viewBox="0 0 92 92">
              <defs>
                <radialGradient id={`ocSealFill-${uid}`} cx="35%" cy="30%" r="75%">
                  <stop offset="0%" className="oc-seal__stop-light" />
                  <stop offset="100%" className="oc-seal__stop-dark" />
                </radialGradient>
                <path id={`ocSealArc-${uid}`} d="M 15 46 A 31 31 0 0 1 77 46" fill="none" />
              </defs>
              <circle cx="46" cy="46" r="34" fill={`url(#ocSealFill-${uid})`} />
              <circle cx="46" cy="46" r="34" className="oc-seal__ring" />
              <text className={`oc-seal__label ${sealLabel.length > 11 ? 'oc-seal__label--long' : ''}`}>
                <textPath href={`#ocSealArc-${uid}`} startOffset="50%" textAnchor="middle">
                  {sealLabel}
                </textPath>
              </text>
              <g className={`oc-seal__emblem ${emblem.filled ? 'oc-seal__emblem--filled' : ''}`} transform="translate(46,55) scale(0.82)">
                {emblem.mark}
              </g>
              {pips.map(([cx, cy, r]) => (
                <circle key={cx} className="oc-seal__pip" cx={cx} cy={cy} r={r} />
              ))}
            </svg>
          </div>

          <div className="oc-card__qr">
            {qrValue ? (
              <canvas ref={canvasRef} role="img" aria-label="Officer identity QR code" />
            ) : (
              <span className="oc-card__qr-wait">Loading…</span>
            )}
          </div>
          <p className="oc-card__hint">Scan to verify</p>
        </div>

        <figcaption className="oc-card__bottom">
          <div className="oc-card__divider" aria-hidden="true" />
          <p className="oc-card__name">{user.name}</p>
          <p className="oc-card__title">Office of the {title}</p>
          <div className="oc-card__meta">
            <div>
              <p className="oc-card__meta-label">Officer ID</p>
              <p className="oc-card__meta-value">{officerIdLabel(user.id)}</p>
            </div>
            <div className="text-right">
              <p className="oc-card__meta-label">Term</p>
              <p className="oc-card__meta-value">{currentAcademicYear().replace('-', '–')}</p>
            </div>
          </div>
        </figcaption>
      </figure>
    </div>
  );
}
