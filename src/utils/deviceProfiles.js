// src/utils/deviceProfiles.js
// OPTIMIZED: More aggressive mobile optimization since we have a better non-PBR material

// Base performance settings
const basePerformanceSettings = {
  renderScale: 1.0,
  useNormalMaps: true,
  usePBR: true,
  textureQuality: 'high',
  postProcessing: {
    bloom: true,
    chromaticAberration: true,
    noise: true,
    vignette: true
  },
  maxLights: 5,
  shadowQuality: 'high',
  hdriQuality: 'high',
  antialiasing: true,
  anisotropicFiltering: 4
};

/**
 * OPTIMIZED: High-end mobile profile with selective PBR usage
 * Only the very best mobile devices get PBR now
 */
export const highEndMobileProfile = {
  ...basePerformanceSettings,
  
  // Good render scale for high-end mobile
  renderScale: 0.8,
  
  // OPTIMIZED: Disable PBR even on high-end mobile for better performance
  // The new MeshStandardMaterial looks great and performs much better
  useNormalMaps: true,      // Keep normal maps on high-end
  usePBR: false,            // CHANGED: Disable PBR for better performance
  textureQuality: 'high',   // Keep high textures
  
  // Enable selective post-processing
  postProcessing: {
    bloom: true,            // Enable bloom on high-end
    chromaticAberration: false, // Skip for performance
    noise: true,
    vignette: true
  },
  
  // Conservative lighting
  maxLights: 3,
  shadowQuality: 'medium',
  hdriQuality: 'high',      // Keep high HDRI for environment reflections
  
  // Minimal AA
  antialiasing: false,      // CHANGED: Disable for better performance
  anisotropicFiltering: 1,  // CHANGED: Reduce for better performance
  
  // High-end mobile specific
  reducedParticles: false,
  simplifiedAnimations: false
};

/**
 * OPTIMIZED: Medium mobile gets more aggressive optimization
 */
export const mediumMobileProfile = {
  ...basePerformanceSettings,
  
  renderScale: 0.65,        // CHANGED: Reduced from 0.7
  
  // Disable expensive features
  useNormalMaps: false,     // CHANGED: Disable normal maps
  usePBR: false,            // Keep disabled
  textureQuality: 'medium',
  
  // Minimal post-processing
  postProcessing: {
    bloom: false,           // CHANGED: Disable bloom
    chromaticAberration: false,
    noise: true,            // Keep cheap effects
    vignette: true
  },
  
  maxLights: 2,
  shadowQuality: 'low',
  hdriQuality: 'medium',    // Medium HDRI still gives reflections
  
  antialiasing: false,
  anisotropicFiltering: 1,
  
  reducedParticles: true,
  simplifiedAnimations: false
};

/**
 * OPTIMIZED: Low-end mobile gets maximum optimization
 */
export const lowEndMobileProfile = {
  ...basePerformanceSettings,
  
  renderScale: 0.5,         // Keep low render scale
  
  // Disable all expensive features
  useNormalMaps: false,
  usePBR: false,
  textureQuality: 'low',
  
  // Minimal post-processing
  postProcessing: {
    bloom: false,
    chromaticAberration: false,
    noise: false,           // CHANGED: Disable even cheap effects
    vignette: true          // Keep only vignette
  },
  
  maxLights: 2,
  shadowQuality: 'off',
  hdriQuality: 'low',       // Still get some environment reflections
  
  antialiasing: false,
  anisotropicFiltering: 1,
  
  reducedParticles: true,
  simplifiedAnimations: true  // CHANGED: Enable simplified animations
};

/**
 * OPTIMIZED: iPad/tablet profiles - be more selective about PBR
 */
export const highEndTabletProfile = {
  ...basePerformanceSettings,
  
  renderScale: 0.85,        // Good resolution for tablets
  
  // CHANGED: Even high-end tablets get non-PBR for better performance
  useNormalMaps: true,
  usePBR: false,            // CHANGED: Use optimized material instead
  textureQuality: 'high',
  
  // Enable most post-processing
  postProcessing: {
    bloom: true,
    chromaticAberration: false, // Skip the expensive one
    noise: true,
    vignette: true
  },
  
  maxLights: 4,
  shadowQuality: 'high',
  hdriQuality: 'high',
  
  antialiasing: false,      // CHANGED: Disable for better performance
  anisotropicFiltering: 2,
  
  reducedParticles: false,
  simplifiedAnimations: false
};

export const mediumTabletProfile = {
  ...basePerformanceSettings,
  
  renderScale: 0.7,
  
  useNormalMaps: false,
  usePBR: false,
  textureQuality: 'medium',
  
  postProcessing: {
    bloom: false,
    chromaticAberration: false,
    noise: true,
    vignette: true
  },
  
  maxLights: 2,
  shadowQuality: 'medium',
  hdriQuality: 'medium',
  
  antialiasing: false,
  anisotropicFiltering: 1,
  
  reducedParticles: true,
  simplifiedAnimations: false
};

/**
 * Desktop profiles remain mostly unchanged since they can handle PBR
 */
export const desktopProfile = {
  ...basePerformanceSettings,
  renderScale: 1.0,
  useNormalMaps: true,
  usePBR: true,             // Desktop keeps PBR
  textureQuality: 'high',
  postProcessing: {
    bloom: true,
    chromaticAberration: true,
    noise: true,
    vignette: true
  },
  maxLights: 5,
  shadowQuality: 'high',
  hdriQuality: 'high',
  antialiasing: true,
  anisotropicFiltering: 4
};

export const desktopXLProfile = {
  ...desktopProfile,
  renderScale: 1.0,
  maxLights: 6,
  shadowQuality: 'ultra',
  anisotropicFiltering: 8,
  enhancedReflections: true
};

/**
 * OPTIMIZED: More aggressive profile selection
 */
export const getPerformanceProfile = (deviceProfile) => {
  if (process.env.NODE_ENV === "development") console.log('🎮 Getting OPTIMIZED performance profile for:', {
    category: deviceProfile.category,
    tier: deviceProfile.performanceTier,
    isIPad: deviceProfile.isIPad,
    isMobile: deviceProfile.isMobile,
    deviceModel: deviceProfile.deviceModel
  });
  
  // Desktop devices (only these get PBR by default now)
  if (deviceProfile.category === 'desktop' || deviceProfile.category === 'desktop-xl') {
    if (deviceProfile.performanceTier === 'high') {
      return deviceProfile.category === 'desktop-xl' ? desktopXLProfile : desktopProfile;
    } else if (deviceProfile.performanceTier === 'medium') {
      return { 
        ...desktopProfile, 
        renderScale: 0.8, 
        textureQuality: 'medium',
        usePBR: true  // Keep PBR on desktop even if medium performance
      };
    } else {
      return { 
        ...desktopProfile, 
        renderScale: 0.6, 
        usePBR: false,    // Only disable PBR on very low-end desktop
        textureQuality: 'low' 
      };
    }
  }
  
  // Tablet devices - now more performance focused
  if (deviceProfile.category === 'tablet' || deviceProfile.isIPad) {
    if (deviceProfile.performanceTier === 'high') {
      if (process.env.NODE_ENV === "development") console.log('✅ High-end tablet - using optimized non-PBR profile');
      return highEndTabletProfile;
    } else {
      return mediumTabletProfile;
    }
  }
  
  // Mobile devices - all get non-PBR now for better performance
  if (deviceProfile.category === 'mobile' || deviceProfile.isMobile) {
    if (deviceProfile.performanceTier === 'high') {
      if (process.env.NODE_ENV === "development") console.log('✅ High-end mobile - using optimized non-PBR profile');
      return highEndMobileProfile;
    } else if (deviceProfile.performanceTier === 'medium') {
      return mediumMobileProfile;
    } else {
      return lowEndMobileProfile;
    }
  }
  
  // Fallback to desktop profile
  return desktopProfile;
};

/**
 * UI Profiles (unchanged)
 */
export const uiProfiles = {
  mobile: {
    forcePortrait: false,
    showAdvancedControls: false,
    compactLayout: true,
    buttonSize: 'large',
    minimumTouchTarget: 44,
    maxVisiblePanels: 1,
    useBottomNavigation: true,
    hideKeyboardShortcuts: true,
    viewportPadding: 10,
    showFpsCounter: true
  },
  
  tablet: {
    forcePortrait: false,
    showAdvancedControls: true,
    compactLayout: false,
    buttonSize: 'medium',
    minimumTouchTarget: 40,
    maxVisiblePanels: 2,
    useBottomNavigation: false,
    hideKeyboardShortcuts: false,
    viewportPadding: 20,
    showFpsCounter: true
  },
  
  desktop: {
    forcePortrait: false,
    showAdvancedControls: true,
    compactLayout: false,
    buttonSize: 'medium',
    minimumTouchTarget: 32,
    maxVisiblePanels: 4,
    useBottomNavigation: false,
    hideKeyboardShortcuts: false,
    viewportPadding: 20,
    showFpsCounter: true
  },
  
  'desktop-xl': {
    forcePortrait: false,
    showAdvancedControls: true,
    compactLayout: false,
    buttonSize: 'medium',
    minimumTouchTarget: 32,
    maxVisiblePanels: 6,
    useBottomNavigation: false,
    hideKeyboardShortcuts: false,
    viewportPadding: 40,
    showFpsCounter: true,
    useWideLayout: true
  }
};

export const getUIProfile = (deviceProfile) => {
  return uiProfiles[deviceProfile.category] || uiProfiles.desktop;
};

export const getHDRIPath = (quality) => {
  const basePath = '/assets/environment/prismatic09';
  
  switch (quality) {
    case 'high':
      return `${basePath}-high.hdr`;
    case 'medium':
      return `${basePath}-medium.hdr`;
    case 'low':
    default:
      return `${basePath}-low.hdr`;
  }
};

export const getCanvasDPR = (deviceProfile, performanceProfile) => {
  const maxDPR = Math.min(window.devicePixelRatio || 1, 2);
  
  // Be more conservative with DPR on mobile
  if (deviceProfile.performanceTier === 'high') {
    if (deviceProfile.category === 'desktop' || deviceProfile.category === 'desktop-xl') {
      return [1, maxDPR];
    } else {
      // CHANGED: Even high-end mobile gets capped DPR
      return [1, Math.min(maxDPR, 1.25)];
    }
  }
  
  if (deviceProfile.performanceTier === 'medium') {
    return [1, Math.min(maxDPR, 1.1)];
  }
  
  // Low-end devices: stick to 1x
  return [1, 1];
};

export const logProfileInfo = (deviceProfile, performanceProfile, uiProfile) => {
  if (process.env.NODE_ENV === "development") console.group('🎮 OPTIMIZED Device Profile Configuration');
  if (process.env.NODE_ENV === "development") console.log('Device:', deviceProfile);
  if (process.env.NODE_ENV === "development") console.log('Performance Profile:', performanceProfile);
  if (process.env.NODE_ENV === "development") console.log('UI Profile:', uiProfile);
  if (process.env.NODE_ENV === "development") console.log('HDRI Path:', getHDRIPath(performanceProfile.hdriQuality));
  if (process.env.NODE_ENV === "development") console.log('Recommended DPR:', getCanvasDPR(deviceProfile, performanceProfile));
  
  if (process.env.NODE_ENV === "development") console.log('📊 OPTIMIZED Performance Summary:', {
    renderScale: performanceProfile.renderScale,
    usePBR: performanceProfile.usePBR,
    useNormalMaps: performanceProfile.useNormalMaps,
    textureQuality: performanceProfile.textureQuality,
    postProcessing: Object.entries(performanceProfile.postProcessing)
      .filter(([_, enabled]) => enabled)
      .map(([effect, _]) => effect),
    optimization: performanceProfile.usePBR ? 'Full PBR' : 'Optimized Standard Material'
  });
  
  if (process.env.NODE_ENV === "development") console.groupEnd();
};