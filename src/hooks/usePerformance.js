// src/hooks/usePerformance.js
// FIXED: Proper performance hook with error handling and debug info

import { useState, useEffect, useCallback } from 'react';
import PerformanceManager from '../utils/PerformanceManager';

// Single manager instance to avoid multiple tests
const manager = new PerformanceManager();

export const usePerformance = () => {
  const [profile, setProfile] = useState(manager.getProfile());
  const [tier, setTier] = useState(manager.getTier());
  const [isReady, setIsReady] = useState(manager.isReady());
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);
  const [testResults, setTestResults] = useState(manager.getTestResults());
  const [testProgress, setTestProgress] = useState(0); // NEW: Track test progress
  const [testStatus, setTestStatus] = useState(''); // NEW: Track status message

  // Initialize performance manager
  useEffect(() => {
    let mounted = true;

    const initializeManager = async () => {
      if (manager.isReady()) {
        // Already ready
        setProfile(manager.getProfile());
        setTier(manager.getTier());
        setIsReady(true);
        setTestResults(manager.getTestResults());
        return;
      }

      setIsInitializing(true);
      setError(null);
      setTestProgress(0);
      setTestStatus('');

      // FIXED: Set up progress callback
      manager.setProgressCallback((percentage, message) => {
        if (mounted) {
          setTestProgress(percentage);
          setTestStatus(message || '');
          // Update global HTML loader too
          window.updateImmediateLoader?.({
            test: percentage,
            phase: 'Testing Performance',
            currentAsset: message,
          });
        }
      });

      try {
        if (import.meta.env.DEV) {
          console.log('🔧 Initializing performance manager...');
        }

        await manager.initialize();

        if (mounted) {
          setProfile(manager.getProfile());
          setTier(manager.getTier());
          setIsReady(true);
          setTestResults(manager.getTestResults());
          setIsInitializing(false);
          setTestProgress(100); // FIXED: Ensure 100% on completion

          if (import.meta.env.DEV) {
            console.log('🔧 Performance manager initialized:', {
              tier: manager.getTier(),
              profile: manager.getProfile(),
              testResults: manager.getTestResults()
            });
          }
        }
      } catch (err) {
        console.error('Failed to initialize performance manager:', err);
        
        if (mounted) {
            setError(err.message);
            setIsInitializing(false);
            setTestProgress(100); // Complete even on error
            setTestStatus(err.message);
          // Fall back to medium profile
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
    });
    return unsubscribe;
  }, []);

  // Update profile manually
  const updateProfile = useCallback((newTier, overrides = {}) => {
    try {
      manager.setProfile(newTier, overrides);
      setProfile(manager.getProfile());
      setTier(manager.getTier());
      
      if (import.meta.env.DEV) {
        console.log('🔧 Performance profile updated to:', newTier);
      }
    } catch (err) {
      console.error('Failed to update performance profile:', err);
      setError(err.message);
    }
  }, []);

  // Force retest
  const forceRetest = useCallback(async () => {
    setIsInitializing(true);
    setError(null);
    setIsReady(false);
    setTestProgress(0);
    setTestStatus('');

    try {
      if (import.meta.env.DEV) {
        console.log('🔧 Forcing performance retest...');
      }

      await manager.forceRetest();
      
      setProfile(manager.getProfile());
      setTier(manager.getTier());
      setTestResults(manager.getTestResults());
      setIsReady(true);
      setIsInitializing(false);

      if (import.meta.env.DEV) {
        console.log('🔧 Performance retest complete:', {
          tier: manager.getTier(),
          results: manager.getTestResults()
        });
      }
    } catch (err) {
      console.error('Performance retest failed:', err);
      setError(err.message);
      setIsInitializing(false);
      setIsReady(true); // Still mark as ready with fallback profile
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    manager.clearCache();
    if (import.meta.env.DEV) {
      console.log('🔧 Performance cache cleared');
    }
  }, []);

  // Debug info
  const debugInfo = {
    isInitializing,
    error,
    testResults,
    managerReady: manager.isReady(),
    hasCache: !!testResults
  };

  return {
    profile,
    tier,
    isReady,
    isInitializing,
    error,
    testResults,
    testProgress,
    testStatus,
    updateProfile,
    forceRetest,
    clearCache,
    debugInfo: {
      ...debugInfo,
      testProgress,
      testStatus
    }
  };
};

export default usePerformance;