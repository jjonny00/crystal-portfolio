// src/hooks/useInitialPerformanceTest.js
// Iterative tuning performance test

import { useState, useEffect, useRef, useCallback } from 'react';
import { useFPSMonitorDOM } from '../components/ui/FpsDisplay';
import { getPerformanceProfile } from '../utils/deviceProfiles';

const LOCAL_STORAGE_KEY = 'crystal-performance-config';

// Exported priority map for adjustments
export const TUNING_PRIORITY = {
  renderScale: 1,
  heavyEffects: 2,
  textureQuality: 3,
  pbrQuality: 4,
  reducedParticles: 5,
  simplifiedAnimations: 6
};

const QUALITY_ORDER = ['high', 'medium', 'low'];
const degradeQuality = (value) => {
  const idx = QUALITY_ORDER.indexOf(value);
  return idx === -1 || idx === QUALITY_ORDER.length - 1
    ? 'low'
    : QUALITY_ORDER[idx + 1];
};

// useInitialPerformanceTest with iterative tuning
export const useInitialPerformanceTest = (
  deviceProfile,
  { interval = 1000, autoStart = true, tuningPriority = TUNING_PRIORITY, onComplete } = {}
) => {
  const { fps } = useFPSMonitorDOM();
  const [performanceConfig, setPerformanceConfig] = useState(null);
  const [testing, setTesting] = useState(autoStart);

  const currentConfig = useRef(null);
  const fpsSamples = useRef([]);
  const stepIndex = useRef(0);
  const timeoutRef = useRef(null);

  const orderedSteps = Object.entries(tuningPriority)
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => k);

  const applyAdjustment = useCallback((step) => {
    const cfg = { ...currentConfig.current };
    switch (step) {
      case 'renderScale':
        cfg.renderScale = Math.max((cfg.renderScale || 1) * 0.9, 0.3);
        break;
      case 'heavyEffects':
        if (cfg.postProcessing) {
          cfg.postProcessing = {
            ...cfg.postProcessing,
            bloom: false,
            chromaticAberration: false
          };
        }
        break;
      case 'textureQuality':
        cfg.textureQuality = degradeQuality(cfg.textureQuality);
        break;
      case 'pbrQuality':
        cfg.pbrQuality = degradeQuality(cfg.pbrQuality);
        cfg.usePBR = cfg.pbrQuality !== 'low';
        break;
      case 'reducedParticles':
        cfg.reducedParticles = true;
        break;
      case 'simplifiedAnimations':
        cfg.simplifiedAnimations = true;
        break;
      default:
        break;
    }
    currentConfig.current = cfg;
    setPerformanceConfig(cfg);
  }, []);

  const finish = useCallback(() => {
    setTesting(false);
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(currentConfig.current)
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to save performance config:', err);
      }
    }
    if (onComplete) onComplete(currentConfig.current);
  }, [onComplete]);

  const runIteration = useCallback(() => {
    const avg =
      fpsSamples.current.reduce((a, b) => a + b, 0) / fpsSamples.current.length || 0;

    if (avg >= 60 || stepIndex.current >= orderedSteps.length) {
      finish();
      return;
    }

    applyAdjustment(orderedSteps[stepIndex.current]);
    stepIndex.current += 1;
    fpsSamples.current = [];
    timeoutRef.current = setTimeout(runIteration, interval);
  }, [applyAdjustment, finish, interval, orderedSteps]);

  const startTest = useCallback(() => {
    currentConfig.current = getPerformanceProfile(deviceProfile);
    setPerformanceConfig(currentConfig.current);
    stepIndex.current = 0;
    fpsSamples.current = [];
    setTesting(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(runIteration, interval);
  }, [deviceProfile, interval, runIteration]);

  useEffect(() => {
    if (testing && fps > 0) {
      fpsSamples.current.push(fps);
    }
  }, [fps, testing]);

  useEffect(() => {
    if (deviceProfile && autoStart && !performanceConfig && !testing) {
      startTest();
    }
  }, [deviceProfile, autoStart, performanceConfig, testing, startTest]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    performanceConfig,
    isTesting: testing,
    startTest,
    testProgress: testing ? (stepIndex.current / orderedSteps.length) * 100 : 100,
    currentMetrics: testing
      ? {
          samples: fpsSamples.current.length,
          currentFps: fps,
          avgSoFar:
            fpsSamples.current.length > 0
              ? Math.round(
                  fpsSamples.current.reduce((a, b) => a + b, 0) /
                    fpsSamples.current.length
                )
              : 0
        }
      : null
  };
};
