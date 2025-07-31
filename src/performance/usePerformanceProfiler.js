// src/performance/usePerformanceProfiler.js
// Experimental hook to run an automated performance profiling routine
// using the PerformanceTestScene. The profiler progressively reduces
// rendering settings until a target FPS is achieved.

import React, { useState, useRef, useCallback } from 'react';
import PerformanceTestScene from './PerformanceTestScene';
import * as defaultConfig from '../crystalConfig';

const HIGH_SETTINGS = {
  postProcessing: {
    bloom: true,
    chromaticAberration: true,
    noise: true,
    vignette: true
  },
  renderScale: 1,
  pbrQuality: 'high',
  usePBR: true,
  textureQuality: 'high',
  useNormalMaps: true,
  particleCount: 16,
  simplifiedAnimations: false,
  reducedParticles: false
};

const QUALITY_ORDER = ['high', 'medium', 'low'];

const stepReducers = [
  // Disable post-processing effects
  (cfg) => ({
    ...cfg,
    postProcessing: {
      bloom: false,
      chromaticAberration: false,
      noise: false,
      vignette: false
    }
  }),
  // Lower render scale
  (cfg) => ({
    ...cfg,
    renderScale: Math.max(0.5, cfg.renderScale * 0.8)
  }),
  // Degrade material quality / toggle PBR
  (cfg) => {
    const idx = QUALITY_ORDER.indexOf(cfg.pbrQuality);
    const next = QUALITY_ORDER[Math.min(idx + 1, QUALITY_ORDER.length - 1)];
    return {
      ...cfg,
      pbrQuality: next,
      usePBR: next !== 'low'
    };
  },
  // Degrade texture quality
  (cfg) => {
    const idx = QUALITY_ORDER.indexOf(cfg.textureQuality);
    const next = QUALITY_ORDER[Math.min(idx + 1, QUALITY_ORDER.length - 1)];
    return { ...cfg, textureQuality: next };
  },
  // Disable normal maps
  (cfg) => ({ ...cfg, useNormalMaps: false }),
  // Reduce particles
  (cfg) => ({
    ...cfg,
    particleCount: Math.max(4, Math.floor(cfg.particleCount / 2)),
    reducedParticles: true
  }),
  // Simplify animations
  (cfg) => ({ ...cfg, simplifiedAnimations: true })
];

export const usePerformanceProfiler = () => {
  const sceneRef = useRef(null);
  const [sceneConfig, setSceneConfig] = useState(HIGH_SETTINGS);
  const [progress, setProgress] = useState(0);
  const [isProfiling, setIsProfiling] = useState(false);
  const cancelRef = useRef(false);

  const TestScene = (
    <PerformanceTestScene ref={sceneRef} {...sceneConfig} config={defaultConfig} />
  );

  const waitNextFrame = () =>
    new Promise((resolve) => requestAnimationFrame(() => resolve()));

  const runWithConfig = useCallback(async (cfg) => {
    setSceneConfig(cfg);
    await waitNextFrame();
    return sceneRef.current.runTest(2000);
  }, []);

  const startProfiler = useCallback(async () => {
    if (isProfiling) return null;
    setIsProfiling(true);
    cancelRef.current = false;
    setProgress(0);

    const metrics = [];
    let currentConfig = { ...HIGH_SETTINGS };
    let result = await runWithConfig(currentConfig);
    metrics.push({ config: currentConfig, metrics: result });
    let avg = result.avg;
    let completed = 1;
    const total = stepReducers.length + 1;
    setProgress((completed / total) * 100);

    for (let i = 0; i < stepReducers.length && !cancelRef.current && avg < 55; i++) {
      const reduced = stepReducers[i](currentConfig);
      const newResult = await runWithConfig(reduced);
      metrics.push({ config: reduced, metrics: newResult });
      completed += 1;
      setProgress((completed / total) * 100);

      if (newResult.avg > avg) {
        currentConfig = reduced;
        avg = newResult.avg;
      }
    }

    setProgress(100);
    setIsProfiling(false);
    return { config: currentConfig, metrics };
  }, [isProfiling, runWithConfig]);

  const cancelProfiler = useCallback(() => {
    if (isProfiling) cancelRef.current = true;
  }, [isProfiling]);

  return { TestScene, startProfiler, cancelProfiler, progress, isProfiling };
};

export default usePerformanceProfiler;
