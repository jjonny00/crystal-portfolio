// FIXED: src/components/three/UnifiedCrystalScene.jsx
// Removed DOM-based debug panels from Three.js Canvas

import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'

// Import existing material manager
import MaterialManager from './MaterialManager'

// Import enhanced sphere component
import GlowingSphereImage, { BLENDING_MODES } from './GlowingSphereImage'

/**
 * FIXED: Crystal Scene with Three.js-compatible debug only
 */
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
  const facetRefs = useRef(Array(6).fill(null));
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

  // NEW: Expose facet refs to parent component
  useImperativeHandle(ref, () => ({
    facetRefs: facetRefs.current,
    getFacetRef: (index) => facetRefs.current[index],
    findAnchor: (facetKey) => {
      const facetIndex = facetKeys.indexOf(facetKey);
      if (facetIndex !== -1 && facetRefs.current[facetIndex]) {
        const anchorName = `anchor_${facetKey}`;
        return facetRefs.current[facetIndex].current?.getObjectByName(anchorName) || null;
      }
      return null;
    },
    // ADDED: Expose debug state and methods for external debug panels
    debugState: {
      showCrystalDebug,
      setShowCrystalDebug,
      showWholeCrystal,
      showFacets,
      sphereVisible,
      lastCrystalForm: lastCrystalForm.current
    },
    debugMethods: {
      forceShowFacets: () => {
        console.log('🔥 FORCING FACETS VISIBLE');
        setShowWholeCrystal(false);
        setShowFacets(true);
        setSphereVisible(true);
        lastCrystalForm.current = 'exploded';
      },
      forceShowWhole: () => {
        console.log('🔄 RESETTING TO WHOLE');
        setShowWholeCrystal(true);
        setShowFacets(false);
        setSphereVisible(false);
        lastCrystalForm.current = 'whole';
      },
      inspectModels: () => {
        console.group('🔍 MANUAL FACET INSPECTION');
        facetModels.forEach((model, index) => {
          const facetKey = facetKeys[index];
          console.log(`\n=== ${facetKey.toUpperCase()} MODEL ===`);
          console.log('Model:', model);
          console.log('Scene:', model.scene);
          
          if (model.scene) {
            console.log('Scene children:', model.scene.children.length);
            const objectNames = [];
            model.scene.traverse((child) => {
              if (child.name) {
                objectNames.push(`${child.name} (${child.type})`);
              }
            });
            console.log('All objects:', objectNames);
            
            // Look for anchor specifically
            const anchor = model.scene.getObjectByName(`anchor_${facetKey}`);
            console.log(`Anchor "anchor_${facetKey}":`, anchor ? 'FOUND' : 'NOT FOUND');
            if (anchor) {
              console.log('Anchor details:', {
                position: anchor.position.toArray(),
                parent: anchor.parent?.name || 'root',
                type: anchor.type
              });
            }
          }
        });
        console.groupEnd();
      }
    }
  }), [facetKeys, showCrystalDebug, showWholeCrystal, showFacets, sphereVisible]);

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

  // ENHANCED: Debug anchor positions when facets are loaded
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
            // List all available objects for debugging
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
  
  // Crystal form change detection that includes sphere visibility
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

  // Main animation loop - isolated and protected
  useFrame(() => {
    if (!animationData || !facetRefs.current.length) return;

    const time = clock.getElapsedTime();

    // Handle whole crystal rotation and floating (unchanged)
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

    // Handle facet animations (unchanged)
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
        if (!facetRef) return;
        
        const facetKey = facetKeys[index];
        let targetPos = animationData.crystalConfig.positions[facetKey];
        
        if (isReforming) {
          targetPos = new THREE.Vector3(0, 0, 0);
        }
        
        if (targetPos) {
          if (isReforming) {
            const distanceToCenter = facetRef.position.distanceTo(new THREE.Vector3(0, 0, 0));
            const maxDistance = 2;
            const progress = Math.min(1 - (distanceToCenter / maxDistance), 1);
            const clampedProgress = Math.max(0, progress);
            
            const facetSpeed = 0.02 + (clampedProgress * clampedProgress * 0.16);
            facetRef.position.lerp(targetPos, facetSpeed);
            
            if (distanceToCenter > 0.8) {
              allFacetsAtCenter = false;
            }
          } else {
            facetRef.position.lerp(targetPos, lerpSpeed);
          }
          
          if (!isReforming && 
              animationData.focusedFacet === facetKey && 
              !animationData.isTransitioning && 
              animationData.state === 'project_focused') {
            const floatOffset = Math.sin(time * 1.2 + index) * 0.001;
            facetRef.position.y += floatOffset;
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

  // Check if facet is focused
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
          onExplosionStart={() => {
            console.log('🌟 Enhanced sphere explosion started');
          }}
          onExplosionEnd={() => {
            console.log('🌟 Enhanced sphere explosion completed');
          }}
        />
      )}
      
      {/* Whole Crystal with INSTANT visibility control */}
      {showWholeCrystal && (
        <group ref={wholeCrystalRef}>
          <primitive object={wholeCrystal.scene} />
        </group>
      )}
      
      {/* Individual Facets with refs properly assigned */}
      {showFacets && facetModels.map((model, index) => {
        const facetKey = facetKeys[index];
        const isFocused = isFacetFocused(index);
        
        return (
          <group 
            key={facetKey}
            ref={el => {
              facetRefs.current[index] = el;
            }}
          >
            <primitive object={model.scene} />
          </group>
        );
      })}
      
      {/* ENHANCED DEBUG: Comprehensive anchor visualization system */}
      {showCrystalDebug && showFacets && (
        <group name="anchor-debug-system">
          {facetKeys.map((facetKey, index) => {
            const facetRef = facetRefs.current[index];
            if (!facetRef?.current) {
              console.warn(`⚠️ Facet ref ${index} (${facetKey}) is null`);
              return null;
            }
            
            const anchorName = `anchor_${facetKey}`;
            const anchor = facetRef.current.getObjectByName(anchorName);
            
            if (!anchor) {
              console.warn(`⚠️ Anchor "${anchorName}" not found in facet ${facetKey}`);
              
              // Show placeholder at facet position if anchor is missing
              return (
                <group key={`missing-anchor-${facetKey}`} position={facetRef.position}>
                  <mesh renderOrder={9999}>
                    <boxGeometry args={[0.1, 0.1, 0.1]} />
                    <meshBasicMaterial 
                      color="#ff0000"
                      wireframe={true}
                      depthTest={false}
                      depthWrite={false}
                    />
                  </mesh>
                  <Html
                    position={[0, 0.2, 0]}
                    center
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    <div style={{
                      background: 'rgba(255, 0, 0, 0.9)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      whiteSpace: 'nowrap'
                    }}>
                      MISSING ANCHOR
                      <br />
                      {facetKey.toUpperCase()}
                    </div>
                  </Html>
                </group>
              );
            }
            
            // Get FRESH world position every frame
            const worldPos = new THREE.Vector3();
            anchor.getWorldPosition(worldPos);
            
            const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
            const color = colors[index % colors.length];
            
            return (
              <group key={`anchor-debug-${facetKey}`} position={worldPos}>
                {/* Large sphere marker - guaranteed to be visible */}
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
                
                {/* Wireframe outline for extra visibility */}
                <mesh renderOrder={10000}>
                  <sphereGeometry args={[0.12, 8, 8]} />
                  <meshBasicMaterial 
                    color={color}
                    wireframe={true}
                    depthTest={false}
                    depthWrite={false}
                  />
                </mesh>
                
                {/* Glowing core */}
                <mesh renderOrder={10001}>
                  <sphereGeometry args={[0.04, 8, 8]} />
                  <meshBasicMaterial 
                    color="#ffffff"
                    emissive="#ffffff"
                    emissiveIntensity={2}
                    depthTest={false}
                    depthWrite={false}
                  />
                </mesh>
                
                {/* Pulsing outer ring */}
                <mesh renderOrder={9998}>
                  <ringGeometry args={[0.15, 0.18, 16]} />
                  <meshBasicMaterial 
                    color={color}
                    transparent={true}
                    opacity={0.3 + Math.sin(clock.getElapsedTime() * 3) * 0.2}
                    depthTest={false}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                
                {/* HTML label for identification */}
                <Html
                  position={[0, 0.25, 0]}
                  center
                  style={{
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                >
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.9)',
                    color: color,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    border: `2px solid ${color}`,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    zIndex: 10002,
                    boxShadow: `0 0 10px ${color}`,
                    animation: 'pulse 2s infinite'
                  }}>
                    🎯 {facetKey.toUpperCase()}
                    <br />
                    <span style={{ fontSize: '10px', opacity: 0.8 }}>
                      [{worldPos.x.toFixed(2)}, {worldPos.y.toFixed(2)}, {worldPos.z.toFixed(2)}]
                    </span>
                  </div>
                </Html>
                
                {/* Axis helpers for orientation */}
                <group>
                  {/* X axis - Red */}
                  <mesh renderOrder={9998}>
                    <boxGeometry args={[0.3, 0.02, 0.02]} />
                    <meshBasicMaterial color="#ff0000" depthTest={false} transparent opacity={0.7} />
                  </mesh>
                  {/* Y axis - Green */}
                  <mesh renderOrder={9998}>
                    <boxGeometry args={[0.02, 0.3, 0.02]} />
                    <meshBasicMaterial color="#00ff00" depthTest={false} transparent opacity={0.7} />
                  </mesh>
                  {/* Z axis - Blue */}
                  <mesh renderOrder={9998}>
                    <boxGeometry args={[0.02, 0.02, 0.3]} />
                    <meshBasicMaterial color="#0000ff" depthTest={false} transparent opacity={0.7} />
                  </mesh>
                </group>
              </group>
            );
          })}
        </group>
      )}

      {/* ENHANCED DEBUG: Camera target visualization */}
      {showCrystalDebug && animationData?.cameraConfig?.target && (
        <group name="camera-target-debug">
          {/* Camera target indicator */}
          <mesh position={animationData.cameraConfig.target} renderOrder={9999}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshBasicMaterial 
              color="#ffff00"
              wireframe={true}
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
          
          {/* Target center dot */}
          <mesh position={animationData.cameraConfig.target} renderOrder={10000}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial 
              color="#ffffff"
              emissive="#ffff00"
              emissiveIntensity={1}
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
          
          {/* Camera position indicator (if available) */}
          {animationData.cameraConfig.position && (
            <mesh position={animationData.cameraConfig.position} renderOrder={9999}>
              <boxGeometry args={[0.1, 0.06, 0.15]} />
              <meshBasicMaterial 
                color="#00ffff"
                wireframe={true}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
          )}
          
          {/* Camera target label */}
          <Html
            position={[
              animationData.cameraConfig.target.x,
              animationData.cameraConfig.target.y + 0.3,
              animationData.cameraConfig.target.z
            ]}
            center
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            <div style={{
              background: 'rgba(255, 255, 0, 0.9)',
              color: 'black',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              textAlign: 'center',
              whiteSpace: 'nowrap'
            }}>
              📹 CAMERA TARGET
              <br />
              <span style={{ fontSize: '10px' }}>
                State: {animationData.cameraState}
              </span>
            </div>
          </Html>
        </group>
      )}

      {/* CSS for pulsing animation */}
      <Html>
        <style>
          {`
            @keyframes pulse {
              0% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.7; transform: scale(1.05); }
              100% { opacity: 1; transform: scale(1); }
            }
          `}
        </style>
      </Html>
    </group>
  );
});

// Set display name for debugging
UnifiedCrystalScene.displayName = 'UnifiedCrystalScene';

export default UnifiedCrystalScene;