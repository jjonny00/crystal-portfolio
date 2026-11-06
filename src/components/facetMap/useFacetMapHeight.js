// src/components/facetMap/useFacetMapHeight.js
//
// The facet map's height on screen: level with the capitals of a project
// preview's title, which every preview has at the same height
// (useSharedProjectCopyHeight). The map keeps it on a case study too, so it never
// moves as one opens. See docs/facet-map.md.
//
// Taken from the title's place in its section, not on screen, so it holds
// wherever the portfolio is scrolled; a settled preview fills the screen from the
// top. Measured again whenever the title's copy block or its section changes
// size (a resize, the face landing, the shared height changing). Null until a
// title has been found.

import { useLayoutEffect, useState } from 'react';

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

/** The title's capitals, from the top of its section. */
const heightBeside = (title) => {
  const section = title.closest('section');
  const sectionTop = section ? section.getBoundingClientRect().top : 0;
  return layoutTop(title) - sectionTop + capCentreInLine(getComputedStyle(title));
};

const useFacetMapHeight = ({ visible, projectId }) => {
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
      (projectId && document.querySelector(`[data-facet-map-title="${projectId}"]`))
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

  return mapY;
};

export default useFacetMapHeight;
