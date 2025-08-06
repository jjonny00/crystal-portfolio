import * as THREE from 'three';
import LoadingProgressManager from './LoadingProgressManager.js';
import GPUDetector from './GPUDetector.js';
import SceneWarmupManager from './SceneWarmupManager.js';
import Performance60FPSManager from './Performance60FPSManager.js';
import { QUALITY_PRESETS } from './qualityPresets.js';

export default class AdaptivePerformanceApp {
  constructor({ onProgressUpdate, sceneBuilder } = {}) {
    this.onProgressUpdate = onProgressUpdate;
    this.sceneBuilder = sceneBuilder;
    this.renderer = null; // Will be provided by React Three Fiber
    this.performanceManager = null;
  }

  showLoadingScreen() {
    this.updateLoadingScreen({ progress: 0, currentTask: 'Initializing...', isIndeterminate: true });
  }

  updateLoadingScreen(update) {
    if (this.onProgressUpdate) {
      this.onProgressUpdate({
        progress: update.progress,
        currentTask: update.currentTask,
        isIndeterminate: update.isIndeterminate
      });
    }
  }

  setRenderer(renderer) {
    this.renderer = renderer;
  }

  async initialize() {
    try {
      this.showLoadingScreen();
      const progressManager = new LoadingProgressManager((update) => {
        this.updateLoadingScreen(update);
      });
      await progressManager.executeWithProgress();
      const gpuInfo = GPUDetector.detect();
      const warmupManager = new SceneWarmupManager(this.buildScene.bind(this));
      const warmupResults = await warmupManager.warmupBehindLoadingScreen();
      const initialQuality = warmupResults.quality || 'medium';
      this.applyQualityPreset(initialQuality);
      await this.transitionToMainScene();
      this.performanceManager = new Performance60FPSManager();
      this.performanceManager.applyQualityLevel = this.applyQualityPreset.bind(this);
      this.performanceManager.currentLevel = this.performanceManager.qualityLevels.indexOf(initialQuality);
      this.startRuntimeMonitoring();
    } catch (error) {
      console.error('Initialization failed:', error);
      this.showErrorScreen(error);
    }
  }

  async buildScene(canvas) {
    if (this.sceneBuilder) {
      return this.sceneBuilder(canvas);
    }

    // Fallback: simple cube scene for warmup
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.width, canvas.height, false);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 1000);
    camera.position.z = 5;
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    scene.add(cube);
    return { renderer, scene, camera };
  }

  async transitionToMainScene() {
    return Promise.resolve();
  }

  startRuntimeMonitoring() {
    let lastTime = performance.now();
    const loop = () => {
      const now = performance.now();
      const deltaTime = now - lastTime;
      lastTime = now;
      this.performanceManager.update(deltaTime);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  applyQualityPreset(level) {
    const preset = QUALITY_PRESETS[level];
    if (!preset || !this.renderer) return;
    this.renderer.setPixelRatio(preset.pixelRatio);
    this.renderer.shadowMap.enabled = preset.shadows;
    this.updateMaterials(preset);
    this.updatePostProcessing(preset.postProcessing);
    this.updateParticleSystem(preset.particleCount);
    console.log(`Applied quality preset: ${level}`);
  }

  updateMaterials(preset) {
    // Implementation specific to scene
  }

  updatePostProcessing(config) {
    // Implementation specific to scene
  }

  updateParticleSystem(count) {
    // Implementation specific to scene
  }

  showErrorScreen(error) {
    console.error(error);
  }
}
