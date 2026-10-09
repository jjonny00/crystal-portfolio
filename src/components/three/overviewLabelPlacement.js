// src/components/three/overviewLabelPlacement.js
//
// Settings and geometry for the overview's placed labels
// (`overviewLabels.mode: 'placed'` in the layout JSON; PlacedOverviewLabels
// draws them).
//
// Labels sit on two loose rails, both flush left: the left rail at
// `edgeMargin`, the right one at `rightColumn` of the canvas width. Each label
// sits beside its fragment's middle on screen: nudged off its rail by `dx`,
// its vertical centre `dy` from the fragment's.
//
// Per project (`items[projectKey]`):
//   side   'left' | 'right'  which rail
//   dx     px                nudge off the rail
//   dy     px                the label's vertical centre, from the fragment's
//   dot    [px, px]          the connector's dot, from the fragment's middle
//   exit   'inner' (default) the connector leaves the title's inner edge
//          'below'           it drops from under the label, near the title's
//                            outer end, for a fragment right under it
//
// Shared:
//   edgeMargin      px from the canvas's left edge to the left rail
//   rightColumn     where the right rail is, as a fraction of the canvas width
//   connectorGap    px between the title and the start of its connector
//   connectorRadius px, the rounded corner where the connector turns
//   connectorWidth  px, the line's stroke
//   connectorLift   how far the line's project colour is lifted toward white
//   rightAlign      right-rail labels set flush right, their right edges
//                   `edgeMargin` in from the screen's right edge

export const OVERVIEW_LABEL_DEFAULTS = {
  mode: 'list',
  edgeMargin: 24,
  rightColumn: 0.665,
  connectorGap: 5,
  connectorRadius: 6,
  connectorWidth: 1,
  connectorLift: 0.5,
  rightAlign: false,
};

export const OVERVIEW_TITLE_INK = '#FFFCEE';

const point = ({ x, y }) => `${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10}`;

// The least sideways room, between the title and the dot, for a connector to
// leave the title and still turn into the dot.
const MIN_ACROSS_RUN_PX = 8;

// One right-angle run from `start` to `end` with a rounded corner: along the
// first axis, round the corner, then straight along the other into `end`.
const elbow = (start, end, firstAxis, radius) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const r = Math.min(radius, Math.abs(dx), Math.abs(dy));
  if (r < 0.5) return `M${point(start)}L${point(end)}`;
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  if (firstAxis === 'x') {
    const corner = { x: end.x, y: start.y };
    return `M${point(start)}L${point({ x: corner.x - sx * r, y: corner.y })}`
      + `Q${point(corner)} ${point({ x: corner.x, y: corner.y + sy * r })}L${point(end)}`;
  }
  const corner = { x: start.x, y: end.y };
  return `M${point(start)}L${point({ x: corner.x, y: corner.y - sy * r })}`
    + `Q${point(corner)} ${point({ x: corner.x + sx * r, y: corner.y })}L${point(end)}`;
};

// Where a connector leaves the title on its inner side (the side facing the
// scene), `gap` clear of the type, at the title's mid-height. The title can be
// set flush left or right in its label, so this goes by where it actually is.
const titleInnerEdge = (box, side, gap) => ({
  x: side === 'left' ? box.titleLeft + box.titleWidth + gap : box.titleLeft - gap,
  y: box.titleMiddle,
});

/**
 * For a label whose fragment sits right under it, with no room on the inner
 * side (`exit: 'below'`): straight down from under the label, half a corner
 * radius in from the title's outer end, one rounded corner, then level into
 * the dot. (Up from above it, for a fragment over the label.)
 */
const belowRoute = (box, side, end, gap, radius) => {
  const x = side === 'right'
    ? box.titleLeft + box.titleWidth - radius / 2
    : box.titleLeft + radius / 2;
  const start = { x, y: end.y > box.height / 2 ? box.height + gap : -gap };
  return { start, d: elbow(start, end, 'y', radius) };
};

/**
 * The one shape every connector takes: a level run out of the title's inner
 * edge (the side facing the scene), at the title's mid-height, one rounded
 * right-angle corner, then straight up or down into the dot. A dot level with
 * the title gets a straight run.
 *
 * Only if the dot is not past the label's inner edge (it sits above or below
 * the label) does the line leave the label's top or bottom instead, with the
 * same corner turning it sideways into the dot.
 *
 * All in the label's own coordinates (its top-left is 0,0).
 *
 * @param {{ width: number, height: number, titleLeft: number, titleWidth: number, titleMiddle: number }} box
 * @param {'left'|'right'} side  which rail the label is on
 * @param {{ x: number, y: number }} end  the dot
 * @returns {{ start: {x,y}, d: string }}
 */
export const connectorRoute = (box, side, end, { connectorGap: gap, connectorRadius: radius }, exit = 'inner') => {
  const inward = side === 'left' ? 1 : -1;
  if (exit === 'below') return belowRoute(box, side, end, gap, radius);
  const across = titleInnerEdge(box, side, gap);
  // The corner tightens to fit a dot closer in than the radius (elbow clamps
  // it), so the line still leaves the title as long as there is room to turn.
  if ((end.x - across.x) * inward >= MIN_ACROSS_RUN_PX) {
    return { start: across, d: elbow(across, end, 'x', radius) };
  }

  const x = Math.min(Math.max(end.x, gap), box.width - gap);
  const vertical = { x, y: end.y > box.height / 2 ? box.height + gap : -gap };
  return { start: vertical, d: elbow(vertical, end, 'y', radius) };
};

// A colour lifted toward white by `amount` (0-1), mixed in sRGB.
export const liftColor = (hex, amount) => {
  const lift = Math.min(Math.max(amount || 0, 0), 1);
  const digits = hex.replace('#', '');
  const channels = [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16));
  return `#${channels
    .map((c) => Math.round(c + (255 - c) * lift).toString(16).padStart(2, '0'))
    .join('')}`;
};

// The connector's colour: the project's, lifted so a thin line still reads on
// the scene. The type stays one colour; the crystals and these lines carry the
// projects' colours.
export const connectorColor = (project, config) =>
  liftColor(project.headlineColor || OVERVIEW_TITLE_INK, config.connectorLift);
