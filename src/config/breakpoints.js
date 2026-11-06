export const MQ_DESKTOP = '(min-width: 768px)';
export const MQ_MOBILE = '(max-width: 767.98px)';
export const MQ_HOVER_CAPABLE = '(hover: hover) and (pointer: fine)';
export const MQ_REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

// Where the nav swaps to its smaller type — the wordmark drops 36px -> 28px and
// the items 24px -> 18px (Navigation.jsx). Its own breakpoint, not the site's
// mobile one: anything sized to the nav's ink has to turn over where the nav
// does, not where the layout does.
export const MQ_NAV_DESKTOP = '(min-width: 1024px)';

// Where the facet map sits in the left gutter (docs/facet-map.md): from here the
// gutter (--page-edge) holds its 44px-wide target with room either side. Below,
// it is the button at the top right. facet-map.css carries the same width.
export const MQ_FACET_MAP_GUTTER = '(min-width: 1230px)';
