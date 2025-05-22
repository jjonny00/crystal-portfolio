// src/utils/deviceDetection.js
// Core device detection and classification system

/**
 * Device Detection Utility
 * Analyzes device capabilities and classifies performance tier
 */

// Device capability scoring system
const detectDeviceCapabilities = () => {
  const capabilities = {
    // Hardware detection
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isTablet: /(iPad|Android(?!.*Mobile))/i.test(navigator.userAgent),
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: /Android/i.test(navigator.userAgent),
    
    // Screen information
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio || 1,
    
    // Browser capabilities
    supportsWebGL2: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl2'));
      } catch (e) {
        return false;
      }
    })(),
    
    // Hardware concurrency (CPU cores)
    cpuCores: navigator.hardwareConcurrency || 2,
    
    // Memory (if available)
    deviceMemory: navigator.deviceMemory || null,
    
    // Network information
    connectionType: navigator.connection ? navigator.connection.effectiveType : null,
    
    // Touch capability
    supportsTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
  };
  
  return capabilities;
};

/**
 * Get detailed device information including GPU
 */
const getGPUInfo = () => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return null;
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return null;
    
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    
    return {
      renderer,
      vendor,
      // Try to determine if it's integrated or dedicated
      isIntegrated: /Intel|integrated/i.test(renderer) || /Mali|Adreno|PowerVR/i.test(renderer)
    };
  } catch (e) {
    return null;
  }
};

/**
 * Classify device performance tier based on capabilities
 */
const classifyDevicePerformance = (capabilities, gpuInfo) => {
  let score = 0;
  
  // Base device type scoring - be more aggressive for mobile
  if (capabilities.isMobile && !capabilities.isTablet) {
    score += 0; // Mobile phones start at 0 (force low tier)
  } else if (capabilities.isTablet) {
    score += 1; // Tablets start low-medium
  } else {
    score += 3; // Desktop starts high
  }
  
  // CPU scoring
  if (capabilities.cpuCores >= 8) score += 2;
  else if (capabilities.cpuCores >= 4) score += 1;
  
  // Memory scoring (if available)
  if (capabilities.deviceMemory) {
    if (capabilities.deviceMemory >= 8) score += 2;
    else if (capabilities.deviceMemory >= 4) score += 1;
  }
  
  // GPU scoring
  if (gpuInfo) {
    if (!gpuInfo.isIntegrated) {
      score += 2; // Dedicated GPU
    }
    
    // Specific GPU detection for known high-performance chips
    const renderer = gpuInfo.renderer.toLowerCase();
    if (renderer.includes('rtx') || renderer.includes('gtx')) {
      score += 2; // NVIDIA gaming cards
    } else if (renderer.includes('radeon rx') || renderer.includes('vega')) {
      score += 2; // AMD gaming cards
    } else if (renderer.includes('apple m1') || renderer.includes('apple m2')) {
      score += 1; // Apple Silicon - good but not desktop level for 3D
    }
  }
  
  // WebGL 2 support
  if (capabilities.supportsWebGL2) {
    score += 1;
  }
  
  // Screen resolution penalty for very high DPI
  const totalPixels = capabilities.screenWidth * capabilities.screenHeight * capabilities.devicePixelRatio;
  if (totalPixels > 8000000) { // 4K+ screens
    score -= 2; // Higher resolution = much more work
  }
  
  // Device-specific overrides for known devices
  const userAgent = navigator.userAgent;
  
  // Force mobile devices to lower performance tiers
  if (capabilities.isMobile) {
    score = Math.min(score, 2); // Cap mobile devices at medium
  }
  
  // High-end mobile devices get small boost
  if (/iPhone1[4-9]|iPhone[2-9][0-9]/.test(userAgent)) {
    score += 0.5; // iPhone 14+ series - small boost
  }
  
  if (/iPad.*OS 1[5-9]/.test(userAgent)) {
    score += 0.5; // Recent iPads - small boost
  }
  
  // Classification - more conservative
  if (score >= 5) return 'high';
  if (score >= 2.5) return 'medium';
  return 'low';
};

/**
 * Get device category for UI responsive design
 */
const getDeviceCategory = (capabilities) => {
  if (capabilities.isMobile && !capabilities.isTablet) {
    return 'mobile';
  } else if (capabilities.isTablet) {
    return 'tablet';
  } else if (capabilities.screenWidth >= 2560) {
    return 'desktop-xl';
  } else {
    return 'desktop';
  }
};

/**
 * Main device detection function
 * Returns comprehensive device profile
 */
export const detectDevice = () => {
  const capabilities = detectDeviceCapabilities();
  const gpuInfo = getGPUInfo();
  const performanceTier = classifyDevicePerformance(capabilities, gpuInfo);
  const deviceCategory = getDeviceCategory(capabilities);
  
  const deviceProfile = {
    // Basic info
    category: deviceCategory,
    performanceTier,
    
    // Capabilities
    isMobile: capabilities.isMobile,
    isTablet: capabilities.isTablet,
    isTouch: capabilities.supportsTouch,
    supportsWebGL2: capabilities.supportsWebGL2,
    
    // Hardware
    cpuCores: capabilities.cpuCores,
    deviceMemory: capabilities.deviceMemory,
    gpu: gpuInfo,
    
    // Screen
    screen: {
      width: capabilities.screenWidth,
      height: capabilities.screenHeight,
      pixelRatio: capabilities.devicePixelRatio,
      orientation: capabilities.screenWidth > capabilities.screenHeight ? 'landscape' : 'portrait'
    },
    
    // Network
    connection: capabilities.connectionType,
    
    // Timestamps
    detectedAt: new Date().toISOString()
  };
  
  // Debug logging
  console.log('🔍 Device Detection Results:', deviceProfile);
  
  return deviceProfile;
};

/**
 * Simple device check functions for quick use
 */
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isTablet = () => {
  return /(iPad|Android(?!.*Mobile))/i.test(navigator.userAgent);
};

export const isDesktop = () => {
  return !isMobile();
};

/**
 * Force portrait orientation on mobile
 */
export const enforcePortraitOnMobile = () => {
  if (isMobile() && screen.orientation && screen.orientation.lock) {
    try {
      screen.orientation.lock('portrait');
    } catch (e) {
      console.warn('Could not lock orientation:', e);
    }
  }
};

/**
 * Get recommended render scale based on device
 */
export const getRecommendedRenderScale = (deviceProfile) => {
  switch (deviceProfile.performanceTier) {
    case 'high':
      return 1.0;
    case 'medium':
      return 0.8;
    case 'low':
    default:
      return 0.6;
  }
};