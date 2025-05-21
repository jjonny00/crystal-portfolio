// EnhancedCrystalScene.jsx - Modified to use anchor points for label positioning
import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { a, useSpring } from '@react-spring/three'

// Import default configuration (will be overridden by props)
import * as defaultConfig from '../../crystalConfig'

// Import sub-components
import MaterialManager from './MaterialManager'
import SelectableFacetGroup from './SelectableFacetGroup'
import SelectablePremiumLabel from './SelectablePremiumLabel'
import CameraController from './CameraController'
import { LabelConnector } from './LabelConnector'

/**
 * Enhanced crystal scene with facet selection functionality
 * and anchor-based label positioning
 */
const EnhancedCrystalScene = ({ 
  isExploded, 
  config = defaultConfig, 
  materialVariant = 'default',
  blackOpalConfig,
  iceOpalConfig,
  selectedFacet = null,
  hoveredFacet = null,
  onFacetSelect,
  onFacetHover
}) => {
  // Component state
  const facetRefs = useRef(Array(6).fill(null));
  const [showFacets, setShowFacets] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showCrystal, setShowCrystal] = useState(true);
  const [labelPositions, setLabelPositions] = useState(
    config.facetLabels.map(label => config.explodedPositions[label.key] || [0, 0, 0])
  );
  const [explosionPhase, setExplosionPhase] = useState('initial');
  const [fractureGlowComplete, setFractureGlowComplete] = useState(false);
  const [showConnectors, setShowConnectors] = useState(true); // Toggle for connectors
  
  // Store references to anchor objects
  const anchorRefs = useRef({});
  
  // Local state for material configs
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
  
  // Find anchor points in loaded models
  useEffect(() => {
    // Function to find anchor in a model
    const findAnchor = (model, anchorName) => {
      let anchor = null;
      model.scene.traverse((child) => {
        if (child.name === anchorName) {
          anchor = child;
          console.log(`Found anchor: ${anchorName}`);
        }
      });
      return anchor;
    };
    
    // Find anchors in each model
    const empathyAnchor = findAnchor(facetEmpathy, 'anchor_empathy');
    if (empathyAnchor) anchorRefs.current['empathy'] = empathyAnchor;
    
    const narrativeAnchor = findAnchor(facetNarrative, 'anchor_narrative');
    if (narrativeAnchor) anchorRefs.current['narrative'] = narrativeAnchor;
    
    const craftAnchor = findAnchor(facetCraft, 'anchor_craft');
    if (craftAnchor) anchorRefs.current['craft'] = craftAnchor;
    
    const systemAnchor = findAnchor(facetSystem, 'anchor_system');
    if (systemAnchor) anchorRefs.current['system'] = systemAnchor;
    
    const leadershipAnchor = findAnchor(facetLeadership, 'anchor_leadership');
    if (leadershipAnchor) anchorRefs.current['leadership'] = leadershipAnchor;
    
    const explorationAnchor = findAnchor(facetExploration, 'anchor_exploration');
    if (explorationAnchor) anchorRefs.current['exploration'] = explorationAnchor;
    
    console.log('Found anchors:', Object.keys(anchorRefs.current));
  }, [
    facetEmpathy, 
    facetNarrative, 
    facetCraft, 
    facetSystem, 
    facetLeadership, 
    facetExploration
  ]);
  
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
  
  // Manage visibility transitions and explosion phases
  useEffect(() => {
    if (isExploded) {
      explosionStartTime.current = clock.getElapsedTime();
      setShowFacets(true);
      
      const crystalTimer = setTimeout(() => {
        setShowCrystal(false);
      }, config.timing.crystal.disappearDelay);
      
      setExplosionPhase('fractured');
      fractureStartTime.current = clock.getElapsedTime();
      
      const explodeTimer = setTimeout(() => {
        setExplosionPhase('exploded');
      }, config.timing.fracture.duration);
      
      const labelTimer = setTimeout(() => {
        setShowLabels(true);
      }, config.timing.labels.appearDelay);
      
      return () => {
        clearTimeout(crystalTimer);
        clearTimeout(explodeTimer);
        clearTimeout(labelTimer);
      };
    } else {
      setExplosionPhase('initial');
      setFractureGlowComplete(false);
      setShowLabels(false);
      
      const crystalTimer = setTimeout(() => {
        setShowCrystal(true);
      }, config.timing.reform.crystalAppearTime);
      
      const facetsTimer = setTimeout(() => {
        setShowFacets(false);
      }, config.timing.reform.facetsDisappearTime);
      
      return () => {
        clearTimeout(crystalTimer);
        clearTimeout(facetsTimer);
      };
    }
  }, [isExploded, clock, config.timing]);

  // Handle fracture effects, idle animations, and update label positions based on anchors
  useFrame((state) => {
    // Handle fracture effects
    if (isExploded && explosionPhase === 'fractured') {
      const timeSinceFracture = state.clock.getElapsedTime() - fractureStartTime.current;
      const pulseDuration = (config.timing.fracture.pulseDuration || 100) / 1000;
      const glowFadeDuration = (config.timing.fracture.glowFadeDuration || 200) / 1000;
      
      if (timeSinceFracture < pulseDuration) {
        setFractureGlowComplete(false);
        
        facetRefs.current.forEach((ref) => {
          if (ref) {
            const scaleFactor = 1 + config.effects.fracture.maxScaleFactor * 
                               Math.sin(timeSinceFracture * Math.PI * 10);
            ref.scale.set(scaleFactor, scaleFactor, scaleFactor);
          }
        });
        
        if (crystalMaterialRef.current) {
          const initialGlow = config.effects.fracture.initialGlow || 0.8;
          
          if (materialVariant !== 'blackOpal' && materialVariant !== 'iceOpal') {
            crystalMaterialRef.current.emissiveIntensity = initialGlow;
            lastGlowValue.current = initialGlow;
            crystalMaterialRef.current.needsUpdate = true;
          } else {
            setBlackOpalConfig({
              ...blackOpalConfigState,
              emissiveIntensity: initialGlow
            });
            lastGlowValue.current = initialGlow;
          }
        }
      } else if (timeSinceFracture < (pulseDuration + glowFadeDuration)) {
        facetRefs.current.forEach((ref) => {
          if (ref) {
            ref.scale.set(1, 1, 1);
          }
        });
        
        if (crystalMaterialRef.current) {
          const fadeProgress = (timeSinceFracture - pulseDuration) / glowFadeDuration;
          const initialGlow = config.effects.fracture.initialGlow || 0.8;
          const secondaryGlow = config.effects.fracture.secondaryGlow || 0.3;
          
          const currentGlow = initialGlow + (secondaryGlow - initialGlow) * fadeProgress;
          
          if (materialVariant !== 'blackOpal' && materialVariant !== 'iceOpal') {
            crystalMaterialRef.current.emissiveIntensity = currentGlow;
            lastGlowValue.current = currentGlow;
            crystalMaterialRef.current.needsUpdate = true;
          } else {
            setBlackOpalConfig({
              ...blackOpalConfigState,
              emissiveIntensity: currentGlow
            });
            lastGlowValue.current = currentGlow;
          }
        }
      } else if (!fractureGlowComplete) {
        if (crystalMaterialRef.current) {
          const secondaryGlow = config.effects.fracture.secondaryGlow || 0.3;
          
          if (materialVariant !== 'blackOpal' && materialVariant !== 'iceOpal') {
            crystalMaterialRef.current.emissiveIntensity = secondaryGlow;
            lastGlowValue.current = secondaryGlow;
            crystalMaterialRef.current.needsUpdate = true;
          } else {
            setBlackOpalConfig({
              ...blackOpalConfigState,
              emissiveIntensity: secondaryGlow
            });
            lastGlowValue.current = secondaryGlow;
          }
          
          setFractureGlowComplete(true);
        }
      }
    }
    
    // Handle idle floating animation and update label positions
    if (isExploded && showFacets && facetRefs.current && explosionPhase === 'exploded') {
      const time = state.clock.getElapsedTime();
      const elapsedSinceExplosion = time - explosionStartTime.current;
      
      // Transition parameters
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
      
      // Animation parameters
      const settlingDuration = config.timing.idle.settlingDuration || 5.0;
      const settlingFactor = Math.min(1, elapsedSinceExplosion / settlingDuration);
      const dampingFactor = Math.pow(1 - settlingFactor, 2);
      
      // Create a new array to hold updated positions
      const newLabelPositions = [...labelPositions];
      
      // Update facet positions with idle animation and update label positions based on anchors
      config.facetLabels.forEach((label, index) => {
        const facetRef = facetRefs.current[index];
        const facetKey = label.key;
        const isSelectedFacet = facetKey === selectedFacet;
        const anchor = anchorRefs.current[facetKey];
        
        // Only animate facet if not selected
        if (facetRef && !isSelectedFacet) {
          const targetPos = config.explodedPositions[facetKey];
          
          // Get current spring position
          const springPos = facetSprings[index].position.get();
          
          // Calculate floating offsets
          const floatPhase = index * 0.5;
          const floatAmplitude = config.effects.idle.float.baseAmplitude * (1 + dampingFactor);
          
          const floatOffsetY = Math.sin(time * config.effects.idle.float.yFrequency + floatPhase) * floatAmplitude;
          const floatOffsetX = Math.sin(time * config.effects.idle.float.xFrequency + floatPhase * 1.7) * 
                             floatAmplitude * config.effects.idle.float.xMultiplier;
          const floatOffsetZ = Math.sin(time * config.effects.idle.float.zFrequency + floatPhase * 0.3) * 
                             floatAmplitude * config.effects.idle.float.zMultiplier;
          
          // Apply floating offsets to target position
          const floatingPos = [
            targetPos[0] + floatOffsetX,
            targetPos[1] + floatOffsetY,
            targetPos[2] + floatOffsetZ
          ];
          
          // Blend between spring position and floating position
          facetRef.position.x = springPos[0] * (1 - transitionProgress) + 
                              floatingPos[0] * transitionProgress;
          facetRef.position.y = springPos[1] * (1 - transitionProgress) + 
                              floatingPos[1] * transitionProgress;
          facetRef.position.z = springPos[2] * (1 - transitionProgress) + 
                              floatingPos[2] * transitionProgress;
        }
        
        // Update label position based on anchor if available
        if (facetRef && anchor) {
          // Create a temporary vector to store world position
          const worldPos = new THREE.Vector3();
          
          // Get anchor's world position based on facet's transform
          // Need to update the world matrix first to ensure accurate position
          anchor.updateWorldMatrix(true, false);
          worldPos.setFromMatrixPosition(anchor.matrixWorld);
          
          // Update label position with anchor's world position
          newLabelPositions[index] = [worldPos.x, worldPos.y, worldPos.z];
        } else if (facetRef) {
          // Fallback to facet position if anchor is not available
          newLabelPositions[index] = [
            facetRef.position.x, 
            facetRef.position.y, 
            facetRef.position.z
          ];
        }
      });
      
      // Update label positions state if they've changed
      if (JSON.stringify(newLabelPositions) !== JSON.stringify(labelPositions)) {
        setLabelPositions(newLabelPositions);
      }
      
      // Handle pulsing glow
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
        
        // Add extra glow for selected or hovered facets
        config.facetLabels.forEach((label, index) => {
          const facetKey = label.key;
          const isSelected = facetKey === selectedFacet;
          const isHovered = facetKey === hoveredFacet && !isSelected;
          
          if ((isSelected || isHovered) && facetRefs.current[index]) {
            const facetMesh = getFacetMesh(facetRefs.current[index]);
            if (facetMesh && facetMesh.material) {
              facetMesh.material.emissiveIntensity = pulseValue + (isSelected ? 1.2 : 0.6);
              facetMesh.material.needsUpdate = true;
            }
          }
        });
        
        // Update base material glow
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
    
    // Reset material glow when reforming
    if (!isExploded && crystalMaterialRef.current) {
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
          explosionPhase === 'initial' ? config.startingPositions[label.key] : 
          explosionPhase === 'fractured' ? config.fracturePositions[label.key] : 
          config.explodedPositions[label.key] 
      },
      config: createSpringConfig(explosionPhase, isExploded)
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
  
  // Define label offsets for visual fine-tuning (if needed)
  const getLabelOffset = (facetKey) => {
    const offsets = {
      'empathy': [0, 0, 0],      // No offset needed when using anchors
      'narrative': [0, 0, 0],  
      'craft': [0, 0, 0],    
      'system': [0, 0, 0],     
      'leadership': [0, 0, 0], 
      'exploration': [0, 0, 0] 
    };
    
    return offsets[facetKey] || [0, 0, 0];
  };
  
  return (
    <group>
      {/* Material Manager Component */}
      <MaterialManager
        materialVariant={materialVariant}
        blackOpalConfig={blackOpalConfigState}
        iceOpalConfig={iceOpalConfig}
        config={config}
        materialRef={crystalMaterialRef}
      />
      
      {/* Camera Controller for animations */}
      <CameraController
        isExploded={isExploded}
        selectedFacet={selectedFacet}
        facetRefs={facetRefs}
        config={config}
        facetLabels={config.facetLabels}
      />
      
      {/* Show the whole crystal */}
      {showCrystal && (
        <primitive object={crystalWhole.scene} />
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
          onFacetSelect={onFacetSelect}
          onFacetHover={onFacetHover}
        />
      )}
      
      {/* Premium labels with spring animations */}
      {config.facetLabels.map((label, index) => (
        <SelectablePremiumLabel
          key={label.key}
          label={label}
          index={index}
          position={labelPositions[index]}
          visible={showFacets && showLabels}
          config={config}
          isSelected={label.key === selectedFacet}
          isHovered={label.key === hoveredFacet && label.key !== selectedFacet}
          onSelect={onFacetSelect}
        />
      ))}
    </group>
  );
};

export default EnhancedCrystalScene;