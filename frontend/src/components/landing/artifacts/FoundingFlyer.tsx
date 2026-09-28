import { deckleClipPath } from './deckle';
import EngravedCrest from './EngravedCrest';

const CLIP = deckleClipPath(1987, 0.9, 24);

interface FoundingFlyerProps {
  foundedYear: number;
  className?: string;
}

/**
 * A founding-era recruitment flyer in letterpress style: double-rule border, engraved crest,
 * stacked wood-type lines. Decorative — its wording restates the three constitutional mandates
 * (Art. II) that the Origin section already presents as real text.
 */
export default function FoundingFlyer({ foundedYear, className = '' }: FoundingFlyerProps) {
  return (
    <div className={`lp-paper-shadow ${className}`} aria-hidden="true">
      <div className="lp-paper p-3" style={{ clipPath: CLIP }}>
        <div className="lp-flyer px-5 py-7 sm:px-7 text-center">
          <p className="lp-eyebrow lp-ink-secondary">Calling all students</p>
          <EngravedCrest size={88} className="mx-auto my-4" />
          <p className="font-display font-semibold uppercase leading-[0.95] tracking-[0.06em]" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.1rem)' }}>
            Join
            <br />
            USWAG
          </p>
          <p className="lp-dateline mt-2 lp-ink-secondary" style={{ fontSize: '0.9375rem' }}>
            United Students Working
            <br />
            for Advocacy and Growth
          </p>
          <div className="my-5 flex items-center justify-center gap-2 lp-ink-caption">
            <span className="h-px w-8 bg-current" />
            <span className="text-[0.75rem]">◆</span>
            <span className="h-px w-8 bg-current" />
          </div>
          <ul className="space-y-1.5 font-display font-medium uppercase tracking-[0.14em] text-[0.8125rem]">
            <li>Youth Voice</li>
            <li>Mental Health &amp; Wellness</li>
            <li>Environmental Leadership</li>
          </ul>
          <div className="lp-clipping__rule mt-6 mb-3" />
          <p className="lp-eyebrow lp-onum lp-ink-secondary">NwSSU · Calbayog City · {foundedYear}</p>
        </div>
      </div>
    </div>
  );
}
