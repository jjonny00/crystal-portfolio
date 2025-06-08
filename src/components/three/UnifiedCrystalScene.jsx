// FIXED: src/components/three/UnifiedCrystalScene.jsx
// REMOVED: PersistentDustSystem (moved to Fixed3DCanvas)
// Fixed crystal form transitions with instant, non-overlapping visibility swaps + ease-in reform

import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'

// Import existing material manager
import MaterialManager from './MaterialManager'

import VolumetricOmniLight, { SmartVolumetricOmniLight } from './VolumetricOmniLight'

// REMOVED: PersistentDustSystem import (moved to Fixed3DCanvas)

/**
 * FIXED: Crystal Scene with instant, non-overlapping form changes + ease-in reform
 * REMOVED: PersistentDustSystem (moved to Fixed3DCanvas to prevent re-render strobing)
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
  
  // FIXED: Simplified state tracking - just what we need for instant swaps
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
   * FIXED: Handle crystal form changes with proper reform timing
   */
  useEffect(() => {
    if (!animationData) return;
    
    const currentForm = animationData.crystalForm;
    const formChanged = currentForm !== lastCrystalForm.current;
    
    if (formChanged) {
      if (process.env.NODE_ENV === 'development') {
        console.log('💎 Crystal form change:', {
          from: lastCrystalForm.current,
          to: currentForm,
          state: animationData.state
        });
      }

      if (currentForm === 'whole') {
        // EXPLODED → WHOLE (reform)
        // Keep showing facets while they animate back to center
        // The swap will happen when they reach the center (in animation loop)
        if (process.env.NODE_ENV === 'development') {
          console.log('💎 REFORM START: Keep facets visible, they will animate to center');
        }
      } 
      else if (currentForm === 'exploded') {
        // WHOLE → EXPLODED (explosion)
        // Instantly hide whole crystal and show facets
        setShowWholeCrystal(false);  // ← Hide whole IMMEDIATELY
        setShowFacets(true);         // ← Show facets IMMEDIATELY
        
        if (process.env.NODE_ENV === 'development') {
          console.log('💎 EXPLOSION: Whole OFF, Facets ON - INSTANT');
        }
      }
      
      lastCrystalForm.current = currentForm;
    }
  }, [animationData?.crystalForm, animationData?.state]);

  /**
   * FIXED: Animation loop with ease-in reform and smooth movement
   */
  useFrame(() => {
    if (!animationData || !facetRefs.current.length) return;

    const time = clock.getElapsedTime();

    // Handle whole crystal rotation and floating (only when visible)
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

    // FIXED: Handle facet animations with ease-in reform
    if (showFacets && animationData.crystalConfig?.positions) {
      // Track if we're in reform mode (crystalForm is 'whole' but facets are still visible)
      const isReforming = animationData.crystalForm === 'whole' && showFacets;
      
      // CONFIGURABLE SPEEDS - Adjust these values to change animation feel
      const speeds = {
        explosion: 0.04,    // Normal explosion speed (facets moving outward)
        reform: 0.12,       // Base reform speed (will be modified by ease-in)
        projectFocus: 0.05, // Speed when focusing on individual projects
        floating: 0.02      // Gentle floating animation speed
      };
      
      // Choose speed based on animation context (for non-reform animations)
      let lerpSpeed;
      if (animationData.focusedFacet) {
        lerpSpeed = speeds.projectFocus;  // Medium speed for project transitions
      } else {
        lerpSpeed = speeds.explosion;     // Normal speed for explosion
      }
      
      let allFacetsAtCenter = true; // Track if all facets have reached center
      
      facetRefs.current.forEach((facetRef, index) => {
        if (!facetRef) return;
        
        const facetKey = facetKeys[index];
        let targetPos = animationData.crystalConfig.positions[facetKey];
        
        // FIXED: During reform, move facets to center (0,0,0)
        if (isReforming) {
          targetPos = new THREE.Vector3(0, 0, 0); // Move to center for reform
        }
        
        if (targetPos) {
          // EASE-IN REFORM: Different animation for reform vs others
          if (isReforming) {
            // Calculate ease-in speed for this specific facet
            const distanceToCenter = facetRef.position.distanceTo(new THREE.Vector3(0, 0, 0));
            const maxDistance = 2; // Adjust based on your exploded positions
            const progress = Math.min(1 - (distanceToCenter / maxDistance), 1);
            const clampedProgress = Math.max(0, progress); // Ensure progress is 0-1
            
            // Ease-in: slow start (0.02), fast finish (0.18)
            const facetSpeed = 0.02 + (clampedProgress * clampedProgress * 0.16);
            
            facetRef.position.lerp(targetPos, facetSpeed);
            
            // Check if this facet has reached the center
            if (distanceToCenter > 0.8) {
              allFacetsAtCenter = false;
            }
          } else {
            // Normal lerp for explosion and project focus
            facetRef.position.lerp(targetPos, lerpSpeed);
          }
          
          // Minimal floating when focused (only in stable states, not during reform)
          if (!isReforming && 
              animationData.focusedFacet === facetKey && 
              !animationData.isTransitioning && 
              animationData.state === 'project_focused') {
            const floatOffset = Math.sin(time * 1.2 + index) * 0.001;
            facetRef.position.y += floatOffset;
          }
        }
      });
      
      // FIXED: When all facets reach center during reform, swap to whole crystal
      if (isReforming && allFacetsAtCenter && !showWholeCrystal) {
        if (process.env.NODE_ENV === 'development') {
          console.log('💎 REFORM COMPLETE: All facets at center - swapping to whole crystal');
        }
        
        // INSTANT swap at the end of reform animation
        setShowFacets(false);        // ← Hide facets NOW
        setShowWholeCrystal(true);   // ← Show whole NOW
      }
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

      {/* Crystal Core Light */}
      {/* <SmartVolumetricOmniLight 
        animationData={animationData}
        visible={true}
      /> */}
      
      {/* FIXED: Whole Crystal with INSTANT visibility control */}
      {showWholeCrystal && (
        <group ref={wholeCrystalRef}>
          <primitive object={wholeCrystal.scene} />
        </group>
      )}
      
      {/* FIXED: Individual Facets with INSTANT visibility control */}
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
            <div><strong>💎 Crystal Debug (EASE-IN REFORM):</strong></div>
            <div>State: {animationData.state}</div>
            <div>Form: {animationData.crystalForm}</div>
            <div style={{ 
              color: showWholeCrystal ? '#4CAF50' : '#F44336',
              fontWeight: 'bold'
            }}>
              Show Whole: {showWholeCrystal ? 'YES' : 'NO'}
            </div>
            <div style={{ 
              color: showFacets ? '#4CAF50' : '#F44336',
              fontWeight: 'bold'
            }}>
              Show Facets: {showFacets ? 'YES' : 'NO'}
            </div>
            <div>Should Rotate: {animationData.crystalConfig?.shouldRotate ? 'YES' : 'NO'}</div>
            <div>Focused: {animationData.focusedFacet || 'none'}</div>
            <div>Zone: {animationData.currentZone}</div>
            <div>Transitioning: {animationData.isTransitioning ? 'YES' : 'NO'}</div>
            
            {/* REFORM STATUS */}
            {animationData.crystalForm === 'whole' && showFacets && (
              <div style={{
                background: '#2196F3',
                color: 'white',
                padding: '4px',
                borderRadius: '2px',
                marginTop: '4px',
                fontWeight: 'bold'
              }}>
                🔄 EASE-IN REFORM: Slow start → Fast finish
                {/* Show distances for debugging */}
                <div style={{ fontSize: '10px', marginTop: '2px' }}>
                  Distances: {facetRefs.current.map((ref, i) => 
                    ref ? ref.position.distanceTo(new THREE.Vector3(0, 0, 0)).toFixed(3) : '---'
                  ).join(', ')}
                </div>
                <div style={{ fontSize: '10px' }}>
                  Threshold: 0.015
                </div>
              </div>
            )}
            
            {/* VISIBILITY WARNING */}
            {showWholeCrystal && showFacets && (
              <div style={{
                background: '#F44336',
                color: 'white',
                padding: '4px',
                borderRadius: '2px',
                marginTop: '4px',
                fontWeight: 'bold'
              }}>
                ⚠️ OVERLAP: Both visible!
              </div>
            )}
            
            {!showWholeCrystal && !showFacets && (
              <div style={{
                background: '#FF9800',
                color: 'white',
                padding: '4px',
                borderRadius: '2px',
                marginTop: '4px',
                fontWeight: 'bold'
              }}>
                ⚠️ NONE VISIBLE!
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

export default UnifiedCrystalScene;