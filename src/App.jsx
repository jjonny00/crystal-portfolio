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
import FooterSection from './components/ui/FooterSection';
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
import { useInitialPerformanceTest } from './hooks/useInitialPerformanceTest';

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
  
  // Basic state hooks
  const [hideAllUI, setHideAllUI] = useState(false);
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
    enableOrientationLock: false
  });

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

  // ENHANCED: Smart performance test hook
  const {
    performanceConfig: testPerformanceConfig,
    isTesting: isPerfTesting,
    startTest: startPerfTest,
    testProgress,
    currentMetrics
  } = useInitialPerformanceTest(deviceProfile, {
    duration: 3000, // Shorter test for faster startup
    autoStart: false,
    onComplete: (config) => {
      if (import.meta.env.DEV) console.log('🎯 Enhanced performance test completed:', config);
      setPerformanceConfig(config);
    }
  });

  // Detect if mobile
  const isMobile = isMobileDevice();

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
    
    if (hasInitialized && updateExternalPerformanceConfig) {
      if (import.meta.env.DEV) console.log("📤 Sending manual config to device profile");
      updateExternalPerformanceConfig(newConfig);
    }
  }, [hasInitialized, updateExternalPerformanceConfig]);

  const toggleUI = useCallback(() => {
    setShowUI(!showUI);
  }, [showUI]);

  // ========================================
  // ENHANCED: Immediate loader with test progress
  // ========================================

  // Update the immediate HTML loader with enhanced progress info
  useEffect(() => {
    if (window.updateImmediateLoader) {
      let displayPhase = 'Initializing...';
      let displayAsset = 'Setting up...';
      
      if (isDetecting) {
        displayPhase = 'Detecting Device';
        displayAsset = `Analyzing ${deviceProfile?.category || 'device'} capabilities...`;
      } else if (phase === 'loading') {
        displayPhase = 'Loading Assets';
        displayAsset = currentAsset || 'Loading resources...';
      } else if (isPerfTesting) {
        displayPhase = 'Testing Performance';
        displayAsset = currentMetrics ? 
          `Testing... ${currentMetrics.avgSoFar}fps avg (${currentMetrics.samples} samples)` :
          'Optimizing settings...';
      } else if (isReady && performanceConfig) {
        displayPhase = 'Ready';
        displayAsset = 'Starting experience...';
      }
      
      const finalProgress = isPerfTesting ? 
        Math.max(progress, testProgress || 0) : 
        progress;
      
      window.updateImmediateLoader(finalProgress, displayPhase, displayAsset);
    }
  }, [progress, phase, currentAsset, isDetecting, isPerfTesting, isReady, performanceConfig, deviceProfile, testProgress, currentMetrics]);

  // Hide immediate loader and show React app when ready
  useEffect(() => {
    if (isAppReady && window.showReactApp) {
      setTimeout(() => {
        window.showReactApp();
      }, 500);
    }
  }, [isAppReady]);

  // ENHANCED: Start performance test when device profile and assets are ready
  useEffect(() => {
    if (deviceProfile && isReady && !testPerformanceConfig && !isPerfTesting) {
      if (import.meta.env.DEV) console.log('🔬 Starting enhanced performance test for device:', {
        category: deviceProfile.category,
        tier: deviceProfile.performanceTier,
        model: deviceProfile.deviceModel,
        gpu: deviceProfile.gpu?.tier
      });
      startPerfTest();
    }
  }, [deviceProfile, isReady, testPerformanceConfig, isPerfTesting, startPerfTest]);

  // Apply performance config when test completes
  useEffect(() => {
    if (testPerformanceConfig) {
      if (import.meta.env.DEV) console.log('🎯 Applying enhanced performance test results:', testPerformanceConfig);
      setPerformanceConfig(testPerformanceConfig);
      
      if (markAsInitialized) {
        markAsInitialized();
      }
    }
  }, [testPerformanceConfig, markAsInitialized]);

  // ENHANCED: App ready detection with better criteria
  useEffect(() => {
    if (isReady && performanceConfig && !isAppReady) {
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
  }, [isReady, performanceConfig, isAppReady, deviceProfile]);

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
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Get canvas props
  const canvasProps = getOptimalCanvasProps();
  const environmentProps = getOptimalEnvironmentProps();

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
      {import.meta.env.DEV && (
        <PerformanceDebugPanel
          deviceProfile={deviceProfile}
          performanceConfig={performanceConfig}
          devicePerformanceProfile={devicePerformanceProfile}
          initialPerformanceConfig={testPerformanceConfig}
          hasInitialized={hasInitialized}
          initialProfileApplied={!!performanceConfig}
          debugInfo={debugInfo}
          testMetrics={currentMetrics}
        />
      )}
    </>
  );
}

export default App;