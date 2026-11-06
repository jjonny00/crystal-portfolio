// src/components/facetMap/useFacetMapHeight.js
//
// The facet map's height on screen, from one of two anchors that every project
// preview has in the same place (useSharedProjectCopyHeight). See
// docs/facet-map.md.
//
//   'title'  level with the capitals of the preview's title: the map in the
//            gutter, which keeps it on a case study too, so it never moves as
//            one opens.
//   'card'   the top edge of a phone's project card: the button's disc, which
//            sits half over it.
//
// Taken from the anchor's place in its section, not on screen, so it holds
// wherever the portfolio is scrolled; a settled preview fills the screen from the
// top. Measured again whenever the anchor's copy block or its section changes
// size (a resize, the face landing, the shared height changing). Null until an
// anchor has been found.

import { useLayoutEffect, useState } from 'react';

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

const sectionTop = (element) => element.closest('section')?.getBoundingClientRect().top ?? 0;

const ANCHORS = {
  /** The title's capitals, from the top of its section. */
  title: {
    attribute: 'data-facet-map-title',
    heightOf: (title) => layoutTop(title) - sectionTop(title) + capCentreInLine(getComputedStyle(title)),
  },
  /** The card's top edge, from the top of its section. */
  card: {
    attribute: 'data-facet-map-card',
    heightOf: (card) => layoutTop(card) - sectionTop(card),
  },
};

const useFacetMapHeight = ({ visible, projectId, anchor = 'title' }) => {
  const [mapY, setMapY] = useState(null);

  useLayoutEffect(() => {
    if (!visible) return undefined;
    const { attribute, heightOf } = ANCHORS[anchor];
    let frame = 0;
    let resizeObserver = null;
    let mountObserver = null;

    const measure = (title) => {
      const next = heightOf(title);
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

    // Its own project's, or any: they all sit at the same height. Arriving on a
    // case study's URL, the portfolio behind it mounts a few seconds after the
    // page, and the map waits for it.
    const find = () => (
      (projectId && document.querySelector(`[${attribute}="${projectId}"]`))
      || document.querySelector(`[${attribute}]`)
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
  }, [visible, projectId, anchor]);

  return mapY;
};

export default useFacetMapHeight;
