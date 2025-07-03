// src/hooks/useAssetLoader.js
// FIXED: Proper asset loading with real progress tracking

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * FIXED: Asset Loader that actually tracks loading progress properly
 * The issue was that drei's preload functions don't provide progress callbacks
 */
export const useAssetLoader = (performanceProfile, deviceProfile) => {
  const [loadingState, setLoadingState] = useState({
    progress: 0,
    phase: 'initializing', // 'initializing', 'loading', 'ready', 'error'
    loadedAssets: 0,
    totalAssets: 0,
    currentAsset: '',
    errors: []
  });

  const progressRef = useRef(new Map());
  const abortControllerRef = useRef(null);
  const hasStartedLoading = useRef(false);

  /**
   * Calculate what assets we actually need based on performance profile
   */
  const getRequiredAssets = useCallback(() => {
    // Import assets here to avoid circular dependencies
    const assets = {
      models: {
        crystalWhole: '/assets/models/CrystalWhole.glb',
        facetEmpathy: '/assets/models/FacetEmpathy.glb',
        facetNarrative: '/assets/models/FacetNarrative.glb',
        facetCraft: '/assets/models/FacetCraft.glb',
        facetSystem: '/assets/models/FacetSystem.glb',
        facetLeadership: '/assets/models/FacetLeadership.glb',
        facetExploration: '/assets/models/FacetExploration.glb'
      },
      textures: {
        normalMap: '/assets/textures/quartz-normal07.png'
      },
      environment: {
        hdri: '/assets/environment/prismatic09-low.hdr'
      }
    };

    const requiredAssets = {
      models: Object.entries(assets.models), // Always load all models
      textures: [],
      environment: []
    };

    // Only load textures if performance profile allows
    if (performanceProfile?.useNormalMaps && assets.textures?.normalMap) {
      requiredAssets.textures.push(['normalMap', assets.textures.normalMap]);
    }

    // Load appropriate HDRI quality
    const hdriQuality = performanceProfile?.hdriQuality || 'low';
    const hdriPath = `/assets/environment/prismatic09-${hdriQuality}.hdr`;
    requiredAssets.environment.push(['hdri', hdriPath]);

    const totalCount = 
      requiredAssets.models.length + 
      requiredAssets.textures.length + 
      requiredAssets.environment.length;

    console.log('📦 Required assets based on performance profile:', {
      models: requiredAssets.models.length,
      textures: requiredAssets.textures.length,
      environment: requiredAssets.environment.length,
      total: totalCount,
      useNormalMaps: performanceProfile?.useNormalMaps,
      usePBR: performanceProfile?.usePBR,
      hdriQuality
    });

    return { ...requiredAssets, totalCount };
  }, [performanceProfile]);

  /**
   * Update progress for individual asset
   */
  const updateAssetProgress = useCallback((assetKey, progress, name = '') => {
    progressRef.current.set(assetKey, progress);
    
    const allProgress = Array.from(progressRef.current.values());
    const totalProgress = allProgress.reduce((sum, p) => sum + p, 0) / allProgress.length;
    const loadedCount = allProgress.filter(p => p >= 1).length;

    setLoadingState(prev => ({
      ...prev,
      progress: Math.min(Math.round(totalProgress * 100), 100),
      currentAsset: name || assetKey,
      loadedAssets: loadedCount
    }));

    console.log(`📊 Asset progress: ${assetKey} = ${Math.round(progress * 100)}%, Total: ${Math.round(totalProgress * 100)}%`);
  }, []);

  /**
   * FIXED: Load a single asset with real progress tracking
   */
  const loadAssetWithProgress = useCallback((url, assetKey, name) => {
    return new Promise((resolve, reject) => {
      try {
        // Create a loading manager to track progress
        const startTime = Date.now();
        updateAssetProgress(assetKey, 0, `Loading ${name}...`);

        // Use fetch to load the asset and track progress
        fetch(url, { signal: abortControllerRef.current.signal })
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to load ${name}: ${response.status}`);
            }

            const contentLength = response.headers.get('content-length');
            if (!contentLength) {
              // If we can't track progress, simulate it
              updateAssetProgress(assetKey, 0.5, `Processing ${name}...`);
              return response.blob();
            }

            const total = parseInt(contentLength, 10);
            let loaded = 0;

            const reader = response.body.getReader();
            const chunks = [];

            const pump = () => {
              return reader.read().then(({ done, value }) => {
                if (done) {
                  updateAssetProgress(assetKey, 1, `${name} loaded`);
                  const blob = new Blob(chunks);
                  return blob;
                }

                chunks.push(value);
                loaded += value.length;
                const progress = loaded / total;
                
                updateAssetProgress(assetKey, progress, `Loading ${name}... ${Math.round(progress * 100)}%`);
                
                return pump();
              });
            };

            return pump();
          })
          .then(() => {
            const loadTime = Date.now() - startTime;
            console.log(`✅ ${name} loaded in ${loadTime}ms`);
            resolve();
          })
          .catch(error => {
            console.error(`❌ Failed to load ${name}:`, error);
            updateAssetProgress(assetKey, 1, `${name} (error)`);
            reject(error);
          });

      } catch (error) {
        console.error(`❌ Error loading ${name}:`, error);
        updateAssetProgress(assetKey, 1, `${name} (error)`);
        reject(error);
      }
    });
  }, [updateAssetProgress]);

  /**
   * FIXED: Load all assets with proper progress tracking
   */
  const loadAllAssets = useCallback(async (requiredAssets) => {
    const assetPromises = [];

    // Load models
    requiredAssets.models.forEach(([key, url]) => {
      assetPromises.push(
        loadAssetWithProgress(url, `model_${key}`, `Model: ${key}`)
      );
    });

    // Load textures
    requiredAssets.textures.forEach(([key, url]) => {
      assetPromises.push(
        loadAssetWithProgress(url, `texture_${key}`, `Texture: ${key}`)
      );
    });

    // Load environment
    requiredAssets.environment.forEach(([key, url]) => {
      assetPromises.push(
        loadAssetWithProgress(url, `env_${key}`, `Environment: ${key}`)
      );
    });

    console.log(`🚀 Starting to load ${assetPromises.length} assets...`);

    // Load all assets in parallel
    const results = await Promise.allSettled(assetPromises);
    
    // Check for errors
    const errors = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        errors.push(`Asset ${index + 1} failed: ${result.reason.message}`);
      }
    });

    return errors;
  }, [loadAssetWithProgress]);

  /**
   * FIXED: Main loading function with proper sequencing
   */
  const startLoading = useCallback(async () => {
    if (!performanceProfile || hasStartedLoading.current) {
      return;
    }

    hasStartedLoading.current = true;
    console.log('🎯 Starting asset loading process...');
    const loadStart = Date.now();

    // Initialize abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoadingState(prev => ({
        ...prev,
        phase: 'loading',
        currentAsset: 'Analyzing required assets...',
        progress: 0
      }));

      // Small delay to show the loading screen
      await new Promise(resolve => setTimeout(resolve, 500));

      const requiredAssets = getRequiredAssets();
      
      setLoadingState(prev => ({
        ...prev,
        totalAssets: requiredAssets.totalCount,
        currentAsset: 'Starting asset loading...'
      }));

      // Initialize progress tracking for all assets
      progressRef.current.clear();
      requiredAssets.models.forEach(([key]) => {
        progressRef.current.set(`model_${key}`, 0);
      });
      requiredAssets.textures.forEach(([key]) => {
        progressRef.current.set(`texture_${key}`, 0);
      });
      requiredAssets.environment.forEach(([key]) => {
        progressRef.current.set(`env_${key}`, 0);
      });

      // Load all assets
      const errors = await loadAllAssets(requiredAssets);

      // Finish loading
      const duration = Date.now() - loadStart;
      if (errors.length > 0) {
        console.warn('⚠️ Some assets failed to load:', errors);
        console.log(`🏁 Asset loading completed in ${duration}ms with errors`);
        setLoadingState(prev => ({
          ...prev,
          errors,
          phase: 'ready',
          progress: 100,
          currentAsset: 'Ready with some errors'
        }));
      } else {
        console.log(`✅ All assets loaded successfully in ${duration}ms`);
        setLoadingState(prev => ({
          ...prev,
          phase: 'ready',
          progress: 100,
          currentAsset: 'All assets loaded'
        }));
      }

    } catch (error) {
      const duration = Date.now() - loadStart;
      console.error('❌ Asset loading failed:', error);
      console.log(`🏁 Asset loading aborted after ${duration}ms due to error`);
      setLoadingState(prev => ({
        ...prev,
        phase: 'error',
        errors: [error.message],
        currentAsset: 'Loading failed'
      }));
    }
  }, [performanceProfile, getRequiredAssets, loadAllAssets]);

  /**
   * FIXED: Start loading when performance profile is available
   */
  useEffect(() => {
    if (performanceProfile && loadingState.phase === 'initializing' && !hasStartedLoading.current) {
      console.log('🎯 Performance profile available, starting asset loading');
      startLoading();
    }
  }, [performanceProfile, loadingState.phase, startLoading]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Reset function to retry loading
   */
  const retry = useCallback(() => {
    hasStartedLoading.current = false;
    progressRef.current.clear();
    setLoadingState({
      progress: 0,
      phase: 'initializing',
      loadedAssets: 0,
      totalAssets: 0,
      currentAsset: '',
      errors: []
    });
  }, []);

  return {
    ...loadingState,
    isLoading: loadingState.phase === 'loading',
    isReady: loadingState.phase === 'ready',
    hasErrors: loadingState.errors.length > 0,
    retry
  };
};