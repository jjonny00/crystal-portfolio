// FIXED: src/components/three/UnifiedCrystalScene.jsx
// Fixed facet color conflicts between hover and scroll focus

import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import { ANIMATION_CONFIG } from '../../hooks/useUnifiedAnimationController'

// Import existing material manager
import MaterialManager from './MaterialManager'

// Import enhanced sphere component
import GlowingSphereImage, { BLENDING_MODES } from './GlowingSphereImage'
import { getProjectColorByFacetKey } from '../../data/projects'
import FacetLabels from './FacetLabels'
import projects from '../../data/projects'

const UnifiedCrystalScene = forwardRef(({ 
  animationData,
  config,
  materialVariant = 'default',
  performanceProfile = { useNormalMaps: true, textureQuality: 'high', pbrQuality: 'high', usePBR: true },
  isMobile = false,
  simplifiedAnimations = false,
  scrollToProgress
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
  
  // FIXED: Better hover state tracking
  const [hoveredFacet, setHoveredFacet] = useState(null);
  const hoveredFacetRef = useRef(null);

  // Track material updates so we can reapply when ready
  const [materialVersion, setMaterialVersion] = useState(0);

  // Precomputed anchor-based label positions
  const [labelPositions, setLabelPositions] = useState({});

  // FIXED: Better tracking of focus changes
  const prevFocusedFacetRef = useRef(null);
  const prevMaterialVersionRef = useRef(materialVersion);
  const focusUpdateTimeoutRef = useRef();

  // Facet configuration
  const facetKeys = ['empathy', 'narrative', 'craft', 'system', 'leadership', 'exploration'];

  // Individual facet materials and colors
  const facetMaterialsRef = useRef([]);
  const activeFacetRef = useRef(null);
  const defaultColorRef = useRef(new THREE.Color('#ffffff'));
  const projectColors = useMemo(
    () => facetKeys.map(key => new THREE.Color(getProjectColorByFacetKey(key))),
    [facetKeys]
  );

  // Track when GLTF models have loaded
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const handleMaterialReady = useCallback(() => {
    setMaterialVersion(v => v + 1);
  }, []);

  
  useEffect(() => {
    if (facetRefs.current.length === 0) {
      facetRefs.current = facetKeys.map(() => React.createRef());
    }
  }, [facetKeys]);

  
  useImperativeHandle(ref, () => ({
    // Expose the refs array directly (this is what Fixed3DCanvas expects)
    facetRefs: facetRefs.current,

    // Loaded state for parent components
    modelsLoaded,
    
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
        if (import.meta.env.DEV) {
          console.log('🔥 Debug: Force showing facets');
        }
        setShowWholeCrystal(false);
        setShowFacets(true);
        setSphereVisible(true);
        lastCrystalForm.current = 'exploded';
      },
      forceShowWhole: () => {
        if (import.meta.env.DEV) {
          console.log('🔄 Debug: Force showing whole crystal');
        }
        setShowFacets(false);
        setShowWholeCrystal(true);
        setSphereVisible(false);
        lastCrystalForm.current = 'whole';
      },
      inspectModels: () => {
        if (import.meta.env.DEV) {
          console.group('🔍 Manual Facet Inspection');
          facetModels.forEach((model, index) => {
            const facetKey = facetKeys[index];
            if (import.meta.env.DEV) console.log(`\n=== ${facetKey.toUpperCase()} MODEL ===`);
            if (import.meta.env.DEV) console.log('Model:', model);
            if (import.meta.env.DEV) console.log('Scene:', model.scene);

            if (model.scene) {
              if (import.meta.env.DEV) console.log('Scene children:', model.scene.children.length);
              model.scene.traverse((child) => {
                if (child.name) {
                  if (import.meta.env.DEV) console.log(`  - ${child.name} (${child.type})`);
                }
              });

              const anchor = model.scene.getObjectByName(`anchor_${facetKey}`);
              if (import.meta.env.DEV) console.log(`Anchor "anchor_${facetKey}":`, anchor);
            }
          });
          if (import.meta.env.DEV) console.groupEnd();
        }
      }
    }
  }), [facetKeys, showWholeCrystal, showFacets, sphereVisible, showCrystalDebug, modelsLoaded]);

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

  // Mark models as loaded when all GLTF hooks resolve
  useEffect(() => {
    const allLoaded =
      wholeCrystal && facetModels.every((m) => m && m.scene);
    if (allLoaded) {
      setModelsLoaded(true);
    }
  }, [wholeCrystal, ...facetModels]);

  // Compute label positions from final anchor world locations
  useEffect(() => {
    if (!modelsLoaded) return;

    if (animationData?.crystalForm !== 'exploded') {
      setLabelPositions({});
      return;
    }

    const positions = {};
    facetKeys.forEach((facetKey, index) => {
      const facet = facetRefs.current[index]?.current;
      if (!facet) return;
      const anchor = facet.getObjectByName(`anchor_${facetKey}`);
      if (!anchor) return;

      // Current world position of anchor
      anchor.updateWorldMatrix(true, false);
      const worldPos = new THREE.Vector3();
      anchor.getWorldPosition(worldPos);

      // Derive base position relative to facet and add full exploded offset
      const basePos = worldPos.clone().sub(facet.position);
      const finalPos = basePos.add(ANIMATION_CONFIG.crystal.explodedPositions[facetKey]);
      positions[facetKey] = finalPos.toArray();
    });

    setLabelPositions(positions);
  }, [modelsLoaded, animationData?.crystalForm, facetKeys]);


  // FIXED: Improved handleLabelHover with better state management
  const handleLabelHover = useCallback(
    (facetKey, hovering) => {
      if (import.meta.env.DEV) {
        console.log(`🎨 Label hover: ${facetKey}, hovering: ${hovering}, currentFocus: ${animationData?.focusedFacet}`);
      }

      // Update hover state
      setHoveredFacet(hovering ? facetKey : null);
      hoveredFacetRef.current = hovering ? facetKey : null;

      const index = facetKeys.indexOf(facetKey)
      if (index === -1 || !facetMaterialsRef.current[index]) return;
      
      const mat = facetMaterialsRef.current[index];

      // FIXED: Determine target color based on priority:
      // 1. Hover state (highest priority)
      // 2. Focus state (medium priority) 
      // 3. Default (lowest priority)
      let targetColor;
      
      if (hovering) {
        // Hovering takes precedence
        targetColor = projectColors[index];
        if (import.meta.env.DEV) {
          console.log(`🎨 Setting hover color for ${facetKey}`);
        }
      } else {
        // Not hovering - check if this facet is focused or if another facet is hovered
        const currentlyFocused = animationData?.focusedFacet === facetKey;
        const anotherFacetHovered = hoveredFacetRef.current && hoveredFacetRef.current !== facetKey;
        
        if (currentlyFocused && !anotherFacetHovered) {
          // This facet is focused and no other facet is hovered
          targetColor = projectColors[index];
          if (import.meta.env.DEV) {
            console.log(`🎨 Maintaining focus color for ${facetKey}`);
          }
        } else {
          // Default color
          targetColor = defaultColorRef.current;
          if (import.meta.env.DEV) {
            console.log(`🎨 Resetting to default color for ${facetKey}`);
          }
        }
      }

      // Set up material transition
      mat.userData.startColor.copy(mat.color)
      mat.userData.targetColor.copy(targetColor)
      mat.userData.progress = 0
    },
    [facetKeys, projectColors, animationData?.focusedFacet]
  )
  
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
            if (import.meta.env.DEV) {
              console.log(`💎 Crystal Debug Panel: ${newState ? 'ON' : 'OFF'}`);
            }
            return newState;
          });
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Apply materials to the crystal and create facet-specific clones
  useEffect(() => {
    if (!crystalMaterialRef.current) return;

    // Default color for resetting facet materials
    defaultColorRef.current.copy(
      crystalMaterialRef.current.userData?.baseColor ||
      crystalMaterialRef.current.color
    );

    // Apply material to whole crystal
    const applyMaterial = (modelScene, material) => {
      if (!modelScene) return;
      modelScene.traverse((child) => {
        if (child.isMesh) {
          child.material = material;
          child.castShadow = false;
          child.receiveShadow = false;

          if (import.meta.env.DEV) {
            console.log(`💡 Disabled shadows for crystal mesh: ${child.name}`);
          }
        }
      });
    };

    applyMaterial(wholeCrystal.scene, crystalMaterialRef.current);

    // Create or update facet materials
    const hoveredKey = hoveredFacetRef.current;
    const focusedKey = animationData?.focusedFacet;
    
    facetMaterialsRef.current = facetKeys.map((key, idx) => {
      const mat = crystalMaterialRef.current.clone();

      // FIXED: Determine initial color based on current state
      let initialColor = defaultColorRef.current;
      
      if (hoveredKey === key) {
        // This facet is currently hovered
        initialColor = projectColors[idx];
      } else if (focusedKey === key && !hoveredKey) {
        // This facet is focused and no other facet is hovered
        initialColor = projectColors[idx];
      }

      mat.color.copy(initialColor);
      mat.userData = {
        ...(mat.userData || {}),
        targetColor: mat.color.clone(),
        startColor: mat.color.clone(),
        progress: 1,
        baseEmissiveIntensity: mat.emissiveIntensity
      };

      const model = facetModels[idx];
      applyMaterial(model.scene, mat);
      return mat;
    });

  }, [wholeCrystal, facetModels, materialVersion, facetKeys, projectColors, animationData?.focusedFacet]);

  // Debug anchor positions when facets are loaded
  useEffect(() => {
    if (import.meta.env.DEV && showCrystalDebug && facetRefs.current.length > 0) {
      console.group('🎯 Anchor Detection Report');
      
      facetKeys.forEach((facetKey, index) => {
        const facetRef = facetRefs.current[index];
        if (facetRef && facetRef.current) {
          const anchorName = `anchor_${facetKey}`;
          const anchor = facetRef.current.getObjectByName(anchorName);
          
          if (anchor) {
            const worldPos = new THREE.Vector3();
            anchor.getWorldPosition(worldPos);
            if (import.meta.env.DEV) console.log(`✅ ${anchorName}:`, {
              localPosition: anchor.position.toArray(),
              worldPosition: worldPos.toArray(),
              parent: anchor.parent?.name || 'root'
            });
          } else {
            if (import.meta.env.DEV) console.warn(`❌ ${anchorName}: NOT FOUND`);
            const availableNames = [];
            facetRef.current.traverse((child) => {
              if (child.name) availableNames.push(child.name);
            });
            if (import.meta.env.DEV) console.log(`Available objects in ${facetKey}:`, availableNames);
          }
        } else {
          if (import.meta.env.DEV) console.warn(`❌ Facet ref for ${facetKey} is null`);
        }
      });
      
      if (import.meta.env.DEV) console.groupEnd();
    }
    }, [showCrystalDebug, showFacets, facetKeys]);

  // Clear hovered facet only when a new facet gains focus
  useEffect(() => {
    const hoveredKey = hoveredFacetRef.current;
    const focusedKey = animationData?.focusedFacet ?? null;

    // Only clear hover when there is an active focus that differs from the hovered facet
    if (hoveredKey && focusedKey && hoveredKey !== focusedKey) {
      handleLabelHover(hoveredKey, false);
    }
  }, [animationData?.focusedFacet, handleLabelHover]);

  // FIXED: Update facet colors when focus changes, but respect hover state
  useEffect(() => {
      const currentFacet = animationData?.focusedFacet ?? null;
      const currentHovered = hoveredFacetRef.current;

    if (import.meta.env.DEV) {
      console.log('🎨 Focus change effect:', {
        currentFacet,
        currentHovered,
        prevFacet: prevFocusedFacetRef.current,
        materialVersion
      });
    }

    if (
      currentFacet === prevFocusedFacetRef.current &&
      materialVersion === prevMaterialVersionRef.current
    ) {
      if (import.meta.env.DEV) {
        console.log('🎨 Skipping focus effect - no change');
      }
      return;
    }

    prevFocusedFacetRef.current = currentFacet;
    prevMaterialVersionRef.current = materialVersion;

    // Wait until materials have been created
    if (!facetMaterialsRef.current.length) {
      if (import.meta.env.DEV) {
        console.log('🎨 Skipping focus effect - materials not ready');
      }
      return;
    }

    if (focusUpdateTimeoutRef.current) {
      clearTimeout(focusUpdateTimeoutRef.current);
    }

    focusUpdateTimeoutRef.current = setTimeout(() => {
      if (import.meta.env.DEV) {
        console.log('🎨 Applying focus changes with hover respect');
      }

      facetMaterialsRef.current.forEach((mat, idx) => {
        const key = facetKeys[idx];
        
        // FIXED: Don't change color of hovered facets - let hover take precedence
        if (currentHovered === key) {
          if (import.meta.env.DEV) {
            console.log(`🎨 Skipping ${key} - currently hovered`);
          }
          return;
        }
        
        // Determine target color for non-hovered facets
        let targetColor;
        if (currentFacet === key) {
          // This facet is focused and not hovered by another
          targetColor = projectColors[idx];
          if (import.meta.env.DEV) {
            console.log(`🎨 Setting focus color for ${key}`);
          }
        } else {
          // Default color
          targetColor = defaultColorRef.current;
          if (import.meta.env.DEV) {
            console.log(`🎨 Resetting ${key} to default`);
          }
        }
        
        mat.userData.startColor.copy(mat.color);
        mat.userData.targetColor.copy(targetColor);
        mat.userData.progress = 0;
      });

      activeFacetRef.current = currentFacet;
    }, 50);

    return () => clearTimeout(focusUpdateTimeoutRef.current);
  }, [animationData?.focusedFacet, materialVersion, facetKeys, projectColors]);
  
  // Crystal form change detection
  useEffect(() => {
    if (!animationData) return;
    
    const currentForm = animationData.crystalForm;
    const formChanged = currentForm !== lastCrystalForm.current;
    
    if (formChanged) {
      if (import.meta.env.DEV) {
        console.log('💎 Crystal: Form change detected:', {
          from: lastCrystalForm.current,
          to: currentForm
        });
      }

      if (currentForm === 'exploded') {
        if (import.meta.env.DEV) {
          console.log('💎 Crystal: Explosion - hiding whole, showing facets, showing sphere');
        }
        if (!simplifiedAnimations) {
          setShowWholeCrystal(false);
          setShowFacets(true);
          setSphereVisible(true);
        } else {
          // In simplified mode keep the whole crystal visible
          setShowWholeCrystal(true);
          setShowFacets(false);
          setSphereVisible(false);
        }

      } else if (currentForm === 'whole') {
        if (import.meta.env.DEV) {
          console.log('💎 Crystal: Reform detected - hiding sphere');
        }
        setSphereVisible(false);
        if (simplifiedAnimations) {
          setShowWholeCrystal(true);
          setShowFacets(false);
        }
      }
      
      lastCrystalForm.current = currentForm;
    }
  }, [animationData?.crystalForm]);

  // Main animation loop
  useFrame((state, deltaTime) => {
    if (!animationData || !facetRefs.current.length || simplifiedAnimations) return;

    const elapsed = state.clock.elapsedTime;

    // Handle whole crystal rotation and floating
    if (showWholeCrystal && wholeCrystalRef.current && animationData.crystalConfig?.shouldRotate) {
      const rotationSpeed = animationData.crystalConfig.rotationSpeed || 0.0003;

      wholeCrystalRef.current.rotation.y += rotationSpeed * deltaTime * 60;
      wholeCrystalRef.current.rotation.x = Math.sin(elapsed * 0.0001) * 0.015;
      wholeCrystalRef.current.rotation.z = Math.cos(elapsed * 0.00012) * 0.008;
      
      if (animationData.state === 'hero') {
        const floatAmplitude = 0.008;
        const floatY = Math.sin(elapsed * 0.8) * floatAmplitude;
        const floatX = Math.sin(elapsed * 0.6) * floatAmplitude * 0.3;
        const floatZ = Math.sin(elapsed * 0.5) * floatAmplitude * 0.2;
        
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
            facetRef.current.position.lerp(targetPos, facetSpeed * deltaTime * 60);

            if (distanceToCenter > 0.8) {
              allFacetsAtCenter = false;
            }
          } else {
            let finalTarget = targetPos;
            if (animationData.focusedFacet === facetKey &&
                !animationData.isTransitioning &&
                animationData.state === 'project_focused') {
              const floatOffset = Math.sin(elapsed * 1.2 + index) * 0.001;
              finalTarget = targetPos.clone().add(new THREE.Vector3(0, floatOffset, 0));
            }
            facetRef.current.position.lerp(finalTarget, lerpSpeed * deltaTime * 60);
          }
        }
      });
      
      if (isReforming && allFacetsAtCenter && !showWholeCrystal) {
        if (import.meta.env.DEV) {
          console.log('💎 Reform complete - swapping to whole crystal');
        }
        setShowFacets(false);
        setShowWholeCrystal(true);
      }
    }

    // Smooth color transitions for facet materials
    facetMaterialsRef.current.forEach((mat) => {
      const { targetColor, startColor, progress = 1 } = mat.userData || {};
      if (targetColor && startColor && progress < 1) {
        const speed = 1.5; // seconds to fully transition
        mat.userData.progress = Math.min(progress + deltaTime * speed, 1);
        mat.color.lerpColors(startColor, targetColor, mat.userData.progress);
      }
    });
  });

  return (
    <group ref={crystalGroupRef}>
      {/* Material Manager Component */}
      <MaterialManager
        materialVariant={materialVariant}
        config={config}
        materialRef={crystalMaterialRef}
        performanceProfile={performanceProfile}
        onMaterialReady={handleMaterialReady}
      />

      {/* Enhanced Glowing Sphere */}
      {sphereVisible && !simplifiedAnimations && (
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
          simplifiedAnimations={simplifiedAnimations}
          debugMode={import.meta.env.DEV}
        />
      )}
      
      {/* Whole Crystal */}
      {showWholeCrystal && (
        <group ref={wholeCrystalRef}>
          <primitive object={wholeCrystal.scene} />
        </group>
      )}
      
      {showFacets && !simplifiedAnimations && facetModels.map((model, index) => {
        const facetKey = facetKeys[index];

        return (
          <primitive
            key={facetKey}
            ref={facetRefs.current[index]}
            object={model.scene}
            position={[0, 0, 0]} // Position will be animated via useFrame
            pointerEvents="none"
          />
        );
      })}

      <FacetLabels
        projects={projects}
        scrollToProgress={scrollToProgress}
        onHoverChange={handleLabelHover}
        animationData={animationData}
        performanceProfile={performanceProfile}
        labelPositions={labelPositions}
      />

      {/* Debug visualization when enabled */}
      {showCrystalDebug && showFacets && !simplifiedAnimations && (
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

export default React.memo(UnifiedCrystalScene);