
/**
 * "The Rebirth of USWAG" — the 90-second film on the front page (PrequelSection), in two parts:
 * the prequel (the record, 2010 → 2025) and its sequel (the record, live).
 *
 * The film is code, not a video file: a Remotion composition (prequel/PrequelFilm.tsx) whose
 * scenes are choreographed with GSAP, played in the page by @remotion/player.
 *
 * Confirmed by the organisation (2026-09-30): the current adviser was among the 2010
 * founders and has agreed to be depicted. The adviser is shown in silhouette and is not
 * named. Act II deliberately gives no years or causes for the break-up — none are on record
 * (see timeline.data.ts); add them only once the adviser confirms them. Part Two shows only
 * what the site really does (push notifications, the Facebook Page sync, RSVP, QR check-in)
 * and makes no claims — no invented events, no numbers.
 */
export const FILM = { fps: 30, width: 1920, height: 1080, durationInFrames: 90 * 30 } as const;

/** Where each scene sits in the film, in frames (30 fps). */
export const SCENES = {
  prologue: { from: 0, duration: 210 },
  founding: { from: 210, duration: 390 },
  quietYears: { from: 600, duration: 360 },
  return: { from: 960, duration: 540 },
  turning: { from: 1500, duration: 300 },
  reach: { from: 1800, duration: 240 },
  connect: { from: 2040, duration: 210 },
  pillars: { from: 2250, duration: 210 },
  yearsAhead: { from: 2460, duration: 240 },
} as const;

/**
 * The film and the page's curtains are choreographed together. The film keeps playing behind
 * closed curtains; these are the frames at which the stage moves.
 */
export const MARKS = {
  /** The classic velvet closes over the end of Part One — "Intermission". */
  intermission: 1710,
  /** Behind the closed velvet, the whole page turns to the present (useLandingEra). */
  commit: 1740,
  /** Digital shutters close over the velvet… */
  shutters: 1764,
  /** …the velvet is drawn back unseen behind them… */
  velvetBack: 1790,
  /** …and the shutters open on Part Two. */
  sequel: 1800,
  /** The shutters close for the finale, two seconds before the end; the film's last frames match their face. */
  finale: 2640,
} as const;

export type CurtainState = 'open' | 'closed';

export interface StageState {
  velvet: CurtainState;
  shutters: CurtainState;
}

/** What the stage's curtains are doing at a given frame of a running film. */
export function stageAt(frame: number): StageState {
  if (frame < MARKS.intermission) return { velvet: 'open', shutters: 'open' };
  if (frame < MARKS.shutters) return { velvet: 'closed', shutters: 'open' };
  if (frame < MARKS.velvetBack) return { velvet: 'closed', shutters: 'closed' };
  if (frame < MARKS.sequel) return { velvet: 'open', shutters: 'closed' };
  if (frame < MARKS.finale) return { velvet: 'open', shutters: 'open' };
  return { velvet: 'open', shutters: 'closed' };
}

/**
 * Optional score (a licensed track, 90 s). Without one the film plays silent and the stage
 * shows no mute control. If the track carries speech or effects that matter to the story, it will need captions.
 */
export const PREQUEL_MUSIC: string | null = import.meta.env.VITE_PREQUEL_MUSIC_URL || null;

/** Shown on the play button and the clock. */
export const PREQUEL_LENGTH_LABEL = '1:30';

/** The rings of the last scene run solid through the current year; the years after it are drawn open. */
export const PRESENT_YEAR = new Date().getFullYear();
