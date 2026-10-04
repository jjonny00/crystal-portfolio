// src/navigation/linkClick.js
//
// The site's navigation is real links (crawlers follow hrefs, and a reader can
// open one in a new tab or copy it), but a plain click still has to run the
// in-page transition instead of loading the URL.

/** True for a click the page should handle itself: primary button, no modifier. */
export const isPlainLeftClick = (event) =>
  event.button === 0 &&
  !event.defaultPrevented &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey;

/**
 * onClick for an <a href> that should run `handler` in-page on a plain click and
 * behave as a normal link otherwise (new tab, download, copy).
 */
export const inPageLinkHandler = (handler) => (event) => {
  if (!handler || !isPlainLeftClick(event)) return;
  event.preventDefault();
  handler(event);
};
