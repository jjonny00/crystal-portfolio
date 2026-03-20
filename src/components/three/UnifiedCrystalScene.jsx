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
import projects, {
  facetKeys as canonicalFacetKeys,
  getProjectColorByFacetKey,
  getProjectModelKeyByFacetKey,
  getProjectPlacementKeyByFacetKey,
  getSceneFacetKeyByProjectId,
  getProjectIdByAnyKey,
  getProjectIdBySceneFacetKey,
  getFacetSlotByProjectId,
  getFacetSlotBySceneFacetKey
} from '../../data/projects'
import FacetLabels from './FacetLabels'
import HoverConnectorLine from './HoverConnectorLine'
import { effects } from '../../crystalConfig'
import { useFacetOverlayGeometry } from '../../hooks/useFacetOverlayGeometry'
import { ANIMATION_CONFIG } from '../../hooks/useUnifiedAnimationController'
import { useLayoutConfig } from '../../hooks/useLayoutConfig'
import { useHoverCapable } from '../../hooks/useHoverCapable'

const PROJECT_DISPLAY_SLOT = 'ProjectDisplay'
const FOCUS_ROTATION_PROGRESS_LEAD = 1
const ISOLATE_FOCUSED_ROTATION_FROM_POSITION = true

const UnifiedCrystalScene = forwardRef(({ 
  animationData,
  config,
  materialVariant = 'default',
  performanceProfile = { useNormalMaps: true, textureQuality: 'high', pbrQuality: 'high', usePBR: true },
  simplifiedAnimations = false,
  scrollToProgress,
  scrollToProject,
  onDirectProjectSelect,
  onFractureStart,
  projectRuntimeOverrides = null,
  sharedCameraMoveProgressRef = null
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
  const hoverSourcesRef = useRef({});

  // FIXED: Better tracking of focus changes
  const prevFocusedFacetRef = useRef(null);
  const prevMaterialVersionRef = useRef(materialVersion);
  const prevOverlaysReadyRef = useRef(false);
  const focusUpdateTimeoutRef = useRef();
  const inActiveOverview =
    animationData?.currentZone === 'overview' &&
    animationData?.crystalForm === 'exploded' &&
    animationData?.isTransitioning === false &&
    animationData?.cameraSettled === true;

  const [hoveredLabelFacetKey, setHoveredLabelFacetKey] = useState(null);
  const [domAnchorClient, setDomAnchorClient] = useState(null);
  const { layout } = useLayoutConfig();
  const hoverCapable = useHoverCapable();
  const overviewWorldAnchors = layout?.anchors?.overviewWorld;
  const layoutCamera = layout?.camera;
  const layoutProjects = layout?.projects;

  const mergedConfig = useMemo(() => {
    const nextConfig = { ...config };

    if (layoutCamera?.positions) {
      nextConfig.cameraPositions = {
        ...(nextConfig.cameraPositions || {}),
        ...layoutCamera.positions,
        projects: {
          ...(nextConfig.cameraPositions?.projects || {}),
          ...(layoutCamera.positions.projects || {}),
        },
      };
    }

    if (layoutCamera?.targets) {
      nextConfig.cameraTargets = {
        ...(nextConfig.cameraTargets || {}),
        ...layoutCamera.targets,
        projects: {
          ...(nextConfig.cameraTargets?.projects || {}),
          ...(layoutCamera.targets.projects || {}),
        },
      };
    }

    if (layoutCamera?.offsets) {
      nextConfig.cameraOffsets = {
        ...(nextConfig.cameraOffsets || {}),
        ...layoutCamera.offsets,
        global: {
          ...(nextConfig.cameraOffsets?.global || {}),
          ...(layoutCamera.offsets.global || {}),
        },
        zones: {
          ...(nextConfig.cameraOffsets?.zones || {}),
          ...(layoutCamera.offsets.zones || {}),
        },
        projects: {
          ...(nextConfig.cameraOffsets?.projects || {}),
          ...(layoutCamera.offsets.projects || {}),
        },
      };
    }

    if (layoutProjects?.explodedPositions) {
      nextConfig.explodedPositions = {
        ...Object.fromEntries(
          Object.entries(layoutProjects.explodedPositions).map(([key, value]) => [key, value.toArray()]),
        ),
        ...(nextConfig.explodedPositions || {}),
        ...(projectRuntimeOverrides?.explodedPositions || {}),
      };
    } else if (projectRuntimeOverrides?.explodedPositions) {
      nextConfig.explodedPositions = {
        ...(nextConfig.explodedPositions || {}),
        ...projectRuntimeOverrides.explodedPositions,
      };
    }

    if (layoutProjects?.facetRotationsEulerDeg) {
      nextConfig.facetRotationsEulerDeg = {
        ...layoutProjects.facetRotationsEulerDeg,
        ...(nextConfig.facetRotationsEulerDeg || {}),
        ...(projectRuntimeOverrides?.facetRotationsEulerDeg || {}),
      };
    } else if (projectRuntimeOverrides?.facetRotationsEulerDeg) {
      nextConfig.facetRotationsEulerDeg = {
        ...(nextConfig.facetRotationsEulerDeg || {}),
        ...projectRuntimeOverrides.facetRotationsEulerDeg,
      };
    }

    if (layoutProjects?.selectedFacetRotationsEulerDeg) {
      nextConfig.selectedFacetRotationsEulerDeg = {
        ...layoutProjects.selectedFacetRotationsEulerDeg,
        ...(nextConfig.selectedFacetRotationsEulerDeg || {}),
        ...(projectRuntimeOverrides?.selectedFacetRotationsEulerDeg || {}),
      };
    } else if (projectRuntimeOverrides?.selectedFacetRotationsEulerDeg) {
      nextConfig.selectedFacetRotationsEulerDeg = {
        ...(nextConfig.selectedFacetRotationsEulerDeg || {}),
        ...projectRuntimeOverrides.selectedFacetRotationsEulerDeg,
      };
    }

    return nextConfig;
  }, [config, layoutCamera, layoutProjects, projectRuntimeOverrides]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const hero = mergedConfig?.cameraPositions?.hero;
    const overview = mergedConfig?.cameraPositions?.overview;
    console.log('📷 Effective layout camera positions', { hero, overview });
  }, [mergedConfig?.cameraPositions?.hero, mergedConfig?.cameraPositions?.overview]);

  const crystalConfig = useMemo(() => {
    const baseCrystalConfig = animationData?.crystalConfig;
    if (!baseCrystalConfig) return baseCrystalConfig;

    const nextCrystalConfig = { ...baseCrystalConfig };

    if (layoutProjects?.explodedPositions) {
      nextCrystalConfig.explodedPositions = {
        ...layoutProjects.explodedPositions,
        ...(baseCrystalConfig.explodedPositions || {}),
        ...(projectRuntimeOverrides?.explodedPositions || {}),
      };
    } else if (projectRuntimeOverrides?.explodedPositions) {
      nextCrystalConfig.explodedPositions = {
        ...(baseCrystalConfig.explodedPositions || {}),
        ...projectRuntimeOverrides.explodedPositions,
      };
    }

    if (layoutProjects?.facetRotationsEulerDeg) {
      nextCrystalConfig.facetRotationsEulerDeg = {
        ...layoutProjects.facetRotationsEulerDeg,
        ...(baseCrystalConfig.facetRotationsEulerDeg || {}),
        ...(projectRuntimeOverrides?.facetRotationsEulerDeg || {}),
      };
    } else if (projectRuntimeOverrides?.facetRotationsEulerDeg) {
      nextCrystalConfig.facetRotationsEulerDeg = {
        ...(baseCrystalConfig.facetRotationsEulerDeg || {}),
        ...projectRuntimeOverrides.facetRotationsEulerDeg,
      };
    }

    if (layoutProjects?.selectedFacetRotationsEulerDeg) {
      nextCrystalConfig.selectedFacetRotationsEulerDeg = {
        ...layoutProjects.selectedFacetRotationsEulerDeg,
        ...(baseCrystalConfig.selectedFacetRotationsEulerDeg || {}),
        ...(projectRuntimeOverrides?.selectedFacetRotationsEulerDeg || {}),
      };
    } else if (projectRuntimeOverrides?.selectedFacetRotationsEulerDeg) {
      nextCrystalConfig.selectedFacetRotationsEulerDeg = {
        ...(baseCrystalConfig.selectedFacetRotationsEulerDeg || {}),
        ...projectRuntimeOverrides.selectedFacetRotationsEulerDeg,
      };
    }

    return nextCrystalConfig;
  }, [animationData?.crystalConfig, layoutProjects, projectRuntimeOverrides]);

  // Facet configuration
  const facetKeys = canonicalFacetKeys;

  // Individual facet materials and colors
  const facetMaterialsRef = useRef([]);
  const activeFacetRef = useRef(null);
  const defaultColorRef = useRef(new THREE.Color('#ffffff'));
  const projectColors = useMemo(
    () => facetKeys.map(key => new THREE.Color(getProjectColorByFacetKey(key))),
    [facetKeys]
  );

  const facetModelKeys = useMemo(
    () => facetKeys.map((key) => getProjectModelKeyByFacetKey(key)),
    [facetKeys]
  );

  const facetPlacementKeys = useMemo(
    () => Object.fromEntries(facetKeys.map((key) => [key, getProjectPlacementKeyByFacetKey(key)])),
    [facetKeys]
  );


  const resolveSceneFacetKey = useCallback(
    (projectOrSceneKey) => {
      const projectMappedKey = getSceneFacetKeyByProjectId(projectOrSceneKey);
      const candidate = projectMappedKey || projectOrSceneKey;
      return facetKeys.includes(candidate) ? candidate : projectOrSceneKey;
    },
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
  const focusedFloatBlendRef = useRef(0);

  // Track explosion timing so we can implement fracture pause
  const explosionStartRef = useRef(null);
  const fractureGlowStartRef = useRef(null);

  const triggerFractureGlow = useCallback(() => {
    const delay = mergedConfig?.fracture?.emissive?.delay ?? 0;
    fractureGlowStartRef.current = performance.now() + delay * 1000;
    facetMaterialsRef.current.forEach((mat) => {
      // Start from no glow and fade in during the fracture pause
      mat.emissive.set(0, 0, 0);
      mat.emissiveIntensity = 0;
      mat.userData = { ...(mat.userData || {}), isFading: true };
      mat.needsUpdate = true;
    });
    onFractureStart?.();
  }, [mergedConfig, onFractureStart]);

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

  const focusedSceneFacetKey = animationData?.focusedFacet || null;
  const focusedProjectKey =
    animationData?.focusedProject
    || getProjectIdBySceneFacetKey(focusedSceneFacetKey)
    || null;

  const focusedFacetSlot =
    (focusedProjectKey && getFacetSlotByProjectId(focusedProjectKey))
    || getFacetSlotBySceneFacetKey(focusedSceneFacetKey)
    || null;

  
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
    getDebugSnapshot: () => ({
      facetKeys,
      facetModels: [],
      facetRefs: { current: facetRefs.current },
      showWholeCrystal,
      showFacets,
      sphereVisible,
      showCrystalDebug,
      lastCrystalForm: lastCrystalForm.current,
      focusedSceneFacetKey,
      focusedProjectKey,
      focusedFacetSlot,
    }),

    debugState: {
      facetKeys,
      facetModels: [], // Will be populated as needed
      facetRefs: { current: facetRefs.current },
      showWholeCrystal,
      showFacets,
      sphereVisible,
      showCrystalDebug,
      lastCrystalForm: lastCrystalForm.current,
      focusedSceneFacetKey,
      focusedProjectKey,
      focusedFacetSlot
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
            const expected = crystalConfig?.explodedPositions?.[facetPlacementKeys[facetKey] || facetKey];
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
  }), [facetKeys, showWholeCrystal, showFacets, sphereVisible, showCrystalDebug, modelsLoaded, animationData, focusedSceneFacetKey, focusedProjectKey, focusedFacetSlot]);

  // Load models
  const wholeCrystal = useGLTF(mergedConfig.assets.models.crystalWhole);
  const facetModels = facetModelKeys.map((modelKey, index) => {
    const modelUrl = mergedConfig.assets.models[modelKey];

    if (!modelUrl) {
      throw new Error(`Missing model URL for facet index ${index} (${modelKey ?? 'undefined'})`);
    }

    return useGLTF(modelUrl);
  });

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
      const exploded = crystalConfig?.explodedPositions?.[facetPlacementKeys[facetKey] || facetKey];
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
    [facetKeys, facetModels, crystalConfig?.explodedPositions, facetPlacementKeys]
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
        const localAnchor = model.scene.worldToLocal(worldAnchor.clone());
        offsets[facetKey] = localAnchor.toArray();

        const rotation = crystalConfig?.explodedRotations?.[facetPlacementKeys[facetKey] || facetKey];
        const worldPos = computeAnchorWorldPosition(facetKey, rotation);
        const exploded = crystalConfig?.explodedPositions?.[facetPlacementKeys[facetKey] || facetKey];
        if (worldPos && exploded && import.meta.env.DEV) {
          const offset = localAnchor;
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
  }, [modelsLoaded, facetKeys, facetModels, computeAnchorWorldPosition, crystalConfig?.explodedPositions, facetPlacementKeys]);

  const getAnchorAdjustedPosition = useCallback(
    (facetKey, basePosition, targetQuat) => {
      if (!basePosition || !targetQuat) return basePosition;
      const offsetArray = anchorOffsets?.[facetKey];
      if (!offsetArray) return basePosition;
      const offset = new THREE.Vector3().fromArray(offsetArray);
      const rotatedOffset = offset.clone().applyQuaternion(targetQuat);
      return basePosition.clone().add(offset).sub(rotatedOffset);
    },
    [anchorOffsets]
  );

  const eulerDegreesToQuaternion = useCallback((eulerDeg) => {
    if (!Array.isArray(eulerDeg)) return neutralQuat.clone();
    const [x = 0, y = 0, z = 0] = eulerDeg;
    return new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        THREE.MathUtils.degToRad(x),
        THREE.MathUtils.degToRad(y),
        THREE.MathUtils.degToRad(z),
        'XYZ'
      )
    );
  }, [neutralQuat]);

  const baseFacetTargetQuats = useMemo(() => Object.fromEntries(
    facetKeys.map((facetKey) => [
      facetKey,
      eulerDegreesToQuaternion(mergedConfig?.facetRotationsEulerDeg?.[facetPlacementKeys[facetKey] || facetKey])
    ])
  ), [eulerDegreesToQuaternion, facetKeys, facetPlacementKeys, mergedConfig?.facetRotationsEulerDeg]);

  const selectedFacetTargetQuats = useMemo(() => Object.fromEntries(
    facetKeys.map((facetKey) => [
      facetKey,
      eulerDegreesToQuaternion(mergedConfig?.selectedFacetRotationsEulerDeg?.[facetPlacementKeys[facetKey] || facetKey])
    ])
  ), [eulerDegreesToQuaternion, facetKeys, facetPlacementKeys, mergedConfig?.selectedFacetRotationsEulerDeg]);

  // FIXED: Improved handleLabelHover with better state management
  const applyHoverVisual = useCallback(
    (facetKey, hovering) => {
      if (import.meta.env.DEV) {
        console.log(`🎨 Label hover: ${facetKey}, hovering: ${hovering}, currentFocus: ${animationData?.focusedFacet}`);
      }

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

  const updateHoverSources = useCallback(
    (facetKey, source, hovering) => {
      if (!inActiveOverview) return;
      const currentSources = hoverSourcesRef.current[facetKey] || {
        label: false,
        facet: false,
      };
      const nextSources = {
        ...currentSources,
        [source]: hovering,
      };

      hoverSourcesRef.current = {
        ...hoverSourcesRef.current,
        [facetKey]: nextSources,
      };

      const activeFacetKey =
        Object.entries(hoverSourcesRef.current).find(
          ([, sources]) => sources?.label || sources?.facet
        )?.[0] ?? null;

      setHoveredFacet(activeFacetKey);
      hoveredFacetRef.current = activeFacetKey;
      applyHoverVisual(facetKey, nextSources.label || nextSources.facet);
    },
    [applyHoverVisual, inActiveOverview]
  );

  const handleLabelHover = useCallback(
    (facetKey, hovering) => {
      updateHoverSources(resolveSceneFacetKey(facetKey), 'label', hovering);
    },
    [updateHoverSources, resolveSceneFacetKey]
  );

  const handleDomAnchorChange = useCallback((facetKey, clientPointOrNull) => {
    if (!clientPointOrNull) {
      setHoveredLabelFacetKey(null);
      setDomAnchorClient(null);
      return;
    }

    setHoveredLabelFacetKey(resolveSceneFacetKey(facetKey));
    setDomAnchorClient(clientPointOrNull);
  }, [resolveSceneFacetKey]);


  const handleFacetHover = useCallback(
    (facetKey, hovering) => {
      updateHoverSources(resolveSceneFacetKey(facetKey), 'facet', hovering);
    },
    [updateHoverSources, resolveSceneFacetKey]
  );


  const getProjectByAnyFacetKeySafe = useCallback(
    (facetKey) => getProjectIdByAnyKey(facetKey),
    []
  );

  const handleFacetClick = useCallback(
    (facetKey) => {
      if (!inActiveOverview) return;
      const projectFacetKey = getProjectByAnyFacetKeySafe(facetKey);
      const sectionStart = scrollToProject
        ? null
        : ANIMATION_CONFIG.projectSections?.[projectFacetKey]?.start;
      if (scrollToProject) {
        onDirectProjectSelect?.(projectFacetKey);
        scrollToProject(projectFacetKey);
        return;
      }
      if (sectionStart === undefined) return;
      onDirectProjectSelect?.(projectFacetKey);
      scrollToProgress(sectionStart);
    },
    [inActiveOverview, onDirectProjectSelect, scrollToProgress, scrollToProject, getProjectByAnyFacetKeySafe]
  );

  useEffect(() => {
    if (inActiveOverview) return;
    setHoveredLabelFacetKey(null);
    setDomAnchorClient(null);
  }, [inActiveOverview]);

  
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
    const applyStoredTextureTransform = (texture, transform) => {
      if (!texture || !transform) return;

      texture.offset.copy(transform.offset);
      texture.repeat.copy(transform.repeat);
      texture.rotation = transform.rotation ?? 0;

      if (texture.center && transform.center) {
        texture.center.copy(transform.center);
      }

      texture.needsUpdate = true;
    };

    const snapshotTextureTransform = (texture) => {
      if (!texture) {
        return null;
      }

      return {
        offset: texture.offset.clone(),
        repeat: texture.repeat.clone(),
        rotation: texture.rotation ?? 0,
        center: texture.center ? texture.center.clone() : new THREE.Vector2(0.5, 0.5),
      };
    };

    const cloneStoredTransform = (transform) => {
      if (!transform) {
        return null;
      }

      return {
        offset: transform.offset.clone(),
        repeat: transform.repeat.clone(),
        rotation: transform.rotation ?? 0,
        center: transform.center ? transform.center.clone() : new THREE.Vector2(0.5, 0.5),
      };
    };

    const updateOverlaySlotBase = (slot, baseMaterial, originalInfo = null) => {
      if (!slot || !baseMaterial) return;

      const storedMap = originalInfo?.projectDisplayMap || null;
      const storedTransform = originalInfo?.projectDisplayMapTransform || null;

      if (!baseMaterial.map && storedMap) {
        baseMaterial.map = storedMap;
        if (storedTransform) {
          applyStoredTextureTransform(baseMaterial.map, storedTransform);
        } else {
          baseMaterial.map.needsUpdate = true;
        }
        baseMaterial.needsUpdate = true;
      }

      const effectiveMap = baseMaterial.map || storedMap || null;

      slot.originalMaterial = baseMaterial;
      slot.originalOpacity = baseMaterial.opacity ?? 1;
      slot.originalTransparent = baseMaterial.transparent ?? false;
      slot.originalMap = effectiveMap;
      slot.originalMapTransform = baseMaterial.map
        ? snapshotTextureTransform(baseMaterial.map)
        : storedTransform
        ? cloneStoredTransform(storedTransform)
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

        const originalProjectMaterial =
          projectDisplayIndex !== -1 ? existingMaterials[projectDisplayIndex] : null;

        const projectDisplayMap = originalProjectMaterial?.map || null;
        const projectDisplayMapTransform = projectDisplayMap
          ? {
              offset: projectDisplayMap.offset.clone(),
              repeat: projectDisplayMap.repeat.clone(),
              rotation: projectDisplayMap.rotation ?? 0,
              center: projectDisplayMap.center
                ? projectDisplayMap.center.clone()
                : new THREE.Vector2(0.5, 0.5),
            }
          : null;

        if (!child.userData.__originalMaterialInfo) {
          child.userData.__originalMaterialInfo = {
            isArray: Array.isArray(child.material),
            slots: existingMaterials.map((mat, index) => ({
              index,
              name: mat?.name || null,
              slotId: mat?.userData?.slotId || null,
            })),
            projectDisplayIndex: projectDisplayIndex !== -1 ? projectDisplayIndex : null,
            projectDisplayMap,
            projectDisplayMapTransform,
          };
        } else if (
          child.userData.__originalMaterialInfo.projectDisplayIndex == null &&
          projectDisplayIndex !== -1
        ) {
          child.userData.__originalMaterialInfo.projectDisplayIndex = projectDisplayIndex;
        }

        if (
          projectDisplayMap &&
          !child.userData.__originalMaterialInfo.projectDisplayMap
        ) {
          child.userData.__originalMaterialInfo.projectDisplayMap = projectDisplayMap;
          child.userData.__originalMaterialInfo.projectDisplayMapTransform =
            projectDisplayMapTransform;
        }

        if (overlayTargetsChild) {
          const originalInfo = child.userData.__originalMaterialInfo || {};

          if (!material.map && originalInfo.projectDisplayMap) {
            material.map = originalInfo.projectDisplayMap;

            if (originalInfo.projectDisplayMapTransform) {
              const { offset, repeat, rotation, center } =
                originalInfo.projectDisplayMapTransform;

              material.map.offset.copy(offset);
              material.map.repeat.copy(repeat);
              material.map.rotation = rotation;

              if (material.map.center && center) {
                material.map.center.copy(center);
              }
            }

            material.map.needsUpdate = true;
            material.needsUpdate = true;
          }

          updateOverlaySlotBase(overlayTargetsChild, material, originalInfo);
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
    
    const previousFacetMaterials = facetMaterialsRef.current;
    facetMaterialsRef.current = facetKeys.map((key, idx) => {
      const mat = crystalMaterialRef.current.clone();
      const existingMat = previousFacetMaterials[idx];

      if (existingMat) {
        mat.color.copy(existingMat.color);

        const previousUserData = existingMat.userData ? { ...existingMat.userData } : {};
        const previousTargetColor = previousUserData.targetColor?.clone?.();
        const previousStartColor = previousUserData.startColor?.clone?.();
        const previousBaseEmissiveColor =
          previousUserData.baseEmissiveColor?.clone?.() || mat.emissive.clone();
        const previousBaseEmissiveIntensity =
          previousUserData.baseEmissiveIntensity ?? mat.emissiveIntensity;

        mat.userData = {
          ...(mat.userData || {}),
          ...previousUserData,
          targetColor: previousTargetColor || mat.color.clone(),
          startColor: previousStartColor || mat.color.clone(),
          baseEmissiveIntensity: previousBaseEmissiveIntensity,
          baseEmissiveColor: previousBaseEmissiveColor,
        };
      } else {
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
      }

      const model = facetModels[idx];
      applyMaterial(model.scene, mat, facetKeys[idx]);
      return mat;
    });

    // If fracture glow is active, apply current fade state to new materials
    if (fractureGlowStartRef.current) {
      const elapsedGlow = (performance.now() - fractureGlowStartRef.current) / 1000;
      const rawDuration = crystalConfig?.explodeDuration || 1.2;
      const fracturePause = crystalConfig?.fracturePause || 0.5;
      const totalDuration = rawDuration > 10 ? rawDuration / 1000 : rawDuration;
      const explosionDuration = Math.max(totalDuration - fracturePause, 0);
      const fadeOutDuration = explosionDuration * 2;
      const elapsedExplosion = elapsedGlow - fracturePause;
      const rampDuration = explosionDuration * 0.15;
      const totalFadeDuration = explosionDuration + fadeOutDuration;

      facetMaterialsRef.current.forEach((mat, idx) => {
        const baseIntensity = mat.userData?.baseEmissiveIntensity ?? 0.02;
        const startIntensity = (mergedConfig?.fracture?.emissive?.intensity ?? 2.0) * 0.15;
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
    crystalConfig?.fracturePause,
    crystalConfig?.explodeDuration,
    mergedConfig?.effects?.fracture?.initialGlow
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
          const fractureDistance = crystalConfig?.fractureDistance ?? 0.3;
          const fracture = crystalConfig?.fracturePositions;
          if (fracture || fractureDistance) {
            facetRefs.current.forEach((facetRef, idx) => {
              const facetKey = facetKeys[idx];
              const explodedPos = crystalConfig?.positions?.[facetPlacementKeys[facetKey] || facetKey];
              const configuredFracture = fracture?.[facetPlacementKeys[facetKey] || facetKey];
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
      const rawDuration = crystalConfig?.explodeDuration || 1.2;
      const fracturePause = crystalConfig?.fracturePause || 0.5;
      const totalDuration = rawDuration > 10 ? rawDuration / 1000 : rawDuration;
      const explosionDuration = Math.max(totalDuration - fracturePause, 0);
      const fadeOutDuration = explosionDuration * 2;
      const elapsedExplosion = elapsedGlow - fracturePause;
      const rampDuration = explosionDuration * 0.15;
      const totalFadeDuration = explosionDuration + fadeOutDuration;

      facetMaterialsRef.current.forEach((mat, idx) => {
        const baseIntensity = mat.userData?.baseEmissiveIntensity ?? 0.02;
        const startIntensity = (mergedConfig?.effects?.fracture?.initialGlow ?? 2.0) * 0.15;
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
      const fracturePause = crystalConfig?.fracturePause || 0.5;
      const elapsedExplosion = (performance.now() - explosionStartRef.current) / 1000;
      if (elapsedExplosion < fracturePause) {
        const fracture = crystalConfig?.fracturePositions;
        const fractureDistance = crystalConfig?.fractureDistance ?? 0.3;
        facetRefs.current.forEach((facetRef, idx) => {
          const facetKey = facetKeys[idx];
          const explodedPos = crystalConfig?.positions?.[facetPlacementKeys[facetKey] || facetKey];
          const configured = fracture?.[facetPlacementKeys[facetKey] || facetKey];
          if (facetRef?.current && explodedPos) {
            const fallback = explodedPos
              .clone()
              .normalize()
              .multiplyScalar(explodedPos.length() * fractureDistance);
            facetRef.current.position.copy(configured ? configured : fallback);
            facetRef.current.quaternion.slerp(neutralQuat, Math.min(1, deltaTime * 6));
          }
        });
        return; // Skip other animations during fracture pause
      }
    }

    const elapsed = state.clock.elapsedTime;
    const cameraMoveProgress = sharedCameraMoveProgressRef?.current ?? animationData?.cameraMoveProgress ?? 1;
    const floatConfig = effects.idle.float;
    const floatAll = animationData.state === 'overview' && !animationData.isTransitioning;
    const floatFocused =
      animationData.state === 'project_focused' &&
      animationData.focusedFacet &&
      !animationData.isTransitioning &&
      animationData.cameraSettled === true;
    const rotationLerp = Math.min(1, deltaTime * 6);
    focusedFloatBlendRef.current = THREE.MathUtils.lerp(
      focusedFloatBlendRef.current,
      floatFocused ? 1 : 0,
      Math.min(1, deltaTime * 8)
    );

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
    if (showFacets && crystalConfig?.positions) {
      // Custom fracture/explosion timing
      if (animationData.crystalForm === 'exploded' && explosionStartRef.current) {
        const fracturePause = crystalConfig?.fracturePause || 0.5;
        const totalDuration = crystalConfig?.explodeDuration || 1.2;
        const elapsedExplosion = (performance.now() - explosionStartRef.current) / 1000;

        const progress = Math.min((elapsedExplosion - fracturePause) / (totalDuration - fracturePause), 1);
        const fracture = crystalConfig?.fracturePositions;
        const fractureDistance = crystalConfig?.fractureDistance ?? 0.3;
        const eased = crystalConfig?.explosionEase
          ? crystalConfig?.explosionEase(progress)
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
          const end = crystalConfig?.positions?.[facetPlacementKeys[facetKey] || facetKey];
          const start = fracture?.[facetPlacementKeys[facetKey] || facetKey] ||
            end?.clone().normalize().multiplyScalar(end.length() * fractureDistance);
          if (start && end) {
            const interpolated = start.clone().lerp(end, eased);
            const targetQuat = baseFacetTargetQuats[facetKey] || neutralQuat;
            const adjusted = animationData?.crystalForm === 'exploded'
              ? getAnchorAdjustedPosition(facetKey, interpolated, targetQuat)
              : interpolated;
            facetRef.current.position.copy(adjusted);
            facetRef.current.quaternion.slerpQuaternions(neutralQuat, targetQuat, eased);
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
        let targetPos = crystalConfig?.positions?.[facetPlacementKeys[facetKey] || facetKey];

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
              const amp = params.amp * (
                floatAll
                  ? floatConfig.overviewMultiplier
                  : focusedFloatBlendRef.current
              );
              const fx = Math.sin(elapsed * floatConfig.xFrequency + params.phaseX) * amp * floatConfig.xMultiplier;
              const fy = Math.sin(elapsed * floatConfig.yFrequency + params.phaseY) * amp;
              const fz = Math.sin(elapsed * floatConfig.zFrequency + params.phaseZ) * amp * floatConfig.zMultiplier;
              finalTarget = targetPos.clone().add(new THREE.Vector3(fx, fy, fz));
            }
            const baseQuat = baseFacetTargetQuats[facetKey] || neutralQuat;
            const selectedQuat = selectedFacetTargetQuats[facetKey] || baseQuat;
            const focusRotationProgress = THREE.MathUtils.clamp(
              cameraMoveProgress / FOCUS_ROTATION_PROGRESS_LEAD,
              0,
              1
            );
            const focusQuat = baseQuat.clone().slerp(selectedQuat, focusRotationProgress);
            const targetQuat = animationData?.crystalForm === 'exploded'
              ? (animationData?.focusedFacet === facetKey ? focusQuat : baseQuat)
              : neutralQuat;
            const useIsolatedFocusTransform =
              ISOLATE_FOCUSED_ROTATION_FROM_POSITION &&
              animationData?.focusedFacet === facetKey &&
              animationData?.cameraState === 'project';
            const targetPosition = useIsolatedFocusTransform
              ? finalTarget
              : (animationData?.crystalForm === 'exploded'
                  ? getAnchorAdjustedPosition(facetKey, finalTarget, targetQuat)
                  : finalTarget);

            if (animationData?.focusedFacet === facetKey && animationData?.cameraState === 'project') {
              facetRef.current.position.copy(targetPosition);
            } else {
              facetRef.current.position.lerp(targetPosition, lerpSpeed * deltaTime * 60);
            }
          }
        }

        const baseQuat = baseFacetTargetQuats[facetKey] || neutralQuat;
        const selectedQuat = selectedFacetTargetQuats[facetKey] || baseQuat;
        const focusRotationProgress = THREE.MathUtils.clamp(
          cameraMoveProgress / FOCUS_ROTATION_PROGRESS_LEAD,
          0,
          1
        );
        const focusQuat = baseQuat.clone().slerp(selectedQuat, focusRotationProgress);
        const targetQuat = animationData?.crystalForm === 'exploded'
          ? (animationData?.focusedFacet === facetKey ? focusQuat : baseQuat)
          : neutralQuat;

        if (animationData?.focusedFacet === facetKey && animationData?.cameraState === 'project') {
          facetRef.current.quaternion.copy(targetQuat);
        } else {
          facetRef.current.quaternion.slerp(targetQuat, rotationLerp);
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
        const nextProgress = Math.min(progress + deltaTime * speed, 1);
        const easedProgress = 1 - Math.pow(1 - nextProgress, 3);
        mat.userData.progress = nextProgress;
        mat.color.lerpColors(startColor, targetColor, easedProgress);
        mat.needsUpdate = true;
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
        config={mergedConfig}
        materialRef={crystalMaterialRef}
        performanceProfile={performanceProfile}
        onMaterialReady={handleMaterialReady}
      />

      {/* Fracture expanding ring */}
      <FractureRingImage
        {...mergedConfig.fracture.image}
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
          {...mergedConfig.fracture.particles}
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
                onPointerEnter={(event) => {
                  event.stopPropagation();
                  handleFacetHover(facetKey, true);
                }}
                onPointerLeave={(event) => {
                  event.stopPropagation();
                  handleFacetHover(facetKey, false);
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  handleFacetClick(facetKey);
                }}
              />
            );
          })}
        </group>
      )}

      <FacetLabels
        projects={projects}
        scrollToProgress={scrollToProgress}
        scrollToProject={scrollToProject}
        onDirectProjectSelect={onDirectProjectSelect}
        onHoverChange={handleLabelHover}
        animationData={animationData}
        performanceProfile={performanceProfile}
        anchorOffsets={anchorOffsets}
        onDomAnchorChange={handleDomAnchorChange}
      />

      <HoverConnectorLine
        enabled={inActiveOverview && hoverCapable}
        hoveredFacetKey={hoveredLabelFacetKey}
        domAnchorClient={domAnchorClient}
        overviewWorldAnchors={overviewWorldAnchors}
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
