// src/loader/devModuleProgress.js
//
// Dev server only. A build ships the app as one chunk, which main.jsx downloads
// with progress like any other file. A dev server serves it as hundreds of
// separate modules, requested as the import graph unfolds, so there is no size to
// measure against up front. Instead this counts modules as they arrive, against
// how many the last dev load took (remembered in localStorage), and reports how
// long that load took so the loader can weight it by time.

import { updateCode } from './loadProgress';

const STORAGE_KEY = 'crystal-loader-dev-modules';
// A first guess, for the very first dev load in a browser.
const FIRST_GUESS = { count: 120, ms: 2000 };

const readLearned = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (stored?.count > 0 && stored?.ms > 0) return stored;
  } catch {
    // Fall back to the guess.
  }
  return FIRST_GUESS;
};

// Same-origin requests made for the app's code: modules and the CSS they pull in.
// The scene's files (/assets/) are downloads.js's to count.
const isAppModule = (entry) => {
  try {
    const url = new URL(entry.name);
    return url.origin === location.origin && !url.pathname.startsWith('/assets/');
  } catch {
    return false;
  }
};

export function trackDevModules(appModule) {
  if (typeof PerformanceObserver === 'undefined') return;

  const learned = readLearned();
  const startedAt = performance.now();
  let count = 0;

  const report = (done = false) => updateCode({
    // Held short of full until the import actually resolves.
    progress: done ? 1 : Math.min(count / learned.count, 0.95),
    expectedMs: learned.ms,
    done,
  });

  const observer = new PerformanceObserver((list) => {
    count += list.getEntries().filter(isAppModule).length;
    report();
  });
  observer.observe({ type: 'resource' });
  report();

  const finish = () => {
    observer.disconnect();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ count, ms: performance.now() - startedAt }));
    } catch {
      // Nothing to learn from next time; the guess stands.
    }
    report(true);
  };
  appModule.then(finish, finish);
}
