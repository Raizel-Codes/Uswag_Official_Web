import { useFilmTimeline } from '@/hooks/useFilmTimeline';
import { ADVOCACIES, Caption, LineIcon } from './filmKit';
import { CHECK, Glyph, Lines } from './sequelKit';

const PANEL_X = [120, 700, 1280];

/**
 * Part Two · The Three Pillars (1:15–1:22). Article II's three advocacies, side by side, each
 * with a small motion of its own. At the seedling, an officer's phone checks a member in by QR
 * — the signed-QR attendance the site runs, and the Environmental Leadership point that a
 * scan replaces a paper sign-in sheet.
 */
export default function ActPillars() {
  const scope = useFilmTimeline((tl) => {
    // 0–1s — the three panels rise
    tl.fromTo('.pf-pillar', { y: 140, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out' }, 0);

    // Youth Voice — speech bubbles rise; a ballot drops into the box and is ticked
    tl.fromTo('.pf-bubble', { y: 80, autoAlpha: 0, scale: 0.6 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.6, stagger: 0.35, ease: 'back.out(1.8)' }, 0.9);
    tl.fromTo('.pf-ballot__slip', { y: -120 }, { y: 36, duration: 0.7, ease: 'power2.in' }, 2.4);
    tl.fromTo('.pf-ballot__check path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out' }, 3.2);

    // Mental Health & Wellness — a circle breathes slowly in and out
    tl.fromTo('.pf-breath', { scale: 0.78 }, { keyframes: [{ scale: 1.12, duration: 1.7 }, { scale: 0.86, duration: 1.7 }, { scale: 1.05, duration: 1.5 }], ease: 'sine.inOut' }, 0.9);
    tl.fromTo('.pf-breath__ring', { scale: 0.9, autoAlpha: 0.6 }, { scale: 1.6, autoAlpha: 0, duration: 1.7, repeat: 2, ease: 'sine.out' }, 0.9);

    // Environmental Leadership — a seedling grows out of the grid; a QR check-in beside it
    tl.fromTo('.pf-sprout__stem', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.0, ease: 'power2.out' }, 0.9);
    tl.fromTo('.pf-sprout__leaf', { scale: 0 }, { scale: 1, duration: 0.6, stagger: 0.2, ease: 'back.out(2)', transformOrigin: '0% 100%' }, 1.6);
    tl.fromTo('.pf-scan', { autoAlpha: 0, x: 60 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power3.out' }, 2.4);
    tl.fromTo('.pf-scan__line', { y: 0 }, { y: 150, duration: 0.6, ease: 'sine.inOut', repeat: 1, yoyo: true }, 2.9);
    tl.fromTo('.pf-scan__valid', { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.2)' }, 4.1);
    tl.to('.pf-scan__line', { autoAlpha: 0, duration: 0.2 }, 4.1);

    tl.to('.pf-pillars', { scale: 1.03, duration: 7, ease: 'none', transformOrigin: '50% 50%' }, 0);
    tl.set({}, {}, 7);
  });

  return (
    <div ref={scope} className="pf-scene">
      <div className="pf-pillars">
        {ADVOCACIES.map((a, i) => (
          <div key={a.id} className={`pf-pillar pf-pillar--${a.id}`} style={{ left: PANEL_X[i] }}>
            <div className="pf-pillar__head">
              <LineIcon d={a.icon} size={52} />
              <p className="pf-pillar__title">{a.title}</p>
              <p className="pf-pillar__focus">{a.focus}</p>
            </div>
            <div className="pf-pillar__art">
              {a.id === 'voice' && (
                <>
                  <span className="pf-bubble" style={{ left: 70, top: 40 }} />
                  <span className="pf-bubble pf-bubble--right" style={{ left: 250, top: 10 }} />
                  <span className="pf-bubble" style={{ left: 150, top: 130 }} />
                  <div className="pf-ballot">
                    <span className="pf-ballot__slip">
                      <Glyph d={CHECK} size={40} className="pf-ballot__check" />
                    </span>
                    <span className="pf-ballot__box" />
                  </div>
                </>
              )}
              {a.id === 'wellness' && (
                <div className="pf-breath-wrap">
                  <span className="pf-breath__ring" />
                  <span className="pf-breath">
                    <LineIcon d={a.icon} size={96} />
                  </span>
                </div>
              )}
              {a.id === 'environment' && (
                <>
                  <svg className="pf-sprout" viewBox="0 0 200 260" width="200" height="260">
                    <path className="pf-sprout__ground" d="M10 250 H190" />
                    <path className="pf-sprout__stem" pathLength={1} d="M100 250 C100 200 96 160 104 110" />
                    <path className="pf-sprout__leaf" d="M104 150 C120 118 150 106 184 108 C176 140 146 160 104 150 Z" />
                    <path className="pf-sprout__leaf" d="M102 190 C84 160 56 150 22 154 C32 184 62 200 102 190 Z" />
                  </svg>
                  <div className="pf-scan">
                    <div className="pf-scan__frame">
                      <span className="pf-scan__qr" />
                      <span className="pf-scan__line" />
                    </div>
                    <p className="pf-scan__valid">
                      <Glyph d={CHECK} size={26} />
                      Valid
                    </p>
                    <Lines widths={[70]} />
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <Caption from={112} to={206} face="sans" tone="light" bottom={56}>
        Checked in by QR. No paper sign-in sheets.
      </Caption>
    </div>
  );
}
