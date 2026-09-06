// src/caseStudies/catalog/catalogContent.js
//
// Filler copy for the component catalog. Deliberately generic: the point is to
// see how each component behaves at a realistic amount of text, not to read it.
//
// Paragraph lengths are matched to what the real case studies run to, so the
// catalog is a fair preview of how a section will actually sit.

/** Three paragraphs — a typical SplitSection or Overview body. */
export const bodyLong = [
  'This is filler copy standing in for a real paragraph of case study writing. It runs to roughly the length a section body tends to reach, so the column measure and the leading can be judged against something realistic rather than a single short line.',
  'A second paragraph follows, because almost every section has more than one and the spacing between them is part of what makes a section read well. **Bold** is available inline for the phrase a section turns on.',
  'A third closes the thought out. If a body runs much longer than this, the section is usually trying to do the work of two.',
];

/** Two paragraphs — a typical intro above a stage. */
export const bodyShort = [
  'A shorter run of filler, the length an introduction above a piece of media usually wants: enough to set the media up, not so much that the reader has stopped looking at it.',
  'One more line to give the block a second paragraph, since a single paragraph and a double are noticeably different shapes.',
];

/** One paragraph — for the tighter slots. */
export const bodyBrief = [
  'A single paragraph of filler, for the slots where the copy is a caption-length remark rather than a passage.',
];

const media = (label, alt, extra = {}) => ({
  placeholder: label,
  alt,
  ...extra,
});

export const catalogContent = {
  projectName: 'COMPONENT CATALOG',
  title: 'Every Section, Every Variation',

  hero: {
    intro: [
      'Every section component in the case study system, with each of its variations, filled with dummy copy at a realistic length. Use it to decide which layout a piece of content wants before building it.',
      '**Section titles here are the component names.** Compose a case study with the same names and the conversation about it stays unambiguous.',
      'Two colours per case study drive everything. Every section takes `tone="a"` (colour A background) or `tone="b"` (colour B background); foreground, muted body, captions and labels are all derived from that, so nothing names a colour directly.',
      'Content lives in one module per case study, presentation lives in `src/caseStudies/system/`, and every breakpoint lives in `caseStudy.css` — a case study should not need CSS of its own beyond a custom diagram.',
    ],
    media: media(
      'Hero media — bleeds off the right edge at desktop, full width above the copy on mobile',
      'Placeholder standing in for a case study hero image.'
    ),
  },

  overview: {
    title: 'CaseStudyOverview',
    body: [
      'Narrative and media in a content column, with a metadata rail alongside. The rail starts level with the first line of body copy rather than the heading.',
      'On mobile the rail moves **ahead** of the narrative and becomes a compact two-column grid — the one section whose reading order deliberately differs from desktop.',
      ...bodyLong.slice(1),
    ],
    metadata: [
      { label: 'Role', values: ['Creator', 'Creative Direction', 'Systems + UI/UX'] },
      { label: 'Team', values: ['Product Owner', 'UX Researcher', 'Developer ×2'] },
      { label: 'Genre', values: ['Placeholder Value'] },
      { label: 'Mode', values: ['Placeholder Value'] },
      { label: 'Platform', values: ['Placeholder Value'] },
      { label: 'Outcome', values: ['A longer metadata value, to show how the rail wraps'] },
    ],
    gallery: [
      media('Gallery item 1', 'Placeholder gallery image one.'),
      media('Gallery item 2', 'Placeholder gallery image two.'),
      media('Gallery item 3', 'Placeholder gallery image three.'),
    ],
    caption: 'One caption describes the whole set. Individual items may still caption themselves.',
  },

  splitLeft: {
    title: 'SplitSection — direction="text-left"',
    body: [
      'Copy in a narrow left column, media bleeding off the **right** viewport edge. The media aligns with the first line of body copy, not the heading, so it holds its position if the title wraps.',
      ...bodyLong.slice(1),
    ],
    media: media(
      'Split media — bleeds off the right edge',
      'Placeholder standing in for split section media.'
    ),
    caption: 'The caption sits under the media, on the media column.',
  },

  splitRight: {
    title: 'SplitSection — direction="text-right"',
    body: [
      'The mirror: media bleeding off the **left** viewport edge, copy in a narrow right column. The caption is pulled back to the page gutter so it does not start off-screen.',
      'On mobile **both** directions collapse to the same order — title, body, media, caption — rather than preserving an arbitrary desktop left/right.',
      ...bodyLong.slice(2),
    ],
    media: media(
      'Split media — bleeds off the left edge',
      'Placeholder standing in for split section media.'
    ),
    caption: 'On mobile this returns to the gutter with the rest of the copy.',
  },

  sequenceMedia: {
    title: 'SequenceSection — media',
    intro: [
      'Title, introduction, a wide stage, and a caption. The stage insets 16px from each edge at desktop and keeps the left gutter while bleeding right on mobile.',
      'Supply `media` for the standard image treatment, or children for anything else. Both are shown — this one takes `media`.',
    ],
    media: media(
      'Sequence stage — a wide band, 16px from each edge',
      'Placeholder standing in for a sequence diagram.'
    ),
    caption: 'A caption under the stage, on the content gutter.',
  },

  sequenceRail: {
    title: 'MediaRail',
    intro: [
      'A row of media at one shared **height**, each item taking its width from its own aspect ratio. The opposite of MediaGallery, which fixes the columns and lets height follow — which is what keeps a row of mixed ratios level.',
      'On phones it becomes a horizontal scroller with snap, the next item peeking past the edge. `height` and `mobileHeight` are the two dials. Shown here inside a SequenceSection stage.',
    ],
    rail: [
      media('Rail 1 — portrait', 'Placeholder rail item, portrait.', { aspectRatio: '9 / 16' }),
      media('Rail 2 — portrait', 'Placeholder rail item, portrait.', { aspectRatio: '9 / 16' }),
      media('Rail 3 — square', 'Placeholder rail item, square.', { aspectRatio: '1 / 1' }),
      media('Rail 4 — landscape', 'Placeholder rail item, landscape.', { aspectRatio: '16 / 9' }),
      media('Rail 5 — portrait', 'Placeholder rail item, portrait.', { aspectRatio: '9 / 16' }),
    ],
    caption: 'Mixed ratios, one height. The rail scrolls when the row does not fit.',
    takeaway: [
      '**SequenceSection also takes an optional takeaway**, rendered under the stage — the closing remark a sequence earns.',
    ],
  },

  featureCentered: {
    title: 'FeatureSection — align="center"',
    intro: [
      'The default, and what the reference design specifies: centred title, centred introduction, a full-bleed stage, a centred caption, and an optional takeaway.',
      'The stage takes arbitrary children and imposes **no height** — it is sized entirely by what it contains, and that child owns its own responsive behaviour.',
    ],
    media: media(
      'Feature stage — full bleed, height set by its content',
      'Placeholder standing in for a feature diagram.'
    ),
    caption: 'The stage caption centres under the media at desktop, and returns to the gutter on mobile.',
    takeaway: [
      '**A takeaway closes the section.**',
      'It takes the same body treatment as the introduction, so a feature can end on a statement rather than trailing off after its caption.',
    ],
  },

  featureStart: {
    title: 'FeatureSection — align="start"',
    intro: [
      'The left-aligned variant. The copy starts on the gutter and the stage comes with it, so the heading, introduction, media, caption and takeaway all share one left edge.',
      'The stage caption keeps the base treatment either way — centred under the media at desktop, on the gutter at mobile — because it describes the stage rather than the column.',
    ],
    gallery: [
      media('2-up item 1', 'Placeholder gallery image one.'),
      media('2-up item 2', 'Placeholder gallery image two.'),
    ],
    caption: 'MediaGallery — layout="2-up", shown inside a left-aligned feature stage.',
  },

  featured: {
    title: 'FeaturedGallery',
    intro: [
      'One lead item at full size beside a grid of supporting ones — the shape MediaGallery cannot make: a set too large for 2-up or 3-up, with one member that is the point.',
      'The two columns come out level on their own; the split is derived from the supplied aspect ratios. `maxWidth` is the single dial for how tall the whole exhibit is, and `columns` sets the supporting grid at desktop.',
    ],
    featured: media('Lead item — portrait', 'Placeholder lead image.', {
      aspectRatio: '3 / 5',
    }),
    items: [
      media('Supporting 1', 'Placeholder supporting image one.', { aspectRatio: '1 / 1' }),
      media('Supporting 2', 'Placeholder supporting image two.', { aspectRatio: '1 / 1' }),
      media('Supporting 3', 'Placeholder supporting image three.', { aspectRatio: '1 / 1' }),
      media('Supporting 4', 'Placeholder supporting image four.', { aspectRatio: '1 / 1' }),
      media('Supporting 5', 'Placeholder supporting image five.', { aspectRatio: '1 / 1' }),
      media('Supporting 6', 'Placeholder supporting image six.', { aspectRatio: '1 / 1' }),
    ],
    caption: 'Opening any item hands the whole set to the viewer, lead first.',
  },

  galleries: {
    title: 'MediaGallery — 3-up and stacked',
    intro: [
      'Fixed columns, height following. `layout` takes `2-up`, `3-up`, or `stacked`; multi-column layouts collapse to one column on phones, where three across would be illegible.',
      'Every item routes through CaseStudyMedia, so opening one hands the whole set to the viewer. The 2-up is shown in the section above.',
    ],
    threeUp: [
      media('3-up item 1', 'Placeholder gallery image one.'),
      media('3-up item 2', 'Placeholder gallery image two.'),
      media('3-up item 3', 'Placeholder gallery image three.'),
    ],
    stacked: [
      media('Stacked item 1', 'Placeholder stacked image one.', { aspectRatio: '21 / 9' }),
      media('Stacked item 2', 'Placeholder stacked image two.', { aspectRatio: '21 / 9' }),
    ],
    caption: 'Two galleries in one stage: 3-up above, stacked below.',
  },

  mediaPrimitive: {
    title: 'CaseStudyMedia',
    intro: [
      'The single media primitive every section renders through. It handles aspect-ratio reservation so nothing shifts as images load, lazy loading below the fold, `contain` and `cover` fitting, a separate `fullSrc` loaded only by the enlarged view, and `expandable` for click-to-enlarge.',
      'Media with no `src` renders the placeholder you are looking at, at the exact size the real asset will occupy — so dropping artwork in later is a content change, never a layout one. The key is **`src`**, not `placeholder`.',
    ],
    ratios: [
      media('aspectRatio 21 / 9', 'Placeholder at 21 by 9.', { aspectRatio: '21 / 9' }),
      media('aspectRatio 16 / 9', 'Placeholder at 16 by 9.', { aspectRatio: '16 / 9' }),
      media('aspectRatio 4 / 3', 'Placeholder at 4 by 3.', { aspectRatio: '4 / 3' }),
      media('aspectRatio 1 / 1', 'Placeholder at 1 by 1.', { aspectRatio: '1 / 1' }),
      media('aspectRatio 3 / 4', 'Placeholder at 3 by 4.', { aspectRatio: '3 / 4' }),
    ],
    caption: 'A rail of the common ratios, so a shape can be picked by eye.',
  },

  conclusion: {
    outcomes: [
      { value: 'Outcome Value', detail: 'A short supporting detail' },
      { value: '3 Days', detail: 'Outcomes take a value and a detail' },
      { value: '~4 Months', detail: 'There is no cap on how many are listed' },
      { value: 'A Fourth', detail: 'A fourth, to show the rhythm holds' },
    ],
    lessons: [
      'ConclusionSection closes a case study: outcome items in a narrow left column, reflection in a wide right one. On mobile it stacks — outcomes, then reflection.',
      ...bodyLong,
      'The reflection column takes as many paragraphs as the writing needs; it is the longest body in the system and the measure is set for that.',
    ],
    takeaway:
      'An optional takeaway renders at full emphasis under the reflection — the one sentence the case study is for.',
  },
};

export default catalogContent;
