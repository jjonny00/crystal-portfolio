// src/lib/squircle.js
//
// Rounded rectangles with smoothed corners: the curvature eases in along the
// straight edge instead of starting at the tangent point, the way iOS draws its
// buttons and app icons. A CSS `border-radius` is a quarter circle, so the edge
// meets the curve with a step in curvature that reads as a slight kink; a smoothed
// corner has no step.
//
// The geometry is Figma's corner smoothing (the algorithm published by
// phamfoo/figma-squircle, MIT): each corner is a short circular arc in the middle,
// with a cubic Bézier either side that starts `(1 + smoothing) * radius` back along
// the edge. Smoothing 0 is a plain circular corner; 1 has no arc left at all.

/** Figma's "iOS" preset, and what iOS itself draws. */
export const IOS_CORNER_SMOOTHING = 0.6;

const toRad = (deg) => (deg * Math.PI) / 180;
const fmt = (value) => Number(value.toFixed(3));

/**
 * The Bézier and arc lengths for one corner.
 *
 * `budget` is how far from the corner the curve may reach: half the shorter side,
 * so two corners on the same edge never overlap. When the smoothed corner would
 * overrun it, the smoothing gives way and the radius is kept, which is what
 * Figma does with "preserve smoothing" off. That only happens on a shape whose
 * short side is under about three radii.
 */
const cornerParams = (radius, smoothing, budget) => {
  const r = Math.min(radius, budget);
  let s = smoothing;
  let p = (1 + s) * r;
  if (p > budget) {
    s = Math.max(0, budget / r - 1);
    p = budget;
  }

  const arcMeasure = 90 * (1 - s);
  const arc = Math.sin(toRad(arcMeasure / 2)) * r * Math.SQRT2;
  const angleAlpha = (90 - arcMeasure) / 2;
  const p3ToP4 = r * Math.tan(toRad(angleAlpha / 2));
  const angleBeta = 45 * s;
  const c = p3ToP4 * Math.cos(toRad(angleBeta));
  const d = c * Math.tan(toRad(angleBeta));
  const b = (p - arc - c - d) / 3;
  const a = 2 * b;

  return { r, p, a, b, c, d, arc };
};

/**
 * SVG path data for a smoothed rounded rectangle at (x, y), size width x height.
 * Every corner takes the same radius.
 */
export const squirclePath = ({
  x = 0,
  y = 0,
  width,
  height,
  radius,
  smoothing = IOS_CORNER_SMOOTHING,
}) => {
  if (!(width > 0) || !(height > 0)) return '';
  if (!(radius > 0)) {
    return `M ${fmt(x)} ${fmt(y)} H ${fmt(x + width)} V ${fmt(y + height)} H ${fmt(x)} Z`;
  }

  const { r, p, a, b, c, d, arc } = cornerParams(radius, smoothing, Math.min(width, height) / 2);
  const ab = a + b;
  const abc = a + b + c;
  const R = fmt(r);
  const n = fmt;

  return [
    // Top edge, into the top-right corner.
    `M ${n(x + width - p)} ${n(y)}`,
    `c ${n(a)} 0 ${n(ab)} 0 ${n(abc)} ${n(d)}`,
    `a ${R} ${R} 0 0 1 ${n(arc)} ${n(arc)}`,
    `c ${n(d)} ${n(c)} ${n(d)} ${n(b + c)} ${n(d)} ${n(abc)}`,
    // Right edge, bottom-right corner.
    `L ${n(x + width)} ${n(y + height - p)}`,
    `c 0 ${n(a)} 0 ${n(ab)} ${n(-d)} ${n(abc)}`,
    `a ${R} ${R} 0 0 1 ${n(-arc)} ${n(arc)}`,
    `c ${n(-c)} ${n(d)} ${n(-(b + c))} ${n(d)} ${n(-abc)} ${n(d)}`,
    // Bottom edge, bottom-left corner.
    `L ${n(x + p)} ${n(y + height)}`,
    `c ${n(-a)} 0 ${n(-ab)} 0 ${n(-abc)} ${n(-d)}`,
    `a ${R} ${R} 0 0 1 ${n(-arc)} ${n(-arc)}`,
    `c ${n(-d)} ${n(-c)} ${n(-d)} ${n(-(b + c))} ${n(-d)} ${n(-abc)}`,
    // Left edge, top-left corner.
    `L ${n(x)} ${n(y + p)}`,
    `c 0 ${n(-a)} 0 ${n(-ab)} ${n(d)} ${n(-abc)}`,
    `a ${R} ${R} 0 0 1 ${n(arc)} ${n(-arc)}`,
    `c ${n(c)} ${n(-d)} ${n(b + c)} ${n(-d)} ${n(abc)} ${n(-d)}`,
    'Z',
  ].join(' ');
};
