// src/hooks/useAdaptivePerformance.js
// Hook to adapt performance settings based on FPS measurements

import { useState, useEffect, useRef } from 'react';
import { useFPSMonitorDOM } from '../components/ui/FpsDisplay';

/**
 * Adaptive performance hook
 * @param {Object} baseConfig - starting performance configuration
 * @param {Object} options - configuration options
 *    threshold: FPS threshold before downgrading
 *    lowTierProfile: config applied when FPS is low
 *    restoreThreshold: FPS required to restore high settings
 *    lowFpsDuration: ms to wait before applying downgrade
 *    highFpsDuration: ms to wait before restoring
 */
export const useAdaptivePerformance = (
  baseConfig = {},
  {
    threshold = 50,
    lowTierProfile = { usePBR: false, textureQuality: 'low', renderScale: 0.7 },
    restoreThreshold = 60,
    lowFpsDuration = 5000,
    highFpsDuration = 5000,
    minSwitchInterval = 30000
  } = {}
) => {
  const { avgFps } = useFPSMonitorDOM();

  // Track the current effective configuration
  const [currentPerformanceConfig, setCurrentPerformanceConfig] = useState(baseConfig);

  // Save the base config so we can restore
  const [basePerformanceConfig, setBasePerformanceConfig] = useState(baseConfig);

  const lowFpsStart = useRef(null);
  const highFpsStart = useRef(null);
  const downgraded = useRef(false);
  const lastSwitchTime = useRef(0);

  // Update stored base config when it changes externally
  useEffect(() => {
    setBasePerformanceConfig(baseConfig);
    setCurrentPerformanceConfig(baseConfig);
  }, [baseConfig]);

  // Monitor FPS and adjust configuration
  useEffect(() => {
    const now = Date.now();

    if (avgFps > 0 && avgFps < threshold) {
      if (lowFpsStart.current === null) {
        lowFpsStart.current = now;
      }
      if (
        now - lowFpsStart.current > lowFpsDuration &&
        !downgraded.current &&
        now - lastSwitchTime.current > minSwitchInterval
      ) {
        setCurrentPerformanceConfig(prev => ({ ...prev, ...lowTierProfile }));
        downgraded.current = true;
        lastSwitchTime.current = now;
        highFpsStart.current = null;
      }
    } else {
      lowFpsStart.current = null;

      if (downgraded.current && avgFps >= restoreThreshold) {
        if (highFpsStart.current === null) {
          highFpsStart.current = now;
        }
        if (
          now - highFpsStart.current > highFpsDuration &&
          now - lastSwitchTime.current > minSwitchInterval
        ) {
          setCurrentPerformanceConfig(basePerformanceConfig);
          downgraded.current = false;
          lastSwitchTime.current = now;
          highFpsStart.current = null;
        }
      } else {
        highFpsStart.current = null;
      }
    }
  }, [avgFps, threshold, lowTierProfile, restoreThreshold, lowFpsDuration, highFpsDuration, minSwitchInterval, basePerformanceConfig]);

  // Allow manual config updates
  const updatePerformanceConfig = (config) => {
    setBasePerformanceConfig(config);
    setCurrentPerformanceConfig(config);
    downgraded.current = false;
    lowFpsStart.current = null;
    highFpsStart.current = null;
  };

  return { currentPerformanceConfig, updatePerformanceConfig };
};
