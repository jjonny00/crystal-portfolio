// App.jsx - Integration example showing how to add the performance system

import { useState, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import './App.css'

// Import your existing components
import * as defaultConfig from './crystalConfig'
import EnhancedCrystalScene from './components/three/EnhancedCrystalScene'
import CrystalControls from './components/ui/CrystalControls'
import MaterialSelector from './components/ui/MaterialSelector'
import BlackOpalControls from './components/ui/BlackOpalControls'
import IceOpalControls from './components/ui/IceOpalControls'
import ControlsToggle from './components/ui/ControlsToggle'
import FacetDetailCard from './components/ui/FacetDetailCard'
import AccessibilityInstructions from './components/ui/AccessibilityInstructions'
import PostProcessingControls from './components/ui/PostProcessingControls'
import PerformanceControls from './components/ui/PerformanceControls'
import TabbedControlPanel from './components/ui/TabbedControlPanel'
import useKeyboardControls from './hooks/useKeyboardControls'

// Import new performance system
import { useDeviceProfile } from './hooks/useDeviceProfile'
import FpsDisplay, { FPSCounter, PerformanceAlert } from './components/ui/FpsDisplay'

function App() {
  // ADD THIS: Device profile detection
  const { 
    performanceProfile: devicePerformanceProfile, 
    deviceProfile, 
    getOptimalCanvasProps,
    getOptimalEnvironmentProps,
    updateExternalPerformanceConfig,
    isDetecting 
  } = useDeviceProfile({ 
    enableDebugLogging: false,  // Turn off constant logging
    enableOrientationLock: true 
  });

  // Your existing state
  const [isExploded, setIsExploded] = useState(false)
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
  const [selectedFacet, setSelectedFacet] = useState(null)
  const [hoveredFacet, setHoveredFacet] = useState(null)
  const [showDetailCard, setShowDetailCard] = useState(false)
  const [orbitControlsEnabled, setOrbitControlsEnabled] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
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
  
  // MODIFY THIS: Use device profile for initial performance config
  const [performanceConfig, setPerformanceConfig] = useState(() => {
    // If device profile is available, use it; otherwise use defaults
    return devicePerformanceProfile || {
      useNormalMaps: true,
      textureQuality: 'high',
      usePBR: true
    };
  });

  // ADD THIS: Update performance config when device profile loads (with proper change detection)
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

  // ADD THIS: Update device profile system when performance config changes (but prevent loops)
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
  
  // Performance config update handler
  const handlePerformanceConfigUpdate = useCallback((newConfig) => {
    console.log("Updating performance config:", newConfig);
    setPerformanceConfig(newConfig);
  }, []);

  // Toggle UI visibility
  const toggleUI = useCallback(() => {
    setShowUI(!showUI);
  }, [showUI]);
  
  // Handle facet selection with improved camera transitions
  const handleFacetSelect = useCallback((facetKey) => {
    if (isTransitioning) return; // Prevent interaction during transitions
    
    setIsTransitioning(true);
    
    if (selectedFacet === facetKey) {
      // Deselect if already selected - hide card first, then transition camera, then reset selection
      setShowDetailCard(false);
      
      // Wait for card to animate out before starting camera transition
      setTimeout(() => {
        setSelectedFacet(null);
        
        // Wait for camera transition to complete before enabling orbit controls
        setTimeout(() => {
          setOrbitControlsEnabled(true);
          setIsTransitioning(false);
        }, config.timing.camera.facetReturnDuration || 1200);
      }, 300);
    } else {
      // Select new facet - first set selection, disable controls, then animate card in after camera transition
      setSelectedFacet(facetKey);
      setOrbitControlsEnabled(false);
      
      // Show detail card after camera animation completes
      setTimeout(() => {
        setShowDetailCard(true);
        setIsTransitioning(false);
      }, config.timing.camera.facetZoomDuration + 100);
    }
  }, [selectedFacet, config.timing.camera, isTransitioning]);
  
  // Handle facet hover
  const handleFacetHover = useCallback((facetKey) => {
    if (!isTransitioning) {
      setHoveredFacet(facetKey);
    }
  }, [isTransitioning]);

  // Handle explosion state toggle with proper transition handling
  const handleExplodeToggle = useCallback(() => {
    if (isTransitioning) return; // Prevent interaction during transitions
    
    setIsTransitioning(true);
    
    if (selectedFacet) {
      // If a facet is selected and we're reforming, need special handling
      // First close detail card
      setShowDetailCard(false);
      
      setTimeout(() => {
        // Then deselect facet to trigger camera transition back to exploded view
        setSelectedFacet(null);
        
        // Wait for that transition to complete
        setTimeout(() => {
          // Now toggle exploded state
          setIsExploded(false);
          
          // Finally, enable orbit controls after reform completes
          setTimeout(() => {
            setOrbitControlsEnabled(true);
            setIsTransitioning(false);
          }, config.timing.camera.reformDuration || 900);
        }, config.timing.camera.facetReturnDuration || 1200);
      }, 300);
    } else {
      // Normal toggle without facet selected
      setIsExploded(!isExploded);
      
      // Enable controls after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
      }, isExploded ? 
        config.timing.camera.reformDuration || 900 : 
        config.timing.camera.explodeDuration || 1600);
    }
  }, [isExploded, selectedFacet, config.timing.camera, isTransitioning]);

  // ADD THIS: Get optimal canvas and environment props
  const canvasProps = getOptimalCanvasProps();
  const environmentProps = getOptimalEnvironmentProps();

  return (
    <>
      {/* ADD THIS: FPS Display - only show on non-mobile devices by default */}
      {deviceProfile && !deviceProfile.isMobile && (
        <FpsDisplay 
          visible={true}
          position="top-right"
          showDetails={false}
        />
      )}
      
      {/* ADD THIS: Performance alerts for all devices */}
      <PerformanceAlert 
        visible={true}
        threshold={deviceProfile?.isMobile ? 25 : 30}
        onPerformanceIssue={(data) => {
          console.warn('Performance issue:', data);
        }}
      />

      {/* MODIFY THIS: Canvas with optimized props */}
      <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
        <Canvas 
          shadows 
          camera={{ position: config.camera.startingPosition, fov: config.camera.fov }} 
          {...canvasProps} // ADD THIS: Apply optimal canvas settings
          gl={{ 
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.2,
            outputColorSpace: THREE.SRGBColorSpace,
            // ADD THIS: Apply device-optimized GL settings
            ...canvasProps.gl
          }}>
          
          {/* ADD THIS: FPS Counter inside Canvas */}
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
          
          {/* Your existing crystal scene */}
          <EnhancedCrystalScene 
            isExploded={isExploded} 
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
          
          {/* MODIFY THIS: Environment with optimized settings and key for reloading */}
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
      
      {/* All your existing UI components stay the same */}
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
      
      {/* Rest of your existing UI */}
      {selectedFacet && 
        <FacetDetailCard 
          facet={config.facetLabels.find(f => f.key === selectedFacet)}
          visible={showDetailCard}
          onClose={() => {
            if (isTransitioning) return;
            
            setIsTransitioning(true);
            setShowDetailCard(false);
            
            setTimeout(() => {
              setSelectedFacet(null);
              
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
            {isExploded ? 'Reform Crystal' : 'Reveal Facets'}
          </button>
        </div>
      </div>
    </>
  );
}

export default App;