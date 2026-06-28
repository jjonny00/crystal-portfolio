// src/hooks/useAssetLoaderV2.js
// FIXED: Asset loader hook with real GLTF progress tracking

import { useState, useEffect, useRef, useCallback } from 'react';
import AssetLoaderV2 from '../utils/AssetLoaderV2.js';

// Descriptors for all GLTF models used in the app
const MODEL_DESCRIPTORS = [
  { key: 'crystalWhole', url: '/assets/models/CrystalWhole.glb' },
  { key: 'project01', url: '/assets/models/Project01.glb' },
  { key: 'project02', url: '/assets/models/Project02.glb' },
  { key: 'project03', url: '/assets/models/Project03.glb' },
  { key: 'project04', url: '/assets/models/Project04.glb' },
  { key: 'project05', url: '/assets/models/Project05.glb' },
  { key: 'project06', url: '/assets/models/Project06.glb' }
];

export const useAssetLoaderV2 = (performanceProfile) => {
  const [loadingState, setLoadingState] = useState({
    progress: 0,
    phase: 'initializing',
    loadedAssets: 0,
    totalAssets: 0,
    currentAsset: 'Starting up...',
    errors: []
  });

  const assetLoaderRef = useRef(null);
  const hasStartedLoading = useRef(false);
  const previousProfile = useRef(null);

  /**
   * Get required assets based on performance profile
   */
  const getRequiredAssets = useCallback(() => {
    if (!performanceProfile) return [];

    // Transform model descriptors into asset objects
    const modelAssets = MODEL_DESCRIPTORS.map(({ key, url }) => ({
      type: 'model',
      key,
      url,
      name: `Model: ${key}`
    }));

    // Optional texture asset
    const textureAssets = performanceProfile.useNormalMaps
      ? [{
          type: 'texture',
          key: 'normalMap',
          url: '/assets/textures/raw-crystal-normal01.png',
          name: 'Normal Map Texture'
        }]
      : [];

    // HDRI environment asset
    const hdriQuality = performanceProfile.hdriQuality || 'low';
    const hdriAssets = [{
      type: 'environment',
      key: 'hdri',
      url: `/assets/environment/prismatic-detailed01-${hdriQuality}.hdr`,
      name: `Environment (${hdriQuality})`
    }];

    const assets = [...modelAssets, ...textureAssets, ...hdriAssets];

    if (import.meta.env.DEV) {
      console.log('📦 Required assets for loading:', {
        total: assets.length,
        models: assets.filter(a => a.type === 'model').length,
        textures: assets.filter(a => a.type === 'texture').length,
        environment: assets.filter(a => a.type === 'environment').length,
        profile: performanceProfile.pbrQuality
      });
    }

    return assets;
  }, [performanceProfile]);

  /**
   * Handle progress updates from AssetLoaderV2
   */
  const handleProgress = useCallback((progressData) => {
    const { type, progress, currentAsset, loaded, total } = progressData;

    const stats = assetLoaderRef.current?.getLoadingStats();
    let overallProgress = 0;

    if (['gltf_download', 'texture_download', 'hdri_download'].includes(type) && stats) {
      const completedCount = stats.loaded;
      if (progressData.total) {
        const fraction = progressData.loaded / progressData.total;
        overallProgress = ((completedCount + fraction) / stats.total) * 100;
      } else {
        overallProgress = stats.progress || progress || 0;
      }
    } else {
      overallProgress = stats?.progress || progress || 0;
    }

    setLoadingState(prev => ({
      ...prev,
      progress: Math.round(overallProgress),
      currentAsset: currentAsset || prev.currentAsset,
      loadedAssets: stats?.loaded || prev.loadedAssets,
      phase: overallProgress >= 100 ? 'ready' : 'loading'
    }));

    window.updateImmediateLoader?.({
      assets: overallProgress,
      phase: 'Loading Assets',
      currentAsset: currentAsset || 'Loading...',
    });

    if (import.meta.env.DEV && type !== 'item') {
      console.log(`📊 Asset loading progress: ${type} - ${Math.round(overallProgress)}%`, {
        currentAsset,
        loaded,
        total
      });
    }
  }, []);

  /**
   * Handle loading errors
   */
  const handleError = useCallback((url, error) => {
    console.error('Asset loading error:', url, error);
    
    setLoadingState(prev => ({
      ...prev,
      errors: [...prev.errors, `Failed to load: ${url}`]
    }));
  }, []);

  /**
   * Load all assets using AssetLoaderV2
   */
  const loadAllAssets = useCallback(async () => {
    if (!performanceProfile) {
      if (import.meta.env.DEV) {
        console.warn('📦 No performance profile available for asset loading');
      }
      return;
    }

    const requiredAssets = getRequiredAssets();
    
    if (requiredAssets.length === 0) {
      if (import.meta.env.DEV) {
        console.warn('📦 No assets to load');
      }
      setLoadingState(prev => ({
        ...prev,
        progress: 100,
        phase: 'ready',
        currentAsset: 'No assets to load'
      }));
      return;
    }

    // Create new asset loader
    assetLoaderRef.current = new AssetLoaderV2();
    
    // Set up callbacks
    assetLoaderRef.current.setProgressCallback(handleProgress);
    assetLoaderRef.current.setErrorCallback(handleError);

    // Initialize state
    setLoadingState(prev => ({
      ...prev,
      totalAssets: requiredAssets.length,
      loadedAssets: 0,
      progress: 0,
      phase: 'loading',
      currentAsset: 'Starting asset loading...',
      errors: []
    }));

    try {
      if (import.meta.env.DEV) {
        console.log('🚀 Starting asset loading with real progress tracking...');
      }

      const result = await assetLoaderRef.current.loadAssets(requiredAssets);
      
      // Final update
      setLoadingState(prev => ({
        ...prev,
        phase: 'ready',
        progress: 100,
        loadedAssets: result.loadedAssets,
        totalAssets: result.totalAssets,
        currentAsset: result.success ? 'All assets loaded successfully' : 'Loading completed with errors',
        errors: result.failedAssets > 0 ? 
          [...prev.errors, `${result.failedAssets} assets failed to load`] : 
          prev.errors
      }));

      // Update global loader
      window.updateImmediateLoader?.({
        assets: 100,
        phase: 'Assets Ready',
        currentAsset: 'All assets loaded',
      });

      if (import.meta.env.DEV) {
        console.log('✅ Asset loading complete:', result);
      }
      
    } catch (error) {
      console.error('❌ Asset loading failed:', error);
      
      setLoadingState(prev => ({
        ...prev,
        phase: 'error',
        errors: [...prev.errors, error.message],
        currentAsset: 'Loading failed'
      }));
    }
  }, [performanceProfile, getRequiredAssets, handleProgress, handleError]);

  /**
   * Start loading when performance profile is available
   */
  useEffect(() => {
    if (!performanceProfile) return;

    // Only start loading if profile changed or we haven't started
    if (previousProfile.current !== performanceProfile || !hasStartedLoading.current) {
      previousProfile.current = performanceProfile;
      hasStartedLoading.current = true;

      if (import.meta.env.DEV) {
        console.log('🚀 Starting asset loading with performance profile:', performanceProfile.pbrQuality);
      }

      // Small delay to ensure global loader is ready
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
    
    // Clean up previous loader
    if (assetLoaderRef.current) {
      assetLoaderRef.current.dispose();
      assetLoaderRef.current = null;
    }
    
    setLoadingState({
      progress: 0,
      phase: 'initializing',
      loadedAssets: 0,
      totalAssets: 0,
      currentAsset: 'Retrying...',
      errors: []
    });

    if (import.meta.env.DEV) {
      console.log('🔄 Retrying asset loading...');
    }
  }, []);

  /**
   * Get loaded asset by key
   */
  const getAsset = useCallback((key) => {
    return assetLoaderRef.current?.getAsset(key) || null;
  }, []);

  /**
   * Check if asset is loaded
   */
  const hasAsset = useCallback((key) => {
    return assetLoaderRef.current?.hasAsset(key) || false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (assetLoaderRef.current) {
        assetLoaderRef.current.dispose();
        assetLoaderRef.current = null;
      }
    };
  }, []);

  return {
    // State
    ...loadingState,
    isLoading: loadingState.phase === 'loading',
    isReady: loadingState.phase === 'ready',
    hasErrors: loadingState.errors.length > 0,
    
    // Actions
    retry,
    getAsset,
    hasAsset,
    
    // Asset loader instance (for advanced usage)
    assetLoader: assetLoaderRef.current
  };
};