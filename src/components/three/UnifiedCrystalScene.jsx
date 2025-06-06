// FIXED: src/components/three/UnifiedCrystalScene.jsx
// Crystal scene with proper animation coordination

import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'

// Import existing material manager
import MaterialManager from './MaterialManager'

/**
 * FIXED: Crystal Scene with synchronized animations
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
  
  // FIXED: Animation state tracking
  const lastAnimationState = useRef(null);
  const reformStartTime = useRef(null);
  const reformProgress = useRef(0);
  
  // Component state
  const [showWholeCrystal, setShowWholeCrystal] = useState(true);
  const [showFacets, setShowFacets] = useState(false);
  
  const { clock } = useThree();
  
  // Facet configuration
  const facetKeys = ['empathy', 'narrative', 'craft', 'system', 'leadership', 'exploration'];
  const facetColors = ['#64ffda', '#bb86fc', '#03dac6', '#cf6679', '#ffd600', '#ff7043'];

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
   * FIXED: Handle crystal form changes with proper timing coordination
   */
  useEffect(() => {
    if (!animationData) return;
    
    const currentState = animationData.state;
    const stateChanged = !lastAnimationState.current || 
                        lastAnimationState.current !== currentState;
    
    if (stateChanged) {
      if (process.env.NODE_ENV === 'development') {
        console.log('💎 Crystal state transition:', {
          from: lastAnimationState.current || 'none',
          to: currentState,
          crystalForm: animationData.crystalForm,
          shouldRotate: animationData.crystalConfig?.shouldRotate
        });
      }

      switch (currentState) {
        case 'hero':
          setShowWholeCrystal(true);
          setShowFacets(false);
          reformStartTime.current = null;
          reformProgress.current = 0;
          break;
          
        case 'exploding':
          // During explosion, switch from whole to facets
          setShowWholeCrystal(false);
          setShowFacets(true);
          break;
          
        case 'overview':
        case 'focusing_project':
        case 'project_focused':
          // Keep facets visible in these states
          setShowWholeCrystal(false);
          setShowFacets(true);
          break;
          
        case 'reforming':
          // FIXED: Handle reform sequence timing properly
          if (!reformStartTime.current) {
            reformStartTime.current = clock.getElapsedTime();
            reformProgress.current = 0;
          }
          
          // Keep facets visible initially, crystal will appear during animation
          setShowFacets(true);
          
          // Show whole crystal partway through the reform sequence
          // This timing should match the camera animation
          setTimeout(() => {
            setShowWholeCrystal(true);
          }, 600); // Show crystal after 600ms
          
          // Hide facets after crystal is fully formed
          setTimeout(() => {
            setShowFacets(false);
          }, 1000); // Hide facets after 1000ms
          break;
          
        case 'about':
          // Final state - only whole crystal
          setShowWholeCrystal(true);
          setShowFacets(false);
          reformStartTime.current = null;
          reformProgress.current = 0;
          break;
          
        default:
          setShowWholeCrystal(true);
          setShowFacets(false);
      }
      
      lastAnimationState.current = currentState;
    }
  }, [animationData?.state, animationData?.crystalForm, clock]);

  /**
   * FIXED: Enhanced animation loop with coordinated movement
   */
  useFrame(() => {
    if (!animationData || !facetRefs.current.length) return;

    const time = clock.getElapsedTime();
    const currentState = animationData.state;

    // Update reform progress if in reform state
    if (currentState === 'reforming' && reformStartTime.current) {
      const elapsed = time - reformStartTime.current;
      const totalReformTime = 2.8; // 2800ms total reform time (matching camera duration)
      reformProgress.current = Math.min(elapsed / totalReformTime, 1);
    }

    // Handle whole crystal rotation and floating
    if (showWholeCrystal && wholeCrystalRef.current && animationData.crystalConfig?.shouldRotate) {
      const rotationSpeed = animationData.crystalConfig.rotationSpeed || 0.0003;
      
      // Subtle rotation
      wholeCrystalRef.current.rotation.y += rotationSpeed;
      wholeCrystalRef.current.rotation.x = Math.sin(time * 0.0001) * 0.015;
      wholeCrystalRef.current.rotation.z = Math.cos(time * 0.00012) * 0.008;
      
      // Floating motion only in hero state
      if (currentState === 'hero') {
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

    // FIXED: Handle facet animations with better coordination
    if (showFacets && animationData.crystalConfig?.positions) {
      // Different lerp speeds based on animation state
      let lerpSpeed = 0.03; // Default
      
      if (currentState === 'exploding') {
        lerpSpeed = 0.06; // Faster during explosion
      } else if (currentState === 'reforming') {
        // FIXED: Use reform progress to control movement speed
        const reformLerpSpeed = 0.08 + (reformProgress.current * 0.12); // Speed up as reform progresses
        lerpSpeed = reformLerpSpeed;
      } else if (animationData.isTransitioning) {
        lerpSpeed = 0.05; // Medium speed during other transitions
      }
      
      facetRefs.current.forEach((facetRef, index) => {
        if (!facetRef) return;
        
        const facetKey = facetKeys[index];
        let targetPos = animationData.crystalConfig.positions[facetKey];
        
        // FIXED: During reform, smoothly move all facets to center
        if (currentState === 'reforming') {
          // Use reform progress to control the movement
          const centerPos = new THREE.Vector3(0, 0, 0);
          const currentPos = targetPos || new THREE.Vector3(0, 0, 0);
          
          // Interpolate between current exploded position and center based on reform progress
          targetPos = new THREE.Vector3().lerpVectors(currentPos, centerPos, reformProgress.current);
        }
        
        if (targetPos) {
          // Smooth lerp to target position
          facetRef.position.lerp(targetPos, lerpSpeed);
          
          // Minimal floating when focused (only in stable states)
          if (animationData.focusedFacet === facetKey && 
              !animationData.isTransitioning && 
              currentState === 'project_focused') {
            const floatOffset = Math.sin(time * 1.2 + index) * 0.001;
            facetRef.position.y += floatOffset;
          }
        }
      });
    }
  });

  // Cleanup any pending timeouts on unmount
  useEffect(() => {
    return () => {
      // Cleanup handled by useEffect cleanup in parent components
    };
  }, []);

  /**
   * Get facet color by index
   */
  const getFacetColor = (index) => {
    return facetColors[index] || '#ffffff';
  };

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
      
      {/* FIXED: Whole Crystal with proper visibility control */}
      {showWholeCrystal && (
        <group ref={wholeCrystalRef}>
          <primitive object={wholeCrystal.scene} />
        </group>
      )}
      
      {/* FIXED: Individual Facets with coordinated animations */}
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
            <div><strong>💎 Crystal Debug (FIXED):</strong></div>
            <div>State: {animationData.state}</div>
            <div>Form: {animationData.crystalForm}</div>
            <div>Show Whole: {showWholeCrystal ? 'YES' : 'NO'}</div>
            <div>Show Facets: {showFacets ? 'YES' : 'NO'}</div>
            <div>Should Rotate: {animationData.crystalConfig?.shouldRotate ? 'YES' : 'NO'}</div>
            <div>Focused: {animationData.focusedFacet || 'none'}</div>
            <div>Zone: {animationData.currentZone}</div>
            <div>Transitioning: {animationData.isTransitioning ? 'YES' : 'NO'}</div>
            {reformStartTime.current && (
              <div>
                <div>Reform Time: {(clock.getElapsedTime() - reformStartTime.current).toFixed(1)}s</div>
                <div>Reform Progress: {Math.round(reformProgress.current * 100)}%</div>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

export default UnifiedCrystalScene;