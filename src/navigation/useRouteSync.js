// src/navigation/useRouteSync.js
//
// Keeps the address bar on the page the reader is actually looking at, and makes
// Back and Forward move through the site the way a reader expects.
//
//   Scrolling between sections   replaceState. The URL follows along so it can
//                                always be copied, but scrolling does not pile
//                                up history entries.
//   Opening a case study         pushState. Back (or the phone's back swipe)
//                                closes it rather than leaving the site.
//   Closing it from the page     history.back(), to step off the entry the open
//                                pushed, so Back afterwards goes where it went
//                                before the case study was opened.
//
// The scene and the content layer stay the source of truth; this only mirrors
// them into history, and turns a popped entry back into a navigation.

import { useCallback, useEffect, useRef, useState } from 'react';
import { NAVIGATION_DESTINATIONS } from './navigationIntent';
import { parsePath, pathFor } from './routes';

/** The URL for a settled scroll section id ('hero', 'project-project02', ...). */
export const settledSectionToPath = (sectionId) => {
  if (!sectionId) return null;
  if (sectionId === 'hero') return pathFor(NAVIGATION_DESTINATIONS.HERO);
  if (sectionId === 'overview') return pathFor(NAVIGATION_DESTINATIONS.OVERVIEW);
  if (sectionId === 'about') return pathFor(NAVIGATION_DESTINATIONS.ABOUT);
  if (sectionId.startsWith('project-')) {
    return pathFor(NAVIGATION_DESTINATIONS.PROJECT, sectionId.slice('project-'.length));
  }
  return null;
};

/** The scroll section a route lands on. Inverse of settledSectionToPath. */
export const routeToSectionId = (route) => {
  switch (route?.destination) {
    case NAVIGATION_DESTINATIONS.OVERVIEW:
      return 'overview';
    case NAVIGATION_DESTINATIONS.ABOUT:
      return 'about';
    case NAVIGATION_DESTINATIONS.PROJECT:
    case NAVIGATION_DESTINATIONS.CASE_STUDY:
      return route.projectId ? `project-${route.projectId}` : 'hero';
    default:
      return 'hero';
  }
};

const historyState = (caseStudyProjectId) => ({ crystalRoute: true, caseStudy: caseStudyProjectId || null });

/**
 * @returns {string} the path the reader is on, for the document head.
 */
export const useRouteSync = ({
  initialRoute,
  sceneMounted,
  settledSection,
  caseStudyOpen,
  activeProjectId,
  onOpenCaseStudy,
  onCloseCaseStudy,
  onNavigate,
}) => {
  const [routePath, setRoutePath] = useState(initialRoute.path);
  // Bumped when a history.back() we issued has landed, so the sync below runs
  // again against the entry it landed on.
  const [historyTick, setHistoryTick] = useState(0);

  const pushedCaseStudyRef = useRef(false);
  const awaitingPopRef = useRef(false);
  const openedFromHistoryRef = useRef(false);
  const lastCaseStudyOpenRef = useRef(caseStudyOpen);
  const routePathRef = useRef(initialRoute.path);
  const caseStudyOpenRef = useRef(caseStudyOpen);
  caseStudyOpenRef.current = caseStudyOpen;

  const callbacksRef = useRef({ onOpenCaseStudy, onCloseCaseStudy, onNavigate });
  callbacksRef.current = { onOpenCaseStudy, onCloseCaseStudy, onNavigate };

  // The scroll container restores itself (it is not the document), and the
  // browser's own restoration would only fight the scene on a popped entry.
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    // Tag the entry the reader arrived on, so returning to it with Forward/Back
    // knows whether it was a case study.
    window.history.replaceState(
      historyState(caseStudyOpen ? activeProjectId : null),
      '',
      window.location.pathname
    );
    // Arrival only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Before the scene exists the reader is wherever they arrived; after, the
  // settled section says. Mid-scroll (null) holds the last URL.
  const derivedPath = caseStudyOpen && activeProjectId
    ? pathFor(NAVIGATION_DESTINATIONS.CASE_STUDY, activeProjectId)
    : sceneMounted
      ? settledSectionToPath(settledSection)
      : initialRoute.path;

  useEffect(() => {
    if (awaitingPopRef.current) return;

    const wasOpen = lastCaseStudyOpenRef.current;
    lastCaseStudyOpenRef.current = caseStudyOpen;

    if (caseStudyOpen && !wasOpen) {
      if (openedFromHistoryRef.current) {
        openedFromHistoryRef.current = false;
      } else if (derivedPath) {
        window.history.pushState(historyState(activeProjectId), '', derivedPath);
        pushedCaseStudyRef.current = true;
      }
    } else if (!caseStudyOpen && wasOpen && pushedCaseStudyRef.current) {
      pushedCaseStudyRef.current = false;
      awaitingPopRef.current = true;
      window.history.back();
      return;
    } else if (derivedPath) {
      // Also when only the case-study flag changed: a case study and its project
      // share a URL, and the entry has to say which one it is for Back/Forward.
      const caseStudyId = caseStudyOpen ? activeProjectId : null;
      if (
        derivedPath !== window.location.pathname ||
        (window.history.state?.caseStudy || null) !== caseStudyId
      ) {
        window.history.replaceState(historyState(caseStudyId), '', derivedPath);
      }
    }

    if (derivedPath && derivedPath !== routePathRef.current) {
      routePathRef.current = derivedPath;
      setRoutePath(derivedPath);
    }
  }, [derivedPath, caseStudyOpen, activeProjectId, historyTick]);

  const handlePopState = useCallback((event) => {
    if (awaitingPopRef.current) {
      awaitingPopRef.current = false;
      setHistoryTick((tick) => tick + 1);
      return;
    }

    const route = parsePath(window.location.pathname);
    const caseStudyProjectId = event.state?.caseStudy || null;

    if (caseStudyProjectId) {
      // Forward into a case study, or Back onto one: it is open again, and its
      // entry is ours to step off when it closes.
      pushedCaseStudyRef.current = true;
      if (!caseStudyOpenRef.current) {
        openedFromHistoryRef.current = true;
        callbacksRef.current.onOpenCaseStudy?.(caseStudyProjectId);
      }
      return;
    }

    if (caseStudyOpenRef.current) {
      // Back out of a case study. The entry it pushed is already gone.
      pushedCaseStudyRef.current = false;
      lastCaseStudyOpenRef.current = false;
      callbacksRef.current.onCloseCaseStudy?.();
    }

    // Only move the scene if the entry is somewhere other than where it is.
    if (route && route.path !== routePathRef.current) {
      callbacksRef.current.onNavigate?.(route);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handlePopState]);

  return routePath;
};

export default useRouteSync;
