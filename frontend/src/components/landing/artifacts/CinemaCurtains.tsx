import type { CSSProperties } from 'react';
import type { CurtainState } from '../prequel.data';

const SLATS = 12;
const slats = Array.from({ length: SLATS }, (_, i) => i);

interface CinemaCurtainsProps {
  /** Forest-green velvet — the archive. Opens once the stage scrolls into view; closes for the intermission. */
  velvet: CurtainState;
  /** Deep Forest shutters with the sage grid — the present. They carry the film across the intermission and close its finale. */
  shutters: CurtainState;
  /** What the card hanging at the seam of the closed velvet says. */
  plate: 'title' | 'intermission';
  /** Line under the monogram on the closed shutters, if any. */
  shutterLine?: string;
}

/**
 * The theatre's curtains: two full-width velvet drapes that part to the wings, as on
 * therecord.institute but in the landing palette, and a set of digital shutters. Decorative,
 * so the whole layer is aria-hidden — the stage's buttons and live status carry the meaning.
 *
 * Every movement is a CSS transition keyed off data attributes (landing.css, "Prequel
 * theatre"), so it reverses cleanly from any point and reduced motion can swap it for a fade
 * in one place. Velvet is Deep Forest / Primary, not theatre red: red isn't in the brand
 * palette (decided with the organisation, 2026-09-30).
 */
export default function CinemaCurtains({ velvet, shutters, plate, shutterLine }: CinemaCurtainsProps) {
  return (
    <div className="lp-curtains" data-velvet={velvet} data-shutters={shutters} aria-hidden="true">
      {/* Once the page is in the present, the drapes gathered in the wings take on the digital face too */}
      <div className="lp-velvet lp-velvet--left">
        <span className="lp-velvet__hem" />
        <span className="lp-velvet__digital" />
      </div>
      <div className="lp-velvet lp-velvet--right">
        <span className="lp-velvet__hem" />
        <span className="lp-velvet__digital" />
      </div>

      <div className="lp-curtains__plate" data-plate={plate}>
        <span className="lp-curtains__cord lp-curtains__cord--left" />
        <span className="lp-curtains__cord lp-curtains__cord--right" />
        <div className="lp-curtains__card">
          {plate === 'title' ? (
            <>
              <span className="lp-curtains__kicker">A film in two parts</span>
              <span className="lp-curtains__title">The Rebirth of USWAG</span>
              <span className="lp-curtains__meta">1:30</span>
            </>
          ) : (
            <>
              <span className="lp-curtains__kicker">End of Part One</span>
              <span className="lp-curtains__title">Intermission</span>
              <span className="lp-curtains__meta">Part Two · The Record, Live</span>
            </>
          )}
        </div>
      </div>

      <div className="lp-curtains__digital">
        {(['left', 'right'] as const).map((side) => (
          <div key={side} className={`lp-slats lp-slats--${side}`}>
            {/* Index 0 is the outermost slat: they close from the edges toward the seam */}
            {slats.map((i) => (
              <span key={i} className="lp-slat" style={{ '--i': i } as CSSProperties} />
            ))}
          </div>
        ))}
        <div className="lp-curtains__grid" />
        <span className="lp-curtains__seam" />
        <div className="lp-curtains__monogram">
          <span>USWAG</span>
          {shutterLine && <small>{shutterLine}</small>}
        </div>
      </div>

      {/* The pelmet across the top of the proscenium stays put; it turns digital with the page */}
      <div className="lp-valance" />
    </div>
  );
}
