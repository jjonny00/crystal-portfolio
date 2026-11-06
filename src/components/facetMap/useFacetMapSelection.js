// src/components/facetMap/useFacetMapSelection.js
//
// Whether the facet map shows, and which project it marks.
//
// Not a source of truth. It reads App's own state, the same state the router
// mirrors into the URL:
//
//   viewMode         'caseStudy' while a case study is open
//   activeProjectId  that case study's project (App never changes it while one is
//                    open, so scrolling a case study cannot move the map)
//   settledSection   the scroll section the content layer has settled on
//                    ('project-project02', 'overview', ...), or null while a
//                    scroll is still in flight
//
// and only decides when to act on them:
//
//   - In flight (settledSection null) it holds what it shows, so the map does not
//     blink out between two projects. App reports no project then; that is the
//     gap between settles, not a destination.
//   - A new project comes in on the camera move's content beat (projectRouteClock,
//     projectRouteTiming's contentAt), the moment the project's copy comes in. A
//     newer selection arriving first replaces the pending one: latest wins.
//   - It goes as soon as a move away from the projects starts (to the overview or
//     About), or once the reader settles anywhere that is not a project.

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  getProjectRouteMove,
  msUntilProjectRouteContent,
  subscribeProjectRouteMove,
} from '../../lib/projectRouteClock';

// The copy's own beat after its section settles when no camera move is running
// (ProjectFocusSection's CONTENT_DELAY_MS), so the two still arrive together.
const SETTLE_DELAY_MS = 180;

// Moves that leave the projects behind.
const AWAY_ROUTES = new Set(['projectToOverview', 'projectToAbout']);

const PROJECT_SECTION_PREFIX = 'project-';

const HIDDEN = Object.freeze({ visible: false, projectId: null });

const useFacetMapSelection = ({
  viewMode,
  activeProjectId,
  settledSection,
  /** The content is uncovered (the loader has gone). A case study is shown either way. */
  revealed = true,
  /** Something has taken over the screen (the dev catalogue, Hide UI). */
  suppressed = false,
}) => {
  const move = useSyncExternalStore(subscribeProjectRouteMove, getProjectRouteMove, getProjectRouteMove);
  // Arriving on a case study's own URL, the page is on screen at once, so the map
  // is in the first render rather than set by the effect below. An effect waits
  // for the main thread, and on a cold load that is busy building the scene
  // behind the case study for seconds.
  const [shown, setShown] = useState(() => (
    !suppressed && viewMode === 'caseStudy' && activeProjectId
      ? { visible: true, projectId: activeProjectId }
      : HIDDEN
  ));
  const shownRef = useRef(shown);
  shownRef.current = shown;

  // What the settled state asks for, as primitives so the effect below runs only
  // when the answer changes. `hold` keeps whatever is showing.
  let hold = false;
  let wantedId = null;
  const caseStudy = viewMode === 'caseStudy';
  if (suppressed) {
    wantedId = null;
  } else if (caseStudy) {
    wantedId = activeProjectId;
  } else if (settledSection === null) {
    hold = !(move && AWAY_ROUTES.has(move.route));
  } else if (revealed && settledSection?.startsWith(PROJECT_SECTION_PREFIX)) {
    wantedId = settledSection.slice(PROJECT_SECTION_PREFIX.length);
  }

  useEffect(() => {
    if (hold) return undefined;
    if (!wantedId) {
      setShown(HIDDEN);
      return undefined;
    }

    const current = shownRef.current;
    if (current.visible && current.projectId === wantedId) return undefined;

    // A case study is already on screen when it says which project it is.
    // Otherwise wait for the camera to bring the project in, as its copy does.
    const waitMs = caseStudy
      ? 0
      : msUntilProjectRouteContent('overviewToProject', wantedId)
        ?? msUntilProjectRouteContent('projectToProject', wantedId)
        ?? SETTLE_DELAY_MS;
    const next = { visible: true, projectId: wantedId };
    if (waitMs <= 0) {
      setShown(next);
      return undefined;
    }
    const timeoutId = setTimeout(() => setShown(next), waitMs);
    return () => clearTimeout(timeoutId);
  }, [hold, wantedId, caseStudy]);

  return shown;
};

export default useFacetMapSelection;
