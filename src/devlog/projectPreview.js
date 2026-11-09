// src/devlog/projectPreview.js
//
// What a devlog project's selected-project preview says. The project's own
// identity (title, descriptor, colours, CTA, route) stays in projects.js; the
// editorial part comes from the latest published entry, so publishing an entry
// updates the preview with no change to projects.js:
//
//   latest    { label, title } — "Latest Entry · Nov 8, 2026" over the entry's
//             headline, a line of its own under the descriptor. Never the title.
//   description  the entry's summary, at both screen sizes.
//
// Before the first entry is published, the project's stable description stands
// and there is no latest line. A project without `devlog: true` passes through
// untouched.

import { entryStatusLabel, formatEntryDate, getLatestEntry } from './entries';

export const LATEST_ENTRY_LABEL = 'Latest Entry';

/**
 * @param {object} project  a projects.js record (or one already merged with its `mobile` keys)
 * @returns {object} the same record, with `latest` and `description` from the latest entry
 */
export const withLatestDevlogEntry = (project) => {
  if (!project?.devlog) return project;
  const entry = getLatestEntry();
  if (!entry) return project;

  const status = entryStatusLabel(entry);
  return {
    ...project,
    description: entry.summary,
    latest: {
      label: [LATEST_ENTRY_LABEL, formatEntryDate(entry.date), status].filter(Boolean).join(' · '),
      title: entry.title,
      slug: entry.slug,
    },
  };
};

export default withLatestDevlogEntry;
