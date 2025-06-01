// src/components/three/UnifiedCrystalScene.jsx
// FIXED: Removed all facet outline references and components

import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'

// Import existing material manager and components
import MaterialManager from './MaterialManager'

/**
 * Unified Crystal Scene
 * CLEANED: All outline references removed
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
   * Handle crystal form changes based on animation state
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
          showFacets: shouldShowFacets
        });
      }
    }
    
    if (showFacets !== shouldShowFacets) {
      setShowFacets(shouldShowFacets);
    }
  }, [animationData?.crystalForm, showWholeCrystal, showFacets]);

  /**
   * FIXED: Much smoother animation loop with greatly reduced floating
   */
  useFrame(() => {
    if (!animationData || !facetRefs.current.length) return;

    // Calculate ultra-smooth lerp speed
    let baseLerpSpeed = 0.04; // REDUCED from 0.06 for extra smoothness
    
    // Faster during fast scrolling but not too fast
    if (animationData.isFastScrolling) {
      baseLerpSpeed *= 1.2; // REDUCED from 1.5
    }
    
    // Faster during transitions but controlled
    if (animationData.isTransitioning) {
      baseLerpSpeed *= 1.1; // REDUCED from 1.2
    }
    
    // Slower on mobile for smoothness
    if (isMobile) {
      baseLerpSpeed *= 0.95;
    }
    
    const lerpSpeed = Math.min(baseLerpSpeed, 0.15); // REDUCED max from 0.2

    if (animationData.crystalForm === 'exploded' && animationData.crystalConfig?.positions) {
      // Animate facets to exploded positions
      facetRefs.current.forEach((facetRef, index) => {
        if (!facetRef) return;
        
        const facetKey = facetKeys[index];
        const targetPos = animationData.crystalConfig.positions[facetKey];
        
        if (targetPos) {
          facetRef.position.lerp(targetPos, lerpSpeed);
          
          // HEAVILY REDUCED floating animation when in focus
          if (animationData.focusedFacet === facetKey) {
            const time = clock.getElapsedTime();
            // MASSIVE reduction in floating amplitude
            const floatOffset = Math.sin(time * 1.0) * 0.002; // REDUCED from 0.005 to 0.002!
            facetRef.position.y += floatOffset;
          }
        }
      });
    } else if (animationData.crystalForm === 'whole') {
      // Animate facets back to center (for smooth transitions)
      const centerPos = new THREE.Vector3(0, 0, 0);
      facetRefs.current.forEach((facetRef) => {
        if (facetRef) {
          facetRef.position.lerp(centerPos, lerpSpeed);
        }
      });
    }

    // Gentle rotation for whole crystal
    if (showWholeCrystal && wholeCrystalRef.current) {
      const time = clock.getElapsedTime();
      wholeCrystalRef.current.rotation.y = time * 0.0003;
      wholeCrystalRef.current.rotation.x = Math.sin(time * 0.0001) * 0.01;
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
      
      {/* Whole Crystal - shown when crystalForm is 'whole' */}
      {showWholeCrystal && (
        <group ref={wholeCrystalRef}>
          <primitive object={wholeCrystal.scene} />
        </group>
      )}
      
      {/* Individual Facets - shown when crystalForm is 'exploded' */}
      {showFacets && facetModels.map((model, index) => {
        const facetKey = facetKeys[index];
        const isFocused = isFacetFocused(index);
        
        return (
          <group 
            key={facetKey}
            ref={el => facetRefs.current[index] = el}
          >
            <primitive object={model.scene} />
            
            {/* REMOVED: All outline components and references */}
          </group>
        );
      })}
      
      {/* Debug info in development */}
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
            <div><strong>Crystal Debug:</strong></div>
            <div>Form: {animationData.crystalForm}</div>
            <div>Show Whole: {showWholeCrystal ? 'YES' : 'NO'}</div>
            <div>Show Facets: {showFacets ? 'YES' : 'NO'}</div>
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