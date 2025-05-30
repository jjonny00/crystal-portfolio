// src/App.jsx - Phase 1: Foundation Setup
// Clean native-scrolling implementation with fixed 3D canvas
// UPDATED: Removed ProjectDetailCard and old AboutSection functionality

import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import './styles/scroll-snap.css';

// Import new layout components
import ScrollablePortfolio from './components/layout/ScrollablePortfolio';
import Fixed3DCanvas from './components/layout/Fixed3DCanvas';

// Import scroll observer
import { useCrystalScrollObserver } from './hooks/useScrollObserver';

// Import existing components we still need
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

// REMOVED IMPORTS:
// import ProjectDetailCard from './components/ui/ProjectDetailCard';
// import AboutSection from './components/ui/AboutSection';

// Import configuration and utilities
import * as defaultConfig from './crystalConfig';
import { useDeviceProfile } from './hooks/useDeviceProfile';
// REMOVED: import { projects, getProjectByFacetKey } from './data/projects';

// Simple mobile detection
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
};

function App() {
  const isMobile = isMobileDevice();

  // Device profile for performance optimization
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

  // Scroll observer for crystal state management
  const {
    currentSection,
    crystalState,
    selectedFacet,
    scrollProgress,
    scrollToSection,
    isSectionVisible,
    debugInfo
  } = useCrystalScrollObserver({
    onCrystalStateChange: (data) => {
      console.log(`🔄 Crystal state: ${data.crystalState}, Facet: ${data.selectedFacet || 'none'}`);
    },
    isMobile
  });

  // UI state
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
  
  // Material configs
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
  
  // Effects state
  const [effectsEnabled, setEffectsEnabled] = useState({
    bloom: true,
    chromaticAberration: true,
    noise: true,
    vignette: true
  });
  
  const [postProcessingConfig, setPostProcessingConfig] = useState(config.postProcessing);
  
  // Performance config
  const [performanceConfig, setPerformanceConfig] = useState(() => {
    return {
      useNormalMaps: false,
      textureQuality: 'low',
      usePBR: false,
      renderScale: 0.7
    };
  });

  // Performance management
  const [lastAppliedProfile, setLastAppliedProfile] = useState(null);
  const [initialProfileApplied, setInitialProfileApplied] = useState(false);
  
  useEffect(() => {
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
  
  useEffect(() => {
    if (updateExternalPerformanceConfig && hasInitialized && initialProfileApplied) {
      updateExternalPerformanceConfig(performanceConfig);
    } else if (devicePerformanceProfile && !hasInitialized) {
      setHasInitialized(true);
    }
  }, [performanceConfig, updateExternalPerformanceConfig, hasInitialized, devicePerformanceProfile, initialProfileApplied]);

  // Navigation handlers - now use scroll observer
  const handleWorkClick = useCallback(() => {
    scrollToSection('projects-overview'); // Match your ProjectsSection id
  }, [scrollToSection]);

  const handleAboutClick = useCallback(() => {
    scrollToSection('about'); // Match your AboutSection id  
  }, [scrollToSection]);

  const handleProcessClick = useCallback(() => {
    setMaterialVariant(prev => {
      const variants = ['default', 'glass', 'gem', 'holographic', 'blackOpal', 'iceOpal'];
      const currentIndex = variants.indexOf(prev);
      const nextIndex = (currentIndex + 1) % variants.length;
      return variants[nextIndex];
    });
  }, []);

  const handleContactClick = useCallback(() => {
    scrollToSection('footer'); // Navigate to footer instead of about
  }, [scrollToSection]);

  // Handler functions
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

  // Get optimal props for 3D canvas
  const canvasProps = getOptimalCanvasProps();
  const environmentProps = getOptimalEnvironmentProps();

  // REMOVED: Get current project logic
  // const currentProject = selectedFacet ? getProjectByFacetKey(selectedFacet) : null;

  return (
    <>
      {/* Navigation Bar */}
      <Navigation
        onWorkClick={handleWorkClick}
        onAboutClick={handleAboutClick}
        onProcessClick={handleProcessClick}
        onContactClick={handleContactClick}
        isTransitioning={false}
        crystalState={crystalState}
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

      {/* Fixed 3D Canvas - behind everything */}
      <Fixed3DCanvas
        crystalState={crystalState}
        selectedFacet={selectedFacet}
        hoveredFacet={null} // No hover in scroll mode
        onFacetSelect={null} // Disabled in scroll mode
        onFacetHover={null} // Disabled in scroll mode
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
      />

      {/* Scrollable Content - on top of 3D canvas */}
      <ScrollablePortfolio />

      {/* REMOVED: AboutSection overlay - now it's inline in ScrollablePortfolio */}
      
      {/* FooterSection - keep this for any special footer interactions */}
      <FooterSection 
        visible={isSectionVisible('footer')}
        onLoopBack={() => scrollToSection('hero')}
      />
      
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
      
      {/* REMOVED: Project Detail Card - no longer needed
      {currentProject && (
        <ProjectDetailCard 
          project={currentProject}
          visible={!!currentProject}
          onClose={() => scrollToSection('projects-overview')}
          isMobile={isMobile}
        />
      )}
      */}
      
      <AccessibilityInstructions visible={true} />

      {/* Debug Info - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: '100px',
          left: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 10000,
          pointerEvents: 'none'
        }}>
          <div>Section: {currentSection?.id || 'none'}</div>
          <div>Crystal: {crystalState}</div>
          <div>Facet: {selectedFacet || 'none'}</div>
          <div>Progress: {Math.round(scrollProgress * 100)}%</div>
          <div>Mobile: {isMobile ? 'Yes' : 'No'}</div>
        </div>
      )}
    </>
  );
}

export default App;