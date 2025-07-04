// src/hooks/useInitialPerformanceTest.js
// FIXED: Conservative performance test that respects device profiles

import { useState, useEffect, useRef, useCallback } from 'react';
import { useFPSMonitorDOM } from '../components/ui/FpsDisplay';
import { getPerformanceProfile } from '../utils/deviceProfiles';

/**
 * FIXED: Conservative performance test that only adjusts for genuinely poor performance
 * Respects device profiles and only downgrades when FPS is actually problematic
 */
export const useInitialPerformanceTest = (
  deviceProfile,
  { duration = 5000, autoStart = true, onComplete } = {}
) => {
  const { avgFps } = useFPSMonitorDOM();
  const [performanceConfig, setPerformanceConfig] = useState(null);
  const [testing, setTesting] = useState(autoStart);
  const startRef = useRef(null);
  const timeoutRef = useRef(null);
  
  const finalizeTest = useCallback(() => {
    const elapsed = performance.now() - (startRef.current || 0);
    
    console.log(`🔬 Performance Test Results:`, {
      avgFps: avgFps.toFixed(1),
      elapsed: Math.round(elapsed),
      deviceCategory: deviceProfile?.category,
      deviceTier: deviceProfile?.performanceTier
    });
    
    // FIXED: Start with device profile as baseline (not override it)
    const baseProfile = getPerformanceProfile(deviceProfile);
    let finalConfig = { ...baseProfile };
    
    // FIXED: Only make adjustments for genuinely poor performance
    if (avgFps < 15) {
      // Severe performance issues - apply aggressive optimizations
      console.log(`⬇️ Severe performance detected (${avgFps.toFixed(1)} fps) - applying aggressive optimizations`);
      
      finalConfig = {
        ...finalConfig,
        usePBR: false,                    // Disable PBR entirely
        useNormalMaps: false,             // Disable normal maps
        textureQuality: 'low',            // Lowest texture quality
        renderScale: Math.min(finalConfig.renderScale * 0.7, 0.6), // Reduce render scale
        postProcessing: {
          bloom: false,
          chromaticAberration: false,
          noise: true,                    // Keep cheap noise
          vignette: true                  // Keep cheap vignette
        }
      };
      
    } else if (avgFps >= 15 && avgFps < 25) {
      // Moderate performance issues - apply minor optimizations
      console.log(`⚠️ Moderate performance detected (${avgFps.toFixed(1)} fps) - applying minor optimizations`);
      
      // Only adjust post-processing, keep PBR and normal maps
      finalConfig = {
        ...finalConfig,
        postProcessing: {
          ...finalConfig.postProcessing,
          bloom: false,                   // Disable expensive bloom
          chromaticAberration: false      // Disable chromatic aberration
          // Keep noise and vignette - they're cheap
        }
      };
      
    } else {
      // Good performance (25+ fps) - keep device profile unchanged
      console.log(`✅ Good performance detected (${avgFps.toFixed(1)} fps) - keeping device profile settings`);
      // finalConfig already equals baseProfile, no changes needed
    }
    
    console.log(`🎯 Final Performance Config:`, {
      source: avgFps < 15 ? 'Aggressive Optimization' : 
              avgFps < 25 ? 'Minor Optimization' : 
              'Device Profile (Unchanged)',
      originalTier: deviceProfile?.performanceTier,
      usePBR: finalConfig.usePBR,
      useNormalMaps: finalConfig.useNormalMaps,
      textureQuality: finalConfig.textureQuality,
      renderScale: finalConfig.renderScale
    });
    
    setPerformanceConfig(finalConfig);
    setTesting(false);
    
    if (onComplete) onComplete(finalConfig);
    
    console.log(`✅ Performance test completed in ${Math.round(elapsed)}ms`);
  }, [avgFps, deviceProfile, onComplete]);

  const startTest = useCallback(() => {
    startRef.current = performance.now();
    console.log(`🔬 Starting conservative performance test (${duration}ms)...`);
    console.log(`📱 Device baseline:`, {
      category: deviceProfile?.category,
      tier: deviceProfile?.performanceTier,
      isMobile: deviceProfile?.isMobile
    });
    
    setTesting(true);
    setPerformanceConfig(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(finalizeTest, duration);
  }, [duration, finalizeTest, deviceProfile]);

  // Auto-start effect
  useEffect(() => {
    if (deviceProfile && autoStart && startRef.current === null) {
      startTest();
    }
  }, [deviceProfile, autoStart, startTest]);

  // Timeout completion check
  useEffect(() => {
    if (!deviceProfile || !testing) return;

    if (startRef.current === null) {
      startRef.current = performance.now();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(finalizeTest, duration);
    }

    if (performance.now() - startRef.current >= duration) {
      finalizeTest();
    }
  }, [avgFps, deviceProfile, duration, testing, finalizeTest]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { 
    performanceConfig, 
    isTesting: testing, 
    startTest 
  };
};