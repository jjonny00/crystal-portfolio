// src/hooks/useAssetLoader.js
// FIXED: Immediate progress updates and proper asset tracking

import { useState, useEffect, useRef, useCallback } from 'react';
import { preloadAssets } from '../utils/preloadAssets';

/**
 * FIXED: Asset Loader with immediate progress updates
 */
export const useAssetLoader = (performanceProfile) => {
  const [loadingState, setLoadingState] = useState({
    progress: 0,
    phase: 'initializing',
    loadedAssets: 0,
    totalAssets: 0,
    currentAsset: 'Starting up...',
    errors: []
  });

  const progressRef = useRef(new Map());
  const hasStartedLoading = useRef(false);

  /**
   * Update progress immediately and call global HTML loader
   */
  const updateProgress = useCallback((assetKey, progress, name = '') => {
    progressRef.current.set(assetKey, progress);
    
    const allProgress = Array.from(progressRef.current.values());
    const totalProgress = allProgress.reduce((sum, p) => sum + p, 0) / Math.max(allProgress.length, 1);
    const loadedCount = allProgress.filter(p => p >= 1).length;
    const finalProgress = Math.min(Math.round(totalProgress * 100), 100);

    // Update React state
    setLoadingState(prev => ({
      ...prev,
      progress: finalProgress,
      currentAsset: name || assetKey,
      loadedAssets: loadedCount,
      phase: finalProgress === 100 ? 'ready' : 'loading'
    }));

    // Notify HTML loader for immediate progress updates
    window.updateImmediateLoader?.({
      assets: finalProgress,
      phase: 'Loading Assets',
      currentAsset: name || assetKey,
    });

    if (import.meta.env.DEV) console.log(`📊 Asset progress: ${assetKey} = ${Math.round(progress * 100)}%, Total: ${finalProgress}%`);
  }, []);

  /**
   * Get required assets based on performance profile
   */
  const getRequiredAssets = useCallback(() => {
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

    const requiredAssets = [];

    // Always load all models
    Object.entries(assets.models).forEach(([key, url]) => {
      requiredAssets.push({ type: 'model', key, url, name: `Model: ${key}` });
    });

    // Load textures if performance allows
    if (performanceProfile?.useNormalMaps && assets.textures?.normalMap) {
      requiredAssets.push({ 
        type: 'texture', 
        key: 'normalMap', 
        url: assets.textures.normalMap, 
        name: 'Texture: Normal Map' 
      });
    }

    // Load HDRI environment
    const hdriQuality = performanceProfile?.hdriQuality;
    const hdriPath = `/assets/environment/prismatic09-${hdriQuality}.hdr`;
    // Preload models, textures and HDRI for quicker subsequent access
    preloadAssets(hdriQuality);
    requiredAssets.push({ 
      type: 'environment', 
      key: 'hdri', 
      url: hdriPath, 
      name: 'Environment: HDRI' 
    });

    if (import.meta.env.DEV) console.log('📦 Required assets:', {
      total: requiredAssets.length,
      models: requiredAssets.filter(a => a.type === 'model').length,
      textures: requiredAssets.filter(a => a.type === 'texture').length,
      environment: requiredAssets.filter(a => a.type === 'environment').length
    });

    return requiredAssets;
  }, [performanceProfile]);

  /**
   * Load single asset with immediate progress updates
   */

  const loadSingleAsset = useCallback((asset) => {
    return new Promise((resolve) => {
      const startTime = Date.now();

      // Start loading immediately
      updateProgress(asset.key, 0, `Loading ${asset.name}...`);

      if (asset.type === 'model') {
        // Models are already preloaded via drei loaders
        updateProgress(asset.key, 1, `${asset.name} preloaded`);
        if (import.meta.env.DEV) console.log(`✅ ${asset.name} preloaded`);
        resolve();
        return;
      }

      fetch(asset.url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load ${asset.name}: ${response.status}`);
          }

          const contentLength = response.headers.get('content-length');
          
          if (!contentLength) {
            // No content length - simulate progress
            updateProgress(asset.key, 0.5, `Processing ${asset.name}...`);
            return response.blob().then(blob => {
              updateProgress(asset.key, 1, `${asset.name} loaded`);
              return blob;
            });
          }

          // Track real progress
          const total = parseInt(contentLength, 10);
          let loaded = 0;

          const reader = response.body.getReader();
          const chunks = [];

          const pump = () => {
            return reader.read().then(({ done, value }) => {
              if (done) {
                updateProgress(asset.key, 1, `${asset.name} loaded`);
                return new Blob(chunks);
              }

              chunks.push(value);
              loaded += value.length;
              const progress = loaded / total;
              
              updateProgress(asset.key, progress, `Loading ${asset.name}... ${Math.round(progress * 100)}%`);
              
              return pump();
            });
          };

          return pump();
        })
        .then(() => {
          const loadTime = Date.now() - startTime;
          if (import.meta.env.DEV) console.log(`✅ ${asset.name} loaded in ${loadTime}ms`);
          resolve();
        })
        .catch(error => {
          if (import.meta.env.DEV) console.error(`❌ Failed to load ${asset.name}:`, error);
          updateProgress(asset.key, 1, `${asset.name} (error)`);
          // Don't reject - continue loading other assets
          resolve();
        });
    });
  }, [updateProgress]);

  /**
   * Load all assets with immediate progress
   */
  const loadAllAssets = useCallback(async () => {
    const requiredAssets = getRequiredAssets();
    
    // Initialize progress for all assets
    setLoadingState(prev => ({
      ...prev,
      totalAssets: requiredAssets.length,
      phase: 'loading'
    }));


    // Initialize progress tracking
    progressRef.current.clear();
    requiredAssets.forEach(asset => {
      progressRef.current.set(asset.key, 0);
    });

    // Load all assets in parallel for maximum speed
    const loadPromises = requiredAssets.map(asset => loadSingleAsset(asset));
    
    try {
      await Promise.all(loadPromises);
      
      // Final update
      setLoadingState(prev => ({
        ...prev,
        phase: 'ready',
        progress: 100,
        currentAsset: 'All assets loaded'
      }));


      if (import.meta.env.DEV) console.log('✅ All assets loaded successfully');
      
    } catch (error) {
      if (import.meta.env.DEV) console.error('❌ Asset loading failed:', error);
      setLoadingState(prev => ({
        ...prev,
        phase: 'error',
        errors: [error.message],
        currentAsset: 'Loading failed'
      }));
    }
  }, [getRequiredAssets, loadSingleAsset]);

  /**
   * Start loading when performance profile is available
   */
  useEffect(() => {
    if (performanceProfile && !hasStartedLoading.current) {
      hasStartedLoading.current = true;
      if (import.meta.env.DEV) console.log('🚀 Starting asset loading with performance profile');
      
      // Small delay to ensure HTML loader is ready
      setTimeout(() => {
        loadAllAssets();
      }, 100);
    }
  }, [performanceProfile, loadAllAssets]);

  /**
   * Retry function
   */
  const retry = useCallback(() => {
    hasStartedLoading.current = false;
    progressRef.current.clear();
    setLoadingState({
      progress: 0,
      phase: 'initializing',
      loadedAssets: 0,
      totalAssets: 0,
      currentAsset: 'Retrying...',
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