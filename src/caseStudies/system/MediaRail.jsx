// src/caseStudies/system/MediaRail.jsx
//
// A row of media at one shared height, scrolled horizontally when it does not
// fit — a sequence of screens, steps, or frames read left to right:
//
//   <MediaRail items={c.turnSequence.steps} mobileHeight="126vw" />
//
// Height is what the rail fixes; each item takes its width from its own aspect
// ratio. That is the opposite of MediaGallery, which fixes the columns and lets
// the height follow, and it is what keeps a row of mixed ratios level. Give it
// tall phone screenshots and they come out the same height; give it a mix of
// portrait and landscape and the row still reads as one band.
//
// On desktop the default height is sized so a handful of items fit the stage
// without scrolling. On phones it becomes the horizontal scroller the shape
// implies: one set height, the next item peeking past the edge to say there is
// more, momentum scrolling, and snap. Both come from the same two properties —
// `height` and `mobileHeight` — because the media decides what reads well at
// each size, not the component.
//
// Like every other slot, items route through CaseStudyMedia, so they get lazy
// loading, alt text, aspect-ratio reservation, and placeholders; opening any one
// of them hands the whole rail to the viewer, in order.
//
// When the row is wider than the rail, a pair of arrows sits above it at the
// top right, stepping one item at a time. They exist only while there is
// something to scroll to: a row that fits renders no controls at all, and
// whether it fits is re-measured as the rail resizes and its images arrive.

import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import CaseStudyMedia from './CaseStudyMedia';
import { useMediaViewer } from './MediaViewer';
import { CaseStudyInline } from './CaseStudyText';

const MediaRail = ({
  items = [],
  /** Row height at desktop. Any CSS length; omit for the stylesheet's default. */
  height = null,
  /** Row height on phones, where the rail scrolls. Usually the taller of the two. */
  mobileHeight = null,
  /** One caption for the whole rail; items may still caption themselves. */
  caption = null,
  expandable = true,
  fit = 'contain',
  className = '',
  ...rest
}) => {
  const viewer = useMediaViewer();
  const railRef = useRef(null);
  const railId = useId();
  // null while the row fits; otherwise which ends are still out of view.
  const [scrollState, setScrollState] = useState(null);

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const maxScroll = rail.scrollWidth - rail.clientWidth;
    // A pixel of slack: fractional widths leave sub-pixel overflow behind.
    if (maxScroll <= 1) {
      setScrollState(null);
      return;
    }
    const canBack = rail.scrollLeft > 1;
    const canForward = rail.scrollLeft < maxScroll - 1;
    setScrollState((current) =>
      current && current.canBack === canBack && current.canForward === canForward
        ? current
        : { canBack, canForward }
    );
  }, []);

  // Before paint, so a rail that overflows never flashes without its arrows.
  useLayoutEffect(() => {
    measure();
  }, [measure, items, height, mobileHeight]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    // The rail changes width with the viewport; each item changes width when
    // an image without a declared ratio arrives. Either can start or end the
    // overflow, so both are watched.
    const observer = new ResizeObserver(schedule);
    observer.observe(rail);
    Array.from(rail.children).forEach((child) => observer.observe(child));
    rail.addEventListener('scroll', schedule, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      rail.removeEventListener('scroll', schedule);
    };
  }, [measure, items]);

  // One item per press: the next item whose left edge is past the current
  // scroll position, or the last one before it — the same edges scroll-snap
  // lands on, so a press and a swipe agree about where items begin.
  const step = useCallback((direction) => {
    const rail = railRef.current;
    if (!rail) return;
    const railLeft = rail.getBoundingClientRect().left;
    const starts = Array.from(rail.children).map(
      (child) => child.getBoundingClientRect().left - railLeft + rail.scrollLeft
    );
    const current = rail.scrollLeft;
    const target =
      direction > 0
        ? starts.find((start) => start > current + 1)
        : [...starts].reverse().find((start) => start < current - 1);
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    rail.scrollTo({
      left: target ?? (direction > 0 ? rail.scrollWidth : 0),
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, []);

  const slides = useMemo(
    () =>
      items
        .filter((item) => item && item.src)
        .map((item) => ({
          src: item.fullSrc || item.src,
          alt: item.alt || '',
          caption: typeof item.caption === 'string' ? item.caption : undefined,
        })),
    [items]
  );

  if (!items.length) return null;

  return (
    <figure className={`cs-media ${className}`.trim()} {...rest}>
      {scrollState && (
        <div className="cs-rail__controls">
          <button
            type="button"
            className="cs-rail__arrow"
            onClick={() => step(-1)}
            disabled={!scrollState.canBack}
            aria-controls={railId}
            aria-label="Scroll back"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            className="cs-rail__arrow"
            onClick={() => step(1)}
            disabled={!scrollState.canForward}
            aria-controls={railId}
            aria-label="Scroll forward"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      <div
        ref={railRef}
        id={railId}
        className="cs-rail"
        style={{
          ...(height ? { '--cs-rail-height': height } : null),
          ...(mobileHeight ? { '--cs-rail-height-mobile': mobileHeight } : null),
        }}
      >
        {items.map((item, index) => {
          // The viewer index only counts items that actually have a source.
          const slideIndex = items
            .slice(0, index)
            .filter((candidate) => candidate && candidate.src).length;

          // An item's `key` identifies it in content ('rotate', 'confirm', …);
          // it is React's key here, not a prop to spread onto the media.
          const { key: itemKey, ...media } = item || {};

          return (
            <CaseStudyMedia
              key={itemKey || media.src || `item-${index}`}
              className="cs-rail__item"
              fit={fit}
              expandable={expandable}
              onExpand={slides.length ? () => viewer.open(slides, slideIndex) : null}
              {...media}
            />
          );
        })}
      </div>

      {caption && (
        <figcaption className="cs-caption cs-media__caption">
          {typeof caption === 'string' ? <CaseStudyInline text={caption} /> : caption}
        </figcaption>
      )}
    </figure>
  );
};

export default MediaRail;
