// src/data/siteCopy.js
//
// The portfolio's own copy (hero and About), kept out of the components so the
// build-time prerender (src/seo/entry-server.jsx) publishes exactly the words a
// reader sees. Project copy lives in projects.js; case-study copy in each case
// study's *Content.js.

export const HERO_HEADLINE_LINES = ['SYSTEMS', 'BENEATH THE SURFACE'];

// Set in bold wherever they appear in the hero copy, long or short.
export const HERO_BODY_EMPHASIS = ['decide', 'compete'];

export const HERO_CTA_LABEL = 'Look Beneath the Surface';

// The way to the overview from a project: the facet map's index, and a case
// study opened from its own URL (caseStudyExit.js). Both go where the nav's
// Work goes, so they say so in the same words.
export const VIEW_ALL_WORK_LABEL = 'View All Work';

// Under the wordmark in the nav (Navigation.jsx), one line.
export const NAV_DESCRIPTOR = 'Systems & Interaction Designer';

// The same words at every size.
export const HERO_BODY_COPY =
  'I design systems that shape how people decide and compete. Rules, feedback, and tradeoffs turn a simple interaction into something worth mastering. Across products and games, I build systems that reward intent.';

export const ABOUT_TITLE = 'Shaped Through Iteration';

export const ABOUT_PARAGRAPHS = [
  'I’m a systems and interaction designer in Louisville, Kentucky. I co-founded Forest Giant and led it for fifteen years as we grew to more than thirty people. Today I design FundSeeder’s trader ranking system, and I’m building Second Sentence, a movement-driven third-person action shooter in Unreal.',
  'I like getting an idea into someone’s hands early. For Second Sentence, I started with the camera so I could test how it felt to move through the world in third person. At Flying Axes, we built a prototype cage before we built the venue. I worked with a researcher, a UI designer, and developers to pare the scoreboard down to a name, a lane, a throw count, and a score. Seeing what people do the first time they try a prototype is still my favorite part of the work.',
];

// Headline (accent, set in capitals by the stylesheet) and its supporting line.
export const ABOUT_STATS = [
  { value: '20 Traders Funded', label: 'Through FundSeeder as of October 2026' },
  { value: '15 Years · 30+ Person Team', label: 'Building and leading a multidisciplinary studio' },
  { value: '150K Downloads · Top 5 Free Game', label: 'Mesa’s first week on iOS' },
];

// The résumé is a static file in public/. It has to be there at deploy, or the
// link is a 404.
export const ABOUT_RESUME = { label: 'View Résumé (PDF)', href: '/jon-shaw-resume.pdf' };

export const ABOUT_BLUESKY = {
  label: 'Bluesky',
  href: 'https://bsky.app/profile/jjonshaw.bsky.social',
};

// The art wall (src/artWall): its page title, and the link to it under the
// portrait in About.
export const ART_WALL_TITLE = 'Comics & Other Bad Ideas';
export const ART_WALL_BACK_LABEL = 'Back to About';
// One line under the wall's title: what it is, and roughly when. The span is
// read from the files (Tumblr posts from 2014, the Playdate prototype now);
// confirm before launch.
export const ART_WALL_INTRO =
  'Personal comics, illustration, posters and game art, from about 2014 to now.';
