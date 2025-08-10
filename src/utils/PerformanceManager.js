// src/utils/PerformanceManager.js
// FIXED: Conservative performance system that trusts original settings

import { PERFORMANCE_PROFILES } from './deviceProfiles.js';

const STORAGE_KEY = 'crystal-performance-config';
const VERSION_KEY = 'crystal-performance-version';
const CURRENT_VERSION = '2.2'; // Increment to force re-testing with new conservative approach

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

    // FIXED: Conservative testing approach - start with medium, only test for upgrades
    if (import.meta.env.DEV) {
      console.log('🔧 Running conservative performance test...');
    }

    try {
      const testResults = await this._runConservativeTest();
      const optimalTier = this._determineTierFromResults(testResults);
      
      this.tier = optimalTier;
      this.profile = { ...PERFORMANCE_PROFILES[optimalTier] };
      this._testResults = testResults;
      
      // Cache results
      this._cacheResults(optimalTier, testResults);
      
      if (import.meta.env.DEV) {
        console.log('🔧 Conservative performance test complete:', {
          tier: optimalTier,
          avgFps: testResults.avgFps,
          profile: this.profile
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
      
      if (cached && version === CURRENT_VERSION) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Failed to read cached performance data:', error);
    }
    return null;
  }

  _isCacheValid(cachedData) {
    // Cache is valid for 24 hours in production, always invalid in dev for testing
    if (import.meta.env.DEV) return false;
    
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
        devicePixelRatio: window.devicePixelRatio
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      
    } catch (error) {
      console.warn('Failed to cache performance data:', error);
    }
  }

  async _runConservativeTest() {
    // Report test phases for better progress tracking
    this._reportProgress(0, 'Starting performance test...');

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    
    canvas.style.position = 'absolute';
    canvas.style.top = '-9999px';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    try {
      const iterations = 3;
      
      // Test medium quality
      this._reportProgress(20, 'Testing medium quality...');
      const mediumResults = await this._testWithActualSceneComplexity(canvas, 'medium', iterations);

      // Only try high quality if medium performs excellently
      if (mediumResults.avgFps >= 50 && mediumResults.minFps >= 40) {
        this._reportProgress(60, 'Testing high quality...');
        const highResults = await this._testWithActualSceneComplexity(canvas, 'high', iterations);
        
        if (highResults.avgFps >= 40 && highResults.minFps >= 30) {
          this._reportProgress(95, 'High quality test passed');
          return { ...highResults, recommendedTier: 'high' };
        }
      }
      
      // Only downgrade to low if medium performs poorly
      if (mediumResults.avgFps < 25 || mediumResults.minFps < 20) {
        this._reportProgress(60, 'Testing low quality...');
        const lowResults = await this._testWithActualSceneComplexity(canvas, 'low', iterations);
        this._reportProgress(95, 'Low quality test completed');
        return { ...lowResults, recommendedTier: 'low' };
      }
      
      // Default to medium
      this._reportProgress(95, 'Medium quality test completed');
      return { ...mediumResults, recommendedTier: 'medium' };
      
    } finally {
      // Clean up
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      this._reportProgress(100, 'Performance test complete');
    }
  }

  _reportProgress(percentage, message) {
    if (this._progressCallback) {
      this._progressCallback(percentage, message);
    }
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

    // FIXED: Report progress during test
    if (import.meta.env.DEV) {
      console.log('🔧 Running conservative performance test...');
    }

    try {
      const testResults = await this._runConservativeTest();
      const optimalTier = this._determineTierFromResults(testResults);
      
      this.tier = optimalTier;
      this.profile = { ...PERFORMANCE_PROFILES[optimalTier] };
      this._testResults = testResults;
      
      // Cache results
      this._cacheResults(optimalTier, testResults);
      
      if (import.meta.env.DEV) {
        console.log('🔧 Conservative performance test complete:', {
          tier: optimalTier,
          avgFps: testResults.avgFps,
          profile: this.profile
        });
      }
      
    } catch (error) {
      console.warn('Performance test failed, using medium profile:', error);
      this.tier = 'medium';
      this.profile = { ...PERFORMANCE_PROFILES.medium };
    }

    // FIXED: Ensure _ready is set after everything completes
    this._ready = true;
    this._startRuntimeMonitoring();
    
    // Final progress report
    this._reportProgress(100, 'Initialization complete');
  }


  async _testWithActualSceneComplexity(canvas, tier, iterations = 3) {
    const profile = PERFORMANCE_PROFILES[tier];
    const THREE = await import('three');

    const runSingleTest = () => new Promise((resolve) => {
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: profile.antialiasing !== false,
        powerPreference: 'default' // FIXED: Don't force high-performance mode in test
      });

      // FIXED: Use smaller render scale for testing to avoid test being harder than real scene
      const testRenderScale = Math.min(profile.renderScale, 0.8);
      renderer.setSize(256 * testRenderScale, 256 * testRenderScale);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.maxPixelRatio || 2));

      // Create scene that matches your actual crystal complexity
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 2, 4);

      // FIXED: Use simpler geometry that better matches your optimized scene
      const crystalGeometry = new THREE.IcosahedronGeometry(1, 1); // Less complex than before

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

      // FIXED: Add only 3 facets to match your optimized scene (not 6)
      for (let i = 0; i < 3; i++) {
        const facet = crystal.clone();
        facet.position.set(
          Math.cos(i / 3 * Math.PI * 2) * 1.5,
          Math.sin(i / 3 * Math.PI * 2) * 0.8,
          Math.sin(i / 3 * Math.PI * 2) * 0.5
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

      // FIXED: Don't simulate post-processing overhead - test real rendering load only

      const samples = [];
      const warmup = 200; // Ignore first 200ms
      const measureDuration = 1500; // 1.5 seconds of sampling
      const totalDuration = warmup + measureDuration;
      let startTime = 0;
      let lastTime = 0;
      let frameCount = 0;

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

        // Render frame
        renderer.render(scene, camera);

        const elapsed = time - startTime;
        if (elapsed > warmup && deltaTime > 0) {
          samples.push(1000 / deltaTime);
          frameCount++;
        }

        if (elapsed < totalDuration) {
          requestAnimationFrame(testLoop);
        } else {
          const avgFps = samples.reduce((a, b) => a + b, 0) / samples.length;
          const minFps = Math.min(...samples);
          const maxFps = Math.max(...samples);

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

      requestAnimationFrame(testLoop);
    });

    let aggregated = {
      avgFps: 0,
      minFps: 0,
      maxFps: 0,
      frameCount: 0,
      samples: 0
    };

    for (let i = 0; i < iterations; i++) {
      const result = await runSingleTest();
      aggregated.avgFps += result.avgFps;
      aggregated.minFps += result.minFps;
      aggregated.maxFps += result.maxFps;
      aggregated.frameCount += result.frameCount;
      aggregated.samples += result.samples;
    }

    return {
      tier,
      avgFps: aggregated.avgFps / iterations,
      minFps: aggregated.minFps / iterations,
      maxFps: aggregated.maxFps / iterations,
      frameCount: Math.round(aggregated.frameCount / iterations),
      samples: Math.round(aggregated.samples / iterations),
      iterations
    };
  }

  _determineTierFromResults(testResults) {
    // FIXED: Much more conservative thresholds that trust devices that were working before
    const { avgFps, minFps } = testResults;

    if (import.meta.env.DEV) {
      console.log('🔧 Performance test results:', { avgFps, minFps });
    }

    // Determine tier with a buffer around the 60 FPS target
    // High: 58+ avg, 55+ min
    if (avgFps >= 58 && minFps >= 55) {
      return 'high';
    }
    // Medium: 40+ avg, 35+ min
    else if (avgFps >= 40 && minFps >= 35) {
      return 'medium';
    }
    // Low: anything below the medium thresholds
    else {
      return 'low';
    }
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

    // Downgrade when sustained FPS falls below 55 for either high or medium tiers
    const downgradeThresholds = { high: 55, medium: 55 };
    const sampleWindow = 180; // ~3 seconds at 60 FPS
    let lastTime = performance.now();

    const check = (now) => {
      const delta = now - lastTime;
      lastTime = now;
      const fps = 1000 / delta;
      this._fpsBuffer.push(fps);
      if (this._fpsBuffer.length > sampleWindow) this._fpsBuffer.shift();

      const threshold = downgradeThresholds[this.tier];
      if (threshold && this._fpsBuffer.length === sampleWindow) {
        const avg = this._fpsBuffer.reduce((a, b) => a + b, 0) / this._fpsBuffer.length;
        if (avg < threshold) {
          if (this.tier === 'high') {
            this.setProfile('medium');
          } else if (this.tier === 'medium') {
            this.setProfile('low');
          }
          this._fpsBuffer.length = 0;
        }
      }

      this._monitorHandle = requestAnimationFrame(check);
    };

    if (this._monitorHandle) cancelAnimationFrame(this._monitorHandle);
    this._fpsBuffer.length = 0;
    this._monitorHandle = requestAnimationFrame(check);
  }
}
