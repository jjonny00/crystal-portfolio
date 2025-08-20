// src/hooks/usePerformanceV2.js
// FIXED: Enhanced performance hook with proper error handling and progress tracking

import { useState, useEffect, useCallback } from 'react';
import PerformanceManagerV2 from '../utils/PerformanceManagerV2.js';

// Single manager instance to avoid multiple tests
const manager = new PerformanceManagerV2();

export const usePerformanceV2 = () => {
  const [profile, setProfile] = useState(manager.getProfile());
  const [tier, setTier] = useState(manager.getTier());
  const [isReady, setIsReady] = useState(manager.isReady());
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);
  const [testResults, setTestResults] = useState(manager.getTestResults() || null);
  const [testProgress, setTestProgress] = useState(0);
  const [testStatus, setTestStatus] = useState('');

  // Initialize performance manager with progress tracking
  useEffect(() => {
    let mounted = true;

    const initializeManager = async () => {
      if (manager.isReady()) {
        // Already ready - use cached results
        setProfile(manager.getProfile());
        setTier(manager.getTier());
        setIsReady(true);
        setTestResults(manager.getTestResults() || null);
        
        if (import.meta.env.DEV) {
          console.log('🔧 Using cached performance profile:', manager.getTier());
        }
        return;
      }

      setIsInitializing(true);
      setError(null);
      setTestProgress(0);
      setTestStatus('');

      // Set up progress callback for real-time updates
      manager.setProgressCallback((percentage, message) => {
        if (mounted) {
          setTestProgress(percentage);
          setTestStatus(message || '');
          
          // Update global HTML loader with testing progress
          window.updateImmediateLoader?.({
            test: percentage,
            phase: 'Testing Performance',
            currentAsset: message,
          });
        }
      });

      try {
        if (import.meta.env.DEV) {
          console.log('🔧 Starting conservative performance testing...');
        }

        await manager.initialize();

        if (mounted) {
          setProfile(manager.getProfile());
          setTier(manager.getTier());
          setIsReady(true);
          setTestResults(manager.getTestResults() || null);
          setIsInitializing(false);
          setTestProgress(100);

          if (import.meta.env.DEV) {
            console.log('🔧 Conservative performance testing complete:', {
              tier: manager.getTier(),
              profile: manager.getProfile(),
              testResults: manager.getTestResults()
            });
          }
        }
      } catch (err) {
        console.error('Performance testing failed:', err);
        
        if (mounted) {
          setError(err.message);
          setIsInitializing(false);
          setTestProgress(100);
          setTestStatus('Test failed - using safe defaults');
          
          // Fall back to low profile
          setProfile(manager.getProfile());
          setTier(manager.getTier());
          setIsReady(true);
        }
      }
    };

    initializeManager();

    return () => {
      mounted = false;
      // Clean up progress callback
      manager.setProgressCallback(null);
    };
  }, []);

  // Listen for automatic profile changes
  useEffect(() => {
    const unsubscribe = manager.subscribe(({ tier: t, profile: p }) => {
      setTier(t);
      setProfile(p);
      
      if (import.meta.env.DEV) {
        console.log('🔧 Performance profile changed:', t);
      }
    });
    return unsubscribe;
  }, []);

  // Update profile manually
  const updateProfile = useCallback((newTier, overrides = {}) => {
    console.log('usePerformanceV2: updateProfile called', { newTier, overrides });
    try {
      manager.setProfile(newTier, overrides);
      setProfile(manager.getProfile());
      setTier(manager.getTier());
      setTestResults(manager.getTestResults() || null);
      console.log('usePerformanceV2: profile updated to', newTier);
    } catch (err) {
      console.error('Failed to update performance profile:', err);
      setError(err.message);
    }
  }, []);

  // Force retest with progress tracking
  const forceRetest = useCallback(async () => {
    console.log('usePerformanceV2: forceRetest called');
    setIsInitializing(true);
    setError(null);
    setIsReady(false);
    setTestProgress(0);
    setTestStatus('');

    // Set up progress callback for retest
    manager.setProgressCallback((percentage, message) => {
      setTestProgress(percentage);
      setTestStatus(message || '');

      // Update global HTML loader
      window.updateImmediateLoader?.({
        test: percentage,
        phase: 'Retesting Performance',
        currentAsset: message,
      });
    });

    try {
      console.log('usePerformanceV2: starting performance retest');

      await manager.forceRetest();

      setProfile(manager.getProfile());
      setTier(manager.getTier());
      setTestResults(manager.getTestResults() || null);
      setIsReady(true);
      setIsInitializing(false);
      setTestProgress(100);

      console.log('usePerformanceV2: performance retest complete', {
        tier: manager.getTier(),
        results: manager.getTestResults()
      });
    } catch (err) {
      console.error('Performance retest failed:', err);
      setError(err.message);
      setIsInitializing(false);
      setTestProgress(100);
      setTestStatus('Retest failed');
      setIsReady(true); // Still mark as ready with fallback profile
    } finally {
      // Clean up progress callback
      manager.setProgressCallback(null);
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    manager.clearCache();
    if (import.meta.env.DEV) {
      console.log('🔧 Performance cache cleared');
    }
  }, []);

  // Get performance recommendations
  const getRecommendations = useCallback(() => {
    const recommendations = [];
    
    if (tier === 'low') {
      recommendations.push({
        type: 'info',
        message: 'Using optimized settings for your device',
        action: 'Try closing other applications for better performance'
      });
    }
    
    if (error) {
      recommendations.push({
        type: 'error',
        message: 'Performance testing encountered issues',
        action: 'Try refreshing the page or retesting'
      });
    }

    return recommendations;
  }, [tier, error]);

  // Debug info
  const debugInfo = {
    isInitializing,
    error,
    testResults,
    testProgress,
    testStatus,
    managerReady: manager.isReady(),
    hasCache: !!testResults,
    recommendations: getRecommendations()
  };

  return {
    // Core state
    profile,
    tier,
    isReady,
    isInitializing,
    error,
    
    // Test information
    testResults,
    testProgress,
    testStatus,
    
    // Actions
    updateProfile,
    forceRetest,
    clearCache,
    
    // Utilities
    getRecommendations,
    debugInfo
  };
};

export default usePerformanceV2;