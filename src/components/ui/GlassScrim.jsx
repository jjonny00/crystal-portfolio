// src/components/ui/GlassScrim.jsx
//
// The mobile glass panel the overview list and every project's preview copy sit
// on. Replaces ProjectScrim, which faded a masked wash in and out per project.
//
// One fixed element for the whole stretch from the overview to the last project.
// It comes up once the overview (or a project) settles and then stays: moving
// between those sections never fades it, it resizes to whatever copy is coming
// next and retints to that project, starting as soon as the scroll passes the
// halfway mark, so it changes shape during the camera move rather than after.
// It only fades out once the scroll heads for a section outside that stretch
// (the hero or About), or while a case study covers everything.
//
// Sits in App's tree between the canvas and the content, with no z-index — see
// the canvas wrapper in Fixed3DCanvas.jsx. The overview labels are in their own
// fixed layer above it, and the vertical energy line paints over it.
//
// Performance:
//   • The panel is always a full-viewport box, and its height is a translateY
//     (`100% - reach`), so resizing runs on the compositor. Animating `height`
//     would run on the main thread, which the WebGL scene keeps busy.
//   • No mask. The old scrim's feathered top was a mask over a backdrop-filter,
//     the most expensive combination; the glass has a hard edge instead.
//   • The low tier drops the blur entirely for a stronger tint (`lowPower`).
//   • Out of compositing (visibility: hidden) whenever it's faded out.

import React, { useEffect, useRef, useState } from 'react';
import { getScrimTone } from '../../legibility/scrimTone';

const GLASS = {
  blurPx: 30,
  /** The 1px light line along the top edge. */
  hairline: 'rgba(255, 255, 255, 0.4)',
  /**
   * The darker band under the edge, as if the glass had thickness. Measured off
   * the mockups: ~28% darker at the edge, eased out over roughly 64px.
   */
  edgeShade: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.28) 0, rgba(0, 0, 0, 0.12) 22px, rgba(0, 0, 0, 0) 64px)',
  /** Space between the panel's top edge and the top of the copy on it. */
  topPadPx: 23,
  resizeMs: 700,
  resizeEase: 'cubic-bezier(0.22, 0.8, 0.24, 1)',
  /** Matches ProjectFocusSection's copy spring, so the two arrive together. */
  fadeInDelayMs: 180,
  fadeMs: 450,
  /** Extra tint opacity when the blur is off, so the copy still has a ground. */
  lowPowerAlphaBoost: 0.25,
};

/** The overview's own tint: a cool lift, not a project colour. */
const OVERVIEW_TINT = { rgb: [200, 214, 255], opacity: 0.22 };

const PROJECT_PREFIX = 'project-';
const inStretch = (id) => id === 'overview' || Boolean(id && id.startsWith(PROJECT_PREFIX));

const findContent = (key) => (key === 'overview'
  ? document.querySelector('[data-rail-list]')
  : document.querySelector(`[data-project-copy="${key.slice(PROJECT_PREFIX.length)}"]`));

/**
 * How far the panel has to reach up from the bottom of the screen to sit under
 * this copy: from the top of the copy to the bottom of the full-height frame it
 * is laid out in (its section, or the overview's fixed label layer). Read
 * against the frame rather than the viewport so it holds wherever the section
 * currently is in the scroll.
 */
const measureReach = (node) => {
  const frame = node.closest('.scroll-section') || node.parentElement;
  if (!frame) return 0;
  return frame.getBoundingClientRect().bottom - node.getBoundingClientRect().top;
};

// Last reach measured per section. The overview list only exists while the
// overview is active, so on the way back to it from a project this is what the
// panel resizes to; it's remeasured as soon as the list mounts.
const reachCache = new Map();

const GlassScrim = ({
  /** Section the content layer has settled on, or null while scrolling. */
  settledSection = null,
  /** Section nearest the middle of the screen, live during a scroll. */
  nearestSection = null,
  isMobile = false,
  /** Held down while a case study is open. */
  suppressed = false,
  /** Low performance tier: no blur, stronger tint. */
  lowPower = false,
}) => {
  // Up once the overview or a project settles; down only once the scroll heads
  // for the hero or About.
  const [up, setUp] = useState(false);
  useEffect(() => {
    if (inStretch(settledSection)) setUp(true);
    else if (!inStretch(nearestSection)) setUp(false);
  }, [settledSection, nearestSection]);

  // The section the panel is shaped and tinted for. Follows the scroll's
  // destination, and is latched so the panel keeps its shape while fading out.
  const liveKey = inStretch(nearestSection) ? nearestSection : (inStretch(settledSection) ? settledSection : null);
  const [shapeKey, setShapeKey] = useState(null);
  useEffect(() => {
    if (liveKey) setShapeKey(liveKey);
  }, [liveKey]);

  // Every project's copy is in the DOM from the start, so measure them all as
  // the panel first comes up. Moving between projects then resizes straight from
  // the cache, in the same render the destination changes.
  useEffect(() => {
    if (!isMobile || !up) return;
    document.querySelectorAll('[data-project-copy]').forEach((node) => {
      const px = measureReach(node);
      if (px > 0) reachCache.set(`${PROJECT_PREFIX}${node.dataset.projectCopy}`, px);
    });
  }, [isMobile, up]);

  // Live measurement of the current section's copy: catches the webfont landing,
  // a rotation or a resize, and the overview list mounting for the first time.
  const [reach, setReach] = useState({ key: null, px: 0 });
  useEffect(() => {
    if (!isMobile || !shapeKey) return undefined;

    let resizeObserver = null;
    let mountObserver = null;
    let node = null;

    const measure = () => {
      if (!node || !node.isConnected) return;
      const px = measureReach(node);
      if (px > 0) {
        reachCache.set(shapeKey, px);
        setReach({ key: shapeKey, px });
      }
    };

    const attach = (found) => {
      node = found;
      measure();
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(node);
      }
    };

    const found = findContent(shapeKey);
    if (found) {
      attach(found);
    } else if (typeof MutationObserver !== 'undefined') {
      // The overview list mounts in its own React root once the overview is
      // active; watch for it only until it turns up.
      mountObserver = new MutationObserver(() => {
        const appeared = findContent(shapeKey);
        if (!appeared) return;
        mountObserver.disconnect();
        mountObserver = null;
        attach(appeared);
      });
      mountObserver.observe(document.body, { childList: true, subtree: true });
    }

    window.addEventListener('resize', measure);
    return () => {
      resizeObserver?.disconnect();
      mountObserver?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [isMobile, shapeKey]);

  // Whether the panel was on screen last commit, recorded after paint. A resize
  // only animates between two visible states; coming up from hidden, it should
  // already be the right size.
  const wasVisibleRef = useRef(false);

  // The height for this render: the live measurement if it's for this section,
  // else the cached one. With neither (a section never measured yet), a panel
  // that's already up holds its current height until the measurement lands,
  // rather than dropping out; one coming up waits for it.
  const cachedPx = shapeKey ? reachCache.get(shapeKey) : undefined;
  const current = reach.key === shapeKey;
  const reachPx = current ? reach.px : (cachedPx ?? reach.px);
  const shaped = reachPx > 0 && (current || cachedPx != null || wasVisibleRef.current);
  const visible = isMobile && up && !suppressed && shaped;

  useEffect(() => {
    wasVisibleRef.current = visible;
  });

  if (!isMobile || !shapeKey) return null;

  const tone = shapeKey === 'overview'
    ? OVERVIEW_TINT
    : getScrimTone(shapeKey.slice(PROJECT_PREFIX.length));
  const alpha = Math.min(0.9, tone.opacity + (lowPower ? GLASS.lowPowerAlphaBoost : 0));
  const tint = `rgba(${tone.rgb.join(', ')}, ${alpha})`;
  // Capped at the viewport so the top edge never leaves the screen.
  const panelPx = Math.round(Math.min(reachPx + GLASS.topPadPx, window.innerHeight));
  const animateResize = wasVisibleRef.current && visible;
  const blur = lowPower ? 'none' : `blur(${GLASS.blurPx}px)`;

  return (
    <div
      aria-hidden="true"
      data-glass-scrim=""
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        // Full-viewport box moved down so `panelPx` of it shows.
        transform: `translate3d(0, calc(100% - ${panelPx}px), 0)`,
        borderTop: `1px solid ${GLASS.hairline}`,
        backgroundColor: tint,
        backgroundImage: GLASS.edgeShade,
        backdropFilter: blur,
        WebkitBackdropFilter: blur,
        opacity: visible ? 1 : 0,
        visibility: visible ? 'visible' : 'hidden',
        transition: [
          animateResize ? `transform ${GLASS.resizeMs}ms ${GLASS.resizeEase}` : 'transform 0s',
          `background-color ${GLASS.resizeMs}ms ease`,
          `opacity ${GLASS.fadeMs}ms ease${visible ? ` ${GLASS.fadeInDelayMs}ms` : ''}`,
          `visibility 0s linear ${visible ? 0 : GLASS.fadeMs}ms`,
        ].join(', '),
      }}
    />
  );
};

export default GlassScrim;
