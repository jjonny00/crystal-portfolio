// src/seo/prerenderedContent.js
//
// The prerendered page body (scripts/prerender.mjs) lives in #prerender, beside
// #root rather than inside it, so React mounting does not wipe it. The app takes
// it down once its own version of the content is on screen:
//
//   a case study route   on the app's first commit, where the live overlay
//                        renders the same page over it
//   every other route    when the scene is revealed. Until then this is the only
//                        copy of the page's text in the DOM, which is what a
//                        crawler that renders JavaScript sees while the loader
//                        is up.

export const PRERENDER_ROOT_ID = 'prerender';

let scrollTopAtTakeover = 0;

/** How far the reader had scrolled the prerendered case study, if at all. */
export const getPrerenderedScrollTop = () => scrollTopAtTakeover;

/** Records the prerendered case study's scroll position, for the live one to resume. */
export const capturePrerenderedScroll = () => {
  const overlay = document.querySelector(`#${PRERENDER_ROOT_ID} .cs-overlay`);
  scrollTopAtTakeover = overlay ? overlay.scrollTop : 0;
};

export const removePrerenderedContent = () => {
  document.getElementById(PRERENDER_ROOT_ID)?.remove();
};
