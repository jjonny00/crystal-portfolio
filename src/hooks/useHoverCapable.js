import { useEffect, useState } from 'react';
import { MQ_HOVER_CAPABLE } from '../config/breakpoints';

const getInitialHoverCapable = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia(MQ_HOVER_CAPABLE).matches;
};

export const useHoverCapable = () => {
  const [hoverCapable, setHoverCapable] = useState(getInitialHoverCapable);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;

    const mediaQuery = window.matchMedia(MQ_HOVER_CAPABLE);
    const handleChange = (event) => {
      setHoverCapable(event.matches);
    };

    setHoverCapable(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return hoverCapable;
};

export default useHoverCapable;
