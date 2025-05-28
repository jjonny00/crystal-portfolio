// App.jsx - Updated with scroll-based crystal system and new sections

import { useState, useCallback, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import './App.css'

// Import state machine and project data
import { CRYSTAL_STATES, CRYSTAL_EVENTS, getNextState } from './machines/crystalStateMachine'
import { projects, getProjectByFacetKey } from './data/projects'

// Import scroll system
import { useScrollCrystal } from './hooks/useScrollCrystal'

// Import existing components
import * as defaultConfig from './crystalConfig'
import EnhancedCrystalScene from './components/three/EnhancedCrystalScene'
import CrystalControls from './components/ui/CrystalControls'
import MaterialSelector from './components/ui/MaterialSelector'
import BlackOpalControls from './components/ui/BlackOpalControls'
import IceOpalControls from './components/ui/IceOpalControls'
import ControlsToggle from './components/ui/ControlsToggle'
import ProjectDetailCard from './components/ui/ProjectDetailCard'
import AccessibilityInstructions from './components/ui/AccessibilityInstructions'
import PostProcessingControls from './components/ui/PostProcessingControls'
import PerformanceControls from './components/ui/PerformanceControls'
import TabbedControlPanel from './components/ui/TabbedControlPanel'
import useKeyboardControls from './hooks/useKeyboardControls'

// Import new components
import Navigation from './components/ui/Navigation'
import AboutSection from './components/ui/AboutSection'
import FooterSection from './components/ui/FooterSection'

// Import performance system
import { useDeviceProfile } from './hooks/useDeviceProfile'
import FpsDisplay, { FPSCounter, PerformanceAlert } from './components/ui/FpsDisplay'

function App() {
  // Device profile detection
  const { 
    performanceProfile: devicePerformanceProfile, 
    deviceProfile, 
    getOptimalCanvasProps,
    getOptimalEnvironmentProps,
    updateExternalPerformanceConfig,
    isDetecting 
  } = useDeviceProfile({ 
    enableDebugLogging: false,
    enableOrientationLock: true 
  });

  // Scroll-based crystal control system
  const scrollCrystalData = useScrollCrystal({
    enableScrollControl: true,
    debugMode: true, // Enable debug mode to troubleshoot
    smoothTransitions: true,
    onSectionChange: (newSection, oldSection) => {
      console.log(`🔄 App: Section changed: ${oldSection.key} → ${newSection.key}`);
      console.log(`🔄 App: Crystal state: ${crystalState}`);
    }
  });
  
  // Extract scroll state for easier access
  const {
    currentSection,
    crystalState,
    isTransitioning,
    selectedProject,
    hoveredProject,
    setHoveredProject,
    visibleSections,
    goToSection,
    selectProject,
    deselectProject,
    handleProjectClose,
    handleLoopBack
  } = scrollCrystalData;
  
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
  })
  const [materialVariant, setMaterialVariant] = useState('default')
  const [showUI, setShowUI] = useState(false)
  const [orbitControlsEnabled, setOrbitControlsEnabled] = useState(true)
  
  // Tab state management
  const [activeTab, setActiveTab] = useState(0)
  
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
  
  // Effects and performance state
  const [effectsEnabled, setEffectsEnabled] = useState({
    bloom: true,
    chromaticAberration: true,
    noise: true,
    vignette: true
  });
  
  const [postProcessingConfig, setPostProcessingConfig] = useState(config.postProcessing);
  
  // Performance configuration
  const [performanceConfig, setPerformanceConfig] = useState(() => {
    return {
      useNormalMaps: false,
      textureQuality: 'low',
      usePBR: false,
      renderScale: 0.7
    };
  });

  // Navigation handlers that integrate with scroll system
  const handleWorkClick = useCallback(() => {
    console.log('Work section clicked');
    goToSection('projects');
  }, [goToSection]);

  const handleAboutClick = useCallback(() => {
    console.log('About section clicked');
    goToSection('about');
  }, [goToSection]);

  const handleProcessClick = useCallback(() => {
    console.log('Process section clicked');
    // Could show different material variants to demonstrate process
    setMaterialVariant(prev => {
      const variants = ['default', 'glass', 'gem', 'holographic', 'blackOpal', 'iceOpal'];
      const currentIndex = variants.indexOf(prev);
      const nextIndex = (currentIndex + 1) % variants.length;
      return variants[nextIndex];
    });
  }, []);

  const handleContactClick = useCallback(() => {
    console.log('Contact section clicked');
    goToSection('footer');
  }, [goToSection]);

  // Handle facet selection with project mapping
  const handleFacetSelect = useCallback((facetKey) => {
    if (isTransitioning) return;
    
    const project = getProjectByFacetKey(facetKey);
    
    if (selectedProject && selectedProject.facetKey === facetKey) {
      // Deselect current project and return to intro
      handleProjectClose();
    } else {
      // Select new project
      selectProject(facetKey);
      setOrbitControlsEnabled(false);
    }
  }, [selectedProject, isTransitioning, selectProject, handleProjectClose]);
  
  // Handle facet hover
  const handleFacetHover = useCallback((facetKey) => {
    if (!isTransitioning) {
      setHoveredProject(facetKey);
    }
  }, [isTransitioning, setHoveredProject]);

  // Handle explosion toggle - integrated with scroll system
  const handleExplodeToggle = useCallback(() => {
    if (isTransitioning) return;
    
    if (currentSection.key === 'intro') {
      goToSection('projects');
    } else if (currentSection.key === 'projects') {
      if (selectedProject) {
        handleProjectClose();
      } else {
        goToSection('intro');
      }
    }
  }, [currentSection.key, selectedProject, isTransitioning, goToSection, handleProjectClose]);

  // Get the selected facet key for compatibility with existing components
  const selectedFacet = selectedProject?.facetKey || null;

  // Update device profile when it changes
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
        console.log('🎮 Applying device-optimized performance settings:', devicePerformanceProfile);
        
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
        
        setTimeout(() => {
          console.log('🔄 Forcing material refresh...');
          setPerformanceConfig(prev => ({ ...prev, _forceRefresh: Date.now() }));
        }, 100);
      }
    }
  }, [devicePerformanceProfile, isDetecting, lastAppliedProfile]);

  // Update device profile system when performance config changes
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    if (updateExternalPerformanceConfig && hasInitialized && initialProfileApplied) {
      updateExternalPerformanceConfig(performanceConfig);
    } else if (devicePerformanceProfile && !hasInitialized) {
      setHasInitialized(true);
    }
  }, [performanceConfig, updateExternalPerformanceConfig, hasInitialized, devicePerformanceProfile, initialProfileApplied]);

  // Handler for updating configuration from the control panel
  const handleConfigUpdate = useCallback((newConfig) => {
    setConfig(newConfig);
  }, []);

  // Handler for material variant changes
  const handleMaterialChange = useCallback((variant) => {
    console.log("Changing material variant to:", variant);
    setMaterialVariant(variant);
  }, []);
  
  // Handler for Black Opal config updates
  const handleBlackOpalConfigUpdate = useCallback((newConfig) => {
    console.log("Updating Black Opal config:", newConfig);
    setBlackOpalConfig(newConfig);
  }, []);
  
  // Handler for Ice Opal config updates
  const handleIceOpalConfigUpdate = useCallback((newConfig) => {
    console.log("Updating Ice Opal config:", newConfig);
    setIceOpalConfig(newConfig);
  }, []);
  
  // Post-processing toggle handler
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
  
  // Performance config update handler with debugging
  const handlePerformanceConfigUpdate = useCallback((newConfig) => {
    console.log("🔧 Manual performance config update:", newConfig);
    console.log("🔧 Previous config:", performanceConfig);
    setPerformanceConfig(newConfig);
  }, [performanceConfig]);

  // Toggle UI visibility
  const toggleUI = useCallback(() => {
    setShowUI(!showUI);
  }, [showUI]);

  // Set up keyboard controls with scroll integration
  useKeyboardControls({
    isExploded: crystalState === CRYSTAL_STATES.EXPLODED || crystalState === CRYSTAL_STATES.EXPLODING || crystalState === CRYSTAL_STATES.PROJECT_SELECTED,
    setIsExploded: (exploded) => {
      if (exploded) {
        goToSection('projects');
      } else {
        goToSection('intro');
      }
    },
    hoveredFacet: hoveredProject,
    setHoveredFacet: setHoveredProject,
    selectedFacet: selectedFacet,
    setSelectedFacet: (facetKey) => {
      if (facetKey && handleFacetSelect) {
        handleFacetSelect(facetKey);
      } else if (!facetKey && selectedProject) {
        handleProjectClose();
      }
    },
    onFacetSelect: handleFacetSelect,
    showUI,
    setShowUI,
    showDetailCard: !!selectedProject,
    setShowDetailCard: () => {}, // Handled by project selection
    setOrbitControlsEnabled,
    config,
    isTransitioning,
    setIsTransitioning: () => {}, // Handled by scroll system
    effectsEnabled,
    handleToggleEffect,
    performanceConfig,
    toggleNormalMaps: () => {
      handlePerformanceConfigUpdate({
        ...performanceConfig,
        useNormalMaps: !performanceConfig.useNormalMaps
      });
    }
  });

  // Get optimal canvas and environment props
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
        isTransitioning={isTransitioning}
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

      {/* Main 3D Canvas */}
      <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
        <Canvas 
          shadows 
          camera={{ position: config.camera.startingPosition, fov: config.camera.fov }} 
          {...canvasProps}
          gl={{ 
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.2,
            outputColorSpace: THREE.SRGBColorSpace,
            ...canvasProps.gl
          }}>
          
          <FPSCounter />
          
          <color attach="background" args={['#050505']} />
          
          {/* Lighting */}
          <ambientLight intensity={config.lighting.ambient.intensity} />
          <directionalLight 
            position={config.lighting.directional.position} 
            intensity={config.lighting.directional.intensity} 
            color={config.lighting.directional.color} 
            castShadow={config.lighting.directional.castShadow} 
          />
          
          {config.lighting.pointLights.map((light, index) => (
            <pointLight 
              key={index}
              position={light.position} 
              intensity={light.intensity} 
              color={light.color} 
            />
          ))}
          
          <spotLight 
            position={config.lighting.spotLight.position} 
            intensity={config.lighting.spotLight.intensity} 
            angle={config.lighting.spotLight.angle} 
            penumbra={config.lighting.spotLight.penumbra} 
            color={config.lighting.spotLight.color} 
          />
          
          {/* Enhanced Crystal scene with scroll integration */}
          <EnhancedCrystalScene 
            isExploded={crystalState === CRYSTAL_STATES.EXPLODED || crystalState === CRYSTAL_STATES.EXPLODING || crystalState === CRYSTAL_STATES.PROJECT_SELECTED} 
            crystalState={crystalState}
            config={config} 
            materialVariant={materialVariant}
            blackOpalConfig={blackOpalConfig}
            iceOpalConfig={iceOpalConfig}
            selectedFacet={selectedFacet}
            hoveredFacet={hoveredProject}
            onFacetSelect={handleFacetSelect}
            onFacetHover={handleFacetHover}
            isTransitioning={isTransitioning}
            performanceConfig={performanceConfig}
          />
          
          {/* Environment */}
          <Environment 
            key={environmentProps.files}
            files={environmentProps.files || config.environment.hdri} 
            background={config.environment.showBackground} 
            rotation={config.environment.rotation}
          />
          
          {/* Post-processing */}
          <EffectComposer enabled={true}>
            <Bloom 
              intensity={Object.values(effectsEnabled).some(Boolean) ? 0 : 0.0001}
              luminanceThreshold={1.0}
              luminanceSmoothing={0.9}
              radius={0.5}
              enabled={!Object.values(effectsEnabled).some(Boolean)}
            />
            
            {effectsEnabled.bloom && (
              <Bloom 
                luminanceThreshold={postProcessingConfig.bloom.luminanceThreshold} 
                luminanceSmoothing={postProcessingConfig.bloom.luminanceSmoothing} 
                intensity={postProcessingConfig.bloom.intensity} 
                radius={postProcessingConfig.bloom.radius} 
              />
            )}
            {effectsEnabled.chromaticAberration && (
              <ChromaticAberration 
                offset={postProcessingConfig.chromaticAberration.offset} 
                radialModulation={postProcessingConfig.chromaticAberration.radialModulation} 
                modulationOffset={postProcessingConfig.chromaticAberration.modulationOffset} 
              />
            )}
            {effectsEnabled.noise && (
              <Noise 
                opacity={postProcessingConfig.noise.opacity} 
                blendFunction={BlendFunction.OVERLAY} 
              />
            )}
            {effectsEnabled.vignette && (
              <Vignette 
                eskil={postProcessingConfig.vignette.eskil} 
                offset={postProcessingConfig.vignette.offset} 
                darkness={postProcessingConfig.vignette.darkness} 
              />
            )}
          </EffectComposer>
          
          {/* Orbit controls */}
          <OrbitControls 
            makeDefault
            enabled={orbitControlsEnabled}
            enableZoom={config.camera.orbitControls.enableZoom && orbitControlsEnabled}
            enablePan={config.camera.orbitControls.enablePan && orbitControlsEnabled}
            rotateSpeed={config.camera.orbitControls.rotateSpeed}
            minPolarAngle={config.camera.orbitControls.minPolarAngle}
            maxPolarAngle={config.camera.orbitControls.maxPolarAngle}
          />
        </Canvas>
      </div>
      
      {/* Scroll-based content sections */}
      
      {/* About Section */}
      <AboutSection 
        visible={visibleSections.about}
        onClose={() => goToSection('intro')}
      />
      
      {/* Footer Section */}
      <FooterSection 
        visible={visibleSections.footer}
        onLoopBack={handleLoopBack}
      />
      
      {/* Development/Debug UI Controls */}
      <ControlsToggle 
        showUI={showUI} 
        toggleUI={toggleUI} 
        disabled={isTransitioning}
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
      
      {/* Project detail card - FIXED: Close returns to intro */}
      {selectedProject && (
        <ProjectDetailCard 
          project={selectedProject}
          visible={!!selectedProject}
          onClose={handleProjectClose} // FIXED: This now returns to intro
        />
      )}
      
      <AccessibilityInstructions visible={true} />
      
      {/* Main interaction button - updated for scroll system */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}>
        <div style={{ position: 'absolute', bottom: '20px', left: 0, width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <button 
            onClick={handleExplodeToggle}
            disabled={isTransitioning}
            style={{
              ...config.ui.button.styles,
              pointerEvents: 'auto',
              opacity: isTransitioning ? 0.6 : 1,
              cursor: isTransitioning ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!isTransitioning) {
                Object.entries(config.ui.button.hoverStyles).forEach(([key, value]) => {
                  e.currentTarget.style[key] = value;
                });
              }
            }}
            onMouseLeave={(e) => {
              Object.entries(config.ui.button.defaultStyles).forEach(([key, value]) => {
                e.currentTarget.style[key] = value;
              });
            }}
          >
            {currentSection.key === 'intro' ? 'View Projects' : 
             currentSection.key === 'projects' && selectedProject ? 'Close Project' :
             currentSection.key === 'projects' ? 'Back to Intro' : 
             'Navigate'}
          </button>
        </div>
      </div>
      
      {/* Spacer div to enable scrolling */}
      <div style={{ 
        height: '400vh', // 4x viewport height to enable scroll sections
        position: 'absolute',
        top: '100vh',
        left: 0,
        width: '100%',
        pointerEvents: 'none',
        zIndex: -1
      }} />
    </>
  );
}

export default App;