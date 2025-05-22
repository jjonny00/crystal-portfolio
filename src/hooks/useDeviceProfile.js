// src/hooks/useDeviceProfile.js
// React hook for device detection and performance profiling

import { useState, useEffect, useCallback } from 'react';
import { detectDevice, enforcePortraitOnMobile } from '../utils/deviceDetection';
import { 
  getPerformanceProfile, 
  getUIProfile, 
  getHDRIPath,
  getCanvasDPR,
  logProfileInfo 
} from '../utils/deviceProfiles';

/**
 * Custom hook for device detection and performance optimization
 * Provides device info, performance settings, and UI configuration
 */
export const useDeviceProfile = (options = {}) => {
  const {
    enableDebugLogging = false,
    enableOrientationLock = true,
    enableProfileOverride = true // Allow manual override in development
  } = options;
  
  // State for device and profile information
  const [deviceProfile, setDeviceProfile] = useState(null);
  const [performanceProfile, setPerformanceProfile] = useState(null);
  const [uiProfile, setUIProfile] = useState(null);
  const [isDetecting, setIsDetecting] = useState(true);
  const [manualOverride, setManualOverride] = useState(null);
  
  // Detection function
  const detectDeviceProfile = useCallback(async () => {
    setIsDetecting(true);
    
    try {
      // Detect device capabilities
      const device = detectDevice();
      
      // Get appropriate profiles
      const performance = getPerformanceProfile(device);
      const ui = getUIProfile(device);
      
      // Apply orientation lock if needed
      if (enableOrientationLock && device.category === 'mobile') {
        enforcePortraitOnMobile();
      }
      
      // Update state
      setDeviceProfile(device);
      setPerformanceProfile(performance);
      setUIProfile(ui);
      
      // Debug logging - only log when profile actually changes
      if (enableDebugLogging) {
        const profileKey = `${device.category}-${device.performanceTier}`;
        if (detectDeviceProfile.lastProfileKey !== profileKey) {
          logProfileInfo(device, performance, ui);
          detectDeviceProfile.lastProfileKey = profileKey;
        }
      }
      
    } catch (error) {
      console.error('❌ Device detection failed:', error);
      
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
  }, [enableDebugLogging, enableOrientationLock]);
  
  // Initial detection on mount
  useEffect(() => {
    detectDeviceProfile();
  }, [detectDeviceProfile]);
  
  // Listen for orientation/resize changes
  useEffect(() => {
    const handleResize = () => {
      // Only re-detect on significant changes and with debouncing
      if (deviceProfile) {
        const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
        
        // Only re-detect if orientation actually changed
        if (newOrientation !== deviceProfile.screen.orientation) {
          console.log('Orientation changed, re-detecting device profile...');
          // Debounce the detection to avoid rapid calls
          setTimeout(() => {
            detectDeviceProfile();
          }, 500);
        }
      }
    };
    
    // Debounce resize events
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
    
    if (enableDebugLogging) {
      console.log('🔧 Manual override applied:', tier, overridePerformance);
    }
  }, [deviceProfile, enableProfileOverride, enableDebugLogging]);
  
  // Get current effective profiles (with override support)
  const currentPerformanceProfile = manualOverride?.performance || performanceProfile;
  const currentDeviceProfile = manualOverride ? 
    { ...deviceProfile, performanceTier: manualOverride.tier } : 
    deviceProfile;
  
  // Allow external performance config to override profile settings
  // This enables the Performance tab controls to affect the environment
  const [externalPerformanceConfig, setExternalPerformanceConfig] = useState(null);
  
  const updateExternalPerformanceConfig = useCallback((config) => {
    setExternalPerformanceConfig(config);
  }, []);
  
  // Get effective performance config (external override or profile)
  const effectivePerformanceConfig = externalPerformanceConfig || currentPerformanceProfile;
  
  // Utility functions
  const getOptimalCanvasProps = useCallback(() => {
    if (!currentDeviceProfile || !effectivePerformanceConfig) return {};
    
    // Calculate DPR based on render scale and device capabilities
    const baseDPR = getCanvasDPR(currentDeviceProfile, effectivePerformanceConfig);
    const renderScale = effectivePerformanceConfig.renderScale || 1.0;
    
    // Apply render scale to DPR for performance
    const scaledDPR = baseDPR.map(dpr => dpr * renderScale);
    
    console.log(`🎮 Canvas - Render Scale: ${renderScale}, DPR: [${scaledDPR.join(', ')}]`);
    
    return {
      dpr: scaledDPR,
      gl: {
        antialias: effectivePerformanceConfig.antialiasing || false,
        alpha: false, // Opaque background for better performance
        powerPreference: currentDeviceProfile.performanceTier === 'high' ? 'high-performance' : 'low-power',
        // Force lower precision on mobile
        precision: currentDeviceProfile.isMobile ? 'mediump' : 'highp'
      }
    };
  }, [currentDeviceProfile, effectivePerformanceConfig]);
  
  const getOptimalEnvironmentProps = useCallback(() => {
    if (!effectivePerformanceConfig) return {};
    
    // Use the current texture quality setting for HDRI quality
    const textureQuality = effectivePerformanceConfig.textureQuality || 'high';
    const hdriPath = getHDRIPath(textureQuality);
    
    return {
      files: hdriPath,
      // Scale down environment intensity on lower-end devices
      environmentIntensity: effectivePerformanceConfig.renderScale || 1.0
    };
  }, [effectivePerformanceConfig]);
  
  // ADD THIS: Debug logging for performance config changes
  useEffect(() => {
    if (effectivePerformanceConfig) {
      console.log(`🎯 Performance Config Updated:`, {
        usePBR: effectivePerformanceConfig.usePBR,
        useNormalMaps: effectivePerformanceConfig.useNormalMaps,
        textureQuality: effectivePerformanceConfig.textureQuality,
        renderScale: effectivePerformanceConfig.renderScale
      });
    }
  }, [effectivePerformanceConfig?.usePBR, effectivePerformanceConfig?.useNormalMaps, effectivePerformanceConfig?.textureQuality, effectivePerformanceConfig?.renderScale]);
  
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
  const isLowEndDevice = currentDeviceProfile?.performanceTier === 'low';
  
  return {
    // Profile information
    deviceProfile: currentDeviceProfile,
    performanceProfile: effectivePerformanceConfig,
    uiProfile,
    isDetecting,
    
    // Manual override (for development)
    manualOverride: manualOverride?.tier || null,
    overrideProfile,
    
    // External config update (for Performance tab)
    updateExternalPerformanceConfig,
    
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

/**
 * Simple hook for just getting current performance settings
 * Useful when you only need the performance config
 */
export const usePerformanceSettings = () => {
  const { performanceProfile, isDetecting } = useDeviceProfile();
  
  return {
    settings: performanceProfile,
    isLoading: isDetecting
  };
};

/**
 * Hook for responsive UI settings
 */
export const useUISettings = () => {
  const { uiProfile, deviceProfile, isDetecting } = useDeviceProfile();
  
  return {
    ui: uiProfile,
    device: deviceProfile,
    isLoading: isDetecting
  };
};