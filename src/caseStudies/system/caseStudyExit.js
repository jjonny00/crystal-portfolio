// src/caseStudies/system/caseStudyExit.js
//
// Lets the layer hosting a case study replace its way out. CaseStudyPage reads
// it; a case study never needs to.
//
// Used for a case study opened from its own URL. Its usual exit, "Back to
// <project>", returns to the project's place in the portfolio, which a reader
// arriving from a search result or a shared link has never been to. For them
// the overlay supplies a way into the rest of the work instead. Null (the
// default) leaves each case study's own label and close in place.

import { createContext } from 'react';

/**
 * The label for a case study's way out when the reader arrived on it from
 * outside. Shown without the back arrow: it leads on into the work, not back.
 */
export const ARRIVAL_EXIT_LABEL = 'View all work';

/** @type {import('react').Context<null | { label: string, onExit: () => void }>} */
export const CaseStudyExitContext = createContext(null);
