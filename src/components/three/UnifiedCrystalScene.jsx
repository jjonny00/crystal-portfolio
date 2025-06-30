// ONLY CHANGE: Fixed facet refs exposure for anchor targeting

import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'

// Import existing material manager
import MaterialManager from './MaterialManager'

// Import enhanced sphere component
import GlowingSphereImage, { BLENDING_MODES } from './GlowingSphereImage'

const UnifiedCrystalScene = forwardRef(({ 
  animationData,
  config, 
  materialVariant = 'default',
  blackOpalConfig,
  iceOpalConfig,
  performanceConfig = { useNormalMaps: true, textureQuality: 'high', usePBR: true },
  isMobile = false
}, ref) => {
  // Component refs for crystal animation
  const crystalGroupRef = useRef();
  const wholeCrystalRef = useRef();
  const facetRefs = useRef([]); 
  const crystalMaterialRef = useRef();
  
  // Sphere state
  const [sphereVisible, setSphereVisible] = useState(false);
  
  // Crystal state tracking
  const [showWholeCrystal, setShowWholeCrystal] = useState(true);
  const [showFacets, setShowFacets] = useState(false);
  const lastCrystalForm = useRef('whole');
  
  // Debug panel state
  const [showCrystalDebug, setShowCrystalDebug] = useState(false);
  
  const { clock } = useThree();
  
  // Facet configuration
  const facetKeys = ['empathy', 'narrative', 'craft', 'system', 'leadership', 'exploration'];

  
  useEffect(() => {
    if (facetRefs.current.length === 0) {
      facetRefs.current = facetKeys.map(() => React.createRef());
    }
  }, [facetKeys]);

  
  useImperativeHandle(ref, () => ({
    // Expose the refs array directly (this is what Fixed3DCanvas expects)
    facetRefs: facetRefs.current,
    
    // Helper method for getting specific facet ref
    getFacetRef: (index) => facetRefs.current[index],
    
    // Helper for finding anchor by facet key
    findAnchor: (facetKey) => {
      const facetIndex = facetKeys.indexOf(facetKey);
      if (facetIndex !== -1 && facetRefs.current[facetIndex] && facetRefs.current[facetIndex].current) {
        const anchorName = `anchor_${facetKey}`;
        return facetRefs.current[facetIndex].current.getObjectByName(anchorName) || null;
      }
      return null;
    },
    
    // Expose debug state for debug panels
    debugState: {
      facetKeys,
      facetModels: [], // Will be populated as needed
      facetRefs: { current: facetRefs.current },
      showWholeCrystal,
      showFacets,
      sphereVisible,
      showCrystalDebug,
      lastCrystalForm: lastCrystalForm.current
    },
    
    // Expose debug methods for debug panels
    debugMethods: {
      forceShowFacets: () => {
        console.log('🔥 Debug: Force showing facets');
        setShowWholeCrystal(false);
        setShowFacets(true);
        setSphereVisible(true);
        lastCrystalForm.current = 'exploded';
      },
      forceShowWhole: () => {
        console.log('🔄 Debug: Force showing whole crystal');
        setShowFacets(false);
        setShowWholeCrystal(true);
        setSphereVisible(false);
        lastCrystalForm.current = 'whole';
      },
      inspectModels: () => {
        console.group('🔍 Manual Facet Inspection');
        facetModels.forEach((model, index) => {
          const facetKey = facetKeys[index];
          console.log(`\n=== ${facetKey.toUpperCase()} MODEL ===`);
          console.log('Model:', model);
          console.log('Scene:', model.scene);
          
          if (model.scene) {
            console.log('Scene children:', model.scene.children.length);
            model.scene.traverse((child) => {
              if (child.name) {
                console.log(`  - ${child.name} (${child.type})`);
              }
            });
            
            const anchor = model.scene.getObjectByName(`anchor_${facetKey}`);
            console.log(`Anchor "anchor_${facetKey}":`, anchor);
          }
        });
        console.groupEnd();
      }
    }
  }), [facetKeys, showWholeCrystal, showFacets, sphereVisible, showCrystalDebug]);

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
  
  // Keyboard listener for debug toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInputField = e.target.tagName === 'INPUT' || 
                          e.target.tagName === 'TEXTAREA' || 
                          e.target.isContentEditable;
      
      if (isInputField) return;
      
      if (e.key === 'c' || e.key === 'C') {
        if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
          e.preventDefault();
          setShowCrystalDebug(prev => {
            const newState = !prev;
            console.log(`💎 Crystal Debug Panel: ${newState ? 'ON' : 'OFF'}`);
            return newState;
          });
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Apply shared material to all models
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
    
    applyMaterial(wholeCrystal.scene);
    facetModels.forEach(model => applyMaterial(model.scene));
    
  }, [wholeCrystal, facetModels, crystalMaterialRef.current]);

  // Debug anchor positions when facets are loaded
  useEffect(() => {
    if (showCrystalDebug && facetRefs.current.length > 0) {
      console.group('🎯 Anchor Detection Report');
      
      facetKeys.forEach((facetKey, index) => {
        const facetRef = facetRefs.current[index];
        if (facetRef && facetRef.current) {
          const anchorName = `anchor_${facetKey}`;
          const anchor = facetRef.current.getObjectByName(anchorName);
          
          if (anchor) {
            const worldPos = new THREE.Vector3();
            anchor.getWorldPosition(worldPos);
            console.log(`✅ ${anchorName}:`, {
              localPosition: anchor.position.toArray(),
              worldPosition: worldPos.toArray(),
              parent: anchor.parent?.name || 'root'
            });
          } else {
            console.warn(`❌ ${anchorName}: NOT FOUND`);
            const availableNames = [];
            facetRef.current.traverse((child) => {
              if (child.name) availableNames.push(child.name);
            });
            console.log(`Available objects in ${facetKey}:`, availableNames);
          }
        } else {
          console.warn(`❌ Facet ref for ${facetKey} is null`);
        }
      });
      
      console.groupEnd();
    }
  }, [showCrystalDebug, showFacets, facetKeys]);
  
  // Crystal form change detection
  useEffect(() => {
    if (!animationData) return;
    
    const currentForm = animationData.crystalForm;
    const formChanged = currentForm !== lastCrystalForm.current;
    
    if (formChanged) {
      console.log('💎 Crystal: Form change detected:', {
        from: lastCrystalForm.current,
        to: currentForm
      });

      if (currentForm === 'exploded') {
        console.log('💎 Crystal: Explosion - hiding whole, showing facets, showing sphere');
        setShowWholeCrystal(false);
        setShowFacets(true);
        setSphereVisible(true);
        
      } else if (currentForm === 'whole') {
        console.log('💎 Crystal: Reform detected - hiding sphere');
        setSphereVisible(false);
      }
      
      lastCrystalForm.current = currentForm;
    }
  }, [animationData?.crystalForm]);

  // Main animation loop
  useFrame(() => {
    if (!animationData || !facetRefs.current.length) return;

    const time = clock.getElapsedTime();

    // Handle whole crystal rotation and floating
    if (showWholeCrystal && wholeCrystalRef.current && animationData.crystalConfig?.shouldRotate) {
      const rotationSpeed = animationData.crystalConfig.rotationSpeed || 0.0003;
      
      wholeCrystalRef.current.rotation.y += rotationSpeed;
      wholeCrystalRef.current.rotation.x = Math.sin(time * 0.0001) * 0.015;
      wholeCrystalRef.current.rotation.z = Math.cos(time * 0.00012) * 0.008;
      
      if (animationData.state === 'hero') {
        const floatAmplitude = 0.008;
        const floatY = Math.sin(time * 0.8) * floatAmplitude;
        const floatX = Math.sin(time * 0.6) * floatAmplitude * 0.3;
        const floatZ = Math.sin(time * 0.5) * floatAmplitude * 0.2;
        
        wholeCrystalRef.current.position.set(floatX, floatY, floatZ);
      } else {
        wholeCrystalRef.current.position.set(0, 0, 0);
      }
    } else if (wholeCrystalRef.current && !animationData.crystalConfig?.shouldRotate) {
      wholeCrystalRef.current.position.set(0, 0, 0);
    }

    // Handle facet animations
    if (showFacets && animationData.crystalConfig?.positions) {
      const isReforming = animationData.crystalForm === 'whole' && showFacets;
      
      const speeds = {
        explosion: 0.04,
        reform: 0.12,
        projectFocus: 0.05,
        floating: 0.02
      };
      
      let lerpSpeed;
      if (animationData.focusedFacet) {
        lerpSpeed = speeds.projectFocus;
      } else {
        lerpSpeed = speeds.explosion;
      }
      
      let allFacetsAtCenter = true;
      
      facetRefs.current.forEach((facetRef, index) => {
        if (!facetRef || !facetRef.current) return;
        
        const facetKey = facetKeys[index];
        let targetPos = animationData.crystalConfig.positions[facetKey];
        
        if (isReforming) {
          targetPos = new THREE.Vector3(0, 0, 0);
        }
        
        if (targetPos) {
          if (isReforming) {
            const distanceToCenter = facetRef.current.position.distanceTo(new THREE.Vector3(0, 0, 0));
            const maxDistance = 2;
            const progress = Math.min(1 - (distanceToCenter / maxDistance), 1);
            const clampedProgress = Math.max(0, progress);
            
            const facetSpeed = 0.02 + (clampedProgress * clampedProgress * 0.16);
            facetRef.current.position.lerp(targetPos, facetSpeed);
            
            if (distanceToCenter > 0.8) {
              allFacetsAtCenter = false;
            }
          } else {
            facetRef.current.position.lerp(targetPos, lerpSpeed);
          }
          
          if (!isReforming && 
              animationData.focusedFacet === facetKey && 
              !animationData.isTransitioning && 
              animationData.state === 'project_focused') {
            const floatOffset = Math.sin(time * 1.2 + index) * 0.001;
            facetRef.current.position.y += floatOffset;
          }
        }
      });
      
      if (isReforming && allFacetsAtCenter && !showWholeCrystal) {
        console.log('💎 Reform complete - swapping to whole crystal');
        setShowFacets(false);
        setShowWholeCrystal(true);
      }
    }
  });

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

      {/* Enhanced Glowing Sphere */}
      {sphereVisible && (
        <GlowingSphereImage
          imagePath="/assets/textures/glowing-sphere06-noise.jpg"
          blendingMode={BLENDING_MODES.ADDITIVE}
          enableDithering={true}
          enableAntialiasing={true}
          textureFiltering="enhanced"
          baseSize={0.2}
          maxScale={4.5}
          explosionDuration={0.05}
          fadeInDuration={0.02}
          position={[0, 0, 0]}
          visible={sphereVisible}
          animationData={animationData}
          debugMode={process.env.NODE_ENV === 'development'}
        />
      )}
      
      {/* Whole Crystal */}
      {showWholeCrystal && (
        <group ref={wholeCrystalRef}>
          <primitive object={wholeCrystal.scene} />
        </group>
      )}
      
      {showFacets && facetModels.map((model, index) => {
        const facetKey = facetKeys[index];

        return (
          <primitive
            key={facetKey}
            ref={facetRefs.current[index]} 
            object={model.scene}
            position={[0, 0, 0]} // Position will be animated via useFrame
          />
        );
      })}
      
      {/* Debug visualization when enabled */}
      {showCrystalDebug && showFacets && (
        <group name="anchor-debug-system">
          {facetKeys.map((facetKey, index) => {
            const facetRef = facetRefs.current[index];
            if (!facetRef?.current) return null;
            
            const anchorName = `anchor_${facetKey}`;
            const anchor = facetRef.current.getObjectByName(anchorName);
            
            if (!anchor) return null;
            
            const worldPos = new THREE.Vector3();
            anchor.getWorldPosition(worldPos);
            
            const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
            const color = colors[index % colors.length];
            
            return (
              <group key={`anchor-debug-${facetKey}`} position={worldPos}>
                <mesh renderOrder={9999}>
                  <sphereGeometry args={[0.08, 16, 16]} />
                  <meshBasicMaterial 
                    color={color} 
                    depthTest={false}
                    depthWrite={false}
                    transparent={true}
                    opacity={0.8}
                  />
                </mesh>
                
                <Html
                  position={[0, 0.25, 0]}
                  center
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.9)',
                    color: color,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    border: `2px solid ${color}`,
                    textAlign: 'center'
                  }}>
                    🎯 {facetKey.toUpperCase()}
                    <br />
                    <span style={{ fontSize: '10px', opacity: 0.8 }}>
                      [{worldPos.x.toFixed(2)}, {worldPos.y.toFixed(2)}, {worldPos.z.toFixed(2)}]
                    </span>
                  </div>
                </Html>
              </group>
            );
          })}
        </group>
      )}
    </group>
  );
});

// Set display name for debugging
UnifiedCrystalScene.displayName = 'UnifiedCrystalScene';

export default UnifiedCrystalScene;