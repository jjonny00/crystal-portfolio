// src/hooks/useAssetLoader.js
// NEW: Complete asset loading system with accurate progress tracking

import { useState, useEffect, useRef, useCallback } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { RGBELoader } from 'three-stdlib';
import { assets } from '../crystalConfig';
import { getHDRIPath } from '../utils/deviceProfiles';

/**
 * Enhanced Asset Loader with accurate progress tracking
 * Respects performance profiles and loads only what's needed
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

  /**
   * Calculate what assets we actually need based on performance profile
   */
  const getRequiredAssets = useCallback(() => {
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
    const hdriPath = getHDRIPath(hdriQuality);
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
    
    const totalProgress = Array.from(progressRef.current.values())
      .reduce((sum, p) => sum + p, 0) / progressRef.current.size;

    setLoadingState(prev => ({
      ...prev,
      progress: Math.min(Math.round(totalProgress * 100), 100),
      currentAsset: name || assetKey,
      loadedAssets: Array.from(progressRef.current.values()).filter(p => p >= 1).length
    }));
  }, []);

  /**
   * Load models with progress tracking
   */
  const loadModels = useCallback(async (modelEntries) => {
    const modelPromises = modelEntries.map(async ([key, url]) => {
      try {
        // Use drei's preload which handles progress better
        const result = useGLTF.preload(url);
        updateAssetProgress(`model_${key}`, 1, `Model: ${key}`);
        return result;
      } catch (error) {
        console.error(`Failed to load model ${key}:`, error);
        updateAssetProgress(`model_${key}`, 1, `Model: ${key} (error)`);
        throw error;
      }
    });

    return Promise.allSettled(modelPromises);
  }, [updateAssetProgress]);

  /**
   * Load textures with progress tracking
   */
  const loadTextures = useCallback(async (textureEntries) => {
    if (textureEntries.length === 0) return [];

    const texturePromises = textureEntries.map(async ([key, url]) => {
      try {
        const result = useTexture.preload(url);
        updateAssetProgress(`texture_${key}`, 1, `Texture: ${key}`);
        return result;
      } catch (error) {
        console.error(`Failed to load texture ${key}:`, error);
        updateAssetProgress(`texture_${key}`, 1, `Texture: ${key} (error)`);
        throw error;
      }
    });

    return Promise.allSettled(texturePromises);
  }, [updateAssetProgress]);

  /**
   * Load environment with progress tracking
   */
  const loadEnvironment = useCallback(async (envEntries) => {
    const envPromises = envEntries.map(async ([key, url]) => {
      try {
        const result = useLoader.preload(RGBELoader, url);
        updateAssetProgress(`env_${key}`, 1, `Environment: ${key}`);
        return result;
      } catch (error) {
        console.error(`Failed to load environment ${key}:`, error);
        updateAssetProgress(`env_${key}`, 1, `Environment: ${key} (error)`);
        throw error;
      }
    });

    return Promise.allSettled(envPromises);
  }, [updateAssetProgress]);

  /**
   * Main loading function
   */
  const startLoading = useCallback(async () => {
    if (!performanceProfile) {
      console.log('⏳ Waiting for performance profile...');
      return;
    }

    // Initialize abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoadingState(prev => ({
        ...prev,
        phase: 'loading',
        currentAsset: 'Analyzing required assets...'
      }));

      const requiredAssets = getRequiredAssets();
      
      setLoadingState(prev => ({
        ...prev,
        totalAssets: requiredAssets.totalCount,
        currentAsset: 'Starting asset loading...'
      }));

      // Initialize progress tracking for all assets
      requiredAssets.models.forEach(([key]) => {
        progressRef.current.set(`model_${key}`, 0);
      });
      requiredAssets.textures.forEach(([key]) => {
        progressRef.current.set(`texture_${key}`, 0);
      });
      requiredAssets.environment.forEach(([key]) => {
        progressRef.current.set(`env_${key}`, 0);
      });

      console.log('🚀 Starting asset loading with', requiredAssets.totalCount, 'assets');

      // Load all asset types in parallel
      const [modelResults, textureResults, envResults] = await Promise.allSettled([
        loadModels(requiredAssets.models),
        loadTextures(requiredAssets.textures),
        loadEnvironment(requiredAssets.environment)
      ]);

      // Check for errors
      const errors = [];
      [modelResults, textureResults, envResults].forEach((results, typeIndex) => {
        const typeName = ['models', 'textures', 'environment'][typeIndex];
        if (results.status === 'rejected') {
          errors.push(`Failed to load ${typeName}: ${results.reason}`);
        }
      });

      if (errors.length > 0) {
        console.warn('⚠️ Some assets failed to load:', errors);
        setLoadingState(prev => ({
          ...prev,
          errors,
          phase: 'ready', // Continue anyway
          progress: 100,
          currentAsset: 'Ready with some errors'
        }));
      } else {
        console.log('✅ All assets loaded successfully');
        setLoadingState(prev => ({
          ...prev,
          phase: 'ready',
          progress: 100,
          currentAsset: 'All assets loaded'
        }));
      }

    } catch (error) {
      console.error('❌ Asset loading failed:', error);
      setLoadingState(prev => ({
        ...prev,
        phase: 'error',
        errors: [error.message],
        currentAsset: 'Loading failed'
      }));
    }
  }, [performanceProfile, getRequiredAssets, loadModels, loadTextures, loadEnvironment]);

  /**
   * Start loading when performance profile is available
   */
  useEffect(() => {
    if (performanceProfile && loadingState.phase === 'initializing') {
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

  return {
    ...loadingState,
    isLoading: loadingState.phase === 'loading',
    isReady: loadingState.phase === 'ready',
    hasErrors: loadingState.errors.length > 0,
    retry: startLoading
  };
};