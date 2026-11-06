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
// The hero's lead is the camera's: it comes in at the push into the fragment's
// content point (config/projectRouteTiming.js), as the fragment opens on to the
// case study's colour, rather than on a timer of its own.
//
// All values in milliseconds.

import { PROJECT_ROUTES } from '../config/projectRouteTiming';

const OFFSET_MS = 5;
const HERO_AT_MS = Math.round(
  PROJECT_ROUTES.projectToCaseStudy.durationMs * PROJECT_ROUTES.projectToCaseStudy.contentAt
);

export const CASE_STUDY_ENTER = Object.freeze({
  /**
   * Beat after the CTA before the case study starts arriving. Overlaps the tail
   * of the project preview copy fading out, so the two hand over rather than
   * leaving a gap.
   */
  offsetMs: OFFSET_MS,
  /** The project-colour wash fading up. */
  washMs: 840,
  /** How long after the wash starts the hero begins. */
  leadMs: HERO_AT_MS - OFFSET_MS,
  /** Per-element fade + rise. */
  itemMs: 900,
  /** Gap between consecutive hero elements. */
  staggerMs: 120,
  /** Back control, relative to the wash start: once the hero is in. */
  backMs: HERO_AT_MS - OFFSET_MS + 3 * 120 + 380,
  /** Hero elements that stagger: title, subtitle, media, intro copy. */
  itemCount: 4,
});

export const CASE_STUDY_EXIT_MS = 320;

/**
 * "Close case study": the page fades off the fragment a little longer, over
 * the first half of the camera's settle back (projectRouteTiming's
 * caseStudyToProject), and is gone by the time the project's copy returns.
 * Leaving for anywhere else keeps the quick fade.
 */
export const CASE_STUDY_RETURN_EXIT_MS = 420;

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
