// src/caseStudies/CaseStudyOverlay.jsx
//
// Mounts a case study over the portfolio. It is a self-contained scrolling
// layer: the crystal scene, the scroll-driven camera, and the project sections
// underneath keep their state untouched, so closing a case study returns the
// reader exactly where they were.
//
// Sits below the top navigation (z-index 10000) so the site nav stays usable
// and visible, matching the reference designs.
//
// Entry runs in two beats: the project colour washes up first (a plain backdrop
// that is present before the lazily-loaded case study arrives), then the hero
// content fades in on a stagger. Exit fades the whole layer out, revealing the
// crystal — which has already resumed rendering by then.

import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { getCaseStudyEntry, hasCaseStudy, loadCaseStudy } from './registry';
import {
  backgroundColorForTone,
  normalizeCaseStudyColors,
} from './system/caseStudyTheme';
import {
  CASE_STUDY_ENTER,
  CASE_STUDY_EXIT_MS,
  caseStudyEnterCssVars,
  caseStudyOpaqueAtMs,
} from './transitionTiming';

// Exported so the nav scrim can be placed between this layer and the nav — it
// has to blur the case study's content without blurring the bar it sits under.
export const OVERLAY_Z_INDEX = 9000;

// Vertical probe point used to work out which section tone the fixed top nav is
// sitting on, so the nav can recolour itself for contrast.
const NAV_PROBE_Y = 44;

// A section that shows the scene through it keeps the renderer awake this far
// outside the viewport, so the crystal is already drawing by the time it scrolls
// back into view rather than thawing into an empty frame.
const SCENE_KEEPALIVE_MARGIN = 240;

// React.lazy components must be stable across renders or the tree remounts on
// every parent update; cache one per slug.
const lazyComponentCache = new Map();

const getLazyCaseStudy = (slug) => {
  if (!lazyComponentCache.has(slug)) {
    lazyComponentCache.set(
      slug,
      lazy(() => loadCaseStudy(slug))
    );
  }
  return lazyComponentCache.get(slug);
};

const CaseStudyOverlay = ({
  project,
  open = false,
  onClose,
  onToneChange = null,
  /** Reports whether any on-screen section is showing the 3D scene through it. */
  onSceneNeededChange = null,
}) => {
  const scrollRef = useRef(null);
  const slug = project?.caseStudySlug || null;
  const supported = hasCaseStudy(slug);
  const entryMode = getCaseStudyEntry(slug);

  // 'closed' -> 'entering' -> 'open' -> 'exiting' -> 'closed'. The exit phase is
  // why closing cannot just unmount: the layer has to stay up while it fades.
  const [phase, setPhase] = useState('closed');
  const [backdropUp, setBackdropUp] = useState(false);

  const colors = useMemo(
    () => normalizeCaseStudyColors(project?.caseStudyColors),
    [project?.caseStudyColors]
  );
  // Case study heroes are tone "a", so the wash that precedes the content is the
  // hero's own background — the seam between them is invisible.
  const entryColor = backgroundColorForTone('a', colors);

  // Drive the phase from `open`. Reopening mid-exit picks the layer back up
  // rather than waiting for it to finish disappearing.
  useEffect(() => {
    if (open && supported) {
      if (phase === 'closed' || phase === 'exiting') setPhase('entering');
    } else if (phase === 'entering' || phase === 'open') {
      setPhase('exiting');
    }
  }, [open, supported, phase]);

  useEffect(() => {
    if (phase !== 'exiting') return undefined;
    const timeoutId = setTimeout(() => setPhase('closed'), CASE_STUDY_EXIT_MS);
    return () => clearTimeout(timeoutId);
  }, [phase]);

  // Raise the colour wash one frame after mount so the transition has a 0 -> 1
  // to animate rather than starting at its end state.
  useEffect(() => {
    if (phase === 'closed') {
      setBackdropUp(false);
      return undefined;
    }
    if (phase !== 'entering') return undefined;

    const frameId = requestAnimationFrame(() => setBackdropUp(true));
    const timeoutId = setTimeout(() => setPhase('open'), caseStudyOpaqueAtMs);
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
    };
  }, [phase]);

  const mounted = phase !== 'closed';
  const exiting = phase === 'exiting';

  // Every open starts at the top of the case study, regardless of where the
  // reader left the previous one.
  useEffect(() => {
    if (phase === 'entering') {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [phase, slug]);

  // Report the tone under the top nav so it can stay legible over both the
  // light and dark sections. The mutation observer covers the first paint after
  // the lazily-loaded case study mounts; `null` on unmount hands the nav back to
  // its normal portfolio treatment, but not until the layer has finished fading.
  useEffect(() => {
    const node = scrollRef.current;
    if (!mounted || !node) return undefined;

    const updateTone = () => {
      if (!onToneChange) return;
      const sections = node.querySelectorAll('.cs-section[data-tone]');
      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= NAV_PROBE_Y && rect.bottom > NAV_PROBE_Y) {
          onToneChange(section.dataset.tone);
          return;
        }
      }
      // Nothing to probe yet — the case study chunk has not mounted, so what
      // the nav is sitting on is the colour wash, which is the hero's tone.
      onToneChange('a');
    };

    // Sections that paint no background of their own show the crystal through
    // them, so the scene has to keep rendering while any of them is near the
    // viewport — freezing it would leave a hole where the scene should be.
    const updateSceneNeed = () => {
      if (!onSceneNeededChange) return;
      const transparent = node.querySelectorAll('.cs-section[data-surface="none"]');
      const viewportHeight = window.innerHeight;
      for (const section of transparent) {
        const rect = section.getBoundingClientRect();
        if (
          rect.bottom > -SCENE_KEEPALIVE_MARGIN &&
          rect.top < viewportHeight + SCENE_KEEPALIVE_MARGIN
        ) {
          onSceneNeededChange(true);
          return;
        }
      }
      onSceneNeededChange(false);
    };

    const update = () => {
      updateTone();
      updateSceneNeed();
    };

    update();
    node.addEventListener('scroll', update, { passive: true });
    const observer = new MutationObserver(update);
    observer.observe(node, { childList: true, subtree: true });

    return () => {
      node.removeEventListener('scroll', update);
      observer.disconnect();
      onToneChange?.(null);
      onSceneNeededChange?.(false);
    };
  }, [mounted, onToneChange, onSceneNeededChange, slug]);

  if (!mounted || !supported) return null;

  const CaseStudy = getLazyCaseStudy(slug);

  return (
    <div
      ref={scrollRef}
      className="cs-overlay"
      data-case-study={slug}
      data-phase={phase}
      data-entry={entryMode}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: OVERLAY_Z_INDEX,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        // Exit fades the layer as a whole. `.cs-overlay` is viewport-sized and
        // already fixed, so becoming a containing block mid-fade does not move
        // the fixed back button inside it.
        opacity: exiting ? 0 : 1,
        transition: `opacity ${CASE_STUDY_EXIT_MS}ms ease`,
        pointerEvents: exiting ? 'none' : 'auto',
        // The stylesheet composes its stagger from these, so the CSS and the
        // phase machine can never disagree about the timing.
        ...caseStudyEnterCssVars,
      }}
    >
      {/* The colour wash. Inline-styled on purpose: it has to be paintable
          before the case study chunk (and its stylesheet) has loaded. Omitted in
          reveal mode, where the point is that nothing covers the scene. */}
      {entryMode !== 'reveal' && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: entryColor,
            opacity: backdropUp ? 1 : 0,
            transition: `opacity ${CASE_STUDY_ENTER.washMs}ms ease-out ${CASE_STUDY_ENTER.offsetMs}ms`,
            pointerEvents: 'none',
          }}
        />
      )}

      <Suspense fallback={null}>
        <CaseStudy project={project} onClose={onClose} />
      </Suspense>
    </div>
  );
};

export default CaseStudyOverlay;
