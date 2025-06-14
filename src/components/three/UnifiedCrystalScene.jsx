// FIXED: src/components/three/UnifiedCrystalScene.jsx
// Proper particle core integration that doesn't interfere with crystal animations

import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'

// Import existing material manager
import MaterialManager from './MaterialManager'

// Import the full GlowingParticleCore for proper integration
import GlowingParticleCore, { SmartGlowingParticleCore, ParticleCorePresets } from './GlowingParticleCore'

/**
 * FIXED: Crystal Scene with isolated particle core that doesn't interfere with animations
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
  
  // FIXED: Separate particle core state that doesn't interfere with crystal
  const [particleCoreState, setParticleCoreState] = useState({
    visible: false,
    explosionCount: 0,
    lastCrystalForm: 'whole'
  });
  
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
  
  // FIXED: Isolated particle core detection that doesn't interfere with crystal
  useEffect(() => {
    if (!animationData) return;
    
    const currentForm = animationData.crystalForm;
    const formChanged = currentForm !== particleCoreState.lastCrystalForm;
    
    if (formChanged) {
      console.log('💎 Particle Core: Crystal form change detected:', {
        from: particleCoreState.lastCrystalForm,
        to: currentForm
      });

      // Update particle state in isolation
      setParticleCoreState(prevState => {
        if (currentForm === 'exploded' && prevState.lastCrystalForm === 'whole') {
          console.log('🌟 Particle Core: Explosion detected - showing particles');
          return {
            visible: true,
            explosionCount: prevState.explosionCount + 1,
            lastCrystalForm: currentForm
          };
        } else if (currentForm === 'whole' && prevState.lastCrystalForm === 'exploded') {
          console.log('🌟 Particle Core: Reform detected - hiding particles');
          return {
            visible: false,
            explosionCount: prevState.explosionCount,
            lastCrystalForm: currentForm
          };
        }
        
        // Just update the form reference without changing visibility
        return {
          ...prevState,
          lastCrystalForm: currentForm
        };
      });
    }
  }, [animationData?.crystalForm, particleCoreState.lastCrystalForm]);

  // FIXED: Crystal form change detection for crystal visibility (separate from particles)
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
        // WHOLE → EXPLODED (explosion) - crystal visibility changes only
        console.log('💎 Crystal: Explosion - hiding whole, showing facets');
        setShowWholeCrystal(false);
        setShowFacets(true);
        
      } else if (currentForm === 'whole') {
        // EXPLODED → WHOLE (reform) - crystal visibility changes only
        console.log('💎 Crystal: Reform detected');
        // NOTE: We don't immediately show whole crystal here
        // The animation loop will handle the transition when facets reach center
      }
      
      lastCrystalForm.current = currentForm;
    }
  }, [animationData?.crystalForm]);

  // FIXED: Main animation loop - isolated and protected
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

      {/* FIXED: Properly isolated particle core that doesn't interfere with crystal animations */}
      {particleCoreState.visible && (
        <SmartGlowingParticleCore
          particleShape="soft-spheres"  // ← This gives you the soft edges!
          animationData={animationData}
          performanceConfig={performanceConfig}
          maxExpansion={100.0}          // How far particles spread
          expansionDuration={2.0}      // How long expansion takes (default: 1.2)
          particleCount={1500}         // More particles for fuller effect
          coreRadius={0.12}           // Larger starting radius
          expansionSpeed={1.8}
          visible={particleCoreState.visible}
          position={[0, 0, 0]}
          ignitionDuration={0.05}
          fadeDuration={0.1}
          // Event handlers to track particle lifecycle (optional)
          onExplosionStart={() => {
            if (process.env.NODE_ENV === 'development') {
              console.log('🌟 Particle explosion started');
            }
          }}
          onExplosionEnd={() => {
            if (process.env.NODE_ENV === 'development') {
              console.log('🌟 Particle explosion ended');
            }
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
      
      {/* Enhanced debug info */}
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

            {/* FIXED: Isolated Particle System Status */}
            <div style={{ 
              marginBottom: '10px',
              borderTop: '1px solid rgba(187, 134, 252, 0.3)',
              paddingTop: '8px'
            }}>
              <div style={{ color: '#bb86fc', fontWeight: 'bold' }}>🌟 Particle Core (Isolated):</div>
              <div style={{ 
                color: particleCoreState.visible ? '#4CAF50' : '#666',
                fontWeight: 'bold'
              }}>
                Visible: {particleCoreState.visible ? 'YES' : 'NO'}
              </div>
              <div>Explosions: {particleCoreState.explosionCount}</div>
              <div>Last Form: {particleCoreState.lastCrystalForm}</div>
              <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                ✅ Isolated from crystal animations
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
            
            {/* Manual Test */}
            <div style={{
              background: 'rgba(76, 175, 80, 0.2)',
              border: '1px solid #4caf50',
              borderRadius: '4px',
              padding: '6px',
              marginTop: '10px',
              fontSize: '10px'
            }}>
              <div style={{ color: '#4caf50', fontWeight: 'bold' }}>⚡ MANUAL TEST</div>
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
                  console.log('🧪 Manual particle test triggered');
                  setParticleCoreState(prev => ({
                    visible: !prev.visible,
                    explosionCount: prev.explosionCount + 1,
                    lastCrystalForm: prev.lastCrystalForm
                  }));
                }}
              >
                Toggle Particle Core ({particleCoreState.visible ? 'ON' : 'OFF'})
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

export default UnifiedCrystalScene;