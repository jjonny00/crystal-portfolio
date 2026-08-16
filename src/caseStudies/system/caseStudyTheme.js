// src/caseStudies/system/caseStudyTheme.js
//
// Every case study is themed by exactly two colours. Sections pick which one is
// the background by declaring a tone:
//
//   tone="a" -> colour A background / colour B foreground
//   tone="b" -> colour B background / colour A foreground
//
// The pair is published to CSS as --cs-color-a / --cs-color-b on the page root;
// the stylesheet resolves --cs-bg / --cs-fg from the tone attribute, so no
// component ever needs to reason about which colour is which.

export const DEFAULT_CASE_STUDY_COLORS = Object.freeze({
  a: '#EAFF00',
  b: '#001014',
});

export const TONES = Object.freeze(['a', 'b']);

export const normalizeTone = (tone) => (TONES.includes(tone) ? tone : 'b');

export const normalizeCaseStudyColors = (colors) => ({
  a: colors?.a || DEFAULT_CASE_STUDY_COLORS.a,
  b: colors?.b || DEFAULT_CASE_STUDY_COLORS.b,
});

export const buildCaseStudyThemeStyle = (colors) => {
  const { a, b } = normalizeCaseStudyColors(colors);
  return {
    '--cs-color-a': a,
    '--cs-color-b': b,
  };
};

/** The colour a tone renders its background in — useful for page chrome. */
export const backgroundColorForTone = (tone, colors) => {
  const { a, b } = normalizeCaseStudyColors(colors);
  return normalizeTone(tone) === 'a' ? a : b;
};

/** The colour a tone renders its text in. */
export const foregroundColorForTone = (tone, colors) => {
  const { a, b } = normalizeCaseStudyColors(colors);
  return normalizeTone(tone) === 'a' ? b : a;
};
