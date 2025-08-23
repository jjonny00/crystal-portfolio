// src/hooks/useProjectHeadlineColor.js
// FIXED: Enhanced version with better debugging and color application

import { useEffect } from 'react';
import { deriveGlowFromBase } from '../utils/color';
import { getProjectColorByFacetKey } from '../data/projects';

// Default headline color
const DEFAULT_HEADLINE_COLOR = '#6200ff';

export default function useProjectHeadlineColor() {
  useEffect(() => {
    const root = document.documentElement;
    
    // Helper to apply colors with validation and logging
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
        console.log('🎨 Applied headline color:', {
          source,
          ink: hex,
          glow1,
          glow2
        });
      }
    };

    // Set initial default color
    apply(DEFAULT_HEADLINE_COLOR, 'initial default');

    // Look for sections that should trigger color changes
    const sections = Array.from(document.querySelectorAll('.project, [data-headline-color]'));
    
    if (!sections.length) {
      if (import.meta.env.DEV) console.warn('🎨 No sections found with .project class or data-headline-color attribute');
      return;
    }

    if (import.meta.env.DEV) console.log('🎨 Found sections for headline colors:', sections.map(s => ({
      id: s.id,
      classes: s.className,
      explicitColor: s.getAttribute('data-headline-color')
    })));

    const observer = new IntersectionObserver((entries) => {
      // Find entries that are currently visible
      const visible = entries.filter(e => e.isIntersecting);

      if (visible.length === 0) {
        if (import.meta.env.DEV) console.log('🎨 No sections intersecting, keeping current color');
        return;
      }

      const viewportCenter = window.innerHeight / 2;

      // Pick the section whose center is closest to the viewport center
      visible.sort((a, b) => {
        const aRect = a.target.getBoundingClientRect();
        const bRect = b.target.getBoundingClientRect();
        const aCenter = aRect.top + aRect.height / 2;
        const bCenter = bRect.top + bRect.height / 2;
        return Math.abs(aCenter - viewportCenter) - Math.abs(bCenter - viewportCenter);
      });

      const targetEntry = visible[0];
      const section = targetEntry.target;

      if (import.meta.env.DEV) {
        console.log('🎨 Centered section:', {
          id: section.id,
          classes: section.className,
          intersectionRatio: targetEntry.intersectionRatio
        });
      }
      
      let hex = null;
      let source = 'unknown';
      
      // First, check for explicit data-headline-color
      const explicitColor = section.getAttribute('data-headline-color');
      if (explicitColor) {
        hex = explicitColor;
        source = `data-headline-color on ${section.id}`;
      }
      
      // If no explicit color, try to get from project data using section ID
      if (!hex) {
        const sectionId = section.id;
        if (import.meta.env.DEV) console.log('🎨 Checking section ID for project mapping:', sectionId);
        
        // Try different patterns to extract facet key
        let facetKey = null;
        
        if (sectionId === 'hero') {
          // Hero section - use default or check for explicit color
          hex = DEFAULT_HEADLINE_COLOR;
          source = 'hero section default';
        } else if (sectionId === 'projects-overview') {
          // Projects overview - could use a special color or default
          hex = '#bb86fc'; // Purple for overview
          source = 'projects overview';
        } else if (sectionId && sectionId.startsWith('project-')) {
          // Individual project section: "project-empathy" -> "empathy"
          facetKey = sectionId.replace('project-', '');
        } else if (sectionId && ['empathy', 'narrative', 'craft', 'system', 'leadership', 'exploration'].includes(sectionId)) {
          // Direct facet key
          facetKey = sectionId;
        }
        
        if (facetKey) {
          const projectColor = getProjectColorByFacetKey(facetKey);
          if (projectColor) {
            hex = projectColor;
            source = `project ${facetKey}`;
          }
        }
      }
      
      // Apply the color, or fall back to default
      if (hex) {
        apply(hex, source);
      } else {
        if (import.meta.env.DEV) console.warn('🎨 No color found for section:', section.id, 'using default');
        apply(DEFAULT_HEADLINE_COLOR, 'fallback default');
      }
    }, { 
      rootMargin: '0px 0px -40% 0px', 
      threshold: [0, 0.25, 0.5, 0.75, 1] 
    });

    // Observe all sections
    sections.forEach(section => {
      observer.observe(section);
      if (import.meta.env.DEV) console.log('🎨 Observing section:', section.id);
    });

    // Cleanup
    return () => {
      observer.disconnect();
      if (import.meta.env.DEV) console.log('🎨 Disconnected headline color observer');
    };
  }, []);
}
