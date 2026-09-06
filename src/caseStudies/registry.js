// src/caseStudies/registry.js
//
// Slug -> case study module. Each entry is a dynamic import, so a case study
// (and its content, media metadata, and custom diagrams) only enters the bundle
// when a reader actually opens it.
//
// Adding a case study: create src/caseStudies/<slug>/, then add one line here
// and `caseStudySlug` + `caseStudyColors` to the project in src/data/projects.js.

/**
 * `entry` picks how the layer arrives:
 *   'wash'   — the project colour fades up over the scene, then content lands on
 *              it. The default, and what any hero with its own background wants.
 *   'reveal' — nothing covers the scene. For case studies whose hero has
 *              `background="none"` and sits directly on the crystal facet, a
 *              wash would paint over the very thing the hero is sitting on.
 */
const CASE_STUDY_MODULES = {
  mesa: {
    load: () => import('./mesa/MesaCaseStudy.jsx'),
    entry: 'reveal',
  },
  // Not a project. A catalogue of every section component and variation, opened
  // from the hidden dev menu rather than linked from the site — see
  // CATALOG_PROJECT in App.jsx. Its own chunk, so it never ships to a reader.
  catalog: {
    load: () => import('./catalog/CatalogCaseStudy.jsx'),
    entry: 'wash',
  },
};

export const caseStudySlugs = Object.keys(CASE_STUDY_MODULES);

export const hasCaseStudy = (slug) =>
  Boolean(slug) && Object.prototype.hasOwnProperty.call(CASE_STUDY_MODULES, slug);

export const loadCaseStudy = (slug) =>
  hasCaseStudy(slug)
    ? CASE_STUDY_MODULES[slug].load()
    : Promise.reject(new Error(`Unknown case study slug: ${slug}`));

export const getCaseStudyEntry = (slug) =>
  (hasCaseStudy(slug) ? CASE_STUDY_MODULES[slug].entry : null) || 'wash';

export default CASE_STUDY_MODULES;
