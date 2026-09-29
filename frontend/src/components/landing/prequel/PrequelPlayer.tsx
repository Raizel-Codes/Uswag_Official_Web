import { forwardRef } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import PrequelFilm from './PrequelFilm';
import { FILM, PREQUEL_MUSIC } from '../prequel.data';

interface PrequelPlayerProps {
  /** Phone-sized stage: the film sets its type larger (see PrequelFilm). */
  compact: boolean;
}

/**
 * The film's player, in its own chunk: PrequelSection imports this module only when the
 * stage comes near the viewport, so Remotion never weighs on the first load of the page.
 * No built-in controls, click-to-play or keyboard shortcuts — the stage owns all of those.
 */
const PrequelPlayer = forwardRef<PlayerRef, PrequelPlayerProps>(function PrequelPlayer({ compact }, ref) {
  return (
    <Player
      ref={ref}
      component={PrequelFilm}
      inputProps={{ compact }}
      durationInFrames={FILM.durationInFrames}
      compositionWidth={FILM.width}
      compositionHeight={FILM.height}
      fps={FILM.fps}
      controls={false}
      clickToPlay={false}
      doubleClickToFullscreen={false}
      spaceKeyToPlayOrPause={false}
      moveToBeginningWhenEnded={false}
      // One tag for the optional score; none when the film is silent, so nothing asks to play audio
      numberOfSharedAudioTags={PREQUEL_MUSIC ? 1 : 0}
      browserMediaControlsBehavior={{ mode: 'do-nothing' }}
      style={{ width: '100%', height: '100%' }}
    />
  );
});

export default PrequelPlayer;
