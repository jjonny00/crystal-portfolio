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
