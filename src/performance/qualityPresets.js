export const QUALITY_PRESETS = {
  ultra: {
    renderScale: 1.0,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    antialias: true,
    shadows: true,
    shadowMapSize: 2048,
    usePBR: true,
    useNormalMaps: true,
    textureAnisotropy: 16,
    postProcessing: {
      bloom: { enabled: true, intensity: 1.0 },
      chromaticAberration: { enabled: true, offset: 0.003 },
      noise: { enabled: true, opacity: 0.1 },
      vignette: { enabled: true, darkness: 1.1 }
    },
    particleCount: 32,
    maxLights: 10
  },
  high: {
    renderScale: 1.0,
    pixelRatio: Math.min(window.devicePixelRatio, 1.5),
    antialias: true,
    shadows: true,
    shadowMapSize: 1024,
    usePBR: true,
    useNormalMaps: true,
    textureAnisotropy: 8,
    postProcessing: {
      bloom: { enabled: true, intensity: 0.8 },
      chromaticAberration: { enabled: false },
      noise: { enabled: false },
      vignette: { enabled: true, darkness: 1.0 }
    },
    particleCount: 16,
    maxLights: 6
  },
  medium: {
    renderScale: 0.9,
    pixelRatio: 1.0,
    antialias: true,
    shadows: false,
    usePBR: true,
    useNormalMaps: false,
    textureAnisotropy: 4,
    postProcessing: {
      bloom: { enabled: true, intensity: 0.5 },
      chromaticAberration: { enabled: false },
      noise: { enabled: false },
      vignette: { enabled: false }
    },
    particleCount: 8,
    maxLights: 4
  },
  low: {
    renderScale: 0.75,
    pixelRatio: 1.0,
    antialias: false,
    shadows: false,
    usePBR: false,
    useNormalMaps: false,
    textureAnisotropy: 1,
    postProcessing: {
      bloom: { enabled: false },
      chromaticAberration: { enabled: false },
      noise: { enabled: false },
      vignette: { enabled: false }
    },
    particleCount: 4,
    maxLights: 3
  },
  minimal: {
    renderScale: 0.5,
    pixelRatio: 1.0,
    antialias: false,
    shadows: false,
    usePBR: false,
    useNormalMaps: false,
    textureAnisotropy: 1,
    postProcessing: null,
    particleCount: 0,
    maxLights: 2
  }
};
