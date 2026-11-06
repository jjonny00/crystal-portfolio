// src/components/facetMap/FacetMapNav.jsx
//
// The facet map, fixed on desktop beside a project preview's title or a case
// study's. See docs/facet-map.md.
//
// Stage 2 of the build: the marker only. It names the current project for
// assistive tech and takes no input yet; the index panel it opens comes next,
// and the phone's button after that. Below the width where the gutter can hold
// it (facet-map.css), it is not shown at all for now.
//
// Where it sits: centred on the capitals of the title's first line, a short gap
// to its left, or centred in the space left of the title where that is narrower
// (a case study's title starts at the page edge). It stays fixed there, so on a
// case study it keeps that height as the title scrolls away. It is placed when
// it comes in, when the project or view changes (gliding to the new title), and
// after a resize. Snap scrolling settles every preview at the top of the screen,
// so a settled title is always where it was measured.

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import FacetMapGlyph from './FacetMapGlyph';
import { FACET_MAP_ASPECT } from './facetMapData';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MQ_REDUCED_MOTION } from '../../config/breakpoints';
import { getProjectByAnyKey } from '../../data/projects';
import '../../styles/facet-map.css';

/** The map's height on desktop: about the capital height of a preview title. */
const GLYPH_HEIGHT = 68;
const GLYPH_WIDTH = GLYPH_HEIGHT * FACET_MAP_ASPECT;

/** From the map's right edge to the title, where there is room for it. */
const TITLE_GAP = 24;

/** How long to look for a title that has not mounted yet (a case study's loads in). */
const ANCHOR_WAIT_MS = 4000;

let metricsCanvas = null;

/**
 * Where the capitals of a line of `style`'s font sit, from the top of its line
 * box: the line's middle, moved by where the font puts its baseline and how
 * tall its capitals are. Measured from the font itself, so it holds for any
 * size or face.
 */
const capCentreInLine = (style) => {
  metricsCanvas ??= document.createElement('canvas').getContext('2d');
  metricsCanvas.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const metrics = metricsCanvas.measureText('H');
  const ascent = metrics.fontBoundingBoxAscent;
  const descent = metrics.fontBoundingBoxDescent;
  const lineHeight = parseFloat(style.lineHeight) || ascent + descent;
  return lineHeight / 2 + (ascent - descent - metrics.actualBoundingBoxAscent) / 2;
};

/**
 * The element's box where layout puts it, without the translation its entrance
 * animation (or an ancestor's) adds on the way in.
 */
const layoutBox = (element) => {
  const rect = element.getBoundingClientRect();
  let { left, top } = rect;
  for (let node = element; node && node !== document.body; node = node.parentElement) {
    const { transform } = getComputedStyle(node);
    if (transform && transform !== 'none') {
      const matrix = new DOMMatrixReadOnly(transform);
      left -= matrix.m41;
      top -= matrix.m42;
    }
  }
  return { left, top };
};

const findTitle = ({ view, projectId }) => (
  document.querySelector(`[data-facet-map-title="${view === 'caseStudy' ? 'case-study' : projectId}"]`)
);

/** The map's centre beside `title`, in viewport px. */
const placeBeside = (title) => {
  const box = layoutBox(title);
  const gap = Math.min(TITLE_GAP, (box.left - GLYPH_WIDTH) / 2);
  return {
    x: box.left - gap - GLYPH_WIDTH / 2,
    y: box.top + capCentreInLine(getComputedStyle(title)),
  };
};

const FacetMapNav = ({
  /** From useFacetMapSelection. */
  selection,
  /**
   * The case study's ink under the map, or null over the scene. Set, the map
   * draws in that ink rather than in project colour.
   */
  ink = null,
}) => {
  const reducedMotion = useMediaQuery(MQ_REDUCED_MOTION);
  const project = selection.projectId ? getProjectByAnyKey(selection.projectId) : null;
  const { visible, projectId, view } = selection;

  // { x, y, glide }: glide is whether to travel there or appear there.
  const [place, setPlace] = useState(null);
  const shownRef = useRef(false);

  useLayoutEffect(() => {
    if (!visible) {
      shownRef.current = false;
      return undefined;
    }
    // Already showing: travel to the new title. Coming in: appear beside it.
    const glide = shownRef.current;
    shownRef.current = true;

    let frame = 0;
    const startedAt = performance.now();
    const settle = () => {
      const title = findTitle({ view, projectId });
      if (title) {
        setPlace({ ...placeBeside(title), glide });
      } else if (performance.now() - startedAt < ANCHOR_WAIT_MS) {
        frame = requestAnimationFrame(settle);
      }
    };
    settle();
    return () => cancelAnimationFrame(frame);
  }, [visible, projectId, view]);

  // A resize moves the title; so does the title's face arriving after the map
  // first measured it with a fallback. Only an actual move replaces the place:
  // dropping `glide` mid-way would cut a glide that is still running short.
  useEffect(() => {
    if (!visible) return undefined;
    let frame = 0;
    const replace = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const title = findTitle({ view, projectId });
        if (!title) return;
        const next = placeBeside(title);
        setPlace((current) => (
          current && Math.abs(current.x - next.x) < 0.5 && Math.abs(current.y - next.y) < 0.5
            ? current
            : { ...next, glide: false }
        ));
      });
    };
    window.addEventListener('resize', replace);
    document.fonts?.ready.then(replace);
    return () => {
      window.removeEventListener('resize', replace);
      cancelAnimationFrame(frame);
    };
  }, [visible, projectId, view]);

  return (
    <div
      className="facet-map"
      data-shown={visible && place ? '' : undefined}
      data-glide={(place?.glide && !reducedMotion) || undefined}
      role="img"
      aria-label={project ? `Project map. Current project: ${project.label}` : undefined}
      aria-hidden={visible ? undefined : true}
      style={place ? { '--facet-map-x': `${place.x}px`, '--facet-map-y': `${place.y}px` } : undefined}
    >
      <FacetMapGlyph
        currentId={projectId}
        variant={ink ? 'ink' : 'color'}
        ink={ink || undefined}
        height={GLYPH_HEIGHT}
        animate={!reducedMotion}
      />
    </div>
  );
};

export default FacetMapNav;
