// src/performance/ProgressivePerformanceTester.js
// Progressive real scene performance tester with progress feedback

import React, { createRef } from 'react';
import { createRoot } from 'react-dom/client';
import PerformanceTestScene from './PerformanceTestScene';

export const QUALITY_LEVELS = ['low', 'medium', 'high'];

const QUALITY_PRESETS = {
  low: {
    renderScale: 0.5,
    textureQuality: 'low',
    pbrQuality: 'low',
    usePBR: false,
    useNormalMaps: false,
    postProcessing: { bloom: false, chromaticAberration: false, noise: false, vignette: false },
    simplifiedAnimations: true,
    reducedParticles: true,
    particleCount: 4,
    maxLights: 2,
    antialiasing: false,
    anisotropicFiltering: 1,
    hdriQuality: 'low'
  },
  medium: {
    renderScale: 0.75,
    textureQuality: 'medium',
    pbrQuality: 'medium',
    usePBR: true,
    useNormalMaps: true,
    postProcessing: { bloom: false, chromaticAberration: false, noise: false, vignette: true },
    simplifiedAnimations: false,
    reducedParticles: false,
    particleCount: 8,
    maxLights: 3,
    antialiasing: true,
    anisotropicFiltering: 2,
    hdriQuality: 'medium'
  },
  high: {
    renderScale: 1,
    textureQuality: 'high',
    pbrQuality: 'high',
    usePBR: true,
    useNormalMaps: true,
    postProcessing: { bloom: true, chromaticAberration: true, noise: true, vignette: true },
    simplifiedAnimations: false,
    reducedParticles: false,
    particleCount: 16,
    maxLights: 5,
    antialiasing: true,
    anisotropicFiltering: 4,
    hdriQuality: 'high'
  }
};

export class ProgressivePerformanceTester {
  constructor({ targetFPS = 60, minimumFPS = 30 } = {}) {
    this.targetFPS = targetFPS;
    this.minimumFPS = minimumFPS;
  }

  getStartingLevel() {
    // start from the highest level and step down until requirements are met
    return QUALITY_LEVELS.length - 1;
  }

  async testLevel(levelIndex, iterations = 2) {
    const levelName = QUALITY_LEVELS[levelIndex];
    const config = QUALITY_PRESETS[levelName];
    const fpsResults = [];

    for (let i = 0; i < iterations; i++) {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      const ref = createRef();
      root.render(<PerformanceTestScene ref={ref} {...config} />);

      // allow mount and warm up
      await new Promise(r => setTimeout(r, 300));
      const { avg } = await ref.current.runTest(3000);

      root.unmount();
      container.remove();

      fpsResults.push(avg);

      // brief pause between iterations to reset GPU timing
      if (i < iterations - 1) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    // return median to avoid outliers
    fpsResults.sort((a, b) => a - b);
    const mid = Math.floor(fpsResults.length / 2);
    return fpsResults.length % 2
      ? fpsResults[mid]
      : (fpsResults[mid - 1] + fpsResults[mid]) / 2;
  }

  async findOptimalSettings(progressCallback) {
    const totalLevels = QUALITY_LEVELS.length;
    let currentLevel = this.getStartingLevel();
    let tested = 0;

    progressCallback(0, `Testing quality level ${currentLevel + 1}/${totalLevels}...`);
    let fps = await this.testLevel(currentLevel);
    tested++;

    // progressively step down until performance meets the target FPS
    while (fps < this.targetFPS && currentLevel > 0) {
      currentLevel--;
      progressCallback((tested / totalLevels) * 100, `Testing quality level ${currentLevel + 1}/${totalLevels}...`);
      fps = await this.testLevel(currentLevel);
      tested++;
    }

    // double-check the chosen level for stability
    const verify = await this.testLevel(currentLevel);
    if (verify < this.targetFPS && currentLevel > 0) {
      currentLevel--;
      await this.testLevel(currentLevel); // final confirmation run
    }

    progressCallback(100, 'Performance optimization complete!');
    return QUALITY_LEVELS[currentLevel];
  }
}

export default ProgressivePerformanceTester;
