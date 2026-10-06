// src/utils/performanceCache.js
//
// Where PerformanceManagerV2 keeps the tier it measured. Separate from the manager
// (and free of three.js) so boot code can read it too: a returning visitor's tier
// is known before the app chunk has even arrived, which lets the loader start
// downloading that tier's files straight away.

export const STORAGE_KEY = 'crystal-performance-config-v2';
export const VERSION_KEY = 'crystal-performance-version-v2';
export const CURRENT_VERSION = '3.0'; // New version for conservative approach
export const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // ~7 days

export const readCachedPerformance = () => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    const version = localStorage.getItem(VERSION_KEY);

    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...parsed, appVersion: version };
    }
  } catch (error) {
    console.warn('Failed to read cached performance data:', error);
  }
  return null;
};

export const isCachedPerformanceValid = (cachedData, forceRetest = false) => {
  // Cache is always invalid in dev for testing
  if (import.meta.env.DEV) return false;
  if (forceRetest) return false;
  if (!cachedData) return false;

  if (cachedData.appVersion !== CURRENT_VERSION) return false;

  const age = Date.now() - (cachedData.timestamp || 0);

  return Boolean(age < CACHE_TTL && cachedData.tier && cachedData.testResults);
};

/** The tier the manager will use without testing, or null if it has to test. */
export const readValidCachedTier = () => {
  const cached = readCachedPerformance();
  return isCachedPerformanceValid(cached) ? cached.tier : null;
};
