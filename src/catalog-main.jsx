// src/catalog-main.jsx
//
// Entry point for catalog.html — the component catalogue as a page of its own,
// at /catalog.html, with no crystal, no scroll machine and no navigating
// through the app to reach it.
//
// It renders the same CatalogCaseStudy the hidden dev menu opens as an overlay
// (see CATALOG_PROJECT in src/caseStudies/catalog/catalogProject.js), so there
// is one catalogue and both routes show the same thing. The difference is only
// the shell: no .cs-overlay wrapper here, which is what the staggered entry
// animations are scoped to, so sections sit still and can be judged.
//
// index.css comes along for the --page-* metrics that caseStudy.css aliases its
// --cs-* names onto; without it every section would lose its content edge.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import CatalogCaseStudy from './caseStudies/catalog/CatalogCaseStudy';
import { CATALOG_PROJECT } from './caseStudies/catalog/catalogProject';

// The back control leaves for the portfolio rather than closing a layer — on a
// standalone page there is nothing underneath to return to. Escape does the
// same, since CaseStudyPage wires the two together.
const leaveForPortfolio = () => {
  window.location.href = '/';
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CatalogCaseStudy project={CATALOG_PROJECT} onClose={leaveForPortfolio} />
  </StrictMode>
);
