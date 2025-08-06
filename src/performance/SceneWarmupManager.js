export default class SceneWarmupManager {
  constructor(actualSceneBuilder) {
    this.sceneBuilder = actualSceneBuilder;
  }

  async warmupBehindLoadingScreen() {
    const offscreenCanvas = this.createOffscreenCanvas();
    const { renderer, scene, camera } = await this.sceneBuilder(offscreenCanvas);
    const warmupMetrics = await this.performWarmup(renderer, scene, camera);
    const recommendedQuality = this.analyzePerformance(warmupMetrics);
    this.cleanup(renderer, offscreenCanvas);
    return {
      quality: recommendedQuality,
      metrics: warmupMetrics
    };
  }

  createOffscreenCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.cssText = `
      position: fixed !important;
      top: -10000px !important;
      left: -10000px !important;
      width: 1px !important;
      height: 1px !important;
      pointer-events: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
    `;
    document.body.appendChild(canvas);
    return canvas;
  }

  async performWarmup(renderer, scene, camera) {
    const measurements = [];

    // First 30 frames: shader compilation
    for (let i = 0; i < 30; i++) {
      renderer.render(scene, camera);
      await this.nextFrame();
    }

    // Next 60 frames: measure
    for (let i = 0; i < 60; i++) {
      const startFrame = performance.now();
      renderer.render(scene, camera);
      const endFrame = performance.now();
      measurements.push({
        fps: 1000 / (endFrame - startFrame),
        frameTime: endFrame - startFrame
      });
      if (i % 10 === 0) {
        await this.nextFrame();
      }
    }
    return this.calculateMetrics(measurements);
  }

  calculateMetrics(measurements) {
    const fpsSamples = measurements.map(m => m.fps);
    return {
      avgFPS: fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length,
      minFPS: Math.min(...fpsSamples),
      maxFPS: Math.max(...fpsSamples),
      percentile95: this.getPercentile(fpsSamples, 0.95),
      stable: this.getStandardDeviation(fpsSamples) < 10
    };
  }

  getPercentile(arr, percentile) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.floor(percentile * (sorted.length - 1));
    return sorted[index];
  }

  getStandardDeviation(arr) {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  }

  analyzePerformance(metrics) {
    if (metrics.minFPS >= 65 && metrics.avgFPS >= 70) return 'ultra';
    if (metrics.minFPS >= 58 && metrics.avgFPS >= 62) return 'high';
    if (metrics.minFPS >= 50 && metrics.avgFPS >= 55) return 'medium';
    if (metrics.minFPS >= 40 && metrics.avgFPS >= 45) return 'low';
    return 'minimal';
  }

  nextFrame() {
    return new Promise(resolve => requestAnimationFrame(resolve));
  }

  cleanup(renderer, canvas) {
    renderer.dispose();
    if (renderer.forceContextLoss) renderer.forceContextLoss();
    canvas.remove();
  }
}
