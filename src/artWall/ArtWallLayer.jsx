// src/artWall/ArtWallLayer.jsx
//
// "Comics & Other Bad Ideas": the art wall, a full-page layer over the
// portfolio at /about/comics, entered from About. The scene stays on About
// underneath, untouched, so going back is only this layer leaving.
//
// The wall is folder-driven (artWallData.js). Each tile opens the case
// studies' own lightbox (MediaViewer): a single piece on its own, a series
// from its first page with previous and next kept inside that series.
// Closing the lightbox hands focus back to the tile it opened from, and the
// layer's own scroll is never touched, so the reader is where they were.
//
// Layout: row-first masonry. Four columns on a wide desktop, three in between,
// two on a phone; each tile, in folder order, goes into whichever column is
// shortest at that moment, so the folder numbers read left to right across the
// top. The markup stays in that order (Tab and screen readers follow it), and
// the tiles are positioned over it once measured. Before that (the prerendered
// page) they sit in a plain grid of the same columns.

import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MediaViewerProvider, useMediaViewer } from '../caseStudies/system/MediaViewer';
import { inPageLinkHandler } from '../navigation/linkClick';
import { pathFor } from '../navigation/routes';
import { NAVIGATION_DESTINATIONS } from '../navigation/navigationIntent';
import { ART_WALL_BACK_LABEL, ART_WALL_INTRO, ART_WALL_TITLE } from '../data/siteCopy';
import { artWall } from './artWallData';
import './artWall.css';

const FADE_MS = 320;

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// Widest first. Below the last, two columns.
const COLUMN_STEPS = [
  ['(min-width: 1100px)', 4],
  ['(min-width: 768px)', 3],
];

const readColumnCount = () => {
  // The prerender has no window: it writes the desktop wall.
  if (typeof window === 'undefined' || !window.matchMedia) return 4;
  const step = COLUMN_STEPS.find(([query]) => window.matchMedia(query).matches);
  return step ? step[1] : 2;
};

const useColumnCount = () => {
  const [count, setCount] = useState(readColumnCount);
  useEffect(() => {
    const lists = COLUMN_STEPS.map(([query]) => window.matchMedia(query));
    const update = () => setCount(readColumnCount());
    lists.forEach((list) => list.addEventListener('change', update));
    return () => lists.forEach((list) => list.removeEventListener('change', update));
  }, []);
  return count;
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// A video on the wall: muted, looping, inline, like an animated image. Muted
// is set on the element itself as well as the attribute, which is what lets
// iOS autoplay it. With reduced motion, the poster stands still.
const CoverVideo = ({ page }) => {
  const ref = useRef(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    if (prefersReducedMotion()) return;
    video.play?.().catch(() => {});
  }, []);
  return (
    <video
      ref={ref}
      className="art-wall__image"
      src={page.src}
      poster={page.poster || undefined}
      width={page.width || undefined}
      height={page.height || undefined}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
    />
  );
};

const countLabel = (item) => {
  const count = item.pages.length;
  const hasVideo = item.pages.some((page) => page.type === 'video');
  const noun = hasVideo ? 'piece' : 'image';
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
};

const ArtTile = ({ item }) => {
  const viewer = useMediaViewer();
  const count = item.pages.length;

  const slides = useMemo(
    () =>
      item.pages.map((page, index) => ({
        type: page.type,
        src: page.src,
        poster: page.poster,
        width: page.width,
        height: page.height,
        alt: item.series ? `${item.title}, ${page.title}` : item.title,
        caption: item.series
          ? `${item.title} · ${page.title} · ${index + 1} of ${count}`
          : item.title,
        note: item.caption,
      })),
    [item, count]
  );

  const label = item.series
    ? `Open ${item.title}, a series of ${countLabel(item)}`
    : `Open ${item.title}`;

  const { cover } = item;

  return (
    <button
      type="button"
      className="art-wall__tile"
      data-series={item.series ? '' : undefined}
      data-pixelated={item.pixelated ? '' : undefined}
      aria-label={label}
      onClick={(event) => {
        // The viewer hands focus back to whatever had it when it opened; a
        // click does not focus a button everywhere (Safari), so make it this one.
        event.currentTarget.focus({ preventScroll: true });
        viewer.open(slides, 0, { pixelated: item.pixelated });
      }}
    >
      <span className="art-wall__frame">
        {cover.type === 'video' ? (
          <CoverVideo page={cover} />
        ) : (
          <img
            className="art-wall__image"
            src={cover.src}
            width={cover.width || undefined}
            height={cover.height || undefined}
            alt=""
            loading="lazy"
            decoding="async"
          />
        )}
      </span>
      <span className="art-wall__label" aria-hidden="true">
        <span className="type-caption art-wall__name">{item.title}</span>
        {item.series && <span className="type-caption art-wall__count">{countLabel(item)}</span>}
      </span>
    </button>
  );
};

// Shortest column first, leftmost on a tie.
const placeTiles = (heights, columns, gap) => {
  const columnHeights = new Array(columns).fill(0);
  const positions = heights.map((height) => {
    let column = 0;
    for (let c = 1; c < columns; c += 1) {
      if (columnHeights[c] < columnHeights[column] - 0.5) column = c;
    }
    const top = columnHeights[column];
    columnHeights[column] += height + gap;
    return { column, top };
  });
  const height = Math.max(0, ...columnHeights.map((h) => h - gap));
  return { positions, height };
};

const ArtWallGrid = ({ items }) => {
  const columns = useColumnCount();
  const gridRef = useRef(null);
  const [layout, setLayout] = useState(null);

  // Measure every tile at its column width (the fallback grid gives them that
  // width too), then place them. Again whenever a tile or the wall resizes:
  // the window, the fonts arriving, a caption wrapping.
  useIsomorphicLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return undefined;
    const measure = () => {
      const cells = [...grid.children];
      const gap = parseFloat(getComputedStyle(grid).rowGap) || 0;
      const heights = cells.map((cell) => cell.offsetHeight);
      const next = placeTiles(heights, columns, gap);
      setLayout((current) =>
        current &&
        current.height === next.height &&
        current.columns === columns &&
        current.positions.every(
          (p, i) => p.column === next.positions[i]?.column && p.top === next.positions[i]?.top
        )
          ? current
          : { ...next, columns }
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    [...grid.children].forEach((cell) => observer.observe(cell));
    return () => observer.disconnect();
  }, [columns, items]);

  const laidOut = layout && layout.columns === columns;

  return (
    <ul
      ref={gridRef}
      className="art-wall__grid"
      data-laid-out={laidOut ? '' : undefined}
      style={{
        '--art-wall-columns': columns,
        ...(laidOut ? { height: `${layout.height}px` } : null),
      }}
    >
      {items.map((item, index) => {
        const position = laidOut ? layout.positions[index] : null;
        return (
          <li
            className="art-wall__cell"
            key={item.key}
            style={
              position
                ? { '--art-wall-column': position.column, top: `${position.top}px` }
                : undefined
            }
          >
            <ArtTile item={item} />
          </li>
        );
      })}
    </ul>
  );
};

// Escape leaves the wall, except while the lightbox has it.
const EscapeToBack = ({ onBack }) => {
  const { isOpen: viewerIsOpen } = useMediaViewer();
  useEffect(() => {
    if (!onBack || viewerIsOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !event.defaultPrevented) onBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, viewerIsOpen]);
  return null;
};

/**
 * @param {boolean} open           whether the wall is up
 * @param {boolean} initiallyOpen  arrived on its URL: already on screen (it was
 *                                 prerendered), so no fade in
 * @param {() => void} onBack      Back to About (and Escape)
 */
const ArtWallLayer = ({ open, initiallyOpen = false, onBack = null }) => {
  const headingId = useId();
  const headingRef = useRef(null);
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(open && initiallyOpen);

  // In on open, out on close, then gone.
  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = setTimeout(() => setShown(true), 20);
      return () => clearTimeout(id);
    }
    setShown(false);
    const id = setTimeout(() => setMounted(false), FADE_MS);
    return () => clearTimeout(id);
  }, [open]);

  // Opened from the page: the heading takes focus, so a screen reader starts
  // at the top and Tab moves on into the wall. (Not on arrival: the page is
  // already the document, read from the top.)
  const wasOpenRef = useRef(open);
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = open;
    if (open && !wasOpen) {
      // After the portfolio has gone inert (which drops the focus of the link
      // that opened the wall) and the layer has started in.
      const id = setTimeout(() => headingRef.current?.focus({ preventScroll: true }), 60);
      return () => clearTimeout(id);
    }
    if (!open && wasOpen) {
      // Back in About, on the link the reader came in by.
      document.querySelector('.about-section__comics')?.focus({ preventScroll: true });
    }
    return undefined;
  }, [open]);

  // While the wall is up, the portfolio under it is out of reach of the
  // keyboard and assistive tech.
  useEffect(() => {
    if (!open) return undefined;
    const portfolio = document.querySelector('.scroll-container');
    if (!portfolio) return undefined;
    portfolio.setAttribute('inert', '');
    return () => portfolio.removeAttribute('inert');
  }, [open]);

  if (!mounted) return null;

  const aboutPath = pathFor(NAVIGATION_DESTINATIONS.ABOUT);

  return (
    <div
      className="art-wall"
      data-state={shown ? 'open' : 'closed'}
      data-instant={initiallyOpen ? '' : undefined}
    >
      {/* Under the site nav (drawn above this layer): a blurred band, so the
          wordmark and links never sit straight on the artwork scrolling by. */}
      <div className="art-wall__scrim" aria-hidden="true" />
      <MediaViewerProvider>
        <EscapeToBack onBack={onBack} />
        <main className="art-wall__page" aria-labelledby={headingId}>
          <a
            className="type-body-sm art-wall__back"
            href={aboutPath}
            onClick={onBack ? inPageLinkHandler(onBack) : undefined}
          >
            <span aria-hidden="true">←</span> {ART_WALL_BACK_LABEL}
          </a>
          <h1
            ref={headingRef}
            id={headingId}
            className="type-headline-sm art-wall__title"
            tabIndex={-1}
          >
            {ART_WALL_TITLE}
          </h1>
          <p className="type-body-sm art-wall__intro">{ART_WALL_INTRO}</p>
          <ArtWallGrid items={artWall} />
        </main>
      </MediaViewerProvider>
    </div>
  );
};

export default ArtWallLayer;
