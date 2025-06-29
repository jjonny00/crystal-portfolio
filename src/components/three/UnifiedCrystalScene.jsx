// UPDATED: src/components/three/UnifiedCrystalScene.jsx
// Pass facet refs to camera controller for anchor targeting

import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'

// Import existing material manager
import MaterialManager from './MaterialManager'

// Import enhanced sphere component
import GlowingSphereImage, { BLENDING_MODES } from './GlowingSphereImage'

/**
 * UPDATED: Crystal Scene that passes facet refs to camera controller
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
    }
  }), [facetKeys]);

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
          setShowCrystalDebug(prev => !prev);
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

  // NEW: Debug anchor positions when facets are loaded
  useEffect(() => {
    if (showCrystalDebug && facetRefs.current.length > 0) {
      facetKeys.forEach((facetKey, index) => {
        const facetRef = facetRefs.current[index];
        if (facetRef && facetRef.current) {
          const anchorName = `anchor_${facetKey}`;
          const anchor = facetRef.current.getObjectByName(anchorName);
          
          if (anchor) {
            const worldPos = new THREE.Vector3();
            anchor.getWorldPosition(worldPos);
            console.log(`🎯 Anchor found: ${anchorName}`, worldPos.toArray());
          } else {
            console.warn(`⚠️ Anchor not found: ${anchorName}`);
            // List all available objects for debugging
            const availableNames = [];
            facetRef.current.traverse((child) => {
              if (child.name) availableNames.push(child.name);
            });
            console.log(`Available objects in ${facetKey}:`, availableNames);
          }
        }
      });
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
      
      {/* UPDATED: Individual Facets with refs properly assigned */}
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
      
      {/* DEBUG: Anchor visual markers - only when debug enabled */}
      {showCrystalDebug && showFacets && facetKeys.map((facetKey, index) => {
        const facetRef = facetRefs.current[index];
        if (!facetRef?.current) return null;
        
        const anchor = facetRef.current.getObjectByName(`anchor_${facetKey}`);
        if (!anchor) return null;
        
        const worldPos = new THREE.Vector3();
        anchor.getWorldPosition(worldPos);
        
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        
        return (
          <mesh key={`marker-${facetKey}`} position={worldPos} renderOrder={999}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color={colors[index]} depthTest={false} />
          </mesh>
        );
      })}
      
      {/* ENHANCED: Debug info with anchor information */}
      {showCrystalDebug && animationData && (
        <Html>
          <div style={{
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 10002,
            pointerEvents: 'none',
            maxWidth: '400px',
            border: '1px solid rgba(100, 255, 218, 0.3)'
          }}>
            <div style={{ 
              fontWeight: 'bold', 
              marginBottom: '10px',
              color: '#64ffda',
              borderBottom: '1px solid rgba(100, 255, 218, 0.3)',
              paddingBottom: '8px'
            }}>
              💎 Crystal Debug (Press 'C' to toggle)
            </div>
            
            {/* Crystal State */}
            <div style={{ marginBottom: '10px' }}>
              <div><strong>Crystal State:</strong></div>
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
              <div>Focused: {animationData.focusedFacet || 'none'}</div>
            </div>

            {/* NEW: Anchor Debug Info */}
            {showFacets && (
              <div style={{ 
                marginBottom: '10px',
                borderTop: '1px solid rgba(100, 255, 218, 0.3)',
                paddingTop: '8px'
              }}>
                <div style={{ color: '#64ffda', fontWeight: 'bold' }}>🎯 Anchor Status:</div>
                {facetKeys.map((facetKey, index) => {
                  const facetRef = facetRefs.current[index];
                  let anchorStatus = 'Not Checked';
                  let anchorPosition = null;
                  
                  if (facetRef && facetRef.current) {
                    const anchorName = `anchor_${facetKey}`;
                    const anchor = facetRef.current.getObjectByName(anchorName);
                    
                    if (anchor) {
                      anchorStatus = 'Found';
                      const worldPos = new THREE.Vector3();
                      anchor.getWorldPosition(worldPos);
                      anchorPosition = worldPos.toArray().map(v => v.toFixed(2));
                    } else {
                      anchorStatus = 'Missing';
                    }
                  }
                  
                  return (
                    <div key={facetKey} style={{ 
                      fontSize: '10px', 
                      color: anchorStatus === 'Found' ? '#4CAF50' : 
                             anchorStatus === 'Missing' ? '#F44336' : '#999',
                      marginBottom: '2px'
                    }}>
                      {facetKey}: {anchorStatus}
                      {anchorPosition && ` [${anchorPosition.join(', ')}]`}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sphere Debug */}
            <div style={{ 
              marginBottom: '10px',
              borderTop: '1px solid rgba(187, 134, 252, 0.3)',
              paddingTop: '8px'
            }}>
              <div style={{ color: '#bb86fc', fontWeight: 'bold' }}>🌟 Glowing Sphere:</div>
              <div style={{ 
                color: sphereVisible ? '#4CAF50' : '#666',
                fontWeight: 'bold'
              }}>
                Visible: {sphereVisible ? 'YES' : 'NO'}
              </div>
            </div>
            
            {/* Camera targeting info */}
            {animationData.cameraState === 'project' && animationData.focusedFacet && (
              <div style={{
                background: 'rgba(100, 255, 218, 0.2)',
                border: '1px solid #64ffda',
                borderRadius: '4px',
                padding: '6px',
                marginTop: '8px',
                fontSize: '10px'
              }}>
                <div style={{ color: '#64ffda', fontWeight: 'bold' }}>📹 CAMERA TARGETING</div>
                <div>Project: {animationData.focusedFacet}</div>
                <div>Expected Anchor: anchor_{animationData.focusedFacet}</div>
                <div>Using Anchor: {facetRefs.current.length > 0 ? 'Checking...' : 'No facets loaded'}</div>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
});

// Set display name for debugging
UnifiedCrystalScene.displayName = 'UnifiedCrystalScene';

export default UnifiedCrystalScene;