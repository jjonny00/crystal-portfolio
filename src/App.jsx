// src/App.jsx - EMERGENCY FIX for mobile scrolling
// Key fix: Remove blocking touch events and ensure scroll is always enabled

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

// SIMPLE mobile detection without the problematic useMobileScrolling hook
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
};

// Mobile scroll hint component
const MobileScrollHint = ({ visible, isMobile, scrollProgress }) => {
  if (!isMobile || !visible || scrollProgress > 0.05) return null;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '60px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      color: 'white',
      fontSize: '12px',
      opacity: 0.7,
      textAlign: 'center',
      pointerEvents: 'none',
      background: 'rgba(0, 0, 0, 0.3)',
      padding: '8px 16px',
      borderRadius: '20px',
      backdropFilter: 'blur(10px)'
    }}>
      <div>Scroll to explore</div>
      <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.8 }}>
        Try scrolling up and down
      </div>
    </div>
  );
};

// Debug component to check scroll status
const ScrollDebugger = ({ scrollData, isMobile }) => {
  if (!scrollData.debugMode) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: 'monospace',
      zIndex: 10000,
      pointerEvents: 'none',
      maxWidth: '200px'
    }}>
      <div>Mobile: {isMobile ? 'YES' : 'NO'}</div>
      <div>Touch Points: {navigator.maxTouchPoints || 0}</div>
      <div>Section: {scrollData.currentSection.key}</div>
      <div>Progress: {Math.round(scrollData.scrollProgress * 100)}%</div>
      <div>Raw Progress: {Math.round(scrollData.rawScrollProgress * 100)}%</div>
      <div>Crystal State: {scrollData.crystalState}</div>
      <div>Is Scrolling: {scrollData.isScrolling ? 'YES' : 'NO'}</div>
      <div>Window: {window.innerWidth}x{window.innerHeight}</div>
      <div>Body Height: {document.body.scrollHeight}px</div>
      <div>Scroll Top: {Math.round(window.pageYOffset)}px</div>
    </div>
  );
};

function App() {
  // SIMPLIFIED mobile detection
  const isMobile = isMobileDevice();

  const { 
    performanceProfile: devicePerformanceProfile, 
    deviceProfile, 
    getOptimalCanvasProps,
    getOptimalEnvironmentProps,
    updateExternalPerformanceConfig,
    isDetecting 
  } = useDeviceProfile({ 
    enableDebugLogging: false,
    enableOrientationLock: false // DISABLE orientation lock for now
  });

  // Enhanced scroll-based crystal control system
  const scrollCrystalData = useScrollCrystal({
    enableScrollControl: true,
    debugMode: true, // Keep debug on for now
    smoothTransitions: !isMobile, // Disable smooth transitions on mobile for now
    onSectionChange: (newSection, oldSection) => {
      console.log(`🔄 Section: ${oldSection.key} → ${newSection.key}`);
      if (isMobile) {
        console.log(`📱 Mobile scroll: ${Math.round(scrollCrystalData.scrollProgress * 100)}%`);
      }
    },
    // Simplified easing for mobile
    easingDuration: isMobile ? 300 : 1200,
    easingFunction: (t) => t // Linear for mobile, no fancy easing
  });
  
  // Extract scroll state
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

  // CRITICAL FIX: Set scroll height but don't prevent scrolling
  useEffect(() => {
    const mobileMultiplier = isMobile ? 5 : 4;
    const totalHeight = `${mobileMultiplier * 100}vh`;
    
    // Set the scroll height
    document.body.style.height = totalHeight;
    
    // CRITICAL: Ensure scrolling is always enabled
    document.body.style.overflowY = 'auto';
    document.body.style.overflowX = 'hidden';
    
    // Enable touch scrolling on mobile
    if (isMobile) {
      document.body.style.webkitOverflowScrolling = 'touch';
      document.body.style.overscrollBehavior = 'auto'; // Allow normal scroll behavior
      console.log(`📱 Mobile: Set scroll height to ${totalHeight}`);
      console.log(`📱 Mobile: Overflow Y = ${document.body.style.overflowY}`);
      console.log(`📱 Mobile: Touch scrolling enabled`);
    }
    
    return () => {
      document.body.style.height = '';
      document.body.style.overflowY = '';
      document.body.style.overflowX = '';
      document.body.style.webkitOverflowScrolling = '';
      document.body.style.overscrollBehavior = '';
    };
  }, [isMobile]);

  // Navigation handlers
  const handleWorkClick = useCallback(() => {
    console.log('Work section clicked');
    goToSection('projects-overview');
  }, [goToSection]);

  const handleAboutClick = useCallback(() => {
    console.log('About section clicked');
    goToSection('about');
  }, [goToSection]);

  const handleProcessClick = useCallback(() => {
    console.log('Process section clicked');
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

  // Handle facet selection
  const handleFacetSelect = useCallback((facetKey) => {
    if (isTransitioning) return;
    
    const project = getProjectByFacetKey(facetKey);
    
    if (selectedProject && selectedProject.facetKey === facetKey) {
      handleProjectClose();
    } else {
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

  // Handle explosion toggle
  const handleExplodeToggle = useCallback(() => {
    if (isTransitioning) return;
    
    if (currentSection.key === 'intro' || currentSection.key === 'intro-close') {
      goToSection('projects-overview');
    } else if (currentSection.key === 'projects-overview') {
      if (selectedProject) {
        handleProjectClose();
      } else {
        goToSection('intro');
      }
    }
  }, [currentSection.key, selectedProject, isTransitioning, goToSection, handleProjectClose]);

  const selectedFacet = selectedProject?.facetKey || null;

  // Performance management (simplified)
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

  // Handler functions
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    if (updateExternalPerformanceConfig && hasInitialized && initialProfileApplied) {
      updateExternalPerformanceConfig(performanceConfig);
    } else if (devicePerformanceProfile && !hasInitialized) {
      setHasInitialized(true);
    }
  }, [performanceConfig, updateExternalPerformanceConfig, hasInitialized, devicePerformanceProfile, initialProfileApplied]);

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

  // Keyboard controls (simplified for mobile)
  useKeyboardControls({
    isExploded: crystalState === CRYSTAL_STATES.EXPLODED || crystalState === CRYSTAL_STATES.EXPLODING || crystalState === CRYSTAL_STATES.PROJECT_SELECTED,
    setIsExploded: (exploded) => {
      if (exploded) {
        goToSection('projects-overview');
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
    setShowDetailCard: () => {},
    setOrbitControlsEnabled,
    config,
    isTransitioning,
    setIsTransitioning: () => {},
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

  // Get optimal props
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

      {/* Mobile Scroll Hint */}
      <MobileScrollHint 
        visible={scrollCrystalData.isInIntro} 
        isMobile={isMobile}
        scrollProgress={scrollCrystalData.scrollProgress}
      />

      {/* Debug component */}
      <ScrollDebugger scrollData={scrollCrystalData} isMobile={isMobile} />

      {/* FIXED: Main 3D Canvas - simplified positioning */}
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh',
          zIndex: 1
        }}
      >
        <Canvas 
          shadows 
          camera={{ position: config.camera.startingPosition, fov: config.camera.fov }} 
          {...canvasProps}
          gl={{ 
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.2,
            outputColorSpace: THREE.SRGBColorSpace,
            ...canvasProps.gl
          }}
          style={{ 
            width: '100%', 
            height: '100%'
          }}
        >
          
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
          
          {/* Crystal scene */}
          <EnhancedCrystalScene 
            isExploded={crystalState === CRYSTAL_STATES.EXPLODED || crystalState === CRYSTAL_STATES.EXPLODING || crystalState === CRYSTAL_STATES.PROJECT_SELECTED} 
            crystalState={crystalState}
            config={config} 
            materialVariant={materialVariant}
            blackOpalConfig={blackOpalConfig}
            iceOpalConfig={iceOpalConfig}
            selectedFacet={scrollCrystalData.selectedProject}
            hoveredFacet={hoveredProject}
            onFacetSelect={isMobile ? null : handleFacetSelect} // Disable on mobile for now
            onFacetHover={isMobile ? null : handleFacetHover}   // Disable on mobile for now
            isTransitioning={isTransitioning}
            performanceConfig={performanceConfig}
            scrollCrystalData={scrollCrystalData}
            isMobileDevice={isMobile}
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
          
          {/* Orbit controls - DISABLED ON MOBILE */}
          <OrbitControls 
            makeDefault
            enabled={!isMobile && !scrollCrystalData.isInProjectSection() && orbitControlsEnabled}
            enableZoom={!isMobile && config.camera.orbitControls.enableZoom && orbitControlsEnabled}
            enablePan={!isMobile && config.camera.orbitControls.enablePan && orbitControlsEnabled}
            rotateSpeed={config.camera.orbitControls.rotateSpeed}
            minPolarAngle={config.camera.orbitControls.minPolarAngle}
            maxPolarAngle={config.camera.orbitControls.maxPolarAngle}
          />
        </Canvas>
      </div>
      
      {/* UI components */}
      <AboutSection 
        visible={visibleSections.about}
        onClose={() => goToSection('intro')}
      />
      
      <FooterSection 
        visible={visibleSections.footer}
        onLoopBack={handleLoopBack}
      />
      
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
      
      {/* Project Detail Card */}
      {scrollCrystalData.getCurrentProject() && (
        <ProjectDetailCard 
          project={getProjectByFacetKey(scrollCrystalData.selectedProject)}
          visible={!!scrollCrystalData.getCurrentProject()}
          onClose={handleProjectClose}
          isMobile={isMobile}
        />
      )}
      
      <AccessibilityInstructions visible={true} />
      
      {/* Main interaction button */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}>
        <div style={{ position: 'absolute', bottom: '20px', left: 0, width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <button 
            onClick={handleExplodeToggle}
            disabled={isTransitioning}
            style={{
              ...config.ui.button.styles,
              pointerEvents: 'auto',
              opacity: isTransitioning ? 0.6 : 1,
              cursor: isTransitioning ? 'not-allowed' : 'pointer',
              // Mobile-specific adjustments
              ...(isMobile && {
                padding: '12px 24px',
                fontSize: '18px',
                minHeight: '48px'
              })
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
            {(currentSection.key === 'intro' || currentSection.key === 'intro-close') ? 'View Projects' : 
             currentSection.key === 'projects-overview' && selectedProject ? 'Close Project' :
             currentSection.key === 'projects-overview' ? 'Back to Intro' : 
             'Navigate'}
          </button>
        </div>
      </div>
      
      {/* Spacer for scroll content */}
      <div style={{ 
        height: isMobile ? '400vh' : '300vh',
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