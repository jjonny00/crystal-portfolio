import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/app-frame.css';
import LoaderV2, { loaderFontsReady } from './ui/LoaderV2';
import { NAVIGATION_DESTINATIONS } from './navigation/navigationIntent';
import { getProjectBySlug, parsePath } from './navigation/routes';
import { capturePrerenderedScroll } from './seo/prerenderedContent';
import { download } from './loader/downloads';
import { trackDevModules } from './loader/devModuleProgress';
import { setLoaderPresentation } from './loader/loadProgress';
import { startBootDownloads } from './loader/sceneAssets';

// The app (three.js, the scene, the case-study system) is its own chunk, so the
// only thing between the HTML and the loader is this file, React and the loader
// itself. Everything else downloads with the loader already on screen.
const loadApp = () => import('./App.jsx');

// The app chunk's URL and its compressed and decoded sizes, written in by
// vite.config.js at build time. A module import reports no progress, so the
// chunk is fetched first, counted byte by byte in the loader's first ring, and
// then imported — from the HTTP cache (/_app/* is immutable, netlify.toml).
// A dev server has no single chunk (the placeholders stay as they are): it serves
// the app as hundreds of modules, counted by devModuleProgress.js instead.
const APP_CHUNK_URL = '__APP_CHUNK_URL__';
const APP_CHUNK_BYTES = Number('__APP_CHUNK_BYTES__');
const APP_CHUNK_RAW_BYTES = Number('__APP_CHUNK_RAW_BYTES__');
const appChunkKnown = APP_CHUNK_URL.startsWith('/') && APP_CHUNK_RAW_BYTES > 0;

const startApp = () => {
  if (!appChunkKnown) {
    const appModule = loadApp();
    trackDevModules(appModule);
    return appModule;
  }
  return download(APP_CHUNK_URL, {
    priority: 'high',
    expectedBytes: APP_CHUNK_RAW_BYTES,
    wireBytes: APP_CHUNK_BYTES,
    keep: false,
  }).then(loadApp);
};

// The page's permanent layers: the app once its chunk arrives, then the loader and
// the app frame above it. The loader is mounted here, once, rather than by App, so
// it is the same element from the first paint until it leaves — its entrance
// plays once and never restarts when the app takes over. App tells it when to
// show and leave through the progress store (setLoaderPresentation).
const Root = ({ appModule, initialApp = null }) => {
  const [App, setApp] = useState(() => initialApp);

  useEffect(() => {
    if (App) return undefined;
    let cancelled = false;
    appModule.then(({ default: LoadedApp }) => {
      if (cancelled) return;
      capturePrerenderedScroll();
      setApp(() => LoadedApp);
    });
    return () => { cancelled = true; };
  }, [App, appModule]);

  return (
    <>
      {App && (
        <StrictMode>
          <App />
        </StrictMode>
      )}
      <LoaderV2 />
      {/* App frame: rounds the corners on mobile. Last and above every other
          layer, including the loader, so the frame is unbroken from the first
          paint. Decorative and pointer-transparent. */}
      <div className="app-frame" aria-hidden="true" />
      {/* Its glass rim, on mobile. A separate, non-fixed element on purpose: see
          .app-rim in app-frame.css. */}
      <div className="app-rim" aria-hidden="true" />
    </>
  );
};

async function boot() {
  const route = parsePath(window.location.pathname);
  const root = createRoot(document.getElementById('root'));
  const appModule = startApp();
  // The scene files wait for the loader's fonts, so those get the connection first.
  startBootDownloads({ after: loaderFontsReady });

  if (route?.destination !== NAVIGATION_DESTINATIONS.CASE_STUDY) {
    root.render(<Root appModule={appModule} />);
    return;
  }

  // The case study is already on screen from the prerendered HTML, and there is
  // no loader on this path. Mount once both modules are here, so the app's copy
  // renders in one pass with nothing in between.
  setLoaderPresentation({ shown: false });
  try {
    const { preloadCaseStudy } = await import('./caseStudies/CaseStudyOverlay');
    await preloadCaseStudy(getProjectBySlug(route.slug)?.caseStudySlug);
  } catch (e) {
    console.warn('Case study preload failed:', e);
  }
  const { default: App } = await appModule;
  capturePrerenderedScroll();
  root.render(<Root appModule={appModule} initialApp={App} />);
}

boot();
