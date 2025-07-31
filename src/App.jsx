// src/App.jsx - FIXED: Integration with enhanced performance system

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import './styles/scroll-snap.css';

// Enhanced loading system
import { useAssetLoader } from './hooks/useAssetLoader';
import EnhancedLoadingScreen from './components/ui/EnhancedLoadingScreen';

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
import { useDeviceProfile } from './hooks/useDeviceProfile';
import { usePerformanceProfiler } from './performance/usePerformanceProfiler.jsx';

const APP_VERSION = '0.0.0';
const PERFORMANCE_STORAGE_KEY = 'crystal-performance-config';
const HISTORY_STORAGE_PREFIX = 'perf-history';

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
  // ENHANCED: App ready state with better tracking
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
  const [performanceConfig, setPerformanceConfig] = useState(null);


  // ENHANCED: Device profile hook with better debugging
  const {
    performanceProfile: devicePerformanceProfile,
    deviceProfile,
    getOptimalCanvasProps,
    getOptimalEnvironmentProps,
    updateExternalPerformanceConfig,
    markAsInitialized,
    hasInitialized,
    isDetecting,
    debugInfo
  } = useDeviceProfile({
    enableDebugLogging: true,
    enableOrientationLock: false,
    appVersion: APP_VERSION
  });

  // Initialize effects from the detected device profile
  useEffect(() => {
    if (devicePerformanceProfile?.postProcessing) {
      setEffectsEnabled(devicePerformanceProfile.postProcessing);
      setPostProcessingConfig(devicePerformanceProfile.postProcessing);
    }
  }, [devicePerformanceProfile]);

  // ENHANCED: Asset loader hook
  const {
    progress,
    phase,
    currentAsset,
    loadedAssets,
    totalAssets,
    errors,
    isLoading,
    isReady,
    hasErrors,
    retry
  } = useAssetLoader(devicePerformanceProfile, deviceProfile);

  // Performance profiler hook
  const {
    TestScene,
    startProfiler,
    cancelProfiler,
    progress: profilerProgress,
    isProfiling
  } = usePerformanceProfiler(devicePerformanceProfile, deviceProfile);

  const [profileConfig, setProfileConfig] = useState(null);
  const [hasCachedProfile, setHasCachedProfile] = useState(false);

  // Load cached performance config if available
  useEffect(() => {
    if (!profileConfig && !hasCachedProfile) {
      try {
        const key = PERFORMANCE_STORAGE_KEY;
        const stored = localStorage.getItem(key);
        if (stored) {
          const obj = JSON.parse(stored);
          if (!obj.version || obj.version === APP_VERSION) {
            setProfileConfig(obj.config || obj);
            setHasCachedProfile(true);
          } else {
            localStorage.removeItem(key);
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error('Failed to load cached profile', err);
      }
    }
  }, [profileConfig, hasCachedProfile]);

  // Detect if mobile
  const isMobile = isMobileDevice();

  // Sync effects with the current performance configuration
  useEffect(() => {
    if (performanceConfig?.postProcessing) {
      setEffectsEnabled(performanceConfig.postProcessing);
      setPostProcessingConfig(performanceConfig.postProcessing);
    }
  }, [performanceConfig]);

  // ========================================
  // ENHANCED: Callbacks with better logging
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
  
  const handlePerformanceConfigUpdate = useCallback((newConfig) => {
    if (import.meta.env.DEV) console.log("🔧 Manual performance config update:", newConfig);
    setPerformanceConfig(newConfig);

    if (newConfig?.postProcessing) {
      setEffectsEnabled(newConfig.postProcessing);
      setPostProcessingConfig(newConfig.postProcessing);
    }

    if (hasInitialized && updateExternalPerformanceConfig) {
      if (import.meta.env.DEV) console.log("📤 Sending manual config to device profile");
      updateExternalPerformanceConfig(newConfig);
    }
  }, [hasInitialized, updateExternalPerformanceConfig]);

  const saveProfileResult = useCallback((result) => {
    if (!result?.config) return;
    setProfileConfig(result.config);
    try {
      const key = PERFORMANCE_STORAGE_KEY;
      localStorage.setItem(key, JSON.stringify({ version: APP_VERSION, config: result.config }));
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to save performance config:', err);
    }
    try {
      const histKey = HISTORY_STORAGE_PREFIX;
      const entry = { timestamp: Date.now(), fps: Math.round(result.avg || 0) };
      const existing = JSON.parse(localStorage.getItem(histKey) || '[]');
      existing.push(entry);
      localStorage.setItem(histKey, JSON.stringify(existing));
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to record performance history:', err);
    }
  }, []);

  const handleForceRetest = useCallback(() => {
    try {
      const key = PERFORMANCE_STORAGE_KEY;
      localStorage.removeItem(key);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to clear cached profile', err);
    }
    setProfileConfig(null);
    setHasCachedProfile(false);
    startProfiler(100).then(saveProfileResult);
  }, [startProfiler, saveProfileResult]);

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
  // ENHANCED: Immediate loader with test progress
  // ========================================

  // Update the immediate HTML loader with enhanced progress info
  useEffect(() => {
    if (window.updateImmediateLoader && !isProfiling) {
      let displayPhase = 'Initializing...';
      let displayAsset = 'Setting up...';
      
      if (isDetecting) {
        displayPhase = 'Detecting Device';
        displayAsset = `Analyzing ${deviceProfile?.category || 'device'} capabilities...`;
      } else if (phase === 'loading') {
        displayPhase = 'Loading Assets';
        displayAsset = currentAsset || 'Loading resources...';
      } else if (isProfiling) {
        displayPhase = 'Profiling Performance';
        displayAsset = `Running tests... ${Math.round(profilerProgress)}%`;
      } else if (isReady && performanceConfig) {
        displayPhase = 'Ready';
        displayAsset = 'Starting experience...';
      }

      const finalProgress = isProfiling ? profilerProgress : progress;

      window.updateImmediateLoader(finalProgress, displayPhase, displayAsset, null);
    }
  }, [progress, phase, currentAsset, isDetecting, isProfiling, profilerProgress, isReady, performanceConfig, deviceProfile]);

  // Hide immediate loader and show React app when ready
  useEffect(() => {
    if (isAppReady && window.showReactApp) {
      setTimeout(() => {
        window.showReactApp();
      }, 500);
    }
  }, [isAppReady]);


  // Start performance profiler when ready and no cached profile
  useEffect(() => {
    if (deviceProfile && isReady && !profileConfig && !hasCachedProfile && !isProfiling) {
      if (import.meta.env.DEV) console.log('🔬 Starting performance profiler for device:', {
        category: deviceProfile.category,
        tier: deviceProfile.performanceTier,
        model: deviceProfile.deviceModel,
        gpu: deviceProfile.gpu?.tier
      });
      startProfiler(progress).then(saveProfileResult);
    }
  }, [deviceProfile, isReady, profileConfig, hasCachedProfile, isProfiling, startProfiler, progress, saveProfileResult]);

  // Apply performance config when profiler completes or cache loaded
  useEffect(() => {
    if (profileConfig) {
      if (import.meta.env.DEV) console.log('🎯 Applying profiler results:', profileConfig);
      setPerformanceConfig(profileConfig);

      if (markAsInitialized) markAsInitialized();
      if (updateExternalPerformanceConfig) updateExternalPerformanceConfig(profileConfig, true);
    }
  }, [profileConfig, updateExternalPerformanceConfig, markAsInitialized]);

  // ENHANCED: App ready detection with better criteria
  useEffect(() => {
    if (isReady && performanceConfig && !isProfiling && !isAppReady) {
      if (import.meta.env.DEV) console.log('🎯 App is ready - enhanced system initialized:', {
        assetsLoaded: isReady,
        performanceConfigured: !!performanceConfig,
        deviceTier: deviceProfile?.performanceTier,
        finalSettings: {
          renderScale: performanceConfig.renderScale,
          pbrQuality: performanceConfig.pbrQuality,
          textureQuality: performanceConfig.textureQuality
        }
      });
      setIsAppReady(true);
    }
  }, [isReady, performanceConfig, isProfiling, isAppReady, deviceProfile]);

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

  // Get canvas props
  const canvasProps = getOptimalCanvasProps();
  const environmentProps = getOptimalEnvironmentProps();

  if (!isAppReady) {
    return (
      <>
        {isProfiling && TestScene}
        <EnhancedLoadingScreen
          progress={isProfiling ? Math.round(profilerProgress) : Math.round(progress)}
          phase={isProfiling ? 'profiling' : phase}
          currentAsset={currentAsset}
          loadedAssets={loadedAssets}
          totalAssets={totalAssets}
          profilerProgress={isProfiling ? profilerProgress : null}
          errors={errors}
          onRetry={retry}
        />
      </>
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

      {/* ENHANCED: FPS Display with device info */}
      {!hideAllUI && (
        <FpsDisplay 
          visible={true}
          position="top-right"
          showDetails={false}
        />
      )}
      
      {/* ENHANCED: Performance alerts with device-appropriate thresholds */}
      {!hideAllUI && (
        <PerformanceAlert 
          visible={true}
          threshold={deviceProfile?.category === 'mobile' ? 20 : 
                    deviceProfile?.category === 'tablet' ? 25 : 30}
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
          performanceConfig={performanceConfig}
          config={config}
          canvasProps={canvasProps}
          environmentProps={environmentProps}
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
            performanceConfig={performanceConfig}
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

      {/* ENHANCED: Debug Panel with detailed performance info */}
      {(import.meta.env.DEV || perfDebug) && (
        <PerformanceDebugPanel
          deviceProfile={deviceProfile}
          performanceConfig={performanceConfig}
          devicePerformanceProfile={devicePerformanceProfile}
          initialPerformanceConfig={profileConfig}
          hasInitialized={hasInitialized}
          initialProfileApplied={!!performanceConfig}
          debugInfo={debugInfo}
          onForceRetest={handleForceRetest}
        />
      )}
    </>
  );
}

export default App;