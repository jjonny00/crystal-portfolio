// src/components/facetMap/FacetMapGlyph.jsx
//
// The facet map: the overview's six fragments drawn flat, with the current
// project's fragment filled. Shape says which project, position gives the order,
// colour only confirms. See docs/facet-map.md.
//
// The outlines come from src/data/facetMap.json, generated from the fragment GLBs
// at their overview positions (scripts/generate-facet-map.mjs). Nothing here is
// drawn by hand, and nothing tracks the live scene.
//
// Purely presentational and hidden from assistive tech: whatever wraps it (the
// trigger, a panel row) carries the name and the current project in words.

import React from 'react';
import { FACET_MAP_ASPECT, FACET_MAP_COLORS, FACET_MAP_ORDER, facetMap } from './facetMapData';

/**
 * How each variant draws the fragments that are not current. `color` and
 * `button` sit on the scene (the button on its own dark disc); `ink` sits on a
 * case-study page and takes the page's ink, never a project colour.
 */
const restStyle = (variant, ink) => (
  variant === 'ink'
    ? { fill: ink, fillOpacity: 0, stroke: ink, strokeOpacity: 0.55 }
    : { fill: '#ffffff', fillOpacity: 0.06, stroke: '#ffffff', strokeOpacity: 0.5 }
);

const FacetMapGlyph = ({
  /** The project whose fragment is filled. */
  currentId = null,
  /** A project to light without selecting it (hover or focus in the index). */
  highlightId = null,
  /** 'color' | 'ink' | 'button' */
  variant = 'color',
  /** The page's ink, for the ink variant. */
  ink = '#111318',
  /** Rendered height in px; the width follows the map's own proportions. */
  height = 54,
  className,
  style,
}) => {
  const width = height * FACET_MAP_ASPECT;
  const rest = restStyle(variant, ink);

  return (
    <svg
      className={className}
      style={style}
      width={width}
      height={height}
      viewBox={facetMap.viewBox.join(' ')}
      aria-hidden="true"
      focusable="false"
    >
      {FACET_MAP_ORDER.map((projectId) => {
        const { path } = facetMap.fragments[projectId];
        const color = FACET_MAP_COLORS[projectId];
        const isCurrent = projectId === currentId;
        const isHighlight = !isCurrent && projectId === highlightId;

        let paint = rest;
        if (isCurrent) {
          const fill = variant === 'ink' ? ink : color;
          paint = { fill, fillOpacity: 1, stroke: fill, strokeOpacity: 1 };
        } else if (isHighlight) {
          // Lit, not selected: its own colour as an outline over a light wash.
          // On a case-study page the project colour would fight the page's own,
          // so there it is the ink, a step up from the rest.
          const tint = variant === 'ink' ? ink : color;
          paint = { fill: tint, fillOpacity: 0.35, stroke: tint, strokeOpacity: 1 };
        }

        return (
          <path
            key={projectId}
            d={path}
            fill={paint.fill}
            fillOpacity={paint.fillOpacity}
            stroke={paint.stroke}
            strokeOpacity={paint.strokeOpacity}
            strokeWidth={1}
            strokeLinejoin="round"
            // 1px on screen at any size, not 1 viewBox unit.
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
};

export default FacetMapGlyph;
