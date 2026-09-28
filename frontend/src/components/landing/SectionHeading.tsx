import type { ReactNode } from 'react';
import EngravedRule from './ornaments/EngravedRule';

interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  /** 'past' = sepia labels on parchment; 'present' = Primary on Mist; 'dark' = Sage/Mist on Deep Forest. */
  tone?: 'past' | 'present' | 'dark';
  align?: 'left' | 'center';
  className?: string;
}

/** The catalogue-entry opener used by every section: eyebrow → heading → engraved rule → lead. */
export default function SectionHeading({ id, eyebrow, title, lead, tone = 'present', align = 'left', className = '' }: SectionHeadingProps) {
  const eyebrowCls = tone === 'past' ? 'lp-ink-caption' : tone === 'dark' ? 'text-sage' : 'text-primary';
  const ruleCls = tone === 'past' ? '' : tone === 'dark' ? 'text-sage' : 'text-primary';
  const leadCls = tone === 'past' ? 'lp-ink-secondary' : tone === 'dark' ? 'text-mist/80' : 'lp-ink-muted';
  const center = align === 'center';

  return (
    <div className={`${center ? 'text-center mx-auto' : ''} max-w-[680px] ${className}`}>
      <p className={`lp-eyebrow ${eyebrowCls}`} data-lp-reveal>
        {eyebrow}
      </p>
      <h2 id={id} className={`lp-h2 mt-4 ${tone === 'dark' ? 'text-mist' : ''}`} data-lp-reveal>
        {title}
      </h2>
      <EngravedRule className={`mt-6 max-w-[220px] ${center ? 'mx-auto' : ''} ${ruleCls}`} />
      {lead && (
        <p className={`lp-body mt-6 ${leadCls} ${center ? 'mx-auto' : ''}`} data-lp-reveal>
          {lead}
        </p>
      )}
    </div>
  );
}
