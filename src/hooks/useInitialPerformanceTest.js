import { useState, useEffect, useRef } from 'react';
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
  { duration = 4000 } = {}
) => {
  const { avgFps } = useFPSMonitorDOM();
  const [performanceConfig, setPerformanceConfig] = useState(null);
  const [testing, setTesting] = useState(true);
  const startRef = useRef(null);

  useEffect(() => {
    if (!deviceProfile) return;

    if (startRef.current === null) {
      startRef.current = performance.now();
    }

    if (testing && performance.now() - startRef.current >= duration) {
      const fpsTier = avgFps >= 50 ? 'high' : avgFps >= 30 ? 'medium' : 'low';
      const order = { low: 0, medium: 1, high: 2 };
      const baseTier = deviceProfile.performanceTier || 'medium';
      const finalTier = order[fpsTier] < order[baseTier] ? fpsTier : baseTier;
      const finalConfig = getPerformanceProfile({
        ...deviceProfile,
        performanceTier: finalTier
      });
      setPerformanceConfig(finalConfig);
      setTesting(false);
    }
  }, [avgFps, deviceProfile, duration, testing]);

  return { performanceConfig, isTesting: testing };
};
