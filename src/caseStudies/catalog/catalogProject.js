// src/caseStudies/catalog/catalogProject.js
//
// The stand-in "project" the catalogue renders as. Not a real project: it never
// appears in src/data/projects.js and nothing on the site links to it. It exists
// because the case-study system takes its colours from a project, and the
// catalogue needs the same shell every real case study gets.
//
// Shared by the two ways in: the hidden dev menu in App.jsx, which opens the
// catalogue as an overlay over the scene, and catalog.html, the standalone page
// that renders it on its own (src/catalog-main.jsx).

// Neutral greys rather than a project palette: the catalogue is about shape,
// not colour, and a bright accent would flatten the differences between
// sections. Tone a is the light ground, tone b the dark one.
export const CATALOG_PROJECT = Object.freeze({
  id: 'catalog',
  label: 'Catalog',
  caseStudySlug: 'catalog',
  caseStudyColors: { a: '#9A9A9A', b: '#282828' },
});

export default CATALOG_PROJECT;
