// src/utils/deviceProfiles.js
// FIXED: Enhanced performance profiles that properly utilize high-end devices

/**
 * Enhanced Performance profiles that properly differentiate device capabilities
 */

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
 * HIGH-END MOBILE PROFILE (iPad Pro, iPhone 14/15 Pro, Android Flagships)
 * Target: 60fps with high quality
 * Strategy: Leverage powerful mobile hardware properly
 */
export const highEndMobileProfile = {
  ...basePerformanceSettings,
  
  // Higher render scale for powerful devices
  renderScale: 0.85,  // Much higher than old mobile profile
  
  // Enable advanced material features
  useNormalMaps: true,   // HIGH-END can handle this
  usePBR: true,          // ENABLE PBR on high-end mobile!
  textureQuality: 'high', // High quality textures
  
  // Enable selective post-processing
  postProcessing: {
    bloom: true,           // Enable bloom on high-end
    chromaticAberration: false, // Skip this one for performance
    noise: true,
    vignette: true
  },
  
  // Better lighting
  maxLights: 3,
  shadowQuality: 'medium',
  
  // High environment quality
  hdriQuality: 'high',
  
  // Some AA on high-end mobile
  antialiasing: true,
  anisotropicFiltering: 2,
  
  // High-end mobile optimizations
  reducedParticles: false,  // Don't reduce particles
  simplifiedAnimations: false
};

/**
 * MEDIUM MOBILE PROFILE (Mid-range phones, older iPads)
 * Target: 30fps stable
 * Strategy: Balanced quality and performance
 */
export const mediumMobileProfile = {
  ...basePerformanceSettings,
  
  renderScale: 0.7,
  
  // Selective material features
  useNormalMaps: false,     // Skip normal maps
  usePBR: true,             // Keep PBR - it's not that expensive
  textureQuality: 'medium',
  
  // Minimal post-processing
  postProcessing: {
    bloom: false,
    chromaticAberration: false,
    noise: true,
    vignette: true
  },
  
  maxLights: 2,
  shadowQuality: 'low',
  hdriQuality: 'medium',
  
  antialiasing: false,
  anisotropicFiltering: 1,
  
  reducedParticles: true,
  simplifiedAnimations: false
};

/**
 * LOW-END MOBILE PROFILE (Older phones, budget devices)
 * Target: 30fps minimum
 * Strategy: Maximum performance optimization
 */
export const lowEndMobileProfile = {
  ...basePerformanceSettings,
  
  renderScale: 0.5,
  
  // Disable expensive features
  useNormalMaps: false,
  usePBR: false,           // Disable PBR for low-end
  textureQuality: 'low',
  
  // Minimal post-processing
  postProcessing: {
    bloom: false,
    chromaticAberration: false,
    noise: true,           // Keep cheap noise
    vignette: true         // Keep cheap vignette
  },
  
  maxLights: 2,
  shadowQuality: 'off',
  hdriQuality: 'low',
  
  antialiasing: false,
  anisotropicFiltering: 1,
  
  reducedParticles: true,
  simplifiedAnimations: false
};

/**
 * HIGH-END TABLET PROFILE (iPad Pro M1/M2, Samsung Tab S8+)
 * Target: 60fps with premium quality
 * Strategy: Utilize tablet's larger screen and better cooling
 */
export const highEndTabletProfile = {
  ...basePerformanceSettings,
  
  // Higher resolution for larger screens
  renderScale: 0.9,
  
  // Full material features
  useNormalMaps: true,
  usePBR: true,
  textureQuality: 'high',
  
  // Most post-processing effects
  postProcessing: {
    bloom: true,
    chromaticAberration: true,
    noise: true,
    vignette: true
  },
  
  maxLights: 4,
  shadowQuality: 'high',
  hdriQuality: 'high',
  
  antialiasing: true,
  anisotropicFiltering: 2,
  
  // Don't reduce features on high-end tablets
  reducedParticles: false,
  simplifiedAnimations: false
};

/**
 * MEDIUM TABLET PROFILE
 */
export const mediumTabletProfile = {
  ...basePerformanceSettings,
  
  renderScale: 0.7,
  
  useNormalMaps: false,
  usePBR: true,
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
 * DESKTOP PROFILES (unchanged - these were working fine)
 */
export const desktopProfile = {
  ...basePerformanceSettings,
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

export const desktopXLProfile = {
  ...desktopProfile,
  renderScale: 1.0,
  maxLights: 6,
  shadowQuality: 'ultra',
  anisotropicFiltering: 8,
  enhancedReflections: true
};

/**
 * ENHANCED: Get performance profile with proper high-end device support
 */
export const getPerformanceProfile = (deviceProfile) => {
  console.log('🎮 Getting performance profile for:', {
    category: deviceProfile.category,
    tier: deviceProfile.performanceTier,
    isIPad: deviceProfile.isIPad,
    isMobile: deviceProfile.isMobile,
    deviceModel: deviceProfile.deviceModel
  });
  
  // Desktop devices
  if (deviceProfile.category === 'desktop' || deviceProfile.category === 'desktop-xl') {
    if (deviceProfile.performanceTier === 'high') {
      return deviceProfile.category === 'desktop-xl' ? desktopXLProfile : desktopProfile;
    } else if (deviceProfile.performanceTier === 'medium') {
      return { ...desktopProfile, renderScale: 0.8, textureQuality: 'medium' };
    } else {
      return { ...desktopProfile, renderScale: 0.6, usePBR: false, textureQuality: 'low' };
    }
  }
  
  // Tablet devices (including iPad)
  if (deviceProfile.category === 'tablet' || deviceProfile.isIPad) {
    if (deviceProfile.performanceTier === 'high') {
      console.log('✅ High-end tablet detected - using premium settings');
      return highEndTabletProfile;
    } else {
      return mediumTabletProfile;
    }
  }
  
  // Mobile devices
  if (deviceProfile.category === 'mobile' || deviceProfile.isMobile) {
    if (deviceProfile.performanceTier === 'high') {
      console.log('✅ High-end mobile detected - using premium mobile settings');
      return highEndMobileProfile;
    } else if (deviceProfile.performanceTier === 'medium') {
      return mediumMobileProfile;
    } else {
      return lowEndMobileProfile;
    }
  }
  
  // Fallback
  return desktopProfile;
};

/**
 * UI Profiles (enhanced for better device support)
 */
export const uiProfiles = {
  mobile: {
    forcePortrait: false, // Don't force portrait on high-end mobile
    showAdvancedControls: false,
    compactLayout: true,
    buttonSize: 'large',
    minimumTouchTarget: 44,
    maxVisiblePanels: 1,
    useBottomNavigation: true,
    hideKeyboardShortcuts: true,
    viewportPadding: 10,
    showFpsCounter: true  // Show FPS on mobile for debugging
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

/**
 * Get UI profile based on device category
 */
export const getUIProfile = (deviceProfile) => {
  return uiProfiles[deviceProfile.category] || uiProfiles.desktop;
};

/**
 * Enhanced HDRI path selection
 */
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

/**
 * Enhanced canvas DPR that doesn't cap high-end devices unnecessarily
 */
export const getCanvasDPR = (deviceProfile, performanceProfile) => {
  const maxDPR = Math.min(window.devicePixelRatio || 1, 2);
  
  // High-end devices can handle higher DPR
  if (deviceProfile.performanceTier === 'high') {
    if (deviceProfile.category === 'desktop' || deviceProfile.category === 'desktop-xl') {
      return [1, maxDPR]; // Full DPR on high-end desktop
    } else {
      // High-end mobile/tablet: allow higher DPR but be conservative
      return [1, Math.min(maxDPR, 1.5)];
    }
  }
  
  // Medium devices: modest DPR
  if (deviceProfile.performanceTier === 'medium') {
    return [1, Math.min(maxDPR, 1.2)];
  }
  
  // Low-end devices: stick to 1x
  return [1, 1];
};

/**
 * Enhanced logging with more details
 */
export const logProfileInfo = (deviceProfile, performanceProfile, uiProfile) => {
  console.group('🎮 Enhanced Device Profile Configuration');
  console.log('Device:', deviceProfile);
  console.log('Performance Profile:', performanceProfile);
  console.log('UI Profile:', uiProfile);
  console.log('HDRI Path:', getHDRIPath(performanceProfile.hdriQuality));
  console.log('Recommended DPR:', getCanvasDPR(deviceProfile, performanceProfile));
  
  // Performance summary
  console.log('📊 Performance Summary:', {
    renderScale: performanceProfile.renderScale,
    usePBR: performanceProfile.usePBR,
    useNormalMaps: performanceProfile.useNormalMaps,
    textureQuality: performanceProfile.textureQuality,
    postProcessing: Object.entries(performanceProfile.postProcessing)
      .filter(([_, enabled]) => enabled)
      .map(([effect, _]) => effect)
  });
  
  console.groupEnd();
};