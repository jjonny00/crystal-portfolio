// src/utils/deviceProfiles.js
// UPDATED: More comprehensive performance profiles with proper settings

export const PERFORMANCE_PROFILES = {
  high: {
    // Rendering settings
    renderScale: 1.0,
    maxPixelRatio: 2.0,
    antialiasing: true,
    
    // Material quality
    pbrQuality: 'high',
    usePBR: true,
    useNormalMaps: true,
    textureQuality: 'high',
    anisotropicFiltering: 4,
    
    // Environment
    hdriQuality: 'high',
    
    // Lighting
    maxLights: 8,
    
    // Particles
    particleCount: 16,
    reducedParticles: false,
    
    // Animations
    simplifiedAnimations: false,
    
    // Post-processing
    postProcessing: {
      bloom: true,
      chromaticAberration: true,
      noise: true,
      vignette: true
    },
    
    // Performance monitoring
    targetFPS: 45,
    minAcceptableFPS: 35,
    
    // Debug info
    description: 'High-end devices with dedicated GPUs',
    expectedDevices: ['RTX 30/40 series', 'M1/M2 MacBooks', 'High-end iPhones/iPads']
  },

  medium: {
    // Rendering settings
    renderScale: 0.8,
    maxPixelRatio: 1.5,
    antialiasing: true,
    
    // Material quality
    pbrQuality: 'medium',
    usePBR: true,
    useNormalMaps: false, // Disable normal maps for better performance
    textureQuality: 'medium',
    anisotropicFiltering: 2,
    
    // Environment
    hdriQuality: 'medium',
    
    // Lighting
    maxLights: 5,
    
    // Particles
    particleCount: 8,
    reducedParticles: true,
    
    // Animations
    simplifiedAnimations: false,
    
    // Post-processing (reduced)
    postProcessing: {
      bloom: true,
      chromaticAberration: false, // Disable expensive effects
      noise: false,
      vignette: true
    },
    
    // Performance monitoring
    targetFPS: 30,
    minAcceptableFPS: 25,
    
    // Debug info
    description: 'Mid-range devices and integrated graphics',
    expectedDevices: ['GTX 10/16 series', 'Intel/AMD integrated', 'Standard smartphones']
  },

  low: {
    // Rendering settings
    renderScale: 0.6,
    maxPixelRatio: 1.0,
    antialiasing: false, // Disable for performance
    
    // Material quality
    pbrQuality: 'low',
    usePBR: false, // Use standard materials instead of PBR
    useNormalMaps: false,
    textureQuality: 'low',
    anisotropicFiltering: 1,
    
    // Environment
    hdriQuality: 'low',
    
    // Lighting
    maxLights: 3, // Minimal lighting
    
    // Particles
    particleCount: 4,
    reducedParticles: true,
    
    // Animations
    simplifiedAnimations: true, // Reduce animation complexity
    
    // Post-processing (minimal)
    postProcessing: {
      bloom: false, // Disable all post-processing
      chromaticAberration: false,
      noise: false,
      vignette: false
    },
    
    // Performance monitoring
    targetFPS: 25,
    minAcceptableFPS: 20,
    
    // Debug info
    description: 'Older devices and low-end hardware',
    expectedDevices: ['Older smartphones', 'Budget laptops', 'Integrated graphics']
  },

  // Special profile for development/testing
  ultra: {
    // Maximum quality for development
    renderScale: 1.0,
    maxPixelRatio: 3.0,
    antialiasing: true,
    
    pbrQuality: 'high',
    usePBR: true,
    useNormalMaps: true,
    textureQuality: 'high',
    anisotropicFiltering: 16,
    
    hdriQuality: 'high',
    maxLights: 12,
    
    particleCount: 32,
    reducedParticles: false,
    simplifiedAnimations: false,
    
    postProcessing: {
      bloom: true,
      chromaticAberration: true,
      noise: true,
      vignette: true
    },
    
    targetFPS: 60,
    minAcceptableFPS: 45,
    
    description: 'Development/testing - maximum quality',
    expectedDevices: ['Development machines only']
  }
};

// Helper function to get profile by tier
export const getProfileByTier = (tier) => {
  return PERFORMANCE_PROFILES[tier] || PERFORMANCE_PROFILES.medium;
};

// Helper function to get all available tiers
export const getAvailableTiers = () => {
  return Object.keys(PERFORMANCE_PROFILES);
};

// Helper function to get profile description
export const getProfileDescription = (tier) => {
  const profile = PERFORMANCE_PROFILES[tier];
  return profile ? profile.description : 'Unknown profile';
};

// Device detection helpers (enhanced)
export const detectDeviceCapabilities = () => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    return { tier: 'low', reason: 'No WebGL support' };
  }

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
  const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown';
  
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const maxVertexTextureImageUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
  const maxFragmentTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
  
  // Basic heuristics (these will be overridden by performance test)
  let suggestedTier = 'medium';
  
  // Check for mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Check renderer string for known good/bad GPUs
  const rendererLower = renderer.toLowerCase();
  if (rendererLower.includes('rtx') || rendererLower.includes('rx 6') || rendererLower.includes('m1') || rendererLower.includes('m2')) {
    suggestedTier = 'high';
  } else if (rendererLower.includes('gtx 10') || rendererLower.includes('gtx 16') || rendererLower.includes('rx 5')) {
    suggestedTier = 'medium';
  } else if (rendererLower.includes('intel') || rendererLower.includes('integrated') || isMobile) {
    suggestedTier = 'low';
  }
  
  // Check available memory (if supported)
  const memory = (gl.getExtension('WEBGL_debug_renderer_info') && gl.getParameter) ? 
    gl.getParameter(0x9048) : null; // WEBGL_memory_info extension
  
  return {
    tier: suggestedTier,
    capabilities: {
      renderer,
      vendor,
      maxTextureSize,
      maxVertexTextureImageUnits,
      maxFragmentTextureUnits,
      memory,
      isMobile,
      devicePixelRatio: window.devicePixelRatio
    }
  };
};