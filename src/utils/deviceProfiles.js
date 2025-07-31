// src/utils/deviceProfiles.js
// FIXED: Better balanced performance profiles that respect working configurations

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
    
    // FIXED: More realistic performance targets
    targetFPS: 40,
    minAcceptableFPS: 30,
    
    // Debug info
    description: 'High-end devices with dedicated GPUs',
    expectedDevices: ['RTX 30/40 series', 'M1/M2 MacBooks', 'High-end iPhones/iPads']
  },

  medium: {
    // FIXED: This should be your "safe default" that was working before
    renderScale: 0.9, // Slightly higher than before
    maxPixelRatio: 1.5,
    antialiasing: true,
    
    // Material quality - keep PBR enabled for good visuals
    pbrQuality: 'medium',
    usePBR: true,
    useNormalMaps: false, // Keep disabled for performance
    textureQuality: 'medium',
    anisotropicFiltering: 2,
    
    // Environment
    hdriQuality: 'medium',
    
    // Lighting
    maxLights: 5,
    
    // Particles
    particleCount: 12, // Slightly increased from before
    reducedParticles: false, // Don't reduce unless needed
    
    // Animations
    simplifiedAnimations: false,
    
    // Post-processing (keep some effects for visual quality)
    postProcessing: {
      bloom: true,
      chromaticAberration: false, 
      noise: false,
      vignette: true
    },
    
    // FIXED: Conservative performance targets that most devices can hit
    targetFPS: 30,
    minAcceptableFPS: 25,
    
    // Debug info
    description: 'Mid-range devices and integrated graphics - safe default',
    expectedDevices: ['GTX 10/16 series', 'Intel/AMD integrated', 'Standard smartphones']
  },

  low: {
    // FIXED: Only use this for truly struggling devices
    renderScale: 0.6,
    maxPixelRatio: 1.0,
    antialiasing: false,
    
    // Material quality - use optimized materials
    pbrQuality: 'low',
    usePBR: false, // Use your optimized MeshStandardMaterial path
    useNormalMaps: false,
    textureQuality: 'low',
    anisotropicFiltering: 1,
    
    // Environment
    hdriQuality: 'low',
    
    // Lighting
    maxLights: 3,
    
    // Particles
    particleCount: 4,
    reducedParticles: true,
    
    // Animations
    simplifiedAnimations: true,
    
    // Post-processing (disabled for maximum performance)
    postProcessing: {
      bloom: false,
      chromaticAberration: false,
      noise: false,
      vignette: false
    },
    
    // FIXED: Lower targets for truly low-end devices
    targetFPS: 25,
    minAcceptableFPS: 20,
    
    // Debug info
    description: 'Older devices and low-end hardware only',
    expectedDevices: ['Older smartphones', 'Budget laptops', 'Very old integrated graphics']
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

// FIXED: More conservative device detection that doesn't over-classify devices as low-end
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
  
  // FIXED: More optimistic heuristics - default to medium instead of guessing low
  let suggestedTier = 'medium'; // Changed from 'medium' - trust devices more
  
  // Check for mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // FIXED: Only downgrade if we're really sure it's a low-end device
  const rendererLower = renderer.toLowerCase();
  
  // High-end detection (upgrade to high)
  if (rendererLower.includes('rtx') || 
      rendererLower.includes('rx 6') || 
      rendererLower.includes('rx 7') ||
      rendererLower.includes('m1') || 
      rendererLower.includes('m2') ||
      rendererLower.includes('gtx 1080') ||
      rendererLower.includes('gtx 1070')) {
    suggestedTier = 'high';
  }
  // Medium-range detection (keep medium)
  else if (rendererLower.includes('gtx 10') || 
           rendererLower.includes('gtx 16') || 
           rendererLower.includes('rx 5') ||
           rendererLower.includes('gtx 9') ||
           (!isMobile && maxTextureSize >= 4096)) {
    suggestedTier = 'medium';
  }
  // FIXED: Only classify as low if we're really sure (very specific low-end indicators)
  else if ((rendererLower.includes('intel') && rendererLower.includes('hd')) ||
           (rendererLower.includes('integrated') && !rendererLower.includes('iris')) ||
           (isMobile && rendererLower.includes('adreno 5')) ||
           maxTextureSize < 2048) {
    suggestedTier = 'low';
  }
  // FIXED: Default to medium for unknown devices rather than low
  
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