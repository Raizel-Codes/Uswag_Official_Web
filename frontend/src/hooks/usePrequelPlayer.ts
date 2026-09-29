import { useCallback, useEffect, useRef, useState, type RefObject, type SyntheticEvent } from 'react';
import type { CallbackListener, PlayerRef } from '@remotion/player';

/**
 * idle     waiting for "Watch the prequel"
 * loading  pressed play before the film's code had arrived; plays as soon as it does
 * playing  film running (the stage's curtains follow its frame — prequel.data.ts stageAt)
 * paused   film held
 * closing  the finale: digital shutters closed while the film's last seconds play out
 * ended    shutters closed, film over            error   the film couldn't load or play
 */
export type PrequelStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'closing' | 'ended' | 'error';

/** Below this share of the stage on screen, a running film pauses. */
const VISIBLE_TO_PLAY = 0.25;

interface Options {
  /** Frame at which the curtains close and the page moves into the present. */
  finaleFrame: number;
  onFinale: () => void;
}

/**
 * State machine for the front-page prequel (PrequelSection), driving a Remotion Player.
 * `player` is null until the lazily loaded film has mounted.
 */
export function usePrequelPlayer(player: PlayerRef | null, stageRef: RefObject<HTMLElement>, { finaleFrame, onFinale }: Options) {
  const [status, setStatus] = useState<PrequelStatus>('idle');
  // Once the finale has played, the curtains stay digital until the visitor scrolls back above the stage.
  const [finished, setFinished] = useState(false);
  const [muted, setMuted] = useState(false);
  const [frame, setFrame] = useState(0);

  const finaleFired = useRef(false);
  const pendingPlay = useRef(false);
  const onFinaleRef = useRef(onFinale);
  onFinaleRef.current = onFinale;

  useEffect(() => {
    if (!player) return;

    const reachFinale = () => {
      if (finaleFired.current) return;
      finaleFired.current = true;
      setFinished(true);
      setStatus('closing');
      onFinaleRef.current();
    };
    const onFrame: CallbackListener<'frameupdate'> = ({ detail }) => {
      setFrame(detail.frame);
      if (detail.frame >= finaleFrame) reachFinale();
    };
    const onEnded: CallbackListener<'ended'> = () => {
      reachFinale();
      setStatus('ended');
    };
    // A film paused during its finale (scrolled away) won't reach `ended` — treat it as over.
    const onPause: CallbackListener<'pause'> = () =>
      setStatus((s) => (s === 'playing' ? 'paused' : s === 'closing' ? 'ended' : s));
    const onPlay: CallbackListener<'play'> = () => setStatus((s) => (s === 'paused' ? 'playing' : s));
    const onError: CallbackListener<'error'> = () => setStatus('error');
    const onMute: CallbackListener<'mutechange'> = ({ detail }) => setMuted(detail.isMuted);

    player.addEventListener('frameupdate', onFrame);
    player.addEventListener('ended', onEnded);
    player.addEventListener('pause', onPause);
    player.addEventListener('play', onPlay);
    player.addEventListener('error', onError);
    player.addEventListener('mutechange', onMute);
    return () => {
      player.removeEventListener('frameupdate', onFrame);
      player.removeEventListener('ended', onEnded);
      player.removeEventListener('pause', onPause);
      player.removeEventListener('play', onPlay);
      player.removeEventListener('error', onError);
      player.removeEventListener('mutechange', onMute);
    };
  }, [player, finaleFrame]);

  const start = useCallback(
    (e?: SyntheticEvent) => {
      if (!player) return;
      finaleFired.current = false;
      player.seekTo(0);
      setFrame(0);
      setStatus('playing');
      // Passing the click event lets the player unlock audio on iOS, which only allows it from a gesture.
      player.play(e);
    },
    [player]
  );

  /** Start (or restart) the film — from the click handler, so any score may play. */
  const play = useCallback(
    (e?: SyntheticEvent) => {
      if (player) return start(e);
      pendingPlay.current = true;
      setStatus('loading');
    },
    [player, start]
  );

  // Pressed play before the film had arrived: start the moment it mounts.
  useEffect(() => {
    if (player && pendingPlay.current) {
      pendingPlay.current = false;
      start();
    }
  }, [player, start]);

  // Never play to an empty room: pause when the stage scrolls mostly out of view or the tab
  // is hidden. It doesn't resume by itself.
  useEffect(() => {
    const stage = stageRef.current;
    if (!player || !stage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < VISIBLE_TO_PLAY && player.isPlaying()) player.pause();
      },
      { threshold: [0, VISIBLE_TO_PLAY] }
    );
    observer.observe(stage);
    const onVisibility = () => {
      if (document.hidden && player.isPlaying()) player.pause();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [player, stageRef]);

  const togglePause = useCallback(
    (e: SyntheticEvent) => {
      if (!player) return;
      if (player.isPlaying()) player.pause();
      else player.play(e);
    },
    [player]
  );

  const toggleMute = useCallback(() => {
    if (!player) return;
    if (player.isMuted()) player.unmute();
    else player.mute();
  }, [player]);

  /** Jump to a frame (the stage's "Skip to Part Two"); a running film keeps running from there. */
  const seek = useCallback(
    (to: number) => {
      if (!player) return;
      player.seekTo(to);
      setFrame(to);
    },
    [player]
  );

  /** The film's code failed to arrive. */
  const fail = useCallback(() => {
    pendingPlay.current = false;
    setStatus('error');
  }, []);

  /** Back to the start, not playing — the visitor scrolled back above the stage. An error stays shown. */
  const reset = useCallback(() => {
    pendingPlay.current = false;
    finaleFired.current = false;
    player?.pause();
    player?.seekTo(0);
    setFinished(false);
    setFrame(0);
    setStatus((s) => (s === 'error' ? s : 'idle'));
  }, [player]);

  return { status, finished, muted, frame, play, togglePause, toggleMute, seek, fail, reset };
}
