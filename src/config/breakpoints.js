export const MQ_DESKTOP = '(min-width: 768px)';
export const MQ_MOBILE = '(max-width: 767.98px)';
export const MQ_HOVER_CAPABLE = '(hover: hover) and (pointer: fine)';
export const MQ_REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

// Where the nav swaps to its smaller type — the wordmark drops 36px -> 28px and
// the items 24px -> 18px (Navigation.jsx). Its own breakpoint, not the site's
// mobile one: anything sized to the nav's ink has to turn over where the nav
// does, not where the layout does.
export const MQ_NAV_DESKTOP = '(min-width: 1024px)';
