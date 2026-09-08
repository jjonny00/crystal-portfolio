// src/legibility/scrimTone.js
//
// The scrim a project's preview copy sits on, and the ink that copy takes, are
// two halves of one decision — and they are read by two different components.
// This is the one place that holds both, so a project cannot end up with a wash
// from one recipe and an ink from the other.
//
// Two recipes.
//
// The default deepens what is already there: colorA is the colour at the bottom
// of that project's sky (GradientBackground maps t = 0 to straight down), so a
// light wash of it grounds the copy in the project's own colour, and the cream
// ink carries.
//
// A few palettes have a colorA light enough that this backfires — washing a light
// colour over the scene lifts the backdrop into the mid greys instead of pushing
// it down, which is the exact band cream copy disappears into. FundSeeder's teal
// is the case that forced the second recipe. Rather than fight the colour, that
// recipe goes with it: lift the wash the rest of the way to near-white and flip
// the copy to the dark ink. The section reads as a light panel instead of a dark
// one, which is a bigger change than a tweak — which is why it is opt-in per
// project via `scrimInvert` in projectBackgrounds rather than something derived
// from a luminance threshold that would reclassify a project the moment someone
// nudged its palette.

import { projectBackgrounds } from '../data/projectBackgrounds';

/** The dark ink, matching backdropInk.js's `dark` tone so the page has one. */
const DARK_INK = '#14120C';
const DARK_INK_RGB = [20, 18, 12];

const DEFAULT_WASH = {
  /** Tint opacity below the fade, held to the bottom of the screen. */
  opacity: 0.35,
  /** How much of colorA survives; the default is the colour itself. */
  mix: 1,
  ground: [0, 0, 0],
};

/**
 * The inverted recipe. Its worst case is the opposite of the default's: a light
 * wash is thinnest over a *black* frame, not a blown-out one, so the numbers are
 * derived there. FundSeeder's #45afa9 through this lands the backdrop at sRGB
 * 0.55 over pure black, which the dark ink clears at 6.6:1 — and every brighter
 * frame only improves it. Drop either number and that falls away fast.
 */
const INVERTED_WASH = {
  opacity: 0.66,
  mix: 0.22,
  ground: [255, 255, 255],
};

/**
 * How much of an accent survives on an inverted project. The CTA is the one
 * control in the block and it is drawn in the project's accent, which on a
 * near-white panel is a mint line on white. This keeps the hue and moves the
 * value — the same trade the wash makes, in the other direction — rather than
 * dropping the accent for a flat black and losing the project from the control
 * entirely. At 0.15 the CTA clears the panel at 4.9:1.
 */
const INVERTED_ACCENT_MIX = 0.15;

const toRgb = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const mix = (rgb, ground, amount) => rgb.map((channel, i) => (
  Math.round(channel * amount + ground[i] * (1 - amount))
));

/**
 * The scrim recipe for one scene key ('project03', and so on).
 *
 * `wash` is the scrim's own background colour, alpha included. `ink` is what the
 * body copy over it should be, and is only ever the authored cream or the dark
 * ink — it is a fallback colour, not a measured one, since the probe reads the
 * canvas underneath this layer and cannot see the wash at all.
 */
export const getScrimTone = (sceneKey) => {
  const scheme = projectBackgrounds[sceneKey] || projectBackgrounds.default;
  const inverted = Boolean(scheme.scrimInvert);
  const recipe = inverted ? INVERTED_WASH : DEFAULT_WASH;
  const rgb = mix(toRgb(scheme.colorA), recipe.ground, recipe.mix);

  return {
    inverted,
    wash: `rgba(${rgb.join(', ')}, ${recipe.opacity})`,
    ink: inverted ? DARK_INK : '#E2DCC3',
  };
};

/** An accent colour as it should be drawn on this project's scrim. */
export const accentInkFor = (accentHex, inverted) => {
  if (!inverted) return accentHex;
  const rgb = mix(toRgb(accentHex), DARK_INK_RGB, INVERTED_ACCENT_MIX);
  return `rgb(${rgb.join(', ')})`;
};
