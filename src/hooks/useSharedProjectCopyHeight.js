// src/hooks/useSharedProjectCopyHeight.js
//
// Gives every desktop project preview's copy block the height of the tallest, as
// --project-copy-height on the scroll container (ProjectFocusSection reads it).
// Each block is centred in its section, so with one height they all start at the
// same place: the titles sit at one height and the CTAs at another, project to
// project.
//
// Measured, because the tallest depends on how the copy wraps at this width, and
// re-measured when that can change: a resize, the webfont landing.
//
// A block's own height is what it would be without the shared one: the spacer
// above its CTA grows to fill the shared height, so taking off what the spacer
// has grown past its basis leaves the copy's own.

import { useEffect } from 'react';

const VAR = '--project-copy-height';

const naturalHeight = (block) => {
  const spacer = block.querySelector('[data-project-copy-spacer]');
  if (!spacer) return block.offsetHeight;
  const basis = parseFloat(getComputedStyle(spacer).flexBasis) || 0;
  return block.offsetHeight - (spacer.offsetHeight - basis);
};

const useSharedProjectCopyHeight = (containerRef, enabled) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    if (!enabled) {
      container.style.removeProperty(VAR);
      return undefined;
    }

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const blocks = container.querySelectorAll('[data-project-copy]');
        if (!blocks.length) return;
        const tallest = Math.ceil(Math.max(...Array.from(blocks, naturalHeight)));
        const next = `${tallest}px`;
        // Unchanged, left alone: setting it resizes the blocks, which brings the
        // observer below straight back here.
        if (container.style.getPropertyValue(VAR) !== next) container.style.setProperty(VAR, next);
      });
    };

    measure();
    // The blocks change size when their copy rewraps (the column is a share of
    // the viewport's width) and when the face lands.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    container.querySelectorAll('[data-project-copy]').forEach((block) => observer?.observe(block));
    document.fonts?.ready.then(measure);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [containerRef, enabled]);
};

export default useSharedProjectCopyHeight;
