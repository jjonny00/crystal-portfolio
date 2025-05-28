// App.jsx - Updated for Scroll-Driven Experience

import { useState, useCallback, useEffect } from 'react'
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
import useScrollKeyboardControls from './hooks/useScrollKeyboardControls'

// Import existing components
import * as defaultConfig from './crystalConfig'
import ScrollCrystalScene from './components/three/ScrollCrystalScene'
import CrystalControls from './components/ui/CrystalControls'
import MaterialSelector from './components/ui/MaterialSelector'
import BlackOpalControls from './components/ui/BlackOpalControls'
import IceOpalControls from './components/ui/IceOpalControls'
import ControlsToggle from './components/ui/ControlsToggle'
import ProjectDetailCard from './components/ui/ProjectDetailCard'
import ScrollProgress from './components/ui/ScrollProgress'
import ScrollHint from './components/ui/ScrollHint'
import ScrollAccessibilityInstructions from './components/ui/ScrollAccessibilityInstructions'
import PostProcessingControls from './components/ui/PostProcessingControls'
import PerformanceControls from './components/ui/PerformanceControls'
import TabbedControlPanel from './components/ui/TabbedControlPanel'
import Navigation from './components/ui/Navigation'

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

  // Configuration and material settings
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
  
  // Current project state
  const [currentProject, setCurrentProject] = useState(null);
  const [showProjectDetail, setShowProjectDetail] = useState(false);
  
  // Scroll-driven crystal system
  const scrollCrystalData = useScrollCrystal({
    onStateChange: (newState) => {
      console.log('Crystal state changed to:', newState);
    },
    onProjectChange: (project) => {
      console.log('Project changed to:', project?.title);
      setCurrentProject(project);
      setShowProjectDetail(!!project);
    },
    config
  });
  
  // Add keyboard controls for scroll navigation
  useScrollKeyboardControls({ scrollCrystalData });
  
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

  // Navigation handlers (updated for scroll experience)
  const handleWorkClick = useCallback(() => {
    console.log('Work section clicked - scrolling to projects');
    scrollCrystalData.goToSection('explosion');
  }, [scrollCrystalData]);

  const handleAboutClick = useCallback(() => {
    console.log('About section clicked - scrolling to intro');
    scrollCrystalData.goToSection('intro');
  }, [scrollCrystalData]);

  const handleProcessClick = useCallback(() => {
    console.log('Process section clicked - cycling material');
    setMaterialVariant(prev => {
      const variants = ['default', 'glass', 'gem', 'holographic', 'blackOpal', 'iceOpal'];
      const currentIndex = variants.indexOf(prev);
      const nextIndex = (currentIndex + 1) % variants.length;
      return variants[nextIndex];
    });
  }, []);

  const handleContactClick = useCallback(() => {
    console.log('Contact section clicked - scrolling to end');
    scrollCrystalData.goToSection('reform');
  }, [scrollCrystalData]);

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
        isTransitioning={scrollCrystalData.isTransitioning}
        crystalState={scrollCrystalData.crystalState}
      />

      {/* Scroll Progress Indicator */}
      <ScrollProgress 
        scrollCrystalData={scrollCrystalData}
        visible={true}
      />

      {/* Scroll Hint */}
      <ScrollHint 
        scrollCrystalData={scrollCrystalData}
        visible={true}
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

      {/* Canvas with optimized props */}
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        position: 'fixed', 
        top: 0, 
        left: 0,
        zIndex: 0 // Behind scroll content
      }}>
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
          
          {/* Scroll-driven Crystal Scene */}
          <ScrollCrystalScene 
            scrollCrystalData={scrollCrystalData}
            config={config} 
            materialVariant={materialVariant}
            blackOpalConfig={blackOpalConfig}
            iceOpalConfig={iceOpalConfig}
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
                luminanceThreshold={config.postProcessing.bloom.luminanceThreshold} 
                luminanceSmoothing={config.postProcessing.bloom.luminanceSmoothing} 
                intensity={config.postProcessing.bloom.intensity} 
                radius={config.postProcessing.bloom.radius} 
              />
            )}
            {effectsEnabled.chromaticAberration && (
              <ChromaticAberration 
                offset={config.postProcessing.chromaticAberration.offset} 
                radialModulation={config.postProcessing.chromaticAberration.radialModulation} 
                modulationOffset={config.postProcessing.chromaticAberration.modulationOffset} 
              />
            )}
            {effectsEnabled.noise && (
              <Noise 
                opacity={config.postProcessing.noise.opacity} 
                blendFunction={BlendFunction.OVERLAY} 
              />
            )}
            {effectsEnabled.vignette && (
              <Vignette 
                eskil={config.postProcessing.vignette.eskil} 
                offset={config.postProcessing.vignette.offset} 
                darkness={config.postProcessing.vignette.darkness} 
              />
            )}
          </EffectComposer>
          
          {/* Orbit controls - disabled for scroll experience */}
          <OrbitControls 
            makeDefault
            enabled={false} // Disabled for scroll experience
            enableZoom={false}
            enablePan={false}
            enableRotate={false}
          />
        </Canvas>
      </div>
      
      {/* Existing UI components - kept for optional manual control */}
      <ControlsToggle 
        showUI={showUI} 
        toggleUI={toggleUI} 
        disabled={scrollCrystalData.isTransitioning}
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
      {currentProject && (
        <ProjectDetailCard 
          project={currentProject}
          visible={showProjectDetail && scrollCrystalData.isInProjects}
          onClose={() => {
            // In scroll mode, closing navigates to next project or reform
            if (scrollCrystalData.currentProjectIndex < scrollCrystalData.projectCount - 1) {
              scrollCrystalData.goToNextProject();
            } else {
              scrollCrystalData.goToSection('reform');
            }
          }}
        />
      )}
      
      {/* Updated Accessibility Instructions for scroll experience */}
      <ScrollAccessibilityInstructions 
        visible={true} 
        scrollCrystalData={scrollCrystalData}
      />
      
      {/* Invisible scroll content for proper document height */}
      <div style={{ 
        position: 'relative', 
        zIndex: -1, 
        pointerEvents: 'none',
        opacity: 0
      }}>
        {/* This content ensures proper document height for scrolling */}
        <div style={{ height: '100vh' }}>Intro</div>
        <div style={{ height: '100vh' }}>Explosion</div>
        {scrollCrystalData.projectCount > 0 && 
          Array.from({ length: scrollCrystalData.projectCount }).map((_, i) => (
            <div key={i} style={{ height: '100vh' }}>Project {i + 1}</div>
          ))
        }
        <div style={{ height: '100vh' }}>Reform</div>
      </div>
    </>
  );
}

export default App;