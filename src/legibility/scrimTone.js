// src/legibility/scrimTone.js
//
// The scrim a project's preview copy sits on, and the ink that copy takes. Two
// halves of one decision, read by two different components — ProjectScrim draws
// the wash, ProjectFocusSection colours the copy — so both come from here and a
// project cannot end up with a wash from one recipe and an ink from the other.
//
// Authored per project in data/projects.js under `scrim`, not derived and not
// measured.
//
// An earlier version solved the opacity live, from a reading of the frame behind
// the copy. It hit its contrast target, but a surface that moves while you look
// at it is its own problem, and the crystal is never quite still: every reading
// was defensible and the scrim still breathed. A number you can see in the file,
// change, and reload beats one that is always technically correct. Measuring is
// still how the DESKTOP copy picks its ink (legibility/backdropInk.js) — there it
// moves the glyphs' colour rather than a surface behind them, and it can only
// land on one of two authored inks.
//
// What each project authors:
//
//   scrim: {
//     opacity,    // 0–1, how much of the wash colour lands
//     darkText,   // true = near-black copy on a light wash, for bright sections
//     color,      // optional; defaults to the project's own sky (colorA)
//   }

import projects from '../data/projects';
import { projectBackgrounds } from '../data/projectBackgrounds';

/** The two inks the copy is ever drawn in. Dark is warm, to match backdropInk.js. */
const CREAM_INK = '#E2DCC3';
const DARK_INK = '#14120C';
const DARK_INK_RGB = [20, 18, 12];

/**
 * For a project with no `scrim` block. Deliberately a middling wash rather than a
 * light one: an unauthored project should be readable first and pretty second.
 */
const DEFAULT_SCRIM = { opacity: 0.55, darkText: false };

/**
 * How much of an accent survives on a dark-text project. The CTA is the one
 * control in the block and it is drawn in the project's accent, which on a light
 * panel is a pale line on near-white. This keeps the hue and moves the value —
 * the same trade the wash makes, in the other direction — rather than dropping
 * the accent for a flat black and losing the project from the control entirely.
 */
const DARK_TEXT_ACCENT_MIX = 0.15;

const byKey = new Map();
projects.forEach((project) => {
  byKey.set(project.id, project);
  if (project.facetKey) byKey.set(project.facetKey, project);
});

const toRgb = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const mix = (rgb, ground, amount) => rgb.map((channel, i) => (
  Math.round(channel * amount + ground[i] * (1 - amount))
));

const clamp01 = (value, fallback) => (
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback
);

/**
 * The scrim recipe for one project key ('project03', and so on).
 *
 * `wash` is the scrim's own background colour, alpha included. `ink` is what the
 * body copy over it takes. `inverted` says which way round it went, for anything
 * that has to follow — the CTA's accent, mainly.
 */
export const getScrimTone = (projectKey) => {
  const project = byKey.get(projectKey);
  const scrim = project?.scrim || DEFAULT_SCRIM;
  const inverted = Boolean(scrim.darkText);

  const scheme = projectBackgrounds[projectKey] || projectBackgrounds.default;
  const color = scrim.color || scheme.colorA;
  const opacity = clamp01(scrim.opacity, DEFAULT_SCRIM.opacity);

  return {
    inverted,
    wash: `rgba(${toRgb(color).join(', ')}, ${opacity})`,
    opacity,
    ink: inverted ? DARK_INK : CREAM_INK,
  };
};

/** An accent colour as it should be drawn on this project's scrim. */
export const accentInkFor = (accentHex, inverted) => {
  if (!inverted) return accentHex;
  const rgb = mix(toRgb(accentHex), DARK_INK_RGB, DARK_TEXT_ACCENT_MIX);
  return `rgb(${rgb.join(', ')})`;
};
