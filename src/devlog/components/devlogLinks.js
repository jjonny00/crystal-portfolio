// src/devlog/components/devlogLinks.js
//
// Links between the devlog's pages. Each is a real <a href> to the page's own
// URL (crawlable, opens in a new tab, copies). In the app a plain click moves
// the open case study to that page instead (CaseStudyNavContext's
// onNavigateSubpath, which App mirrors into the address bar and history). On
// the prerendered page there is no handler and the link loads the page.

import { useContext } from 'react';
import { CaseStudyNavContext } from '../../caseStudies/system/caseStudyNav';
import { inPageLinkHandler } from '../../navigation/linkClick';
import { NAVIGATION_DESTINATIONS } from '../../navigation/navigationIntent';
import { devlogEntryPath, pathFor } from '../../navigation/routes';
import { entrySubpath, preloadEntryBody } from '../entries';

/**
 * `linkTo(slug)` gives `{ href, onClick, onPointerEnter, onFocus }` for an
 * entry; `linkTo(null)` for the archive. Hover and focus start fetching an
 * entry's body, so it is usually in hand by the click.
 */
export const useDevlogLinks = () => {
  const nav = useContext(CaseStudyNavContext);
  const projectId = nav?.projectId || null;
  const navigate = nav?.onNavigateSubpath || null;

  const linkTo = (slug) => {
    const href = slug
      ? devlogEntryPath(projectId, slug)
      : pathFor(NAVIGATION_DESTINATIONS.CASE_STUDY, projectId);
    const prefetch = slug ? () => preloadEntryBody(slug).catch(() => {}) : undefined;
    return {
      href,
      onClick: navigate ? inPageLinkHandler(() => navigate(slug ? entrySubpath(slug) : null)) : undefined,
      onPointerEnter: prefetch,
      onFocus: prefetch,
    };
  };

  return { linkTo, projectId, subpath: nav?.subpath || null };
};
