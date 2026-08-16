// src/caseStudies/registry.js
//
// Slug -> case study module. Each entry is a dynamic import, so a case study
// (and its content, media metadata, and custom diagrams) only enters the bundle
// when a reader actually opens it.
//
// Adding a case study: create src/caseStudies/<slug>/, then add one line here
// and `caseStudySlug` + `caseStudyColors` to the project in src/data/projects.js.

const CASE_STUDY_MODULES = {
  mesa: () => import('./mesa/MesaCaseStudy.jsx'),
};

export const caseStudySlugs = Object.keys(CASE_STUDY_MODULES);

export const hasCaseStudy = (slug) =>
  Boolean(slug) && Object.prototype.hasOwnProperty.call(CASE_STUDY_MODULES, slug);

export const loadCaseStudy = (slug) =>
  hasCaseStudy(slug) ? CASE_STUDY_MODULES[slug]() : Promise.reject(
    new Error(`Unknown case study slug: ${slug}`)
  );

export default CASE_STUDY_MODULES;
