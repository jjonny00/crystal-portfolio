// src/hooks/useInitialPerformanceTest.js
// FIXED: Smart performance test that works with device profiles intelligently

import { useState, useEffect, useRef, useCallback } from 'react';
import { useFPSMonitorDOM } from '../components/ui/FpsDisplay';
import { getPerformanceProfile } from '../utils/deviceProfiles';

/**
 * SMART Performance Test System
 * 
 * Strategy:
 * 1. Start with device profile as baseline (don't override good devices)
 * 2. Only adjust if ACTUAL performance is problematic
 * 3. Use shorter test duration for faster startup
 * 4. Respect device capabilities - don't downgrade high-end unnecessarily
 */
export const useInitialPerformanceTest = (
  deviceProfile,
  { duration = 3000, autoStart = true, onComplete } = {}
) => {
  const { avgFps, fps } = useFPSMonitorDOM();
  const [performanceConfig, setPerformanceConfig] = useState(null);
  const [testing, setTesting] = useState(autoStart);
  const startRef = useRef(null);
  const timeoutRef = useRef(null);
  const fpsSamples = useRef([]);
  
  /**
   * Smart performance analysis based on device profile + actual FPS
   */
  const analyzePerformance = useCallback(() => {
    const samples = fpsSamples.current;
    if (samples.length === 0) return null;
    
    // Calculate performance metrics
    const avgFps = samples.reduce((a, b) => a + b, 0) / samples.length;
    const minFps = Math.min(...samples);
    const maxFps = Math.max(...samples);
    const fps90thPercentile = samples.sort((a, b) => a - b)[Math.floor(samples.length * 0.1)]; // 10th percentile (worst 10%)
    
    return {
      avgFps: Math.round(avgFps),
      minFps: Math.round(minFps),
      maxFps: Math.round(maxFps),
      lowPercentile: Math.round(fps90thPercentile),
      stability: Math.round(((maxFps - minFps) / avgFps) * 100), // Lower is more stable
      sampleCount: samples.length
    };
  }, []);

  /**
   * FIXED: More aggressive performance standards for mobile devices
   */
  const shouldAdjustPerformance = useCallback((metrics, deviceProfile) => {
    if (!metrics) return false;
    
    // FIXED: More realistic targets for mobile devices
    const targets = {
      'desktop': { min: 45, avg: 55, stability: 50 },
      'desktop-xl': { min: 50, avg: 60, stability: 40 },
      'tablet': { min: 20, avg: 25, stability: 80 },     // More lenient for tablets
      'mobile': { min: 15, avg: 20, stability: 100 }     // More lenient for mobile
    };
    
    const target = targets[deviceProfile.category] || targets.mobile;
    
    // FIXED: More aggressive failure detection for mobile
    const failing = {
      lowAverage: metrics.avgFps < target.avg,
      lowMinimum: metrics.lowPercentile < target.min,
      unstable: metrics.stability > target.stability,
      severe: metrics.avgFps < (target.min * 0.7), // Slightly more lenient severe threshold
      // NEW: Mobile-specific checks
      mobilePerformanceIssue: (deviceProfile.isMobile || deviceProfile.category === 'mobile') && 
                             (metrics.avgFps < 25 || metrics.lowPercentile < 18)
    };
    
    if (process.env.NODE_ENV === "development") console.log('📊 FIXED Performance Analysis:', {
      metrics,
      target,
      failing,
      deviceCategory: deviceProfile.category,
      deviceTier: deviceProfile.performanceTier,
      shouldAdjust: Object.values(failing).some(Boolean)
    });
    
    return failing;
  }, []);

  /**
   * FIXED: More conservative optimization that works better for mobile
   */
  const createOptimizedConfig = useCallback((deviceProfile, metrics, issues) => {
    // Start with the device's optimal profile
    const baseProfile = getPerformanceProfile(deviceProfile);
    
    // If no performance issues, use device profile as-is
    if (!issues || !Object.values(issues).some(Boolean)) {
      if (process.env.NODE_ENV === "development") console.log('✅ No performance issues detected - using device profile');
      return baseProfile;
    }
    
    if (process.env.NODE_ENV === "development") console.log('⚡ Performance issues detected, applying smart optimizations:', issues);
    
    // Smart optimization strategy - be more aggressive for mobile
    let optimizedConfig = { ...baseProfile };
    
    // SPECIAL: Mobile-specific optimization path
    if (deviceProfile.isMobile || deviceProfile.category === 'mobile') {
      if (process.env.NODE_ENV === "development") console.log('📱 Mobile device with performance issues - applying mobile-specific optimizations');
      
      // For mobile, jump more aggressively to low settings
      if (issues.mobilePerformanceIssue || issues.severe || issues.lowAverage) {
        if (process.env.NODE_ENV === "development") console.log('📉 Mobile performance issues - using aggressive mobile optimization');
        return {
          ...optimizedConfig,
          renderScale: 0.5,              // Low render scale
          usePBR: false,                 // Disable PBR
          useNormalMaps: false,
          textureQuality: 'low',
          postProcessing: {
            bloom: false,
            chromaticAberration: false,
            noise: true,               // Keep cheap effects only
            vignette: true
          },
          maxLights: 2,
          shadowQuality: 'off',
          hdriQuality: 'low',
          antialiasing: false,
          anisotropicFiltering: 1
        };
      }
    }
    
    // Standard optimization for desktop/tablet
    
    // Level 1: Minor issues - reduce post-processing only
    if (issues.unstable && !issues.severe && !issues.lowAverage) {
      if (process.env.NODE_ENV === "development") console.log('📉 Level 1 optimization: Reducing post-processing');
      optimizedConfig.postProcessing = {
        ...optimizedConfig.postProcessing,
        bloom: false,                    // Expensive
        chromaticAberration: false       // Expensive
        // Keep noise and vignette - they're cheap
      };
    }
    
    // Level 2: Moderate issues - reduce render scale and some materials
    else if ((issues.lowAverage || issues.lowMinimum) && !issues.severe) {
      if (process.env.NODE_ENV === "development") console.log('📉 Level 2 optimization: Reducing render scale and materials');
      optimizedConfig.renderScale = Math.max(optimizedConfig.renderScale * 0.7, 0.4);
      optimizedConfig.useNormalMaps = false;
      optimizedConfig.textureQuality = optimizedConfig.textureQuality === 'high' ? 'medium' : 'low';
      optimizedConfig.postProcessing = {
        ...optimizedConfig.postProcessing,
        bloom: false,
        chromaticAberration: false
      };
    }
    
    // Level 3: Severe issues - aggressive optimization
    else if (issues.severe) {
      if (process.env.NODE_ENV === "development") console.log('📉 Level 3 optimization: Aggressive performance mode');
      optimizedConfig.renderScale = Math.max(optimizedConfig.renderScale * 0.5, 0.3);
      optimizedConfig.usePBR = false;                 // Disable PBR entirely
      optimizedConfig.useNormalMaps = false;
      optimizedConfig.textureQuality = 'low';
      optimizedConfig.postProcessing = {
        bloom: false,
        chromaticAberration: false,
        noise: true,                    // Keep cheap effects
        vignette: true
      };
      optimizedConfig.maxLights = Math.min(optimizedConfig.maxLights, 2);
      optimizedConfig.shadowQuality = 'off';
      optimizedConfig.hdriQuality = 'low';
      optimizedConfig.antialiasing = false;
      optimizedConfig.anisotropicFiltering = 1;
    }
    
    // Never go below minimum viable settings
    optimizedConfig.renderScale = Math.max(optimizedConfig.renderScale, 0.3);
    
    return optimizedConfig;
  }, []);

  /**
   * Finalize the performance test
   */
  const finalizeTest = useCallback(() => {
    const elapsed = performance.now() - (startRef.current || 0);
    const metrics = analyzePerformance();
    
    if (!metrics) {
      if (process.env.NODE_ENV === "development") console.warn('⚠️ No performance data collected, using device profile');
      const fallbackConfig = getPerformanceProfile(deviceProfile);
      setPerformanceConfig(fallbackConfig);
      setTesting(false);
      if (onComplete) onComplete(fallbackConfig);
      return;
    }
    
    if (process.env.NODE_ENV === "development") console.log(`🏁 Performance Test Complete (${Math.round(elapsed)}ms):`, metrics);
    
    // Analyze if adjustments are needed
    const issues = shouldAdjustPerformance(metrics, deviceProfile);
    
    // Create final configuration
    const finalConfig = createOptimizedConfig(deviceProfile, metrics, issues);
    
    // Log the decision
    if (process.env.NODE_ENV === "development") console.log(`🎯 Final Performance Decision:`, {
      deviceTier: deviceProfile.performanceTier,
      hadIssues: issues ? Object.values(issues).some(Boolean) : false,
      finalSettings: {
        renderScale: finalConfig.renderScale,
        usePBR: finalConfig.usePBR,
        useNormalMaps: finalConfig.useNormalMaps,
        textureQuality: finalConfig.textureQuality,
        enabledEffects: Object.entries(finalConfig.postProcessing || {})
          .filter(([_, enabled]) => enabled)
          .map(([effect, _]) => effect)
      }
    });
    
    setPerformanceConfig(finalConfig);
    setTesting(false);
    
    if (onComplete) onComplete(finalConfig);
  }, [deviceProfile, analyzePerformance, shouldAdjustPerformance, createOptimizedConfig, onComplete]);

  /**
   * Start the performance test
   */
  const startTest = useCallback(() => {
    startRef.current = performance.now();
    fpsSamples.current = [];
    
    if (process.env.NODE_ENV === "development") console.log(`🔬 Starting SMART performance test (${duration}ms)...`);
    if (process.env.NODE_ENV === "development") console.log(`📱 Device baseline:`, {
      category: deviceProfile?.category,
      tier: deviceProfile?.performanceTier,
      model: deviceProfile?.deviceModel,
      gpu: deviceProfile?.gpu?.tier
    });
    
    setTesting(true);
    setPerformanceConfig(null);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(finalizeTest, duration);
  }, [duration, finalizeTest, deviceProfile]);

  /**
   * Collect FPS samples during the test
   */
  useEffect(() => {
    if (testing && fps > 0) {
      fpsSamples.current.push(fps);
      
      // Log progress occasionally
      if (fpsSamples.current.length % 30 === 0) {
        const currentAvg = fpsSamples.current.reduce((a, b) => a + b, 0) / fpsSamples.current.length;
        if (process.env.NODE_ENV === "development") console.log(`📊 Performance test progress: ${fpsSamples.current.length} samples, avg: ${currentAvg.toFixed(1)}fps`);
      }
    }
  }, [fps, testing]);

  /**
   * Auto-start when device profile is available
   */
  useEffect(() => {
    if (deviceProfile && autoStart && startRef.current === null && !testing) {
      // Small delay to ensure rendering has started
      setTimeout(() => {
        startTest();
      }, 500);
    }
  }, [deviceProfile, autoStart, startTest, testing]);

  /**
   * Cleanup
   */
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
    startTest,
    testProgress: testing ? Math.min((fpsSamples.current.length / 60) * 100, 100) : 0, // Approximate progress
    currentMetrics: testing ? {
      samples: fpsSamples.current.length,
      currentFps: fps,
      avgSoFar: fpsSamples.current.length > 0 ? 
        Math.round(fpsSamples.current.reduce((a, b) => a + b, 0) / fpsSamples.current.length) : 0
    } : null
  };
};