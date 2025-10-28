// FIXED: src/components/three/UnifiedCrystalScene.jsx
// Fixed facet color conflicts between hover and scroll focus

import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import FractureBurstParticles from './FractureBurstParticles'

// Import existing material manager
import MaterialManager from './MaterialManager'

// Import enhanced sphere component
import GlowingSphereImage, { BLENDING_MODES } from './GlowingSphereImage'
import FractureRingImage from './FractureRingImage'
import { getProjectColorByFacetKey } from '../../data/projects'
import FacetLabels from './FacetLabels'
import projects from '../../data/projects'
import { effects } from '../../crystalConfig'
import { useFacetOverlayGeometry } from '../../hooks/useFacetOverlayGeometry'

const PROJECT_DISPLAY_SLOT = 'ProjectDisplay'

const UnifiedCrystalScene = forwardRef(({ 
  animationData,
  config,
  materialVariant = 'default',
  performanceProfile = { useNormalMaps: true, textureQuality: 'high', pbrQuality: 'high', usePBR: true },
  simplifiedAnimations = false,
  scrollToProgress,
  onFractureStart
}, ref) => {
  // Component refs for crystal animation
  const crystalGroupRef = useRef();
  const wholeCrystalRef = useRef();
  const facetRefs = useRef([]);
  const facetsGroupRef = useRef();
  const crystalMaterialRef = useRef();

  // Sphere state
  const [sphereVisible, setSphereVisible] = useState(false);
  const [ringVisible, setRingVisible] = useState(false);
  const [burstId, setBurstId] = useState(0);
  
  // Crystal state tracking
  const [showWholeCrystal, setShowWholeCrystal] = useState(true);
  const [showFacets, setShowFacets] = useState(false);
  const lastCrystalForm = useRef('whole');

  // Track rotation at fracture start so we can slerp back to neutral
  const fractureStartQuatRef = useRef(new THREE.Quaternion());
  const neutralQuat = useMemo(() => new THREE.Quaternion(), []);
  const origin = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  
  // Debug panel state
  const [showCrystalDebug, setShowCrystalDebug] = useState(false);
  
  // FIXED: Better hover state tracking
  const [, setHoveredFacet] = useState(null);
  const hoveredFacetRef = useRef(null);

  // Track material updates so we can reapply when ready
  const [materialVersion, setMaterialVersion] = useState(0);

  // FIXED: Better tracking of focus changes
  const prevFocusedFacetRef = useRef(null);
  const prevMaterialVersionRef = useRef(materialVersion);
  const prevOverlaysReadyRef = useRef(false);
  const focusUpdateTimeoutRef = useRef();

  // Facet configuration
  const facetKeys = useMemo(
    () => ['empathy', 'narrative', 'craft', 'system', 'leadership', 'exploration'],
    []
  );

  // Individual facet materials and colors
  const facetMaterialsRef = useRef([]);
  const activeFacetRef = useRef(null);
  const defaultColorRef = useRef(new THREE.Color('#ffffff'));
  const projectColors = useMemo(
    () => facetKeys.map(key => new THREE.Color(getProjectColorByFacetKey(key))),
    [facetKeys]
  );

  // Precompute random floating parameters for facets
  const floatParamsRef = useRef(
    facetKeys.map(() => ({
      amp: effects.idle.float.baseAmplitude * (0.8 + Math.random() * 0.4),
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      phaseZ: Math.random() * Math.PI * 2
    }))
  );

  // Track explosion timing so we can implement fracture pause
  const explosionStartRef = useRef(null);
  const fractureGlowStartRef = useRef(null);

  const triggerFractureGlow = useCallback(() => {
    const delay = config?.fracture?.emissive?.delay ?? 0;
    fractureGlowStartRef.current = performance.now() + delay * 1000;
    facetMaterialsRef.current.forEach((mat) => {
      // Start from no glow and fade in during the fracture pause
      mat.emissive.set(0, 0, 0);
      mat.emissiveIntensity = 0;
      mat.userData = { ...(mat.userData || {}), isFading: true };
      mat.needsUpdate = true;
    });
    onFractureStart?.();
  }, [config, onFractureStart]);

  // Track when GLTF models have loaded
  const [modelsLoaded, setModelsLoaded] = useState(false);
  // Store precomputed anchor offsets for label placement
  const [anchorOffsets, setAnchorOffsets] = useState({});

  const handleMaterialReady = useCallback(() => {
    setMaterialVersion(v => v + 1);
  }, []);

  const {
    isReady: overlaysReady,
    registerOverlaySlot,
    setOverlayVisibility,
    updateOverlays,
    cleanup: cleanupOverlays,
    overlaySlots
  } = useFacetOverlayGeometry(facetKeys);

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
        setRingVisible(true);
        lastCrystalForm.current = 'exploded';
      },
      forceShowWhole: () => {
        if (import.meta.env.DEV) {
          console.log('🔄 Debug: Force showing whole crystal');
        }
        setShowFacets(false);
        setShowWholeCrystal(true);
        setSphereVisible(false);
        setRingVisible(false);
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
      },
      inspectAnchors: () => {
        if (import.meta.env.DEV) {
          console.group('🔍 Anchor Check');
          facetModels.forEach((model, index) => {
            const facetKey = facetKeys[index];
            const anchorName = `anchor_${facetKey}`;
            const anchor = model?.scene?.getObjectByName(anchorName);
            if (anchor) {
              const pos = anchor.position.toArray().map(n => Number(n.toFixed(3)));
              console.log(`${anchorName} exists at`, pos);
            } else {
              console.warn(`${anchorName} missing`);
            }
          });
          console.groupEnd();
        }
      },
      verifyExplodedPositions: () => {
        if (import.meta.env.DEV) {
          console.group('📐 Verifying exploded facet positions');
          facetRefs.current.forEach((facetRef, index) => {
            const facetKey = facetKeys[index];
            const expected = animationData?.crystalConfig?.explodedPositions?.[facetKey];
            if (!facetRef?.current || !expected) {
              console.warn(`Facet ${facetKey}: missing ref or expected position`);
              return;
            }
            const expectedVec = new THREE.Vector3().fromArray(expected);
            const actual = facetRef.current.position.clone();
            const delta = actual.clone().sub(expectedVec);
            const distance = delta.length();
            if (distance > 0.01) {
              console.warn(
                `❌ ${facetKey} discrepancy: expected [${expectedVec.x.toFixed(3)}, ${expectedVec.y.toFixed(3)}, ${expectedVec.z.toFixed(3)}], actual [${actual.x.toFixed(3)}, ${actual.y.toFixed(3)}, ${actual.z.toFixed(3)}], delta ${distance.toFixed(3)}`
              );
            } else {
              console.log(`✅ ${facetKey} position verified`);
            }
          });
          console.groupEnd();
        }
      }
    }
  }), [facetKeys, showWholeCrystal, showFacets, sphereVisible, showCrystalDebug, modelsLoaded, animationData]);

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

  // Compute anchor world position using matrix transforms
  const computeAnchorWorldPosition = useCallback(
    (facetKey, finalQuaternion = null, finalScale = null) => {
      const index = facetKeys.indexOf(facetKey);
      if (index === -1) return null;

      const model = facetModels[index];
      const exploded = animationData?.crystalConfig?.explodedPositions?.[facetKey];
      if (!model?.scene || !exploded) return null;

      const anchor = model.scene.getObjectByName(`anchor_${facetKey}`);
      if (!anchor) return null;

      // Ensure we have an up-to-date matrixWorld
      model.scene.updateMatrixWorld(true);

      const position = new THREE.Vector3().fromArray(exploded);
      const quaternion = finalQuaternion
        ? (Array.isArray(finalQuaternion)
            ? new THREE.Quaternion().fromArray(finalQuaternion)
            : finalQuaternion)
        : model.scene.quaternion;
      const scale = finalScale
        ? (Array.isArray(finalScale)
            ? new THREE.Vector3().fromArray(finalScale)
            : finalScale)
        : model.scene.scale;

      const matrixWorld = new THREE.Matrix4();
      matrixWorld.compose(position, quaternion, scale);

      return anchor.position.clone().applyMatrix4(matrixWorld);
    },
    [facetKeys, facetModels, animationData?.crystalConfig?.explodedPositions]
  );

  // Calculate anchor offsets relative to facet centers once models are ready
  useEffect(() => {
    if (!modelsLoaded) return;
    const offsets = {};
    facetKeys.forEach((facetKey, index) => {
      const model = facetModels[index];
      if (!model?.scene) return;
      const anchor = model.scene.getObjectByName(`anchor_${facetKey}`);
      if (anchor) {
        anchor.updateMatrixWorld(true);
        const worldAnchor = new THREE.Vector3();
        anchor.getWorldPosition(worldAnchor);
        const worldFacet = new THREE.Vector3();
        model.scene.getWorldPosition(worldFacet);
        const offset = worldAnchor.sub(worldFacet);
        offsets[facetKey] = offset.toArray();

        const rotation = animationData?.crystalConfig?.explodedRotations?.[facetKey];
        const worldPos = computeAnchorWorldPosition(facetKey, rotation);
        const exploded = animationData?.crystalConfig?.explodedPositions?.[facetKey];
        if (worldPos && exploded && import.meta.env.DEV) {
          const rotQuat = rotation
            ? new THREE.Quaternion().fromArray(rotation)
            : model.scene.quaternion;
          const manualWorld = new THREE.Vector3()
            .fromArray(exploded)
            .add(offset.clone().applyQuaternion(rotQuat));
          const diff = worldPos.clone().sub(manualWorld);
          const distance = diff.length();
          if (distance > 0.001) {
            console.warn(`❌ Anchor mismatch for ${facetKey}`, {
              viaMatrix: worldPos.toArray(),
              manual: manualWorld.toArray(),
              delta: diff.toArray()
            });
          } else {
            console.log(`✅ Anchor match for ${facetKey}`, worldPos.toArray());
          }
        }
      }
    });
    setAnchorOffsets(offsets);
  }, [modelsLoaded, facetKeys, facetModels, computeAnchorWorldPosition, animationData?.crystalConfig?.explodedPositions]);

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
      if (!mat || mat.userData?.isFading) return;

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
    const updateOverlaySlotBase = (slot, baseMaterial) => {
      if (!slot || !baseMaterial) return;

      slot.originalMaterial = baseMaterial;
      slot.originalOpacity = baseMaterial.opacity ?? 1;
      slot.originalTransparent = baseMaterial.transparent ?? false;
      slot.originalMap = baseMaterial.map || null;
      slot.originalMapTransform = baseMaterial.map
        ? {
            offset: baseMaterial.map.offset.clone(),
            repeat: baseMaterial.map.repeat.clone(),
            rotation: baseMaterial.map.rotation ?? 0,
            center: baseMaterial.map.center
              ? baseMaterial.map.center.clone()
              : new THREE.Vector2(0.5, 0.5),
          }
        : null;
    };

    const applyMaterial = (modelScene, material, facetKey = null) => {
      if (!modelScene) return;
      modelScene.traverse((child) => {
        if (!child.isMesh || child.userData?.isOverlay) {
          return;
        }

        const existingMaterials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        const overlaySlot =
          facetKey && overlaySlots?.get
            ? overlaySlots.get(facetKey) ?? null
            : null;
        const overlayTargetsChild =
          overlaySlot && overlaySlot.mesh === child ? overlaySlot : null;

        const projectDisplayIndex = existingMaterials.findIndex((mat) => {
          const slotName = mat?.name || mat?.userData?.slotId || null;
          return slotName === PROJECT_DISPLAY_SLOT;
        });

        if (!child.userData.__originalMaterialInfo) {
          child.userData.__originalMaterialInfo = {
            isArray: Array.isArray(child.material),
            slots: existingMaterials.map((mat, index) => ({
              index,
              name: mat?.name || null,
              slotId: mat?.userData?.slotId || null,
            })),
            projectDisplayIndex: projectDisplayIndex !== -1 ? projectDisplayIndex : null,
          };
        } else if (
          child.userData.__originalMaterialInfo.projectDisplayIndex == null &&
          projectDisplayIndex !== -1
        ) {
          child.userData.__originalMaterialInfo.projectDisplayIndex = projectDisplayIndex;
        }

        if (overlayTargetsChild) {
          updateOverlaySlotBase(overlayTargetsChild, material);
        }

        if (existingMaterials.length > 1) {
          const materialCount = existingMaterials.length;
          const updatedMaterials = new Array(materialCount).fill(material);

          if (
            overlayTargetsChild &&
            overlayTargetsChild.isActive &&
            overlayTargetsChild.materialIndex != null &&
            overlayTargetsChild.materialIndex < materialCount
          ) {
            updatedMaterials[overlayTargetsChild.materialIndex] =
              overlayTargetsChild.overlayMaterial;
          }

          child.material = updatedMaterials;
        } else {
          child.material =
            overlayTargetsChild && overlayTargetsChild.isActive
              ? overlayTargetsChild.overlayMaterial
              : material;
        }

        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            if (mat && typeof mat === 'object') {
              mat.needsUpdate = true;
            }
          });
        } else if (child.material && typeof child.material === 'object') {
          child.material.needsUpdate = true;
        }

        child.castShadow = false;
        child.receiveShadow = false;

        if (import.meta.env.DEV) {
          console.log(`💡 Disabled shadows for crystal mesh: ${child.name}`);
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
        isFading: mat.userData?.isFading || false,
        targetColor: mat.color.clone(),
        startColor: mat.color.clone(),
        progress: 1,
        baseEmissiveIntensity:
          mat.userData?.baseEmissiveIntensity ?? mat.emissiveIntensity,
        baseEmissiveColor:
          mat.userData?.baseEmissiveColor?.clone?.() || mat.emissive.clone()
      };

      const model = facetModels[idx];
      applyMaterial(model.scene, mat, facetKeys[idx]);
      return mat;
    });

    // If fracture glow is active, apply current fade state to new materials
    if (fractureGlowStartRef.current) {
      const elapsedGlow = (performance.now() - fractureGlowStartRef.current) / 1000;
      const rawDuration = animationData?.crystalConfig?.explodeDuration || 1.2;
      const fracturePause = animationData?.crystalConfig?.fracturePause || 0.5;
      const totalDuration = rawDuration > 10 ? rawDuration / 1000 : rawDuration;
      const explosionDuration = Math.max(totalDuration - fracturePause, 0);
      const fadeOutDuration = explosionDuration * 2;
      const elapsedExplosion = elapsedGlow - fracturePause;
      const rampDuration = explosionDuration * 0.15;
      const totalFadeDuration = explosionDuration + fadeOutDuration;

      facetMaterialsRef.current.forEach((mat, idx) => {
        const baseIntensity = mat.userData?.baseEmissiveIntensity ?? 0.02;
        const startIntensity = (config?.fracture?.emissive?.intensity ?? 2.0) * 0.15;
        const baseColor = mat.userData?.baseEmissiveColor || defaultColorRef.current;
        const startColor = projectColors[idx];

        if (elapsedExplosion < 0) {
          mat.emissive.set(0, 0, 0);
          mat.emissiveIntensity = 0;
          mat.userData.isFading = true;
        } else if (elapsedExplosion < rampDuration) {
          const t = Math.min(elapsedExplosion / rampDuration, 1);
          mat.emissive.copy(startColor).multiplyScalar(t);
          mat.emissiveIntensity = THREE.MathUtils.lerp(0, startIntensity, t);
          mat.userData.isFading = true;
        } else {
          const fadeElapsed = elapsedExplosion - rampDuration;
          const t = Math.min(fadeElapsed / (totalFadeDuration - rampDuration), 1);
          const ease = 1 - Math.pow(1 - t, 3);
          mat.emissive.copy(startColor).lerp(baseColor, ease);
          mat.emissiveIntensity = THREE.MathUtils.lerp(startIntensity, baseIntensity, ease);
          mat.userData.isFading = t < 1;
        }
        mat.needsUpdate = true;
      });
    }

  }, [
    wholeCrystal,
    facetModels,
    materialVersion,
    facetKeys,
    projectColors,
    animationData?.focusedFacet,
    animationData?.crystalConfig?.fracturePause,
    animationData?.crystalConfig?.explodeDuration,
    config?.effects?.fracture?.initialGlow
  ]);

  useEffect(() => {
    if (!overlaysReady || !modelsLoaded || !showFacets) return;

    const allFacetsReady =
      facetRefs.current.length === facetKeys.length &&
      facetRefs.current.every((ref) => ref?.current);

    if (!allFacetsReady) {
      return;
    }

    facetRefs.current.forEach((facetRef, index) => {
      const facetKey = facetKeys[index];
      if (facetRef?.current) {
        const overlaySlot = registerOverlaySlot(facetRef, facetKey);
        if (overlaySlot) {
          console.log(`📄 Registered overlay slot for ${facetKey}`);
        }
      }
    });

    const currentFocus = animationData?.focusedFacet;
    if (currentFocus) {
      setOverlayVisibility(currentFocus, true);
    }

    return () => {
      overlaySlots.forEach((slot) => {
        if (!slot?.mesh) return;

        if (slot.isActive) {
          const materials = Array.isArray(slot.mesh.material)
            ? slot.mesh.material
            : [slot.mesh.material];
          const index = slot.materialIndex ?? 0;

          if (materials[index] === slot.overlayMaterial) {
            if (slot.materialIndex != null) {
              const updated = materials.slice();
              updated[index] = slot.originalMaterial;
              slot.mesh.material = updated;
            } else {
              slot.mesh.material = slot.originalMaterial;
            }
          }
        }

        slot.targetOpacity = 0;
        slot.currentOpacity = 0;
        slot.isActive = false;
        if (slot.overlayMaterial) {
          slot.overlayMaterial.opacity = 0;
        }
      });
    };
  }, [
    overlaysReady,
    modelsLoaded,
    showFacets,
    registerOverlaySlot,
    overlaySlots,
    facetKeys,
    materialVersion,
    animationData?.focusedFacet
  ]);

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

    const previousFacet = prevFocusedFacetRef.current;
    const overlaysJustBecameReady = overlaysReady && !prevOverlaysReadyRef.current;

    if (
      !overlaysJustBecameReady &&
      currentFacet === previousFacet &&
      materialVersion === prevMaterialVersionRef.current
    ) {
      if (import.meta.env.DEV) {
        console.log('🎨 Skipping focus effect - no change');
      }
      prevOverlaysReadyRef.current = overlaysReady;
      return;
    }

    prevFocusedFacetRef.current = currentFacet;
    prevMaterialVersionRef.current = materialVersion;
    prevOverlaysReadyRef.current = overlaysReady;

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

        if (mat.userData?.isFading) return;

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

    if (overlaysReady) {
      const focusChanged = currentFacet !== previousFacet;

      if (focusChanged) {
        facetKeys.forEach((key) => {
          const shouldShow = currentFacet != null && key === currentFacet;
          setOverlayVisibility(key, shouldShow);
        });

        if (currentFacet) {
          console.log(`📄 Showing overlay for ${currentFacet}`);
        }
      } else if (currentFacet) {
        setOverlayVisibility(currentFacet, true);
      }
    }

    return () => clearTimeout(focusUpdateTimeoutRef.current);
  }, [
    animationData?.focusedFacet,
    materialVersion,
    facetKeys,
    projectColors,
    overlaysReady,
    setOverlayVisibility
  ]);
  
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
          setRingVisible(true);
          explosionStartRef.current = performance.now();
          setBurstId(id => id + 1);

          // Capture hero rotation so facets start from same orientation
          if (wholeCrystalRef.current && facetsGroupRef.current) {
            fractureStartQuatRef.current.copy(wholeCrystalRef.current.quaternion);
            facetsGroupRef.current.quaternion.copy(wholeCrystalRef.current.quaternion);
          }

          // Snap facets immediately to fracture positions (small initial offset)
          const fractureDistance = animationData?.crystalConfig?.fractureDistance ?? 0.3;
          const fracture = animationData?.crystalConfig?.fracturePositions;
          if (fracture || fractureDistance) {
            facetRefs.current.forEach((facetRef, idx) => {
              const facetKey = facetKeys[idx];
              const explodedPos = animationData?.crystalConfig?.positions?.[facetKey];
              const configuredFracture = fracture?.[facetKey];
              if (facetRef?.current && explodedPos) {
                const fallback = explodedPos
                  .clone()
                  .normalize()
                  .multiplyScalar(explodedPos.length() * fractureDistance);
                const fracturePos = configuredFracture ? configuredFracture.clone() : fallback;
                facetRef.current.position.copy(fracturePos);

                console.log(`💥 ${facetKey} fracture:`, fracturePos.toArray());
              }
            });
          }

          // Trigger bright emissive glow for each facet
          triggerFractureGlow();
        } else {
          // In simplified mode keep the whole crystal visible
          setShowWholeCrystal(true);
          setShowFacets(false);
          setSphereVisible(false);
          setRingVisible(false);
        }

      } else if (currentForm === 'whole') {
        if (import.meta.env.DEV) {
          console.log('💎 Crystal: Reform detected - hiding sphere');
        }
        setSphereVisible(false);
        setRingVisible(false);
        if (simplifiedAnimations) {
          setShowWholeCrystal(true);
          setShowFacets(false);
        }
        explosionStartRef.current = null;
        if (facetsGroupRef.current) {
          facetsGroupRef.current.quaternion.copy(neutralQuat);
        }
      }

    }

    lastCrystalForm.current = currentForm;
  }, [animationData?.crystalForm, triggerFractureGlow]);

  // Main animation loop
  useFrame((state, deltaTime) => {
    if (!animationData || !facetRefs.current.length || simplifiedAnimations) return;

    // Fade emissive glow timed with explosion
    if (fractureGlowStartRef.current && facetMaterialsRef.current.length) {
      const elapsedGlow = (performance.now() - fractureGlowStartRef.current) / 1000;
      const rawDuration = animationData?.crystalConfig?.explodeDuration || 1.2;
      const fracturePause = animationData?.crystalConfig?.fracturePause || 0.5;
      const totalDuration = rawDuration > 10 ? rawDuration / 1000 : rawDuration;
      const explosionDuration = Math.max(totalDuration - fracturePause, 0);
      const fadeOutDuration = explosionDuration * 2;
      const elapsedExplosion = elapsedGlow - fracturePause;
      const rampDuration = explosionDuration * 0.15;
      const totalFadeDuration = explosionDuration + fadeOutDuration;

      facetMaterialsRef.current.forEach((mat, idx) => {
        const baseIntensity = mat.userData?.baseEmissiveIntensity ?? 0.02;
        const startIntensity = (config?.effects?.fracture?.initialGlow ?? 2.0) * 0.15;
        const baseColor = mat.userData?.baseEmissiveColor || defaultColorRef.current;
        const startColor = projectColors[idx];

        if (elapsedExplosion < 0) {
          mat.emissive.set(0, 0, 0);
          mat.emissiveIntensity = 0;
          mat.userData.isFading = true;
        } else if (elapsedExplosion < rampDuration) {
          const t = Math.min(elapsedExplosion / rampDuration, 1);
          mat.emissive.copy(startColor).multiplyScalar(t);
          mat.emissiveIntensity = THREE.MathUtils.lerp(0, startIntensity, t);
          mat.userData.isFading = true;
        } else {
          const fadeElapsed = elapsedExplosion - rampDuration;
          const t = Math.min(fadeElapsed / (totalFadeDuration - rampDuration), 1);
          const ease = 1 - Math.pow(1 - t, 3); // Soft ease out
          mat.emissive.copy(startColor).lerp(baseColor, ease);
          mat.emissiveIntensity = THREE.MathUtils.lerp(startIntensity, baseIntensity, ease);
          mat.userData.isFading = t < 1;
        }

        mat.needsUpdate = true;
      });

      if (elapsedExplosion >= totalFadeDuration) {
        fractureGlowStartRef.current = null;
        facetMaterialsRef.current.forEach(mat => {
          if (mat.userData) mat.userData.isFading = false;
        });
      }
    }

    // Hold facets at fracture positions before the explosion resumes
    if (animationData.crystalForm === 'exploded' && explosionStartRef.current) {
      const fracturePause = animationData.crystalConfig?.fracturePause || 0.5;
      const elapsedExplosion = (performance.now() - explosionStartRef.current) / 1000;
      if (elapsedExplosion < fracturePause) {
        const fracture = animationData.crystalConfig?.fracturePositions;
        const fractureDistance = animationData.crystalConfig?.fractureDistance ?? 0.3;
        facetRefs.current.forEach((facetRef, idx) => {
          const facetKey = facetKeys[idx];
          const explodedPos = animationData.crystalConfig.positions[facetKey];
          const configured = fracture?.[facetKey];
          if (facetRef?.current && explodedPos) {
            const fallback = explodedPos
              .clone()
              .normalize()
              .multiplyScalar(explodedPos.length() * fractureDistance);
            facetRef.current.position.copy(configured ? configured : fallback);
          }
        });
        return; // Skip other animations during fracture pause
      }
    }

    const elapsed = state.clock.elapsedTime;
    const floatConfig = effects.idle.float;
    const floatAll = animationData.state === 'overview' && !animationData.isTransitioning;
    const floatFocused =
      animationData.state === 'project_focused' &&
      animationData.focusedFacet &&
      !animationData.isTransitioning;

    // Handle whole crystal floating (no rotation)
    if (showWholeCrystal && wholeCrystalRef.current) {
      // Keep crystal oriented at neutral rotation
      wholeCrystalRef.current.rotation.set(0, 0, 0);

      if (animationData.state === 'hero') {
        const floatAmplitude = 0.008;
        const floatY = Math.sin(elapsed * 0.8) * floatAmplitude;
        const floatX = Math.sin(elapsed * 0.6) * floatAmplitude * 0.3;
        const floatZ = Math.sin(elapsed * 0.5) * floatAmplitude * 0.2;

        wholeCrystalRef.current.position.set(floatX, floatY, floatZ);
      } else {
        wholeCrystalRef.current.position.set(0, 0, 0);
      }
    }

    // Handle facet animations
    if (showFacets && animationData.crystalConfig?.positions) {
      // Custom fracture/explosion timing
      if (animationData.crystalForm === 'exploded' && explosionStartRef.current) {
        const fracturePause = animationData.crystalConfig.fracturePause || 0.5;
        const totalDuration = animationData.crystalConfig.explodeDuration || 1.2;
        const elapsedExplosion = (performance.now() - explosionStartRef.current) / 1000;

        const progress = Math.min((elapsedExplosion - fracturePause) / (totalDuration - fracturePause), 1);
        const fracture = animationData.crystalConfig.fracturePositions;
        const fractureDistance = animationData.crystalConfig.fractureDistance ?? 0.3;
        const eased = animationData.crystalConfig.explosionEase
          ? animationData.crystalConfig.explosionEase(progress)
          : progress;

        if (facetsGroupRef.current) {
          facetsGroupRef.current.quaternion.slerpQuaternions(
            fractureStartQuatRef.current,
            neutralQuat,
            eased
          );
        }

        facetRefs.current.forEach((facetRef, index) => {
          if (!facetRef || !facetRef.current) return;

          const facetKey = facetKeys[index];
          const end = animationData.crystalConfig.positions[facetKey];
          const start = fracture?.[facetKey] ||
            end?.clone().normalize().multiplyScalar(end.length() * fractureDistance);
          if (start && end) {
            const interpolated = start.clone().lerp(end, eased);
            facetRef.current.position.copy(interpolated);
          }
        });

        if (progress >= 1) {
          explosionStartRef.current = null; // Animation finished
        }
        return;
      }

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
          targetPos = origin;
        }

        if (targetPos) {
          if (isReforming) {
            const distanceToCenter = facetRef.current.position.length();
            const maxDistance = 3;
            const progress = Math.min(1 - (distanceToCenter / maxDistance), 1);
            const clampedProgress = Math.max(0, progress);

            const facetSpeed = 0.02 + (clampedProgress * clampedProgress * 0.16);
            facetRef.current.position.lerp(targetPos, facetSpeed * deltaTime * 60);

            if (distanceToCenter > 0.05) {
              allFacetsAtCenter = false;
            }
          } else {
            let finalTarget = targetPos;
            if (floatAll || (floatFocused && animationData.focusedFacet === facetKey)) {
              const params = floatParamsRef.current[index];
              const amp = params.amp * (floatAll ? floatConfig.overviewMultiplier : 1);
              const fx = Math.sin(elapsed * floatConfig.xFrequency + params.phaseX) * amp * floatConfig.xMultiplier;
              const fy = Math.sin(elapsed * floatConfig.yFrequency + params.phaseY) * amp;
              const fz = Math.sin(elapsed * floatConfig.zFrequency + params.phaseZ) * amp * floatConfig.zMultiplier;
              finalTarget = targetPos.clone().add(new THREE.Vector3(fx, fy, fz));
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
      const { targetColor, startColor, progress = 1, isFading } = mat.userData || {};
      if (isFading) return;
      if (targetColor && startColor && progress < 1) {
        const speed = 1.5; // seconds to fully transition
        mat.userData.progress = Math.min(progress + deltaTime * speed, 1);
        mat.color.lerpColors(startColor, targetColor, mat.userData.progress);
      }
    });

    if (overlaysReady) {
      updateOverlays(deltaTime);
    }
  });

  useEffect(() => {
    return () => {
      cleanupOverlays();
    };
  }, [cleanupOverlays]);

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

      {/* Fracture expanding ring */}
      <FractureRingImage
        {...config.fracture.image}
        visible={ringVisible}
        animationData={animationData}
        simplifiedAnimations={simplifiedAnimations}
        debugMode={import.meta.env.DEV}
      />

      {/* Enhanced Glowing Sphere */}
      <GlowingSphereImage
        blendingMode={BLENDING_MODES.ADDITIVE}
        enableDithering={true}
        enableAntialiasing={true}
        textureFiltering="enhanced"
        baseSize={256}
        maxScale={1280}
        explosionDuration={0.05}
        fadeInDuration={0.02}
        position={[0, 0, 0]}
        visible={sphereVisible}
        animationData={animationData}
        simplifiedAnimations={simplifiedAnimations}
        debugMode={import.meta.env.DEV}
      />

      {!simplifiedAnimations && (
        <FractureBurstParticles
          trigger={burstId}
          {...config.fracture.particles}
        />
      )}

      {/* Whole Crystal */}
      {showWholeCrystal && (
        <group ref={wholeCrystalRef}>
          <primitive object={wholeCrystal.scene} />
        </group>
      )}
      
      {showFacets && !simplifiedAnimations && (
        <group ref={facetsGroupRef}>
          {facetModels.map((model, index) => {
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
        </group>
      )}

      <FacetLabels
        projects={projects}
        scrollToProgress={scrollToProgress}
        onHoverChange={handleLabelHover}
        animationData={animationData}
        performanceProfile={performanceProfile}
        anchorOffsets={anchorOffsets}
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