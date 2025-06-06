// FIXED: src/components/three/UnifiedCrystalScene.jsx
// Simplified crystal scene with smooth form transitions for immediate state changes

import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'

// Import existing material manager
import MaterialManager from './MaterialManager'

/**
 * SIMPLIFIED: Crystal Scene with smooth transitions to immediate form changes
 */
const UnifiedCrystalScene = ({ 
  animationData,
  config, 
  materialVariant = 'default',
  blackOpalConfig,
  iceOpalConfig,
  performanceConfig = { useNormalMaps: true, textureQuality: 'high', usePBR: true },
  isMobile = false
}) => {
  // Component refs
  const crystalGroupRef = useRef();
  const wholeCrystalRef = useRef();
  const facetRefs = useRef(Array(6).fill(null));
  const crystalMaterialRef = useRef();
  
  // Simplified state tracking - just what we need for smooth transitions
  const [showWholeCrystal, setShowWholeCrystal] = useState(true);
  const [showFacets, setShowFacets] = useState(false);
  const lastCrystalForm = useRef('whole');
  
  const { clock } = useThree();
  
  // Facet configuration
  const facetKeys = ['empathy', 'narrative', 'craft', 'system', 'leadership', 'exploration'];

  // Load models
  const wholeCrystal = useGLTF(config.assets.models.crystalWhole);
  const facetModels = [
    useGLTF(config.assets.models.facetEmpathy),
    useGLTF(config.assets.models.facetNarrative),
    useGLTF(config.assets.models.facetCraft),
    useGLTF(config.assets.models.facetSystem),
    useGLTF(config.assets.models.facetLeadership),
    useGLTF(config.assets.models.facetExploration)
  ];
  
  /**
   * Apply shared material to all models
   */
  useEffect(() => {
    if (!crystalMaterialRef.current) return;
    
    const applyMaterial = (modelScene) => {
      if (!modelScene) return;
      modelScene.traverse((child) => {
        if (child.isMesh) {
          child.material = crystalMaterialRef.current;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    };
    
    // Apply material to all models
    applyMaterial(wholeCrystal.scene);
    facetModels.forEach(model => applyMaterial(model.scene));
    
  }, [wholeCrystal, facetModels, crystalMaterialRef.current]);
  
  /**
   * FIXED: Handle crystal form changes with smooth transitions instead of instant swapping
   */
  useEffect(() => {
    if (!animationData) return;
    
    const currentForm = animationData.crystalForm;
    const formChanged = currentForm !== lastCrystalForm.current;
    
    if (formChanged) {
      if (process.env.NODE_ENV === 'development') {
        console.log('💎 Crystal form transition:', {
          from: lastCrystalForm.current,
          to: currentForm,
          state: animationData.state
        });
      }

      // FIXED: Smooth transitions instead of instant form changes
      if (currentForm === 'whole') {
        // Transitioning to whole crystal (reform sequence)
        if (lastCrystalForm.current === 'exploded') {
          // Start showing whole crystal immediately but keep facets for smooth transition
          setShowWholeCrystal(true);
          
          // Gradually hide facets after crystal appears
          setTimeout(() => {
            setShowFacets(false);
          }, 800); // Give time for visual overlap
        } else {
          // Direct to whole (no transition needed)
          setShowWholeCrystal(true);
          setShowFacets(false);
        }
      } else if (currentForm === 'exploded') {
        // Transitioning to exploded crystal (explosion sequence)
        if (lastCrystalForm.current === 'whole') {
          // Start showing facets immediately but keep whole for smooth transition
          setShowFacets(true);
          
          // Hide whole crystal after facets start moving
          setTimeout(() => {
            setShowWholeCrystal(false);
          }, 400); // Quick transition for explosion feel
        } else {
          // Direct to exploded (no transition needed)
          setShowWholeCrystal(false);
          setShowFacets(true);
        }
      }
      
      lastCrystalForm.current = currentForm;
    }
  }, [animationData?.crystalForm, animationData?.state]);

  /**
   * SIMPLIFIED: Animation loop with smooth transitions
   */
  useFrame(() => {
    if (!animationData || !facetRefs.current.length) return;

    const time = clock.getElapsedTime();

    // Handle whole crystal rotation and floating
    if (showWholeCrystal && wholeCrystalRef.current && animationData.crystalConfig?.shouldRotate) {
      const rotationSpeed = animationData.crystalConfig.rotationSpeed || 0.0003;
      
      // Subtle rotation
      wholeCrystalRef.current.rotation.y += rotationSpeed;
      wholeCrystalRef.current.rotation.x = Math.sin(time * 0.0001) * 0.015;
      wholeCrystalRef.current.rotation.z = Math.cos(time * 0.00012) * 0.008;
      
      // Floating motion only in hero state
      if (animationData.state === 'hero') {
        const floatAmplitude = 0.008;
        const floatY = Math.sin(time * 0.8) * floatAmplitude;
        const floatX = Math.sin(time * 0.6) * floatAmplitude * 0.3;
        const floatZ = Math.sin(time * 0.5) * floatAmplitude * 0.2;
        
        wholeCrystalRef.current.position.set(floatX, floatY, floatZ);
      } else {
        // Ensure crystal is centered when not floating
        wholeCrystalRef.current.position.set(0, 0, 0);
      }
    } else if (wholeCrystalRef.current && !animationData.crystalConfig?.shouldRotate) {
      // Stop rotation and reset position
      wholeCrystalRef.current.position.set(0, 0, 0);
    }

    // FIXED: Handle facet animations with smooth movement and crystal form transitions
    if (showFacets && animationData.crystalConfig?.positions) {
      // Different lerp speeds based on animation state for better visual feedback
      let lerpSpeed = 0.04;
      
      // Faster movement during explosion for dramatic effect
      if (lastCrystalForm.current === 'exploded' && showWholeCrystal && showFacets) {
        lerpSpeed = 0.08; // Explosion - facets move quickly away from center
      }
      // Slower movement during reform for smooth gathering effect
      else if (lastCrystalForm.current === 'whole' && showWholeCrystal && showFacets) {
        lerpSpeed = 0.03; // Reform - facets move slowly toward center
      }
      
      facetRefs.current.forEach((facetRef, index) => {
        if (!facetRef) return;
        
        const facetKey = facetKeys[index];
        let targetPos = animationData.crystalConfig.positions[facetKey];
        
        // FIXED: During reform transition, gradually move facets to center
        if (showWholeCrystal && showFacets && animationData.crystalForm === 'whole') {
          // Reform sequence - move facets toward center
          const centerPos = new THREE.Vector3(0, 0, 0);
          const currentPos = facetRef.position;
          const distanceToCenter = currentPos.distanceTo(centerPos);
          
          // Use distance to center as progress indicator
          if (distanceToCenter > 0.1) {
            targetPos = centerPos; // Move toward center
            lerpSpeed = 0.06; // Smooth reform speed
          }
        }
        
        if (targetPos) {
          // Smooth lerp to target position
          facetRef.position.lerp(targetPos, lerpSpeed);
          
          // Minimal floating when focused (only in stable states)
          if (animationData.focusedFacet === facetKey && 
              !animationData.isTransitioning && 
              animationData.state === 'project_focused') {
            const floatOffset = Math.sin(time * 1.2 + index) * 0.001;
            facetRef.position.y += floatOffset;
          }
        }
      });
    }
  });

  /**
   * Check if facet is focused
   */
  const isFacetFocused = (index) => {
    const facetKey = facetKeys[index];
    return animationData?.focusedFacet === facetKey;
  };

  return (
    <group ref={crystalGroupRef}>
      {/* Material Manager Component */}
      <MaterialManager
        materialVariant={materialVariant}
        blackOpalConfig={blackOpalConfig}
        iceOpalConfig={iceOpalConfig}
        config={config}
        materialRef={crystalMaterialRef}
        performanceConfig={performanceConfig}
      />
      
      {/* SIMPLIFIED: Whole Crystal with immediate visibility control */}
      {showWholeCrystal && (
        <group ref={wholeCrystalRef}>
          <primitive object={wholeCrystal.scene} />
        </group>
      )}
      
      {/* SIMPLIFIED: Individual Facets with smooth movement */}
      {showFacets && facetModels.map((model, index) => {
        const facetKey = facetKeys[index];
        const isFocused = isFacetFocused(index);
        
        return (
          <group 
            key={facetKey}
            ref={el => facetRefs.current[index] = el}
          >
            <primitive object={model.scene} />
          </group>
        );
      })}
      
      {/* Enhanced debug info in development */}
      {process.env.NODE_ENV === 'development' && animationData && (
        <Html>
          <div style={{
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 10002,
            pointerEvents: 'none',
            maxWidth: '300px'
          }}>
            <div><strong>💎 Crystal Debug (SIMPLIFIED):</strong></div>
            <div>State: {animationData.state}</div>
            <div>Form: {animationData.crystalForm}</div>
            <div>Show Whole: {showWholeCrystal ? 'YES' : 'NO'}</div>
            <div>Show Facets: {showFacets ? 'YES' : 'NO'}</div>
            <div>Should Rotate: {animationData.crystalConfig?.shouldRotate ? 'YES' : 'NO'}</div>
            <div>Focused: {animationData.focusedFacet || 'none'}</div>
            <div>Zone: {animationData.currentZone}</div>
            <div>Transitioning: {animationData.isTransitioning ? 'YES' : 'NO'}</div>
          </div>
        </Html>
      )}
    </group>
  );
};

export default UnifiedCrystalScene;