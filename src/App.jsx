// src/App.jsx - FIXED: Added performance test bypass for high-end devices
// CRITICAL: All hooks must be called in the same order every render

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import './styles/scroll-snap.css';

// NEW: Enhanced loading system
import { useAssetLoader } from './hooks/useAssetLoader';
import EnhancedLoadingScreen from './components/ui/EnhancedLoadingScreen';

// UNIFIED: Single animation coordinator replaces all complex state management
import MasterAnimationCoordinator from './components/three/MasterAnimationCoordinator';
import { ANIMATION_CONFIG } from './hooks/useUnifiedAnimationController';
import { Vector3 } from 'three';

// Layout components (unchanged)
import ScrollablePortfolio from './components/layout/ScrollablePortfolio';
import Fixed3DCanvas from './components/layout/Fixed3DCanvas';

// UI components (unchanged)
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

// ADDED: Debug component
import PerformanceDebugPanel from './components/ui/PerformanceDebugPanel';

// Configuration and utilities (unchanged)
import * as defaultConfig from './crystalConfig';
import { useDeviceProfile } from './hooks/useDeviceProfile';
import { useInitialPerformanceTest } from './hooks/useInitialPerformanceTest';

// ENHANCED: Bypass performance test for high-end devices
const BYPASS_PERFORMANCE_TEST_FOR_HIGH_END = true; // Set to true to skip testing on high-end devices

// Convert UI config into animation config used by the controller
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

// Simple mobile detection (unchanged)
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
};

function App() {
  // ========================================
  // CRITICAL: ALL HOOKS MUST BE CALLED FIRST
  // ========================================
  
  // Basic state hooks - always called
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
  const [animationConfig, setAnimationConfig] = useState(
    buildAnimationConfig(defaultConfig)
  );
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
  const [performanceConfig, setPerformanceConfig] = useState(() => {
    return {
      useNormalMaps: false,
      textureQuality: 'low',
      usePBR: false,
      renderScale: 0.7
    };
  });
  const [isAppReady, setIsAppReady] = useState(false);
  const [initialProfileApplied, setInitialProfileApplied] = useState(false);

  // ENHANCED: Add bypass state for performance test
  const [bypassedPerformanceConfig, setBypassedPerformanceConfig] = useState(null);

  // FIXED: Device profile hook with debug logging and proper initialization tracking
  const {
    performanceProfile: devicePerformanceProfile,
    deviceProfile,
    getOptimalCanvasProps,
    getOptimalEnvironmentProps,
    updateExternalPerformanceConfig,
    markAsInitialized,
    hasInitialized,
    isDetecting
  } = useDeviceProfile({
    enableDebugLogging: true, // ENABLE DEBUG LOGGING
    enableOrientationLock: false
  });

  // Asset loader hook - always called
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

  // ENHANCED: Initial performance test with bypass option for high-end devices
  const {
    performanceConfig: initialPerformanceConfig,
    isTesting: isPerfTesting,
    startTest: startPerfTest,
  } = useInitialPerformanceTest(deviceProfile, {
    autoStart: false,
    onComplete: setPerformanceConfig,
  });

  // Detect if mobile - always called
  const isMobile = isMobileDevice();

  // ========================================
  // CALLBACKS - always called
  // ========================================

  const handleSnapSpeedChange = useCallback((speed) => {
    console.log('🎯 Changing snap speed to:', speed);
    setSnapSpeed(speed);
  }, []);

  const handleAnimationStateChange = useCallback((newState, prevState) => {
    if (process.env.NODE_ENV === 'development') {
      // Uncomment for debugging
      // console.log('🎬 Animation state changed:', {
      //   from: prevState,
      //   to: newState
      // });
    }
  }, []);

  const handleWorkClick = useCallback(() => {
    console.log('Navigate to work section');
  }, []);

  const handleAboutClick = useCallback(() => {
    console.log('Navigate to about section');
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
    console.log('Navigate to contact section');
  }, []);

  const handleConfigUpdate = useCallback((newConfig) => {
    setConfig(newConfig);
    setAnimationConfig(buildAnimationConfig(newConfig));
  }, []);

  const handleMaterialChange = useCallback((variant) => {
    console.log("Changing material variant to:", variant);
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
  
  // FIXED: Handle manual performance config updates (from Performance Controls UI)
  const handlePerformanceConfigUpdate = useCallback((newConfig) => {
    console.log("🔧 Manual performance config update:", newConfig);
    
    // Update local state
    setPerformanceConfig(newConfig);
    
    // ONLY send to device profile if properly initialized
    if (hasInitialized && initialProfileApplied && updateExternalPerformanceConfig) {
      console.log("📤 Sending manual config to device profile");
      updateExternalPerformanceConfig(newConfig);
    } else {
      console.log("🚫 Not ready for external config updates yet", {
        hasInitialized,
        initialProfileApplied,
        hasUpdateFunction: !!updateExternalPerformanceConfig
      });
    }
  }, [hasInitialized, initialProfileApplied, updateExternalPerformanceConfig]);

  const toggleUI = useCallback(() => {
    setShowUI(!showUI);
  }, [showUI]);

  // ========================================
  // EFFECTS - always called in same order
  // ========================================

  // ENHANCED: Bypass performance test for high-end devices if desired
  useEffect(() => {
    if (deviceProfile && !initialPerformanceConfig && !isPerfTesting && !bypassedPerformanceConfig) {
      // Check if we should bypass the performance test
      const shouldBypass = BYPASS_PERFORMANCE_TEST_FOR_HIGH_END && 
                          deviceProfile.performanceTier === 'high' && 
                          !deviceProfile.isMobile;
      
      if (shouldBypass) {
        console.log('🚀 Bypassing performance test for high-end device');
        console.log('📱 Device profile:', {
          category: deviceProfile.category,
          tier: deviceProfile.performanceTier,
          isMobile: deviceProfile.isMobile
        });
        
        // Use device profile directly without testing
        const directConfig = devicePerformanceProfile;
        console.log('🎯 Using direct device profile config:', {
          usePBR: directConfig.usePBR,
          useNormalMaps: directConfig.useNormalMaps,
          textureQuality: directConfig.textureQuality,
          renderScale: directConfig.renderScale
        });
        
        setBypassedPerformanceConfig(directConfig);
        setPerformanceConfig(directConfig);
      } else {
        // Run performance test as normal
        console.log('🔬 Running performance test for device:', deviceProfile.performanceTier);
        startPerfTest();
      }
    }
  }, [deviceProfile, initialPerformanceConfig, isPerfTesting, bypassedPerformanceConfig, 
      devicePerformanceProfile, startPerfTest]);

  // FIXED: Apply initial performance config and mark as initialized
  useEffect(() => {
    const effectivePerformanceConfig = bypassedPerformanceConfig || initialPerformanceConfig;
    
    if (effectivePerformanceConfig && !initialProfileApplied) {
      console.log('🎯 Applying performance config:', {
        source: bypassedPerformanceConfig ? 'Device Profile (bypassed test)' : 'Performance Test',
        usePBR: effectivePerformanceConfig.usePBR,
        useNormalMaps: effectivePerformanceConfig.useNormalMaps,
        textureQuality: effectivePerformanceConfig.textureQuality,
        renderScale: effectivePerformanceConfig.renderScale
      });
      
      setPerformanceConfig(effectivePerformanceConfig);
      setInitialProfileApplied(true);
      
      // IMPORTANT: Mark device profile as initialized AFTER we set the performance config
      if (markAsInitialized) {
        markAsInitialized();
      }
    }
  }, [initialPerformanceConfig, bypassedPerformanceConfig, initialProfileApplied, markAsInitialized]);

  // FIXED: Only allow external updates after proper initialization
  useEffect(() => {
    if (hasInitialized && initialProfileApplied && updateExternalPerformanceConfig) {
      console.log('🔧 Ready for external performance config updates');
    }
  }, [hasInitialized, initialProfileApplied, updateExternalPerformanceConfig]);

  // ENHANCED: Check if app is ready to show (with bypass support)
  useEffect(() => {
    const effectivePerformanceConfig = bypassedPerformanceConfig || initialPerformanceConfig;
    const shouldBeReady = !isDetecting && isReady && devicePerformanceProfile && effectivePerformanceConfig;
    
    if (shouldBeReady && !isAppReady) {
      console.log('🎯 App is ready to show');
      setIsAppReady(true);
    }
  }, [isDetecting, isReady, devicePerformanceProfile, initialPerformanceConfig, bypassedPerformanceConfig, isAppReady]);

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
            console.log(`🎨 UI Hidden: ${newState ? 'ON' : 'OFF'}`);
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

  // ========================================
  // CONDITIONAL RENDERING - After all hooks
  // ========================================

  // Show enhanced loading screen while loading or device detection
  if (!isAppReady) {
    return (
      <EnhancedLoadingScreen
        progress={progress}
        phase={isDetecting ? 'initializing' : (isPerfTesting ? 'initializing' : phase)}
        currentAsset={
          isDetecting ? 'Detecting device capabilities...' : 
          isPerfTesting ? 'Testing performance...' : 
          currentAsset
        }
        loadedAssets={loadedAssets}
        totalAssets={totalAssets}
        errors={errors}
        onRetry={retry}
      />
    );
  }

  // Get optimal props for 3D canvas
  const canvasProps = getOptimalCanvasProps();
  const environmentProps = getOptimalEnvironmentProps();

  return (
    <>
      {/* UI Hide Toggle Button - Always Visible */}
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

      {/* FPS Display */}
      {!hideAllUI && (
        <FpsDisplay 
          visible={true}
          position="top-right"
          showDetails={false}
        />
      )}
      
      {/* Performance alerts */}
      {!hideAllUI && (
        <PerformanceAlert 
          visible={true}
          threshold={deviceProfile?.isMobile ? 25 : 30}
          onPerformanceIssue={(data) => {
            console.warn('Performance issue:', data);
          }}
        />
      )}

      {/* Master Animation Coordinator */}
      <MasterAnimationCoordinator
        debugMode={process.env.NODE_ENV === 'development'}
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
                    onMouseEnter={(e) => {
                      if (snapSpeed !== speed) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (snapSpeed !== speed) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                  >
                    {speed.replace('-', ' ')}
                  </button>
                ))}
              </div>
              
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.7)',
                backgroundColor: 'rgba(100, 255, 218, 0.1)',
                padding: '12px',
                borderRadius: '6px',
                lineHeight: '1.5',
                border: '1px solid rgba(100, 255, 218, 0.2)'
              }}>
                <div style={{ marginBottom: '4px' }}><strong style={{ color: '#64ffda' }}>Fast:</strong> Almost instant snapping</div>
                <div style={{ marginBottom: '4px' }}><strong style={{ color: '#64ffda' }}>Medium:</strong> Default smooth snapping</div>
                <div style={{ marginBottom: '4px' }}><strong style={{ color: '#64ffda' }}>Slow:</strong> More gradual snapping</div>
                <div style={{ marginBottom: '4px' }}><strong style={{ color: '#64ffda' }}>Extra Slow:</strong> Very gradual movement</div>
                <div><strong style={{ color: '#64ffda' }}>No Snap:</strong> Free scrolling (no snapping)</div>
              </div>
              
              <div style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.6)',
                marginTop: '8px',
                fontStyle: 'italic'
              }}>
                Current: <strong style={{ color: '#64ffda' }}>{snapSpeed.replace('-', ' ')}</strong>
              </div>
            </div>
          </div>

        </TabbedControlPanel>
      )}
      
      {!hideAllUI && (
        <AccessibilityInstructions visible={true} />
      )}

      {/* ENHANCED: Debug Panel for Development with bypass support */}
      {process.env.NODE_ENV === 'development' && (
        <PerformanceDebugPanel
          deviceProfile={deviceProfile}
          performanceConfig={performanceConfig}
          devicePerformanceProfile={devicePerformanceProfile}
          initialPerformanceConfig={bypassedPerformanceConfig || initialPerformanceConfig}
          hasInitialized={hasInitialized}
          initialProfileApplied={initialProfileApplied}
        />
      )}
    </>
  );
}

export default App;