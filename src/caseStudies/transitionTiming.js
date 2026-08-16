// src/caseStudies/transitionTiming.js
//
// Single source of truth for the case-study enter/exit choreography.
//
// These numbers are consumed in three places that must not drift apart:
//   - CaseStudyOverlay.jsx  — the colour wash transition and the phase machine
//   - system/caseStudy.css  — the staggered content animations, via CSS custom
//                             properties the overlay publishes from here
//   - App.jsx               — when the 3D scene is safe to freeze, which cannot
//                             happen until the overlay is fully opaque
//
// All values in milliseconds.

export const CASE_STUDY_ENTER = Object.freeze({
  /**
   * Beat after the CTA before the case study starts arriving. Long enough for
   * the project preview copy to clear out first, short enough not to stall.
   */
  offsetMs: 700,
  /** The project-colour wash fading up. */
  washMs: 840,
  /** How long after the wash starts the hero begins. */
  leadMs: 760,
  /** Per-element fade + rise. */
  itemMs: 1120,
  /** Gap between consecutive hero elements. */
  staggerMs: 180,
  /** Back control, relative to the wash start. */
  backMs: 1640,
  /** Hero elements that stagger: title, subtitle, media, intro copy. */
  itemCount: 4,
});

export const CASE_STUDY_EXIT_MS = 320;

/** When the layer first becomes fully opaque. */
export const caseStudyOpaqueAtMs =
  CASE_STUDY_ENTER.offsetMs + CASE_STUDY_ENTER.washMs;

/** When the last hero element has finished arriving. */
export const caseStudyEnterTotalMs =
  CASE_STUDY_ENTER.offsetMs +
  CASE_STUDY_ENTER.leadMs +
  (CASE_STUDY_ENTER.itemCount - 1) * CASE_STUDY_ENTER.staggerMs +
  CASE_STUDY_ENTER.itemMs;

/**
 * Published onto the overlay element so the stylesheet composes its delays from
 * the same numbers rather than a second copy of them.
 */
export const caseStudyEnterCssVars = Object.freeze({
  '--cs-enter-offset': `${CASE_STUDY_ENTER.offsetMs}ms`,
  '--cs-enter-wash': `${CASE_STUDY_ENTER.washMs}ms`,
  '--cs-enter-lead': `${CASE_STUDY_ENTER.leadMs}ms`,
  '--cs-enter-item': `${CASE_STUDY_ENTER.itemMs}ms`,
  '--cs-enter-stagger': `${CASE_STUDY_ENTER.staggerMs}ms`,
  '--cs-enter-back': `${CASE_STUDY_ENTER.backMs}ms`,
});
