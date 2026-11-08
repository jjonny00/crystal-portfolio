// src/components/facetMap/facetMapData.js
//
// The facet map's data, for the glyph and everything placed around it. The
// outlines are generated (scripts/generate-facet-map.mjs); the colours are each
// project's page colour, the one its preview title and CTA are set in.

import facetMap from '../../data/facetMap.json';
import projects from '../../data/projects';

export { facetMap };

const [, , VIEW_WIDTH, VIEW_HEIGHT] = facetMap.viewBox;

/** Width over height of the map, for sizing a box around it. */
export const FACET_MAP_ASPECT = VIEW_WIDTH / VIEW_HEIGHT;

/** Project ids in the canonical order (projects.js), the map's own order. */
export const FACET_MAP_ORDER = facetMap.order;

export const FACET_MAP_COLORS = Object.fromEntries(
  projects.map((project) => [project.facetKey || project.id, project.headlineColor || project.color]),
);

/**
 * How the map marks the current fragment, also used for the dots on the mobile
 * overview's label connectors: a dark 1px outline outside the shape, and a glow
 * in the shape's own colour, two soft halos given as a box-shadow's blur.
 */
export const MARK_OUTLINE = '#161A32';
export const MARK_GLOW = [
  { blurPx: 8, opacity: 0.25 },
  { blurPx: 25, opacity: 0.5 },
];
