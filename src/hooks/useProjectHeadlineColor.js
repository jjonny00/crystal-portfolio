// src/hooks/useProjectHeadlineColor.js
// Updated: Subscribe to animation controller state for headline colors

import { useEffect } from 'react';
import { deriveGlowFromBase } from '../utils/color';
import { getProjectHeadlineColorByFacetKey } from '../data/projects';

// Default headline color when no project is focused
const DEFAULT_HEADLINE_COLOR = '#6200ff';

// Static colors for non-project zones
const ZONE_HEADLINE_COLORS = {
  hero: '#fff6ae',
};

/**
 * Apply headline colors based on animation controller state.
 * @param {object} animationState - State object from useUnifiedAnimationController
 */
export default function useProjectHeadlineColor(animationState) {
  useEffect(() => {
    if (!animationState) return;

    const root = document.documentElement;

    // Helper to apply color values to CSS variables
    const apply = (hex, source = 'unknown') => {
      if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
        if (import.meta.env.DEV) console.warn('🎨 Invalid hex color:', hex, 'from source:', source);
        return;
      }

      const { glow1, glow2 } = deriveGlowFromBase(hex);

      root.style.setProperty('--headline-ink', hex);
      root.style.setProperty('--headline-glow1', glow1);
      root.style.setProperty('--headline-glow2', glow2);

      if (import.meta.env.DEV) {
        console.log('🎨 Applied headline color:', { source, ink: hex, glow1, glow2 });
      }
    };

    // Determine color from focused facet
    const facet = animationState.focusedFacet;
    if (facet) {
      const projectColor = getProjectHeadlineColorByFacetKey(facet);
      if (projectColor) {
        apply(projectColor, `facet ${facet}`);
        return;
      }
    }

    // Use zone color when no project is focused
    const zone = animationState.state;
    const zoneColor = ZONE_HEADLINE_COLORS[zone];
    if (zoneColor) {
      apply(zoneColor, `zone ${zone}`);
      return;
    }

    // Fallback to default when no facet or zone color
    apply(DEFAULT_HEADLINE_COLOR, 'default');
  }, [animationState?.focusedFacet, animationState?.state]);
}

