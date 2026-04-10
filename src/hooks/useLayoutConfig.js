import { useEffect, useMemo, useState } from 'react';
import { MQ_DESKTOP } from '../config/breakpoints';
import desktopLayoutJson from '../config/layout/desktop.json';
import mobileLayoutJson from '../config/layout/mobile.json';
import { parseLayout } from '../lib/layout/parseLayout';

const getInitialVariant = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'desktop';
  }

  return window.matchMedia(MQ_DESKTOP).matches ? 'desktop' : 'mobile';
};

export const useLayoutConfig = () => {
  const [variant, setVariant] = useState(getInitialVariant);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;

    const desktopMq = window.matchMedia(MQ_DESKTOP);
    const handleChange = (event) => {
      setVariant(event.matches ? 'desktop' : 'mobile');
    };

    setVariant(desktopMq.matches ? 'desktop' : 'mobile');
    desktopMq.addEventListener('change', handleChange);

    return () => {
      desktopMq.removeEventListener('change', handleChange);
    };
  }, []);

  return useMemo(() => {
    try {
      const rawLayout = variant === 'desktop' ? desktopLayoutJson : mobileLayoutJson;
      const layout = parseLayout(rawLayout);
      if (import.meta.env.DEV) {
        console.log('[layout-source] parsed layout fields', {
          variant,
          'camera.positions.hero': rawLayout?.camera?.positions?.hero ?? null,
          'camera.projects.leadership.selected.position':
            rawLayout?.camera?.projects?.leadership?.selected?.position ?? null,
          'camera.projects.leadership.caseStudy.target':
            rawLayout?.camera?.projects?.leadership?.caseStudy?.target ?? null
        });
      }
      return { variant, layout, error: null };
    } catch (error) {
      const parsedError = error instanceof Error ? error : new Error(String(error));
      return { variant, layout: null, error: parsedError };
    }
  }, [variant]);
};

export default useLayoutConfig;
