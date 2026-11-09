// src/caseStudies/secondsentence/secondSentenceContent.js
//
// The devlog archive's own copy: the introduction, the status rail and About the
// Game. Entries are not here; they are MDX files in src/devlog/content/entries/.
// The project's title, descriptor and colours are in src/data/projects.js.
//
// Everything here is the game's established design, not progress: no
// milestones, no results. Progress is what entries are for.

export const secondSentenceContent = {
  intro: [
    'A movement-driven third-person action shooter set inside an enormous interstellar prison cell. This devlog follows the game’s development and the systems-design decisions behind it.',
  ],

  // CaseStudyMetadata's { label, values }.
  status: [
    { label: 'Status', values: ['In development'] },
    { label: 'Current prototype', values: ['Third-person movement', 'The Remnant Suit'] },
    { label: 'Engine', values: ['Unreal Engine'] },
  ],

  emptyMessage: 'The first entry is on its way.',

  about: {
    title: 'About the Game',
    body: [
      'The prison offers lethal contracts to reduce the player’s sentence. Instead of letting anyone leave the cell, it warps bounded sections of distant worlds into it. Zero Day is the day the sentence reaches zero.',
    ],
    terms: [
      {
        name: 'The Cell',
        text: 'Everything happens inside it. The player never leaves; the worlds come to them.',
      },
      {
        name: 'Contracts',
        text: 'Lethal work the prison offers in exchange for time off the sentence.',
      },
      {
        name: 'Echo Suits',
        text: 'An equipment category. Each suit changes how movement and combat interact.',
      },
      {
        name: 'The Remnant Suit',
        text: 'The first prototype suit. While armed, qualifying movement actions leave temporary explosive copies of the player: up to three at once, each lasting five seconds unless triggered sooner.',
      },
    ],
  },
};

export default secondSentenceContent;
