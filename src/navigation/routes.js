// src/navigation/routes.js
//
// URL <-> destination. Pure, with no DOM or React, because two places need it:
// the client (reading the path at boot, keeping the address bar in step with
// scroll, handling Back) and the build-time prerender (scripts/prerender.mjs),
// which writes one HTML file per route.
//
// The URL model:
//   /                 hero
//   /work             overview (not indexed; canonical is /)
//   /work/<slug>      a project. With a case study it opens the case study; without
//                     one it lands on the project's facet.
//   /work/<slug>/devlog/<entry>
//                     an entry in a project's devlog (Second Sentence's). It opens
//                     inside the project's case study, which is the devlog's
//                     archive; the part after the slug is the overlay's `subpath`.
//   /about            about
//
// A project's `legacySlugs` (an earlier project in its slot) resolve to it, with
// its own path as the canonical one; netlify.toml redirects them on the host.
//
// Paths are slashless. Each route is prerendered as a flat file (work/mesa.html,
// not work/mesa/index.html), which Netlify's Pretty URLs serve at /work/mesa
// without a redirect. A folder index would be forced to /work/mesa/ by a 301.

import projects from '../data/projects';
import { hasCaseStudy } from '../caseStudies/registry';
import {
  DEVLOG_SEGMENT,
  devlogEntries,
  entrySlugFromSubpath,
  entrySubpath,
} from '../devlog/entries';
import { NAVIGATION_DESTINATIONS } from './navigationIntent';

const WORK_PREFIX = '/work';

const projectBySlug = new Map(projects.map((project) => [project.slug, project]));
const projectByLegacySlug = new Map(
  projects.flatMap((project) => (project.legacySlugs || []).map((slug) => [slug, project]))
);

export const getProjectBySlug = (slug) => projectBySlug.get(slug) || null;

/** The project's URL key for any of its ids (project01, its facetKey, its slug). */
export const getSlugByProjectId = (projectId) => {
  if (!projectId) return null;
  const project = projects.find(
    (item) => item.id === projectId || item.facetKey === projectId || item.slug === projectId
  );
  return project?.slug || null;
};

export const projectHasCaseStudy = (project) => hasCaseStudy(project?.caseStudySlug);

const normalizePathname = (pathname = '/') => {
  let path = String(pathname || '/').split(/[?#]/)[0];
  try {
    path = decodeURI(path);
  } catch {
    // A malformed escape is just an unknown route.
  }
  path = path.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return path.toLowerCase() || '/';
};

/**
 * What a path asks for. `null` for a path the site has no page for, which the
 * client treats as the hero and the host serves as a 404.
 *
 * A project route carries `projectId` (the project's facetKey, which is the id
 * the scene and the case-study overlay use) and `slug`. A devlog entry's route
 * is the project's case study plus `subpath` ('devlog/<entry>') and `entrySlug`;
 * every other project route has `subpath: null`.
 */
export const parsePath = (pathname) => {
  const path = normalizePathname(pathname);

  if (path === '/') return { destination: NAVIGATION_DESTINATIONS.HERO, path: '/' };
  if (path === WORK_PREFIX) return { destination: NAVIGATION_DESTINATIONS.OVERVIEW, path };
  if (path === '/about') return { destination: NAVIGATION_DESTINATIONS.ABOUT, path };

  if (path.startsWith(`${WORK_PREFIX}/`)) {
    const [requestedSlug, ...rest] = path.slice(WORK_PREFIX.length + 1).split('/');
    const project = getProjectBySlug(requestedSlug) || projectByLegacySlug.get(requestedSlug);
    if (!project) return null;
    const hasCaseStudy = projectHasCaseStudy(project);

    // Below the project: only a devlog's entries, which live in its case study.
    // `/devlog` on its own is the archive, which is the project's own URL.
    let subpath = null;
    let entrySlug = null;
    if (rest.length) {
      if (!project.devlog || !hasCaseStudy || rest[0] !== DEVLOG_SEGMENT) return null;
      if (rest.length > 1) {
        entrySlug = entrySlugFromSubpath(rest.join('/'));
        if (!entrySlug) return null;
        subpath = entrySubpath(entrySlug);
      }
    }

    return {
      destination: hasCaseStudy
        ? NAVIGATION_DESTINATIONS.CASE_STUDY
        : NAVIGATION_DESTINATIONS.PROJECT,
      projectId: project.facetKey || project.id,
      slug: project.slug,
      subpath,
      entrySlug,
      path: `${WORK_PREFIX}/${project.slug}${subpath ? `/${subpath}` : ''}`,
    };
  }

  return null;
};

/**
 * The canonical path for a destination. Unknown input falls back to `/`.
 * `subpath` (a case study's, such as a devlog entry's) follows the project's own path.
 */
export const pathFor = (destination, projectId = null, subpath = null) => {
  switch (destination) {
    case NAVIGATION_DESTINATIONS.OVERVIEW:
      return WORK_PREFIX;
    case NAVIGATION_DESTINATIONS.ABOUT:
      return '/about';
    case NAVIGATION_DESTINATIONS.PROJECT:
    case NAVIGATION_DESTINATIONS.CASE_STUDY: {
      const slug = getSlugByProjectId(projectId);
      if (!slug) return WORK_PREFIX;
      const suffix = destination === NAVIGATION_DESTINATIONS.CASE_STUDY && subpath ? `/${subpath}` : '';
      return `${WORK_PREFIX}/${slug}${suffix}`;
    }
    default:
      return '/';
  }
};

/** A devlog entry's URL in a project's devlog. */
export const devlogEntryPath = (projectId, entrySlug) =>
  pathFor(NAVIGATION_DESTINATIONS.CASE_STUDY, projectId, entrySubpath(entrySlug));

/** Shorthand for a project's link, whichever way it opens. */
export const projectPath = (projectId) => pathFor(NAVIGATION_DESTINATIONS.PROJECT, projectId);

/**
 * Every route the build writes a file for. `file` is relative to dist/;
 * `indexable` decides whether the route goes in the sitemap and gets
 * `index, follow`; `lastmod` (YYYY-MM-DD) is the sitemap's, where a route
 * knows when it last changed.
 */
export const getPrerenderRoutes = () => [
  { ...parsePath('/'), file: 'index.html', indexable: true },
  { ...parsePath('/work'), file: 'work.html', indexable: false },
  { ...parsePath('/about'), file: 'about.html', indexable: false },
  ...projects.map((project) => ({
    ...parsePath(`${WORK_PREFIX}/${project.slug}`),
    file: `work/${project.slug}.html`,
    indexable: true,
    lastmod: project.devlog ? devlogEntries[0]?.date ?? null : null,
  })),
  // A devlog's entries: every one in this build's list (published only, in
  // production), each a flat file under the project's folder.
  ...projects
    .filter((project) => project.devlog && projectHasCaseStudy(project))
    .flatMap((project) =>
      devlogEntries.map((entry) => {
        const route = parsePath(devlogEntryPath(project.facetKey || project.id, entry.slug));
        return {
          ...route,
          file: `${route.path.slice(1)}.html`,
          // Drafts reach here only in a DEVLOG_DRAFTS build (a preview), and
          // stay out of its sitemap; their pages are noindex too (seoMeta.js).
          indexable: !entry.draft && !entry.scheduled,
          lastmod: entry.updated || entry.date,
        };
      })
    ),
];
