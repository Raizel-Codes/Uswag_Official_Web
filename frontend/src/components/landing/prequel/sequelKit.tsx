import type { CSSProperties, ReactNode } from 'react';

/*
  Part Two's props: a phone and a browser window, drawn in composition pixels in the brand
  tokens. They are illustrations of what the site does — every line on them is generic
  ("A new announcement from your officers"), never an invented event, date or number.
*/

export const BELL = 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0';
export const CHECK = 'M5 12.5l4.5 4.5L19 7.5';
export const SEEDLING = 'M12 21v-8M12 13c0-4 3-7 8-7-0.5 4.5-3.5 7-8 7zM12 15c0-3-2.5-5.5-7-5.5 0.5 3.5 3 5.5 7 5.5z';

/** A phone, screen up. `children` is what's on the screen. */
export function Phone({ children, className = '', style }: { children?: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`pf-phone ${className}`} style={style}>
      <div className="pf-phone__screen">
        <div className="pf-phone__bar">
          <span className="pf-phone__brand">USWAG</span>
          <span className="pf-phone__dot" />
        </div>
        {children}
      </div>
    </div>
  );
}

/** Grey placeholder lines standing in for text we deliberately don't write. */
export function Lines({ widths, className = '' }: { widths: number[]; className?: string }) {
  return (
    <div className={`pf-lines ${className}`}>
      {widths.map((w, i) => (
        <span key={i} style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

/** A browser window on the USWAG website. */
export function Browser({ children, className = '', style }: { children?: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`pf-browser ${className}`} style={style}>
      <div className="pf-browser__chrome">
        <span />
        <span />
        <span />
        <p className="pf-browser__address">USWAG · News</p>
      </div>
      <div className="pf-browser__page">{children}</div>
    </div>
  );
}

/** A 24px line icon at any size (Part Two's icons are stroked in sage). */
export function Glyph({ d, size = 36, className = '' }: { d: string; size?: number; className?: string }) {
  return (
    <svg className={`pf-glyph ${className}`} viewBox="0 0 24 24" width={size} height={size}>
      <path d={d} pathLength={1} />
    </svg>
  );
}
