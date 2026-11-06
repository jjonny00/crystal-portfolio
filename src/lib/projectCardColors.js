// src/lib/projectCardColors.js
//
// A project's two phone colours: the project card's fill and its ink. The card
// takes the case study hero's (tone "a" in caseStudyTheme.js: colour A the fill,
// colour B the ink), so the preview reads as the first page of the case study it
// opens. A project without case study colours fills with its own accent, inked
// in whichever of the default dark or a light cream reads better on it.
//
// Read by the card (ProjectFocusSection) and by the facet map's disc beside the
// card's CTA (FacetMapNav), which takes the CTA's fill, the card's ink.

import {
  DEFAULT_CASE_STUDY_COLORS,
  backgroundColorForTone,
  foregroundColorForTone,
} from '../caseStudies/system/caseStudyTheme';

const HERO_TONE = 'a';
const LIGHT_INK = '#f4f3ef';

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const inkFor = (fill) => {
  if (!/^#[0-9a-f]{6}$/i.test(fill)) return DEFAULT_CASE_STUDY_COLORS.b;
  const l = luminance(fill);
  const onDark = (l + 0.05) / (luminance(DEFAULT_CASE_STUDY_COLORS.b) + 0.05);
  const onLight = (luminance(LIGHT_INK) + 0.05) / (l + 0.05);
  return onDark >= onLight ? DEFAULT_CASE_STUDY_COLORS.b : LIGHT_INK;
};

/** The project's accent: its headline colour, or its colour. */
const accentOf = (project) => project.headlineColor || project.color || '#ffffff';

/** `{ bg, fg }`: the card's fill and its ink. */
export const projectCardColors = (project) => {
  const accent = accentOf(project);
  const colors = project.caseStudyColors ?? { a: accent, b: inkFor(accent) };
  return {
    bg: backgroundColorForTone(HERO_TONE, colors),
    fg: foregroundColorForTone(HERO_TONE, colors),
  };
};
