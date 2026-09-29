// Lets a section of a public page move the page-wide era (parchment → Mist) on an event rather
// than on scroll — the prequel film ending commits the page to the present. PublicPage owns the
// era (useEraScroll) and provides its controls here.
import { createContext, useContext } from 'react';
import type { EraControls } from '@/hooks/useEraScroll';

const noop = () => {};

// Outside a PublicPage there is no era to move, so the controls do nothing.
export const LandingEraContext = createContext<EraControls>({ commit: noop, release: noop });

export function useLandingEra() {
  return useContext(LandingEraContext);
}
