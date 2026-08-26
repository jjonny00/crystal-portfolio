// src/components/ui/VerticalEnergyLine.jsx

import React, { useEffect, useRef } from 'react';

import { MQ_REDUCED_MOTION } from '../../config/breakpoints';
import { subscribeToRailState } from '../../lib/verticalRailSignal';
import '../../styles/vertical-energy-line.css';

/**
 * The 1px vertical rail that connects the hero CTA to the work overview.
 *
 * One fixed layer spans both sections rather than a per-section element, so the
 * line is continuous by construction — there is no seam to hide at the hero →
 * overview boundary. Its geometry is derived, never hardcoded:
 *
 *   x      the horizontal centre of the hero's arrow-down glyph
 *   top    8px below that arrow while the hero is framed, easing to 0 as the
 *          overview takes over (so the rail grows upward into the overview)
 *   height always down to the bottom of the viewport
 *
 * Everything the frame loop touches is a CSS custom property on this layer, so
 * scrolling, the idle pulse and the pointer-follow never re-render React and
 * never read layout mid-frame — rects are cached and only re-measured on
 * resize/relayout.
 */

// Where the white peak sits inside the supplied gradient recipe (37.98%). Used to
// centre the bright point on the pointer rather than the segment's leading edge.
const PEAK_WHITE_STOP = 0.3798;

// Gap between the rendered bottom edge of the arrow and the start of the line.
const ARROW_GAP_PX = 8;

// The pulse traverses the peak's own height plus the track's, so a taller
// gradient covers more ground per cycle — the duration is stretched to match so
// the bright core still drifts at a restrained pace.
const IDLE_CYCLE_MS = 6400;
const POINTER_EASE = 0.14;
const INFLUENCE_EASE = 0.09;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const smoothstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

// How far into the overview → first-project scroll the rail fades. It holds at
// full strength while the overview is settled, then is completely gone well
// before the first project preview is framed — never a line inside a preview.
const EXIT_FADE_START = 0.05;
const EXIT_FADE_END = 0.55;

/**
 * Vertical/horizontal offset of `node` inside `ancestor`, walking the offset
 * chain rather than using getBoundingClientRect. The hero CTA lives inside a
 * react-spring wrapper that carries an entrance `translateY`, and offset values
 * ignore transforms — so the rail lands on the settled layout position
 * immediately instead of chasing the entrance animation.
 */
const offsetWithin = (node, ancestor) => {
  let left = 0;
  let top = 0;
  let current = node;

  while (current && current !== ancestor) {
    left += current.offsetLeft;
    top += current.offsetTop;
    current = current.offsetParent;
  }

  return current === ancestor ? { left, top } : null;
};

const VerticalEnergyLine = () => {
  const layerRef = useRef(null);

  // Cached layout. Written only by measure(), read by the frame loops.
  const metricsRef = useRef({
    railX: 0,
    arrowBottom: 0,
    heroTop: 0,
    overviewTop: 0,
    firstProjectTop: 0,
    viewportHeight: 0,
  });

  // Current scroll-derived geometry, shared with the peak loop.
  const geometryRef = useRef({ trackTop: 0, trackHeight: 0, peakHeight: 0, opacity: 0 });

  const railStateRef = useRef({
    overviewVisible: false,
    activeProjectKey: null,
    activeProjectColor: null,
  });
  const pointerRef = useRef({ y: 0, inside: false });
  const writtenRef = useRef({});

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return undefined;

    const reducedMotionQuery = window.matchMedia(MQ_REDUCED_MOTION);
    let reducedMotion = reducedMotionQuery.matches;

    // Whether the peak loop is running. Tracked in the closure rather than read
    // back off the element: under StrictMode the effect is torn down and re-run
    // against the *same* node, so a DOM flag would still read "running" after the
    // first teardown cancelled the frame.
    let animating = null;

    // The write cache is a ref (it outlives this closure); a re-run starts from a
    // clean slate so every property is written at least once.
    writtenRef.current = {};

    // Write a custom property only when it actually changed — the scroll and
    // frame loops both run hot and style writes are not free.
    const writeVar = (name, value) => {
      if (writtenRef.current[name] === value) return;
      writtenRef.current[name] = value;
      layer.style.setProperty(name, value);
    };

    /* ---------------------------------------------------------------- layout */

    const measure = () => {
      const container = document.querySelector('.scroll-container');
      const hero = document.getElementById('hero');
      const overview = document.getElementById('overview');
      if (!container || !hero || !overview) return;

      const firstProject = document.querySelector('.scroll-section.project');
      const arrow = document.querySelector('[data-hero-rail-anchor]');
      const viewportHeight = container.clientHeight || window.innerHeight;

      const metrics = metricsRef.current;
      metrics.viewportHeight = viewportHeight;
      metrics.heroTop = hero.offsetTop;
      metrics.overviewTop = overview.offsetTop;
      metrics.firstProjectTop = firstProject
        ? firstProject.offsetTop
        : overview.offsetTop + viewportHeight;

      const arrowOffset = arrow ? offsetWithin(arrow, hero) : null;
      if (arrowOffset && arrow.offsetWidth > 0) {
        metrics.railX = arrowOffset.left + arrow.offsetWidth / 2;
        metrics.arrowBottom = arrowOffset.top + arrow.offsetHeight;
      } else {
        // Hero not laid out yet (or hidden): fall back to a sane centre so the
        // rail never flashes in from x = 0.
        metrics.railX = window.innerWidth / 2;
        metrics.arrowBottom = viewportHeight * 0.88;
      }

      update();
      measureStrip();
    };

    /* ------------------------------------------------------- scroll geometry */

    function update() {
      const container = document.querySelector('.scroll-container');
      if (!container) return;

      const metrics = metricsRef.current;
      const scrollTop = container.scrollTop;

      // The head of the line stays welded to the arrow: as the hero scrolls away
      // the start point rises with it and the line simply grows, reaching full
      // viewport height before the overview is framed. Interpolating on scroll
      // progress instead would let the head outrun the arrow and cut back up
      // through the CTA and body copy.
      const heroScroll = scrollTop - metrics.heroTop;
      const trackTop = clamp(
        metrics.arrowBottom + ARROW_GAP_PX - heroScroll,
        0,
        metrics.viewportHeight
      );
      const trackHeight = Math.max(0, metrics.viewportHeight - trackTop);

      // 0 in the overview, 1 once the first project preview is framed.
      const exitSpan = Math.max(1, metrics.firstProjectTop - metrics.overviewTop);
      const leaving = clamp((scrollTop - metrics.overviewTop) / exitSpan, 0, 1);
      const opacity = 1 - smoothstep(EXIT_FADE_START, EXIT_FADE_END, leaving);

      const geometry = geometryRef.current;
      geometry.trackTop = trackTop;
      geometry.trackHeight = trackHeight;
      geometry.peakHeight = clamp(trackHeight * 1.4, 240, 900);
      geometry.opacity = opacity;

      writeVar('--vrail-x', metrics.railX.toFixed(1) + 'px');
      writeVar('--vrail-top', trackTop.toFixed(1) + 'px');
      writeVar('--vrail-peak-height', geometry.peakHeight.toFixed(1) + 'px');
      writeVar('--vrail-opacity', opacity.toFixed(3));

      // Below the overview the rail is fully faded; park the frame loop so it
      // costs nothing while the user reads project previews.
      const shouldAnimate = opacity > 0.001;
      if (animating !== shouldAnimate) {
        animating = shouldAnimate;
        layer.dataset.active = String(shouldAnimate);
        if (shouldAnimate) startLoop();
        else stopLoop();
      }

      if (reducedMotion) writeStaticPeak();
    }

    let scrollFrame = 0;
    const onScroll = () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        update();
      });
    };

    /* ------------------------------------------------------------ peak motion */

    let phase = 0;
    let lastFrame = 0;
    let influence = 0;
    let pointerCurrent = 0;
    let loopFrame = 0;

    function writeStaticPeak() {
      // Reduced motion: a single resting peak, no pulse, no pointer follow.
      const { trackHeight, peakHeight } = geometryRef.current;
      const restingY = trackHeight * 0.5 - peakHeight * PEAK_WHITE_STOP;
      writeVar('--vrail-peak-y', restingY.toFixed(1) + 'px');
      writeVar('--vrail-peak-opacity', '0.45');
    }

    const tick = (now) => {
      loopFrame = requestAnimationFrame(tick);

      const delta = lastFrame ? Math.min(64, now - lastFrame) : 16;
      lastFrame = now;

      const { trackTop, trackHeight, peakHeight } = geometryRef.current;
      const pointer = pointerRef.current;

      const wantsPointer = pointer.inside && railStateRef.current.overviewVisible ? 1 : 0;
      influence += (wantsPointer - influence) * INFLUENCE_EASE;

      // The idle pulse only advances while the pointer is not driving. Freezing
      // the phase means its wrap from bottom back to top can never happen while
      // the two are blended, so there is no jump when the pointer lets go.
      if (influence < 0.02) {
        phase += delta / IDLE_CYCLE_MS;
        if (phase >= 1) phase -= 1;
      }

      const idleY = -peakHeight + phase * (trackHeight + peakHeight);
      const idleOpacity = Math.min(1, Math.sin(Math.PI * phase) * 1.7);

      const pointerTarget = pointer.y - trackTop - peakHeight * PEAK_WHITE_STOP;
      if (influence < 0.01) pointerCurrent = idleY;
      else pointerCurrent += (pointerTarget - pointerCurrent) * POINTER_EASE;

      const y = idleY + (pointerCurrent - idleY) * influence;
      const opacity = idleOpacity + (1 - idleOpacity) * influence;

      writeVar('--vrail-peak-y', y.toFixed(1) + 'px');
      writeVar('--vrail-peak-opacity', opacity.toFixed(3));
    };

    function startLoop() {
      if (reducedMotion) {
        writeStaticPeak();
        return;
      }
      if (loopFrame) return;
      lastFrame = 0;
      loopFrame = requestAnimationFrame(tick);
    }

    function stopLoop() {
      if (!loopFrame) return;
      cancelAnimationFrame(loopFrame);
      loopFrame = 0;
    }

    /* ----------------------------------------------------------- active strip */

    function measureStrip() {
      const { overviewVisible, activeProjectKey, activeProjectColor } = railStateRef.current;

      if (!overviewVisible || !activeProjectKey) {
        layer.dataset.strip = 'off';
        return;
      }

      const escaped = typeof CSS !== 'undefined' && CSS.escape
        ? CSS.escape(activeProjectKey)
        : activeProjectKey;
      const node = document.querySelector('[data-rail-project="' + escaped + '"]');
      const rect = node?.getBoundingClientRect();

      if (!rect || rect.height <= 0) {
        layer.dataset.strip = 'off';
        return;
      }

      if (activeProjectColor) writeVar('--active-project-color', activeProjectColor);
      writeVar('--vrail-strip-top', rect.top.toFixed(1) + 'px');
      writeVar('--vrail-strip-height', rect.height.toFixed(1) + 'px');
      layer.dataset.strip = 'on';
    }

    let stripFrame = 0;
    const scheduleStripMeasure = () => {
      if (stripFrame) return;
      stripFrame = requestAnimationFrame(() => {
        stripFrame = 0;
        measureStrip();
      });
    };

    /* ------------------------------------------------------------ observation */

    // The label list is created imperatively by FacetLabels, so it only exists
    // while the overview is live — (re)attach the observer whenever that changes.
    const listObserver = new ResizeObserver(scheduleStripMeasure);
    let observedList = null;
    const observeLabelList = () => {
      const list = document.querySelector('[data-rail-list]');
      if (list === observedList) return;
      if (observedList) listObserver.unobserve(observedList);
      observedList = list;
      if (list) listObserver.observe(list);
    };

    const unsubscribe = subscribeToRailState((state) => {
      railStateRef.current = {
        overviewVisible: state.overviewVisible,
        activeProjectKey: state.activeProjectKey,
        activeProjectColor: state.activeProjectColor,
      };
      scheduleStripMeasure();
      observeLabelList();
    });

    const onPointerMove = (event) => {
      pointerRef.current.y = event.clientY;
      pointerRef.current.inside = true;
    };
    const onPointerOut = (event) => {
      if (event.relatedTarget === null) pointerRef.current.inside = false;
    };
    const onWindowBlur = () => {
      pointerRef.current.inside = false;
    };

    const heroObserver = new ResizeObserver(measure);
    const hero = document.getElementById('hero');
    if (hero) heroObserver.observe(hero);

    const container = document.querySelector('.scroll-container');
    container?.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerout', onPointerOut);
    window.addEventListener('blur', onWindowBlur);

    const onReducedMotionChange = (event) => {
      reducedMotion = event.matches;
      if (reducedMotion) {
        stopLoop();
        writeStaticPeak();
      } else if (animating) {
        startLoop();
      }
    };
    reducedMotionQuery.addEventListener('change', onReducedMotionChange);

    measure();
    // Web fonts change the CTA's metrics; re-measure once they land.
    document.fonts?.ready?.then(measure).catch(() => {});
    const readyFrame = requestAnimationFrame(() => {
      layer.classList.add('is-ready');
    });

    return () => {
      unsubscribe();
      stopLoop();
      cancelAnimationFrame(readyFrame);
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      if (stripFrame) cancelAnimationFrame(stripFrame);
      heroObserver.disconnect();
      listObserver.disconnect();
      container?.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerout', onPointerOut);
      window.removeEventListener('blur', onWindowBlur);
      reducedMotionQuery.removeEventListener('change', onReducedMotionChange);
    };
  }, []);

  return (
    <div
      ref={layerRef}
      className="vertical-energy-line"
      aria-hidden="true"
      data-active="false"
      data-strip="off"
    >
      <div className="vertical-energy-line__track">
        <div className="vertical-energy-line__base" />
        <div className="vertical-energy-line__peak" />
      </div>
      <div className="vertical-energy-line__strip" />
    </div>
  );
};

export default VerticalEnergyLine;
