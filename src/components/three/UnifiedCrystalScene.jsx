// FIXED: src/components/three/UnifiedCrystalScene.jsx
// Fixed facet color conflicts between hover and scroll focus

import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Html, useCursor } from '@react-three/drei'
import * as THREE from 'three'
import FractureBurstParticles from './FractureBurstParticles'

// Import existing material manager
import MaterialManager from './MaterialManager'

// Import enhanced sphere component
import GlowingSphereImage, { BLEND_STYLES } from './GlowingSphereImage'
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
import OverviewConnectorLines from './OverviewConnectorLines'
import { effects } from '../../crystalConfig'
import { useFacetOverlayGeometry } from '../../hooks/useFacetOverlayGeometry'
import { ANIMATION_CONFIG, HERO_TO_OVERVIEW_PHASES, canAdvanceTransitionPhase } from '../../hooks/useUnifiedAnimationController'
import { useLayoutConfig } from '../../hooks/useLayoutConfig'
import { useHoverCapable } from '../../hooks/useHoverCapable'
import { createLogger } from '../../utils/logger'

const PROJECT_DISPLAY_SLOT = 'ProjectDisplay'
const FOCUS_ROTATION_PROGRESS_LEAD = 1
const ISOLATE_FOCUSED_ROTATION_FROM_POSITION = true
const FORWARD_PRE_SWAP_WINDOW_MS = 120
const FORWARD_MASK_GLOW_DURATION_S = 0.22
const FORWARD_MASK_GLOW_PEAK_INTENSITY = 1.2
const REFORM_PRE_SWAP_WINDOW_MS = 110
const REFORM_MASK_GLOW_DURATION_S = 0.2
const REFORM_MASK_GLOW_PEAK_INTENSITY = 1.5
const REFORM_FACET_MASK_GLOW_PEAK_INTENSITY = 1.3
const REFORM_SWAP_OVERLAP_MS = 100
const ENABLE_OVERVIEW_ALL_CONNECTORS = true

const logger = createLogger('unified-crystal-scene');

const UnifiedCrystalScene = forwardRef(({ 
  animationData,
  config,
  materialVariant = 'default',
  performanceProfile = { useNormalMaps: true, textureQuality: 'high', pbrQuality: 'high', usePBR: true },
  isMobile = false,
  simplifiedAnimations = false,
  scrollToProgress,
  scrollToProject,
  onDirectProjectSelect,
  onFractureStart,
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
  const [fractureLeakBurstId, setFractureLeakBurstId] = useState(0);
  
  // Crystal state tracking
  const [showWholeCrystal, setShowWholeCrystal] = useState(true);
  const [showFacets, setShowFacets] = useState(false);
  const lastCrystalForm = useRef('whole');

  // Track rotation at fracture start so we can slerp back to neutral
  const fractureStartQuatRef = useRef(new THREE.Quaternion());
  const neutralQuat = useMemo(() => new THREE.Quaternion(), []);
  const origin = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const swapMaskGlowColor = useMemo(() => new THREE.Color('#66cfff'), []);
  
  // Debug panel state
  const [showCrystalDebug, setShowCrystalDebug] = useState(false);
  
  // FIXED: Better hover state tracking
  const [hoveredFacet, setHoveredFacet] = useState(null);
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
    animationData?.isTransitioning === false;
  const cameraSettled = animationData?.cameraSettled === true;
  const cameraMoveProgress = sharedCameraMoveProgressRef?.current ?? animationData?.cameraMoveProgress ?? 1;
  const hoverInteractionReady =
    animationData?.currentZone === 'overview' &&
    animationData?.crystalForm === 'exploded' &&
    (animationData?.isTransitioning === false || cameraSettled || cameraMoveProgress >= 0.995);

  const [alwaysOnDomAnchorsByRuntimeKey, setAlwaysOnDomAnchorsByRuntimeKey] = useState({});
  const [labelsReady, setLabelsReady] = useState(false);
  const [facetsSettled, setFacetsSettled] = useState(false);
  const facetsSettledRef = useRef(false);
  const { layout } = useLayoutConfig();
  const hoverCapable = useHoverCapable();
  useCursor(Boolean(hoverCapable && hoveredFacet));
  const overviewWorldAnchors = layout?.anchors?.overviewWorld;
  const resolvedConnectorPairs = useMemo(() => {
    const pairs = projects
      .map((project) => {
        const runtimeDomKey = project.facetKey || project.id;
        const sceneWorldKey = getSceneFacetKeyByProjectId(runtimeDomKey);
        if (!runtimeDomKey || !sceneWorldKey) return null;
        return { runtimeDomKey, sceneWorldKey };
      })
      .filter(Boolean);

    return pairs;
  }, []);

  const mergedConfig = config;

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const hero = mergedConfig?.cameraPositions?.hero;
    const overview = mergedConfig?.cameraPositions?.overview;
    logger.debug('📷 Effective layout camera positions', { hero, overview });
  }, [mergedConfig?.cameraPositions?.hero, mergedConfig?.cameraPositions?.overview]);

  const crystalConfig = animationData?.crystalConfig;

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
  const fractureChargeStartRef = useRef(null);
  const fractureChargeActiveRef = useRef(false);
  const fractureChargePhaseRef = useRef(0);
  const fractureChargeHandoffLoggedRef = useRef(false);
  const visualOwnerSamplesRef = useRef({ impulseStart: false, impulseMid: false, slowdownStart: false, handoffStart: false });

  // Track explosion timing so we can implement fracture pause
  const explosionStartRef = useRef(null);
  const fractureGlowStartRef = useRef(null);
  const pendingExplodeSwapAtRef = useRef(null);
  const pendingReformSwapAtRef = useRef(null);
  const pendingFacetHideAtRef = useRef(null);
  const swapMaskGlowStartRef = useRef(null);
  const swapMaskGlowModeRef = useRef(null);
  const reformProgressGlowRef = useRef(0);
  const wholeCrystalBaseEmissiveIntensityRef = useRef(0);
  const wholeCrystalBaseEmissiveColorRef = useRef(new THREE.Color('#000000'));

  const triggerSwapMaskGlow = useCallback((mode = 'forward') => {
    swapMaskGlowModeRef.current = mode;
    swapMaskGlowStartRef.current = performance.now();
  }, []);

  const resetWholeCrystalMaskGlow = useCallback(() => {
    const mat = crystalMaterialRef.current;
    if (!mat) return;
    mat.emissive.copy(wholeCrystalBaseEmissiveColorRef.current);
    mat.emissiveIntensity = wholeCrystalBaseEmissiveIntensityRef.current;
    mat.needsUpdate = true;
  }, []);

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


  const getFractureTargetPosition = useCallback((facetKey) => {
    const placementKey = facetPlacementKeys[facetKey] || facetKey;
    const explodedPos = crystalConfig?.positions?.[placementKey];
    if (!explodedPos) return null;
    const fractureDistance = crystalConfig?.fractureDistance ?? 0.3;
    const fracture = crystalConfig?.fracturePositions;
    const configuredFracture = fracture?.[placementKey];
    const fallback = explodedPos
      .clone()
      .normalize()
      .multiplyScalar(explodedPos.length() * fractureDistance);
    return configuredFracture ? configuredFracture.clone() : fallback;
  }, [crystalConfig, facetPlacementKeys]);

  const runExplodeSwap = useCallback(() => {
    fractureChargeActiveRef.current = false;
    fractureChargeStartRef.current = null;
    fractureChargePhaseRef.current = 0;
    visualOwnerSamplesRef.current = { impulseStart: false, impulseMid: false, slowdownStart: false, handoffStart: false };

    // Capture hero rotation so facets start from same orientation
    if (wholeCrystalRef.current && facetsGroupRef.current) {
      fractureStartQuatRef.current.copy(wholeCrystalRef.current.quaternion);
      facetsGroupRef.current.quaternion.copy(wholeCrystalRef.current.quaternion);
    }

    // Snap facets to the fracture start pose before making facets visible
    const phaseDebugEnabled =
      (typeof globalThis !== 'undefined' && globalThis.__CRYSTAL_DEBUG_TRANSITION_PHASES__ === true)
      || (typeof window !== 'undefined' && window.__CRYSTAL_DEBUG_TRANSITION_PHASES__ === true);

    facetRefs.current.forEach((facetRef, idx) => {
      const facetKey = facetKeys[idx];
      const fracturePos = getFractureTargetPosition(facetKey);
      if (facetRef?.current && fracturePos) {
        facetRef.current.position.copy(fracturePos);
        facetRef.current.rotation.set(0, 0, 0);
        if (idx === 0 && phaseDebugEnabled) {
          console.log('[transition-phase-debug] runExplodeSwap facet0', {
            position: facetRef.current.position.toArray(),
            rotation: [facetRef.current.rotation.x, facetRef.current.rotation.y, facetRef.current.rotation.z]
          });
        }
        logger.debug(`💥 ${facetKey} fracture:`, fracturePos.toArray());
      }
    });

    setShowFacets(true);
    setShowWholeCrystal(false);
    setSphereVisible(true);
    setRingVisible(true);
    explosionStartRef.current = performance.now() - FORWARD_PRE_SWAP_WINDOW_MS;
    setBurstId(id => id + 1 + Math.max(0, Math.round((crystalConfig?.heroToOverviewExplosionSettings?.explosionParticleBurstStrength ?? 1) - 1)));

    triggerFractureGlow();
    if (
      (typeof globalThis !== 'undefined' && globalThis.__CRYSTAL_DEBUG_TRANSITION_PHASES__ === true)
      || (typeof window !== 'undefined' && window.__CRYSTAL_DEBUG_TRANSITION_PHASES__ === true)
    ) {
      console.log('[transition-phase-debug] runExplodeSwap reached');
    }
    animationData?.setTransitionPhase?.(HERO_TO_OVERVIEW_PHASES.EXPLOSION_IMPULSE, {
      reason: 'run-explode-swap'
    });
  }, [animationData, facetKeys, getFractureTargetPosition, triggerFractureGlow]);

  const runReformSwap = useCallback(() => {
    pendingReformSwapAtRef.current = null;
    setShowWholeCrystal(true);
    pendingFacetHideAtRef.current = performance.now() + REFORM_SWAP_OVERLAP_MS;
  }, []);

  const applyReformFacetMaskGlow = useCallback((strength) => {
    if (!facetMaterialsRef.current.length) return;
    const clampedStrength = THREE.MathUtils.clamp(strength, 0, 1);
    facetMaterialsRef.current.forEach((facetMat) => {
      const baseFacetColor = facetMat.userData?.baseEmissiveColor || defaultColorRef.current;
      const baseFacetIntensity = facetMat.userData?.baseEmissiveIntensity ?? 0.02;
      facetMat.emissive.copy(baseFacetColor).lerp(swapMaskGlowColor, clampedStrength * 0.9);
      facetMat.emissiveIntensity = THREE.MathUtils.lerp(
        baseFacetIntensity,
        REFORM_FACET_MASK_GLOW_PEAK_INTENSITY,
        clampedStrength
      );
      facetMat.needsUpdate = true;
    });

    // Also apply to the live rendered facet mesh materials (including any non-standard assignments)
    facetRefs.current.forEach((facetRef) => {
      const root = facetRef?.current;
      if (!root) return;
      root.traverse((child) => {
        if (!child?.isMesh || !child.material) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (!mat || typeof mat !== 'object' || !mat.emissive) return;
          if (!mat.userData) mat.userData = {};
          if (!mat.userData.__reformMaskBaseEmissiveColor) {
            mat.userData.__reformMaskBaseEmissiveColor = mat.emissive.clone();
          }
          if (mat.userData.__reformMaskBaseEmissiveIntensity == null) {
            mat.userData.__reformMaskBaseEmissiveIntensity = mat.emissiveIntensity ?? 0;
          }
          const baseColor = mat.userData.__reformMaskBaseEmissiveColor;
          const baseIntensity = mat.userData.__reformMaskBaseEmissiveIntensity;
          mat.emissive.copy(baseColor).lerp(swapMaskGlowColor, clampedStrength * 0.9);
          mat.emissiveIntensity = THREE.MathUtils.lerp(
            baseIntensity,
            REFORM_FACET_MASK_GLOW_PEAK_INTENSITY,
            clampedStrength
          );
          mat.needsUpdate = true;
        });
      });
    });
  }, [swapMaskGlowColor]);

  const resetRenderedFacetMaskGlow = useCallback(() => {
    facetRefs.current.forEach((facetRef) => {
      const root = facetRef?.current;
      if (!root) return;
      root.traverse((child) => {
        if (!child?.isMesh || !child.material) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (!mat || typeof mat !== 'object' || !mat.emissive || !mat.userData) return;
          const baseColor = mat.userData.__reformMaskBaseEmissiveColor;
          const baseIntensity = mat.userData.__reformMaskBaseEmissiveIntensity;
          if (!baseColor || baseIntensity == null) return;
          mat.emissive.copy(baseColor);
          mat.emissiveIntensity = baseIntensity;
          mat.needsUpdate = true;
          delete mat.userData.__reformMaskBaseEmissiveColor;
          delete mat.userData.__reformMaskBaseEmissiveIntensity;
        });
      });
    });
  }, []);

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
  const hideFacetMeshesDuringReformOverlap =
    animationData?.crystalForm === 'whole'
    && showWholeCrystal
    && pendingFacetHideAtRef.current != null;
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
          logger.debug('🔥 Debug: Force showing facets');
        }
        setShowWholeCrystal(false);
        setShowFacets(true);
        setSphereVisible(true);
        setRingVisible(true);
        lastCrystalForm.current = 'exploded';
      },
      forceShowWhole: () => {
        if (import.meta.env.DEV) {
          logger.debug('🔄 Debug: Force showing whole crystal');
        }
        setShowFacets(false);
        setShowWholeCrystal(true);
        setSphereVisible(false);
        setRingVisible(false);
        lastCrystalForm.current = 'whole';
      },
      inspectModels: () => {
        if (import.meta.env.DEV) {
          logger.debug('🔍 Manual Facet Inspection');
          facetModels.forEach((model, index) => {
            const facetKey = facetKeys[index];
            if (import.meta.env.DEV) logger.debug(`\n=== ${facetKey.toUpperCase()} MODEL ===`);
            if (import.meta.env.DEV) logger.debug('Model:', model);
            if (import.meta.env.DEV) logger.debug('Scene:', model.scene);

            if (model.scene) {
              if (import.meta.env.DEV) logger.debug('Scene children:', model.scene.children.length);
              model.scene.traverse((child) => {
                if (child.name) {
                  if (import.meta.env.DEV) logger.debug(`  - ${child.name} (${child.type})`);
                }
              });

              const anchor = model.scene.getObjectByName(`anchor_${facetKey}`);
              if (import.meta.env.DEV) logger.debug(`Anchor "anchor_${facetKey}":`, anchor);
            }
          });
        }
      },
      inspectAnchors: () => {
        if (import.meta.env.DEV) {
          logger.debug('🔍 Anchor Check');
          facetModels.forEach((model, index) => {
            const facetKey = facetKeys[index];
            const anchorName = `anchor_${facetKey}`;
            const anchor = model?.scene?.getObjectByName(anchorName);
            if (anchor) {
              const pos = anchor.position.toArray().map(n => Number(n.toFixed(3)));
              logger.debug(`${anchorName} exists at`, pos);
            } else {
              console.warn(`${anchorName} missing`);
            }
          });
          
        }
      },
      verifyExplodedPositions: () => {
        if (import.meta.env.DEV) {
          logger.debug('📐 Verifying exploded facet positions');
  
        const phaseDebugEnabled =
          (typeof globalThis !== 'undefined' && globalThis.__CRYSTAL_DEBUG_TRANSITION_PHASES__ === true)
          || (typeof window !== 'undefined' && window.__CRYSTAL_DEBUG_TRANSITION_PHASES__ === true);
        const firstFacetBefore = facetRefs.current[0]?.current?.position?.clone?.() || null;

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
              logger.debug(`✅ ${facetKey} position verified`);
            }
          });
          
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
            logger.debug(`✅ Anchor match for ${facetKey}`, worldPos.toArray());
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

  const caseStudyFacetTargetQuats = useMemo(() => {
    const deviceKey = isMobile ? 'mobile' : 'desktop';
    return Object.fromEntries(
      facetKeys.map((facetKey) => {
        const sceneKey = facetPlacementKeys[facetKey] || facetKey;
        const projectId = getProjectIdBySceneFacetKey(sceneKey);
        const caseStudyRotation = mergedConfig?.projectCameraSettings?.[projectId]?.[deviceKey]?.caseStudy?.facetRotation;
        return [facetKey, eulerDegreesToQuaternion(caseStudyRotation)];
      })
    );
  }, [eulerDegreesToQuaternion, facetKeys, facetPlacementKeys, isMobile, mergedConfig?.projectCameraSettings]);

  useEffect(() => {
    if (!import.meta.env.DEV || animationData?.cameraState !== 'caseStudy') return;
    const deviceKey = isMobile ? 'mobile' : 'desktop';
    logger.debug('🔄 [CaseStudy FacetRotation Resolve]', {
      deviceKey,
      entries: facetKeys.map((facetKey) => {
        const sceneKey = facetPlacementKeys[facetKey] || facetKey;
        const projectId = getProjectIdBySceneFacetKey(sceneKey);
        return {
          projectId,
          caseStudyFacetRotation: mergedConfig?.projectCameraSettings?.[projectId]?.[deviceKey]?.caseStudy?.facetRotation ?? null
        };
      })
    });
  }, [animationData?.cameraState, facetKeys, facetPlacementKeys, isMobile, mergedConfig?.projectCameraSettings]);

  // FIXED: Improved handleLabelHover with better state management
  const applyHoverVisual = useCallback(
    (facetKey, hovering) => {
      if (import.meta.env.DEV) {
        logger.debug(`🎨 Label hover: ${facetKey}, hovering: ${hovering}, currentFocus: ${animationData?.focusedFacet}`);
      }

      const index = facetKeys.indexOf(facetKey)
      if (index === -1 || !facetMaterialsRef.current[index]) return;
      
      const mat = facetMaterialsRef.current[index];
      if (!mat) return;

      // FIXED: Determine target color based on priority:
      // 1. Hover state (highest priority)
      // 2. Focus state (medium priority) 
      // 3. Default (lowest priority)
      let targetColor;
      
      if (hovering) {
        // Hovering takes precedence
        targetColor = projectColors[index];
        if (import.meta.env.DEV) {
          logger.debug(`🎨 Setting hover color for ${facetKey}`);
        }
      } else {
        // Not hovering - check if this facet is focused or if another facet is hovered
        const currentlyFocused = animationData?.focusedFacet === facetKey;
        const anotherFacetHovered = hoveredFacetRef.current && hoveredFacetRef.current !== facetKey;
        
        if (currentlyFocused && !anotherFacetHovered) {
          // This facet is focused and no other facet is hovered
          targetColor = projectColors[index];
          if (import.meta.env.DEV) {
            logger.debug(`🎨 Maintaining focus color for ${facetKey}`);
          }
        } else {
          // Default color
          targetColor = defaultColorRef.current;
          if (import.meta.env.DEV) {
            logger.debug(`🎨 Resetting to default color for ${facetKey}`);
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

  const syncActiveHoverFromSources = useCallback(() => {
    const activeFacetKey =
      Object.entries(hoverSourcesRef.current).find(
        ([, sources]) => sources?.label || sources?.facet
      )?.[0] ?? null;

    hoveredFacetRef.current = activeFacetKey;
    setHoveredFacet(activeFacetKey);

    facetKeys.forEach((key) => {
      const sources = hoverSourcesRef.current[key];
      applyHoverVisual(key, Boolean(sources?.label || sources?.facet));
    });
  }, [applyHoverVisual, facetKeys]);

  const updateHoverSources = useCallback(
    (facetKey, source, hovering) => {
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

      if (!hoverInteractionReady) return;
      syncActiveHoverFromSources();
    },
    [hoverInteractionReady, syncActiveHoverFromSources]
  );

  useEffect(() => {
    if (!hoverInteractionReady) return;
    syncActiveHoverFromSources();
  }, [hoverInteractionReady, syncActiveHoverFromSources]);

  const handleLabelHover = useCallback(
    (facetKey, hovering) => {
      updateHoverSources(resolveSceneFacetKey(facetKey), 'label', hovering);
    },
    [updateHoverSources, resolveSceneFacetKey]
  );

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

  const selectProjectAndNavigate = useCallback((projectKey) => {
    if (!projectKey) return;

    const sectionNode = typeof document !== 'undefined'
      ? document.getElementById(`project-${projectKey}`)
      : null;
    const scrollContainer = typeof document !== 'undefined'
      ? document.querySelector('.scroll-container')
      : null;

    if (sectionNode && scrollContainer) {
      scrollContainer.scrollTop = sectionNode.offsetTop;
      onDirectProjectSelect?.(projectKey);
      return;
    }

    if (scrollToProject) {
      scrollToProject(projectKey, 'auto');
      onDirectProjectSelect?.(projectKey);
      return;
    }

    onDirectProjectSelect?.(projectKey);
    const sectionStart = ANIMATION_CONFIG.projectSections?.[projectKey]?.start;
    if (sectionStart === undefined || sectionStart === null) return;
    scrollToProgress?.(sectionStart, 'auto');
  }, [onDirectProjectSelect, scrollToProgress, scrollToProject]);

  const handleFacetClick = useCallback((facetKey) => {
    if (!inActiveOverview) return;
    const projectFacetKey = getProjectByAnyFacetKeySafe(facetKey);
    selectProjectAndNavigate(projectFacetKey);
  }, [getProjectByAnyFacetKeySafe, inActiveOverview, selectProjectAndNavigate]);

  useEffect(() => {
    if (inActiveOverview) return;
    hoverSourcesRef.current = {};
    hoveredFacetRef.current = null;
    setHoveredFacet(null);
    setAlwaysOnDomAnchorsByRuntimeKey({});
    setLabelsReady(false);
    facetsSettledRef.current = false;
    setFacetsSettled(false);
  }, [inActiveOverview]);

  useEffect(() => {
    if (!inActiveOverview || !labelsReady || !cameraSettled) return undefined;

    const measureAllAnchors = () => {
      const nextAnchors = {};
      let domFoundCount = 0;
      let worldFoundCount = 0;

      resolvedConnectorPairs.forEach(({ runtimeDomKey, sceneWorldKey }) => {
        const node = document.querySelector(`[data-facet-key="${runtimeDomKey}"]`);
        if (node) {
          const rect = node.getBoundingClientRect();
          nextAnchors[runtimeDomKey] = {
            x: rect.left,
            y: rect.top + rect.height * 0.5,
          };
          domFoundCount += 1;
        }
        if (overviewWorldAnchors?.[sceneWorldKey]) {
          worldFoundCount += 1;
        }
      });

      setAlwaysOnDomAnchorsByRuntimeKey(nextAnchors);
      logger.debug('[overview connector pairs]');
      logger.debug('resolvedConnectorPairs', resolvedConnectorPairs);
      logger.debug('resolvedPairCount', resolvedConnectorPairs.length);
      logger.debug('domAnchorsMeasuredCount', Object.keys(nextAnchors).length);
      logger.debug('worldAnchorsFoundCount', worldFoundCount);
      logger.debug('domNodesFoundCount', domFoundCount);
      logger.debug('cameraSettled', cameraSettled);
      
    };

    const raf = requestAnimationFrame(measureAllAnchors);
    window.addEventListener('resize', measureAllAnchors);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measureAllAnchors);
    };
  }, [cameraSettled, inActiveOverview, labelsReady, overviewWorldAnchors, resolvedConnectorPairs]);

  
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
              logger.debug(`💎 Crystal Debug Panel: ${newState ? 'ON' : 'OFF'}`);
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
          logger.debug(`💡 Disabled shadows for crystal mesh: ${child.name}`);
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
          logger.debug(`📄 Registered overlay slot for ${facetKey}`);
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
      logger.debug('🎯 Anchor Detection Report');
      
      facetKeys.forEach((facetKey, index) => {
        const facetRef = facetRefs.current[index];
        if (facetRef && facetRef.current) {
          const anchorName = `anchor_${facetKey}`;
          const anchor = facetRef.current.getObjectByName(anchorName);
          
          if (anchor) {
            const worldPos = new THREE.Vector3();
            anchor.getWorldPosition(worldPos);
            if (import.meta.env.DEV) logger.debug(`✅ ${anchorName}:`, {
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
            if (import.meta.env.DEV) logger.debug(`Available objects in ${facetKey}:`, availableNames);
          }
        } else {
          if (import.meta.env.DEV) console.warn(`❌ Facet ref for ${facetKey} is null`);
        }
      });
      
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
      logger.debug('🎨 Focus change effect:', {
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
        logger.debug('🎨 Skipping focus effect - no change');
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
        logger.debug('🎨 Skipping focus effect - materials not ready');
      }
      return;
    }

    if (focusUpdateTimeoutRef.current) {
      clearTimeout(focusUpdateTimeoutRef.current);
    }

    focusUpdateTimeoutRef.current = setTimeout(() => {
      if (import.meta.env.DEV) {
        logger.debug('🎨 Applying focus changes with hover respect');
      }

      facetMaterialsRef.current.forEach((mat, idx) => {
        const key = facetKeys[idx];

        // FIXED: Don't change color of hovered facets - let hover take precedence
        if (currentHovered === key) {
          if (import.meta.env.DEV) {
            logger.debug(`🎨 Skipping ${key} - currently hovered`);
          }
          return;
        }

        // Determine target color for non-hovered facets
        let targetColor;
        if (currentFacet === key) {
          // This facet is focused and not hovered by another
          targetColor = projectColors[idx];
          if (import.meta.env.DEV) {
            logger.debug(`🎨 Setting focus color for ${key}`);
          }
        } else {
          // Default color
          targetColor = defaultColorRef.current;
          if (import.meta.env.DEV) {
            logger.debug(`🎨 Resetting ${key} to default`);
          }
        }

        mat.userData.startColor.copy(mat.color);
        mat.userData.targetColor.copy(targetColor);
        mat.userData.progress = 0;
      });

      activeFacetRef.current = currentFacet;
    }, 50);

    if (overlaysReady) {
      const activeSceneFacetKey = animationData?.focusedProject
        ? (getSceneFacetKeyByProjectId(animationData.focusedProject) || currentFacet)
        : currentFacet;

      facetKeys.forEach((key) => {
        const shouldShow = key === activeSceneFacetKey;
        setOverlayVisibility(key, shouldShow);
      });
    }

    return () => clearTimeout(focusUpdateTimeoutRef.current);
  }, [
    animationData?.focusedFacet,
    materialVersion,
    facetKeys,
    projectColors,
    overlaysReady,
    setOverlayVisibility,
    animationData?.viewMode,
    animationData?.focusedProject
  ]);
  
  // Crystal form change detection
  useEffect(() => {
    if (!animationData) return;
    
    const currentForm = animationData.crystalForm;
    const formChanged = currentForm !== lastCrystalForm.current;
    
    if (formChanged) {
      if (import.meta.env.DEV) {
        logger.debug('💎 Crystal: Form change detected:', {
          from: lastCrystalForm.current,
          to: currentForm
        });
      }

      if (currentForm === 'exploded') {
        if (import.meta.env.DEV) {
          logger.debug('💎 Crystal: Explosion - charging whole crystal before swap');
        }
        if (!simplifiedAnimations) {
          pendingReformSwapAtRef.current = null;
          pendingFacetHideAtRef.current = null;
          setShowWholeCrystal(true);
          setShowFacets(false);
          setSphereVisible(false);
          setRingVisible(false);
          triggerSwapMaskGlow();
          fractureChargeActiveRef.current = true;
          fractureChargeStartRef.current = performance.now();
          fractureChargePhaseRef.current = 0;
          fractureChargeHandoffLoggedRef.current = false;
          facetRefs.current.forEach((facetRef) => {
            if (!facetRef?.current) return;
            facetRef.current.rotation.set(0, 0, 0);
          });
          setFractureLeakBurstId((id) => id + 1);
          pendingExplodeSwapAtRef.current = performance.now() + FORWARD_PRE_SWAP_WINDOW_MS;
        } else {
          // In simplified mode keep the whole crystal visible
          setShowWholeCrystal(true);
          setShowFacets(false);
          setSphereVisible(false);
          setRingVisible(false);
        }

      } else if (currentForm === 'whole') {
        if (import.meta.env.DEV) {
          logger.debug('💎 Crystal: Reform detected - hiding sphere');
        }
        pendingExplodeSwapAtRef.current = null;
        pendingReformSwapAtRef.current = null;
        pendingFacetHideAtRef.current = null;
        if (swapMaskGlowModeRef.current !== 'reform') {
          swapMaskGlowStartRef.current = null;
          swapMaskGlowModeRef.current = null;
        }
        setSphereVisible(false);
        setRingVisible(false);
        if (simplifiedAnimations) {
          setShowWholeCrystal(true);
          setShowFacets(false);
        } else {
          setShowWholeCrystal(false);
          setShowFacets(true);
        }
        explosionStartRef.current = null;
        fractureChargeActiveRef.current = false;
        fractureChargeStartRef.current = null;
        fractureChargeHandoffLoggedRef.current = false;
        resetWholeCrystalMaskGlow();
        if (facetsGroupRef.current) {
          facetsGroupRef.current.quaternion.copy(neutralQuat);
        }
      }

    }

    lastCrystalForm.current = currentForm;
  }, [animationData?.crystalForm, resetWholeCrystalMaskGlow, triggerSwapMaskGlow, simplifiedAnimations, neutralQuat]);

  // Main animation loop
  useFrame((state, deltaTime) => {
    if (!animationData || !facetRefs.current.length || simplifiedAnimations) return;
    const now = performance.now();
    if (
      fractureChargeActiveRef.current &&
      fractureChargeStartRef.current &&
      pendingExplodeSwapAtRef.current != null &&
      showFacets &&
      animationData?.transitionPhase === HERO_TO_OVERVIEW_PHASES.FRACTURE_CHARGE
    ) {
      const settings = crystalConfig?.heroToOverviewExplosionSettings || {};
      const configuredDuration = Math.max(settings.fractureChargeDuration ?? 0.5, 0.0001);
      const swapAt = pendingExplodeSwapAtRef.current ?? now;
      const availableDuration = Math.max((swapAt - fractureChargeStartRef.current) / 1000, 0.0001);
      const chargeDuration = Math.min(configuredDuration, availableDuration);
      const elapsedCharge = (now - fractureChargeStartRef.current) / 1000;
      const t = Math.min(Math.max(elapsedCharge / chargeDuration, 0), 1);
      fractureChargePhaseRef.current = t;
      const pressure = t * t * t;
      const jitterStrength = settings.fractureJitterStrength ?? 0.02;
      const rotationStrength = settings.fractureRotationStrength ?? 0.08;
      const glowIntensity = settings.fractureGlowIntensity ?? 2.3;

      const phaseDebugEnabled =
      (typeof globalThis !== 'undefined' && globalThis.__CRYSTAL_DEBUG_TRANSITION_PHASES__ === true)
      || (typeof window !== 'undefined' && window.__CRYSTAL_DEBUG_TRANSITION_PHASES__ === true);

    facetRefs.current.forEach((facetRef, idx) => {
        const facetKey = facetKeys[idx];
        if (!facetRef?.current) return;
        const hash = facetKey.split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 9973, 17);
        const jitterX = ((((hash * 13) % 1000) / 1000) - 0.5) * jitterStrength;
        const jitterY = ((((hash * 29) % 1000) / 1000) - 0.5) * jitterStrength;
        const jitterZ = ((((hash * 47) % 1000) / 1000) - 0.5) * jitterStrength;
        const jitterFade = 1 - t;
        facetRef.current.rotation.set(
          jitterY * rotationStrength * pressure * jitterFade,
          jitterX * rotationStrength * pressure * jitterFade,
          jitterZ * rotationStrength * pressure * jitterFade
        );
      });

      if (
        t >= 0.999 &&
        !fractureChargeHandoffLoggedRef.current &&
        ((typeof globalThis !== 'undefined' && globalThis.__CRYSTAL_DEBUG_TRANSITION_PHASES__ === true)
          || (typeof window !== 'undefined' && window.__CRYSTAL_DEBUG_TRANSITION_PHASES__ === true))
      ) {
        const firstFacet = facetRefs.current[0]?.current;
        if (firstFacet) {
          console.log('[transition-phase-debug] fractureCharge handoff facet0', {
            position: firstFacet.position.toArray(),
            rotation: [firstFacet.rotation.x, firstFacet.rotation.y, firstFacet.rotation.z]
          });
        }
        fractureChargeHandoffLoggedRef.current = true;
      }

      if (facetMaterialsRef.current.length) {        facetMaterialsRef.current.forEach((mat) => {
          const baseIntensity = mat.userData?.baseEmissiveIntensity ?? 0.02;
          const targetIntensity = baseIntensity + (glowIntensity - baseIntensity) * pressure;
          mat.emissiveIntensity = targetIntensity;
          mat.needsUpdate = true;
        });
      }
    }

    if (
      animationData.crystalForm === 'exploded' &&
      pendingExplodeSwapAtRef.current != null &&
      now >= pendingExplodeSwapAtRef.current
    ) {
      pendingExplodeSwapAtRef.current = null;
      runExplodeSwap();
    }

    const explodedOverviewSettled =
      inActiveOverview &&
      animationData.crystalForm === 'exploded' &&
      showFacets &&
      pendingExplodeSwapAtRef.current == null &&
      explosionStartRef.current == null;
    if (facetsSettledRef.current !== explodedOverviewSettled) {
      facetsSettledRef.current = explodedOverviewSettled;
      setFacetsSettled(explodedOverviewSettled);
    }
    if (
      animationData.crystalForm === 'whole' &&
      pendingReformSwapAtRef.current != null &&
      now >= pendingReformSwapAtRef.current
    ) {
      runReformSwap();
    }
    if (
      pendingFacetHideAtRef.current != null &&
      now >= pendingFacetHideAtRef.current
    ) {
      pendingFacetHideAtRef.current = null;
      setShowFacets(false);
    }

    if (swapMaskGlowStartRef.current != null) {
      const glowMode = swapMaskGlowModeRef.current || 'forward';
      const elapsed = (now - swapMaskGlowStartRef.current) / 1000;
      const glowDuration = glowMode === 'reform' ? REFORM_MASK_GLOW_DURATION_S : FORWARD_MASK_GLOW_DURATION_S;
      const peakIntensity = glowMode === 'reform' ? REFORM_MASK_GLOW_PEAK_INTENSITY : FORWARD_MASK_GLOW_PEAK_INTENSITY;
      const glowProgress = Math.min(elapsed / glowDuration, 1);
      const attack = 0.55;
      const envelope = glowProgress < attack
        ? glowProgress / attack
        : 1 - (glowProgress - attack) / (1 - attack);
      const strength = Math.max(0, envelope);
      const mat = crystalMaterialRef.current;
      if (mat) {
        mat.emissive.copy(wholeCrystalBaseEmissiveColorRef.current).lerp(swapMaskGlowColor, strength * 0.85);
        mat.emissiveIntensity = THREE.MathUtils.lerp(
          wholeCrystalBaseEmissiveIntensityRef.current,
          peakIntensity,
          strength
        );
        mat.needsUpdate = true;
      }

      if (glowMode === 'reform' && facetMaterialsRef.current.length) {
        const reformMaskStrength = Math.max(strength, reformProgressGlowRef.current);
        applyReformFacetMaskGlow(reformMaskStrength);
      }

      const holdReformMaskWhileFacetsVisible =
        glowMode === 'reform'
        && showFacets
        && (
          animationData.crystalForm === 'whole'
          || pendingReformSwapAtRef.current != null
          || pendingFacetHideAtRef.current != null
        );

      if (holdReformMaskWhileFacetsVisible) {
        applyReformFacetMaskGlow(1);
      }

      if (glowProgress >= 1) {
        if (holdReformMaskWhileFacetsVisible) {
          // Keep running the rest of the frame so late-stage passes can still enforce mask writes.
        } else {
          swapMaskGlowStartRef.current = null;
          swapMaskGlowModeRef.current = null;
          resetWholeCrystalMaskGlow();
          if (
        t >= 0.999 &&
        !fractureChargeHandoffLoggedRef.current &&
        ((typeof globalThis !== 'undefined' && globalThis.__CRYSTAL_DEBUG_TRANSITION_PHASES__ === true)
          || (typeof window !== 'undefined' && window.__CRYSTAL_DEBUG_TRANSITION_PHASES__ === true))
      ) {
        const firstFacet = facetRefs.current[0]?.current;
        if (firstFacet) {
          console.log('[transition-phase-debug] fractureCharge handoff facet0', {
            position: firstFacet.position.toArray(),
            rotation: [firstFacet.rotation.x, firstFacet.rotation.y, firstFacet.rotation.z]
          });
        }
        fractureChargeHandoffLoggedRef.current = true;
      }

      if (facetMaterialsRef.current.length) {            facetMaterialsRef.current.forEach((facetMat) => {
              const baseFacetColor = facetMat.userData?.baseEmissiveColor || defaultColorRef.current;
              const baseFacetIntensity = facetMat.userData?.baseEmissiveIntensity ?? 0.02;
              facetMat.emissive.copy(baseFacetColor);
              facetMat.emissiveIntensity = baseFacetIntensity;
              facetMat.needsUpdate = true;
            });
          }
          resetRenderedFacetMaskGlow();
        }
      }
    }

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
        const phaseDebugEnabled =
      (typeof globalThis !== 'undefined' && globalThis.__CRYSTAL_DEBUG_TRANSITION_PHASES__ === true)
      || (typeof window !== 'undefined' && window.__CRYSTAL_DEBUG_TRANSITION_PHASES__ === true);

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
    const focusedRotationLerp = Math.min(1, deltaTime * 4);
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
        const impulseThreshold =
          crystalConfig?.heroToOverviewExplosionSettings?.explosionImpulseDuration ?? 0.25;
        const currentPhase = animationData?.transitionPhase ?? HERO_TO_OVERVIEW_PHASES.IDLE;
        const canAdvanceToSlowdown = canAdvanceTransitionPhase(currentPhase, HERO_TO_OVERVIEW_PHASES.BULLET_TIME_SLOWDOWN)
          && currentPhase !== HERO_TO_OVERVIEW_PHASES.BULLET_TIME_SLOWDOWN;
        const phaseDebugEnabled =
          (typeof globalThis !== 'undefined' && globalThis.__CRYSTAL_DEBUG_TRANSITION_PHASES__ === true)
          || (typeof window !== 'undefined' && window.__CRYSTAL_DEBUG_TRANSITION_PHASES__ === true);
        if (phaseDebugEnabled && progress >= impulseThreshold && !canAdvanceToSlowdown) {
          console.log('[explosion-camera-debug] bulletTimeSlowdown skipped guard', {
            currentPhase,
            progress,
            impulseThreshold,
            crystalForm: animationData?.crystalForm,
            state: animationData?.state
          });
        }
        if (progress >= impulseThreshold && canAdvanceToSlowdown) {
          animationData?.setTransitionPhase?.(HERO_TO_OVERVIEW_PHASES.BULLET_TIME_SLOWDOWN, {
            reason: 'explosion-progress-threshold',
            progress
          });
        }
        const fracture = crystalConfig?.fracturePositions;
        const fractureDistance = crystalConfig?.fractureDistance ?? 0.3;
        const impulseDistance = crystalConfig?.heroToOverviewExplosionSettings?.explosionImpulseDistance ?? 0.32;
        const impulseStrength = crystalConfig?.heroToOverviewExplosionSettings?.explosionImpulseStrength ?? 1.35;
        const rotationStrength = crystalConfig?.heroToOverviewExplosionSettings?.explosionRotationStrength ?? 1.15;
        const impulseBlend = THREE.MathUtils.clamp(progress / Math.max(impulseThreshold, 0.0001), 0, 1);
        const impulseEase = 1 - Math.pow(1 - impulseBlend, 4);
        const eased = crystalConfig?.explosionEase
          ? crystalConfig?.explosionEase(progress)
          : progress;
        const outwardBoost = impulseDistance * impulseStrength * (1 - impulseBlend) * 0.35;

        if (facetsGroupRef.current) {
          facetsGroupRef.current.quaternion.slerpQuaternions(
            fractureStartQuatRef.current,
            neutralQuat,
            eased
          );
        }


        const firstFacetBefore = facetRefs.current[0]?.current?.position?.clone?.() || null;

        facetRefs.current.forEach((facetRef, index) => {
          if (!facetRef || !facetRef.current) return;

          const facetKey = facetKeys[index];
          const end = crystalConfig?.positions?.[facetPlacementKeys[facetKey] || facetKey];
          const start = fracture?.[facetPlacementKeys[facetKey] || facetKey] ||
            end?.clone().normalize().multiplyScalar(end.length() * fractureDistance);
          if (start && end) {
            const boostedProgress = THREE.MathUtils.clamp(eased + (impulseEase * outwardBoost), 0, 1);
            const interpolated = start.clone().lerp(end, boostedProgress);
            const targetQuat = baseFacetTargetQuats[facetKey] || neutralQuat;
            const adjusted = animationData?.crystalForm === 'exploded'
              ? getAnchorAdjustedPosition(facetKey, interpolated, targetQuat)
              : interpolated;
            facetRef.current.position.copy(adjusted);
            facetRef.current.quaternion.slerpQuaternions(neutralQuat, targetQuat, THREE.MathUtils.clamp(boostedProgress * rotationStrength, 0, 1));
          }
        });


        if (phaseDebugEnabled) {
          const firstFacetAfter = facetRefs.current[0]?.current?.position?.clone?.() || null;
          const sampleLog = (key, shouldLog, writerName, extra = {}) => {
            if (!shouldLog || visualOwnerSamplesRef.current[key]) return;
            visualOwnerSamplesRef.current[key] = true;
            console.log('[visual-owner-debug] facet writer', {
              phase: currentPhase,
              writer: writerName,
              firstFacetBefore: firstFacetBefore?.toArray?.() || null,
              firstFacetAfter: firstFacetAfter?.toArray?.() || null,
              finalWriteInFrame: true,
              ...extra
            });
          };
          sampleLog('impulseStart', currentPhase === HERO_TO_OVERVIEW_PHASES.EXPLOSION_IMPULSE && progress <= 0.05, 'explosion-interpolation');
          sampleLog('impulseMid', currentPhase === HERO_TO_OVERVIEW_PHASES.EXPLOSION_IMPULSE && progress >= 0.5, 'explosion-interpolation', { impulseBlend, outwardBoost });
          sampleLog('slowdownStart', currentPhase === HERO_TO_OVERVIEW_PHASES.BULLET_TIME_SLOWDOWN, 'explosion-interpolation');
          sampleLog('handoffStart', currentPhase === HERO_TO_OVERVIEW_PHASES.OVERVIEW_HANDOFF, 'explosion-interpolation');
          if ((currentPhase === HERO_TO_OVERVIEW_PHASES.EXPLOSION_IMPULSE || currentPhase === HERO_TO_OVERVIEW_PHASES.BULLET_TIME_SLOWDOWN) && firstFacetBefore && firstFacetAfter) {
            console.log('[explosion-fragment-debug] impulse applied or skipped', {
              phase: currentPhase,
              impulseT: impulseBlend,
              boostAmount: outwardBoost,
              firstFacetBefore: firstFacetBefore.toArray(),
              firstFacetAfter: firstFacetAfter.toArray()
            });
          }
        }

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
      let reformConvergenceProgress = 1;

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
            reformConvergenceProgress = Math.min(reformConvergenceProgress, clampedProgress);

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
            const caseStudyQuat = caseStudyFacetTargetQuats[facetKey] || selectedQuat;
            const sceneKey = facetPlacementKeys[facetKey] || facetKey;
            const projectId = getProjectIdBySceneFacetKey(sceneKey);
            const isCaseStudyActiveProject =
              animationData?.viewMode === 'caseStudy' &&
              Boolean(projectId && animationData?.focusedProject && projectId === animationData.focusedProject) &&
              animationData?.cameraState === 'caseStudy';
            const isProjectFocusedFacet =
              animationData?.viewMode !== 'caseStudy' &&
              animationData?.focusedFacet === facetKey &&
              animationData?.cameraState === 'project';
            const focusRotationProgress = THREE.MathUtils.clamp(
              cameraMoveProgress / FOCUS_ROTATION_PROGRESS_LEAD,
              0,
              1
            );
            const projectFocusQuat = baseQuat.clone().slerp(selectedQuat, focusRotationProgress);
            const caseStudyFocusQuat = selectedQuat.clone().slerp(caseStudyQuat, focusRotationProgress);
            const targetQuat = animationData?.crystalForm === 'exploded'
              ? (isCaseStudyActiveProject
                  ? caseStudyFocusQuat
                  : (isProjectFocusedFacet ? projectFocusQuat : baseQuat))
              : neutralQuat;
            const useIsolatedFocusTransform =
              ISOLATE_FOCUSED_ROTATION_FROM_POSITION &&
              (isProjectFocusedFacet || isCaseStudyActiveProject);
            const targetPosition = useIsolatedFocusTransform
              ? finalTarget
              : (animationData?.crystalForm === 'exploded'
                  ? getAnchorAdjustedPosition(facetKey, finalTarget, targetQuat)
                  : finalTarget);

            if (isProjectFocusedFacet || isCaseStudyActiveProject) {
              facetRef.current.position.copy(targetPosition);
            } else {
              facetRef.current.position.lerp(targetPosition, lerpSpeed * deltaTime * 60);
            }

          }
        }

        const baseQuat = baseFacetTargetQuats[facetKey] || neutralQuat;
        const selectedQuat = selectedFacetTargetQuats[facetKey] || baseQuat;
        const caseStudyQuat = caseStudyFacetTargetQuats[facetKey] || selectedQuat;
        const sceneKey = facetPlacementKeys[facetKey] || facetKey;
        const projectId = getProjectIdBySceneFacetKey(sceneKey);
        const isCaseStudyActiveProject =
          animationData?.viewMode === 'caseStudy' &&
          Boolean(projectId && animationData?.focusedProject && projectId === animationData.focusedProject) &&
          animationData?.cameraState === 'caseStudy';
        const isProjectFocusedFacet =
          animationData?.viewMode !== 'caseStudy' &&
          animationData?.focusedFacet === facetKey &&
          animationData?.cameraState === 'project';
        const focusRotationProgress = THREE.MathUtils.clamp(
          cameraMoveProgress / FOCUS_ROTATION_PROGRESS_LEAD,
          0,
          1
        );
        const projectFocusQuat = baseQuat.clone().slerp(selectedQuat, focusRotationProgress);
        const caseStudyFocusQuat = selectedQuat.clone().slerp(caseStudyQuat, focusRotationProgress);
        const targetQuat = animationData?.crystalForm === 'exploded'
          ? (isCaseStudyActiveProject
              ? caseStudyFocusQuat
              : (isProjectFocusedFacet ? projectFocusQuat : baseQuat))
          : neutralQuat;

        if (isProjectFocusedFacet || isCaseStudyActiveProject) {
          facetRef.current.quaternion.slerp(targetQuat, focusedRotationLerp);
        } else {
          facetRef.current.quaternion.slerp(targetQuat, rotationLerp);
        }
      });

      if (isReforming) {
        const easedReformGlow = Math.pow(THREE.MathUtils.clamp(reformConvergenceProgress, 0, 1), 1.8);
        const shouldHoldMaxReformGlow =
          allFacetsAtCenter || pendingReformSwapAtRef.current != null;
        const targetReformGlow = shouldHoldMaxReformGlow ? 1 : easedReformGlow;
        reformProgressGlowRef.current = targetReformGlow;
        applyReformFacetMaskGlow(targetReformGlow);
      } else if (reformProgressGlowRef.current > 0 && swapMaskGlowModeRef.current !== 'reform') {
        reformProgressGlowRef.current = 0;
      }

      if (isReforming && allFacetsAtCenter && !showWholeCrystal) {
        if (pendingReformSwapAtRef.current == null) {
          if (import.meta.env.DEV) {
            logger.debug('💎 Reform complete - starting masked swap to whole crystal');
          }
          triggerSwapMaskGlow('reform');
          pendingReformSwapAtRef.current = performance.now() + REFORM_PRE_SWAP_WINDOW_MS;
        }
      }
    }

    // Smooth color transitions for facet materials
    facetMaterialsRef.current.forEach((mat) => {
      const { targetColor, startColor, progress = 1 } = mat.userData || {};
      if (targetColor && startColor && progress < 1) {
        const speed = 4; // Faster response so hover color is active right as camera settles
        const nextProgress = Math.min(progress + deltaTime * speed, 1);
        const easedProgress = 1 - Math.pow(1 - nextProgress, 3);
        mat.userData.progress = nextProgress;
        mat.color.lerpColors(startColor, targetColor, easedProgress);
        mat.needsUpdate = true;
      }
    });

    if (overlaysReady) {
      const activeProjectId = animationData?.focusedProject ?? null;
      const activeFacetKey = activeProjectId
        ? getSceneFacetKeyByProjectId(activeProjectId)
        : null;
      const activeProjectSlot = activeFacetKey ? overlaySlots.get(activeFacetKey) : null;

      if (activeProjectSlot?.mesh && activeProjectSlot?.overlayMaterial) {
        const isCaseStudyActiveProject =
          animationData?.viewMode === 'caseStudy' &&
          activeProjectId != null &&
          getProjectIdBySceneFacetKey(activeProjectSlot.facetKey) === activeProjectId;
        const targetOpacity = isCaseStudyActiveProject ? 0 : 1;
        const lerpAlpha = Math.min(deltaTime * 4, 1);
        const nextOpacity = THREE.MathUtils.lerp(
          activeProjectSlot.overlayMaterial.opacity ?? activeProjectSlot.currentOpacity ?? 1,
          targetOpacity,
          lerpAlpha
        );

        if (!activeProjectSlot.isActive) {
          const materials = Array.isArray(activeProjectSlot.mesh.material)
            ? activeProjectSlot.mesh.material.slice()
            : [activeProjectSlot.mesh.material];
          const materialIndex = activeProjectSlot.materialIndex ?? 0;
          materials[materialIndex] = activeProjectSlot.overlayMaterial;
          activeProjectSlot.mesh.material =
            activeProjectSlot.materialIndex != null ? materials : activeProjectSlot.overlayMaterial;
          activeProjectSlot.isActive = true;
        }

        if (activeProjectSlot.overlayMaterial.transparent !== true) {
          activeProjectSlot.overlayMaterial.transparent = true;
          activeProjectSlot.overlayMaterial.needsUpdate = true;
        }

        activeProjectSlot.overlayMaterial.opacity = nextOpacity;
        activeProjectSlot.currentOpacity = nextOpacity;
        activeProjectSlot.targetOpacity = nextOpacity;
      }

      updateOverlays(deltaTime, {
        forceHide:
          showFacets &&
          animationData.crystalForm === 'whole' &&
          (pendingReformSwapAtRef.current != null || pendingFacetHideAtRef.current != null)
      });
    }

    // Final authoritative pass for reform pending window:
    // if facets are still visible, keep them fully masked.
    if (
      showFacets &&
      animationData.crystalForm === 'whole' &&
      (
        pendingReformSwapAtRef.current != null
        || pendingFacetHideAtRef.current != null
        || swapMaskGlowModeRef.current === 'reform'
      )
    ) {
      applyReformFacetMaskGlow(1);
    }

  });

  useEffect(() => {
    if (!crystalMaterialRef.current) return;
    wholeCrystalBaseEmissiveIntensityRef.current = crystalMaterialRef.current.emissiveIntensity ?? 0;
    wholeCrystalBaseEmissiveColorRef.current.copy(
      crystalMaterialRef.current.emissive || new THREE.Color('#000000')
    );
  }, [materialVersion]);

  useEffect(() => {
    return () => {
      cleanupOverlays();
      resetRenderedFacetMaskGlow();
      pendingExplodeSwapAtRef.current = null;
      pendingReformSwapAtRef.current = null;
      pendingFacetHideAtRef.current = null;
      swapMaskGlowStartRef.current = null;
      swapMaskGlowModeRef.current = null;
      reformProgressGlowRef.current = 0;
    };
  }, [cleanupOverlays, resetRenderedFacetMaskGlow]);

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
        blendStyle={BLEND_STYLES.ADDITIVE}
        enableDithering={true}
        enableAntialiasing={true}
        textureFiltering="enhanced"
        baseSize={256}
        maxScale={1280}
        maxOpacity={1.0}
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
          emitterPosition={[0, 0, 0]}
          {...mergedConfig.fracture.particles}
        />
      )}
      {!simplifiedAnimations && (
        <FractureBurstParticles
          trigger={fractureLeakBurstId}
          count={Math.max(12, Math.floor((crystalConfig?.heroToOverviewExplosionSettings?.fractureParticleLeakStrength ?? 0.2) * 80))}
          color="#b6f6ff"
          emitterPosition={[0, 0, 0]}
        />
      )}

      {/* Whole Crystal */}
      {showWholeCrystal && (
        <group ref={wholeCrystalRef}>
          <primitive object={wholeCrystal.scene} />
        </group>
      )}
      
      {showFacets && !simplifiedAnimations && (
        <group ref={facetsGroupRef} visible={!hideFacetMeshesDuringReformOverlap}>
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
        onSelectProject={selectProjectAndNavigate}
        onHoverChange={handleLabelHover}
        hoveredFacetKey={hoveredFacet}
        animationData={animationData}
        performanceProfile={performanceProfile}
        anchorOffsets={anchorOffsets}
        alwaysOnFacetKey={resolvedConnectorPairs[0]?.runtimeDomKey}
        onLabelsReadyChange={setLabelsReady}
      />

      {ENABLE_OVERVIEW_ALL_CONNECTORS && inActiveOverview && (
        <OverviewConnectorLines
          enabled={
            inActiveOverview &&
            labelsReady &&
            facetsSettled &&
            cameraSettled &&
            Object.keys(alwaysOnDomAnchorsByRuntimeKey).length > 0
          }
          resolvedConnectorPairs={resolvedConnectorPairs}
          alwaysOnDomAnchorsByRuntimeKey={alwaysOnDomAnchorsByRuntimeKey}
          overviewWorldAnchors={overviewWorldAnchors}
          hoveredSceneFacetKey={hoveredFacet}
        />
      )}

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
