// src/App.jsx - UPDATED: Integration with V2 performance and loading system

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './styles/scroll-snap.css';

// UPDATED: Import V2 systems
import { useAssetLoaderV2 } from './hooks/useAssetLoaderV2';
import { usePerformanceV2 } from './hooks/usePerformanceV2';
import LoaderV2 from './ui/LoaderV2';

// Animation coordinator
import MasterAnimationCoordinator from './components/three/MasterAnimationCoordinator';
import { ANIMATION_CONFIG } from './hooks/useUnifiedAnimationController';
import { Euler, Quaternion, Vector3 } from 'three';

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

// Cinematic Movie Titles Effects
import './styles/glow-70s.css';
import { isMobileDevice } from './utils/isMobileDevice.js';

// Convert UI config into animation config
const buildAnimationConfig = (uiConfig) => {
  const toVec = (arr) => new Vector3(...arr);
  const sumVec = (...arrs) =>
    arrs.reduce((acc, arr) => acc.add(new Vector3(...(arr ?? [0, 0, 0]))), new Vector3(0, 0, 0));
  const toQuatFromEulerDeg = (eulerDeg, fallback) => {
    if (!Array.isArray(eulerDeg)) return fallback.clone();
    const [x, y, z] = eulerDeg;
    const euler = new Euler(
      x * (Math.PI / 180),
      y * (Math.PI / 180),
      z * (Math.PI / 180),
      'XYZ'
    );
    return new Quaternion().setFromEuler(euler);
  };

  if (!uiConfig?.cameraPositions) return ANIMATION_CONFIG;

  const globalOffsets = uiConfig.cameraOffsets?.global;
  const zoneOffsets = uiConfig.cameraOffsets?.zones;
  const projectOffsets = uiConfig.cameraOffsets?.projects;
  const cameraTargets = uiConfig.cameraTargets;

  return {
    ...ANIMATION_CONFIG,
    camera: {
      hero: {
        ...ANIMATION_CONFIG.camera.hero,
        position: toVec(uiConfig.cameraPositions.hero),
        target: toVec(cameraTargets?.hero ?? ANIMATION_CONFIG.camera.hero.target.toArray()),
        offsetPosition: sumVec(globalOffsets?.position, zoneOffsets?.hero?.position),
        offsetTarget: sumVec(globalOffsets?.target, zoneOffsets?.hero?.target)
      },
      overview: {
        ...ANIMATION_CONFIG.camera.overview,
        position: toVec(uiConfig.cameraPositions.overview),
        target: toVec(cameraTargets?.overview ?? ANIMATION_CONFIG.camera.overview.target.toArray()),
        offsetPosition: sumVec(globalOffsets?.position, zoneOffsets?.overview?.position),
        offsetTarget: sumVec(globalOffsets?.target, zoneOffsets?.overview?.target)
      },
      about: {
        ...ANIMATION_CONFIG.camera.about,
        position: toVec(uiConfig.cameraPositions.about),
        target: toVec(cameraTargets?.about ?? ANIMATION_CONFIG.camera.about.target.toArray()),
        offsetPosition: sumVec(globalOffsets?.position, zoneOffsets?.about?.position),
        offsetTarget: sumVec(globalOffsets?.target, zoneOffsets?.about?.target)
      },
      projects: {
        empathy: {
          ...ANIMATION_CONFIG.camera.projects.empathy,
          position: toVec(uiConfig.cameraPositions.projects.empathy),
          target: toVec(cameraTargets?.projects?.empathy ?? ANIMATION_CONFIG.camera.projects.empathy.target.toArray()),
          offsetPosition: sumVec(globalOffsets?.position, projectOffsets?.empathy?.position),
          offsetTarget: sumVec(globalOffsets?.target, projectOffsets?.empathy?.target)
        },
        narrative: {
          ...ANIMATION_CONFIG.camera.projects.narrative,
          position: toVec(uiConfig.cameraPositions.projects.narrative),
          target: toVec(cameraTargets?.projects?.narrative ?? ANIMATION_CONFIG.camera.projects.narrative.target.toArray()),
          offsetPosition: sumVec(globalOffsets?.position, projectOffsets?.narrative?.position),
          offsetTarget: sumVec(globalOffsets?.target, projectOffsets?.narrative?.target)
        },
        craft: {
          ...ANIMATION_CONFIG.camera.projects.craft,
          position: toVec(uiConfig.cameraPositions.projects.craft),
          target: toVec(cameraTargets?.projects?.craft ?? ANIMATION_CONFIG.camera.projects.craft.target.toArray()),
          offsetPosition: sumVec(globalOffsets?.position, projectOffsets?.craft?.position),
          offsetTarget: sumVec(globalOffsets?.target, projectOffsets?.craft?.target)
        },
        system: {
          ...ANIMATION_CONFIG.camera.projects.system,
          position: toVec(uiConfig.cameraPositions.projects.system),
          target: toVec(cameraTargets?.projects?.system ?? ANIMATION_CONFIG.camera.projects.system.target.toArray()),
          offsetPosition: sumVec(globalOffsets?.position, projectOffsets?.system?.position),
          offsetTarget: sumVec(globalOffsets?.target, projectOffsets?.system?.target)
        },
        leadership: {
          ...ANIMATION_CONFIG.camera.projects.leadership,
          position: toVec(uiConfig.cameraPositions.projects.leadership),
          target: toVec(
            cameraTargets?.projects?.leadership ?? ANIMATION_CONFIG.camera.projects.leadership.target.toArray()
          ),
          offsetPosition: sumVec(globalOffsets?.position, projectOffsets?.leadership?.position),
          offsetTarget: sumVec(globalOffsets?.target, projectOffsets?.leadership?.target)
        },
        exploration: {
          ...ANIMATION_CONFIG.camera.projects.exploration,
          position: toVec(uiConfig.cameraPositions.projects.exploration),
          target: toVec(
            cameraTargets?.projects?.exploration ?? ANIMATION_CONFIG.camera.projects.exploration.target.toArray()
          ),
          offsetPosition: sumVec(globalOffsets?.position, projectOffsets?.exploration?.position),
          offsetTarget: sumVec(globalOffsets?.target, projectOffsets?.exploration?.target)
        }
      }
    },
    crystal: {
      ...ANIMATION_CONFIG.crystal,
      explodedPositions: {
        empathy: toVec(
          uiConfig.explodedPositions?.empathy ?? ANIMATION_CONFIG.crystal.explodedPositions.empathy.toArray()
        ),
        narrative: toVec(
          uiConfig.explodedPositions?.narrative ?? ANIMATION_CONFIG.crystal.explodedPositions.narrative.toArray()
        ),
        craft: toVec(
          uiConfig.explodedPositions?.craft ?? ANIMATION_CONFIG.crystal.explodedPositions.craft.toArray()
        ),
        system: toVec(
          uiConfig.explodedPositions?.system ?? ANIMATION_CONFIG.crystal.explodedPositions.system.toArray()
        ),
        leadership: toVec(
          uiConfig.explodedPositions?.leadership ?? ANIMATION_CONFIG.crystal.explodedPositions.leadership.toArray()
        ),
        exploration: toVec(
          uiConfig.explodedPositions?.exploration ?? ANIMATION_CONFIG.crystal.explodedPositions.exploration.toArray()
        )
      },
      explodedRotations: {
        empathy: toQuatFromEulerDeg(
          uiConfig.facetRotationsEulerDeg?.empathy,
          ANIMATION_CONFIG.crystal.explodedRotations.empathy
        ),
        narrative: toQuatFromEulerDeg(
          uiConfig.facetRotationsEulerDeg?.narrative,
          ANIMATION_CONFIG.crystal.explodedRotations.narrative
        ),
        craft: toQuatFromEulerDeg(
          uiConfig.facetRotationsEulerDeg?.craft,
          ANIMATION_CONFIG.crystal.explodedRotations.craft
        ),
        system: toQuatFromEulerDeg(
          uiConfig.facetRotationsEulerDeg?.system,
          ANIMATION_CONFIG.crystal.explodedRotations.system
        ),
        leadership: toQuatFromEulerDeg(
          uiConfig.facetRotationsEulerDeg?.leadership,
          ANIMATION_CONFIG.crystal.explodedRotations.leadership
        ),
        exploration: toQuatFromEulerDeg(
          uiConfig.facetRotationsEulerDeg?.exploration,
          ANIMATION_CONFIG.crystal.explodedRotations.exploration
        )
      }
    }
  };
};


function App() {
  // ========================================
  // UPDATED: V2 Performance and Asset Loading System
  // ========================================
  const [isAppReady, setIsAppReady] = useState(false);
  const [initProgress, setInitProgress] = useState(0);
  const [exitLoader, setExitLoader] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  // Progress is now provided directly by hooks

  // UPDATED: Use V2 performance hook
  const {
    profile: performanceProfile,
    tier: performanceTier,
    isReady: performanceReady,
    error: performanceError,
    testResults,
    testProgress: testProgressHook,
    testStatus,
    updateProfile,
    forceRetest,
    clearCache,
    debugInfo
  } = usePerformanceV2();

  // UPDATED: Use V2 asset loader hook
  const {
    progress: assetProgressHook,
    currentAsset,
    loadedAssets,
    totalAssets,
    errors: assetErrors,
    isReady: assetsReady,
    hasErrors: assetHasErrors,
    retry: retryAssets
  } = useAssetLoaderV2(performanceReady ? performanceProfile : null);

  // Track when GLTF models have loaded via Fixed3DCanvas
  const fixedCanvasRef = useRef();
  
  // Basic state hooks
  const [hideAllUI, setHideAllUI] = useState(false);
  const [perfDebug, setPerfDebug] = useState(false);
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

  // Simulate application initialization progress for loader
  useEffect(() => {
    let frame;
    const step = () => {
      setInitProgress((p) => {
        if (p >= 100) return 100;
        frame = requestAnimationFrame(step);
        return Math.min(100, p + 2);
      });
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

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

  // Detect if mobile
  const isMobile = isMobileDevice();

  // ========================================
  // UPDATED: App ready detection with V2 system
  // ========================================
  useEffect(() => {
    if (performanceReady && assetsReady && initProgress >= 100 && !exitLoader) {
      if (import.meta.env.DEV) {
        console.log('🎯 App is ready - V2 system initialized:', {
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
      setInitProgress(100);
      setTimeout(() => setExitLoader(true), 800);
      setTimeout(() => setShowLoader(false), 1400);
    }
  }, [performanceReady, assetsReady, initProgress, exitLoader, performanceTier, performanceProfile]);

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
  
  // UPDATED: Performance config handler with V2 profile management
  const handlePerformanceConfigUpdate = useCallback((newConfig) => {
    if (import.meta.env.DEV) console.log("🔧 Performance config update:", newConfig);

    // Update performance profile through the V2 manager
    if (newConfig.pbrQuality && newConfig.pbrQuality !== performanceProfile.pbrQuality) {
      // This is a tier change, use the proper method
      let newTier = 'medium';
      if (newConfig.pbrQuality === 'high') newTier = 'high';
      else if (newConfig.pbrQuality === 'low') newTier = 'low';

      const overrides = {};
      if (newTier === 'low') overrides.simplifiedAnimations = false;
      if (typeof newConfig.useNormalMaps === 'boolean') overrides.useNormalMaps = newConfig.useNormalMaps;
      updateProfile(newTier, overrides);
    } else if (
      typeof newConfig.renderScale === 'number' &&
      newConfig.renderScale !== performanceProfile.renderScale
    ) {
      // Allow manual adjustment of render scale
      updateProfile(performanceTier, { renderScale: newConfig.renderScale });
    } else if (
      typeof newConfig.simplifiedAnimations === 'boolean' &&
      newConfig.simplifiedAnimations !== performanceProfile.simplifiedAnimations
    ) {
      updateProfile(performanceTier, { simplifiedAnimations: newConfig.simplifiedAnimations });
    } else if (
      typeof newConfig.useNormalMaps === 'boolean' &&
      newConfig.useNormalMaps !== performanceProfile.useNormalMaps
    ) {
      updateProfile(performanceTier, { useNormalMaps: newConfig.useNormalMaps });
    } else {
      // For other config changes, update local effects
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
    if (import.meta.env.DEV) {
      console.log(`🛠️ Performance debug ${next ? 'enabled' : 'disabled'}`);
    }
  }, [perfDebug]);

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
          if (import.meta.env.DEV) console.log(`🛠️ Performance debug ${next ? 'enabled' : 'disabled'}`);
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
      dpr: [
        1,
        Math.min(performanceProfile.maxPixelRatio || 2, window.devicePixelRatio) *
          (performanceProfile.renderScale || 1)
      ]
    };
  }, [performanceProfile, performanceTier]);

  const getOptimalEnvironmentProps = useCallback(() => {
    if (!performanceProfile) return {};
    
    return {
      files: `/assets/environment/prismatic10-${performanceProfile.hdriQuality || 'medium'}.hdr`
    };
  }, [performanceProfile]);

  // UPDATED: Determine loader message and early return before app mounts
  let statusMessage = '';
  if (initProgress < 100) {
    statusMessage = 'Initializing...';
  } else if (!performanceReady) {
    statusMessage = 'Optimizing for your device...';
  } else if (!assetsReady) {
    if (currentAsset && /loaded|failed|timed out/i.test(currentAsset)) {
      statusMessage = 'Loading assets...';
    } else {
      statusMessage = currentAsset || 'Loading assets...';
    }
  } else {
    statusMessage = 'Finishing up...';
  }

  if (!isAppReady && !exitLoader) {
    return (
      <LoaderV2
        initProgress={initProgress / 100}
        assetProgress={assetProgressHook / 100}
        testProgress={testProgressHook / 100}
        statusMessage={statusMessage}
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

      {/* UPDATED: FPS Display with V2 performance tier info */}
      {!hideAllUI && (
        <FpsDisplay 
          visible={true}
          position="top-right"
          showDetails={false}
        />
      )}
      
      {/* UPDATED: Performance alerts with V2 tier-appropriate thresholds */}
      {!hideAllUI && (
        <PerformanceAlert
          visible={true}
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
          key={performanceProfile?.renderScale}
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

      {/* UPDATED: Enhanced Debug Panel with V2 performance system info */}
      {perfDebug && (
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

      {showLoader && (
        <LoaderV2
          initProgress={exitLoader ? 1 : initProgress / 100}
          assetProgress={exitLoader ? 1 : assetProgressHook / 100}
          testProgress={exitLoader ? 1 : testProgressHook / 100}
          statusMessage={exitLoader ? 'Launching...' : statusMessage}
          exiting={exitLoader}
        />
      )}
    </>
  );
}

export default App;
