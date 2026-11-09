// src/devlog/entries.js
//
// The devlog's one source of entries. Every surface that shows one reads it
// from here: the project's preview (projectPreview.js), the archive, the
// article, the routes, the document head and the prerender. Nothing else
// keeps a copy of an entry's copy or media.
//
// The list is built at build time from src/devlog/content/entries/*.mdx by
// scripts/devlog/vitePlugin.mjs: validated, newest first, drafts and scheduled
// entries left out of a production build. Bodies load lazily, one chunk each.

import { entries as discoveredEntries, includesUnpublished, loaders } from 'virtual:devlog';

/** Newest first. Each: { slug, title, date, updated, category, summary, cover, video, draft, scheduled }. */
export const devlogEntries = discoveredEntries;

/** True on a dev server (or a DEVLOG_DRAFTS build): drafts and scheduled entries are in the list, marked. */
export const devlogIncludesUnpublished = includesUnpublished;

const entryBySlug = new Map(devlogEntries.map((entry) => [entry.slug, entry]));

export const getEntryBySlug = (slug) => (slug ? entryBySlug.get(slug) || null : null);

/** The entry every "latest" surface shows, or null before the first is published. */
export const getLatestEntry = () => devlogEntries[0] || null;

/**
 * Its neighbours in publication order. `previous` is the one published before
 * it, `next` the one after; either is null at the end of the log.
 */
export const getAdjacentEntries = (slug) => {
  const index = devlogEntries.findIndex((entry) => entry.slug === slug);
  if (index === -1) return { previous: null, next: null };
  return {
    previous: devlogEntries[index + 1] || null,
    next: devlogEntries[index - 1] || null,
  };
};

// --- the subpath an article adds to the project's URL -----------------------
//
// /work/secondsentence/devlog/<slug>. routes.js owns paths; these name the part
// after the project, which the case-study overlay carries as its `subpath`.

export const DEVLOG_SEGMENT = 'devlog';

export const entrySubpath = (slug) => `${DEVLOG_SEGMENT}/${slug}`;

/** The entry slug in a subpath, or null if it names no published entry. */
export const entrySlugFromSubpath = (subpath) => {
  const match = /^devlog\/([a-z0-9-]+)$/.exec(subpath || '');
  return match && entryBySlug.has(match[1]) ? match[1] : null;
};

// --- bodies -------------------------------------------------------------------

// Bodies already fetched, rendered directly rather than through React.lazy: an
// article opened on its own URL is already on screen (prerendered), and the app
// has to take it over without a frame of nothing. Same idea as the case-study
// modules in CaseStudyOverlay.
const resolvedBodies = new Map();

/** Fetches an entry's body ahead of rendering it. Resolves to the MDX component. */
export const preloadEntryBody = (slug) => {
  const load = loaders[slug];
  if (!load) return Promise.reject(new Error(`Unknown devlog entry: ${slug}`));
  return load().then((module) => {
    resolvedBodies.set(slug, module.default);
    return module.default;
  });
};

export const getResolvedEntryBody = (slug) => resolvedBodies.get(slug) || null;

/** The module path a body compiles from, for finding its chunk in the build manifest. */
export const getEntryModulePath = (slug) => getEntryBySlug(slug)?.module || null;

// --- presentation ---------------------------------------------------------------

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

/** "Nov 8, 2026". UTC, so the prerender and the browser agree whatever the time zone. */
export const formatEntryDate = (isoDate) => {
  const [y, m, d] = String(isoDate).split('-').map(Number);
  return DATE_FORMAT.format(new Date(Date.UTC(y, m - 1, d)));
};

/** "Draft" / "Scheduled" for an entry a production build would leave out; otherwise null. */
export const entryStatusLabel = (entry) => {
  if (entry?.draft) return 'Draft';
  if (entry?.scheduled) return 'Scheduled';
  return null;
};
