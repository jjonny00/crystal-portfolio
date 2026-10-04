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
//   /about            about
//
// Paths are slashless. Each route is prerendered as a flat file (work/mesa.html,
// not work/mesa/index.html), which Netlify's Pretty URLs serve at /work/mesa
// without a redirect. A folder index would be forced to /work/mesa/ by a 301.

import projects from '../data/projects';
import { hasCaseStudy } from '../caseStudies/registry';
import { NAVIGATION_DESTINATIONS } from './navigationIntent';

const WORK_PREFIX = '/work';

const projectBySlug = new Map(projects.map((project) => [project.slug, project]));

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
 * the scene and the case-study overlay use) and `slug`.
 */
export const parsePath = (pathname) => {
  const path = normalizePathname(pathname);

  if (path === '/') return { destination: NAVIGATION_DESTINATIONS.HERO, path: '/' };
  if (path === WORK_PREFIX) return { destination: NAVIGATION_DESTINATIONS.OVERVIEW, path };
  if (path === '/about') return { destination: NAVIGATION_DESTINATIONS.ABOUT, path };

  if (path.startsWith(`${WORK_PREFIX}/`)) {
    const slug = path.slice(WORK_PREFIX.length + 1);
    const project = getProjectBySlug(slug);
    if (!project) return null;
    return {
      destination: projectHasCaseStudy(project)
        ? NAVIGATION_DESTINATIONS.CASE_STUDY
        : NAVIGATION_DESTINATIONS.PROJECT,
      projectId: project.facetKey || project.id,
      slug,
      path,
    };
  }

  return null;
};

/** The canonical path for a destination. Unknown input falls back to `/`. */
export const pathFor = (destination, projectId = null) => {
  switch (destination) {
    case NAVIGATION_DESTINATIONS.OVERVIEW:
      return WORK_PREFIX;
    case NAVIGATION_DESTINATIONS.ABOUT:
      return '/about';
    case NAVIGATION_DESTINATIONS.PROJECT:
    case NAVIGATION_DESTINATIONS.CASE_STUDY: {
      const slug = getSlugByProjectId(projectId);
      return slug ? `${WORK_PREFIX}/${slug}` : WORK_PREFIX;
    }
    default:
      return '/';
  }
};

/** Shorthand for a project's link, whichever way it opens. */
export const projectPath = (projectId) => pathFor(NAVIGATION_DESTINATIONS.PROJECT, projectId);

/**
 * Every route the build writes a file for. `file` is relative to dist/;
 * `indexable` decides whether the route goes in the sitemap and gets
 * `index, follow`.
 */
export const getPrerenderRoutes = () => [
  { ...parsePath('/'), file: 'index.html', indexable: true },
  { ...parsePath('/work'), file: 'work.html', indexable: false },
  { ...parsePath('/about'), file: 'about.html', indexable: false },
  ...projects.map((project) => ({
    ...parsePath(`${WORK_PREFIX}/${project.slug}`),
    file: `work/${project.slug}.html`,
    indexable: true,
  })),
];
