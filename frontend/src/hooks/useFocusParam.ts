import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Deep links into a section of a page: `/admin/work?focus=expense` scrolls the element with
 * id="expense" into view and focuses its first field (or the section itself). Lets a
 * dashboard's quick action land on the exact form it names, not just the top of the page.
 * Pass `ready` once the target exists (e.g. after data loads).
 */
export function useFocusParam(ready = true) {
  const [params] = useSearchParams();
  const focus = params.get('focus');

  useEffect(() => {
    if (!focus || !ready) return;
    const el = document.getElementById(focus);
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
    const field = el.querySelector<HTMLElement>('input, textarea, select, button');
    (field ?? el).focus({ preventScroll: true });
  }, [focus, ready]);

  return focus;
}
