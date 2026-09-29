import { forwardRef, useId } from 'react';

/**
 * The Secretary's post door: an engraved arched doorway with a Deep Forest door leaf,
 * a brass letter plate and a sliding bolt. Pure illustration (aria-hidden); the leaf,
 * bolt and mouth are exposed by class so ApplicationDropbox can animate and measure them:
 * - .lp-door__leaf   swings open on its left hinge (rotateY)
 * - .lp-door__bolt   slides across once the door is shut
 * - .lp-door__mouth  the doorway opening an envelope travels into
 * Coordinates: viewBox 200 × 280; the doorway is x 30–170, y 30–265.
 */
const MailDoor = forwardRef<HTMLDivElement, { className?: string }>(function MailDoor({ className = '' }, ref) {
  const uid = useId().replace(/:/g, '');
  const ARCH = 'M30 265 V100 A70 70 0 0 1 170 100 V265 Z';

  return (
    <div ref={ref} className={`lp-door ${className}`} aria-hidden="true">
      {/* Frame + the dark doorway behind the leaf */}
      <svg viewBox="0 0 200 280" className="lp-door__frame">
        <defs>
          <radialGradient id={`mouth-${uid}`} cx="50%" cy="62%" r="70%">
            <stop offset="0" stopColor="var(--color-primary)" stopOpacity="0.55" />
            <stop offset="0.6" stopColor="var(--color-deep)" />
            <stop offset="1" stopColor="var(--lp-doorway)" />
          </radialGradient>
        </defs>
        {/* Stone surround with engraved double rule */}
        <path d="M12 272 V100 A88 88 0 0 1 188 100 V272 Z" fill="var(--lp-parchment-deep)" />
        <path d="M12 272 V100 A88 88 0 0 1 188 100 V272" fill="none" stroke="var(--lp-sepia-ink)" strokeOpacity="0.55" strokeWidth="1.4" />
        <path d="M20 268 V100 A80 80 0 0 1 180 100 V268" fill="none" stroke="var(--lp-sepia-ink)" strokeOpacity="0.35" strokeWidth="0.8" />
        {/* Keystone */}
        <path d="M91 10 H109 L106 30 H94 Z" fill="var(--lp-parchment)" stroke="var(--lp-sepia-ink)" strokeOpacity="0.55" strokeWidth="1" />
        <path d="M100 15 v10" stroke="var(--lp-sepia-ink)" strokeOpacity="0.4" strokeWidth="0.8" />
        {/* Doorway */}
        <path d={ARCH} fill={`url(#mouth-${uid})`} />
        {/* Threshold step */}
        <rect x="4" y="265" width="192" height="12" rx="1" fill="var(--lp-parchment)" stroke="var(--lp-sepia-ink)" strokeOpacity="0.5" strokeWidth="1" />
        <path d="M10 271 H190" stroke="var(--lp-sepia-ink)" strokeOpacity="0.25" strokeWidth="0.8" />
      </svg>

      <div className="lp-door__mouth" />

      {/* The leaf, exactly covering the doorway */}
      <div className="lp-door__leaf">
        <svg viewBox="30 30 140 235" preserveAspectRatio="none" className="w-full h-full block">
          <defs>
            <linearGradient id={`leaf-${uid}`} x1="0" y1="0" x2="1" y2="0.3">
              <stop offset="0" stopColor="var(--color-deep)" />
              <stop offset="0.55" stopColor="var(--color-primary)" />
              <stop offset="1" stopColor="var(--color-deep)" />
            </linearGradient>
          </defs>
          <path d={ARCH} fill={`url(#leaf-${uid})`} />
          <path d={ARCH} fill="none" stroke="var(--color-sage)" strokeOpacity="0.5" strokeWidth="1.2" />
          {/* Engraved panels */}
          <g fill="none" stroke="var(--color-sage)" strokeOpacity="0.45" strokeWidth="0.9">
            <path d="M44 128 V102 A56 56 0 0 1 156 102 V128 Z" />
            <path d="M48 124 V103 A52 52 0 0 1 152 103 V124 Z" strokeOpacity="0.25" />
            <rect x="44" y="190" width="112" height="62" />
            <rect x="48" y="194" width="104" height="54" strokeOpacity="0.25" />
          </g>
          {/* Brass letter plate with slot */}
          <rect x="56" y="146" width="88" height="30" rx="2" fill="var(--color-sage)" fillOpacity="0.9" />
          <rect x="58.5" y="148.5" width="83" height="25" rx="1.5" fill="none" stroke="var(--color-deep)" strokeOpacity="0.45" strokeWidth="0.8" />
          <rect x="66" y="163" width="68" height="5" rx="2.5" fill="var(--color-deep)" />
          <text x="100" y="159" textAnchor="middle" fontSize="7" letterSpacing="2.2" fill="var(--color-deep)" fontFamily="Lora, serif" fontWeight="600">
            LETTERS
          </text>
          {/* Hinges */}
          <g fill="var(--color-sage)" fillOpacity="0.7">
            <rect x="30" y="112" width="9" height="4" />
            <rect x="30" y="226" width="9" height="4" />
          </g>
          {/* Knob */}
          <circle cx="152" cy="178" r="5" fill="var(--color-sage)" />
          <circle cx="150.5" cy="176.5" r="1.6" fill="var(--color-mist)" opacity="0.6" />
        </svg>
      </div>

      {/* Bolt: housed in the frame's right jamb, slides over the leaf edge to lock */}
      <div className="lp-door__bolt" />
    </div>
  );
});

export default MailDoor;
