// src/config/overviewLayout.js
//
// Geometry of the overview's project-label column, shared by the label layer that
// renders it (FacetLabels) and the vertical energy line that has to sit just off
// its leading edge. The line measures the real column when it exists; these
// constants are what it falls back to during the hero → overview transition,
// before the label layer has been created.

export const OVERVIEW_COLUMN = {
  // Desktop only — on mobile the labels run full width along the bottom.
  widthVw: 33.333,
  insetVw: 6,
};

// Optical gap between the rail and the left edge of the label column.
export const OVERVIEW_RAIL_GAP_PX = 20;

export const getOverviewColumnLeft = (viewportWidth) =>
  viewportWidth * (1 - (OVERVIEW_COLUMN.insetVw + OVERVIEW_COLUMN.widthVw) / 100);
