import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { preloadFractureAssets } from './loader/preloadFractureAssets';
import { NAVIGATION_DESTINATIONS } from './navigation/navigationIntent';
import { getProjectBySlug, parsePath } from './navigation/routes';
import { preloadCaseStudy } from './caseStudies/CaseStudyOverlay';
import { capturePrerenderedScroll } from './seo/prerenderedContent';

async function boot() {
  const route = parsePath(window.location.pathname);

  if (route?.destination === NAVIGATION_DESTINATIONS.CASE_STUDY) {
    // The case study is already on screen from the prerendered HTML. Mount as soon
    // as its module is here (so the app's copy renders in one pass, with nothing
    // in between), and let the scene's textures load behind it — App waits on
    // the same promise before mounting the scene.
    preloadFractureAssets().catch((e) => console.warn('Fracture assets preload failed:', e));
    try {
      await preloadCaseStudy(getProjectBySlug(route.slug)?.caseStudySlug);
    } catch (e) {
      console.warn('Case study preload failed:', e);
    }
  } else {
    try {
      await preloadFractureAssets();
    } catch (e) {
      console.warn('Fracture assets preload failed:', e);
    }
  }

  capturePrerenderedScroll();
  const rootEl = document.getElementById('root');
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

boot();
