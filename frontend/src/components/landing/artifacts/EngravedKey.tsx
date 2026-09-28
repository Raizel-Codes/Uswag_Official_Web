/**
 * An engraved skeleton key in Sage line-work — the password pages' emblem. Original drawing:
 * an ornate bow (quatrefoil ring around the crest shield), a collar, a shaft and a notched bit.
 * Decorative (aria-hidden); colour follows `currentColor`.
 */
export default function EngravedKey({ className = '' }: { className?: string }) {
  const lobes = [0, 90, 180, 270];
  return (
    <svg viewBox="0 0 360 140" className={className} fill="none" stroke="currentColor" aria-hidden="true">
      {/* Bow: quatrefoil of four rings */}
      <g strokeWidth="2.2">
        {lobes.map((a) => (
          <circle key={a} cx={70 + 20 * Math.cos((a * Math.PI) / 180)} cy={70 + 20 * Math.sin((a * Math.PI) / 180)} r="24" />
        ))}
      </g>
      <circle cx="70" cy="70" r="40" strokeWidth="1" opacity="0.6" />
      <circle cx="70" cy="70" r="15" strokeWidth="1.6" />
      {/* Crest shield at the centre of the bow */}
      <path d="M70 60 L79 63 L79 72 Q79 79 70 83 Q61 79 61 72 L61 63 Z" strokeWidth="1.6" strokeLinejoin="round" />
      {/* Collar */}
      <g strokeWidth="2">
        <rect x="112" y="60" width="10" height="20" rx="2" />
        <rect x="126" y="63" width="6" height="14" rx="1.5" />
      </g>
      {/* Shaft with engraved hatching */}
      <path d="M132 64 H300 M132 76 H300" strokeWidth="2.2" />
      <g strokeWidth="0.8" opacity="0.55">
        {Array.from({ length: 28 }, (_, i) => (
          <line key={i} x1={140 + i * 6} y1="65" x2={144 + i * 6} y2="75" />
        ))}
      </g>
      {/* Bit: notched ward */}
      <path d="M300 64 V58 H316 V70 H326 V58 H340 V102 H326 V92 H316 V102 H300 V76" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="306" cy="70" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
