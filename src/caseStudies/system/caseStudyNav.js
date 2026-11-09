// src/caseStudies/system/caseStudyNav.js
//
// What a case study needs to send the reader on from its end (NextProjectSection):
// which project it is, and the host's ways to a project's preview and to All Work.
// CaseStudyOverlay provides it; a case study never needs to.
//
// A case study with pages of its own (Second Sentence's devlog: its archive and
// each entry) also reads which page it is on (`subpath`) and moves between them
// with `onNavigateSubpath`, which the host mirrors into the URL and history.
//
// Without the handlers (the prerendered page, before the app has taken over)
// the links are plain links to the routes' own URLs, which load those pages.

import { createContext } from 'react';

/**
 * @type {import('react').Context<null | {
 *   projectId: string | null,
 *   subpath?: string | null,
 *   onSelectProject?: (projectId: string) => void,
 *   onViewAllWork?: () => void,
 *   onNavigateSubpath?: (subpath: string | null) => void,
 * }>}
 */
export const CaseStudyNavContext = createContext(null);
