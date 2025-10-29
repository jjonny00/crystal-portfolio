import { useEffect } from 'react';

const DEFAULT_VARIABLE = '--app-viewport-height';
const UPDATE_EVENTS = ['resize', 'orientationchange'];

export function useDynamicViewportHeightVariable({
  cssVariable = DEFAULT_VARIABLE,
  includeBody = true,
  roundTo = 1000
} = {}) {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

    const root = document.documentElement;
    if (!root) {
      return undefined;
    }

    const applyViewportHeight = () => {
      const viewport = window.visualViewport;
      let height = viewport?.height;

      if (!height || !Number.isFinite(height)) {
        height = window.innerHeight;
      }

      if (!height || !Number.isFinite(height)) {
        height = root.clientHeight || document.body?.clientHeight;
      }

      if (!height || !Number.isFinite(height)) {
        return;
      }

      const roundedHeight = roundTo
        ? Math.round(height * roundTo) / roundTo
        : height;

      const heightValue = `${roundedHeight}px`;
      root.style.setProperty(cssVariable, heightValue);

      if (includeBody && document.body) {
        document.body.style.setProperty(cssVariable, heightValue);
      }
    };

    applyViewportHeight();

    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', applyViewportHeight);
    viewport?.addEventListener('scroll', applyViewportHeight);
    UPDATE_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, applyViewportHeight);
    });

    return () => {
      viewport?.removeEventListener('resize', applyViewportHeight);
      viewport?.removeEventListener('scroll', applyViewportHeight);
      UPDATE_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, applyViewportHeight);
      });

      root.style.removeProperty(cssVariable);
      if (includeBody && document.body) {
        document.body.style.removeProperty(cssVariable);
      }
    };
  }, [cssVariable, includeBody, roundTo]);
}

export default useDynamicViewportHeightVariable;
