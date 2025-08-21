// src/hooks/usePerformanceV2.js
// TEMPORARY: Return a static performance profile for debugging UI color stability

import { PERFORMANCE_PROFILES } from '../utils/deviceProfiles.js';

export const usePerformanceV2 = () => {
  const profile = PERFORMANCE_PROFILES.medium;

  return {
    // Core state
    profile,
    tier: 'medium',
    isReady: true,
    isInitializing: false,
    error: null,

    // Test information
    testResults: null,
    testProgress: 100,
    testStatus: 'static',

    // Actions (no-ops in static mode)
    updateProfile: () => {},
    forceRetest: async () => {},
    clearCache: () => {},

    // Utilities
    getRecommendations: () => [],
    debugInfo: {}
  };
};

export default usePerformanceV2;
