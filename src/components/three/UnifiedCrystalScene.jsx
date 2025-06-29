// UPDATED: src/components/three/UnifiedCrystalScene.jsx
// Complete file with enhanced anchor debugging and visualization

import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'

// Import existing material manager
import MaterialManager from './MaterialManager'

// Import enhanced sphere component
import GlowingSphereImage, { BLENDING_MODES } from './GlowingSphereImage'

/**
 * ENHANCED: Crystal Scene with comprehensive anchor debugging
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
          
          {/* Line from camera to target */}
          {animationData.cameraConfig.position && (
            <line renderOrder={9999}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    ...animationData.cameraConfig.position.toArray(),
                    ...animationData.cameraConfig.target.toArray()
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial 
                color="#ffff00" 
                depthTest={false}
                depthWrite={false}
                transparent={true}
                opacity={0.5}
              />
            </line>
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
      
      {/* ENHANCED: Debug info with comprehensive anchor information */}
      {showCrystalDebug && animationData && (
        <Html>
          <div style={{
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            background: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 10002,
            pointerEvents: 'none',
            maxWidth: '500px',
            border: '1px solid rgba(100, 255, 218, 0.3)',
            maxHeight: '60vh',
            overflowY: 'auto'
          }}>
            <div style={{ 
              fontWeight: 'bold', 
              marginBottom: '15px',
              color: '#64ffda',
              borderBottom: '1px solid rgba(100, 255, 218, 0.3)',
              paddingBottom: '10px',
              fontSize: '14px'
            }}>
              💎 Enhanced Crystal Debug (Press 'C' to toggle)
            </div>
            
            {/* Crystal State */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ color: '#bb86fc', fontWeight: 'bold', marginBottom: '5px' }}>Crystal State:</div>
              <div>State: {animationData.state}</div>
              <div>Form: {animationData.crystalForm}</div>
              <div style={{ color: showWholeCrystal ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>
                Show Whole: {showWholeCrystal ? 'YES' : 'NO'}
              </div>
              <div style={{ color: showFacets ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>
                Show Facets: {showFacets ? 'YES' : 'NO'}
              </div>
              <div>Focused: {animationData.focusedFacet || 'none'}</div>
            </div>

            {/* Anchor Debug Info */}
            {showFacets && (
              <div style={{ 
                marginBottom: '15px',
                borderTop: '1px solid rgba(100, 255, 218, 0.3)',
                paddingTop: '10px'
              }}>
                <div style={{ color: '#64ffda', fontWeight: 'bold', marginBottom: '8px' }}>🎯 Anchor Analysis:</div>
                {facetKeys.map((facetKey, index) => {
                  const facetRef = facetRefs.current[index];
                  let anchorStatus = 'Not Loaded';
                  let anchorPosition = null;
                  let facetPosition = null;
                  
                  if (facetRef && facetRef.current) {
                    facetPosition = facetRef.position.toArray().map(v => v.toFixed(2));
                    
                    const anchorName = `anchor_${facetKey}`;
                    const anchor = facetRef.current.getObjectByName(anchorName);
                    
                    if (anchor) {
                      anchorStatus = '✅ Found';
                      const worldPos = new THREE.Vector3();
                      anchor.getWorldPosition(worldPos);
                      anchorPosition = worldPos.toArray().map(v => v.toFixed(2));
                    } else {
                      anchorStatus = '❌ Missing';
                    }
                  }
                  
                  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <div key={facetKey} style={{ 
                      fontSize: '11px', 
                      marginBottom: '6px',
                      padding: '4px 8px',
                      borderLeft: `3px solid ${color}`,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{ fontWeight: 'bold', color: color }}>
                        {facetKey.toUpperCase()}: {anchorStatus}
                      </div>
                      {facetPosition && (
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>
                          Facet: [{facetPosition.join(', ')}]
                        </div>
                      )}
                      {anchorPosition && (
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>
                          Anchor: [{anchorPosition.join(', ')}]
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Camera Debug */}
            <div style={{ 
              marginBottom: '15px',
              borderTop: '1px solid rgba(187, 134, 252, 0.3)',
              paddingTop: '10px'
            }}>
              <div style={{ color: '#bb86fc', fontWeight: 'bold', marginBottom: '5px' }}>📹 Camera Info:</div>
              <div>State: {animationData.cameraState}</div>
              <div>Focused Facet: {animationData.focusedFacet || 'none'}</div>
              {animationData.cameraConfig && (
                <>
                  <div style={{ fontSize: '10px', marginTop: '5px' }}>
                    Target: [{animationData.cameraConfig.target?.x?.toFixed(2)}, {animationData.cameraConfig.target?.y?.toFixed(2)}, {animationData.cameraConfig.target?.z?.toFixed(2)}]
                  </div>
                  <div style={{ fontSize: '10px' }}>
                    Position: [{animationData.cameraConfig.position?.x?.toFixed(2)}, {animationData.cameraConfig.position?.y?.toFixed(2)}, {animationData.cameraConfig.position?.z?.toFixed(2)}]
                  </div>
                  <div style={{ fontSize: '10px' }}>
                    FOV: {animationData.cameraConfig.fov}°
                  </div>
                </>
              )}
            </div>
            
            {/* Usage Instructions */}
            <div style={{
              background: 'rgba(100, 255, 218, 0.1)',
              border: '1px solid #64ffda',
              borderRadius: '4px',
              padding: '8px',
              marginTop: '15px',
              fontSize: '10px'
            }}>
              <div style={{ color: '#64ffda', fontWeight: 'bold', marginBottom: '4px' }}>Legend:</div>
              <div>🎯 = Anchor positions</div>
              <div>📹 = Camera target</div>
              <div>Red/Green/Blue lines = X/Y/Z axes</div>
              <div>Colors distinguish different facets</div>
              <div>Wireframe boxes = Missing anchors</div>
              <div>Pulsing rings = Active anchor markers</div>
            </div>
            
            {/* Performance Info */}
            <div style={{
              background: 'rgba(255, 165, 0, 0.1)',
              border: '1px solid #ffa500',
              borderRadius: '4px',
              padding: '8px',
              marginTop: '10px',
              fontSize: '10px'
            }}>
              <div style={{ color: '#ffa500', fontWeight: 'bold', marginBottom: '4px' }}>⚡ Debug Impact:</div>
              <div>This debug mode affects performance</div>
              <div>Turn off for production testing</div>
              <div>Press 'C' to toggle this panel</div>
            </div>
          </div>
        </Html>
      )}

      {/* DIAGNOSTIC: Facet Loading Status Debug */}
      {showCrystalDebug && (
        <Html>
          <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'rgba(255, 0, 0, 0.9)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            fontSize: '11px',
            fontFamily: 'monospace',
            zIndex: 10003,
            maxWidth: '400px',
            border: '2px solid #ff0000'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#ffff00' }}>
              🔍 FACET LOADING DIAGNOSTIC
            </div>
            
            {/* Check if showFacets is true */}
            <div style={{ marginBottom: '10px' }}>
              <strong>showFacets:</strong> 
              <span style={{ color: showFacets ? '#00ff00' : '#ff0000', fontWeight: 'bold' }}>
                {showFacets ? ' TRUE' : ' FALSE'}
              </span>
              {!showFacets && <div style={{ color: '#ffff00', fontSize: '10px' }}>
                ⚠️ Facets are not being rendered! This is why refs are null.
              </div>}
            </div>
            
            {/* Check animation state */}
            <div style={{ marginBottom: '10px' }}>
              <strong>Crystal Form:</strong> {animationData?.crystalForm || 'undefined'}
              <br />
              <strong>Animation State:</strong> {animationData?.state || 'undefined'}
              <br />
              <strong>Last Crystal Form:</strong> {lastCrystalForm.current}
            </div>
            
            {/* Check facet models loading */}
            <div style={{ marginBottom: '10px' }}>
              <strong>Facet Models Loaded:</strong>
              <div style={{ marginLeft: '10px', fontSize: '10px' }}>
                {facetKeys.map((facetKey, index) => {
                  const model = facetModels[index];
                  const hasScene = model && model.scene;
                  const sceneChildren = hasScene ? model.scene.children.length : 0;
                  
                  return (
                    <div key={facetKey} style={{ 
                      color: hasScene ? '#00ff00' : '#ff0000',
                      marginBottom: '2px'
                    }}>
                      {index}: {facetKey} - {hasScene ? `✅ (${sceneChildren} children)` : '❌ No scene'}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Check facet refs array */}
            <div style={{ marginBottom: '10px' }}>
              <strong>Facet Refs Status:</strong>
              <div style={{ marginLeft: '10px', fontSize: '10px' }}>
                <div>Array Length: {facetRefs.current ? facetRefs.current.length : 'null'}</div>
                {facetRefs.current && facetRefs.current.map((ref, index) => (
                  <div key={index} style={{ 
                    color: ref ? '#00ff00' : '#ff0000',
                    marginBottom: '1px'
                  }}>
                    [{index}] {facetKeys[index]}: {ref ? '✅ Has ref' : '❌ Null ref'}
                    {ref && ref.current && (
                      <span style={{ color: '#ffff00' }}>
                        {' '}(pos: [{ref.position.x.toFixed(2)}, {ref.position.y.toFixed(2)}, {ref.position.z.toFixed(2)}])
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Force crystal explosion button for testing */}
            <div style={{ marginTop: '15px', borderTop: '1px solid #666', paddingTop: '10px' }}>
              <button 
                onClick={() => {
                  console.log('🔥 FORCE EXPLOSION TEST');
                  setShowWholeCrystal(false);
                  setShowFacets(true);
                  setSphereVisible(true);
                  lastCrystalForm.current = 'exploded';
                }}
                style={{
                  background: '#ff6600',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  marginRight: '8px'
                }}
              >
                FORCE SHOW FACETS
              </button>
              
              <button 
                onClick={() => {
                  console.log('🔄 RESET TO WHOLE');
                  setShowWholeCrystal(true);
                  setShowFacets(false);
                  setSphereVisible(false);
                  lastCrystalForm.current = 'whole';
                }}
                style={{
                  background: '#0066ff',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}
              >
                RESET TO WHOLE
              </button>
            </div>
            
            {/* Manual object inspection */}
            <div style={{ marginTop: '15px', borderTop: '1px solid #666', paddingTop: '10px' }}>
              <button 
                onClick={() => {
                  console.group('🔍 MANUAL FACET INSPECTION');
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
                      
                      // Look for anchor specifically
                      const anchor = model.scene.getObjectByName(`anchor_${facetKey}`);
                      console.log(`Anchor "anchor_${facetKey}":`, anchor);
                    }
                  });
                  console.groupEnd();
                }}
                style={{
                  background: '#9900ff',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  width: '100%'
                }}
              >
                INSPECT MODELS IN CONSOLE
              </button>
            </div>
          </div>
        </Html>
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