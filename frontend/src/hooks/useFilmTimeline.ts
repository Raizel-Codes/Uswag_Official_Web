import { useLayoutEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { gsap } from '@/lib/motion';

// The quill follows its own signature stroke (motionPath) in Acts I and III.
gsap.registerPlugin(MotionPathPlugin);

/** Finds elements inside the scene — for values that need an element rather than a selector (a motionPath). */
export type SceneQuery = (selector: string) => Element[];

/**
 * GSAP choreography inside a Remotion scene of the prequel film.
 *
 * Remotion owns the clock; GSAP only describes the motion. The timeline is built paused and
 * seeked to the scene's current frame on every render, so any given frame looks identical
 * however it is reached — playing, paused, replayed — and GSAP's own ticker never drives it.
 * Selector strings in `build` are scoped to the returned ref; `q` finds elements in it.
 */
export function useFilmTimeline<T extends Element = HTMLDivElement>(build: (tl: gsap.core.Timeline, q: SceneQuery) => void) {
  const scope = useRef<T>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  useGSAP(
    () => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
      build(tl, gsap.utils.selector(scope.current));
      tl.seek(frame / fps, false);
      timeline.current = tl;
      return () => {
        timeline.current = null;
      };
    },
    { scope }
  );

  useLayoutEffect(() => {
    timeline.current?.seek(frame / fps, false);
  }, [frame, fps]);

  return scope;
}
