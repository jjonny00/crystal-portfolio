// components/three/ScrollCrystalScene.jsx
// Updated crystal scene component for scroll-driven experience

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useSpring, a } from '@react-spring/three';
import * as THREE from 'three';

// Import existing components
import MaterialManager from './MaterialManager';
import CameraController from './CameraController';
import SelectableFacetGroup from './SelectableFacetGroup';
import SelectablePremiumLabel from './SelectablePremiumLabel';

// Import state constants
import { CRYSTAL_STATES } from '../../machines/crystalStateMachine';

const ScrollCrystalScene = ({
  scrollCrystalData,
  config,
  materialVariant,
  blackOpalConfig,
  iceOpalConfig,
  performanceConfig
}) => {
  const groupRef = useRef();
  const crystalMaterialRef = useRef();
  const facetRefs = useRef(Array(6).fill(null));
  
  // Load models
  const crystalWhole = useGLTF(config.assets.models.crystalWhole);
  const facetModels = [
    useGLTF(config.assets.models.facetEmpathy),
    useGLTF(config.assets.models.facetNarrative),
    useGLTF(config.assets.models.facetCraft),
    useGLTF(config.assets.models.facetSystem),
    useGLTF(config.assets.models.facetLeadership),
    useGLTF(config.assets.models.facetExploration)
  ];
  
  // Animation springs based on crystal state
  const crystalSpring = useSpring({
    position: scrollCrystalData.crystalState === CRYSTAL_STATES.WHOLE ? [0, 0, 0] : [0, 0, 0],
    rotation: scrollCrystalData.crystalState === CRYSTAL_STATES.WHOLE ? [0, 0, 0] : [0, 0, 0],
    scale: scrollCrystalData.crystalState === CRYSTAL_STATES.WHOLE ? 1 : 1,
    config: { tension: 120, friction: 14 }
  });
  
  // Facet springs for explosion
  const facetSprings = config.facetLabels.map((label, index) => {
    const isExploded = scrollCrystalData.crystalState === CRYSTAL_STATES.EXPLODED || 
                     scrollCrystalData.crystalState === CRYSTAL_STATES.PROJECT_SELECTED;
    
    return useSpring({
      position: isExploded ? config.explodedPositions[label.key] : config.startingPositions[label.key],
      scale: scrollCrystalData.currentProjectIndex === index ? 1.2 : 1,
      config: { tension: 100, friction: 12 }
    });
  });
  
  // Apply materials to models
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
    facetModels.forEach(model => applyMaterial(model.scene));
  }, [crystalWhole, facetModels, crystalMaterialRef.current]);
  
  // Handle idle rotation and floating
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Apply idle rotation when in intro
    if (scrollCrystalData.isInIntro) {
      const [rotX, rotY, bobY] = scrollCrystalData.getIdleRotation(time);
      groupRef.current.rotation.y = rotY;
      groupRef.current.position.y = bobY;
    }
    
    // Handle project-specific animations
    if (scrollCrystalData.isInProjects && scrollCrystalData.getCurrentProject()) {
      // Could add project-specific animations here
    }
  });
  
  // Determine what to show based on crystal state
  const showWholeCrystal = scrollCrystalData.crystalState === CRYSTAL_STATES.WHOLE || 
                          scrollCrystalData.crystalState === CRYSTAL_STATES.REFORMING;
  
  const showFacets = scrollCrystalData.crystalState === CRYSTAL_STATES.EXPLODED || 
                    scrollCrystalData.crystalState === CRYSTAL_STATES.PROJECT_SELECTED ||
                    scrollCrystalData.crystalState === CRYSTAL_STATES.EXPLODING ||
                    scrollCrystalData.crystalState === CRYSTAL_STATES.FRACTURING;
  
  const showLabels = scrollCrystalData.crystalState === CRYSTAL_STATES.EXPLODED;
  
  return (
    <group ref={groupRef}>
      {/* Material Manager */}
      <MaterialManager
        materialVariant={materialVariant}
        blackOpalConfig={blackOpalConfig}
        iceOpalConfig={iceOpalConfig}
        config={config}
        materialRef={crystalMaterialRef}
        performanceConfig={performanceConfig}
      />
      
      {/* Camera Controller - modified for scroll control */}
      <CameraController
        isExploded={!showWholeCrystal}
        crystalState={scrollCrystalData.crystalState}
        selectedFacet={scrollCrystalData.getCurrentProject()?.facetKey}
        facetRefs={facetRefs}
        config={config}
        facetLabels={config.facetLabels}
      />
      
      {/* Whole Crystal */}
      {showWholeCrystal && (
        <a.group {...crystalSpring}>
          <primitive object={crystalWhole.scene} />
        </a.group>
      )}
      
      {/* Individual Facets */}
      {showFacets && (
        <SelectableFacetGroup
          models={facetModels}
          springs={facetSprings}
          facetLabels={config.facetLabels}
          facetRefs={facetRefs}
          selectedFacet={scrollCrystalData.getCurrentProject()?.facetKey}
          hoveredFacet={null} // No hover in scroll mode
          onFacetSelect={() => {}} // Disabled in scroll mode
          onFacetHover={() => {}} // Disabled in scroll mode
        />
      )}
      
      {/* Labels - only show when fully exploded */}
      {showLabels && config.facetLabels.map((label, index) => (
        <SelectablePremiumLabel
          key={label.key}
          label={label}
          index={index}
          position={config.explodedPositions[label.key]}
          visible={true}
          config={config}
          isSelected={false}
          isHovered={false}
          onSelect={() => {}} // Disabled in scroll mode
        />
      ))}
    </group>
  );
};

export default ScrollCrystalScene;