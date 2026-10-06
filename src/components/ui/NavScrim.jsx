// src/components/ui/NavScrim.jsx
//
// A blurred band under the nav while a case study is open, or About is up.
//
// The rest of the portfolio does not need one: there the nav sits on the 3D
// scene, and the scene is measured so the nav can pick an ink that clears it
// (backdropInk.js). A case study has no scene to measure — it paints its own
// ground and scrolls its own content, images included, straight up under a
// fixed bar. Nothing an ink can do about a photograph passing behind the
// wordmark; the fix is to blur what passes. About is the one portfolio section
// whose copy scrolls up under the bar, so it takes the same band.
//
// A backdrop-filter behind a mask that fades
// it out, so the blur ends on nothing rather than on a rule. It runs on desktop
// and mobile alike — the case study scrolls under the nav on both.
//
// Blur only, no tint. Tinting it would mean choosing a colour per case-study
// palette, and how much of one is a question for after this reads right.

import React, { useEffect, useState } from 'react';
import { MQ_NAV_DESKTOP } from '../../config/breakpoints';
import { useMediaQuery } from '../../hooks/useMediaQuery';

/**
 * One tuning per side of the nav's own breakpoint, because the thing this covers
 * is a different size on each: the wordmark is 36px from 1024px up and 28px
 * below it, so its ink ends around 60px and 48px respectively (16px of padding
 * plus the line box). The band has to clear that, and a desktop band on a phone
 * is a blurred stripe hanging well below the bar it belongs to.
 *
 * It turns over at the nav's breakpoint rather than the site's mobile one — this
 * is sized to the bar, not to the layout. See MQ_NAV_DESKTOP.
 */
const SCRIM = {
  desktop: {
    /** Full height of the band, including the part that has faded to nothing. */
    heightPx: 120,
    /** Held at full strength to here — just past the nav's ink. */
    solidPx: 60,
    blurPx: 4,
  },
  mobile: {
    heightPx: 96,
    solidPx: 38,
    blurPx: 4,
  },
  /** Shared: this is the case study's entrance, not anything about the bar. */
  fadeMs: 320,
};

// Eased rather than linear. A linear ramp on a blur shows a visible line partway
// down, where the falloff stops changing fast enough to hide itself.
//
// Built once per tuning rather than per render — there are two, and neither
// depends on anything but its own constants.
const maskFor = ({ heightPx, solidPx }) => {
  const at = (px) => `${Math.round((px / heightPx) * 100)}%`;
  return [
    'linear-gradient(to bottom',
    'rgba(0, 0, 0, 1) 0',
    `rgba(0, 0, 0, 1) ${at(solidPx)}`,
    `rgba(0, 0, 0, 0.72) ${at(solidPx + (heightPx - solidPx) * 0.34)}`,
    `rgba(0, 0, 0, 0.32) ${at(solidPx + (heightPx - solidPx) * 0.66)}`,
    'rgba(0, 0, 0, 0) 100%)',
  ].join(', ');
};

const SCRIM_MASK = {
  desktop: maskFor(SCRIM.desktop),
  mobile: maskFor(SCRIM.mobile),
};

/**
 * @param {boolean} active          Up while a case study is open or About is up.
 * @param {number}  zIndex          Between the overlay and the nav, so it blurs
 *                                  the case study's content without blurring the
 *                                  nav itself.
 * @param {string}  scroller        Selector for the scroll container the band
 *                                  sits over. The band stops short of its
 *                                  scrollbar rather than blurring the top of it.
 * @param {number}  fadeInDelayMs   Held down until the case study's colour wash
 *                                  is opaque. The overlay opens over a still-
 *                                  visible crystal, and coming up any earlier
 *                                  would blur the top of the scene on the way
 *                                  in — a smear where there should be a cut.
 *                                  Nothing on the way out: the overlay is fading
 *                                  and the blur should leave with it.
 */
const NavScrim = ({ active = false, zIndex = 9999, scroller = null, fadeInDelayMs = 0 }) => {
  const variant = useMediaQuery(MQ_NAV_DESKTOP) ? 'desktop' : 'mobile';
  const tune = SCRIM[variant];

  // The width of the scrollbar under the band, measured rather than assumed: it
  // is the platform's (a styled scrollbar-color opts Chrome out of the 6px
  // ::-webkit-scrollbar width), and nothing at all where scrollbars overlay the
  // content. Only measured while up, so the band keeps its width as it fades
  // out. The case study layer can mount a few frames after the band is raised,
  // hence the short retry to find it.
  //
  // Watched, not measured once: a case study opened from the portfolio has no
  // scrollbar until its lazily-loaded content arrives and overflows, which can
  // be well after the band is up. The bar appearing shrinks the scroller's
  // content box, which is what the ResizeObserver reports (as it does a window
  // resize — the scroller is viewport-sized).
  const [gutterPx, setGutterPx] = useState(0);
  useEffect(() => {
    if (!active || !scroller) return undefined;
    let frame = 0;
    let retries = 30;
    let observer = null;
    const attach = () => {
      const el = document.querySelector(scroller);
      if (!el) {
        if (retries-- > 0) frame = requestAnimationFrame(attach);
        return;
      }
      const measure = () => setGutterPx(Math.max(0, el.offsetWidth - el.clientWidth));
      observer = new ResizeObserver(measure);
      observer.observe(el);
      measure();
    };
    attach();
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [active, scroller]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: `${gutterPx}px`,
        height: `${tune.heightPx}px`,
        zIndex,
        pointerEvents: 'none',
        backdropFilter: `blur(${tune.blurPx}px)`,
        WebkitBackdropFilter: `blur(${tune.blurPx}px)`,
        maskImage: SCRIM_MASK[variant],
        WebkitMaskImage: SCRIM_MASK[variant],
        opacity: active ? 1 : 0,
        // A faded-out backdrop-filter is still a live layer sampling everything
        // behind it every frame. Once invisible it comes out of compositing, on
        // a delay so it does not blink away mid-fade.
        visibility: active ? 'visible' : 'hidden',
        transition: [
          `opacity ${SCRIM.fadeMs}ms ease${active && fadeInDelayMs ? ` ${fadeInDelayMs}ms` : ''}`,
          `visibility 0s linear ${active ? fadeInDelayMs : SCRIM.fadeMs}ms`,
        ].join(', '),
      }}
    />
  );
};

export default NavScrim;
