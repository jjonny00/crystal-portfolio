import { useEffect, useState } from 'react';

const matches = (query) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(query).matches;
};

/**
 * Tracks a media query. Prefer this over a resize listener: it fires only when
 * the answer actually changes rather than on every pixel of a drag, and it can
 * answer questions `innerWidth` cannot (pointer type, reduced motion).
 *
 * Pass a token from config/breakpoints.js rather than a literal, so the query
 * and whatever CSS depends on it cannot drift apart.
 */
export const useMediaQuery = (query) => {
  const [active, setActive] = useState(() => matches(query));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;

    const mediaQuery = window.matchMedia(query);
    const handleChange = (event) => setActive(event.matches);

    // Re-read on subscribe: the viewport may have changed between the initial
    // render and this effect, and on a query change it is a different question.
    setActive(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return active;
};

export default useMediaQuery;
