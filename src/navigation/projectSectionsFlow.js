// src/navigation/projectSectionsFlow.js
//
// The six project sections sit in the page's scroll only while a project is up.
// From the overview, scrolling on reaches About; a project is reached by choosing
// it (a fragment, an overview label, the facet map, a link). Once one is up the
// sections are back in the scroll, so the reader can scroll from project to
// project as before: down past the last one into About, up past the first into
// the overview. Settling back on the hero, the overview or About takes them out
// again.
//
// This is a DOM switch, not React state, so it is synchronous: a caller can put
// the sections back and scroll to one in the same breath (including from a
// layout effect, as the deep-link landing does). React never renders the
// attribute after mount, so it never puts it back. Anything that walks the
// sections should skip the ones out of flow (isSectionInFlow).

const ATTR = 'data-projects-in-flow';

const getScrollContainer = () =>
  typeof document === 'undefined' ? null : document.querySelector('.scroll-container');

// The element holding the sections (the scroll container's only child).
const getContent = (container) => container?.firstElementChild ?? null;

// A section taken out of flow has no boxes.
export const isSectionInFlow = (section) => Boolean(section) && section.getClientRects().length > 0;

export const areProjectSectionsInFlow = () => {
  const content = getContent(getScrollContainer());
  return content ? content.getAttribute(ATTR) !== 'false' : true;
};

// The scroll position a shift below just wrote. The scroll event that follows
// it is the layout moving under a reader who has not, and the content layer's
// settle logic skips it rather than unsettling the section on screen.
let shiftScrollTop = null;
export const consumeLayoutShiftScroll = (scrollTop) => {
  if (shiftScrollTop === null) return false;
  const matched = Math.abs(scrollTop - shiftScrollTop) < 1;
  shiftScrollTop = null;
  return matched;
};

const nearestSectionInFlow = (container) => {
  let nearest = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  container.querySelectorAll(':scope > div > section.scroll-section[id]').forEach((section) => {
    if (!isSectionInFlow(section)) return;
    const distance = Math.abs(container.scrollTop - section.offsetTop);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = section;
    }
  });
  return nearest;
};

/**
 * Put the project sections into the scroll (true) or take them out (false),
 * keeping whatever section is on screen where it is. Returns whether anything
 * changed.
 */
export const setProjectSectionsInFlow = (inFlow) => {
  const container = getScrollContainer();
  const content = getContent(container);
  if (!content) return false;
  if (areProjectSectionsInFlow() === inFlow) return false;

  // Out of flow, the sections can't be what's on screen; the anchor is the
  // hero, the overview or About, which stays put while the sections come and go.
  const anchor = nearestSectionInFlow(container);
  const anchorOffset = anchor ? container.scrollTop - anchor.offsetTop : 0;

  content.setAttribute(ATTR, inFlow ? 'true' : 'false');

  if (anchor && isSectionInFlow(anchor)) {
    const top = anchor.offsetTop + anchorOffset;
    if (Math.abs(container.scrollTop - top) >= 1) {
      shiftScrollTop = top;
      // Instant: the container's CSS smooth scrolling would animate even this.
      container.scrollTo({ top, behavior: 'instant' });
    }
  }
  return true;
};

export const PROJECT_SECTIONS_FLOW_ATTR = ATTR;
