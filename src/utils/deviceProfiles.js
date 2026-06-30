// src/utils/deviceProfiles.js
// FIXED: Better balanced performance profiles that respect working configurations

import { isMobileDevice } from './isMobileDevice.js';

export const PERFORMANCE_PROFILES = {
  high: {
    // Rendering settings
    renderScale: 1.0,
    maxPixelRatio: 2.0,
    antialiasing: true,
    // EffectComposer MSAA sample count (4x is visually ~indistinguishable from 8x
    // at a fraction of the post-processing bandwidth cost)
    msaaSamples: 4,

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
    particleCount: 60,
    reducedParticles: false,
    
    // Animations
    simplifiedAnimations: false,

    // Post-processing (vignette off across all tiers; bloom + CA on across all tiers)
    postProcessing: {
      bloom: true,
      chromaticAberration: true,
      noise: true,
      vignette: false
    },

    // Fresnel internal-glow intensity scale (multiplies crystal.glow.emissiveIntensity)
    glowIntensityScale: 1.0,

    // All tiers now target a 60 FPS baseline
    targetFPS: 60,
    minAcceptableFPS: 55,

    // Debug info
    description: 'High-end devices (avg ≥58 FPS) with dedicated GPUs',
    expectedDevices: ['RTX 30/40 series', 'M1/M2 MacBooks', 'High-end iPhones/iPads']
  },

  medium: {
    // FIXED: This should be your "safe default" that was working before
    renderScale: 0.9, // Slightly higher than before
    maxPixelRatio: 1.5,
    antialiasing: true,
    msaaSamples: 4,

    // Material quality - keep PBR enabled for good visuals
    pbrQuality: 'medium',
    usePBR: true,
    useNormalMaps: true, // Keep disabled for performance
    textureQuality: 'medium',
    anisotropicFiltering: 2,

    // Crystal material baseline (default variant). MeshPhysicalMaterial — same
    // class as high, so seeded from high's reference values; dial down here to
    // claw back FPS. Colors are hex strings, ranges are arrays; MaterialManager
    // instantiates THREE.Color / Vector2. NOTE: `reflectivity` is intentionally
    // omitted — on MeshPhysicalMaterial it is coupled to `ior` and setting it
    // clobbers IOR (see crystalConfig.js materials.crystal note).
    material: {
      type: 'physical',
      color: '#0d042b',
      emissive: '#02062b',
      emissiveIntensity: 0.1,
      metalness: 0.0,
      roughness: 0.08,
      opacity: 0.98,
      transmission: 0.97,
      ior: 1.0,
      thickness: 0.1,
      iridescence: 1.4,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [100, 400],
      clearcoat: 0.8,
      clearcoatRoughness: 0.05,
      attenuationColor: '#00fff2',
      attenuationDistance: 0.5,
      envMapIntensity: 4.0,
      specularIntensity: 2.0,
      specularColor: '#ffffff',
      flatShading: true,
    },
    
    // Environment
    hdriQuality: 'medium',
    
    // Lighting
    maxLights: 5,
    
    // Particles
    particleCount: 60,
    reducedParticles: false,

    // Animations
    simplifiedAnimations: false,
    
    // Post-processing (vignette off across all tiers; bloom + CA on across all tiers)
    postProcessing: {
      bloom: true,
      chromaticAberration: true,
      noise: true,
      vignette: false
    },

    // Fresnel internal-glow intensity scale (multiplies crystal.glow.emissiveIntensity).
    // Now that medium keeps high's transmission, the glow reads close to high; held just
    // under 1.0 to hedge medium's flatter (normal-maps-off) surface. Tune in-browser.
    glowIntensityScale: 0.85,

    // All tiers now target a 60 FPS baseline
    targetFPS: 60,
    minAcceptableFPS: 55,

    // Debug info
    description: 'Mid-range devices (avg 40–57 FPS) and integrated graphics - safe default',
    expectedDevices: ['GTX 10/16 series', 'Intel/AMD integrated', 'Standard smartphones']
  },

  low: {
    // FIXED: Only use this for truly struggling devices
    renderScale: 0.6,
    maxPixelRatio: 1.0,
    antialiasing: false,
    msaaSamples: 0, // post-process MSAA off on low tier (was paying 8x regardless)

    // Material quality - use optimized materials
    pbrQuality: 'low',
    usePBR: false, // Use your optimized MeshStandardMaterial path
    useNormalMaps: true,
    textureQuality: 'low',
    anisotropicFiltering: 1,

    // Crystal material baseline (default variant). MeshPhong — hard ceiling: no
    // transmission / refraction / iridescence / clearcoat. Approximates the glass
    // read with envMap reflections + specular highlights + the shared internal
    // glow. `combine: 'mix'` maps to THREE.MixOperation in MaterialManager.
    // `color` here is the pre-boost base; MaterialManager still applies
    // boostLowTierColor for visibility on low-tier lighting.
    material: {
      type: 'phong',
      color: '#0d042b',
      specular: '#ffffff',
      shininess: 1000,
      reflectivity: 0.9,
      combine: 'mix',
      emissive: '#261b8d',
      emissiveIntensity: 0.9,
      opacity: 0.98,
    },
    
    // Environment
    hdriQuality: 'low',
    
    // Lighting
    maxLights: 3,
    
    // Particles
    particleCount: 32,
    reducedParticles: false,

    // Animations
    simplifiedAnimations: false,
    
    // Post-processing (vignette off across all tiers; bloom + CA on across all tiers).
    // NOTE: bloom + CA were previously off on low for performance — re-enabled per
    // request for visual consistency; watch low-end FPS.
    postProcessing: {
      bloom: true,
      chromaticAberration: true,
      noise: true,
      vignette: false
    },

    // Fresnel internal-glow intensity scale (multiplies crystal.glow.emissiveIntensity)
    glowIntensityScale: 0.45,

    // All tiers now target a 60 FPS baseline
    targetFPS: 60,
    minAcceptableFPS: 55,

    // Debug info
    description: 'Older devices and low-end hardware (<40 FPS) only',
    expectedDevices: ['Older smartphones', 'Budget laptops', 'Very old integrated graphics']
  },

  // Special profile for development/testing
  ultra: {
    // Maximum quality for development
    renderScale: 1.0,
    maxPixelRatio: 3.0,
    antialiasing: true,
    msaaSamples: 8, // dev/testing tier keeps maximum quality

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
    
    // Post-processing (vignette off across all tiers; bloom + CA on across all tiers)
    postProcessing: {
      bloom: true,
      chromaticAberration: true,
      noise: true,
      vignette: false
    },

    glowIntensityScale: 1.0,

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
    return { tier: 'low', confidence: 1, reason: 'No WebGL support', capabilities: {} };
  }

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
  const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown';

  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const maxVertexTextureImageUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
  const maxFragmentTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

  const rendererLower = renderer.toLowerCase();
  const isMobile = isMobileDevice();
  const deviceMemory = navigator.deviceMemory || null;

  const gpuBlacklist = ['mali-4', 'mali-3', 'adreno 3', 'adreno 4', 'intel hd', 'powervr', 'nouveau'];
  const highEndDesktopGPUs = ['rtx', 'rx 6', 'rx 7', 'gtx 1080', 'gtx 1070'];
  const midRangeGPUs = ['gtx 10', 'gtx 16', 'rx 5', 'gtx 9'];
  const highEndMobileGPUs = ['apple a17', 'apple a16', 'apple a15', 'apple m1', 'apple m2', 'snapdragon 8', 'adreno 7', 'mali-g78'];

  let suggestedTier = 'medium';
  let confidence = 0.5;

  if (gpuBlacklist.some(g => rendererLower.includes(g)) || (isMobile && deviceMemory && deviceMemory <= 2)) {
    suggestedTier = 'low';
    confidence = 0.8;
  } else if (!isMobile && (highEndDesktopGPUs.some(g => rendererLower.includes(g)) || maxTextureSize >= 8192)) {
    suggestedTier = 'high';
    confidence = 0.9;
  } else if (!isMobile && (midRangeGPUs.some(g => rendererLower.includes(g)) || maxTextureSize >= 4096)) {
    suggestedTier = 'medium';
    confidence = 0.7;
  } else if (isMobile) {
    suggestedTier = 'low';
    confidence = 0.7;
    if (highEndMobileGPUs.some(g => rendererLower.includes(g)) || (deviceMemory && deviceMemory >= 4 && maxTextureSize >= 4096)) {
      suggestedTier = 'medium';
      confidence = 0.8;
    }
    if ((rendererLower.includes('m1') || rendererLower.includes('m2')) || (deviceMemory && deviceMemory >= 6 && maxTextureSize >= 8192)) {
      suggestedTier = 'high';
      confidence = 0.85;
    }
  } else if (maxTextureSize < 2048) {
    suggestedTier = 'low';
    confidence = 0.6;
  }

  if (deviceMemory && deviceMemory < 4 && suggestedTier !== 'low') {
    suggestedTier = 'low';
    confidence = Math.max(confidence, 0.7);
  }

  return {
    tier: suggestedTier,
    confidence,
    capabilities: {
      renderer,
      vendor,
      maxTextureSize,
      maxVertexTextureImageUnits,
      maxFragmentTextureUnits,
      memory: deviceMemory,
      isMobile,
      devicePixelRatio: window.devicePixelRatio
    }
  };
};