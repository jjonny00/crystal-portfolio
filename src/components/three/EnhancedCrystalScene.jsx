// src/components/three/EnhancedCrystalScene.jsx - Phase 3.2 Complete Updates
// Replace the existing CameraController import and usage with ScrollCameraController

import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { a, useSpring } from '@react-spring/three'

// Import state machine constants
import { CRYSTAL_STATES } from '../../machines/crystalStateMachine'

// Import default configuration
import * as defaultConfig from '../../crystalConfig'

// Import sub-components
import MaterialManager from './MaterialManager'
import SelectableFacetGroup from './SelectableFacetGroup'
import SelectablePremiumLabel from './SelectablePremiumLabel'

// PHASE 3.2: Replace CameraController with ScrollCameraController
import ScrollCameraController from './ScrollCameraController'

import { LabelConnector } from './LabelConnector'

// Mobile scrolling hook
import { useMobileScrolling } from '../../hooks/useMobileScrolling'

/**
 * Enhanced crystal scene with Phase 3.2 updates
 * - Replaced CameraController with ScrollCameraController
 * - Removed all scroll event listeners from camera system
 * - Enhanced mobile touch handling
 * - Added isFastScrolling prop support
 */
const EnhancedCrystalScene = ({ 
  isExploded, 
  crystalState,        // From crystal controller
  config = defaultConfig, 
  materialVariant = 'default',
  blackOpalConfig,
  iceOpalConfig,
  selectedFacet = null,  // From crystal controller
  hoveredFacet = null,
  onFacetSelect,
  onFacetHover,
  isTransitioning,
  performanceConfig = { useNormalMaps: true, textureQuality: 'high', usePBR: true },
  scrollCrystalData = null, // For scroll data
  isFastScrolling = false   // PHASE 3.2: New prop for fast scroll detection
}) => {
  // Mobile touch handling with enhanced settings
  const { isMobileDevice, preventOrbitOnMobile } = useMobileScrolling({
    enableTouchScrolling: true,
    preventOrbitOnMobile: true,
    smoothScrollFactor: 0.15,
    momentumMultiplier: 0.2,
    minSwipeDistance: 25,
    debugMode: false
  });

  // Component state
  const facetRefs = useRef(Array(6).fill(null));
  const [showFacets, setShowFacets] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showCrystal, setShowCrystal] = useState(true);
  const [labelPositions, setLabelPositions] = useState(
    config.facetLabels.map(label => config.explodedPositions[label.key] || [0, 0, 0])
  );
  
  // Floating animation refs
  const crystalFloatingRef = useRef();
  const crystalRotationRef = useRef();
  
  // Store references to anchor objects
  const anchorRefs = useRef({});
  
  // Material state
  const [blackOpalConfigState, setBlackOpalConfig] = useState({
    emissiveIntensity: 0.5,
    roughness: 0.4,
    metalness: 0.1,
    clearcoat: 0.6,
    transmission: 0.2,
    iridescence: 0.9,
    normalScale: 0.8
  });
  
  const { clock } = useThree();
  const explosionStartTime = useRef(0);
  const fractureStartTime = useRef(0);
  const lastGlowValue = useRef(0);
  const crystalMaterialRef = useRef();
  
  // Load all the models
  const crystalWhole = useGLTF(config.assets.models.crystalWhole);
  const facetEmpathy = useGLTF(config.assets.models.facetEmpathy);
  const facetNarrative = useGLTF(config.assets.models.facetNarrative);
  const facetCraft = useGLTF(config.assets.models.facetCraft);
  const facetSystem = useGLTF(config.assets.models.facetSystem);
  const facetLeadership = useGLTF(config.assets.models.facetLeadership);
  const facetExploration = useGLTF(config.assets.models.facetExploration);
  
  // Apply shared material to all models
  useEffect(() => {
    if (!crystalMaterialRef.current) return;
    
    const applyMaterial = (modelScene) => {
      modelScene.traverse((child) => {
        if (child.isMesh) {
          child.material = crystalMaterialRef.current;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    };
    
    applyMaterial(crystalWhole.scene);
    applyMaterial(facetEmpathy.scene);
    applyMaterial(facetNarrative.scene);
    applyMaterial(facetCraft.scene);
    applyMaterial(facetSystem.scene);
    applyMaterial(facetLeadership.scene);
    applyMaterial(facetExploration.scene);
    
  }, [crystalWhole, facetEmpathy, facetNarrative, facetCraft, facetSystem, facetLeadership, facetExploration, crystalMaterialRef.current]);
  
  // Visibility transitions - crystal controller manages state
  useEffect(() => {
    console.log(`🎭 Crystal scene: ${crystalState}`);
    
    switch(crystalState) {
      case CRYSTAL_STATES.WHOLE:
        setShowCrystal(true);
        setShowFacets(false);
        setShowLabels(false);
        break;
        
      case CRYSTAL_STATES.EXPLODED:
        setShowFacets(true);
        setShowCrystal(false);
        // Show labels after brief delay
        const labelTimer = setTimeout(() => setShowLabels(true), 300);
        return () => clearTimeout(labelTimer);
        
      case CRYSTAL_STATES.PROJECT_SELECTED:
        setShowFacets(true);
        setShowCrystal(false);
        setShowLabels(true);
        break;
        
      default:
        setShowCrystal(true);
        setShowFacets(false);
        setShowLabels(false);
    }
  }, [crystalState]);

  // Enhanced animation frame with slow rotation and all effects
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Very slow crystal rotation - only when whole crystal is visible
    if (crystalRotationRef.current && showCrystal) {
      // Very slow rotation - complete rotation every ~60 seconds
      const rotationSpeed = 0.0003; // Radians per frame at 60fps
      crystalRotationRef.current.rotation.y += rotationSpeed;
      
      // Optional: Add very subtle rotation on other axes for more organic feel
      crystalRotationRef.current.rotation.x = Math.sin(time * 0.0001) * 0.02;
      crystalRotationRef.current.rotation.z = Math.cos(time * 0.00015) * 0.01;
    }
    
    // Enhanced floating animation for intro crystal
    if (crystalFloatingRef.current && scrollCrystalData) {
      const isIntroState = scrollCrystalData.currentSection?.key === 'intro-close' || 
                          scrollCrystalData.currentSection?.key === 'intro';
      
      if (isIntroState && showCrystal) {
        // Subtle floating motion - more pronounced than facet floating
        const baseAmplitude = 0.012; // Slightly larger amplitude
        
        const floatY = Math.sin(time * 0.8) * baseAmplitude + 
                       Math.sin(time * 1.1) * baseAmplitude * 0.4;
        
        const floatX = Math.sin(time * 0.7) * baseAmplitude * 0.3;
        const floatZ = Math.sin(time * 0.6) * baseAmplitude * 0.25;
        
        // Apply floating motion to the floating ref (separate from rotation)
        crystalFloatingRef.current.position.set(floatX, floatY, floatZ);
      } else {
        crystalFloatingRef.current.position.set(0, 0, 0);
      }
    }
    
    // Handle idle floating animation and update label positions
    if (crystalState === CRYSTAL_STATES.EXPLODED && showFacets && facetRefs.current) {
      const elapsedSinceExplosion = time - explosionStartTime.current;
      
      const transitionStart = config.timing.idle.transitionStartTime;
      const transitionEnd = config.timing.idle.transitionEndTime;
      let transitionProgress = 0;
      
      if (elapsedSinceExplosion < transitionStart) {
        transitionProgress = 0;
      } else if (elapsedSinceExplosion > transitionEnd) {
        transitionProgress = 1;
      } else {
        const normalizedProgress = (elapsedSinceExplosion - transitionStart) / 
                                 (transitionEnd - transitionStart);
        transitionProgress = Math.sin(normalizedProgress * Math.PI / 2);
      }
      
      const settlingDuration = config.timing.idle.settlingDuration || 5.0;
      const settlingFactor = Math.min(1, elapsedSinceExplosion / settlingDuration);
      const dampingFactor = Math.pow(1 - settlingFactor, 2);
      
      const newLabelPositions = [...labelPositions];
      
      config.facetLabels.forEach((label, index) => {
        const facetRef = facetRefs.current[index];
        const facetKey = label.key;
        const isSelectedFacet = facetKey === selectedFacet;
        
        if (facetRef && !isSelectedFacet) {
          const targetPos = config.explodedPositions[facetKey];
          
          const springPos = facetSprings[index].position.get();
          
          const floatPhase = index * 0.5;
          const floatAmplitude = config.effects.idle.float.baseAmplitude * (1 + dampingFactor);
          
          const floatOffsetY = Math.sin(time * config.effects.idle.float.yFrequency + floatPhase) * floatAmplitude;
          const floatOffsetX = Math.sin(time * config.effects.idle.float.xFrequency + floatPhase * 1.7) * 
                             floatAmplitude * config.effects.idle.float.xMultiplier;
          const floatOffsetZ = Math.sin(time * config.effects.idle.float.zFrequency + floatPhase * 0.3) * 
                             floatAmplitude * config.effects.idle.float.zMultiplier;
          
          const floatingPos = [
            targetPos[0] + floatOffsetX,
            targetPos[1] + floatOffsetY,
            targetPos[2] + floatOffsetZ
          ];
          
          facetRef.position.x = springPos[0] * (1 - transitionProgress) + 
                              floatingPos[0] * transitionProgress;
          facetRef.position.y = springPos[1] * (1 - transitionProgress) + 
                              floatingPos[1] * transitionProgress;
          facetRef.position.z = springPos[2] * (1 - transitionProgress) + 
                              floatingPos[2] * transitionProgress;
          
          newLabelPositions[index] = [
            facetRef.position.x, 
            facetRef.position.y, 
            facetRef.position.z
          ];
        }
      });
      
      if (JSON.stringify(newLabelPositions) !== JSON.stringify(labelPositions)) {
        setLabelPositions(newLabelPositions);
      }
      
      // Glow effects for idle state
      if (crystalMaterialRef.current) {
        const pulseBase = config.effects.idle.glow.pulseBase || 0.1;
        const pulseStrength = config.effects.idle.glow.pulseStrength || 0.1;
        const pulseFrequency = config.effects.idle.glow.baseFrequency || 0.5;
        
        let pulseValue;
        
        if (elapsedSinceExplosion < transitionStart) {
          pulseValue = lastGlowValue.current;
        } else if (elapsedSinceExplosion > transitionEnd) {
          pulseValue = pulseBase + pulseStrength * Math.sin(time * pulseFrequency);
        } else {
          const blendFactor = (elapsedSinceExplosion - transitionStart) / (transitionEnd - transitionStart);
          const currentPulse = pulseBase + pulseStrength * Math.sin(time * pulseFrequency);
          pulseValue = lastGlowValue.current * (1 - blendFactor) + currentPulse * blendFactor;
        }
        
        if (materialVariant !== 'blackOpal' && materialVariant !== 'iceOpal') {
          crystalMaterialRef.current.emissiveIntensity = pulseValue;
          crystalMaterialRef.current.needsUpdate = true;
        } else {
          setBlackOpalConfig({
            ...blackOpalConfigState,
            emissiveIntensity: pulseValue
          });
        }
      }
    }
    
    // Reset material glow when crystal is whole
    if (crystalState === CRYSTAL_STATES.WHOLE && crystalMaterialRef.current) {
      if (materialVariant !== 'blackOpal' && materialVariant !== 'iceOpal') {
        crystalMaterialRef.current.emissiveIntensity = 0;
        crystalMaterialRef.current.needsUpdate = true;
      } else {
        setBlackOpalConfig({
          ...blackOpalConfigState,
          emissiveIntensity: 0
        });
      }
    }
  });
  
  // Helper function to find the first mesh in a group
  const getFacetMesh = (group) => {
    let mesh = null;
    if (!group) return null;
    
    group.traverse((child) => {
      if (!mesh && child.isMesh) {
        mesh = child;
      }
    });
    return mesh;
  };
  
  // Create a spring config based on phase and animation direction
  function createSpringConfig(phase, isExploded) {
    if (isExploded) {
      if (phase === 'fractured') {
        return config.springConfigs.fracture;
      } else {
        return config.springConfigs.explode;
      }
    } else {
      return {
        ...config.springConfigs.reform,
        easing: config.easings.reformEase
      };
    }
  }
  
  // Physics-based spring animation configurations
  const facetSprings = config.facetLabels.map((label, index) => {
    return useSpring({
      from: { position: config.startingPositions[label.key] },
      to: { 
        position: 
          crystalState === CRYSTAL_STATES.WHOLE ? config.startingPositions[label.key] : 
          config.explodedPositions[label.key] 
      },
      config: createSpringConfig('exploded', crystalState !== CRYSTAL_STATES.WHOLE)
    });
  });
  
  // Create models array
  const models = [
    facetEmpathy, 
    facetNarrative, 
    facetCraft, 
    facetSystem, 
    facetLeadership, 
    facetExploration
  ];
  
  return (
    <group>
      {/* Material Manager Component */}
      <MaterialManager
        materialVariant={materialVariant}
        blackOpalConfig={blackOpalConfigState}
        iceOpalConfig={iceOpalConfig}
        config={config}
        materialRef={crystalMaterialRef}
        performanceConfig={performanceConfig}
      />
      
      {/* PHASE 3.2: Enhanced Camera Controller with Animation Queue */}
      <ScrollCameraController
        crystalState={crystalState}
        selectedFacet={selectedFacet}
        isFastScrolling={isFastScrolling}
        isTransitioning={isTransitioning}
        config={config}
        debugMode={process.env.NODE_ENV === 'development'}
      />
      
      {/* Show the whole crystal with floating animation AND slow rotation */}
      {showCrystal && (
        <group ref={crystalFloatingRef}>
          <group ref={crystalRotationRef}>
            <primitive object={crystalWhole.scene} />
          </group>
        </group>
      )}
      
      {/* Show the facets during explosion/collapse */}
      {showFacets && (
        <SelectableFacetGroup
          models={models}
          springs={facetSprings}
          facetLabels={config.facetLabels}
          facetRefs={facetRefs}
          selectedFacet={selectedFacet}
          hoveredFacet={hoveredFacet}
          onFacetSelect={isMobileDevice ? null : onFacetSelect} // Disable facet selection on mobile
          onFacetHover={isMobileDevice ? null : onFacetHover}   // Disable facet hover on mobile
        />
      )}
      
      {/* Labels with spring animations - simplified interaction on mobile */}
      {config.facetLabels.map((label, index) => (
        <SelectablePremiumLabel
          key={label.key}
          label={label}
          index={index}
          position={labelPositions[index]}
          visible={showFacets && showLabels}
          config={config}
          isSelected={label.key === selectedFacet}
          isHovered={!isMobileDevice && label.key === hoveredFacet && label.key !== selectedFacet}
          onSelect={isMobileDevice ? null : onFacetSelect} // Disable label selection on mobile
        />
      ))}
    </group>
  );
};

export default EnhancedCrystalScene;