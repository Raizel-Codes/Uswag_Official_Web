import { random } from 'remotion';
import { useFilmTimeline } from '@/hooks/useFilmTimeline';
import { Caption } from './filmKit';
import { BELL, Glyph, Lines, Phone } from './sequelKit';

/** Where the phone ends up when the camera has pulled back: the centre of the map. */
const HUB = { x: 960, y: 500 };
/** Members' phones across the campus map, in rings around the hub (seeded, so always the same). */
const NODES = Array.from({ length: 56 }, (_, i) => {
  const ringIndex = i < 12 ? 0 : i < 30 ? 1 : 2;
  const radius = [230, 390, 560][ringIndex] + (random(`node-r-${i}`) - 0.5) * 90;
  const angle = random(`node-a-${i}`) * Math.PI * 2;
  return { x: HUB.x + Math.cos(angle) * radius * 1.45, y: HUB.y + Math.sin(angle) * radius * 0.62, d: radius };
});

/**
 * Part Two · Reach (1:00–1:08). The title, then one phone with a notification from the
 * officers; the camera pulls back and phone after phone lights up across the campus — the
 * push notifications members opt into.
 */
export default function ActReach() {
  const scope = useFilmTimeline((tl) => {
    // 0–2.2s — Part Two's title, as the shutters open onto it
    tl.fromTo('.pf-seqtitle__kicker', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0.2);
    tl.fromTo('.pf-seqtitle__word', { yPercent: 110 }, { yPercent: 0, duration: 0.7, stagger: 0.08, ease: 'power4.out' }, 0.35);
    tl.fromTo('.pf-seqtitle__rule', { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power3.out' }, 0.7);
    tl.to('.pf-seqtitle', { autoAlpha: 0, y: -60, duration: 0.5, ease: 'power2.in' }, 2.0);

    // 2.2–3.6s — one phone; a notification arrives, and a ring pulses out from it
    tl.fromTo('.pf-reach__phone', { y: 1000 }, { y: 0, duration: 0.8, ease: 'power3.out' }, 2.2);
    tl.fromTo('.pf-toast', { yPercent: -140, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.45, ease: 'back.out(1.6)' }, 2.9);
    tl.fromTo('.pf-toast .pf-glyph', { rotation: 0 }, { keyframes: [{ rotation: 16 }, { rotation: -12 }, { rotation: 8 }, { rotation: 0 }], duration: 0.5, transformOrigin: '50% 10%' }, 3.1);
    tl.fromTo(
      '.pf-pulse',
      { scale: 0.4, autoAlpha: 0 },
      { keyframes: [{ autoAlpha: 0.9, duration: 0.05 }, { scale: 3.2, autoAlpha: 0, duration: 1.35, ease: 'power2.out' }], stagger: 0.35 },
      3.1
    );

    // 3.8–7s — the camera pulls back: across the campus, phone after phone lights up
    tl.to('.pf-reach__phone', { scale: 0.22, duration: 1.4, ease: 'power3.inOut' }, 3.8);
    tl.fromTo('.pf-map', { autoAlpha: 0, scale: 1.8 }, { autoAlpha: 1, scale: 1, transformOrigin: `${HUB.x}px ${HUB.y}px`, duration: 1.4, ease: 'power3.inOut' }, 3.8);
    tl.fromTo(
      '.pf-link',
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 0.5, ease: 'power1.out', stagger: (i: number) => NODES[i].d / 380 },
      4.6
    );
    tl.fromTo(
      '.pf-node',
      { scale: 0, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 0.35, ease: 'back.out(2.5)', stagger: (i: number) => NODES[i].d / 380 },
      4.9
    );
    tl.to('.pf-reach__stage', { scale: 1.06, duration: 3.2, ease: 'none', transformOrigin: `${HUB.x}px ${HUB.y}px` }, 4.8);
    tl.set({}, {}, 8);
  });

  return (
    <div ref={scope} className="pf-scene">
      <div className="pf-seqtitle">
        <p className="pf-seqtitle__kicker">Part Two</p>
        <p className="pf-seqtitle__title">
          {['The', 'Record,', 'Live'].map((w) => (
            <span key={w} className="pf-seqtitle__mask">
              <span className="pf-seqtitle__word">{w}</span>
            </span>
          ))}
        </p>
        <span className="pf-seqtitle__rule" />
      </div>

      <div className="pf-reach__stage">
        <div className="pf-map">
          <svg className="pf-map__svg" viewBox="0 0 1920 1080" width="1920" height="1080">
            {[230, 390, 560].map((r) => (
              <ellipse key={r} className="pf-map__ring" cx={HUB.x} cy={HUB.y} rx={r * 1.45} ry={r * 0.62} />
            ))}
            {NODES.map((n, i) => (
              <path key={i} className="pf-link" pathLength={1} d={`M${HUB.x} ${HUB.y} L${n.x} ${n.y}`} />
            ))}
          </svg>
          {NODES.map((n, i) => (
            <span key={i} className="pf-node" style={{ left: n.x, top: n.y }} />
          ))}
        </div>

        <div className="pf-reach__hub" style={{ left: HUB.x, top: HUB.y }}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="pf-pulse" />
          ))}
          <Phone className="pf-reach__phone">
            <div className="pf-toast">
              <Glyph d={BELL} size={34} />
              <div>
                <p className="pf-toast__from">USWAG</p>
                <p className="pf-toast__text">A new announcement from your officers</p>
              </div>
            </div>
            <Lines widths={[70, 90, 55]} />
            <div className="pf-phone__card" />
            <Lines widths={[80, 60]} />
          </Phone>
        </div>
      </div>

      <Caption from={124} to={232} face="sans" tone="light" bottom={60}>
        Every member, within reach.
      </Caption>
    </div>
  );
}
