// src/utils/PerformanceManager.js
// Progressive performance testing system

import { PERFORMANCE_PROFILES, detectDeviceCapabilities } from './deviceProfiles.js';

const STORAGE_KEY = 'crystal-performance-config';
const VERSION_KEY = 'crystal-performance-version';
const CURRENT_VERSION = '2.3'; // Increment to force re-testing with progressive approach

export default class PerformanceManager {
  constructor() {
    this.tier = 'medium'; // FIXED: Start with medium (working default), only upgrade/downgrade if needed
    this.profile = { ...PERFORMANCE_PROFILES.medium };
    this._initialized = false;
    this._ready = false;
    this._initPromise = null;
    this._testResults = null;
    this._listeners = new Set();
    this._fpsBuffer = [];
    this._monitorHandle = null;
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
      this._startRuntimeMonitoring();
      return;
    }

    // Detect device capabilities for supplemental info only
    const { capabilities } = detectDeviceCapabilities();

    // Always start from a safe baseline and only upgrade after testing
    this.tier = 'medium';
    this.profile = { ...PERFORMANCE_PROFILES.medium };

    if (import.meta.env.DEV) {
      console.log('🔧 Starting progressive performance test from medium baseline...');
    }

    try {
      const { tier, testResults } = await this._runProgressiveTest('medium', capabilities.isMobile);

      this.tier = tier;
      this.profile = { ...PERFORMANCE_PROFILES[tier] };
      this._testResults = testResults;

      // Cache results
      this._cacheResults(tier, testResults);

      if (import.meta.env.DEV) {
        console.log('🔧 Progressive performance test complete:', {
          tier,
          results: testResults[tier]
        });
      }

    } catch (error) {
      console.warn('Performance test failed, using medium profile:', error);
      this.tier = 'medium';
      this.profile = { ...PERFORMANCE_PROFILES.medium };
    }

    this._ready = true;
    this._startRuntimeMonitoring();
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
    // Cache is valid for 24 hours in production, always invalid in dev for testing
    if (import.meta.env.DEV) return false;
    
    if (cachedData.appVersion !== CURRENT_VERSION) return false;

    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const age = Date.now() - (cachedData.timestamp || 0);

    if (!(age < maxAge && cachedData.tier && cachedData.testResults)) {
      return false;
    }

    if (cachedData.tier === 'high') {
      if (
        cachedData.userAgent !== navigator.userAgent ||
        cachedData.devicePixelRatio !== window.devicePixelRatio
      ) {
        return false;
      }
    }

    return true;
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

  async _runProgressiveTest(_startTier = 'medium', _isMobile = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;

    canvas.style.position = 'absolute';
    canvas.style.top = '-9999px';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    const results = {};
    const iterations = 2;

    try {
      // Always test medium first
      this._reportProgress(0, 'Testing medium quality...');
      const mediumResult = await this._testWithActualSceneComplexity(
        canvas,
        'medium',
        iterations,
        (p) => this._reportProgress(p * 50, 'Testing medium quality...')
      );
      results.medium = mediumResult;

      if (mediumResult.avgFps < 55 || mediumResult.minFps < 50) {
        // Medium failed, fall back to low
        this._reportProgress(50, 'Testing low quality...');
        const lowResult = await this._testWithActualSceneComplexity(
          canvas,
          'low',
          iterations,
          (p) => this._reportProgress(50 + p * 50, 'Testing low quality...')
        );
        results.low = lowResult;
        return { tier: 'low', testResults: results };
      }

      // Medium passed, optionally try high
      this._reportProgress(50, 'Testing high quality...');
      const highResult = await this._testWithActualSceneComplexity(
        canvas,
        'high',
        iterations,
        (p) => this._reportProgress(50 + p * 50, 'Testing high quality...')
      );
      results.high = highResult;

      if (highResult.avgFps >= 55 && highResult.minFps >= 50) {
        return { tier: 'high', testResults: results };
      }

      return { tier: 'medium', testResults: results };
    } finally {
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      this._reportProgress(100, 'Performance test complete');
    }
  }

  _reportProgress(percentage, message) {
    const clamped = Math.min(100, Math.max(0, percentage));
    if (import.meta.env.DEV) {
      console.debug(`📈 Performance test progress: ${clamped.toFixed(1)}% - ${message}`);
    }
    if (this._progressCallback) {
      this._progressCallback(clamped, message);
    }
  }

  async _testWithActualSceneComplexity(canvas, tier, iterations = 2, onProgress) {
    const profile = PERFORMANCE_PROFILES[tier];
    const THREE = await import('three');

    const runSingleTest = (progressCallback) => new Promise(async (resolve) => {
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: profile.antialiasing !== false,
        powerPreference: 'default'
      });

      renderer.setSize(256 * profile.renderScale, 256 * profile.renderScale);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.maxPixelRatio || 2));

      // Create scene that matches your actual crystal complexity
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 2, 4);

      // Use more realistic geometry
      const crystalGeometry = new THREE.OctahedronGeometry(1, 2);

      // FIXED: Create material that matches your MaterialManager output for this tier
      let crystalMaterial;

      if (profile.pbrQuality === 'low') {
        // Match your MaterialManager optimized mobile material
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
        // Use simplified PBR material for medium/high
        crystalMaterial = new THREE.MeshPhysicalMaterial({
          color: 0x0d042b,
          metalness: 0.0,
          roughness: 0.11,
          transmission: profile.pbrQuality === 'high' ? 0.7 : 0.4,
          ior: 2.3,
          transparent: true,
          opacity: 0.8,
          envMapIntensity: profile.pbrQuality === 'high' ? 2.0 : 1.5
        });
      }

      const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
      scene.add(crystal);

      // Add six facets around the main crystal
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

      // FIXED: Use lighting that matches your actual scene
      const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
      directionalLight.position.set(2, 8, 5);
      scene.add(directionalLight);

      // Add only as many lights as the profile allows
      if (profile.maxLights > 2) {
        const pointLight1 = new THREE.PointLight(0x00ad1d, 1.0);
        pointLight1.position.set(-5, 3, -5);
        scene.add(pointLight1);
      }

      // Simulate post-processing overhead to match real load
      const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js');
      const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js');
      const { UnrealBloomPass } = await import('three/examples/jsm/postprocessing/UnrealBloomPass.js');

      const composer = new EffectComposer(renderer);
      composer.setSize(256 * profile.renderScale, 256 * profile.renderScale);
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.4, 0.85));

      const samples = [];
      const warmup = 500; // Ignore first 500ms to allow shader compilation
      const measureDuration = 1000; // 1 second of sampling for stability
      const totalDuration = warmup + measureDuration;
      let startTime = 0;
      let lastTime = 0;
      let frameCount = 0;
      let lowFpsTime = 0;

      const testLoop = (time) => {
        if (!startTime) {
          startTime = time;
          lastTime = time;
        }

        const deltaTime = time - lastTime;
        lastTime = time;

        // FIXED: Lighter animation load to match your optimized scene
        crystal.rotation.y += 0.003; // Slower rotation
        crystal.rotation.x += 0.001;

        scene.children.forEach(child => {
          if (child.isMesh && child !== crystal) {
            child.rotation.y += 0.002;
            child.rotation.z += 0.0005;
          }
        });

        // Render frame with post-processing
        composer.render();

        const elapsed = time - startTime;
        progressCallback?.(Math.min(1, elapsed / totalDuration));
        if (elapsed > warmup && deltaTime > 0) {
          const currentFps = 1000 / deltaTime;
          if (currentFps < 20) {
            lowFpsTime += deltaTime;
            if (lowFpsTime > 200) {
              composer.dispose();
              renderer.dispose();
              crystalMaterial.dispose();
              crystalGeometry.dispose();
              resolve({
                avgFps: currentFps,
                minFps: currentFps,
                maxFps: currentFps,
                frameCount,
                samples: samples.length
              });
              return;
            }
          } else {
            lowFpsTime = 0;
          }
          samples.push(currentFps);
          frameCount++;
        }

        if (elapsed < totalDuration) {
          requestAnimationFrame(testLoop);
        } else {
          const avgFps = samples.reduce((a, b) => a + b, 0) / samples.length;
          const sorted = samples.slice().sort((a, b) => a - b);
          const minIndex = Math.floor(sorted.length * 0.05); // 5th percentile
          const maxIndex = Math.floor(sorted.length * 0.95); // 95th percentile
          const minFps = sorted[minIndex] ?? Math.min(...sorted);
          const maxFps = sorted[maxIndex] ?? Math.max(...sorted);

          composer.dispose();
          renderer.dispose();
          crystalMaterial.dispose();
          crystalGeometry.dispose();

          resolve({
            avgFps: avgFps || 0,
            minFps: minFps || 0,
            maxFps: maxFps || 0,
            frameCount,
            samples: samples.length
          });
        }
      };

      progressCallback?.(0);
      requestAnimationFrame(testLoop);
    });

    let bestResult = null;

    for (let i = 0; i < iterations; i++) {
      const result = await runSingleTest((p) =>
        onProgress?.((i + p) / iterations)
      );
      if (!bestResult || result.avgFps > bestResult.avgFps) {
        bestResult = result;
      }
    }
    onProgress?.(1);

    return {
      tier,
      ...bestResult,
      iterations
    };
  }

  // Public methods (unchanged)
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

  // Force a fresh performance test
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

  // Clear all cached data (useful for debugging)
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

  // Subscribe to profile changes
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

  _startRuntimeMonitoring() {
    if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') {
      return; // Not in a browser environment
    }

    const downgradeThresholds = { high: 50, medium: 40 };
    const upgradeThreshold = 60;
    const sampleWindow = 1500; // 1.5 seconds for quicker response
    let lastTime = performance.now();
    let lowFpsDuration = 0;
    let highFpsDuration = 0;

    const check = async (now) => {
      const delta = now - lastTime;
      lastTime = now;
      const fps = 1000 / delta;
      this._fpsBuffer.push({ fps, time: now });
      while (this._fpsBuffer.length && now - this._fpsBuffer[0].time > sampleWindow) {
        this._fpsBuffer.shift();
      }

      if (fps < 20) {
        lowFpsDuration += delta;
      } else {
        lowFpsDuration = 0;
      }

      if (this._fpsBuffer.length && now - this._fpsBuffer[0].time >= sampleWindow) {
        const avg = this._fpsBuffer.reduce((a, b) => a + b.fps, 0) / this._fpsBuffer.length;

        const downgrade = downgradeThresholds[this.tier];
        if (lowFpsDuration > 500) {
          // Emergency downgrade
          if (this.tier === 'high') {
            this.setProfile('medium');
          } else if (this.tier === 'medium') {
            this.setProfile('low');
          }
          lowFpsDuration = 0;
          this._fpsBuffer.length = 0;
        } else if (downgrade && avg < downgrade) {
          if (this.tier === 'high') {
            this.setProfile('medium');
          } else if (this.tier === 'medium') {
            this.setProfile('low');
          }
          this._fpsBuffer.length = 0;
          highFpsDuration = 0;
        } else if ((this.tier === 'low' || this.tier === 'medium') && avg > upgradeThreshold) {
          highFpsDuration += sampleWindow;
          if (highFpsDuration >= 3000) {
            const nextTier = this.tier === 'low' ? 'medium' : 'high';
            try {
              const canvas = document.createElement('canvas');
              canvas.width = canvas.height = 256;
              canvas.style.position = 'absolute';
              canvas.style.top = '-9999px';
              canvas.style.pointerEvents = 'none';
              document.body.appendChild(canvas);
              try {
                const result = await this._testWithActualSceneComplexity(canvas, nextTier, 1);
                if (result.avgFps >= 55 && result.minFps >= 50) {
                  this.setProfile(nextTier);
                }
              } finally {
                if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
              }
            } catch (e) {
              // ignore
            }
            this._fpsBuffer.length = 0;
            highFpsDuration = 0;
          }
        } else {
          highFpsDuration = 0;
        }
      }

      this._monitorHandle = requestAnimationFrame(check);
    };

    if (this._monitorHandle) cancelAnimationFrame(this._monitorHandle);
    this._fpsBuffer.length = 0;
    this._monitorHandle = requestAnimationFrame(check);
  }
}
