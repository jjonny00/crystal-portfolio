// src/utils/deviceDetection.js
// FIXED: Enhanced device detection that properly classifies high-end devices

/**
 * Enhanced Device Detection with proper high-end device classification
 */

// Known high-performance devices (add more as needed)
const HIGH_PERFORMANCE_DEVICES = {
  // iPhone models (recent high-end)
  iphones: [
    'iPhone15,2', 'iPhone15,3', 'iPhone15,4', 'iPhone15,5', // iPhone 14 series
    'iPhone16,1', 'iPhone16,2', // iPhone 15 series
    'iPhone14,2', 'iPhone14,3', 'iPhone14,4', 'iPhone14,5', // iPhone 13 series
  ],
  
  // iPad models (Pro and recent Air)
  ipads: [
    'iPad14,1', 'iPad14,2', // iPad Pro M2 12.9"
    'iPad14,3', 'iPad14,4', // iPad Pro M2 11"
    'iPad13,16', 'iPad13,17', // iPad Air M1
    'iPad13,1', 'iPad13,2', // iPad Pro M1 12.9"
    'iPad13,4', 'iPad13,5', 'iPad13,6', 'iPad13,7', // iPad Pro M1 11"
  ],
  
  // Android flagships (add specific models)
  android: [
    'SM-G998', 'SM-G996', 'SM-G991', // Samsung Galaxy S21 series
    'SM-G988', 'SM-G985', 'SM-G981', // Samsung Galaxy S20 series
    'Pixel 7', 'Pixel 6', 'Pixel 5', // Google Pixel
  ]
};

/**
 * Get device model identifier
 */
const getDeviceModel = () => {
  const userAgent = navigator.userAgent;
  
  // iOS device detection
  if (/iPhone|iPad/.test(userAgent)) {
    // Try to get actual model from user agent
    const modelMatch = userAgent.match(/iPhone(\d+,\d+)|iPad(\d+,\d+)/);
    if (modelMatch) {
      return modelMatch[0];
    }
    
    // Fallback to OS version for rough classification
    const osMatch = userAgent.match(/OS (\d+)_/);
    if (osMatch) {
      const osVersion = parseInt(osMatch[1]);
      // iOS 15+ usually means recent hardware
      return osVersion >= 15 ? 'iOS_Modern' : 'iOS_Legacy';
    }
  }
  
  // Android device detection
  if (/Android/.test(userAgent)) {
    // Try to extract model
    const modelMatch = userAgent.match(/;\s*([^;]+)\s+Build/);
    if (modelMatch) {
      return modelMatch[1];
    }
  }
  
  return 'Unknown';
};

/**
 * Enhanced GPU detection with better classification
 */
const getEnhancedGPUInfo = () => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return null;
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return null;
    
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    
    // Enhanced GPU classification
    const gpuInfo = {
      renderer,
      vendor,
      tier: 'unknown'
    };
    
    const rendererLower = renderer.toLowerCase();
    
    // High-end desktop GPUs
    if (/rtx\s*40\d0|rtx\s*30\d0|rtx\s*20\d0/.test(rendererLower)) {
      gpuInfo.tier = 'desktop-high';
    } else if (/gtx\s*10\d0|gtx\s*9\d0|rx\s*6\d00|rx\s*5\d00/.test(rendererLower)) {
      gpuInfo.tier = 'desktop-medium';
    }
    // Apple Silicon (M1/M2)
    else if (/apple\s*m[12]|apple.*gpu/i.test(rendererLower)) {
      gpuInfo.tier = 'apple-silicon';
    }
    // Modern mobile GPUs
    else if (/adreno\s*7\d0|adreno\s*6\d0/.test(rendererLower)) {
      gpuInfo.tier = 'mobile-high';
    } else if (/adreno\s*5\d0|mali.*g7\d|mali.*g9\d/.test(rendererLower)) {
      gpuInfo.tier = 'mobile-medium';
    }
    // Intel integrated (newer)
    else if (/iris.*xe|uhd.*6\d0|uhd.*7\d0/.test(rendererLower)) {
      gpuInfo.tier = 'integrated-modern';
    }
    // Older integrated
    else if (/intel|hd.*graphics|uhd.*graphics/i.test(rendererLower)) {
      gpuInfo.tier = 'integrated-old';
    }
    // Unknown mobile
    else if (/mali|adreno|powervr/i.test(rendererLower)) {
      gpuInfo.tier = 'mobile-unknown';
    }
    
    return gpuInfo;
  } catch (e) {
    return null;
  }
};

/**
 * Enhanced device capabilities detection
 */
const detectEnhancedCapabilities = () => {
  const capabilities = {
    // Basic device info
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isTablet: /(iPad|Android(?!.*Mobile))/i.test(navigator.userAgent),
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: /Android/i.test(navigator.userAgent),
    
    // Enhanced iPad detection
    isIPad: /iPad/.test(navigator.userAgent) || 
             (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    
    // Screen information
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio || 1,
    
    // Hardware info
    cpuCores: navigator.hardwareConcurrency || 2,
    deviceMemory: navigator.deviceMemory || null,
    
    // Device model
    deviceModel: getDeviceModel(),
    
    // Browser capabilities
    supportsWebGL2: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl2'));
      } catch (e) {
        return false;
      }
    })(),
    
    // Network
    connectionType: navigator.connection ? navigator.connection.effectiveType : null,
    
    // Touch capability
    supportsTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    
    // Performance hints
    estimatedRAM: (() => {
      // Estimate RAM based on available clues
      if (navigator.deviceMemory) return navigator.deviceMemory;
      
      // Use screen resolution and device type as proxy
      const totalPixels = window.screen.width * window.screen.height;
      if (totalPixels > 2073600) return 8; // 1920x1080+ suggests 8GB+
      if (totalPixels > 921600) return 4;  // 1280x720+ suggests 4GB+
      return 2; // Default to 2GB
    })()
  };
  
  return capabilities;
};

/**
 * FIXED: Enhanced performance classification
 */
const classifyEnhancedPerformance = (capabilities, gpuInfo) => {
  const deviceModel = capabilities.deviceModel;
  
  // Check if it's a known high-performance device
  const isHighPerformanceDevice = 
    HIGH_PERFORMANCE_DEVICES.iphones.some(model => deviceModel.includes(model)) ||
    HIGH_PERFORMANCE_DEVICES.ipads.some(model => deviceModel.includes(model)) ||
    HIGH_PERFORMANCE_DEVICES.android.some(model => deviceModel.includes(model));
  
  if (isHighPerformanceDevice) {
    if (import.meta.env.DEV) console.log(`🚀 High-performance device detected: ${deviceModel}`);
    return 'high';
  }
  
  // Modern iOS devices (iOS 15+ with good hardware indicators)
  if (capabilities.isIOS && deviceModel === 'iOS_Modern' && capabilities.cpuCores >= 6) {
    return 'high';
  }
  
  // iPad Pro detection (M1/M2 chips)
  if (capabilities.isIPad && gpuInfo?.tier === 'apple-silicon') {
    if (import.meta.env.DEV) console.log('🍎 iPad with Apple Silicon detected - HIGH tier');
    return 'high';
  }
  
  // Recent iPads with good specs
  if (capabilities.isIPad && capabilities.cpuCores >= 6 && capabilities.estimatedRAM >= 4) {
    if (import.meta.env.DEV) console.log('🍎 High-spec iPad detected - HIGH tier');
    return 'high';
  }
  
  // Desktop classification
  if (!capabilities.isMobile && !capabilities.isTablet) {
    // High-end desktop
    if (gpuInfo?.tier === 'desktop-high' || 
        (capabilities.cpuCores >= 8 && capabilities.estimatedRAM >= 16)) {
      return 'high';
    }
    
    // Medium desktop
    if (gpuInfo?.tier === 'desktop-medium' || 
        gpuInfo?.tier === 'integrated-modern' ||
        (capabilities.cpuCores >= 4 && capabilities.estimatedRAM >= 8)) {
      return 'medium';
    }
    
    // Low-end desktop
    return 'low';
  }
  
  // Mobile/tablet classification with better differentiation
  if (capabilities.isMobile || capabilities.isTablet) {
    // High-end mobile (flagship phones, iPad Pro)
    if (gpuInfo?.tier === 'mobile-high' || 
        gpuInfo?.tier === 'apple-silicon' ||
        (capabilities.cpuCores >= 6 && capabilities.estimatedRAM >= 6)) {
      return 'high';
    }
    
    // Mid-range mobile
    if (gpuInfo?.tier === 'mobile-medium' ||
        (capabilities.cpuCores >= 4 && capabilities.estimatedRAM >= 4)) {
      return 'medium';
    }
    
    // Low-end mobile
    return 'low';
  }
  
  return 'low';
};

/**
 * Main enhanced device detection
 */
export const detectDevice = () => {
  const capabilities = detectEnhancedCapabilities();
  const gpuInfo = getEnhancedGPUInfo();
  const performanceTier = classifyEnhancedPerformance(capabilities, gpuInfo);
  
  // Device category
  let category = 'desktop';
  if (capabilities.isIPad) {
    category = 'tablet';
  } else if (capabilities.isMobile && !capabilities.isTablet) {
    category = 'mobile';
  } else if (capabilities.isTablet) {
    category = 'tablet';
  } else if (capabilities.screenWidth >= 2560) {
    category = 'desktop-xl';
  }
  
  const deviceProfile = {
    // Basic info
    category,
    performanceTier,
    
    // Capabilities
    isMobile: capabilities.isMobile,
    isTablet: capabilities.isTablet,
    isIPad: capabilities.isIPad,
    isTouch: capabilities.supportsTouch,
    supportsWebGL2: capabilities.supportsWebGL2,
    
    // Hardware
    cpuCores: capabilities.cpuCores,
    deviceMemory: capabilities.deviceMemory,
    estimatedRAM: capabilities.estimatedRAM,
    deviceModel: capabilities.deviceModel,
    gpu: gpuInfo,
    
    // Screen
    screen: {
      width: capabilities.screenWidth,
      height: capabilities.screenHeight,
      pixelRatio: capabilities.devicePixelRatio,
      orientation: capabilities.screenWidth > capabilities.screenHeight ? 'landscape' : 'portrait',
      totalPixels: capabilities.screenWidth * capabilities.screenHeight * capabilities.devicePixelRatio
    },
    
    // Network
    connection: capabilities.connectionType,
    
    // Timestamps
    detectedAt: new Date().toISOString()
  };
  
  if (import.meta.env.DEV) console.log('🔍 Enhanced Device Detection Results:', {
    model: deviceProfile.deviceModel,
    category: deviceProfile.category,
    tier: deviceProfile.performanceTier,
    gpu: gpuInfo?.tier,
    cores: deviceProfile.cpuCores,
    ram: deviceProfile.estimatedRAM
  });
  
  return deviceProfile;
};

// Re-export utility functions
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isTablet = () => {
  return /(iPad|Android(?!.*Mobile))/i.test(navigator.userAgent);
};

export const isDesktop = () => {
  return !isMobile();
};

export const enforcePortraitOnMobile = () => {
  if (isMobile() && screen.orientation && screen.orientation.lock) {
    try {
      screen.orientation.lock('portrait');
    } catch (e) {
      if (import.meta.env.DEV) console.warn('Could not lock orientation:', e);
    }
  }
};

export const getRecommendedRenderScale = (deviceProfile) => {
  switch (deviceProfile.performanceTier) {
    case 'high':
      return deviceProfile.isMobile ? 0.9 : 1.0; // Slightly reduced for mobile even if high-end
    case 'medium':
      return deviceProfile.isMobile ? 0.7 : 0.8;
    case 'low':
    default:
      return deviceProfile.isMobile ? 0.5 : 0.6;
  }
};