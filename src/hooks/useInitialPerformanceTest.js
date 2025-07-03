import { useState, useEffect, useRef, useCallback } from 'react';
import { useFPSMonitorDOM } from '../components/ui/FpsDisplay';
import { getPerformanceProfile } from '../utils/deviceProfiles';

/**
 * Run a short FPS sampling test on startup and return
 * a performance configuration based on the results.
 * @param {Object} deviceProfile - profile from useDeviceProfile
 * @param {Object} options - configuration options
 *    duration: length of the sampling period in ms
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
    const fpsTier = avgFps >= 50 ? 'high' : avgFps >= 30 ? 'medium' : 'low';
    const order = { low: 0, medium: 1, high: 2 };
    const baseTier = deviceProfile?.performanceTier || 'medium';
    const finalTier = order[fpsTier] < order[baseTier] ? fpsTier : baseTier;
    const finalConfig = getPerformanceProfile({
      ...deviceProfile,
      performanceTier: finalTier,
    });
    setPerformanceConfig(finalConfig);
    setTesting(false);
    if (onComplete) onComplete(finalConfig);
    console.log(`\u2705 Performance test completed in ${Math.round(elapsed)}ms`);
  }, [avgFps, deviceProfile, onComplete]);

  const startTest = useCallback(() => {
    startRef.current = performance.now();
    console.log(`\uD83D\uDD01 Starting performance test (target ${duration}ms)...`);
    setTesting(true);
    setPerformanceConfig(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(finalizeTest, duration);
  }, [duration, finalizeTest]);

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
