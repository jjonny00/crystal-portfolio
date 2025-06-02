// src/components/three/UnifiedCrystalScene.jsx
// FIXED: Added subtle rotation and coordinated animations

import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'

// Import existing material manager and components
import MaterialManager from './MaterialManager'

/**
 * FIXED: Unified Crystal Scene with rotation and smooth animations
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
  
  // Rotation state
  const rotationRef = useRef({ x: 0, y: 0, z: 0 });
  
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
    
    const shouldShowWhole = animationData.crystalForm === 'whole';
    const shouldShowFacets = animationData.crystalForm === 'exploded';
    
    // Only update if state actually changed
    if (showWholeCrystal !== shouldShowWhole) {
      setShowWholeCrystal(shouldShowWhole);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('💎 Crystal form changed:', {
          crystalForm: animationData.crystalForm,
          showWhole: shouldShowWhole,
          showFacets: shouldShowFacets,
          shouldRotate: animationData.crystalConfig?.shouldRotate
        });
      }
    }
    
    if (showFacets !== shouldShowFacets) {
      setShowFacets(shouldShowFacets);
    }
  }, [animationData?.crystalForm, showWholeCrystal, showFacets]);

  /**
   * FIXED: Enhanced animation loop with rotation and coordinated movement
   */
  useFrame(() => {
    if (!animationData || !facetRefs.current.length) return;

    const time = clock.getElapsedTime();

    // FIXED: Handle whole crystal rotation when idle
    if (showWholeCrystal && wholeCrystalRef.current && animationData.crystalConfig?.shouldRotate) {
      const rotationSpeed = animationData.crystalConfig.rotationSpeed || 0.0003;
      
      // Subtle, multi-axis rotation for organic feel
      rotationRef.current.y += rotationSpeed;
      rotationRef.current.x = Math.sin(time * 0.0001) * 0.015; // Very subtle X wobble
      rotationRef.current.z = Math.cos(time * 0.00012) * 0.008; // Even subtler Z wobble
      
      wholeCrystalRef.current.rotation.set(
        rotationRef.current.x,
        rotationRef.current.y,
        rotationRef.current.z
      );
      
      // FIXED: Add very subtle floating motion
      const floatAmplitude = 0.008;
      const floatY = Math.sin(time * 0.8) * floatAmplitude;
      const floatX = Math.sin(time * 0.6) * floatAmplitude * 0.3;
      const floatZ = Math.sin(time * 0.5) * floatAmplitude * 0.2;
      
      wholeCrystalRef.current.position.set(floatX, floatY, floatZ);
    } else if (wholeCrystalRef.current && !animationData.crystalConfig?.shouldRotate) {
      // Reset position and rotation when not rotating
      wholeCrystalRef.current.position.set(0, 0, 0);
      // Keep current rotation for smooth transitions
    }

    // FIXED: Smooth facet animations with reduced jitter
    if (animationData.crystalForm === 'exploded' && animationData.crystalConfig?.positions) {
      const lerpSpeed = animationData.isTransitioning ? 0.05 : 0.03; // Slower for smoother movement
      
      facetRefs.current.forEach((facetRef, index) => {
        if (!facetRef) return;
        
        const facetKey = facetKeys[index];
        const targetPos = animationData.crystalConfig.positions[facetKey];
        
        if (targetPos) {
          // Smooth lerp to target position
          facetRef.position.lerp(targetPos, lerpSpeed);
          
          // FIXED: Minimal floating when focused (much more subtle)
          if (animationData.focusedFacet === facetKey && !animationData.isTransitioning) {
            const floatOffset = Math.sin(time * 1.2 + index) * 0.001; // Ultra-subtle
            facetRef.position.y += floatOffset;
          }
        }
      });
    } else if (animationData.crystalForm === 'whole') {
      // FIXED: Smooth transition back to center when reforming
      const centerPos = new THREE.Vector3(0, 0, 0);
      const lerpSpeed = 0.08; // Faster return to center
      
      facetRefs.current.forEach((facetRef) => {
        if (facetRef) {
          facetRef.position.lerp(centerPos, lerpSpeed);
        }
      });
    }
  });

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
      
      {/* FIXED: Whole Crystal with rotation and floating */}
      {showWholeCrystal && (
        <group ref={wholeCrystalRef}>
          <primitive object={wholeCrystal.scene} />
        </group>
      )}
      
      {/* Individual Facets with smooth animations */}
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
            maxWidth: '250px'
          }}>
            <div><strong>Crystal Debug (FIXED):</strong></div>
            <div>Form: {animationData.crystalForm}</div>
            <div>State: {animationData.state}</div>
            <div>Show Whole: {showWholeCrystal ? 'YES' : 'NO'}</div>
            <div>Show Facets: {showFacets ? 'YES' : 'NO'}</div>
            <div>Should Rotate: {animationData.crystalConfig?.shouldRotate ? 'YES' : 'NO'}</div>
            <div>Focused: {animationData.focusedFacet || 'none'}</div>
            <div>Zone: {animationData.currentZone}</div>
            <div>Transitioning: {animationData.isTransitioning ? 'YES' : 'NO'}</div>
            {rotationRef.current && (
              <div>Rotation Y: {(rotationRef.current.y * 180 / Math.PI).toFixed(1)}°</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

export default UnifiedCrystalScene;