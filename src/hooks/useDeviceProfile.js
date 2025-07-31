// src/hooks/useDeviceProfile.js
// FIXED: Proper performance config handling and debugging

import { useState, useEffect, useCallback } from 'react';
import { detectDevice, enforcePortraitOnMobile } from '../utils/deviceDetection';
import { generateFingerprint } from '../utils/deviceFingerprint';
import { 
  getPerformanceProfile, 
  getUIProfile, 
  getHDRIPath,
  getCanvasDPR,
  logProfileInfo 
} from '../utils/deviceProfiles';

/**
 * FIXED: Custom hook for device detection and performance optimization
 */
const LOCAL_STORAGE_KEY = 'crystal-performance-config';

// Helper to roughly infer a performance tier from a performance configuration
export const inferPerformanceTierFromConfig = (cfg = {}) => {
  const renderScale = cfg.renderScale ?? 1;
  const pbrQuality = cfg.pbrQuality ?? 'high';
  const usePBR = cfg.usePBR !== undefined ? cfg.usePBR : true;

  if (renderScale >= 0.9 && usePBR && pbrQuality === 'high') {
    return 'high';
  }

  if (renderScale >= 0.7 && (usePBR || pbrQuality !== 'low')) {
    return 'medium';
  }

  if (renderScale >= 0.5) {
    return 'low';
  }

  return 'very-low';
};

export const useDeviceProfile = (options = {}) => {
  const {
    enableDebugLogging = false,
    enableOrientationLock = true,
    enableProfileOverride = true,
    resetCachedSettings = false,
    forceRetest = false,
    appVersion = null
  } = options;
  
  // State for device and profile information
  const [deviceProfile, setDeviceProfile] = useState(null);
  const [performanceProfile, setPerformanceProfile] = useState(null);
  const [uiProfile, setUIProfile] = useState(null);
  const [isDetecting, setIsDetecting] = useState(true);
  const [manualOverride, setManualOverride] = useState(null);
  const [fingerprint, setFingerprint] = useState(null);
  
  // FIXED: Track external performance config separately
  const [externalPerformanceConfig, setExternalPerformanceConfig] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Generate device fingerprint once
  useEffect(() => {
    generateFingerprint().then(setFingerprint);
  }, []);
  
  // Detection function
  const detectDeviceProfile = useCallback(async () => {
    setIsDetecting(true);
    
    try {
      // Detect device capabilities
      const device = detectDevice();
      
      // Get appropriate profiles
      let performance = getPerformanceProfile(device);
      const ui = getUIProfile(device);

      const cacheKey = fingerprint ? `${LOCAL_STORAGE_KEY}:${fingerprint}` : LOCAL_STORAGE_KEY;
      if (resetCachedSettings || forceRetest) {
        localStorage.removeItem(cacheKey);
      } else if (cacheKey) {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
          try {
            const cachedObj = JSON.parse(stored);
            const versionMatch = !appVersion || cachedObj.version === appVersion;
            if (versionMatch) {
              const cachedCfg = cachedObj.config || cachedObj;
              performance = { ...performance, ...cachedCfg };
              if (cachedObj.tier) {
                device.performanceTier = cachedObj.tier;
              }
              if (import.meta.env.DEV) {
                console.log('🔄 Applying cached performance config:', cachedCfg);
              }
            } else {
              localStorage.removeItem(cacheKey);
            }
          } catch (err) {
            if (import.meta.env.DEV) {
              console.error('Failed to parse cached performance config', err);
            }
          }
        }
      }
      
      // Apply orientation lock if needed
      if (enableOrientationLock && device.category === 'mobile') {
        enforcePortraitOnMobile();
      }
      
      // Update state
      setDeviceProfile(device);
      setPerformanceProfile(performance);
      setUIProfile(ui);
      
      // Debug logging
      if (enableDebugLogging || window.__PERF_DEBUG__) {
        const profileKey = `${device.category}-${device.performanceTier}`;
        if (detectDeviceProfile.lastProfileKey !== profileKey) {
          logProfileInfo(device, performance, ui);
          detectDeviceProfile.lastProfileKey = profileKey;
        }
      }
      
      if (import.meta.env.DEV) console.log('🎯 Device Profile Applied:', {
        category: device.category,
        performanceTier: device.performanceTier,
        pbrQuality: performance.pbrQuality,
        useNormalMaps: performance.useNormalMaps,
        textureQuality: performance.textureQuality,
        renderScale: performance.renderScale
      });
      
    } catch (error) {
      if (import.meta.env.DEV) console.error('❌ Device detection failed:', error);
      
      // Fallback to safe defaults
      const fallbackDevice = {
        category: 'desktop',
        performanceTier: 'medium',
        isMobile: false,
        isTablet: false,
        isTouch: false
      };
      
      setDeviceProfile(fallbackDevice);
      setPerformanceProfile(getPerformanceProfile(fallbackDevice));
      setUIProfile(getUIProfile(fallbackDevice));
    } finally {
      setIsDetecting(false);
    }
  }, [enableDebugLogging, enableOrientationLock, resetCachedSettings, fingerprint, forceRetest, appVersion]);
  
  // Initial detection on mount
  useEffect(() => {
    if (fingerprint !== null) {
      detectDeviceProfile();
    }
  }, [detectDeviceProfile, fingerprint]);
  
  // FIXED: Separate external config update function with proper initialization check
  const updateExternalPerformanceConfig = useCallback((config, force = false) => {
    if (import.meta.env.DEV) console.log('🔧 External performance config update attempted:', config);
    if (import.meta.env.DEV) console.log('🔧 Has initialized?', hasInitialized);
    if (import.meta.env.DEV) console.log('🔧 Current external config:', externalPerformanceConfig);
    
    // Allow external config updates once initialized or when forced
    if ((hasInitialized || force) && config && typeof config === 'object') {
      // Check if this is actually different from the current performance profile
      const currentProfile = manualOverride?.performance || performanceProfile;
      
      if (currentProfile) {
        const hasChanges =
          config.pbrQuality !== currentProfile.pbrQuality ||
          config.useNormalMaps !== currentProfile.useNormalMaps ||
          config.textureQuality !== currentProfile.textureQuality ||
          config.renderScale !== currentProfile.renderScale;
        
        if (hasChanges) {
          if (import.meta.env.DEV) console.log('✅ Applying external performance config changes:', {
            from: {
              pbrQuality: currentProfile.pbrQuality,
              useNormalMaps: currentProfile.useNormalMaps,
              textureQuality: currentProfile.textureQuality,
              renderScale: currentProfile.renderScale
            },
            to: {
              pbrQuality: config.pbrQuality,
              useNormalMaps: config.useNormalMaps,
              textureQuality: config.textureQuality,
              renderScale: config.renderScale
            }
          });
          setExternalPerformanceConfig(config);

          const inferredTier = inferPerformanceTierFromConfig(config);
          if (deviceProfile && deviceProfile.performanceTier !== inferredTier) {
            setDeviceProfile(prev => ({ ...prev, performanceTier: inferredTier }));
          }

          try {
            const cacheKey = fingerprint ? `${LOCAL_STORAGE_KEY}:${fingerprint}` : LOCAL_STORAGE_KEY;
            if (cacheKey) {
              localStorage.setItem(
                cacheKey,
                JSON.stringify({ version: appVersion, config, tier: inferredTier })
              );
            }
          } catch (err) {
            if (import.meta.env.DEV) console.error('Failed to save performance config:', err);
          }
        } else {
          if (import.meta.env.DEV) console.log('🚫 External config is same as current profile, ignoring');
        }
      }
    } else {
      if (import.meta.env.DEV) console.log('🚫 External config update rejected - not initialized (and not forced) or invalid config');
    }
  }, [hasInitialized, performanceProfile, manualOverride, fingerprint, appVersion, deviceProfile]);
  
  // FIXED: Mark as initialized only after initial performance test is complete
  const markAsInitialized = useCallback(() => {
    if (import.meta.env.DEV) console.log('✅ Device profile marked as initialized');
    setHasInitialized(true);
  }, []);
  
  // Listen for orientation/resize changes
  useEffect(() => {
    const handleResize = () => {
      if (deviceProfile) {
        const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
        
        if (newOrientation !== deviceProfile.screen.orientation) {
          if (import.meta.env.DEV) console.log('Orientation changed, re-detecting device profile...');
          setTimeout(() => {
            detectDeviceProfile();
          }, 500);
        }
      }
    };
    
    let resizeTimeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 250);
    };
    
    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', debouncedResize);
    
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', debouncedResize);
    };
  }, [deviceProfile?.screen?.orientation, detectDeviceProfile]);
  
  // Manual override function for development/testing
  const overrideProfile = useCallback((tier) => {
    if (!enableProfileOverride) return;
    
    if (tier === null) {
      setManualOverride(null);
      return;
    }
    
    const overrideDevice = {
      ...deviceProfile,
      performanceTier: tier
    };
    
    const overridePerformance = getPerformanceProfile(overrideDevice);
    
    setManualOverride({ tier, performance: overridePerformance });
    
    if (enableDebugLogging || window.__PERF_DEBUG__) {
      if (import.meta.env.DEV || window.__PERF_DEBUG__) console.log('🔧 Manual override applied:', tier, overridePerformance);
    }
  }, [deviceProfile, enableProfileOverride, enableDebugLogging]);
  
  // Get current effective profiles (with proper precedence)
  const currentDeviceProfile = manualOverride ? 
    { ...deviceProfile, performanceTier: manualOverride.tier } : 
    deviceProfile;
  
  // FIXED: Proper precedence for performance config
  // 1. External config (user changes via Performance tab) - highest priority
  // 2. Manual override (dev tools)
  // 3. Initial performance profile (device detection + performance test)
  const effectivePerformanceConfig = externalPerformanceConfig || 
                                   manualOverride?.performance || 
                                   performanceProfile;
  
  // FIXED: Add debug logging when effective config changes
  useEffect(() => {
    if (effectivePerformanceConfig && hasInitialized) {
      if (import.meta.env.DEV) console.log('🎮 Effective Performance Config Applied:', {
        source: externalPerformanceConfig ? 'External Config' : 
                manualOverride ? 'Manual Override' : 
                'Device Profile',
        pbrQuality: effectivePerformanceConfig.pbrQuality,
        useNormalMaps: effectivePerformanceConfig.useNormalMaps,
        textureQuality: effectivePerformanceConfig.textureQuality,
        renderScale: effectivePerformanceConfig.renderScale
      });
    }
  }, [effectivePerformanceConfig?.pbrQuality, effectivePerformanceConfig?.useNormalMaps,
      effectivePerformanceConfig?.textureQuality, effectivePerformanceConfig?.renderScale,
      hasInitialized, externalPerformanceConfig, manualOverride]);
  
  // Utility functions
  const getOptimalCanvasProps = useCallback(() => {
    if (!currentDeviceProfile || !effectivePerformanceConfig) return {};
    
    const baseDPR = getCanvasDPR(currentDeviceProfile, effectivePerformanceConfig);
    const renderScale = effectivePerformanceConfig.renderScale || 1.0;
    const scaledDPR = baseDPR.map(dpr => dpr * renderScale);
    
    if (import.meta.env.DEV) console.log(`🎮 Canvas - Render Scale: ${renderScale}, DPR: [${scaledDPR.join(', ')}]`);
    
    return {
      dpr: scaledDPR,
      gl: {
        antialias: effectivePerformanceConfig.antialiasing || false,
        alpha: false,
        powerPreference: currentDeviceProfile.performanceTier === 'high' ? 'high-performance' : 'low-power',
        precision: currentDeviceProfile.isMobile ? 'mediump' : 'highp'
      }
    };
  }, [currentDeviceProfile, effectivePerformanceConfig]);
  
  const getOptimalEnvironmentProps = useCallback(() => {
    if (!effectivePerformanceConfig) return {};
    
    const textureQuality = effectivePerformanceConfig.textureQuality || 'high';
    const hdriPath = getHDRIPath(textureQuality);
    
    return {
      files: hdriPath,
      environmentIntensity: effectivePerformanceConfig.renderScale || 1.0
    };
  }, [effectivePerformanceConfig]);
  
  const shouldShowEffect = useCallback((effectName) => {
    if (!effectivePerformanceConfig) return false;
    return effectivePerformanceConfig.postProcessing[effectName] || false;
  }, [effectivePerformanceConfig]);
  
  const getTextureQuality = useCallback(() => {
    return effectivePerformanceConfig?.textureQuality || 'high';
  }, [effectivePerformanceConfig]);
  
  // Performance monitoring utilities
  const isHighPerformance = currentDeviceProfile?.performanceTier === 'high';
  const isMobileDevice = currentDeviceProfile?.isMobile || false;
  const isLowEndDevice = ['low', 'very-low'].includes(currentDeviceProfile?.performanceTier);
  
  return {
    // Profile information
    deviceProfile: currentDeviceProfile,
    performanceProfile: effectivePerformanceConfig,
    uiProfile,
    isDetecting,
    
    // Initialization tracking
    hasInitialized,
    markAsInitialized,
    
    // Manual override (for development)
    manualOverride: manualOverride?.tier || null,
    overrideProfile,
    
    // External config update (for Performance tab)
    updateExternalPerformanceConfig,
    
    // Debug info
    debugInfo: {
      externalConfigActive: !!externalPerformanceConfig,
      manualOverrideActive: !!manualOverride,
      currentSource: externalPerformanceConfig ? 'external' :
                    manualOverride ? 'override' : 'profile'
    },

    fingerprint,
    
    // Utility functions
    getOptimalCanvasProps,
    getOptimalEnvironmentProps,
    shouldShowEffect,
    getTextureQuality,
    
    // Quick access properties
    isHighPerformance,
    isMobileDevice,
    isLowEndDevice,
    
    // Actions
    redetect: detectDeviceProfile
  };
};