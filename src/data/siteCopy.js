// src/data/siteCopy.js
//
// The portfolio's own copy (hero and About), kept out of the components so the
// build-time prerender (src/seo/entry-server.jsx) publishes exactly the words a
// reader sees. Project copy lives in projects.js; case-study copy in each case
// study's *Content.js.

export const HERO_HEADLINE_LINES = ['THE SYSTEMS', 'BENEATH', 'THE SURFACE'];

export const HERO_ROLE_LINES = ['PRINCIPAL PRODUCT DESIGNER', 'SYSTEMS AND INTERACTION'];

export const HERO_BODY_COPY =
  'I design systems that shape how people decide, compete, and engage. My work focuses on the mechanics underneath the experience: the rules, feedback, and tradeoffs that turn interaction into something worth mastering. Across products and games, I build systems that reward intent.';

export const HERO_BODY_COPY_MOBILE =
  'I design systems that shape how people decide, compete, and engage. Across products and games, I turn rules, feedback, and tradeoffs into experiences that reward intent.';

export const ABOUT_TITLE = 'Shaped Through Iteration';

export const ABOUT_PARAGRAPHS = [
  'Every project has shaped how I approach the next, refining the process, challenging assumptions, and finding clearer ways to turn an idea into an experience. Over time, that process has expanded to move fluidly between systems thinking, visual design, and implementation. I’m most interested in the point where structure becomes experience, when rules, feedback, and tradeoffs take on a clear, expressive form people can understand and feel.',
  'I co-founded the studio that became Forest Giant and spent fifteen years helping grow it from a small team into a multidisciplinary studio of more than thirty people. Today, my work ranges from shaping complex product systems at FundSeeder to building and testing combat mechanics in Slipstream. Prototyping allows me to carry ideas into playable form, where they can be tested through interaction rather than debated in the abstract.',
  'I believe the strongest work comes from blended teams. Bringing designers, developers, stakeholders, and other disciplines into the process early exposes blind spots, surfaces constraints sooner, and gives each perspective a real hand in shaping the outcome. I often work between those groups, preserving intent as ideas move toward implementation and making sure no voice is lost, especially the user or player at the center of the system.'
];

export const ABOUT_STATS = [
  { value: '20+ Years', label: 'Designing interactive systems' },
  { value: '15 Years · 30+ Person Team', label: 'Building and leading a multidisciplinary studio' },
  { value: '150K Downloads · Top 5 Free Game', label: 'Mesa’s first week on iOS' }
];
