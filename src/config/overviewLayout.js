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

// Gap between the line and the leading edge of the label column. Tighter on
// mobile, where the line sits just inside the left margin and the labels take the
// rest of the width.
export const OVERVIEW_RAIL_GAP_PX = 20;
export const OVERVIEW_RAIL_GAP_MOBILE_PX = 10;

// Where the line sits before it has been measured. Only used for the very first
// paint — the line measures the real arrow on mount, long before the overview is
// ever reached. Desktop tracks the viewport (the hero grid splits by proportion);
// mobile is a fixed inset, because there the CTA is flush to the left margin.
export const OVERVIEW_RAIL_X_FALLBACK_VW = 52.6;
export const OVERVIEW_RAIL_X_FALLBACK_MOBILE_PX = 26;

// Right margin of the mobile label column.
export const OVERVIEW_COLUMN_RIGHT_MOBILE_PX = 16;
