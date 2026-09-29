import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { useGSAP } from '@gsap/react';
import type { PlayerRef } from '@remotion/player';
import { ScrollTrigger, ensureGsapRegistered } from '@/lib/motion';
import { useLandingReveal } from '@/hooks/useLandingReveal';
import { usePrequelPlayer, type PrequelStatus } from '@/hooks/usePrequelPlayer';
import { useLandingEra } from '@/context/LandingEraContext';
import EngravedRule from '../ornaments/EngravedRule';
import CinemaCurtains from '../artifacts/CinemaCurtains';
import SignaturePlay from '../artifacts/SignaturePlay';
import { FOUNDED_YEAR } from '../timeline.data';
import { SECOND_BATCH_YEAR } from '../firstOfficers.data';
import {
  FILM,
  MARKS,
  PREQUEL_LENGTH_LABEL,
  PREQUEL_MUSIC,
  stageAt,
  type StageState,
} from '../prequel.data';

ensureGsapRegistered();

type FilmPlayer = typeof import('../prequel/PrequelPlayer').default;

/** Start fetching the film's code this far before the stage scrolls into view. */
const PRELOAD_MARGIN = '800px 0px';
/** Below this screen width the film switches to its phone typography. */
const COMPACT_SCREEN = 640;

/** The play ritual on the stage: the signature waiting, being signed, or done (the film showing). */
type Ritual = 'ready' | 'signing' | 'done';

const ANNOUNCE: Record<PrequelStatus, string> = {
  idle: '',
  loading: 'Loading the prequel.',
  playing: 'Playing the prequel.',
  paused: 'Prequel paused.',
  closing: 'The prequel has ended.',
  ended: 'The prequel has ended.',
  error: 'The prequel couldn’t play.',
};

function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * S3.5 — the interlude between the years and the rebirth: a 90-second film in two parts in a
 * full-width theatre (docs/design/landing-architecture.md §3.6). Nothing autoplays and nothing
 * is pinned or locked; the section scrolls past like any other and "Skip to the rebirth" is
 * always one tap away.
 *
 * - The velvet curtains part once, as the theatre scrolls into view (as on therecord.institute).
 * - Behind them waits the signature: pressed, a quill signs, a stamp seals it and the seal opens
 *   onto the film (SignaturePlay).
 * - The film is code (prequel/PrequelFilm.tsx, Remotion + GSAP), fetched in its own chunk as the
 *   stage approaches. While it runs the curtains follow its frame (stageAt): the velvet closes
 *   for the intermission, the page turns to the present behind it (useLandingEra), digital
 *   shutters carry it into Part Two, and close its finale.
 * - Scrolling back above the theatre closes the velvet, releases the page to the scroll, and
 *   resets the film.
 */
export default function PrequelSection() {
  const ref = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const continueRef = useRef<HTMLAnchorElement>(null);
  useLandingReveal(ref);

  const [Film, setFilm] = useState<FilmPlayer | null>(null);
  const [playerRef, setPlayerRef] = useState<PlayerRef | null>(null);
  const filmRequested = useRef(false);
  const [entered, setEntered] = useState(false);
  const [ritual, setRitual] = useState<Ritual>('ready');
  // A fresh signature each time the film is started again
  const [session, setSession] = useState(0);

  const era = useLandingEra();
  const player = usePrequelPlayer(playerRef, stageRef, {
    finaleFrame: MARKS.finale,
    onFinale: () => {
      // Keyboard and screen-reader visitors land on the way forward, not back at the top.
      continueRef.current?.focus({ preventScroll: true });
    },
  });
  const { fail, reset } = player;

  const loadFilm = useCallback(() => {
    if (filmRequested.current) return;
    filmRequested.current = true;
    import('../prequel/PrequelPlayer')
      .then((mod) => setFilm(() => mod.default))
      .catch(() => {
        filmRequested.current = false; // "Try again" can ask for it once more
        fail();
      });
  }, [fail]);

  // Fetch the film ahead of the visitor so the seal opens onto its first frame.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadFilm();
          observer.disconnect();
        }
      },
      { rootMargin: PRELOAD_MARGIN }
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, [loadFilm]);

  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;
    const observer = new ResizeObserver(([entry]) => setCompact(entry.contentRect.width < COMPACT_SCREEN));
    observer.observe(screen);
    return () => observer.disconnect();
  }, []);

  // The velvet parts as the theatre comes into view, and closes again — resetting the film — if
  // the visitor scrolls back above it.
  const resetRef = useRef(reset);
  resetRef.current = reset;
  useGSAP(
    () => {
      const trigger = ScrollTrigger.create({
        trigger: stageRef.current,
        start: 'top 70%',
        onEnter: () => setEntered(true),
        onLeaveBack: () => {
          setEntered(false);
          setRitual('ready');
          setSession((n) => n + 1);
          resetRef.current();
        },
      });
      if (trigger.progress > 0 || trigger.isActive) setEntered(true);
    },
    { scope: ref }
  );

  const { status, finished, frame } = player;
  const running = status === 'playing' || status === 'paused' || status === 'closing';

  let stage: StageState;
  if (!entered) stage = { velvet: 'closed', shutters: 'open' };
  else if (running) stage = stageAt(frame);
  else if (status === 'ended') stage = { velvet: 'open', shutters: 'closed' };
  else stage = { velvet: 'open', shutters: 'open' };

  const present = (running && frame >= MARKS.commit) || status === 'ended';
  // The drapes in the wings change face unseen, behind the closed shutters
  const digitalWings = (running && frame >= MARKS.velvetBack) || status === 'ended';
  const intermission = running && frame >= MARKS.intermission && frame < MARKS.sequel;

  // The page follows the film into the present at the intermission, and back if it restarts.
  const wasPresent = useRef(false);
  useEffect(() => {
    if (present) era.commit();
    else if (wasPresent.current) era.release();
    wasPresent.current = present;
  }, [present, era]);

  const startFilm = (e: SyntheticEvent) => {
    setEntered(true);
    setRitual('signing');
    loadFilm();
    player.play(e);
  };

  const watchAgain = (e: SyntheticEvent) => {
    setSession((n) => n + 1);
    startFilm(e);
  };

  const showSignature = ritual !== 'done' && status !== 'error' && status !== 'ended';

  return (
    <section id="lp-prequel" ref={ref} aria-labelledby="lp-prequel-heading" data-era="mid" className="lp-section">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        <header className="max-w-[46rem] mx-auto text-center">
          <p className="lp-eyebrow lp-ink-caption" data-lp-reveal>
            Interlude · The prequel
          </p>
          <h2 id="lp-prequel-heading" className="lp-h2 mt-4" data-lp-reveal>
            Before the rebirth
          </h2>
          <EngravedRule className="mt-7 max-w-[220px] mx-auto" />
          <p className="lp-body lp-ink-secondary mt-7 mx-auto" data-lp-reveal>
            Ninety seconds, in two parts. How USWAG began in <span className="lp-onum">{FOUNDED_YEAR}</span>, went quiet,
            and was rebuilt in <span className="lp-onum">{SECOND_BATCH_YEAR}</span> — by a new generation and one of the
            people who started it. Then how it reaches its members, and carries its causes, today.
          </p>
        </header>
      </div>

      <figure className="lp-theatre mt-12" data-present={present} data-wings={digitalWings ? 'digital' : 'classic'}>
        <div ref={stageRef} className="lp-theatre__stage">
          <div ref={screenRef} className="lp-theatre__screen">
            {/* The film's own text flickers in and out frame by frame; the section's introduction describes it instead. */}
            <div className="lp-stage__film" aria-hidden="true">
              {Film && <Film ref={setPlayerRef} compact={compact} />}
            </div>

            {showSignature && (
              <SignaturePlay
                key={session}
                signing={ritual === 'signing'}
                loading={status === 'loading'}
                onSign={startFilm}
                onOpened={() => setRitual('done')}
                lengthLabel={PREQUEL_LENGTH_LABEL}
              />
            )}

            {status === 'error' && (
              <div className="lp-stage__overlay">
                <div className="lp-stage__notice lp-on-dark">
                  <p className="lp-small text-mist">The prequel couldn’t play right now.</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">
                    <button type="button" className="lp-btn lp-btn--light" onClick={watchAgain}>
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <CinemaCurtains
            velvet={stage.velvet}
            shutters={stage.shutters}
            plate={intermission ? 'intermission' : 'title'}
            shutterLine={intermission ? 'Part Two · The Record, Live' : undefined}
          />

          {status === 'ended' && (
            <div className="lp-stage__overlay lp-stage__overlay--low">
              <button type="button" className="lp-btn lp-btn--light" onClick={watchAgain}>
                <ReplayIcon />
                Watch again
              </button>
            </div>
          )}
        </div>

        <figcaption className="lp-sr-only">
          The USWAG prequel, a 90-second animated film in two parts. Part One: in 2010, students
          sign USWAG&rsquo;s charter and stand together as its first members. The years pass and
          the organization goes quiet. In 2025 a new generation brings it back, and one of the
          people who started it signs the charter again beside them. Part Two: today, news and
          events reach members on their phones, posts from USWAG&rsquo;s Facebook Page appear on
          this site, and members check in to events with a QR code. The film closes on the three
          causes USWAG works for &mdash; youth voice and participation, mental health and
          wellness, and environmental leadership &mdash; and on the years still ahead.
        </figcaption>

        <div className="lp-stage-bar lp-theatre__measure">
          {running ? (
            <>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="lp-stage-control"
                  onClick={player.togglePause}
                  disabled={status === 'closing'}
                  aria-label={status === 'paused' ? 'Play' : 'Pause'}
                >
                  {status === 'paused' ? <PlayIcon /> : <PauseIcon />}
                </button>
                {PREQUEL_MUSIC && (
                  <button
                    type="button"
                    className="lp-stage-control"
                    onClick={player.toggleMute}
                    aria-label="Mute"
                    aria-pressed={player.muted}
                  >
                    <SoundIcon muted={player.muted} />
                  </button>
                )}
                {frame < MARKS.intermission && (
                  <button type="button" className="lp-link lp-small ml-3" onClick={() => player.seek(MARKS.sequel)}>
                    Skip to Part Two
                  </button>
                )}
              </div>
              <div className="lp-stage-progress" aria-hidden="true">
                <span className="lp-stage-progress__part" style={{ flexGrow: MARKS.sequel }}>
                  <span style={{ transform: `scaleX(${Math.min(1, frame / MARKS.sequel)})` }} />
                </span>
                <span className="lp-stage-progress__part lp-stage-progress__part--two" style={{ flexGrow: FILM.durationInFrames - MARKS.sequel }}>
                  <span style={{ transform: `scaleX(${Math.max(0, (frame - MARKS.sequel) / (FILM.durationInFrames - MARKS.sequel))})` }} />
                </span>
              </div>
              <p className="lp-small lp-lnum lp-ink-secondary" aria-hidden="true">
                {clock(frame / FILM.fps)} / {PREQUEL_LENGTH_LABEL}
              </p>
            </>
          ) : (
            <p className="lp-small lp-ink-secondary">{PREQUEL_MUSIC ? 'Sound on' : 'No sound'}</p>
          )}
        </div>
        <p className="lp-sr-only" role="status" aria-live="polite">
          {ANNOUNCE[status]}
          {intermission ? ' Intermission.' : ''}
        </p>
      </figure>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        <div className="lp-theatre__measure mt-2">
          <a ref={continueRef} href="#lp-rebirth" className="lp-link">
            {finished ? 'Continue to the rebirth' : 'Skip to the rebirth'}
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 4.5v15l12.5-7.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z" />
    </svg>
  );
}

function ReplayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" />
    </svg>
  );
}

function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      {muted ? <path d="M16 9.5l5 5M21 9.5l-5 5" /> : <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />}
    </svg>
  );
}
