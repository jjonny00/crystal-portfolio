// src/hooks/useAdaptivePerformance.js
// Simplified hook: stores performance config without continuous FPS adaptation

import { useState, useEffect } from 'react';

export const useAdaptivePerformance = (baseConfig = {}) => {
  const [currentPerformanceConfig, setCurrentPerformanceConfig] = useState(baseConfig);

  useEffect(() => {
    setCurrentPerformanceConfig(baseConfig);
  }, [baseConfig]);

  const updatePerformanceConfig = (config) => {
    setCurrentPerformanceConfig(config);
  };

  return { currentPerformanceConfig, updatePerformanceConfig };
};
