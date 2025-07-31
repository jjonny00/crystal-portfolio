// src/utils/deviceProfiles.js
export const PERFORMANCE_PROFILES = {
  high: {
    renderScale: 1.0,
    pbrQuality: 'high',
    hdriQuality: 'high',
    useNormalMaps: true,
    particleCount: 16,
    postProcessing: {
      bloom: true,
      chromaticAberration: true
    }
  },
  medium: {
    renderScale: 0.75,
    pbrQuality: 'medium',
    hdriQuality: 'medium',
    useNormalMaps: false,
    particleCount: 8,
    postProcessing: {
      bloom: true,
      chromaticAberration: false
    }
  },
  low: {
    renderScale: 0.5,
    pbrQuality: 'low',
    hdriQuality: 'low',
    useNormalMaps: false,
    particleCount: 4,
    postProcessing: {
      bloom: false,
      chromaticAberration: false
    }
  }
};
