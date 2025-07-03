// src/hooks/useInitialPerformanceTest.js
// FIXED: Proper FPS evaluation and device profile respect

import { useState, useEffect, useRef, useCallback } from 'react';
import { useFPSMonitorDOM } from '../components/ui/FpsDisplay';
import { getPerformanceProfile } from '../utils/deviceProfiles';

/**
 * FIXED: Run a short FPS sampling test on startup and return
 * a performance configuration based on the results, but respect device profiles
 */
export const useInitialPerformanceTest = (
  deviceProfile,
  { duration = 4000, autoStart = true, onComplete } = {}
) => {
  const { avgFps } = useFPSMonitorDOM();
  const [performanceConfig, setPerformanceConfig] = useState(null);
  const [testing, setTesting] = useState(autoStart);
  const startRef = useRef(null);
  const timeoutRef = useRef(null);
  
  const finalizeTest = useCallback(() => {
    const elapsed = performance.now() - (startRef.current || 0);
    
    console.log(`🔬 Performance Test Results:`, {
      avgFps,
      elapsed: Math.round(elapsed),
      deviceTier: deviceProfile?.performanceTier
    });
    
    // FIXED: More intelligent FPS evaluation
    let fpsTier;
    if (avgFps >= 55) {
      fpsTier = 'high';
    } else if (avgFps >= 40) {
      fpsTier = 'medium'; 
    } else if (avgFps >= 25) {
      fpsTier = 'low';
    } else {
      fpsTier = 'very-low'; // New tier for very poor performance
    }
    
    console.log(`📊 FPS Analysis: ${avgFps} fps → ${fpsTier} tier`);
    
    // FIXED: More conservative tier selection
    const baseTier = deviceProfile?.performanceTier || 'medium';
    
    // Only downgrade if FPS is significantly poor
    let finalTier;
    if (fpsTier === 'very-low') {
      // Force to low if FPS is really bad (< 25)
      finalTier = 'low';
      console.log(`⬇️ Downgrading from ${baseTier} to low due to very poor FPS`);
    } else if (fpsTier === 'low' && baseTier === 'high') {
      // Only downgrade high to medium if FPS is poor (25-40)
      finalTier = 'medium';
      console.log(`⬇️ Downgrading from high to medium due to low FPS`);
    } else if (fpsTier === 'medium' && baseTier === 'high') {
      // Keep high tier even with medium FPS - might just be initial loading
      finalTier = 'high';
      console.log(`✅ Keeping high tier despite medium FPS (could be loading)`);
    } else {
      // Keep original tier for most cases
      finalTier = baseTier;
      console.log(`✅ Keeping original tier: ${baseTier} (FPS: ${fpsTier})`);
    }
    
    // FIXED: Create config based on final tier, not FPS tier
    const finalConfig = getPerformanceProfile({
      ...deviceProfile,
      performanceTier: finalTier,
    });
    
    console.log(`🎯 Final Performance Config:`, {
      tier: finalTier,
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
    console.log(`🔬 Starting performance test (target ${duration}ms)...`);
    console.log(`📱 Device profile:`, {
      category: deviceProfile?.category,
      tier: deviceProfile?.performanceTier,
      isMobile: deviceProfile?.isMobile
    });
    
    setTesting(true);
    setPerformanceConfig(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(finalizeTest, duration);
  }, [duration, finalizeTest, deviceProfile]);

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

  useEffect(() => {
    if (deviceProfile && autoStart && startRef.current === null) {
      startTest();
    }
  }, [deviceProfile, autoStart, startTest]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { performanceConfig, isTesting: testing, startTest };
};