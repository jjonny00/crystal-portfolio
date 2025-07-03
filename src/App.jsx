// src/App.jsx - UPDATED: Phase 1 - Unified Animation System
// REMOVED: All complex scroll observers, crystal controllers, and camera controllers
// ADDED: Single MasterAnimationCoordinator that handles everything

import React, { useState, useCallback } from 'react';
import './App.css';
import './styles/scroll-snap.css';

// NEW: Single animation coordinator replaces all the complex state management
import MasterAnimationCoordinator from './components/three/MasterAnimationCoordinator';
import { ANIMATION_CONFIG } from './hooks/useUnifiedAnimationController';
import { Vector3 } from 'three';

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
import LoadingScreen from './components/ui/LoadingScreen';
import { useProgress } from '@react-three/drei';
import { preloadAssets } from './utils/preloadAssets';

// Preload 3D assets as soon as the module is evaluated
preloadAssets();

// Configuration and utilities (unchanged)
import * as defaultConfig from './crystalConfig';
import { useDeviceProfile } from './hooks/useDeviceProfile';
import { useInitialPerformanceTest } from './hooks/useInitialPerformanceTest';

// Simple mobile detection (unchanged)
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
};

function App() {
  const isMobile = isMobileDevice();

  const { progress } = useProgress();

  // Device profile for performance optimization (unchanged)
  const { 
    performanceProfile: devicePerformanceProfile, 
    deviceProfile, 
    getOptimalCanvasProps,
    getOptimalEnvironmentProps,
    updateExternalPerformanceConfig,
    isDetecting 
  } = useDeviceProfile({ 
    enableDebugLogging: false,
    enableOrientationLock: false
  });

  // UI Hide Toggle State
  const [hideAllUI, setHideAllUI] = useState(false);

  // Snap Speed Setting
  const [snapSpeed, setSnapSpeed] = useState('medium');

  // UI state (unchanged)
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
  
  // Material configs removed
  
  // Effects state (unchanged)
  const [effectsEnabled, setEffectsEnabled] = useState({
    bloom: true,
    chromaticAberration: true,
    noise: true,
    vignette: true
  });
  
  const [postProcessingConfig, setPostProcessingConfig] = useState(config.postProcessing);

  // Performance config (unchanged)
  const [performanceConfig, setPerformanceConfig] = useState(() => {
    return {
      useNormalMaps: false,
      textureQuality: 'low',
      usePBR: false,
      renderScale: 0.7
    };
  });

  // Ready state - becomes true after device profiling and initial performance
  // test complete
  const [isReady, setIsReady] = useState(false);

  // Initial performance test based on FPS
  const {
    performanceConfig: initialPerformanceConfig,
    isTesting: isPerfTesting,
    startTest: startPerfTest,
  } = useInitialPerformanceTest(deviceProfile, {
    autoStart: false,
    onComplete: setPerformanceConfig,
  });

  React.useEffect(() => {
    if (deviceProfile && !initialPerformanceConfig && !isPerfTesting) {
      startPerfTest();
    }
  }, [deviceProfile, initialPerformanceConfig, isPerfTesting, startPerfTest]);

  React.useEffect(() => {
    if (initialPerformanceConfig) {
      setPerformanceConfig(initialPerformanceConfig);
    }
  }, [initialPerformanceConfig]);

  // Performance management (unchanged)
  const [initialProfileApplied, setInitialProfileApplied] = useState(false);
  
  // Mark initialization when performance config is applied
  React.useEffect(() => {
    if (initialPerformanceConfig && !initialProfileApplied) {
      setInitialProfileApplied(true);
    }
  }, [initialPerformanceConfig, initialProfileApplied]);

  const [hasInitialized, setHasInitialized] = useState(false);

  // When device profiling and initial performance test complete, mark ready
  React.useEffect(() => {
    if (!isDetecting && !isPerfTesting && initialPerformanceConfig && !isReady) {
      setIsReady(true);
    }
  }, [isDetecting, isPerfTesting, initialPerformanceConfig, isReady]);
  
  React.useEffect(() => {
    if (updateExternalPerformanceConfig && hasInitialized && initialProfileApplied) {
      updateExternalPerformanceConfig(performanceConfig);
    } else if (initialPerformanceConfig && !hasInitialized) {
      setHasInitialized(true);
    }
  }, [performanceConfig, updateExternalPerformanceConfig, hasInitialized, initialPerformanceConfig, initialProfileApplied]);

  // UI Hide Toggle Keyboard Listener
  React.useEffect(() => {
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

  // Snap Speed Handler
  const handleSnapSpeedChange = useCallback((speed) => {
    console.log('🎯 Changing snap speed to:', speed);
    setSnapSpeed(speed);
  }, []);

  // NEW: Animation state change handler - receives unified animation state
  const handleAnimationStateChange = useCallback((newState, prevState) => {
    if (process.env.NODE_ENV === 'development') {
      // console.log('🎬 Animation state changed:', {
      //   from: prevState,
      //   to: newState
      // });
    }
  }, []);

  // Navigation handlers - SIMPLIFIED: Now use scroll zones instead of complex section targeting
  const handleWorkClick = useCallback(() => {
    // Use the animation coordinator's scroll utilities
    // This will be passed down via animationData
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

  // Handler functions (unchanged)
  const handleConfigUpdate = useCallback((newConfig) => {
    setConfig(newConfig);
    setAnimationConfig(buildAnimationConfig(newConfig));
  }, []);

  const handleMaterialChange = useCallback((variant) => {
    console.log("Changing material variant to:", variant);
    setMaterialVariant(variant);
  }, []);
  
  // Removed: handlers for test materials
  
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
    console.log("🔧 Manual performance config update:", newConfig);
    setPerformanceConfig(newConfig);
  }, []);

  const toggleUI = useCallback(() => {
    setShowUI(!showUI);
  }, [showUI]);

  // Get optimal props for 3D canvas (unchanged)
  const canvasProps = getOptimalCanvasProps();
  const environmentProps = getOptimalEnvironmentProps();

  const showLoading = !isReady;
  const loadingText = progress < 100 ? 'Loading...' : 'Preparing scene...';

  return (
    <>
      {showLoading && (
        <LoadingScreen
          progress={progress < 100 ? progress : null}
          text={loadingText}
        />
      )}
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

      {/* NEW: Master Animation Coordinator - Single source of truth for all animations */}
      {isReady && (
        <MasterAnimationCoordinator
          debugMode={process.env.NODE_ENV === 'development'}
          onAnimationStateChange={handleAnimationStateChange}
          config={animationConfig}
        >
          {/* SIMPLIFIED: Fixed 3D Canvas now receives animationData from coordinator */}
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
      )}

      {/* Scrollable Content - Keep for scrolling but hide content */}
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
            
            {/* Removed test material controls */}
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
    </>
  );
}

export default App;