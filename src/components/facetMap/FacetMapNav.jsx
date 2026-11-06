// src/components/facetMap/FacetMapNav.jsx
//
// The facet map, fixed in the left gutter on desktop beside a project preview or
// a case study. See docs/facet-map.md.
//
// Stage 2 of the build: the marker only. It names the current project for
// assistive tech and takes no input yet; the index panel it opens comes next,
// and the phone's button after that. Below the width where the gutter can hold
// it (facet-map.css), it is not shown at all for now.
//
// Where it sits: one place, whatever is showing. Across, the middle of the
// gutter (CSS). Down, level with the capitals of a project preview's title,
// which every preview has at the same height (useSharedProjectCopyHeight). It
// keeps that height on a case study too, so it never moves as one opens.
//
// The height is taken from the title's place in its section, not on screen, so
// it holds wherever the portfolio is scrolled; a settled preview fills the
// screen from the top. It is measured again whenever the title's copy block or
// its section changes size (a resize, the face landing, the shared height
// changing).

import React, { useLayoutEffect, useState } from 'react';
import FacetMapGlyph from './FacetMapGlyph';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MQ_REDUCED_MOTION } from '../../config/breakpoints';
import { getProjectByAnyKey } from '../../data/projects';
import '../../styles/facet-map.css';

/** The map's height on desktop: about the capital height of a preview title. */
const GLYPH_HEIGHT = 68;

const TITLE_SELECTOR = '[data-facet-map-title]';

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
 * The element's top where layout puts it, without the translation its entrance
 * animation (or an ancestor's) adds on the way in.
 */
const layoutTop = (element) => {
  let { top } = element.getBoundingClientRect();
  for (let node = element; node && node !== document.body; node = node.parentElement) {
    const { transform } = getComputedStyle(node);
    if (transform && transform !== 'none') top -= new DOMMatrixReadOnly(transform).m42;
  }
  return top;
};

/** The map's centre height: the title's capitals, from the top of its section. */
const heightBeside = (title) => {
  const section = title.closest('section');
  const sectionTop = section ? section.getBoundingClientRect().top : 0;
  return layoutTop(title) - sectionTop + capCentreInLine(getComputedStyle(title));
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
  const { visible, projectId } = selection;
  const [mapY, setMapY] = useState(null);

  useLayoutEffect(() => {
    if (!visible) return undefined;
    let frame = 0;
    let resizeObserver = null;
    let mountObserver = null;

    const measure = (title) => {
      const next = heightBeside(title);
      setMapY((current) => (current !== null && Math.abs(current - next) < 0.5 ? current : next));
    };

    const watch = (title) => {
      measure(title);
      if (typeof ResizeObserver === 'undefined') return;
      resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => measure(title));
      });
      resizeObserver.observe(title.closest('[data-project-copy]') || title);
      const section = title.closest('section');
      if (section) resizeObserver.observe(section);
    };

    // Its own project's title, or any: they all sit at the same height. Arriving
    // on a case study's URL, the portfolio behind it mounts a few seconds after
    // the page, and the map waits for it.
    const find = () => (
      document.querySelector(`[data-facet-map-title="${projectId}"]`)
      || document.querySelector(TITLE_SELECTOR)
    );
    const title = find();
    if (title) {
      watch(title);
    } else {
      mountObserver = new MutationObserver(() => {
        const found = find();
        if (!found) return;
        mountObserver.disconnect();
        mountObserver = null;
        watch(found);
      });
      mountObserver.observe(document.body, { childList: true, subtree: true });
    }
    document.fonts?.ready.then(() => {
      const current = find();
      if (current) measure(current);
    });

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      mountObserver?.disconnect();
    };
  }, [visible, projectId]);

  return (
    <div
      className="facet-map"
      data-shown={visible && mapY !== null ? '' : undefined}
      role="img"
      aria-label={project ? `Project map. Current project: ${project.label}` : undefined}
      aria-hidden={visible ? undefined : true}
      style={mapY !== null ? { '--facet-map-y': `${mapY}px` } : undefined}
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
