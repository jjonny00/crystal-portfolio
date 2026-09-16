// src/components/ui/ProjectScrim.jsx
//
// One scrim for the whole projects zone, on mobile, where the preview copy sits
// directly on the scene with nothing between it and the crystal.
//
// A fixed viewport layer, like the About scrim in App.jsx and in the same band
// between the 3D canvas (z-index 1) and the scrollable content (z-index 10). It
// never scrolls and is never duplicated per section: it stays exactly where it
// is while the reader moves between projects, and comes back sized to the newly
// settled project's copy, tinted with that project's own background colour.
//
// It fades with the copy it grounds, on the same signal and the same timing:
// ScrollablePortfolio drops the settled section the moment a scroll starts, so
// both leave together and both return once the scroll settles.
//
// What colour it lays down, and what ink the copy over it takes, both come from
// scrimTone.js — the two are one decision and ProjectFocusSection needs the
// other half of it. Both are authored per project in data/projects.js under
// `scrim`; see that module for why they are not measured.

import React, { useEffect, useRef, useState } from 'react';
import { getScrimTone } from '../../legibility/scrimTone';

const SCRIM = {
  blurPx: 24,
  /**
   * Depth of the fade at the top, in px, independent of how tall the copy is.
   *
   * Short enough to finish inside FADE_HEADROOM_PX below, which is what keeps the
   * top of the scrim close to the title. It was 220 when the ramp was allowed to
   * run across the copy and had the whole block to disperse in; carrying that
   * length up into the headroom put the scrim's top edge most of a screen above
   * the title. The stops in SCRIM_MASK are fractions of this, so they come with
   * it.
   */
  fadePx: 96,
  /** Matches ProjectFocusSection's copy spring, so the two arrive together. */
  fadeInDelayMs: 180,
  fadeMs: 450,
  /** Height and colour crossfade when the reader settles on another project. */
  changeMs: 520,
};

// How far the copy sits above the bottom of the screen in ProjectFocusSection,
// clearing the mobile controls there. The scrim spans that gap as well as the
// copy, so the two have to agree or it would stop short of the screen edge.
const CONTENT_BOTTOM_PAD = 'calc(4.75rem + env(safe-area-inset-bottom, 0px))';

// Alpha ramp for the top edge only — below it the scrim runs at full strength to
// the bottom of the screen. Stops are written as offsets back from the top, and
// eased rather than linear, which shows a line where the blur stops. Masking is
// also what fades the blur: without it, backdrop-filter would end on a rule.
const SCRIM_MASK = (() => {
  const { fadePx } = SCRIM;
  return [
    'linear-gradient(to top',
    'rgba(0, 0, 0, 1) 0',
    `rgba(0, 0, 0, 1) calc(100% - ${fadePx}px)`,
    `rgba(0, 0, 0, 0.72) calc(100% - ${Math.round(fadePx * 0.68)}px)`,
    `rgba(0, 0, 0, 0.35) calc(100% - ${Math.round(fadePx * 0.41)}px)`,
    'rgba(0, 0, 0, 0) 100%)',
  ].join(', ');
})();

/**
 * How far the scrim reaches above the copy: a little clearance over the title, not
 * room for the whole ramp.
 *
 * SCRIM_MASK's ramp occupies the top `fadePx` of the scrim, so where the ramp ends
 * up depends entirely on this number, and there are two failures either side of it.
 *
 * Too little and the ramp runs across the whole block — the original problem: the
 * title, the subtitle AND the opening lines of body all sitting under a wash still
 * climbing to strength while everything below gets all of it, which is the top of a
 * block reading weaker than the bottom however well the opacity is solved.
 *
 * Too much — anything near fadePx, which is where this started — and the scrim's
 * top edge stands off the title by most of the ramp's length, washing a band of
 * scene that has no copy on it at all.
 *
 * So the ramp is deliberately allowed to cross the title. The title is large
 * display type in the project's own accent and carries itself; the body copy
 * underneath is the thing the scrim exists for, and at this clearance the wash is
 * at full strength by roughly the subtitle — before the first line of body, which
 * is all that was ever being asked of it.
 */
const TITLE_CLEARANCE_PX = 28;

const PROJECT_SECTION_PREFIX = 'project-';

const ProjectScrim = ({
  /** Section id the content layer has settled on, or null while scrolling. */
  settledSection = null,
  isMobile = false,
  /** Held down while a case study is open, so it cannot tint a reveal hero. */
  suppressed = false,
}) => {
  // Whether a project section is settled — the same condition that raises that
  // project's copy, so the two rise and fall together.
  const up = Boolean(settledSection && settledSection.startsWith(PROJECT_SECTION_PREFIX));

  // The project the scrim is shaped to. Latched rather than read from
  // `settledSection` directly, because that goes null the moment a scroll starts:
  // the scrim has to keep its height and colour on the way out instead of
  // collapsing and snapping to a default mid-fade.
  const [id, setId] = useState(null);
  useEffect(() => {
    if (up) setId(settledSection.slice(PROJECT_SECTION_PREFIX.length));
  }, [up, settledSection]);

  // Measured against the copy, and tagged with whose copy it is — a height from
  // the previous project would show for a frame as the scrim comes back up.
  // Observed rather than read once, so it survives a rotation, a resize, or the
  // webfont landing after first paint.
  const [measured, setMeasured] = useState({ id: null, height: 0 });
  useEffect(() => {
    if (!isMobile || !id) return undefined;

    const node = document.querySelector(`[data-project-copy="${id}"]`);
    if (!node) return undefined;

    const measure = () => setMeasured({ id, height: node.getBoundingClientRect().height });
    measure();

    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [isMobile, id]);

  // Whether the scrim was on screen last commit, recorded after paint so the
  // render below always reads the previous one.
  const wasVisibleRef = useRef(false);
  const shaped = measured.id === id && measured.height > 0;
  const visible = up && !suppressed && shaped;
  useEffect(() => {
    wasVisibleRef.current = visible;
  });

  if (!isMobile || !id) return null;

  const tone = getScrimTone(id);
  // Height only animates between two visible states, which in practice means a
  // resize. Moving between projects happens while the scrim is down, so it comes
  // back at the new size rather than growing into it under the fade.
  const animateHeight = wasVisibleRef.current && visible;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        // No z-index — see the canvas wrapper in Fixed3DCanvas.jsx. This sits
        // after the canvas and before the content in App's tree, which is the
        // order it needs, and staying out of the stacking order keeps the layers
        // able to blend against each other.
        pointerEvents: 'none',
        // Capped at the viewport so the ramp always has its fadePx on screen: past
        // that the top of the scrim is above the fold, the fade goes with it, and
        // what is left is a full-strength wash meeting the top edge on a hard line.
        // svh rather than vh for the usual mobile reason — vh is the tallest the
        // viewport ever gets, so the scrim would overshoot while the browser chrome
        // is showing.
        height: `min(100svh, calc(${Math.round(measured.height)}px + ${TITLE_CLEARANCE_PX}px + ${CONTENT_BOTTOM_PAD}))`,
        backgroundColor: tone.wash,
        backdropFilter: `blur(${SCRIM.blurPx}px)`,
        WebkitBackdropFilter: `blur(${SCRIM.blurPx}px)`,
        maskImage: SCRIM_MASK,
        WebkitMaskImage: SCRIM_MASK,
        opacity: visible ? 1 : 0,
        // Taken out of compositing once it has faded, rather than left as an
        // invisible full-width backdrop-filter layer for the rest of the visit.
        visibility: visible ? 'visible' : 'hidden',
        // Delayed on the way in and immediate on the way out — the same shape as
        // the copy's own spring in ProjectFocusSection, so they move as one.
        transition: [
          `opacity ${SCRIM.fadeMs}ms ease${visible ? ` ${SCRIM.fadeInDelayMs}ms` : ''}`,
          animateHeight ? `height ${SCRIM.changeMs}ms cubic-bezier(0.2, 0.7, 0.2, 1)` : `height 0s`,
          `background-color ${SCRIM.changeMs}ms ease`,
          `visibility 0s linear ${visible ? 0 : SCRIM.fadeMs}ms`,
        ].join(', '),
      }}
    />
  );
};

export default ProjectScrim;
