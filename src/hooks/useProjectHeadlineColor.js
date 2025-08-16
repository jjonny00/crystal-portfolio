// src/hooks/useProjectHeadlineColor.js
// Observes project sections and updates headline glow colors

import { useEffect } from 'react';
import { deriveGlowFromBase } from '../utils/color';
import { getProjectColorByFacetKey } from '../data/projects';

// Default headline color - you can change this
const DEFAULT_HEADLINE_COLOR = '#64ffda';

export default function useProjectHeadlineColor(){
  useEffect(() => {
    const root = document.documentElement;
    
    const apply = (hex) => {
      if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return;
      const { glow1, glow2 } = deriveGlowFromBase(hex);
      root.style.setProperty('--headline-ink', hex);
      root.style.setProperty('--headline-glow1', glow1);
      root.style.setProperty('--headline-glow2', glow2);
    };

    // Set initial default color
    apply(DEFAULT_HEADLINE_COLOR);

    // Look for both .project sections (for facet-based colors) and sections with explicit data-headline-color
    const sections = Array.from(document.querySelectorAll('.project, [data-headline-color]'));
    if (!sections.length) return;

    const io = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a,b) => Math.abs(0.5 - a.intersectionRatio) - Math.abs(0.5 - b.intersectionRatio));

      if (visible[0]) {
        const section = visible[0].target;
        
        // First, check for explicit data-headline-color
        let hex = section.getAttribute('data-headline-color');
        
        // If no explicit color, try to get from project data using section ID
        if (!hex) {
          const sectionId = section.id;
          
          // Extract facet key from section ID (e.g., "project-empathy" -> "empathy")
          const facetKey = sectionId.replace('project-', '');
          
          // Get color from projects.js
          hex = getProjectColorByFacetKey(facetKey);
        }
        
        // Apply the color, or fall back to default
        if (hex) {
          apply(hex);
        } else {
          apply(DEFAULT_HEADLINE_COLOR);
        }
      }
    }, { 
      rootMargin: '0px 0px -40% 0px', 
      threshold: [0, 0.25, 0.5, 0.75, 1] 
    });

    sections.forEach(s => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Export the default color for use elsewhere if needed
  return { DEFAULT_HEADLINE_COLOR };
}