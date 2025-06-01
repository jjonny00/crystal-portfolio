// src/components/three/EnhancedCrystalScene.jsx - FIXED for proper camera integration
// Updated to properly pass scroll data to camera controller
// CLEANED: All outline references removed

import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import { a, useSpring } from '@react-spring/three'

// Import state machine constants
import { CRYSTAL_STATES } from '../../machines/crystalStateMachine'
import * as defaultConfig from '../../crystalConfig'
import MaterialManager from './MaterialManager'
import SelectableFacetGroup from './SelectableFacetGroup'
import SelectablePremiumLabel from './SelectablePremiumLabel'
import ScrollCameraController from './ScrollCameraController'
import { LabelConnector } from './LabelConnector'
import { useMobileScrolling } from '../../hooks/useMobileScrolling'

/**
 * FIXED: Enhanced crystal scene with proper camera controller integration
 * CLEANED: All outline references removed
 */
const EnhancedCrystalScene = ({ 
  isExploded, 
  crystalState,
  config = defaultConfig, 
  materialVariant = 'default',
  blackOpalConfig,
  iceOpalConfig,
  selectedFacet = null,
  hoveredFacet = null,
  onFacetSelect,
  onFacetHover,
  isTransitioning,
  performanceConfig = { useNormalMaps: true, textureQuality: 'high', usePBR: true },
  scrollCrystalData = null, // This should be scroll observer data
  isFastScrolling = false,
  // NEW: Accept scroll observer directly
  scrollObserver = null
}) => {
  // Mobile touch handling
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
  
  // Animation refs
  const crystalFloatingRef = useRef();
  const crystalRotationRef = useRef();
  
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
  
  // Animation timing tracking
  const explosionStartTime = useRef(0);
  const fractureStartTime = useRef(0);
  const lastGlowValue = useRef(0);
  const crystalMaterialRef = useRef();
  const lastCrystalState = useRef(crystalState);

  // Load models
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
  
  // Visibility transitions with proper timing and debug logging
  useEffect(() => {
    const prevState = lastCrystalState.current;
    lastCrystalState.current = crystalState;
    
    console.log(`🎭 Crystal state transition: ${prevState} → ${crystalState}`);
    
    switch(crystalState) {
      case CRYSTAL_STATES.WHOLE:
        setShowCrystal(true);
        setShowFacets(false);
        setShowLabels(false);
        console.log('🔮 Showing whole crystal');
        break;
        
      case CRYSTAL_STATES.FRACTURING:
        setShowCrystal(true);
        setShowFacets(false);
        setShowLabels(false);
        fractureStartTime.current = clock.getElapsedTime();
        console.log('💥 Starting fracturing phase');
        break;
        
      case CRYSTAL_STATES.EXPLODING:
        setShowCrystal(false);
        setShowFacets(true);
        setShowLabels(false);
        explosionStartTime.current = clock.getElapsedTime();
        console.log('🚀 Starting explosion phase, explosion start time:', explosionStartTime.current);
        break;
        
      case CRYSTAL_STATES.EXPLODED:
        setShowFacets(true);
        setShowCrystal(false);
        const labelTimer = setTimeout(() => {
          setShowLabels(true);
          console.log('🏷️ Showing labels');
        }, 500);
        console.log('✨ Explosion complete, facets visible');
        return () => clearTimeout(labelTimer);
        
      case CRYSTAL_STATES.PROJECT_SELECTED:
        setShowFacets(true);
        setShowCrystal(false);
        setShowLabels(true);
        console.log('🎯 Project selected state');
        break;
        
      case CRYSTAL_STATES.REFORMING:
        setShowLabels(false);
        setShowFacets(true);
        setShowCrystal(false);
        console.log('🔄 Starting reform phase');
        break;
        
      default:
        setShowCrystal(true);
        setShowFacets(false);
        setShowLabels(false);
        console.log('🔮 Default: showing whole crystal');
    }
  }, [crystalState, clock]);

  // Enhanced animation frame with proper explosion timing
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Slow crystal rotation when whole crystal is visible
    if (crystalRotationRef.current && showCrystal) {
      const rotationSpeed = 0.0003;
      crystalRotationRef.current.rotation.y += rotationSpeed;
      crystalRotationRef.current.rotation.x = Math.sin(time * 0.0001) * 0.02;
      crystalRotationRef.current.rotation.z = Math.cos(time * 0.00015) * 0.01;
    }
    
    // Floating animation for intro crystal
    if (crystalFloatingRef.current && scrollCrystalData) {
      const isIntroState = scrollCrystalData.currentSection?.key === 'intro-close' || 
                          scrollCrystalData.currentSection?.key === 'intro';
      
      if (isIntroState && showCrystal) {
        const baseAmplitude = 0.012;
        
        const floatY = Math.sin(time * 0.8) * baseAmplitude + 
                       Math.sin(time * 1.1) * baseAmplitude * 0.4;
        
        const floatX = Math.sin(time * 0.7) * baseAmplitude * 0.3;
        const floatZ = Math.sin(time * 0.6) * baseAmplitude * 0.25;
        
        crystalFloatingRef.current.position.set(floatX, floatY, floatZ);
      } else {
        crystalFloatingRef.current.position.set(0, 0, 0);
      }
    }
    
    // Idle floating animation with proper explosion timing
    if ((crystalState === CRYSTAL_STATES.EXPLODED || crystalState === CRYSTAL_STATES.PROJECT_SELECTED) && 
        showFacets && facetRefs.current && explosionStartTime.current > 0) {
      
      const elapsedSinceExplosion = time - explosionStartTime.current;
      const explosionCompleteTime = 1.5;
      
      if (elapsedSinceExplosion > explosionCompleteTime) {
        const idleTime = elapsedSinceExplosion - explosionCompleteTime;
        
        const transitionStart = config.timing.idle.transitionStartTime;
        const transitionEnd = config.timing.idle.transitionEndTime;
        let transitionProgress = 0;
        
        if (idleTime < transitionStart) {
          transitionProgress = 0;
        } else if (idleTime > transitionEnd) {
          transitionProgress = 1;
        } else {
          const normalizedProgress = (idleTime - transitionStart) / (transitionEnd - transitionStart);
          transitionProgress = Math.sin(normalizedProgress * Math.PI / 2);
        }
        
        const settlingDuration = config.timing.idle.settlingDuration || 5.0;
        const settlingFactor = Math.min(1, idleTime / settlingDuration);
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
            
            const floatOffsetY = Math.sin((time + floatPhase) * config.effects.idle.float.yFrequency) * floatAmplitude;
            const floatOffsetX = Math.sin((time + floatPhase * 1.7) * config.effects.idle.float.xFrequency) * 
                               floatAmplitude * config.effects.idle.float.xMultiplier;
            const floatOffsetZ = Math.sin((time + floatPhase * 0.3) * config.effects.idle.float.zFrequency) * 
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
          
          const pulseValue = pulseBase + pulseStrength * Math.sin(time * pulseFrequency);
          
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
  
  // Create spring config based on crystal state
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
  
  // Physics-based spring animations with proper state detection
  const facetSprings = config.facetLabels.map((label, index) => {
    // Determine if we should be in exploded state
    const shouldBeExploded = crystalState === CRYSTAL_STATES.EXPLODING || 
                            crystalState === CRYSTAL_STATES.EXPLODED || 
                            crystalState === CRYSTAL_STATES.PROJECT_SELECTED;
    
    const startPos = config.startingPositions[label.key];
    const endPos = shouldBeExploded ? config.explodedPositions[label.key] : config.startingPositions[label.key];
    
    console.log(`🔍 Spring ${label.key} positions:`, {
      startPos,
      endPos,
      startType: Array.isArray(startPos) ? 'array' : typeof startPos,
      endType: Array.isArray(endPos) ? 'array' : typeof endPos,
      startLength: Array.isArray(startPos) ? startPos.length : 'n/a',
      endLength: Array.isArray(endPos) ? endPos.length : 'n/a'
    });
    
    return useSpring({
      from: { position: startPos },
      to: { position: endPos },
      config: createSpringConfig('exploded', shouldBeExploded),
      onStart: () => {
        if (process.env.NODE_ENV === 'development') {
          // console.log(`🌸 Spring ${label.key} starting: ${shouldBeExploded ? 'exploding' : 'reforming'}`);
        }
      },
      onRest: () => {
        if (process.env.NODE_ENV === 'development') {
          // console.log(`🌸 Spring ${label.key} completed`);
        }
      }
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
      
      {/* FIXED: Enhanced Camera Controller with proper scroll observer integration */}
      <ScrollCameraController
        crystalState={crystalState}  // This comes from App.jsx crystal controller
        selectedFacet={selectedFacet}  // This comes from App.jsx crystal controller
        isFastScrolling={isFastScrolling}
        isTransitioning={isTransitioning}
        config={config}
        debugMode={process.env.NODE_ENV === 'development'}
        // Remove scrollObserver prop entirely for now - it's causing conflicts
        scrollObserver={null}
        // Pass crystal controller data directly
        directCrystalData={{
          crystalState,
          selectedFacet,
          currentSection: scrollObserver?.currentSection
        }}
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
          onFacetSelect={isMobileDevice ? null : onFacetSelect}
          onFacetHover={isMobileDevice ? null : onFacetHover}
        />
      )}
      
      {/* Labels with spring animations */}
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
          onSelect={isMobileDevice ? null : onFacetSelect}
        />
      ))}
      
      {/* Debug info overlay in development */}
      {process.env.NODE_ENV === 'development' && (
        <Html>
          <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 10001,
            pointerEvents: 'none',
            maxWidth: '300px'
          }}>
            <div><strong>Crystal Debug Info:</strong></div>
            <div>State: {crystalState}</div>
            <div>Show Crystal: {showCrystal ? 'YES' : 'NO'}</div>
            <div>Show Facets: {showFacets ? 'YES' : 'NO'}</div>
            <div>Show Labels: {showLabels ? 'YES' : 'NO'}</div>
            <div>Selected Facet: {selectedFacet || 'none'}</div>
            <div>Explosion Start: {explosionStartTime.current.toFixed(2)}</div>
            <div>Current Time: {clock.getElapsedTime().toFixed(2)}</div>
            <div>Is Transitioning: {isTransitioning ? 'YES' : 'NO'}</div>
            <div>Scroll Section: {scrollObserver?.currentSection?.id || 'none'}</div>
          </div>
        </Html>
      )}
    </group>
  );
};

export default EnhancedCrystalScene;