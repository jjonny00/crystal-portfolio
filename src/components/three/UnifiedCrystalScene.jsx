// FIXED: src/components/three/UnifiedCrystalScene.jsx
// Crystal scene that coordinates smoothly with animation sequences

import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'

// Import existing material manager
import MaterialManager from './MaterialManager'

/**
 * FIXED: Crystal Scene with coordinated animations and smooth reform
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
  
  // FIXED: Animation coordination
  const lastAnimationState = useRef(null);
  const reformStartTime = useRef(null);
  const reformTimeouts = useRef([]);
  
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
   * FIXED: Handle crystal form changes with proper coordination
   */
  useEffect(() => {
    if (!animationData) return;
    
    const currentState = animationData.state;
    const targetCrystalForm = animationData.crystalForm;
    
    // FIXED: Only change visibility during appropriate states
    const stateChanged = !lastAnimationState.current || 
                        lastAnimationState.current.state !== currentState;
    
    if (stateChanged) {
      if (process.env.NODE_ENV === 'development') {
        console.log('💎 Crystal state transition:', {
          from: lastAnimationState.current?.state || 'none',
          to: currentState,
          crystalForm: targetCrystalForm,
          shouldRotate: animationData.crystalConfig?.shouldRotate
        });
      }

      // Clear any pending reform timeouts when state changes
      reformTimeouts.current.forEach(clearTimeout);
      reformTimeouts.current = [];

      // Handle visibility changes based on animation state
      switch (currentState) {
        case 'hero':
          setShowWholeCrystal(true);
          setShowFacets(false);
          break;
          
        case 'preparing_explosion':
          // Keep whole crystal visible during prep
          setShowWholeCrystal(true);
          setShowFacets(false);
          break;
          
        case 'exploding':
          // Switch to facets during explosion
          setShowWholeCrystal(false);
          setShowFacets(true);
          break;
          
        case 'explosion_settling':
        case 'overview':
        case 'focusing_project':
        case 'project_focused':
          // Keep facets visible
          setShowWholeCrystal(false);
          setShowFacets(true);
          break;
          
        case 'preparing_reform':
          // FIXED: Keep facets visible during reform prep
          setShowWholeCrystal(false);
          setShowFacets(true);
          break;
          
        case 'reforming_crystal':
          // Show facets moving back to center then reveal whole crystal
          setShowWholeCrystal(false);
          setShowFacets(true);
          reformStartTime.current = clock.getElapsedTime();

          // Reveal whole crystal slightly before facets disappear
          reformTimeouts.current.push(
            setTimeout(() => setShowWholeCrystal(true), config.timing.reform.crystalAppearTime)
          );
          reformTimeouts.current.push(
            setTimeout(() => setShowFacets(false), config.timing.reform.facetsDisappearTime)
          );
          break;
          
        case 'reforming_camera':
        case 'reform_settling':
        case 'about':
          // Keep whole crystal visible
          setShowWholeCrystal(true);
          setShowFacets(false);
          break;
          
        default:
          // Default to whole crystal
          setShowWholeCrystal(true);
          setShowFacets(false);
      }
      
      lastAnimationState.current = { state: currentState };
    }
  }, [animationData?.state, animationData?.crystalForm, clock]);

  /**
   * FIXED: Enhanced animation loop with coordinated movement
   */
  useFrame(() => {
    if (!animationData || !facetRefs.current.length) return;

    const time = clock.getElapsedTime();
    const currentState = animationData.state;

    // FIXED: Handle whole crystal rotation and floating
    if (showWholeCrystal && wholeCrystalRef.current && animationData.crystalConfig?.shouldRotate) {
      const rotationSpeed = animationData.crystalConfig.rotationSpeed || 0.0003;
      
      // Subtle rotation
      wholeCrystalRef.current.rotation.y += rotationSpeed;
      wholeCrystalRef.current.rotation.x = Math.sin(time * 0.0001) * 0.015;
      wholeCrystalRef.current.rotation.z = Math.cos(time * 0.00012) * 0.008;
      
      // FIXED: Floating motion only in hero state
      if (currentState === 'hero') {
        const floatAmplitude = 0.008;
        const floatY = Math.sin(time * 0.8) * floatAmplitude;
        const floatX = Math.sin(time * 0.6) * floatAmplitude * 0.3;
        const floatZ = Math.sin(time * 0.5) * floatAmplitude * 0.2;
        
        wholeCrystalRef.current.position.set(floatX, floatY, floatZ);
      } else {
        // FIXED: Ensure crystal is centered when not floating
        wholeCrystalRef.current.position.set(0, 0, 0);
      }
    } else if (wholeCrystalRef.current && !animationData.crystalConfig?.shouldRotate) {
      // Stop rotation and reset position when not in hero state
      wholeCrystalRef.current.position.set(0, 0, 0);
    }

    // FIXED: Smooth facet animations based on animation state
    if (showFacets && animationData.crystalConfig?.positions) {
      // Different lerp speeds based on animation state
      let lerpSpeed = 0.03; // Default
      
      if (currentState === 'exploding') {
        lerpSpeed = 0.08; // Faster during explosion
      } else if (currentState === 'preparing_reform' || currentState === 'reforming_crystal') {
        lerpSpeed = 0.12; // Faster during reform (they need to move to center quickly)
      } else if (animationData.isTransitioning) {
        lerpSpeed = 0.05; // Medium speed during other transitions
      }
      
      facetRefs.current.forEach((facetRef, index) => {
        if (!facetRef) return;
        
        const facetKey = facetKeys[index];
        let targetPos = animationData.crystalConfig.positions[facetKey];
        
        // FIXED: During reform, move all facets to center regardless of config
        if (currentState === 'preparing_reform' || currentState === 'reforming_crystal') {
          targetPos = new THREE.Vector3(0, 0, 0); // Force to center
        }
        
        if (targetPos) {
          // Smooth lerp to target position
          facetRef.position.lerp(targetPos, lerpSpeed);
          
          // FIXED: Minimal floating when focused (only in stable states)
          if (animationData.focusedFacet === facetKey && 
              !animationData.isTransitioning && 
              currentState === 'project_focused') {
            const floatOffset = Math.sin(time * 1.2 + index) * 0.001;
            facetRef.position.y += floatOffset;
          }
        }
      });
    }

    // FIXED: Handle reform transition timing
    if (currentState === 'reforming_crystal' && reformStartTime.current) {
      const reformElapsed = time - reformStartTime.current;
      const reformDuration = 1.0; // 1 second for crystal reform
      
      // FIXED: Ensure facets are fully centered before we hide them
      if (reformElapsed > reformDuration * 0.8) {
        // Force all facets to exact center in the final phase
        facetRefs.current.forEach((facetRef) => {
          if (facetRef) {
            facetRef.position.lerp(new THREE.Vector3(0, 0, 0), 0.2); // Fast convergence
          }
        });
      }
    }
  });

  // Cleanup any pending timeouts on unmount
  useEffect(() => {
    return () => {
      reformTimeouts.current.forEach(clearTimeout);
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
            maxWidth: '280px'
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
              <div>Reform Time: {(clock.getElapsedTime() - reformStartTime.current).toFixed(1)}s</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

export default UnifiedCrystalScene;