// src/App.jsx - UPDATED: Phase 1 - Unified Animation System
// REMOVED: All complex scroll observers, crystal controllers, and camera controllers
// ADDED: Single MasterAnimationCoordinator that handles everything

import React, { useState, useCallback } from 'react';
import './App.css';
import './styles/scroll-snap.css';

// NEW: Single animation coordinator replaces all the complex state management
import MasterAnimationCoordinator from './components/three/MasterAnimationCoordinator';

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
import BlackOpalControls from './components/ui/BlackOpalControls';
import IceOpalControls from './components/ui/IceOpalControls';
import PostProcessingControls from './components/ui/PostProcessingControls';
import PerformanceControls from './components/ui/PerformanceControls';
import AccessibilityInstructions from './components/ui/AccessibilityInstructions';
import FpsDisplay, { PerformanceAlert } from './components/ui/FpsDisplay';

// Configuration and utilities (unchanged)
import * as defaultConfig from './crystalConfig';
import { useDeviceProfile } from './hooks/useDeviceProfile';

// Simple mobile detection (unchanged)
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
};

function App() {
  const isMobile = isMobileDevice();

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
  
  const [materialVariant, setMaterialVariant] = useState('default');
  const [showUI, setShowUI] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Material configs (unchanged)
  const [blackOpalConfig, setBlackOpalConfig] = useState({
    roughness: 0.4,
    metalness: 0.1,
    clearcoat: 0.6,
    transmission: 0.2,
    iridescence: 0.9,
    normalScale: 0.8,
    emissiveIntensity: 0.5
  });
  
  const [iceOpalConfig, setIceOpalConfig] = useState({
    roughness: 0.3,
    metalness: 0.05,
    clearcoat: 0.8,
    transmission: 0.6,
    iridescence: 0.4,
    normalScale: 0.6,
    emissiveIntensity: 0.4
  });
  
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

  // Performance management (unchanged)
  const [lastAppliedProfile, setLastAppliedProfile] = useState(null);
  const [initialProfileApplied, setInitialProfileApplied] = useState(false);
  
  // Performance profile application (unchanged)
  React.useEffect(() => {
    if (devicePerformanceProfile && !isDetecting) {
      const profileKey = JSON.stringify({
        useNormalMaps: devicePerformanceProfile.useNormalMaps,
        textureQuality: devicePerformanceProfile.textureQuality,
        usePBR: devicePerformanceProfile.usePBR,
        renderScale: devicePerformanceProfile.renderScale
      });
      
      if (lastAppliedProfile !== profileKey) {
        const newConfig = {
          useNormalMaps: devicePerformanceProfile.useNormalMaps,
          textureQuality: devicePerformanceProfile.textureQuality,
          usePBR: devicePerformanceProfile.usePBR,
          renderScale: devicePerformanceProfile.renderScale
        };
        
        setPerformanceConfig(newConfig);
        setLastAppliedProfile(profileKey);
        setInitialProfileApplied(true);
        
        if (devicePerformanceProfile.postProcessing) {
          setEffectsEnabled({
            bloom: devicePerformanceProfile.postProcessing.bloom || false,
            chromaticAberration: devicePerformanceProfile.postProcessing.chromaticAberration || false,
            noise: devicePerformanceProfile.postProcessing.noise || true,
            vignette: devicePerformanceProfile.postProcessing.vignette || false
          });
        }
      }
    }
  }, [devicePerformanceProfile, isDetecting, lastAppliedProfile]);

  const [hasInitialized, setHasInitialized] = useState(false);
  
  React.useEffect(() => {
    if (updateExternalPerformanceConfig && hasInitialized && initialProfileApplied) {
      updateExternalPerformanceConfig(performanceConfig);
    } else if (devicePerformanceProfile && !hasInitialized) {
      setHasInitialized(true);
    }
  }, [performanceConfig, updateExternalPerformanceConfig, hasInitialized, devicePerformanceProfile, initialProfileApplied]);

  // NEW: Animation state change handler - receives unified animation state
  const handleAnimationStateChange = useCallback((newState, prevState) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎬 Animation state changed:', {
        from: prevState,
        to: newState
      });
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
      const variants = ['default', 'glass', 'gem', 'holographic', 'blackOpal', 'iceOpal'];
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
  }, []);

  const handleMaterialChange = useCallback((variant) => {
    console.log("Changing material variant to:", variant);
    setMaterialVariant(variant);
  }, []);
  
  const handleBlackOpalConfigUpdate = useCallback((newConfig) => {
    console.log("Updating Black Opal config:", newConfig);
    setBlackOpalConfig(newConfig);
  }, []);
  
  const handleIceOpalConfigUpdate = useCallback((newConfig) => {
    console.log("Updating Ice Opal config:", newConfig);
    setIceOpalConfig(newConfig);
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
    console.log("🔧 Manual performance config update:", newConfig);
    setPerformanceConfig(newConfig);
  }, []);

  const toggleUI = useCallback(() => {
    setShowUI(!showUI);
  }, [showUI]);

  // Get optimal props for 3D canvas (unchanged)
  const canvasProps = getOptimalCanvasProps();
  const environmentProps = getOptimalEnvironmentProps();

  return (
    <>
      {/* Navigation Bar */}
      <Navigation
        onWorkClick={handleWorkClick}
        onAboutClick={handleAboutClick}
        onProcessClick={handleProcessClick}
        onContactClick={handleContactClick}
        // Animation state will be passed down via context or props
      />

      {/* FPS Display */}
      <FpsDisplay 
        visible={true}
        position="top-right"
        showDetails={false}
      />
      
      {/* Performance alerts */}
      <PerformanceAlert 
        visible={true}
        threshold={deviceProfile?.isMobile ? 25 : 30}
        onPerformanceIssue={(data) => {
          console.warn('Performance issue:', data);
        }}
      />

      {/* NEW: Master Animation Coordinator - Single source of truth for all animations */}
      <MasterAnimationCoordinator 
        debugMode={process.env.NODE_ENV === 'development'}
        onAnimationStateChange={handleAnimationStateChange}
      >
        {/* SIMPLIFIED: Fixed 3D Canvas now receives animationData from coordinator */}
        <Fixed3DCanvas
          materialVariant={materialVariant}
          blackOpalConfig={blackOpalConfig}
          iceOpalConfig={iceOpalConfig}
          effectsEnabled={effectsEnabled}
          postProcessingConfig={postProcessingConfig}
          performanceConfig={performanceConfig}
          config={config}
          canvasProps={canvasProps}
          environmentProps={environmentProps}
          isMobile={isMobile}
          // animationData will be passed by MasterAnimationCoordinator
        />
      </MasterAnimationCoordinator>

      {/* Scrollable Content - on top of 3D canvas (unchanged) */}
      <ScrollablePortfolio />

      {/* FooterSection - SIMPLIFIED: Will use animation coordinator for navigation */}
      {/* <FooterSection 
        visible={true} // Always visible, coordinator handles the animation
        onLoopBack={() => {
          // Will be replaced with coordinator's scrollToZone function
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      /> */}
      
      {/* UI Controls (unchanged) */}
      <ControlsToggle 
        showUI={showUI} 
        toggleUI={toggleUI} 
        disabled={false}
      />
      
      {showUI && (
        <TabbedControlPanel 
          visible={true}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { label: 'Crystal' },
            { label: 'Materials' },
            { label: 'Effects' },
            { label: 'Performance' }
          ]}
        >
          <CrystalControls onUpdate={handleConfigUpdate} />
          
          <div>
            <MaterialSelector currentVariant={materialVariant} onChange={handleMaterialChange} />
            
            {materialVariant === 'blackOpal' && (
              <BlackOpalControls 
                visible={true} 
                onConfigUpdate={handleBlackOpalConfigUpdate}
                currentConfig={blackOpalConfig}
              />
            )}
            
            {materialVariant === 'iceOpal' && (
              <IceOpalControls 
                visible={true} 
                onConfigUpdate={handleIceOpalConfigUpdate}
                currentConfig={iceOpalConfig}
              />
            )}
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
        </TabbedControlPanel>
      )}
      
      <AccessibilityInstructions visible={true} />
    </>
  );
}

export default App;