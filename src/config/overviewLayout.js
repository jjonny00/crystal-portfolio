// src/config/overviewLayout.js
//
// Geometry of the overview's project-label column.
//
// The column is positioned off the vertical energy line rather than off the right
// edge of the viewport: the line stays where the hero's CTA arrow put it, and the
// labels sit beside it. VerticalEnergyLine publishes that measured x as
// `--overview-rail-x` on the document element; FacetLabels reads it in CSS.

export const OVERVIEW_COLUMN = {
  // Desktop only — on mobile the labels run full width along the bottom.
  widthVw: 33.333,
};

// Gap between the line and the leading edge of the label column.
export const OVERVIEW_RAIL_GAP_PX = 20;

// Where the line sits before it has been measured, as a fraction of the viewport
// width. Only used for the very first paint — the line measures the real arrow on
// mount, long before the overview is ever reached.
export const OVERVIEW_RAIL_X_FALLBACK_VW = 52.6;
