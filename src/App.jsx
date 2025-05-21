// App.jsx - Complete file with Performance Controls and Tabbed UI
import { useState, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import './App.css'

// Import initial configuration
import * as defaultConfig from './crystalConfig'

// Import modular components
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

function App() {
  // Core state
  const [isExploded, setIsExploded] = useState(false)
  const [config, setConfig] = useState({
    ...defaultConfig,
    // Add facet zoom timing if not present
    timing: {
      ...defaultConfig.timing,
      camera: {
        ...defaultConfig.timing.camera,
        facetZoomDuration: 1000, // ms - customize if needed
        facetReturnDuration: 1200 // ms - slightly longer for smoother return
      }
    }
  })
  const [materialVariant, setMaterialVariant] = useState('default')
  const [showUI, setShowUI] = useState(false) // Default to hidden
  
  // Facet selection state
  const [selectedFacet, setSelectedFacet] = useState(null)
  const [hoveredFacet, setHoveredFacet] = useState(null)
  const [showDetailCard, setShowDetailCard] = useState(false)
  const [orbitControlsEnabled, setOrbitControlsEnabled] = useState(true)
  
  // Transition state
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  // Material configuration state
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
  
  // Post-processing effects state
  const [effectsEnabled, setEffectsEnabled] = useState({
    bloom: true,
    chromaticAberration: true,
    noise: true,
    vignette: true
  });
  
  // Post-processing config state
  const [postProcessingConfig, setPostProcessingConfig] = useState(config.postProcessing);
  
  // Performance settings state
  const [performanceConfig, setPerformanceConfig] = useState({
    useNormalMaps: true,
    textureQuality: 'high',
    usePBR: true
  });
  
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

  // Keyboard shortcut for toggling normal maps
  const toggleNormalMaps = useCallback(() => {
    setPerformanceConfig(prev => ({
      ...prev,
      useNormalMaps: !prev.useNormalMaps
    }));
  }, []);

  // IMPORTANT: Set up keyboard controls AFTER defining all callbacks
  useKeyboardControls({
    isExploded,
    setIsExploded,
    hoveredFacet,
    setHoveredFacet,
    selectedFacet,
    setSelectedFacet,
    showUI,
    setShowUI,
    showDetailCard,
    setShowDetailCard,
    setOrbitControlsEnabled,
    config,
    isTransitioning,
    setIsTransitioning,
    effectsEnabled,
    handleToggleEffect,
    performanceConfig,
    toggleNormalMaps
  });

  return (
    <>
      {/* Canvas for 3D content */}
      <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
        <Canvas 
          shadows 
          camera={{ position: config.camera.startingPosition, fov: config.camera.fov }} 
          dpr={[1, 2]}
          gl={{ 
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.2,
            outputColorSpace: THREE.SRGBColorSpace // Updated from outputEncoding
          }}>
          
          {/* Dark background for contrast */}
          <color attach="background" args={['#050505']} />
          
          {/* Three-point lighting for realistic crystal */}
          <ambientLight intensity={config.lighting.ambient.intensity} />
          <directionalLight 
            position={config.lighting.directional.position} 
            intensity={config.lighting.directional.intensity} 
            color={config.lighting.directional.color} 
            castShadow={config.lighting.directional.castShadow} 
          />
          
          {/* Add point lights from configuration */}
          {config.lighting.pointLights.map((light, index) => (
            <pointLight 
              key={index}
              position={light.position} 
              intensity={light.intensity} 
              color={light.color} 
            />
          ))}
          
          {/* Spot light */}
          <spotLight 
            position={config.lighting.spotLight.position} 
            intensity={config.lighting.spotLight.intensity} 
            angle={config.lighting.spotLight.angle} 
            penumbra={config.lighting.spotLight.penumbra} 
            color={config.lighting.spotLight.color} 
          />
          
          {/* Enhanced Crystal Scene Component */}
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
          
          {/* Environment map for realistic reflections */}
          <Environment 
            files={config.environment.hdri} 
            background={config.environment.showBackground} 
            rotation={config.environment.rotation}
          />
          
          {/* Post-processing effects for photorealism */}
          <EffectComposer enabled={Object.values(effectsEnabled).some(Boolean)}>
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
          
          {/* Camera controls - disabled when a facet is selected */}
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
      
      {/* UI Toggle Button (positioned at bottom left) */}
      <ControlsToggle 
        showUI={showUI} 
        toggleUI={toggleUI} 
        disabled={isTransitioning}
      />
      
      {/* Tabbed UI Controls - Only shown when UI is visible */}
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
          {/* Tab 1: Crystal Controls */}
          <CrystalControls onUpdate={handleConfigUpdate} />
          
          {/* Tab 2: Materials Controls */}
          <div>
            <MaterialSelector currentVariant={materialVariant} onChange={handleMaterialChange} />
            
            {/* Conditional Material Controls - Only show when relevant material is selected */}
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
          
          {/* Tab 3: Post-Processing Effects */}
          <PostProcessingControls 
            effectsEnabled={effectsEnabled}
            onToggleEffect={handleToggleEffect}
            visible={true} 
            config={config}
          />
          
          {/* Tab 4: Performance Settings */}
          <PerformanceControls
            performanceConfig={performanceConfig}
            onConfigUpdate={handlePerformanceConfigUpdate}
            visible={true}
          />
        </TabbedControlPanel>
      )}
      
      {/* Facet Detail UI Card - Shown when a facet is selected */}
      {selectedFacet && 
        <FacetDetailCard 
          facet={config.facetLabels.find(f => f.key === selectedFacet)}
          visible={showDetailCard}
          onClose={() => {
            if (isTransitioning) return; // Prevent interaction during transitions
            
            setIsTransitioning(true);
            setShowDetailCard(false);
            
            setTimeout(() => {
              setSelectedFacet(null);
              
              // Wait for camera transition to complete before enabling orbit controls
              setTimeout(() => {
                setOrbitControlsEnabled(true);
                setIsTransitioning(false);
              }, config.timing.camera.facetReturnDuration || 1200);
            }, 300);
          }}
        />
      }
      
      {/* Keyboard Shortcuts Information */}
      <AccessibilityInstructions visible={true} />
      
      {/* UI Overlay for Explode/Reform Button */}
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