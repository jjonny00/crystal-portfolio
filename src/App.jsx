// src/App.jsx - FIXED: Proper integration with enhanced performance system

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import './styles/scroll-snap.css';

// Enhanced loading system
import { useAssetLoader } from './hooks/useAssetLoader';
import LoaderV2 from './ui/LoaderV2';

// Animation coordinator
import MasterAnimationCoordinator from './components/three/MasterAnimationCoordinator';
import { ANIMATION_CONFIG } from './hooks/useUnifiedAnimationController';
import { Vector3 } from 'three';

// Layout components
import ScrollablePortfolio from './components/layout/ScrollablePortfolio';
import Fixed3DCanvas from './components/layout/Fixed3DCanvas';

// UI components
import Navigation from './components/ui/Navigation';
import ControlsToggle from './components/ui/ControlsToggle';
import TabbedControlPanel from './components/ui/TabbedControlPanel';
import CrystalControls from './components/ui/CrystalControls';
import MaterialSelector from './components/ui/MaterialSelector';
import PostProcessingControls from './components/ui/PostProcessingControls';
import PerformanceControls from './components/ui/PerformanceControls';
import AccessibilityInstructions from './components/ui/AccessibilityInstructions';
import FpsDisplay, { PerformanceAlert } from './components/ui/FpsDisplay';

// Debug component
import PerformanceDebugPanel from './components/ui/PerformanceDebugPanel';

// Configuration and utilities
import * as defaultConfig from './crystalConfig';
import usePerformance from './hooks/usePerformance';

// Convert UI config into animation config
const buildAnimationConfig = (uiConfig) => {
  const toVec = (arr) => new Vector3(...arr);
  if (!uiConfig?.cameraPositions) return ANIMATION_CONFIG;

  return {
    ...ANIMATION_CONFIG,
    camera: {
      hero: {
        ...ANIMATION_CONFIG.camera.hero,
        position: toVec(uiConfig.cameraPositions.hero)
      },
      overview: {
        ...ANIMATION_CONFIG.camera.overview,
        position: toVec(uiConfig.cameraPositions.overview)
      },
      about: {
        ...ANIMATION_CONFIG.camera.about,
        position: toVec(uiConfig.cameraPositions.about)
      },
      projects: {
        empathy: {
          ...ANIMATION_CONFIG.camera.projects.empathy,
          position: toVec(uiConfig.cameraPositions.projects.empathy)
        },
        narrative: {
          ...ANIMATION_CONFIG.camera.projects.narrative,
          position: toVec(uiConfig.cameraPositions.projects.narrative)
        },
        craft: {
          ...ANIMATION_CONFIG.camera.projects.craft,
          position: toVec(uiConfig.cameraPositions.projects.craft)
        },
        system: {
          ...ANIMATION_CONFIG.camera.projects.system,
          position: toVec(uiConfig.cameraPositions.projects.system)
        },
        leadership: {
          ...ANIMATION_CONFIG.camera.projects.leadership,
          position: toVec(uiConfig.cameraPositions.projects.leadership)
        },
        exploration: {
          ...ANIMATION_CONFIG.camera.projects.exploration,
          position: toVec(uiConfig.cameraPositions.projects.exploration)
        }
      }
    }
  };
};

// Mobile detection
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
};

function App() {
  // ========================================
  // FIXED: Enhanced performance system integration
  // ========================================
  const [isAppReady, setIsAppReady] = useState(false);

  // Track when GLTF models have loaded via Fixed3DCanvas
  const fixedCanvasRef = useRef();
  
  // Basic state hooks
  const [hideAllUI, setHideAllUI] = useState(false);
  const [perfDebug, setPerfDebug] = useState(window.__PERF_DEBUG__ || false);
  const [snapSpeed, setSnapSpeed] = useState('medium');
  const [config, setConfig] = useState({
    ...defaultConfig,
    timing: {
      ...defaultConfig.timing,
      camera: {
        ...defaultConfig.timing.camera,
        facetZoomDuration: 1000,
        facetReturnDuration: 1200
      }
    }
  });
  const [animationConfig, setAnimationConfig] = useState(buildAnimationConfig(defaultConfig));
  const [materialVariant, setMaterialVariant] = useState('default');
  const [showUI, setShowUI] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [effectsEnabled, setEffectsEnabled] = useState({
    bloom: true,
    chromaticAberration: true,
    noise: true,
    vignette: true
  });
  const [postProcessingConfig, setPostProcessingConfig] = useState(config.postProcessing);
  const testingStartRef = useRef(null);
  const loadingStartRef = useRef(null);
  const [testingDuration, setTestingDuration] = useState(null);
  const [loadingDuration, setLoadingDuration] = useState(null);

  // FIXED: Enhanced performance hook with proper error handling
  const {
    profile: performanceProfile,
    tier: performanceTier,
    isReady: performanceReady,
    isInitializing: performanceInitializing,
    error: performanceError,
    testResults,
    testProgress: actualTestProgress,
    testStatus,
    updateProfile,
    forceRetest,
    clearCache,
    debugInfo
  } = usePerformance();

  // FIXED: Asset loader hook with proper performance profile dependency
  const {
    progress,
    currentAsset,
    loadedAssets,
    totalAssets,
    errors,
    isLoading,
    isReady: assetsReady,
    hasErrors,
    retry
  } = useAssetLoader(performanceReady ? performanceProfile : null);

  // Initialize effects from the detected device profile
  useEffect(() => {
    if (performanceProfile?.postProcessing) {
      // Apply unified noise and vignette settings regardless of profile
      const unifiedEffects = {
        ...performanceProfile.postProcessing,
        noise: true,        // Always enabled
        vignette: true      // Always enabled
      };

      setEffectsEnabled(unifiedEffects);

      // Apply unified configuration values
      setPostProcessingConfig({
        ...performanceProfile.postProcessing,
        noise: { opacity: 0.15 },      // Unified value
        vignette: { darkness: 0.7 }    // Unified value
      });
    }
  }, [performanceProfile]);

  // Track phase durations for dynamic overall progress
  useEffect(() => {
    if (performanceInitializing && !testingStartRef.current) {
      testingStartRef.current = performance.now();
    }
    if (performanceReady && testingStartRef.current && testingDuration === null) {
      setTestingDuration(performance.now() - testingStartRef.current);
      testingStartRef.current = null;
    }
  }, [performanceInitializing, performanceReady, testingDuration]);

  useEffect(() => {
    if (isLoading && !loadingStartRef.current) {
      loadingStartRef.current = performance.now();
    }
    if (assetsReady && loadingStartRef.current && loadingDuration === null) {
      setLoadingDuration(performance.now() - loadingStartRef.current);
      loadingStartRef.current = null;
    }
  }, [isLoading, assetsReady, loadingDuration]);

  const computeOverallProgress = useCallback(() => {
    const now = performance.now();
    const testElapsed = testingDuration ?? (testingStartRef.current ? now - testingStartRef.current : 0);
    const testTotal = testingDuration ?? (actualTestProgress > 0 ? testElapsed / (actualTestProgress / 100) : 0);
    const loadElapsed = loadingDuration ?? (loadingStartRef.current ? now - loadingStartRef.current : 0);
    const loadTotal = loadingDuration ?? (progress > 0 ? loadElapsed / (progress / 100) : 0);
    const total = testTotal + loadTotal;
    if (total === 0) return 0;
    return (testElapsed + loadElapsed) / total;
  }, [testingDuration, loadingDuration, actualTestProgress, progress]);

  const overallProgress = computeOverallProgress();

  // Detect if mobile
  const isMobile = isMobileDevice();

  // ========================================
  // FIXED: App ready detection with proper dependencies
  // ========================================
  useEffect(() => {
    if (performanceReady && assetsReady && !isAppReady) {
      if (import.meta.env.DEV) {
        console.log('🎯 App is ready - enhanced system initialized:', {
          performanceReady,
          assetsReady,
          performanceTier,
          performanceProfile: {
            renderScale: performanceProfile.renderScale,
            pbrQuality: performanceProfile.pbrQuality,
            textureQuality: performanceProfile.textureQuality
          }
        });
      }
      setIsAppReady(true);
    }
  }, [performanceReady, assetsReady, isAppReady, performanceTier, performanceProfile]);

  // ========================================
  // Enhanced callbacks with better logging
  // ========================================

  const handleSnapSpeedChange = useCallback((speed) => {
    if (import.meta.env.DEV) console.log('🎯 Changing snap speed to:', speed);
    setSnapSpeed(speed);
  }, []);

  const handleAnimationStateChange = useCallback((newState, prevState) => {
    if (import.meta.env.DEV) {
      console.log('🎬 Animation state change:', { prev: prevState, new: newState });
    }
  }, []);

  const handleWorkClick = useCallback(() => {
    if (import.meta.env.DEV) console.log('Navigate to work section');
  }, []);

  const handleAboutClick = useCallback(() => {
    if (import.meta.env.DEV) console.log('Navigate to about section');
  }, []);

  const handleProcessClick = useCallback(() => {
    setMaterialVariant(prev => {
      const variants = ['default', 'glass', 'gem', 'holographic'];
      const currentIndex = variants.indexOf(prev);
      const nextIndex = (currentIndex + 1) % variants.length;
      return variants[nextIndex];
    });
  }, []);

  const handleContactClick = useCallback(() => {
    if (import.meta.env.DEV) console.log('Navigate to contact section');
  }, []);

  const handleConfigUpdate = useCallback((newConfig) => {
    setConfig(newConfig);
    setAnimationConfig(buildAnimationConfig(newConfig));
  }, []);

  const handleMaterialChange = useCallback((variant) => {
    if (import.meta.env.DEV) console.log("Changing material variant to:", variant);
    setMaterialVariant(variant);
  }, []);
  
  const handleToggleEffect = useCallback((effect, enabled, params = null) => {
    setEffectsEnabled(prev => ({
      ...prev,
      [effect]: enabled
    }));
    
    if (params) {
      setPostProcessingConfig(prev => ({
        ...prev,
        [effect]: {
          ...prev[effect],
          ...params
        }
      }));
    }
  }, []);
  
  // FIXED: Performance config handler with proper profile management
  const handlePerformanceConfigUpdate = useCallback((newConfig) => {
    if (import.meta.env.DEV) console.log("🔧 Performance config update:", newConfig);

    // Update performance profile through the manager
    if (newConfig.pbrQuality && newConfig.pbrQuality !== performanceProfile.pbrQuality) {
      // This is a tier change, use the proper method
      let newTier = 'medium';
      if (newConfig.pbrQuality === 'high') newTier = 'high';
      else if (newConfig.pbrQuality === 'low') newTier = 'low';

      const overrides = newTier === 'low' ? { simplifiedAnimations: false } : {};
      updateProfile(newTier, overrides);
    } else if (
      typeof newConfig.simplifiedAnimations === 'boolean' &&
      newConfig.simplifiedAnimations !== performanceProfile.simplifiedAnimations
    ) {
      updateProfile(performanceTier, { simplifiedAnimations: newConfig.simplifiedAnimations });
    } else {
      // For other config changes, we would need to extend the system
      // For now, just update the local effects
      if (newConfig.postProcessing) {
        setEffectsEnabled(newConfig.postProcessing);
        setPostProcessingConfig(newConfig.postProcessing);
      }
    }
  }, [performanceProfile, performanceTier, updateProfile]);

  const toggleUI = useCallback(() => {
    setShowUI(!showUI);
  }, [showUI]);

  const togglePerfDebug = useCallback(() => {
    const next = !perfDebug;
    window.__PERF_DEBUG__ = next;
    setPerfDebug(next);
    if (import.meta.env.DEV || next) {
      console.log(`🛠️ Performance debug ${next ? 'enabled' : 'disabled'}`);
    }
  }, [perfDebug]);

  // ========================================
  // FIXED: Enhanced loading screen with performance info
  // ========================================


  // Toggle body scrolling based on app readiness
  useEffect(() => {
    document.body.style.overflow = isAppReady ? 'auto' : 'hidden';
  }, [isAppReady]);

  // UI Hide Toggle Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInputField = e.target.tagName === 'INPUT' || 
                          e.target.tagName === 'TEXTAREA' || 
                          e.target.isContentEditable;
      
      if (isInputField) return;
      
      if (e.key === 'u' || e.key === 'U') {
        if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
          e.preventDefault();
          setHideAllUI(prev => {
            const newState = !prev;
            if (import.meta.env.DEV) console.log(`🎨 UI Hidden: ${newState ? 'ON' : 'OFF'}`);
            return newState;
          });
        }
      }

      if (e.key === 'p' || e.key === 'P') {
        if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
          e.preventDefault();
          const next = !window.__PERF_DEBUG__;
          window.__PERF_DEBUG__ = next;
          setPerfDebug(next);
          if (import.meta.env.DEV || next) console.log(`🛠️ Performance debug ${next ? 'enabled' : 'disabled'}`);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Get canvas props based on performance profile
  const getOptimalCanvasProps = useCallback(() => {
    if (!performanceProfile) return {};
    
    return {
      gl: {
        antialias: performanceProfile.antialiasing !== false,
        powerPreference: performanceTier === 'high' ? 'high-performance' : 'default'
      },
      dpr: [1, Math.min(performanceProfile.maxPixelRatio || 2, window.devicePixelRatio)]
    };
  }, [performanceProfile, performanceTier]);

  const getOptimalEnvironmentProps = useCallback(() => {
    if (!performanceProfile) return {};
    
    return {
      files: `/assets/environment/prismatic09-${performanceProfile.hdriQuality || 'medium'}.hdr`
    };
  }, [performanceProfile]);

  // Show loader overlay during initialization and asset loading
  if (!isAppReady) {
    if (!performanceReady) {
      return (
        <LoaderV2
          phase="testing"
          phaseProgress={actualTestProgress / 100}
          overallProgress={overallProgress}
          statusMessage={testStatus}
        />
      );
    }
    return (
      <LoaderV2
        phase="loading"
        phaseProgress={progress / 100}
        overallProgress={overallProgress}
        statusMessage={currentAsset}
      />
    );
  }

  return (
    <>
      {/* UI Hide Toggle Button */}
      <button
        onClick={() => setHideAllUI(!hideAllUI)}
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          zIndex: 99999,
          backgroundColor: hideAllUI ? '#64ffda' : 'rgba(0, 0, 0, 0.7)',
          color: hideAllUI ? '#000' : 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        {hideAllUI ? 'Show UI (U)' : 'Hide UI (U)'}
      </button>

      {/* Navigation Bar */}
      {!hideAllUI && (
        <Navigation
          onWorkClick={handleWorkClick}
          onAboutClick={handleAboutClick}
          onProcessClick={handleProcessClick}
          onContactClick={handleContactClick}
        />
      )}

      {/* FIXED: FPS Display with performance tier info */}
      {!hideAllUI && (
        <FpsDisplay 
          visible={true}
          position="top-right"
          showDetails={false}
        />
      )}
      
      {/* FIXED: Performance alerts with tier-appropriate thresholds */}
      {!hideAllUI && (
        <PerformanceAlert 
          visible={true}
          threshold={performanceProfile?.minAcceptableFPS || 25}
          onPerformanceIssue={(data) => {
            if (import.meta.env.DEV) console.warn('Performance issue detected:', data);
          }}
        />
      )}

      {/* Master Animation Coordinator */}
      <MasterAnimationCoordinator
        debugMode={import.meta.env.DEV}
        onAnimationStateChange={handleAnimationStateChange}
        config={animationConfig}
      >
        {/* Fixed 3D Canvas */}
        <Fixed3DCanvas
          ref={fixedCanvasRef}
          materialVariant={materialVariant}
          effectsEnabled={effectsEnabled}
          postProcessingConfig={postProcessingConfig}
          performanceProfile={performanceProfile}
          config={config}
          canvasProps={getOptimalCanvasProps()}
          environmentProps={getOptimalEnvironmentProps()}
          isMobile={isMobile}
        />
      </MasterAnimationCoordinator>

      {/* Scrollable Content */}
      <ScrollablePortfolio 
        snapSpeed={snapSpeed}
        hideContent={hideAllUI}
      />

      {/* UI Controls */}
      {!hideAllUI && (
        <ControlsToggle 
          showUI={showUI} 
          toggleUI={toggleUI} 
          disabled={false}
        />
      )}
      
      {!hideAllUI && showUI && (
        <TabbedControlPanel 
          visible={true}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { label: 'Crystal' },
            { label: 'Materials' },
            { label: 'Effects' },
            { label: 'Performance' },
            { label: 'Scroll' }
          ]}
        >
          <CrystalControls onUpdate={handleConfigUpdate} />
          
          <div>
            <MaterialSelector currentVariant={materialVariant} onChange={handleMaterialChange} />
          </div>
          
          <PostProcessingControls 
            effectsEnabled={effectsEnabled}
            onToggleEffect={handleToggleEffect}
            visible={true} 
            config={config}
          />
          
          <PerformanceControls
            performanceConfig={performanceProfile}
            onConfigUpdate={handlePerformanceConfigUpdate}
            visible={true}
            onToggleDebug={togglePerfDebug}
            debugEnabled={perfDebug}
          />

          <div>
            <h2 style={{ margin: '0 0 15px 0', fontSize: '16px', display: 'flex', alignItems: 'center' }}>
              <span role="img" aria-label="Scroll" style={{ marginRight: '8px' }}>📜</span>
              Scroll Settings
            </h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                fontSize: '14px', 
                marginBottom: '10px', 
                display: 'block',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                Snap Speed:
              </label>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '8px',
                marginBottom: '10px'
              }}>
                {['fast', 'medium', 'slow', 'extra-slow', 'no-snap'].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSnapSpeedChange(speed)}
                    style={{
                      backgroundColor: snapSpeed === speed ? '#64ffda' : 'rgba(255, 255, 255, 0.1)',
                      color: snapSpeed === speed ? '#000' : 'white',
                      border: `1px solid ${snapSpeed === speed ? '#64ffda' : 'rgba(255, 255, 255, 0.2)'}`,
                      padding: '8px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: snapSpeed === speed ? 'bold' : 'normal',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s ease',
                      minHeight: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {speed.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </TabbedControlPanel>
      )}
      
      {!hideAllUI && (
        <AccessibilityInstructions visible={true} />
      )}

      {/* FIXED: Enhanced Debug Panel with performance system info */}
      {(import.meta.env.DEV || perfDebug) && (
        <PerformanceDebugPanel
          performanceConfig={performanceProfile}
          hasInitialized={performanceReady}
          initialProfileApplied={!!performanceProfile}
          tier={performanceTier}
          testResults={testResults}
          debugInfo={debugInfo}
          onForceRetest={forceRetest}
          onClearCache={clearCache}
        />
      )}
    </>
  );
}

export default App;
