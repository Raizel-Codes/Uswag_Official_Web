interface EngravedRuleProps {
  /** 'double' = heavy-over-light printer's rule, used under mastheads. */
  weight?: 'single' | 'double';
  /** Colour comes from `currentColor`; pass a text-color class to override the default sepia. */
  className?: string;
  /** Draw outward from the center when scrolled into view (see useLandingReveal). */
  reveal?: boolean;
}

/** Hairline — diamond — hairline section ornament. Purely decorative. */
export default function EngravedRule({ weight = 'single', className = '', reveal = true }: EngravedRuleProps) {
  const line = weight === 'double' ? 'lp-rule__line lp-rule__line--double' : 'lp-rule__line';
  return (
    <div className={`lp-rule ${className}`} aria-hidden="true" data-lp-reveal={reveal ? 'rule' : undefined}>
      <span className={line} />
      <svg width="34" height="10" viewBox="0 0 34 10" fill="currentColor">
        <path d="M5 5 L8 2 L11 5 L8 8 Z" opacity="0.6" />
        <path d="M17 0.5 L21.5 5 L17 9.5 L12.5 5 Z" />
        <path d="M23 5 L26 2 L29 5 L26 8 Z" opacity="0.6" />
      </svg>
      <span className={line} />
    </div>
  );
}
