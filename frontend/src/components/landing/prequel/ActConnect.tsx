import { useFilmTimeline } from '@/hooks/useFilmTimeline';
import { ADVOCACIES, Caption } from './filmKit';
import { Browser, CHECK, Glyph, Lines, SEEDLING } from './sequelKit';

const ENVIRONMENT = ADVOCACIES[2];
/** The sync, from the Page post to the site's news feed. */
const BEAM = 'M760 500 C880 360 980 360 1090 440';

/** The post as it appears on the Facebook Page and, once synced, in the site's feed. */
function Post({ className = '' }: { className?: string }) {
  return (
    <div className={`pf-post ${className}`}>
      <span className="pf-post__glow" />
      <div className="pf-post__head">
        <span className="pf-post__avatar">U</span>
        <div>
          <p className="pf-post__name">USWAG</p>
          <Lines widths={[46]} />
        </div>
      </div>
      <p className="pf-post__tag">{ENVIRONMENT.title}</p>
      <Lines widths={[94, 82, 60]} />
      <div className="pf-post__picture">
        <Glyph d={SEEDLING} size={120} />
      </div>
    </div>
  );
}

/**
 * Part Two · Connect (1:08–1:15). The PRO posts on the organisation's Facebook Page; the
 * site's sync (server-side, read-only — facebookSync.job.ts) carries it into the news feed,
 * and an event in the feed is answered with a tap. The site is never shown posting to Facebook.
 */
export default function ActConnect() {
  const scope = useFilmTimeline((tl, q) => {
    // 0–1.6s — the post goes up on the Page
    tl.fromTo('.pf-connect__page', { x: -220, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out' }, 0.1);
    tl.fromTo('.pf-connect__page .pf-glyph path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out' }, 0.6);

    // 1.4–3s — carried along the sync to the website's feed
    tl.fromTo('.pf-browser', { x: 220, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out' }, 1.2);
    tl.fromTo('.pf-beam', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' }, 1.7);
    const [beam] = q('.pf-beam');
    if (beam) {
      tl.fromTo('.pf-spark', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 1.7);
      tl.to('.pf-spark', { motionPath: { path: beam as SVGPathElement, align: beam as SVGPathElement, alignOrigin: [0.5, 0.5] }, duration: 0.8, ease: 'power2.inOut' }, 1.7);
      tl.to('.pf-spark', { autoAlpha: 0, scale: 2.5, duration: 0.3 }, 2.5);
    }
    tl.fromTo('.pf-feed__older', { y: 0 }, { y: 420, duration: 0.5, ease: 'power3.out' }, 2.4);
    tl.fromTo('.pf-feed .pf-post', { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' }, 2.5);
    tl.fromTo('.pf-feed .pf-post__glow', { scale: 1, autoAlpha: 0.9 }, { scale: 1.08, autoAlpha: 0, duration: 0.9, ease: 'power2.out' }, 2.8);

    // 4–6.4s — an event in the feed: one tap on RSVP
    tl.fromTo('.pf-event', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 3.8);
    tl.fromTo('.pf-tap', { scale: 0.3, autoAlpha: 0 }, { keyframes: [{ scale: 1, autoAlpha: 0.9, duration: 0.2 }, { scale: 2.2, autoAlpha: 0, duration: 0.45 }] }, 4.6);
    tl.to('.pf-rsvp__ask', { autoAlpha: 0, duration: 0.12 }, 4.75);
    tl.fromTo('.pf-rsvp__going', { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, 4.8);
    tl.fromTo('.pf-rsvp__fill', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, 4.75);
    tl.set({}, {}, 7);
  });

  return (
    <div ref={scope} className="pf-scene">
      <div className="pf-connect__page">
        <p className="pf-connect__label">Facebook Page</p>
        <Post />
      </div>

      <svg className="pf-beam-svg" viewBox="0 0 1920 1080" width="1920" height="1080">
        <path className="pf-beam" pathLength={1} d={BEAM} />
      </svg>
      <span className="pf-spark" />

      <Browser style={{ left: 1090, top: 170 }}>
        <div className="pf-feed">
          <Post />
          <div className="pf-feed__older">
            <div className="pf-event">
              <div>
                <p className="pf-event__kind">Event</p>
                <Lines widths={[80, 52]} />
              </div>
              <div className="pf-rsvp">
                <span className="pf-rsvp__fill" />
                <span className="pf-rsvp__ask">RSVP</span>
                <span className="pf-rsvp__going">
                  <Glyph d={CHECK} size={28} />
                  Going
                </span>
                <span className="pf-tap" />
              </div>
            </div>
            <div className="pf-feed__skeleton" />
          </div>
        </div>
      </Browser>

      <Caption from={10} to={92} face="sans" tone="light" bottom={60}>
        Posted once on our Page…
      </Caption>
      <Caption from={96} to={202} face="sans" tone="light" bottom={60}>
        …carried to every member.
      </Caption>
    </div>
  );
}
