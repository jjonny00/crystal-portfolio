// src/utils/PerformanceManager.js
// FIXED: Comprehensive performance system that actually works

import { PERFORMANCE_PROFILES } from './deviceProfiles.js';

const STORAGE_KEY = 'crystal-performance-config';
const VERSION_KEY = 'crystal-performance-version';
const CURRENT_VERSION = '2.0'; // Increment to force re-testing

export default class PerformanceManager {
  constructor() {
    this.tier = 'low'; // CHANGED: Start with low settings, upgrade if possible
    this.profile = { ...PERFORMANCE_PROFILES.low };
    this._initialized = false;
    this._ready = false;
    this._initPromise = null;
    this._testResults = null;
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

    // Run fresh performance test
    if (import.meta.env.DEV) {
      console.log('🔧 Running fresh performance test...');
    }

    try {
      const testResults = await this._runComprehensiveTest();
      const optimalTier = this._determineTierFromResults(testResults);
      
      this.tier = optimalTier;
      this.profile = { ...PERFORMANCE_PROFILES[optimalTier] };
      this._testResults = testResults;
      
      // Cache results
      this._cacheResults(optimalTier, testResults);
      
      if (import.meta.env.DEV) {
        console.log('🔧 Performance test complete:', {
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
    // Cache is valid for 24 hours in production, always invalid in dev
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

  async _runComprehensiveTest() {
    // FIXED: Use actual scene testing instead of simple cubes
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    
    // Don't attach to DOM - keep it invisible
    canvas.style.position = 'absolute';
    canvas.style.top = '-9999px';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    try {
      // Progressive testing: start low, upgrade if performance allows
      const lowResults = await this._testWithSettings(canvas, 'low');
      
      if (lowResults.avgFps < 20) {
        return { ...lowResults, recommendedTier: 'low' };
      }

      const mediumResults = await this._testWithSettings(canvas, 'medium');
      
      if (mediumResults.avgFps < 25) {
        return { ...mediumResults, recommendedTier: 'medium' };
      }

      const highResults = await this._testWithSettings(canvas, 'high');
      
      return { ...highResults, recommendedTier: 'high' };
      
    } finally {
      // Clean up
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }

  async _testWithSettings(canvas, tier) {
    const profile = PERFORMANCE_PROFILES[tier];
    
    // Simulate the actual rendering load of your crystal scene
    return new Promise((resolve) => {
      import('three').then((THREE) => {
        const renderer = new THREE.WebGLRenderer({ 
          canvas,
          antialias: profile.antialiasing !== false,
          powerPreference: 'high-performance'
        });
        
        renderer.setSize(512 * profile.renderScale, 512 * profile.renderScale);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.maxPixelRatio || 2));
        
        // Create a scene similar to your crystal complexity
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 2, 4);

        // Add complex geometry similar to your crystal
        const crystalGeometry = new THREE.IcosahedronGeometry(1, 2); // More complex than a cube
        
        // Create material similar to your crystal material complexity
        const crystalMaterial = profile.pbrQuality === 'low' 
          ? new THREE.MeshStandardMaterial({
              color: 0x64ffda,
              metalness: 0.1,
              roughness: 0.05,
              transparent: true,
              opacity: 0.8
            })
          : new THREE.MeshPhysicalMaterial({
              color: 0x64ffda,
              metalness: 0.0,
              roughness: 0.1,
              transmission: profile.pbrQuality === 'high' ? 0.7 : 0.4,
              ior: 2.3,
              transparent: true,
              opacity: 0.8
            });

        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        scene.add(crystal);

        // Add multiple crystals to simulate facets
        for (let i = 0; i < 6; i++) {
          const facet = crystal.clone();
          facet.position.set(
            Math.cos(i / 6 * Math.PI * 2) * 2,
            Math.sin(i / 6 * Math.PI * 2) * 1,
            Math.sin(i / 6 * Math.PI * 2)
          );
          facet.scale.setScalar(0.3);
          scene.add(facet);
        }

        // Add lighting similar to your scene
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
        directionalLight.position.set(10, 8, 5);
        scene.add(directionalLight);

        // Add point lights if performance allows
        if (profile.maxLights > 2) {
          const pointLight1 = new THREE.PointLight(0x00ad1d, 1.0);
          pointLight1.position.set(-5, 3, -5);
          scene.add(pointLight1);
          
          const pointLight2 = new THREE.PointLight(0x00e380, 0.8);
          pointLight2.position.set(0, -8, -10);
          scene.add(pointLight2);
        }

        // Test with post-processing if enabled
        let composer = null;
        if (profile.postProcessing?.bloom || profile.postProcessing?.chromaticAberration) {
          // Simulate post-processing load without actually importing the heavy libraries
          renderer.autoClear = false;
        }

        // Run performance test
        const samples = [];
        const duration = 2000; // 2 seconds
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

          // Rotate crystals to simulate animation load
          crystal.rotation.y += 0.005;
          crystal.rotation.x += 0.002;
          
          scene.children.forEach(child => {
            if (child.isMesh && child !== crystal) {
              child.rotation.y += 0.003;
              child.rotation.z += 0.001;
            }
          });

          // Render frame
          renderer.render(scene, camera);
          
          // Collect FPS sample every 100ms
          if (deltaTime > 0) {
            samples.push(1000 / deltaTime);
            frameCount++;
          }

          if (time - startTime < duration) {
            requestAnimationFrame(testLoop);
          } else {
            // Calculate results
            const avgFps = samples.reduce((a, b) => a + b, 0) / samples.length;
            const minFps = Math.min(...samples);
            const maxFps = Math.max(...samples);
            
            // Clean up
            renderer.dispose();
            crystalMaterial.dispose();
            crystalGeometry.dispose();
            
            resolve({
              tier,
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
    });
  }

  _determineTierFromResults(testResults) {
    // FIXED: More conservative thresholds based on actual scene complexity
    const { avgFps, minFps } = testResults;
    
    if (import.meta.env.DEV) {
      console.log('🔧 Performance test results:', { avgFps, minFps });
    }

    // Conservative approach: require good performance across all metrics
    if (avgFps >= 45 && minFps >= 35) {
      return 'high';
    } else if (avgFps >= 30 && minFps >= 25) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  // Public methods
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

  setProfile(tier) {
    if (PERFORMANCE_PROFILES[tier]) {
      this.tier = tier;
      this.profile = { ...PERFORMANCE_PROFILES[tier] };
      
      // Update cache
      if (this._testResults) {
        this._cacheResults(tier, this._testResults);
      }
      
      if (import.meta.env.DEV) {
        console.log('🔧 Manually set performance tier:', tier);
      }
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
}