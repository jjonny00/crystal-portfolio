// src/utils/deviceProfiles.js
// Performance and UI profiles for different device categories

/**
 * Performance profiles optimized for different device tiers
 * These profiles balance quality with performance for target frame rates
 */

// Base performance settings that all profiles inherit
const basePerformanceSettings = {
  // Render scaling
  renderScale: 1.0,
  
  // Material settings
  useNormalMaps: true,
  usePBR: true,
  textureQuality: 'high',
  
  // Post-processing effects
  postProcessing: {
    bloom: true,
    chromaticAberration: true,
    noise: true,        // Always on - cheap and adds character
    vignette: true
  },
  
  // Lighting
  maxLights: 5,
  shadowQuality: 'high',
  
  // Environment
  hdriQuality: 'high',
  
  // Advanced settings
  antialiasing: true,
  anisotropicFiltering: 4
};

/**
 * Mobile Phone Profile
 * Target: 30fps stable
 * Strategy: Aggressive optimization for small screens
 */
export const mobileProfile = {
  ...basePerformanceSettings,
  
  // Render at 60% resolution for major performance boost
  renderScale: 0.6,
  
  // Disable expensive material features
  useNormalMaps: false,
  usePBR: false,           // Biggest performance win
  textureQuality: 'low',
  
  // Minimal post-processing
  postProcessing: {
    bloom: false,
    chromaticAberration: false,
    noise: true,           // Keep noise - very cheap
    vignette: true         // Helps with lower resolution
  },
  
  // Reduced lighting complexity
  maxLights: 2,
  shadowQuality: 'off',
  
  // Low-res environment
  hdriQuality: 'low',
  
  // Disable expensive features
  antialiasing: false,
  anisotropicFiltering: 1,
  
  // Mobile-specific optimizations
  reducedParticles: true,
  simplifiedAnimations: false  // Keep animations, they're important for UX
};

/**
 * Tablet Profile  
 * Target: 30-60fps depending on device
 * Strategy: Balanced quality and performance
 */
export const tabletProfile = {
  ...basePerformanceSettings,
  
  // Render at 80% resolution - good balance
  renderScale: 0.8,
  
  // Keep normal maps, skip PBR
  useNormalMaps: true,
  usePBR: false,           // Still skip PBR for performance
  textureQuality: 'medium',
  
  // Selective post-processing
  postProcessing: {
    bloom: true,           // One nice effect
    chromaticAberration: false,
    noise: true,
    vignette: true
  },
  
  // Moderate lighting
  maxLights: 3,
  shadowQuality: 'low',
  
  // Medium environment
  hdriQuality: 'medium',
  
  // Moderate AA
  antialiasing: true,
  anisotropicFiltering: 2
};

/**
 * Desktop Profile
 * Target: 60fps stable  
 * Strategy: Full quality experience
 */
export const desktopProfile = {
  ...basePerformanceSettings,
  
  // Full resolution
  renderScale: 1.0,
  
  // All material features enabled
  useNormalMaps: true,
  usePBR: true,            // PSR materials enabled
  textureQuality: 'high',
  
  // All post-processing effects
  postProcessing: {
    bloom: true,
    chromaticAberration: true,
    noise: true,
    vignette: true
  },
  
  // Full lighting
  maxLights: 5,
  shadowQuality: 'high',
  
  // High-quality environment
  hdriQuality: 'high',
  
  // Full AA
  antialiasing: true,
  anisotropicFiltering: 4
};

/**
 * Desktop XL Profile
 * Target: 60fps on high-end systems
 * Strategy: Enhanced quality for powerful hardware
 */
export const desktopXLProfile = {
  ...desktopProfile,
  
  // Could go higher resolution on very powerful systems
  renderScale: 1.0,
  
  // Enhanced settings for high-end hardware
  maxLights: 6,
  shadowQuality: 'ultra',  // If we implement ultra shadows
  
  // Maximum quality
  anisotropicFiltering: 8,
  
  // Extra features for high-end systems
  enhancedReflections: true
};

/**
 * UI Layout profiles for responsive design
 */
export const uiProfiles = {
  mobile: {
    // Force portrait orientation
    forcePortrait: true,
    
    // Simplified UI
    showAdvancedControls: false,
    compactLayout: true,
    
    // Touch-optimized
    buttonSize: 'large',
    minimumTouchTarget: 44, // 44px minimum for touch
    
    // Reduced control panels
    maxVisiblePanels: 1,
    
    // Navigation
    useBottomNavigation: true,
    hideKeyboardShortcuts: true,
    
    // 3D Viewport
    viewportPadding: 10,
    showFpsCounter: false  // Hide by default on mobile
  },
  
  tablet: {
    // Allow both orientations
    forcePortrait: false,
    
    // Adaptive UI
    showAdvancedControls: true,
    compactLayout: false,
    
    // Touch-friendly but more space
    buttonSize: 'medium',
    minimumTouchTarget: 40,
    
    // Multiple panels OK
    maxVisiblePanels: 2,
    
    // Mixed navigation
    useBottomNavigation: false,
    hideKeyboardShortcuts: false,
    
    // 3D Viewport
    viewportPadding: 20,
    showFpsCounter: true   // Show for debugging
  },
  
  desktop: {
    // Full desktop experience
    forcePortrait: false,
    
    // All controls available
    showAdvancedControls: true,
    compactLayout: false,
    
    // Mouse-optimized
    buttonSize: 'medium',
    minimumTouchTarget: 32,
    
    // Multiple panels
    maxVisiblePanels: 4,
    
    // Keyboard-heavy
    useBottomNavigation: false,
    hideKeyboardShortcuts: false,
    
    // 3D Viewport  
    viewportPadding: 20,
    showFpsCounter: true
  },
  
  'desktop-xl': {
    // Inherit desktop settings
    ...this?.desktop || {},
    
    // Extra space utilization
    maxVisiblePanels: 6,
    viewportPadding: 40,
    
    // Enhanced layout
    useWideLayout: true
  }
};

/**
 * Get performance profile based on device detection
 */
export const getPerformanceProfile = (deviceProfile) => {
  switch (deviceProfile.performanceTier) {
    case 'high':
      return deviceProfile.category === 'desktop-xl' ? desktopXLProfile : desktopProfile;
    case 'medium':
      return tabletProfile;
    case 'low':
    default:
      return mobileProfile;
  }
};

/**
 * Get UI profile based on device category
 */
export const getUIProfile = (deviceProfile) => {
  return uiProfiles[deviceProfile.category] || uiProfiles.desktop;
};

/**
 * Get HDRI filename based on quality setting
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
 * Apply texture quality scaling at runtime
 */
export const getTextureScale = (quality) => {
  switch (quality) {
    case 'high':
      return 1.0;
    case 'medium':
      return 0.7;
    case 'low':
    default:
      return 0.5;
  }
};

/**
 * Get recommended canvas DPR based on performance tier
 */
export const getCanvasDPR = (deviceProfile, performanceProfile) => {
  const maxDPR = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x
  
  switch (deviceProfile.performanceTier) {
    case 'high':
      return [1, maxDPR];
    case 'medium':
      return [1, Math.min(maxDPR, 1.5)];
    case 'low':
    default:
      return [1, 1]; // No high DPR on low-end devices
  }
};

/**
 * Debug function to log current profiles
 */
export const logProfileInfo = (deviceProfile, performanceProfile, uiProfile) => {
  console.group('🎮 Device Profile Configuration');
  console.log('Device:', deviceProfile);
  console.log('Performance Profile:', performanceProfile);
  console.log('UI Profile:', uiProfile);
  console.log('HDRI Path:', getHDRIPath(performanceProfile.hdriQuality));
  console.log('Recommended DPR:', getCanvasDPR(deviceProfile, performanceProfile));
  console.groupEnd();
};