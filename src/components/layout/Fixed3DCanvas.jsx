// FIXED: src/components/layout/Fixed3DCanvas.jsx
// UPDATED: Enhanced MistyLayerStack positioning and render order

import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { ShaderPass } from 'postprocessing';
import * as THREE from 'three';
import { HalfFloatType, UnsignedByteType, ShaderMaterial } from 'three';

// FIXED: Import enhanced camera controller from correct path
import UnifiedCameraController from '../three/UnifiedCameraController';
import UnifiedCrystalScene from '../three/UnifiedCrystalScene';
import PersistentDustSystem from '../three/PersistentDustSystem';
import { FPSCounter } from '../ui/FpsDisplay';

// ADDED: Import the debug panels component
import CrystalDebugPanels from '../ui/CrystalDebugPanels';
import GradientBackground from '../three/GradientBackground';
import { projectBackgrounds } from '../../data/projectBackgrounds';
import { fracture as fractureConfig, hdriPathForTier } from '../../crystalConfig';
import MistyLayerStack from '../MistyLayerStack';
import { isIOS26 } from '../../utils/isIOS26';
import { facetKeys as canonicalFacetKeys, getProjectIdBySceneFacetKey } from '../../data/projects';
import { useLayoutConfig } from '../../hooks/useLayoutConfig';
import { useHeroOverviewRuntime } from '../../hooks/useHeroOverviewRuntime';
import { resolveCameraDestination } from '../../camera/destinationResolver';
import { compareCameraPoses } from '../../camera/cameraPoseCompare';

function createSanitizePass() {
  const material = new ShaderMaterial({
    uniforms: { inputBuffer: { value: null } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D inputBuffer;
      varying vec2 vUv;

      bool isInvalidValue(float v) {
        return (v != v) || abs(v) > 100000.0;
      }

      bool isInvalidColor(vec3 c) {
        return isInvalidValue(c.r) || isInvalidValue(c.g) || isInvalidValue(c.b);
      }

      void main() {
        vec4 texel = texture2D(inputBuffer, vUv);
        vec3 c = texel.rgb;
        if (isInvalidColor(c)) {
          c = vec3(1.0);
        }
        c = clamp(c, 0.0, 4.0);
        gl_FragColor = vec4(c, texel.a);
      }
    `
  });

  material.toneMapped = false;
  material.depthTest = false;
  material.depthWrite = false;

  const pass = new ShaderPass(material);
  pass.enabled = true;
  return pass;
}

const PulsingOmniLight = ({ simplified = false }) => {
  const lightRef = useRef();

  useFrame((state) => {
    if (lightRef.current) {
      if (simplified) {
        lightRef.current.intensity = 1.0;
        return;
      }
      const time = state.clock.elapsedTime;
      const pulse = Math.sin(time * 2 + Math.sin(time * 0.7) * 0.5) * 0.3 + 1;
      lightRef.current.intensity = 1.0 * pulse;
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={[0, 0, 0]}
      intensity={1.0}
      color="#00ba7f"
      distance={100}
      decay={1}
      castShadow={false}
    />
  );
};


const HeroOverviewRuntimeTicker = ({ runtime }) => {
  useFrame(() => {
    runtime?.update?.();
  });

  return null;
};

const InitialCameraLookAt = ({ target }) => {
  const { camera } = useThree();

  useEffect(() => {
    if (!Array.isArray(target) || target.length !== 3) return;

    camera.lookAt(target[0], target[1], target[2]);
    camera.updateMatrixWorld();
  }, []);

  return null;
};

/**
 * UPDATED: Fixed3DCanvas with enhanced MistyLayerStack render order
 */
const Fixed3DCanvas = forwardRef(({
  // Animation data from MasterAnimationCoordinator
  animationData,
  restartToken = 0,
  
  // Material and effects (unchanged)
  materialVariant = 'default',
  effectsEnabled,
  postProcessingConfig,
  performanceProfile,
  config,
  canvasProps = {},
  environmentProps = {},
  isMobile = false,
  scrollToProgress,
  scrollToProject,
  onDirectProjectSelect,
  onDirectZoneSelect,
  cameraRuntimeOverrides = null,
  projectRuntimeOverrides = null
}, ref) => {
  // NEW: Ref to access crystal scene for debug panels
  const crystalSceneRef = useRef();
  const backgroundRef = useRef();
  const lastZoneRef = useRef(null);
  const cameraMoveProgressRef = useRef(1);

  const handleFractureStart = useCallback(() => {
    // Background white-flash on fracture. Defaults live in
    // crystalConfig.js `fracture.backgroundFlash`; a globalThis.__BG_FLASH__
    // object (same shape) overrides them at runtime for live tuning.
    const cfg = fractureConfig.backgroundFlash || {};
    const t = (typeof globalThis !== 'undefined' && globalThis.__BG_FLASH__) || {};
    const intensity = t.intensity ?? cfg.intensity ?? 0.5;
    const duration = t.duration ?? cfg.duration ?? 0.8;
    const delay = t.delay ?? cfg.delay ?? 0.4;
    const ease = t.ease ?? cfg.ease ?? 'sine'; // 'sine' | 'smooth' | 'cubic' | 'quad' | 'expo' | 'linear'
    if (intensity <= 0) return;
    if (delay > 0) {
      window.setTimeout(() => backgroundRef.current?.flash(intensity, duration, ease), delay * 1000);
    } else {
      backgroundRef.current?.flash(intensity, duration, ease);
    }
  }, []);

  // Expose internal state to parent components
  useImperativeHandle(ref, () => ({
    modelsLoaded: crystalSceneRef.current?.modelsLoaded || false,
    updateBackground: (key) => backgroundRef.current?.updateBackground(key),
    directSelectZone: (zoneKey) => onDirectZoneSelect?.(zoneKey)
  }), [onDirectZoneSelect, crystalSceneRef.current?.modelsLoaded]);
  
  // NEW: State for debug data
  const [debugData, setDebugData] = useState({
    facetKeys: [...canonicalFacetKeys],
    facetModels: [],
    facetRefs: { current: [] },
    showWholeCrystal: true,
    showFacets: false,
    sphereVisible: false,
    showCrystalDebug: false,
    lastCrystalForm: 'whole'
  });
  const lastDebugSignatureRef = useRef('');

  const simplifiedAnimations = performanceProfile?.simplifiedAnimations;
  const dustEnabled = !performanceProfile?.reducedParticles;
  const particleCount = performanceProfile?.particleCount;
  // Post-process MSAA sample count, tier-scaled (falls back to 4 if profile omits it)
  const msaaSamples = performanceProfile?.msaaSamples ?? 4;
  const [ios26, setIos26] = useState(() => {
    if (typeof navigator === 'undefined') {
      return false;
    }
    return isIOS26();
  });

  const sanitizePass = useMemo(() => createSanitizePass(), []);
  const { layout, variant } = useLayoutConfig();
  const heroOverviewRuntimeTimingConfig = useMemo(
    () => ({
      ...(layout?.timing?.heroOverviewRuntime || {}),
      ...(config?.timing?.heroOverviewRuntime || {}),
    }),
    [config?.timing?.heroOverviewRuntime, layout?.timing?.heroOverviewRuntime],
  );
  const heroOverviewRuntime = useHeroOverviewRuntime(heroOverviewRuntimeTimingConfig);
  const heroOverviewExplosionClockRef = useRef(null);
  const lastHeroOverviewStartRef = useRef('');
  const lastHeroOverviewZoneRef = useRef(null);
  const lastHeroOverviewFormRef = useRef('whole');

  const cameraMergedConfig = useMemo(() => {
    const nextConfig = { ...config };
    const layoutProjects = layout?.projects;
    const deviceKey = variant === 'mobile' ? 'mobile' : 'desktop';

    const mergeCameraLayer = (cameraLayer, sourceWins = true) => {
      if (!cameraLayer) return;

      if (cameraLayer.positions) {
        nextConfig.cameraPositions = sourceWins
          ? {
            ...(nextConfig.cameraPositions || {}),
            ...cameraLayer.positions,
            projects: {
              ...(nextConfig.cameraPositions?.projects || {}),
              ...(cameraLayer.positions.projects || {}),
            },
          }
          : {
            ...cameraLayer.positions,
            ...(nextConfig.cameraPositions || {}),
            projects: {
              ...(cameraLayer.positions.projects || {}),
              ...(nextConfig.cameraPositions?.projects || {}),
            },
          };
      }

      if (cameraLayer.targets) {
        nextConfig.cameraTargets = sourceWins
          ? {
            ...(nextConfig.cameraTargets || {}),
            ...cameraLayer.targets,
            projects: {
              ...(nextConfig.cameraTargets?.projects || {}),
              ...(cameraLayer.targets.projects || {}),
            },
          }
          : {
            ...cameraLayer.targets,
            ...(nextConfig.cameraTargets || {}),
            projects: {
              ...(cameraLayer.targets.projects || {}),
              ...(nextConfig.cameraTargets?.projects || {}),
            },
          };
      }

      if (cameraLayer.composition) {
        nextConfig.cameraComposition = sourceWins
          ? {
              ...(nextConfig.cameraComposition || {}),
              ...cameraLayer.composition,
            }
          : {
              ...cameraLayer.composition,
              ...(nextConfig.cameraComposition || {}),
            };
      }

      if (cameraLayer.heroTuning) {
        nextConfig.cameraHeroTuning = sourceWins
          ? {
              ...(nextConfig.cameraHeroTuning || {}),
              ...cameraLayer.heroTuning,
            }
          : {
              ...cameraLayer.heroTuning,
              ...(nextConfig.cameraHeroTuning || {}),
            };
      }

      if (cameraLayer.offsets) {
        nextConfig.cameraOffsets = sourceWins
          ? {
            ...(nextConfig.cameraOffsets || {}),
            ...cameraLayer.offsets,
            global: {
              ...(nextConfig.cameraOffsets?.global || {}),
              ...(cameraLayer.offsets.global || {}),
            },
            zones: {
              ...(nextConfig.cameraOffsets?.zones || {}),
              ...(cameraLayer.offsets.zones || {}),
            },
            projects: {
              ...(nextConfig.cameraOffsets?.projects || {}),
              ...(cameraLayer.offsets.projects || {}),
            },
          }
          : {
            ...cameraLayer.offsets,
            ...(nextConfig.cameraOffsets || {}),
            global: {
              ...(cameraLayer.offsets.global || {}),
              ...(nextConfig.cameraOffsets?.global || {}),
            },
            zones: {
              ...(cameraLayer.offsets.zones || {}),
              ...(nextConfig.cameraOffsets?.zones || {}),
            },
            projects: {
              ...(cameraLayer.offsets.projects || {}),
              ...(nextConfig.cameraOffsets?.projects || {}),
            },
          };
      }

      if (cameraLayer.projects) {
        const nextProjectCameraSettings = { ...(nextConfig.projectCameraSettings || {}) };
        Object.entries(cameraLayer.projects).forEach(([sceneKey, projectCameraModes]) => {
          const projectId = getProjectIdBySceneFacetKey(sceneKey);
          if (!projectId) return;
          const existingDeviceConfig = nextProjectCameraSettings[projectId]?.[deviceKey] || {};
          const incomingSelected = projectCameraModes?.selected || {};
          const incomingCaseStudy = projectCameraModes?.caseStudy || {};
          const mergedDeviceConfig = sourceWins
            ? {
              ...existingDeviceConfig,
              ...(projectCameraModes || {}),
              selected: {
                ...(existingDeviceConfig.selected || {}),
                ...incomingSelected,
              },
              caseStudy: {
                ...(existingDeviceConfig.caseStudy || {}),
                ...incomingCaseStudy,
              },
            }
            : {
              ...(projectCameraModes || {}),
              ...existingDeviceConfig,
              selected: {
                ...incomingSelected,
                ...(existingDeviceConfig.selected || {}),
              },
              caseStudy: {
                ...incomingCaseStudy,
                ...(existingDeviceConfig.caseStudy || {}),
              },
            };
          nextProjectCameraSettings[projectId] = {
            ...(nextProjectCameraSettings[projectId] || {}),
            [deviceKey]: mergedDeviceConfig,
          };
        });
        nextConfig.projectCameraSettings = nextProjectCameraSettings;
      }
    };

    mergeCameraLayer(layout?.camera, true);
    mergeCameraLayer(cameraRuntimeOverrides, true);

    if (layoutProjects?.explodedPositions) {
      nextConfig.explodedPositions = {
        ...(nextConfig.explodedPositions || {}),
        ...Object.fromEntries(
          Object.entries(layoutProjects.explodedPositions).map(([key, value]) => [key, value.toArray()]),
        ),
      };
    }

    if (layoutProjects?.facetRotationsEulerDeg) {
      nextConfig.facetRotationsEulerDeg = {
        ...(nextConfig.facetRotationsEulerDeg || {}),
        ...layoutProjects.facetRotationsEulerDeg,
      };
    }

    if (layoutProjects?.selectedFacetRotationsEulerDeg) {
      nextConfig.selectedFacetRotationsEulerDeg = {
        ...(nextConfig.selectedFacetRotationsEulerDeg || {}),
        ...layoutProjects.selectedFacetRotationsEulerDeg,
      };
    }

    if (projectRuntimeOverrides?.explodedPositions) {
      nextConfig.explodedPositions = {
        ...(nextConfig.explodedPositions || {}),
        ...projectRuntimeOverrides.explodedPositions,
      };
    }

    if (projectRuntimeOverrides?.facetRotationsEulerDeg) {
      nextConfig.facetRotationsEulerDeg = {
        ...(nextConfig.facetRotationsEulerDeg || {}),
        ...projectRuntimeOverrides.facetRotationsEulerDeg,
      };
    }

    if (projectRuntimeOverrides?.selectedFacetRotationsEulerDeg) {
      nextConfig.selectedFacetRotationsEulerDeg = {
        ...(nextConfig.selectedFacetRotationsEulerDeg || {}),
        ...projectRuntimeOverrides.selectedFacetRotationsEulerDeg,
      };
    }

    if (layout?.timing?.heroOverviewRuntime) {
      nextConfig.timing = {
        ...(nextConfig.timing || {}),
        heroOverviewRuntime: {
          ...(nextConfig.timing?.heroOverviewRuntime || {}),
          ...layout.timing.heroOverviewRuntime,
        },
      };
    }

    if (import.meta.env.DEV) {
      const deviceKey = variant === 'mobile' ? 'mobile' : 'desktop';
      console.log('[camera-merge] runtime config fields', {
        variant,
        'camera.positions.hero': nextConfig?.cameraPositions?.hero ?? null,
        'camera.projects.leadership.selected.position':
          nextConfig?.projectCameraSettings?.project01?.[deviceKey]?.selected?.position ?? null,
        'camera.projects.leadership.caseStudy.target':
          nextConfig?.projectCameraSettings?.project01?.[deviceKey]?.caseStudy?.target ?? null
      });
    }

    return nextConfig;
  }, [cameraRuntimeOverrides, config, layout?.camera, layout?.projects, layout?.timing, projectRuntimeOverrides, variant]);

  const runtimeOverrideLogShownRef = useRef(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const hasRuntimeOverrides = Boolean(
      cameraRuntimeOverrides?.positions ||
      cameraRuntimeOverrides?.targets ||
      cameraRuntimeOverrides?.offsets
    );

    if (hasRuntimeOverrides && !runtimeOverrideLogShownRef.current) {
      runtimeOverrideLogShownRef.current = true;
      console.log('[camera] runtime overrides active');
    }

    if (!hasRuntimeOverrides) {
      runtimeOverrideLogShownRef.current = false;
    }
  }, [cameraRuntimeOverrides]);

  useEffect(() => () => {
    sanitizePass?.dispose?.();
    sanitizePass?.material?.dispose?.();
  }, [sanitizePass]);

  useEffect(() => {
    let isMounted = true;

    async function refineIOSDetection() {
      if (typeof navigator === 'undefined') {
        return;
      }

      const uaData = navigator.userAgentData;

      if (!uaData || typeof uaData.getHighEntropyValues !== 'function') {
        return;
      }

      try {
        const entropy = await uaData.getHighEntropyValues(['platformVersion', 'architecture', 'model']);
        if (!isMounted) return;

        if (isIOS26(entropy)) {
          setIos26(true);
        }
      } catch (error) {
        console.debug('[Fixed3DCanvas] Failed to refine iOS 26 detection', error);
      }
    }

    if (!ios26) {
      refineIOSDetection();
    }

    return () => {
      isMounted = false;
    };
  }, [ios26]);

  useEffect(() => {
    console[ios26 ? 'warn' : 'log'](
      ios26
        ? '⚠️  iOS 26 / A18 detected — disabling MSAA in composer to prevent Safari 26 artifact.'
        : '✅  Full 8× MSAA composer enabled.'
    );
  }, [ios26]);

  // Keep debug data in sync with scene state (including keyboard toggles inside the scene)
  useEffect(() => {
    const syncDebugData = () => {
      if (!crystalSceneRef.current) return;

      const sceneDebugState = crystalSceneRef.current.getDebugSnapshot?.()
        || crystalSceneRef.current.debugState;
      const debugMethods = crystalSceneRef.current.debugMethods;

      if (!sceneDebugState) return;

      const signature = JSON.stringify({
        showWholeCrystal: sceneDebugState.showWholeCrystal,
        showFacets: sceneDebugState.showFacets,
        sphereVisible: sceneDebugState.sphereVisible,
        showCrystalDebug: sceneDebugState.showCrystalDebug,
        lastCrystalForm: sceneDebugState.lastCrystalForm,
        focusedSceneFacetKey: sceneDebugState.focusedSceneFacetKey,
        focusedProjectKey: sceneDebugState.focusedProjectKey,
      });

      if (signature === lastDebugSignatureRef.current) return;
      lastDebugSignatureRef.current = signature;

      setDebugData((prev) => ({
        ...prev,
        ...sceneDebugState,
        debugMethods,
      }));
    };

    syncDebugData();
    const debugVisible = Boolean(debugData.showCrystalDebug);
    if (!debugVisible) {
      return undefined;
    }

    const intervalId = window.setInterval(syncDebugData, 120);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [debugData.showCrystalDebug]);

  // Update gradient background based on project focus or zone changes
  const bg = backgroundRef.current;
  useEffect(() => {
    if (!bg || !animationData) return;

    const zone = animationData.currentZone;

    // Overview zone always uses its own gradient
    if (zone === 'overview') {
      if (lastZoneRef.current !== zone) {
        lastZoneRef.current = zone;
        bg.updateBackground('overview');
      }
      return;
    }

    // Project-specific backgrounds only apply inside the projects zone
    if (zone === 'projects' && (animationData.focusedProject || animationData.focusedFacet)) {
      const projectKey = animationData.focusedProject
        || getProjectIdBySceneFacetKey(animationData.focusedFacet)
        || animationData.focusedFacet;
      bg.updateBackground(projectKey);
      lastZoneRef.current = zone;
      return;
    }

    // General projects area uses overview background
    if (zone === 'projects') {
      if (lastZoneRef.current !== zone) {
        lastZoneRef.current = zone;
        bg.updateBackground('overview');
      }
      return;
    }

    // All other zones fall back to default
    if (lastZoneRef.current !== zone) {
      lastZoneRef.current = zone;
      bg.updateBackground('default');
    }
  }, [
    animationData?.focusedProject,
    animationData?.focusedFacet,
    animationData?.currentZone,
    bg
  ]);

  useEffect(() => {
    // Drive the hero→overview cinematic clock (camera pushback + fragment/ray/particle
    // timing) off the actual crystal-form change, NOT the raw scroll zone. The zone
    // crosses immediately on scroll, but the explosion can be deferred by the
    // overview→hero interruption queue — keying on the zone made the rays fire ~1.6s
    // ahead of the explosion. A whole→exploded transition uniquely marks the
    // hero→overview explosion (projects/about→overview keep the crystal exploded), so
    // this stays aligned whether or not the explosion was queued.
    const prevForm = lastHeroOverviewFormRef.current;
    const form = animationData?.crystalForm ?? null;

    const explodingIntoOverview =
      animationData?.state === 'overview' || animationData?.currentZone === 'overview';
    if (form === 'whole') {
      heroOverviewRuntime.resetToIdle({ reason: 'crystal-reformed' });
      lastHeroOverviewStartRef.current = '';
    } else if (prevForm === 'whole' && form === 'exploded' && explodingIntoOverview) {
      if (lastHeroOverviewStartRef.current !== 'exploded') {
        lastHeroOverviewStartRef.current = 'exploded';
        heroOverviewRuntime.start({ source: 'crystal-whole-to-exploded' });
      }
    }

    lastHeroOverviewFormRef.current = form;
  }, [animationData?.crystalForm, heroOverviewRuntime]);


  const destinationCompareStoreRef = useRef({ byKey: {}, order: [] });

  const resolveLegacyDestinationPose = useCallback((destination, projectId, mode) => {
    const globalOffsetPos = cameraMergedConfig?.cameraOffsets?.global?.position || [0, 0, 0];
    const globalOffsetTarget = cameraMergedConfig?.cameraOffsets?.global?.target || [0, 0, 0];
    const add = (a = [0, 0, 0], b = [0, 0, 0]) => [
      (a[0] || 0) + (b[0] || 0),
      (a[1] || 0) + (b[1] || 0),
      (a[2] || 0) + (b[2] || 0),
    ];

    if (destination === 'project' || destination === 'caseStudy') {
      const deviceKey = isMobile ? 'mobile' : 'desktop';
      const branchMode = destination === 'caseStudy' ? 'caseStudy' : mode;
      const branch = cameraMergedConfig?.projectCameraSettings?.[projectId]?.[deviceKey]?.[branchMode];
      if (!branch?.position || !branch?.target) {
        return {
          available: false,
          legacySource: 'projectCameraSettings (missing branch)',
          unresolvedReason: 'legacy-destination-pose-unavailable',
        };
      }
      return {
        available: true,
        legacySource: `projectCameraSettings.${deviceKey}.${branchMode}`,
        pose: {
          position: add(branch.position, globalOffsetPos),
          lookAt: add(branch.target, globalOffsetTarget),
          fov: 45,
          filmOffset: cameraMergedConfig?.cameraComposition?.hero?.filmOffsetX ?? 0,
        },
      };
    }

    const position = cameraMergedConfig?.cameraPositions?.[destination];
    const lookAt = cameraMergedConfig?.cameraTargets?.[destination];
    if (!position || !lookAt) {
      return {
        available: false,
        legacySource: 'cameraPositions/cameraTargets (missing zone pose)',
        unresolvedReason: 'legacy-destination-pose-unavailable',
      };
    }

    const zoneOffsetPos = cameraMergedConfig?.cameraOffsets?.zones?.[destination]?.position || [0, 0, 0];
    const zoneOffsetTarget = cameraMergedConfig?.cameraOffsets?.zones?.[destination]?.target || [0, 0, 0];

    return {
      available: true,
      legacySource: `cameraPositions/cameraTargets.zone.${destination}`,
      pose: {
        position: add(add(position, globalOffsetPos), zoneOffsetPos),
        lookAt: add(add(lookAt, globalOffsetTarget), zoneOffsetTarget),
        fov: 45,
        filmOffset: cameraMergedConfig?.cameraComposition?.hero?.filmOffsetX ?? 0,
      },
    };
  }, [cameraMergedConfig, isMobile]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const destination = animationData?.cameraState === 'caseStudy'
      ? 'caseStudy'
      : (animationData?.cameraState === 'project' ? 'project' : animationData?.cameraState);

    if (!destination) return;

    const compareKey = `${destination}|${animationData?.focusedProject || 'none'}|${animationData?.viewMode || 'none'}|${isMobile ? 'mobile' : 'desktop'}`;
    if (destinationCompareStoreRef.current.byKey[compareKey]) return;

    const legacyResolution = resolveLegacyDestinationPose(
      destination,
      animationData?.focusedProject || null,
      animationData?.viewMode === 'caseStudy' ? 'caseStudy' : 'selected',
    );
    const legacyPose = legacyResolution?.pose || null;

    const compareContext = {
      destination,
      activeCameraState: animationData?.cameraState || null,
      activeViewMode: animationData?.viewMode || null,
      focusedProject: animationData?.focusedProject || null,
      device: isMobile ? 'mobile' : 'desktop',
    };

    const destinationMatchesActiveContext = destination === compareContext.activeCameraState;
    const destinationCompatibleWithViewMode =
      destination === 'caseStudy'
        ? compareContext.activeViewMode === 'caseStudy'
        : destination === 'project'
          ? (compareContext.activeViewMode === 'project' || compareContext.activeViewMode === 'caseStudy')
          : compareContext.activeViewMode !== 'caseStudy';

    const resolvedPose = resolveCameraDestination({
      destination,
      projectId: animationData?.focusedProject || null,
      mode: animationData?.viewMode === 'caseStudy' ? 'caseStudy' : 'selected',
      config: cameraMergedConfig,
      animationData,
      isMobile,
    });

    const compareValid = destinationMatchesActiveContext && destinationCompatibleWithViewMode && Boolean(legacyResolution?.available);
    const compareOptions = (!destinationMatchesActiveContext || !destinationCompatibleWithViewMode)
      ? { skip: true, reason: 'context-mismatch' }
      : (!legacyResolution?.available
        ? { skip: false }
        : {});

    const result = legacyResolution?.available
      ? compareCameraPoses(legacyPose, resolvedPose, {}, compareOptions)
      : {
        status: 'unresolved',
        invalidSide: 'legacy',
        reason: legacyResolution?.unresolvedReason || 'legacy-destination-pose-unavailable',
        positionDelta: 0,
        lookAtDelta: 0,
        fovDelta: 0,
        filmOffsetDelta: 0,
        mismatchedFields: 'none',
      };
    const entry = {
      compareKey,
      destination,
      projectId: animationData?.focusedProject || null,
      result,
      legacySource: legacyResolution?.legacySource || 'legacy-pose-unavailable',
      legacySourceIsDestinationSpecific: Boolean(legacyResolution?.available),
      resolverSource: resolvedPose.meta?.source || 'resolver',
      compareValid,
      compareContext,
      destinationMatchesActiveContext,
      destinationCompatibleWithViewMode,
      activeViewMode: animationData?.viewMode || null,
      currentState: animationData?.state || null,
      currentZone: animationData?.currentZone || null,
      skipReason: result.status === 'skipped' ? (result.reason || 'context-mismatch') : '',
      unresolvedReason: result.status === 'unresolved' ? (result.reason || 'legacy-destination-pose-unavailable') : '',
      resolvedMeta: resolvedPose.meta,
    };
    destinationCompareStoreRef.current.byKey[compareKey] = entry;
    destinationCompareStoreRef.current.order.push(compareKey);

    if (globalThis.__CAMERA_DESTINATION_COMPARE_VERBOSE__ === true) {
      console.log('[camera-destination-compare]', entry);
    }

    if (!globalThis.__printCameraDestinationCompareSummary) {
      globalThis.__printCameraDestinationCompareSummary = () => {
        const list = destinationCompareStoreRef.current.order.map((k) => destinationCompareStoreRef.current.byKey[k]);
        console.table(list.map((row) => ({ key: row.compareKey, destination: row.destination, projectId: row.projectId, status: row.result.status, mismatchedFields: row.result.mismatchedFields, positionDelta: row.result.positionDelta, lookAtDelta: row.result.lookAtDelta, fovDelta: row.result.fovDelta, filmOffsetDelta: row.result.filmOffsetDelta })));
      };
    }

    if (!globalThis.__printCameraDestinationCompareDetails) {
      globalThis.__printCameraDestinationCompareDetails = () => {
        const list = destinationCompareStoreRef.current.order.map((k) => destinationCompareStoreRef.current.byKey[k]);
        const summary = {
          total: list.length,
          validCompared: list.filter((r) => r.compareValid).length,
          matches: list.filter((r) => r.result.status === 'match').length,
          mismatches: list.filter((r) => r.result.status === 'mismatch').length,
          unresolved: list.filter((r) => r.result.status === 'unresolved').length,
          skippedInvalidContext: list.filter((r) => r.result.status === 'skipped').length,
        };
        console.log('[camera-destination-compare:summary]', summary);
        console.log('[camera-destination-compare:details]', list);
      };
    }
  }, [animationData?.cameraState, animationData?.focusedProject, animationData?.viewMode, animationData?.cameraConfig, cameraMergedConfig, isMobile]);
  // FIXED: Function to get facet refs from crystal scene with proper access
  const initialCameraPosition =
    cameraMergedConfig?.cameraPositions?.intro || config?.camera?.startingPosition || [0, 0, 4.5];
  const initialCameraTarget =
    cameraMergedConfig?.cameraTargets?.intro || cameraMergedConfig?.cameraTargets?.hero || [0, 0, 0];

  const getFacetRefs = () => {
    if (crystalSceneRef.current && crystalSceneRef.current.facetRefs) {
      return crystalSceneRef.current.facetRefs; // Access the exposed refs directly
    }
    return null;
  };

  return (
    <>
      {/* Main 3D Canvas */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1, // Behind scrollable content (which is z-index 10)
        pointerEvents: 'none', // Don't block scrolling
      }}>
        <Canvas
          key={Array.isArray(canvasProps.dpr) ? canvasProps.dpr.join('-') : canvasProps.dpr}
          camera={{
            position: initialCameraPosition,
            fov: config?.camera?.fov || 45
          }}
          {...canvasProps}
          gl={{
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.2,
            outputColorSpace: THREE.SRGBColorSpace,
            // UPDATED: Ensure depth sorting is enabled for proper render order
            sortObjects: true,
            ...canvasProps.gl
          }}
          style={{ 
            width: '100%', 
            height: '100%',
            // Allow pointer events only for 3D interactions (disabled on mobile)
            pointerEvents: isMobile ? 'none' : 'auto',
          }}
        >
          <InitialCameraLookAt target={initialCameraTarget} />

          <FPSCounter />

          {/* FIXED: Pass backgrounds to GradientBackground and use 'default' as initial */}
          <GradientBackground 
            ref={backgroundRef} 
            backgrounds={projectBackgrounds} 
            initialKey="default"
          />

          {/* Persistent Dust System */}
          {dustEnabled && (
            <PersistentDustSystem count={particleCount} enabled={dustEnabled} />
          )}
          
          {/* UPDATED: Enhanced lighting setup with bottom directional light */}
          <ambientLight intensity={config?.lighting?.ambient?.intensity || 0.4} />
          
          {/* Main directional light (from above/side) */}
          <directionalLight
            position={config?.lighting?.directional?.position || [10, 8, 5]}
            intensity={config?.lighting?.directional?.intensity || 1.0}
            color={config?.lighting?.directional?.color || "#FFFFFF"}
            castShadow={false}
          />
          
          {/* ADDED: Bottom directional light pointing upward */}
          {config?.lighting?.directionalBottom && (
            <directionalLight
              position={config.lighting.directionalBottom.position || [0, -5, 0]}
              target-position={config.lighting.directionalBottom.target || [0, 0, 0]}
              intensity={config.lighting.directionalBottom.intensity || 0.2}
              color={config.lighting.directionalBottom.color || "#e75c25ff"}
              castShadow={false}
            />
          )}
          
          {/* Point lights */}
          {config?.lighting?.pointLights
            ?.slice(0, performanceProfile?.maxLights || config?.lighting?.pointLights.length)
            .map((light, index) => (
              <pointLight
                key={index}
                position={light.position}
                intensity={light.intensity}
                color={light.color}
                castShadow={false}
              />
            ))}

          <PulsingOmniLight simplified={simplifiedAnimations} />
          
          {/* Spot light */}
          <spotLight
            position={config?.lighting?.spotLight?.position || [0, 0, 10]}
            intensity={config?.lighting?.spotLight?.intensity || 1.0}
            angle={config?.lighting?.spotLight?.angle || Math.PI / 4}
            penumbra={config?.lighting?.spotLight?.penumbra || 0.2}
            color={config?.lighting?.spotLight?.color || "#ffffffff"}
            castShadow={false}
          />
          
          <HeroOverviewRuntimeTicker runtime={heroOverviewRuntime} />

          {/* UPDATED: Enhanced Camera Controller with facet refs */}
          <UnifiedCameraController
            animationData={animationData}
            config={cameraMergedConfig}
            restartToken={restartToken}
            isMobile={isMobile}
            simplifiedAnimations={simplifiedAnimations}
            facetRefs={getFacetRefs()} // FIXED: Pass exposed facet refs for anchor targeting
            sharedCameraMoveProgressRef={cameraMoveProgressRef}
            heroOverviewRuntime={heroOverviewRuntime}
            heroOverviewExplosionClockRef={heroOverviewExplosionClockRef}
          />
          
          {/* UPDATED: Crystal Scene with ref for accessing debug state */}
          <UnifiedCrystalScene
            sharedCameraMoveProgressRef={cameraMoveProgressRef}
            ref={crystalSceneRef} // NEW: Ref to access debug state and methods
            animationData={animationData}
            config={cameraMergedConfig}
            materialVariant={materialVariant}
            performanceProfile={performanceProfile}
            isMobile={isMobile}
            simplifiedAnimations={simplifiedAnimations}
            scrollToProgress={scrollToProgress}
            scrollToProject={scrollToProject}
            onDirectProjectSelect={onDirectProjectSelect}
            onFractureStart={handleFractureStart}
            heroOverviewRuntime={heroOverviewRuntime}
            heroOverviewExplosionClockRef={heroOverviewExplosionClockRef}
          />

          {/* UPDATED: Enhanced MistyLayerStack with highest render order */}
          <MistyLayerStack
            y={1.5}              // Position above crystal
            width={24}         // Wide coverage
            height={10}      // 2:1 aspect ratio with new texture
            layers={3}         // Multiple layers for depth
            opacity={0.1}      // Semi-transparent
            drift={{ x: 0.002, y: 0.0 }}  // Gentle drift
            pulseAmp={0.007}   // Subtle pulsing
            pulseFreq={0.1}    // Slow pulse frequency
            renderOrder={3000} // UPDATED: Highest render order to be on top
          />

          {/* Environment used for reflections only */}
          <Environment
            files={environmentProps.files || config?.environment?.hdri || hdriPathForTier('low')}
            background={false}
            environmentRotation={config?.environment?.rotation || [0, Math.PI * 0.7, 0]}
            environmentIntensity={config?.environment?.intensity ?? 7.0}
          />
          
          {/* Post-processing effects (unchanged) */}
          <EffectComposer
            key={ios26 ? 'ios26-no-msaa' : `msaa-${msaaSamples}`}
            enabled={true}
            multisampling={ios26 ? 0 : msaaSamples}
            frameBufferType={ios26 ? UnsignedByteType : HalfFloatType}
          >
            {/* Default minimal bloom when no effects are enabled */}
            <Bloom 
              intensity={Object.values(effectsEnabled || {}).some(Boolean) ? 0 : 0.0001}
              luminanceThreshold={1.0}
              luminanceSmoothing={0.9}
              radius={0.5}
              enabled={!Object.values(effectsEnabled || {}).some(Boolean)}
            />
            
            {effectsEnabled?.bloom && (
              <Bloom 
                luminanceThreshold={postProcessingConfig?.bloom?.luminanceThreshold || 0.05} 
                luminanceSmoothing={postProcessingConfig?.bloom?.luminanceSmoothing || 0.9} 
                intensity={postProcessingConfig?.bloom?.intensity || 1.0} 
                radius={postProcessingConfig?.bloom?.radius || 1.9} 
              />
            )}
            {effectsEnabled?.chromaticAberration && (
              <ChromaticAberration
                offset={postProcessingConfig?.chromaticAberration?.offset || [0.003, 0.003]}
                radialModulation={postProcessingConfig?.chromaticAberration?.radialModulation !== false}
                modulationOffset={postProcessingConfig?.chromaticAberration?.modulationOffset || 0.5}
              />
            )}

            {/* Sanitize HDR data before any full-screen overlays */}
            <primitive object={sanitizePass} />

            {effectsEnabled?.noise && (
              <Noise
                opacity={postProcessingConfig?.noise?.opacity || 0.1}
                blendFunction={BlendFunction.OVERLAY}
              />
            )}
            {effectsEnabled?.vignette && (
              <Vignette 
                eskil={postProcessingConfig?.vignette?.eskil || false} 
                offset={postProcessingConfig?.vignette?.offset || 0.1} 
                darkness={postProcessingConfig?.vignette?.darkness || 1.1} 
              />
            )}
          </EffectComposer>

          {/* Orbit controls - explicitly disabled to prevent camera conflicts */}
          {/* eslint-disable-next-line no-constant-binary-expression */}
          {false && !isMobile && (
            <OrbitControls
              makeDefault
              enabled={false}
              enableZoom={false}
              enablePan={false}
              enableRotate={false}
            />
          )}
        </Canvas>
      </div>

      {/* ADDED: External Debug Panels - Rendered outside Canvas */}
      {crystalSceneRef.current?.debugState && (
        <CrystalDebugPanels
          showCrystalDebug={debugData.showCrystalDebug}
          animationData={animationData}
          facetKeys={debugData.facetKeys}
          facetModels={[]} // Will be populated by the crystal scene
          facetRefs={{ current: crystalSceneRef.current.facetRefs || [] }}
          showWholeCrystal={debugData.showWholeCrystal}
          showFacets={debugData.showFacets}
          sphereVisible={debugData.sphereVisible}
          onForceShowFacets={debugData.debugMethods?.forceShowFacets}
          onForceShowWhole={debugData.debugMethods?.forceShowWhole}
          onInspectModels={debugData.debugMethods?.inspectModels}
          lastCrystalForm={debugData.lastCrystalForm}
          focusedSceneFacetKey={debugData.focusedSceneFacetKey}
          focusedProjectKey={debugData.focusedProjectKey}
          focusedFacetSlot={debugData.focusedFacetSlot}
        />
      )}
    </>
  );
});

export default Fixed3DCanvas;
