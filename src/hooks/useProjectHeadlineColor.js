// src/hooks/useProjectHeadlineColor.js
// FIXED: Enhanced version with better debugging and color application

import { useEffect, useRef } from 'react';
import { deriveGlowFromBase } from '../utils/color';
import { getProjectColorByFacetKey } from '../data/projects';

// Default headline color
const DEFAULT_HEADLINE_COLOR = '#6200ff';

export default function useProjectHeadlineColor() {
  const scrollDirection = useRef('down');
  const lastScrollProgress = useRef(0);

  useEffect(() => {
    const root = document.documentElement;

    // Helper to apply colors (keep existing)
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
        console.log('🎨 Applied headline color:', { source, ink: hex });
      }
    };

    // Set initial default color
    apply(DEFAULT_HEADLINE_COLOR, 'initial default');

    // SYNC WITH ANIMATION CONTROLLER: Listen for scroll events on the same container
    const container = document.querySelector('.scroll-container');
    if (!container) {
      if (import.meta.env.DEV) console.error('🎨 Scroll container not found for headline colors');
      return;
    }

    const handleScroll = () => {
      // USE SAME CALCULATION AS ANIMATION CONTROLLER
      const scrollTop = container.scrollTop;
      const maxScroll = Math.max(container.scrollHeight - container.clientHeight, 1);
      const scrollProgress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);

      // Detect scroll direction
      if (scrollProgress > lastScrollProgress.current) {
        scrollDirection.current = 'down';
      } else if (scrollProgress < lastScrollProgress.current) {
        scrollDirection.current = 'up';
      }

      // Add small offset when scrolling up to prevent premature color changes
      let adjustedProgress = scrollProgress;
      if (scrollDirection.current === 'up') {
        adjustedProgress = scrollProgress + 0.01; // 1% hysteresis when scrolling up
      }

      // USE SAME PROJECT DETECTION LOGIC AS ANIMATION CONTROLLER
      const projectSections = {
        empathy:    { start: 0.24,   end: 0.3433 },
        narrative:  { start: 0.3433, end: 0.4466 },
        craft:      { start: 0.4466, end: 0.5499 },
        system:     { start: 0.5499, end: 0.6533 },
        leadership: { start: 0.6533, end: 0.7566 },
        exploration:{ start: 0.7566, end: 0.875 }
      };

      let activeProject = null;
      let targetColor = DEFAULT_HEADLINE_COLOR;
      let source = 'default';

      // Check zones first
      if (adjustedProgress <= 0.12) {
        // Hero zone
        targetColor = '#fff6ae'; // From HeroSection data-headline-color
        source = 'hero section';
      } else if (adjustedProgress <= 0.24) {
        // Overview zone  
        targetColor = '#bb86fc'; // Purple for overview
        source = 'overview section';
      } else if (adjustedProgress <= 0.875) {
        // Projects zone - find active project
        for (const [projectKey, section] of Object.entries(projectSections)) {
          if (adjustedProgress >= section.start && adjustedProgress < section.end) {
            activeProject = projectKey;
            break;
          }
        }

        if (activeProject) {
          const projectColor = getProjectColorByFacetKey(activeProject);
          if (projectColor) {
            targetColor = projectColor;
            source = `project ${activeProject}`;
          }
        }
      } else {
        // About zone
        targetColor = '#64ffda'; // Default about color
        source = 'about section';
      }

      apply(targetColor, source);
      lastScrollProgress.current = scrollProgress;
    };

    // THROTTLE: Limit updates to 60fps to match animation system
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Listen to same scroll events as animation controller
    container.addEventListener('scroll', throttledScroll, { passive: true });

    // Initial calculation
    handleScroll();

    // Cleanup
    return () => {
      container.removeEventListener('scroll', throttledScroll);
    };
  }, []);
}
