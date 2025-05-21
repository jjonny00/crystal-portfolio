// Updated App.jsx - Improved Reform Button handling
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
  
  // Set up keyboard controls
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
    setIsTransitioning
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
            outputEncoding: THREE.sRGBEncoding
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
          />
          
          {/* Environment map for realistic reflections */}
          <Environment 
            files={config.environment.hdri} 
            background={config.environment.showBackground} 
            rotation={config.environment.rotation}
          />
          
          {/* Post-processing effects for photorealism */}
          <EffectComposer>
            <Bloom 
              luminanceThreshold={config.postProcessing.bloom.luminanceThreshold} 
              luminanceSmoothing={config.postProcessing.bloom.luminanceSmoothing} 
              intensity={config.postProcessing.bloom.intensity} 
              radius={config.postProcessing.bloom.radius} 
            />
            <ChromaticAberration 
              offset={config.postProcessing.chromaticAberration.offset} 
              radialModulation={config.postProcessing.chromaticAberration.radialModulation} 
              modulationOffset={config.postProcessing.chromaticAberration.modulationOffset} 
            />
            <Noise 
              opacity={config.postProcessing.noise.opacity} 
              blendFunction={BlendFunction.OVERLAY} 
            />
            <Vignette 
              eskil={config.postProcessing.vignette.eskil} 
              offset={config.postProcessing.vignette.offset} 
              darkness={config.postProcessing.vignette.darkness} 
            />
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
      
      {/* Crystal Controls Panel - Only shown when UI is visible */}
      {showUI && <CrystalControls onUpdate={handleConfigUpdate} />}
      
      {/* Material Selector - Only shown when UI is visible */}
      {showUI && <MaterialSelector currentVariant={materialVariant} onChange={handleMaterialChange} />}
      
      {/* Black Opal Controls - Only show when Black Opal material is selected and UI is visible */}
      {showUI && materialVariant === 'blackOpal' && 
        <BlackOpalControls 
          visible={true} 
          onConfigUpdate={handleBlackOpalConfigUpdate}
          currentConfig={blackOpalConfig}
        />
      }
      
      {/* Ice Opal Controls - Only show when Ice Opal material is selected and UI is visible */}
      {showUI && materialVariant === 'iceOpal' && 
        <IceOpalControls 
          visible={true} 
          onConfigUpdate={handleIceOpalConfigUpdate}
          currentConfig={iceOpalConfig}
        />
      }
      
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
      
      {/* Accessibility Instructions */}
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
  )
}

export default App