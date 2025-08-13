// src/utils/PerformanceManagerV2.js
// FIXED: Conservative progressive performance testing system

import { PERFORMANCE_PROFILES, detectDeviceCapabilities } from './deviceProfiles.js';

const STORAGE_KEY = 'crystal-performance-config-v2';
const VERSION_KEY = 'crystal-performance-version-v2';
const CURRENT_VERSION = '3.0'; // New version for conservative approach

export default class PerformanceManagerV2 {
  constructor() {
    // CRITICAL: Start with LOW profile for ALL devices
    this.tier = 'low';
    this.profile = { ...PERFORMANCE_PROFILES.low };
    this._initialized = false;
    this._ready = false;
    this._initPromise = null;
    this._testResults = null;
    this._listeners = new Set();
    this._progressCallback = null;
  }

  setProgressCallback(callback) {
    this._progressCallback = callback;
  }

  async initialize() {
    if (this._initPromise) return this._initPromise;
    
    this._initPromise = this._performInitialization();
    return this._initPromise;
  }

  async _performInitialization() {
    this._initialized = true;

    // Check if we have valid cached results
    const cachedData = this._getCachedResults();
    
    if (cachedData && this._isCacheValid(cachedData)) {
      if (import.meta.env.DEV) {
        console.log('🔧 Using cached performance profile:', cachedData.tier);
      }
      
      this.tier = cachedData.tier;
      this.profile = { ...PERFORMANCE_PROFILES[cachedData.tier] };
      this._testResults = cachedData.testResults;
      this._ready = true;
      return;
    }

    if (import.meta.env.DEV) {
      console.log('🔧 Starting CONSERVATIVE performance test from LOW baseline...');
    }

    try {
      const { tier, testResults } = await this._runConservativeProgressiveTest();

      this.tier = tier;
      this.profile = { ...PERFORMANCE_PROFILES[tier] };
      this._testResults = testResults;

      // Cache results
      this._cacheResults(tier, testResults);

      if (import.meta.env.DEV) {
        console.log('🔧 Conservative performance test complete:', {
          tier,
          finalProfile: this.profile
        });
      }

    } catch (error) {
      console.warn('Performance test failed, using low profile:', error);
      this.tier = 'low';
      this.profile = { ...PERFORMANCE_PROFILES.low };
    }

    this._ready = true;
  }

  _getCachedResults() {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      const version = localStorage.getItem(VERSION_KEY);

      if (cached) {
        const parsed = JSON.parse(cached);
        return { ...parsed, appVersion: version };
      }
    } catch (error) {
      console.warn('Failed to read cached performance data:', error);
    }
    return null;
  }

  _isCacheValid(cachedData) {
    // Cache is always invalid in dev for testing
    if (import.meta.env.DEV) return false;
    
    if (cachedData.appVersion !== CURRENT_VERSION) return false;

    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const age = Date.now() - (cachedData.timestamp || 0);

    return age < maxAge && cachedData.tier && cachedData.testResults;
  }

  _cacheResults(tier, testResults) {
    try {
      const cacheData = {
        tier,
        testResults,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        devicePixelRatio: window.devicePixelRatio,
        appVersion: CURRENT_VERSION
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      
    } catch (error) {
      console.warn('Failed to cache performance data:', error);
    }
  }

  async _runConservativeProgressiveTest() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    canvas.style.position = 'absolute';
    canvas.style.top = '-9999px';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    const results = {};
    const { capabilities } = detectDeviceCapabilities();

    try {
      // Phase 1: Test LOW quality (10-20% progress)
      this._reportProgress(10, 'Testing low quality (60 FPS target)...');
      const lowResult = await this._testWithRealisticScene(
        canvas,
        'low',
        2500, // 2.5 seconds test duration
        (p) => this._reportProgress(10 + p * 10, 'Testing low quality...')
      );
      results.low = lowResult;

      // If LOW fails to maintain 60 FPS, stay on low
      if (lowResult.avgFps < 60 || lowResult.minFps < 55) {
        return { tier: 'low', testResults: results };
      }

      // Phase 2: Test MEDIUM quality (20-30% progress)
      this._reportProgress(20, 'Testing medium quality (55 FPS target)...');
      const mediumResult = await this._testWithRealisticScene(
        canvas,
        'medium',
        2500,
        (p) => this._reportProgress(20 + p * 10, 'Testing medium quality...')
      );
      results.medium = mediumResult;

      // If MEDIUM fails to maintain 55 FPS, use low
      if (mediumResult.avgFps < 55 || mediumResult.minFps < 50) {
        return { tier: 'low', testResults: results };
      }

      // Phase 3: Test HIGH quality (30-40% progress) - only if not mobile
      if (capabilities.isMobile) {
        // Cap mobile devices at medium tier
        return { tier: 'medium', testResults: results };
      }

      this._reportProgress(30, 'Testing high quality (50 FPS target)...');
      const highResult = await this._testWithRealisticScene(
        canvas,
        'high',
        2500,
        (p) => this._reportProgress(30 + p * 10, 'Testing high quality...')
      );
      results.high = highResult;

      // If HIGH maintains 50 FPS, use high; otherwise use medium
      if (highResult.avgFps >= 50 && highResult.minFps >= 45) {
        return { tier: 'high', testResults: results };
      }

      return { tier: 'medium', testResults: results };

    } finally {
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      this._reportProgress(40, 'Performance test complete');
    }
  }

  _reportProgress(percentage, message) {
    const clamped = Math.min(100, Math.max(0, percentage));
    if (import.meta.env.DEV) {
      console.debug(`📈 Conservative test progress: ${clamped.toFixed(1)}% - ${message}`);
    }
    if (this._progressCallback) {
      this._progressCallback(clamped, message);
    }
  }

  async _testWithRealisticScene(canvas, tier, testDuration = 2500, onProgress) {
    const profile = PERFORMANCE_PROFILES[tier];
    const THREE = await import('three');

    return new Promise(async (resolve) => {
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: profile.antialiasing !== false,
        powerPreference: 'default'
      });

      renderer.setSize(256 * profile.renderScale, 256 * profile.renderScale);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.maxPixelRatio || 2));

      // Create scene that matches actual crystal complexity
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 2, 4);

      // Use realistic geometry that matches your actual scene
      const crystalGeometry = new THREE.OctahedronGeometry(1, 2);

      // Create material that exactly matches your MaterialManager output
      let crystalMaterial;

      if (profile.pbrQuality === 'low') {
        // Match MaterialManager optimized mobile material
        crystalMaterial = new THREE.MeshStandardMaterial({
          color: 0x1f2391,
          metalness: 0.8,
          roughness: 0.02,
          envMapIntensity: 4.0,
          transparent: true,
          opacity: 0.96,
          emissive: new THREE.Color(0xa7ffdb),
          emissiveIntensity: 0.03
        });
      } else {
        // Use PBR material for medium/high
        crystalMaterial = new THREE.MeshPhysicalMaterial({
          color: 0x0d042b,
          metalness: 0.0,
          roughness: 0.11,
          transmission: profile.pbrQuality === 'high' ? 0.7 : 0.4,
          ior: 2.3,
          transparent: true,
          opacity: 0.8,
          envMapIntensity: profile.pbrQuality === 'high' ? 2.0 : 1.5,
          clearcoat: profile.pbrQuality === 'high' ? 0.8 : 0.4,
          iridescence: profile.pbrQuality === 'high' ? 0.3 : 0.1
        });
      }

      const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
      scene.add(crystal);

      // Add six facets to match your actual scene
      for (let i = 0; i < 6; i++) {
        const facet = crystal.clone();
        facet.position.set(
          Math.cos((i / 6) * Math.PI * 2) * 1.5,
          Math.sin((i / 6) * Math.PI * 2) * 0.8,
          Math.sin((i / 6) * Math.PI * 2) * 0.5
        );
        facet.scale.setScalar(0.4);
        scene.add(facet);
      }

      // Add lighting that matches your actual scene
      const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
      directionalLight.position.set(2, 8, 5);
      scene.add(directionalLight);

      // Add point lights according to profile limits
      const pointLights = [
        { position: [-5, 3, -5], color: 0x00ad1d, intensity: 1.0 },
        { position: [0, -8, -10], color: 0x00e380, intensity: 1.8 },
        { position: [5, -3, 5], color: 0xFFE8CC, intensity: 0.6 }
      ];

      pointLights.slice(0, Math.max(0, profile.maxLights - 2)).forEach(config => {
        const light = new THREE.PointLight(config.color, config.intensity);
        light.position.set(...config.position);
        scene.add(light);
      });

      // Add post-processing to simulate actual load
      const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js');
      const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js');
      const { UnrealBloomPass } = await import('three/examples/jsm/postprocessing/UnrealBloomPass.js');

      const composer = new EffectComposer(renderer);
      composer.setSize(256 * profile.renderScale, 256 * profile.renderScale);
      composer.addPass(new RenderPass(scene, camera));
      
      if (profile.postProcessing.bloom) {
        composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.4, 0.85));
      }

      const samples = [];
      const warmupDuration = 500; // Allow shader compilation
      let startTime = 0;
      let lastTime = 0;
      let frameCount = 0;
      let criticalLowFpsTime = 0;

      const testLoop = (time) => {
        if (!startTime) {
          startTime = time;
          lastTime = time;
        }

        const deltaTime = time - lastTime;
        lastTime = time;
        const elapsed = time - startTime;

        // Animate scene to match actual load
        crystal.rotation.y += 0.003;
        crystal.rotation.x += 0.001;

        scene.children.forEach(child => {
          if (child.isMesh && child !== crystal) {
            child.rotation.y += 0.002;
            child.rotation.z += 0.0005;
          }
        });

        // Render with or without post-processing
        if (profile.postProcessing.bloom) {
          composer.render();
        } else {
          renderer.render(scene, camera);
        }

        // Report progress
        onProgress?.(Math.min(1, elapsed / testDuration));

        // Collect FPS data after warmup
        if (elapsed > warmupDuration && deltaTime > 0) {
          const currentFps = 1000 / deltaTime;
          
          // Emergency exit for critically low FPS
          if (currentFps < 15) {
            criticalLowFpsTime += deltaTime;
            if (criticalLowFpsTime > 200) {
              // Fail fast for clearly inadequate performance
              this._cleanup(composer, renderer, crystalMaterial, crystalGeometry);
              resolve({
                tier,
                avgFps: currentFps,
                minFps: currentFps,
                maxFps: currentFps,
                frameCount: 1,
                samples: 1,
                failedEarly: true
              });
              return;
            }
          } else {
            criticalLowFpsTime = 0;
          }
          
          samples.push(currentFps);
          frameCount++;
        }

        if (elapsed < testDuration) {
          requestAnimationFrame(testLoop);
        } else {
          // Calculate results
          const avgFps = samples.reduce((a, b) => a + b, 0) / samples.length;
          const sorted = samples.slice().sort((a, b) => a - b);
          
          // Use 5th and 95th percentiles for more stable min/max
          const minIndex = Math.floor(sorted.length * 0.05);
          const maxIndex = Math.floor(sorted.length * 0.95);
          const minFps = sorted[minIndex] ?? Math.min(...sorted);
          const maxFps = sorted[maxIndex] ?? Math.max(...sorted);

          this._cleanup(composer, renderer, crystalMaterial, crystalGeometry);

          resolve({
            tier,
            avgFps: avgFps || 0,
            minFps: minFps || 0,
            maxFps: maxFps || 0,
            frameCount,
            samples: samples.length,
            testDuration: elapsed
          });
        }
      };

      onProgress?.(0);
      requestAnimationFrame(testLoop);
    });
  }

  _cleanup(composer, renderer, material, geometry) {
    try {
      if (composer && composer.dispose) composer.dispose();
      if (renderer && renderer.dispose) renderer.dispose();
      if (material && material.dispose) material.dispose();
      if (geometry && geometry.dispose) geometry.dispose();
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  // Public API methods
  isReady() {
    return this._ready;
  }

  getProfile() {
    return this.profile;
  }

  getTier() {
    return this.tier;
  }

  getTestResults() {
    return this._testResults;
  }

  setProfile(tier, overrides = {}) {
    if (PERFORMANCE_PROFILES[tier]) {
      this.tier = tier;
      this.profile = { ...PERFORMANCE_PROFILES[tier], ...overrides };

      // Update cache
      if (this._testResults) {
        this._cacheResults(tier, this._testResults);
      }

      if (import.meta.env.DEV) {
        console.log('🔧 Manually set performance tier:', tier);
      }

      this._notifyListeners();
    }
  }

  async forceRetest() {
    // Clear cache
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(VERSION_KEY);
    } catch (error) {
      // Ignore
    }

    // Reset state
    this._ready = false;
    this._initialized = false;
    this._initPromise = null;
    this._testResults = null;

    // Re-run initialization
    return this.initialize();
  }

  clearCache() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(VERSION_KEY);
      if (import.meta.env.DEV) {
        console.log('🔧 Performance cache cleared');
      }
    } catch (error) {
      console.warn('Failed to clear performance cache:', error);
    }
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notifyListeners() {
    for (const listener of this._listeners) {
      try {
        listener({ tier: this.tier, profile: this.profile });
      } catch (e) {
        console.warn('Listener error:', e);
      }
    }
  }
}