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
 * `button` sit on the scene (the button on its own dark disc), in white unless
 * given the ink the preview's copy is set in; `ink` sits on a case-study page
 * and takes the page's ink, never a project colour.
 */
const restStyle = (variant, ink, restInk) => {
  if (variant === 'ink') return { fill: ink, fillOpacity: 0, stroke: ink, strokeOpacity: 0.55 };
  const line = restInk || '#ffffff';
  return { fill: line, fillOpacity: 0.06, stroke: line, strokeOpacity: 0.5 };
};

const GLYPH_TRANSITION = [
  'fill 250ms ease',
  'fill-opacity 250ms ease',
  'stroke 250ms ease',
  'stroke-opacity 250ms ease',
].join(', ');

const FacetMapGlyph = ({
  /** The project whose fragment is filled. */
  currentId = null,
  /** A project to light without selecting it (hover or focus in the index). */
  highlightId = null,
  /** 'color' | 'ink' | 'button' */
  variant = 'color',
  /** The page's ink, for the ink variant. */
  ink = '#111318',
  /**
   * The colour variant's outlines, where white would not read: over a preview
   * whose copy is set dark (scrimTone), that copy's ink.
   */
  restInk = null,
  /** Rendered height in px; the width follows the map's own proportions. */
  height = 54,
  /**
   * Fade between states (a new current project, a highlight coming and going).
   * Colour only: the outlines never move. Off for reduced motion.
   */
  animate = false,
  /**
   * Pointer handlers per fragment, given the project id. Set, the fragments take
   * the pointer (the index panel's map); unset, the glyph is only a picture.
   * Pointer only: the panel's rows are the controls keyboards and assistive tech
   * use.
   */
  onFragmentEnter,
  onFragmentLeave,
  onFragmentClick,
  className,
  style,
}) => {
  const interactive = Boolean(onFragmentEnter || onFragmentClick);
  const width = height * FACET_MAP_ASPECT;
  const rest = restStyle(variant, ink, restInk);

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
            // As style rather than attributes so a CSS transition can carry them.
            style={{
              fill: paint.fill,
              fillOpacity: paint.fillOpacity,
              stroke: paint.stroke,
              strokeOpacity: paint.strokeOpacity,
              transition: animate ? GLYPH_TRANSITION : undefined,
              cursor: interactive ? 'pointer' : undefined,
            }}
            onPointerEnter={onFragmentEnter && (() => onFragmentEnter(projectId))}
            onPointerLeave={onFragmentLeave && (() => onFragmentLeave(projectId))}
            onClick={onFragmentClick && (() => onFragmentClick(projectId))}
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
