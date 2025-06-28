// CLEANED: src/components/three/UnifiedCrystalScene.jsx
// Removed ALL GlowingParticleCore references and debug spheres

import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'

// Import existing material manager
import MaterialManager from './MaterialManager'

// UPDATED: Only import the sphere image component (no particle core)
import GlowingSphereImage, { BLENDING_MODES } from './GlowingSphereImage'

/**
 * Crystal Scene with simple sphere image (no particle system)
 * CLEANED: All GlowingParticleCore references removed
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
  // Component refs for crystal animation (keep existing logic)
  const crystalGroupRef = useRef();
  const wholeCrystalRef = useRef();
  const facetRefs = useRef(Array(6).fill(null));
  const crystalMaterialRef = useRef();
  
  // CLEANED: Simple sphere state (no complex particle system)
  const [sphereVisible, setSphereVisible] = useState(false);
  
  // Crystal state tracking (keep existing logic intact)
  const [showWholeCrystal, setShowWholeCrystal] = useState(true);
  const [showFacets, setShowFacets] = useState(false);
  const lastCrystalForm = useRef('whole');
  
  // Debug panel state
  const [showCrystalDebug, setShowCrystalDebug] = useState(false);
  
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
        // WHOLE → EXPLODED (explosion) - crystal visibility changes + show sphere
        console.log('💎 Crystal: Explosion - hiding whole, showing facets, showing sphere');
        setShowWholeCrystal(false);
        setShowFacets(true);
        setSphereVisible(true); // Show sphere when crystal explodes
        
      } else if (currentForm === 'whole') {
        // EXPLODED → WHOLE (reform) - crystal visibility changes + hide sphere
        console.log('💎 Crystal: Reform detected - hiding sphere');
        setSphereVisible(false); // Hide sphere when crystal reforms
        // NOTE: We don't immediately show whole crystal here
        // The animation loop will handle the transition when facets reach center
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

      {/* ENHANCED: Glowing sphere with anti-banding */}
      {sphereVisible && (
        <GlowingSphereImage
          // Path to your sphere image
          imagePath="/assets/textures/glowing-sphere05-noise.png"
          
          // ANTI-BANDING: Enhanced settings to reduce banding
          blendingMode={BLENDING_MODES.ADDITIVE}
          enableDithering={true}           // Breaks up color banding
          enableAntialiasing={true}        // Smoother edges and gradients
          textureFiltering="enhanced"      // Better texture interpolation
          
          // Size settings
          baseSize={0.2}
          maxScale={4.5}
          
          // Timing that matches your crystal explosion
          explosionDuration={0.05}
          fadeInDuration={0.02}
          
          // Position at center of exploded crystal
          position={[0, 0, 0]}
          
          // Pass through animation data and visibility
          visible={sphereVisible}
          animationData={animationData}
          
          // Debug mode for development
          debugMode={process.env.NODE_ENV === 'development'}
          
          // Event handlers (optional)
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
      
      {/* Individual Facets with INSTANT visibility control */}
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
      
      {/* CLEANED: Enhanced debug info (no particle or sphere debug) */}
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
            maxWidth: '350px',
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

            {/* CLEANED: Simple sphere debug info (no complex particle system debug) */}
            <div style={{ 
              marginBottom: '10px',
              borderTop: '1px solid rgba(187, 134, 252, 0.3)',
              paddingTop: '8px'
            }}>
              <div style={{ color: '#bb86fc', fontWeight: 'bold' }}>🌟 Glowing Sphere (Image Billboard):</div>
              <div style={{ 
                color: sphereVisible ? '#4CAF50' : '#666',
                fontWeight: 'bold'
              }}>
                Visible: {sphereVisible ? 'YES' : 'NO'}
              </div>
              <div>Type: Image Billboard</div>
              <div>Always Faces Camera: YES</div>
              <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                ✅ Simple image-based implementation
              </div>
              <div style={{ fontSize: '10px', color: '#64ffda', marginTop: '4px' }}>
                Image: /assets/textures/glowing-sphere05-noise.png
              </div>
            </div>
            
            {/* ANIMATION STATUS */}
            {animationData.crystalForm === 'whole' && showFacets && (
              <div style={{
                background: '#2196F3',
                color: 'white',
                padding: '6px',
                borderRadius: '4px',
                marginTop: '8px',
                fontWeight: 'bold'
              }}>
                🔄 REFORMING: Facets → Center
              </div>
            )}
            
            {/* CLEANED: Simple sphere test control (no complex particle controls) */}
            <div style={{
              background: 'rgba(76, 175, 80, 0.2)',
              border: '1px solid #4caf50',
              borderRadius: '4px',
              padding: '6px',
              marginTop: '10px',
              fontSize: '10px'
            }}>
              <div style={{ color: '#4caf50', fontWeight: 'bold' }}>⚡ SPHERE TESTING</div>
              <div 
                style={{
                  background: '#ff6b6b',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  marginTop: '4px',
                  pointerEvents: 'auto',
                  userSelect: 'none'
                }}
                onClick={() => {
                  console.log('🧪 Manual sphere test triggered');
                  setSphereVisible(prev => !prev);
                }}
              >
                Toggle Sphere ({sphereVisible ? 'ON' : 'OFF'})
              </div>
              <div style={{ fontSize: '9px', color: '#aaa', marginTop: '4px' }}>
                Create your sphere image at the path above
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

export default UnifiedCrystalScene;