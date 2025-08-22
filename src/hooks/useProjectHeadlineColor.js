// src/hooks/useProjectHeadlineColor.js
// Rewritten: sync headline colors directly from scroll progress

import { useEffect } from 'react';
import { deriveGlowFromBase } from '../utils/color';
import { getProjectColorByFacetKey } from '../data/projects';
import { ANIMATION_CONFIG, calculateActiveProject } from './useUnifiedAnimationController';

const DEFAULT_HEADLINE_COLOR = '#6200ff';

export default function useProjectHeadlineColor(scrollProgress = 0) {
  useEffect(() => {
    const root = document.documentElement;
    const { project } = calculateActiveProject(scrollProgress, ANIMATION_CONFIG);

    let hex = DEFAULT_HEADLINE_COLOR;
    let source = 'default';

    if (project) {
      const projectColor = getProjectColorByFacetKey(project);
      if (projectColor) {
        hex = projectColor;
        source = `project ${project}`;
      }
    }

    const { glow1, glow2 } = deriveGlowFromBase(hex);
    root.style.setProperty('--headline-ink', hex);
    root.style.setProperty('--headline-glow1', glow1);
    root.style.setProperty('--headline-glow2', glow2);

    if (import.meta.env.DEV) {
      console.log('🎨 Headline color update:', {
        source,
        ink: hex,
        scrollProgress: scrollProgress.toFixed(3),
        project
      });
    }
  }, [scrollProgress]);
}
