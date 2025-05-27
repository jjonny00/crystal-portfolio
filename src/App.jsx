// App.jsx - Complete updated version with state machine integration

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

// Import your existing components
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

  // State machine state
  const [crystalState, setCrystalState] = useState(CRYSTAL_STATES.WHOLE)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  // Project selection state
  const [selectedProject, setSelectedProject] = useState(null)
  const [hoveredFacet, setHoveredFacet] = useState(null)
  const [showDetailCard, setShowDetailCard] = useState(false)
  
  // Your existing state
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
  
  // ... rest of your existing state ...
  const [orbitControlsEnabled, setOrbitControlsEnabled] = useState(true)
  
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
    // Start with safe defaults that will be overridden
    return {
      useNormalMaps: false,  // Default to OFF
      textureQuality: 'low', // Default to LOW
      usePBR: false,         // Default to OFF
      renderScale: 0.7
    };
  });

  // Helper to dispatch state machine events
  const dispatchEvent = useCallback((event) => {
    const nextState = getNextState(crystalState, event);
    if (nextState !== crystalState) {
      console.log(`Crystal state transition: ${crystalState} -> ${nextState} (${event})`);
      setCrystalState(nextState);
    }
  }, [crystalState]);

  // Effect to handle state transitions and animations
  useEffect(() => {
    switch (crystalState) {
      case CRYSTAL_STATES.WHOLE:
        // Crystal is whole, nothing special to do
        setIsTransitioning(false);
        break;
        
      case CRYSTAL_STATES.FRACTURING:
        // Start fracturing animation
        setIsTransitioning(true);
        
        // After fracturing animation completes, move to exploding
        const fractureTimer = setTimeout(() => {
          dispatchEvent(CRYSTAL_EVENTS.FRACTURE_COMPLETE);
        }, config.timing.fracture.duration);
        
        return () => clearTimeout(fractureTimer);
        
      case CRYSTAL_STATES.EXPLODING:
        // Continue with explosion animation
        setIsTransitioning(true);
        
        // After explosion animation completes
        const explosionTimer = setTimeout(() => {
          dispatchEvent(CRYSTAL_EVENTS.EXPLOSION_COMPLETE);
        }, config.timing.camera.explodeDuration);
        
        return () => clearTimeout(explosionTimer);
        
      case CRYSTAL_STATES.EXPLODED:
        // Crystal is fully exploded
        setIsTransitioning(false);
        break;
        
      case CRYSTAL_STATES.PROJECT_SELECTED:
        // Project is selected, nothing special to do
        setIsTransitioning(false);
        break;
        
      case CRYSTAL_STATES.REFORMING:
        // Start reforming animation
        setIsTransitioning(true);
        
        // After reforming animation completes
        const reformTimer = setTimeout(() => {
          dispatchEvent(CRYSTAL_EVENTS.REFORM_COMPLETE);
        }, config.timing.camera.reformDuration);
        
        return () => clearTimeout(reformTimer);
    }
  }, [crystalState, dispatchEvent, config.timing]);

  // Calculate if crystal is in exploded state for compatibility with existing components
  const isExploded = crystalState !== CRYSTAL_STATES.WHOLE && 
                     crystalState !== CRYSTAL_STATES.REFORMING;

  // Handle facet selection - now with project mapping
  const handleFacetSelect = useCallback((facetKey) => {
    if (isTransitioning) return; // Prevent interaction during transitions
    
    // Find project associated with this facet
    const project = getProjectByFacetKey(facetKey);
    
    // If the same facet is selected, deselect it
    if (selectedProject && selectedProject.facetKey === facetKey) {
      setIsTransitioning(true);
      setShowDetailCard(false);
      
      // Wait for card to animate out before transitioning state
      setTimeout(() => {
        setSelectedProject(null);
        dispatchEvent(CRYSTAL_EVENTS.DESELECT_PROJECT);
        
        // Enable orbit controls after transition
        setTimeout(() => {
          setOrbitControlsEnabled(true);
          setIsTransitioning(false);
        }, config.timing.camera.facetReturnDuration || 1200);
      }, 300);
    } else {
      // Select new project
      setSelectedProject(project);
      setOrbitControlsEnabled(false);
      dispatchEvent(CRYSTAL_EVENTS.SELECT_PROJECT);
      
      // Show detail card after camera animation completes
      setTimeout(() => {
        setShowDetailCard(true);
        setIsTransitioning(false);
      }, config.timing.camera.facetZoomDuration + 100);
    }
  }, [selectedProject, isTransitioning, dispatchEvent, config.timing.camera]);
  
  // Handle facet hover
  const handleFacetHover = useCallback((facetKey) => {
    if (!isTransitioning) {
      setHoveredFacet(facetKey);
    }
  }, [isTransitioning]);

  // Handle explosion toggle with proper state machine events
  const handleExplodeToggle = useCallback(() => {
    if (isTransitioning) return; // Prevent interaction during transitions
    
    if (crystalState === CRYSTAL_STATES.WHOLE) {
      // Start explosion sequence
      dispatchEvent(CRYSTAL_EVENTS.EXPLODE);
    } else if (crystalState === CRYSTAL_STATES.EXPLODED || crystalState === CRYSTAL_STATES.PROJECT_SELECTED) {
      // Start reform sequence
      if (selectedProject) {
        // If a project is selected, need special handling
        setIsTransitioning(true);
        setShowDetailCard(false);
        
        setTimeout(() => {
          setSelectedProject(null);
          dispatchEvent(CRYSTAL_EVENTS.REFORM);
          
          // Enable orbit controls after reform completes
          setTimeout(() => {
            setOrbitControlsEnabled(true);
            setIsTransitioning(false);
          }, config.timing.camera.reformDuration || 900);
        }, 300);
      } else {
        // Normal reform if no project is selected
        dispatchEvent(CRYSTAL_EVENTS.REFORM);
      }
    }
  }, [crystalState, selectedProject, isTransitioning, dispatchEvent, config.timing.camera]);

  // Get the selected facet key for compatibility with existing components
  const selectedFacet = selectedProject?.facetKey || null;

  // Update device profile when it changes
  const [lastAppliedProfile, setLastAppliedProfile] = useState(null);
  const [initialProfileApplied, setInitialProfileApplied] = useState(false);
  
  useEffect(() => {
    if (devicePerformanceProfile && !isDetecting) {
      // Only apply if the profile actually changed
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
        
        // Also update effects based on device profile (with null checking)
        if (devicePerformanceProfile.postProcessing) {
          setEffectsEnabled({
            bloom: devicePerformanceProfile.postProcessing.bloom || false,
            chromaticAberration: devicePerformanceProfile.postProcessing.chromaticAberration || false,
            noise: devicePerformanceProfile.postProcessing.noise || true,
            vignette: devicePerformanceProfile.postProcessing.vignette || false
          });
        }
        
        // Force material refresh by toggling a dummy state
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
    // Only update external config after initial device profile load
    if (updateExternalPerformanceConfig && hasInitialized && initialProfileApplied) {
      updateExternalPerformanceConfig(performanceConfig);
    } else if (devicePerformanceProfile && !hasInitialized) {
      // Mark as initialized after first device profile load
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
    // Update the enabled state
    setEffectsEnabled(prev => ({
      ...prev,
      [effect]: enabled
    }));
    
    // If additional parameters are provided, update the configuration
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

  // Set up keyboard controls
  useKeyboardControls({
    crystalState,
    dispatchEvent,
    selectedProject,
    setSelectedProject,
    hoveredFacet,
    setHoveredFacet,
    showDetailCard,
    setShowDetailCard,
    orbitControlsEnabled,
    setOrbitControlsEnabled,
    config,
    isTransitioning,
    setIsTransitioning,
    effectsEnabled,
    handleToggleEffect,
    performanceConfig,
    handlePerformanceConfigUpdate,
    showUI,
    setShowUI
  });

  // Get optimal canvas and environment props
  const canvasProps = getOptimalCanvasProps();
  const environmentProps = getOptimalEnvironmentProps();

  return (
    <>
      {/* FPS Display - show on all devices during development */}
      <FpsDisplay 
        visible={true}
        position="top-right"
        showDetails={false}
      />
      
      {/* Performance alerts for all devices */}
      <PerformanceAlert 
        visible={true}
        threshold={deviceProfile?.isMobile ? 25 : 30}
        onPerformanceIssue={(data) => {
          console.warn('Performance issue:', data);
        }}
      />

      {/* Canvas with optimized props */}
      <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
        <Canvas 
          shadows 
          camera={{ position: config.camera.startingPosition, fov: config.camera.fov }} 
          {...canvasProps} // Apply optimal canvas settings
          gl={{ 
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.2,
            outputColorSpace: THREE.SRGBColorSpace,
            // Apply device-optimized GL settings
            ...canvasProps.gl
          }}>
          
          {/* FPS Counter inside Canvas */}
          <FPSCounter />
          
          <color attach="background" args={['#050505']} />
          
          {/* Your existing lighting */}
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
          
          {/* Updated crystal scene with state machine props */}
          <EnhancedCrystalScene 
            isExploded={isExploded} 
            crystalState={crystalState}
            config={config} 
            materialVariant={materialVariant}
            blackOpalConfig={blackOpalConfig}
            iceOpalConfig={iceOpalConfig}
            selectedFacet={selectedFacet}
            hoveredFacet={hoveredFacet}
            onFacetSelect={handleFacetSelect}
            onFacetHover={handleFacetHover}
            isTransitioning={isTransitioning}
            performanceConfig={performanceConfig}
          />
          
          {/* Environment with optimized settings */}
          <Environment 
            key={environmentProps.files} // Force reload when HDRI path changes
            files={environmentProps.files || config.environment.hdri} 
            background={config.environment.showBackground} 
            rotation={config.environment.rotation}
          />
          
          {/* Your existing post-processing */}
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
          
          {/* Your existing orbit controls */}
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
      
      {/* All your existing UI components */}
      <ControlsToggle 
        showUI={showUI} 
        toggleUI={toggleUI} 
        disabled={isTransitioning}
      />
      
      {showUI && (
        <TabbedControlPanel 
          visible={true}
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
      
      {/* ProjectDetailCard replacing FacetDetailCard */}
      {selectedProject && 
        <ProjectDetailCard 
          project={selectedProject}
          visible={showDetailCard}
          onClose={() => {
            if (isTransitioning) return;
            
            setIsTransitioning(true);
            setShowDetailCard(false);
            
            setTimeout(() => {
              setSelectedProject(null);
              dispatchEvent(CRYSTAL_EVENTS.DESELECT_PROJECT);
              
              setTimeout(() => {
                setOrbitControlsEnabled(true);
                setIsTransitioning(false);
              }, config.timing.camera.facetReturnDuration || 1200);
            }, 300);
          }}
        />
      }
      
      <AccessibilityInstructions visible={true} />
      
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
            {crystalState === CRYSTAL_STATES.WHOLE ? 'View Projects' : 'Close Projects'}
          </button>
        </div>
      </div>
    </>
  );
}

export default App;