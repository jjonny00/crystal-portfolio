// FIXED: src/components/three/UnifiedCameraController.jsx
// Fixed hero orbit jump by adding stricter orbit initiation conditions

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { facetKeys as canonicalFacetKeys, getSceneFacetKeyByProjectId } from '../../data/projects';
import { createLogger } from '../../utils/logger';

const logger = createLogger('unified-camera-controller');

const UnifiedCameraController = ({
  animationData,
  config,
  restartToken = 0,
  isMobile = false,
  simplifiedAnimations = false,
  facetRefs = null,
  sharedCameraMoveProgressRef = null
}) => {
  const { camera } = useThree();
  console.log('[UnifiedCameraController] mounted/rendered');

  // Input context
  const isTouchDeviceRef = useRef(false);

  // Orbit tracking
  const lastPointerRef = useRef({ x: 0, y: 0, time: 0 });
  const orbitVelocityRef = useRef(new THREE.Vector2(0, 0));
  const targetOrbitVelocityRef = useRef(new THREE.Vector2(0, 0));
  const userControlStrengthRef = useRef(0);
  const lastPointerMoveTimeRef = useRef(0);
  const pointerDirectionRef = useRef(new THREE.Vector2(0, 0));
  const pointerDirectionDistanceRef = useRef(0);
  const pointerSwitchDistanceRef = useRef(0);

  // Orbit angles
  const heroPolarAngleRef = useRef(0);
  const orbitDistanceRef = useRef(0);
  const heroOrbitCenterRef = useRef(new THREE.Vector3());

  // Track orbital rotation around the crystal during hero state
  const heroOrbitAngle = useRef(0);
  const isOrbitingRef = useRef(false);
  const orbitRadiusRef = useRef(0);
  const orbitHeightRef = useRef(0);
  
  // Current camera target tracking
  const currentTarget = useRef({
    position: new THREE.Vector3(),
    lookAt: new THREE.Vector3(), 
    fov: 45
  });
  
  // Adaptive animation speeds based on distance
  const animationSpeed = useRef({
    position: 0.03,
    lookAt: 0.03,
    fov: 0.03
  });

  // Track last camera config to detect changes
  const lastCameraConfig = useRef(null);
  const cameraMoveBaselineRef = useRef({ position: 0, lookAt: 0, fov: 0 });
  const cameraMoveProgressRef = useRef(1);
  const projectTargetLockRef = useRef({
    facetKey: null,
    target: null,
    source: 'config'
  });

  // Track when camera has reached its target
  const settleFrameCount = useRef(0);
  const cameraSettledRef = useRef(false);
  const SETTLE_EPSILON = 0.01;
  const SETTLE_FRAMES = 5;

  // ADDED: Additional tracking for orbit initiation
  const orbitInitDelayRef = useRef(0);
  const ORBIT_DELAY_FRAMES = 30; // Wait 30 frames after settling before starting orbit
  const DEFAULT_HERO_TUNING = {
    radius: 7,
    height: 0.8,
    orbitSpeed: 0.08,
    baseAngle: 0,
    lookAtYOffset: 0,
  };
  const FORCE_STABLE_HERO_CAMERA = false;
  const lastCameraStateRef = useRef(null);
  const introStartedRef = useRef(false);
  const introPlayedRef = useRef(false);
  const introActiveRef = useRef(false);
  const introStartTimeRef = useRef(0);
  const introFromRef = useRef({
    position: new THREE.Vector3(),
    lookAt: new THREE.Vector3(),
    fov: 45
  });
  const introToRef = useRef({
    position: new THREE.Vector3(),
    lookAt: new THREE.Vector3(),
    fov: 45
  });
  const lastRestartTokenRef = useRef(0);
  const POINTER_IDLE_MS = 400;
  const POINTER_RETURN_DELAY = 0.25;
  const POINTER_RETURN_FADE = 0.7;
  const POINTER_DECAY = 0.992;
  const POINTER_DEADZONE = 0.00008;
  const POINTER_DIRECTION_DISTANCE = 0.00055;
  const POINTER_DIRECTION_DOT = 0.48;
  const POINTER_MAX_SPEED = 0.0021;
  const INTRO_DURATION_MS = 4400;
  const HERO_VERTICAL_FRAMING_SCALE = 0; // Temporary isolate: disable authored Y framing
  const HERO_VERTICAL_FRAMING_SIGN = 1;
  const FRACTURE_TILT_RADIANS = 0.045;
  const FRACTURE_PITCH_UP_RADIANS = -0.012;
  const FRACTURE_TILT_RELEASE_DISTANCE = 0.015;
  const fractureTiltRef = useRef(0);
  const fractureTiltActiveRef = useRef(false);
  const fractureTiltAnchorPositionRef = useRef(new THREE.Vector3());
  const fractureTiltAnchorLookAtRef = useRef(new THREE.Vector3());
  const introLookAtTempRef = useRef(new THREE.Vector3());
  const currentDirectionTempRef = useRef(new THREE.Vector3());
  const targetDirectionTempRef = useRef(new THREE.Vector3());
  const heroCompositionOffsetRef = useRef(new THREE.Vector3());
  const heroCompositionLateralRef = useRef(0);
  const heroVerticalOffsetRef = useRef(0);
  const newLookAtTempRef = useRef(new THREE.Vector3());
  const lastCrystalFormRef = useRef(animationData?.crystalForm ?? 'whole');
  const fractureJumpFrameRef = useRef(false);
  const lastDebugSecondRef = useRef(-1);
  const lastHeroOrbitDebugSecondRef = useRef(-1);
  const lastBranchDebugSecondRef = useRef(-1);
  const introFinalTargetDebugRef = useRef(new THREE.Vector3());
  const authoritativeHeroIntroToRef = useRef({
    position: new THREE.Vector3(),
    lookAtTarget: new THREE.Vector3(),
    filmOffsetX: 0,
    angle: 0,
    elapsed: 0,
  });
  const authoritativeHeroIntroCapturedRef = useRef(false);
  const heroOrbitStartTimeRef = useRef(0);
  const explosionSyncStartRef = useRef(null);
  const explosionFirstFrameLoggedRef = useRef(false);
  const explosionCameraTraceUntilRef = useRef(0);
  const firstPostHeroExplosionWriteLoggedRef = useRef(false);
  const lastAuthoritativeHeroSnapshotRef = useRef(null);
  const fractureTiltLockSeededRef = useRef(false);
  const heroExplosionTransitionRef = useRef({
    active: false,
    startedAt: 0,
    duration: 0.7,
    startPosition: new THREE.Vector3(),
    startLookAt: new THREE.Vector3(),
    destinationPosition: new THREE.Vector3(),
    destinationLookAt: new THREE.Vector3(),
    startFilmOffset: 0,
    destinationFilmOffset: 0,
  });
  const lastCameraWriteSecondRef = useRef(-1);
  const lastCameraWriterRef = useRef('none');
  const prevStateRef = useRef(animationData?.state ?? null);
  const prevCameraStateRef = useRef(animationData?.cameraState ?? null);
  const configCheckLoggedRef = useRef(false);
  const stableHeroPositionRef = useRef(new THREE.Vector3(0, 0.8, 7));

  const applyFractureTilt = () => {
    if (!fractureTiltActiveRef.current) return;

    if (
      Math.abs(fractureTiltRef.current) > 0.00001 ||
      Math.abs(FRACTURE_PITCH_UP_RADIANS) > 0.00001
    ) {
      camera.rotateX(FRACTURE_PITCH_UP_RADIANS);
      camera.rotateZ(fractureTiltRef.current);
    }

    if (animationData?.cameraState !== 'hero') {
      const movedDistance = camera.position.distanceTo(fractureTiltAnchorPositionRef.current);
      if (movedDistance > FRACTURE_TILT_RELEASE_DISTANCE) {
        fractureTiltActiveRef.current = false;
        fractureTiltRef.current = 0;
      }
    }
  };

  const syncFractureTiltState = (elapsedSeconds = 0) => {
    const currentCrystalForm = animationData?.crystalForm ?? 'whole';
    const previousCrystalForm = lastCrystalFormRef.current;

    if (previousCrystalForm !== 'exploded' && currentCrystalForm === 'exploded') {
      const shouldApplyHeroFractureTilt = animationData?.cameraState === 'hero';

      if (shouldApplyHeroFractureTilt) {
        const isPlainHero =
          animationData?.state === 'hero' &&
          animationData?.cameraState === 'hero' &&
          !animationData?.focusedProject &&
          !animationData?.focusedFacet;
        let seededFromAuthoritative = false;
        let authoritativeSnapshot = null;
        if (isPlainHero) {
          const beforeSyncPosition = camera.position.clone();
          const center = getHeroOrbitCenter();
          const { tuning } = resolveHeroTuning(config);
          const filmOffsetX = resolveHeroFilmOffsetX(center).value;
          authoritativeSnapshot = getCurrentAuthoritativeHeroSnapshot({
            elapsed: elapsedSeconds,
            center,
            tuning,
            filmOffsetX,
            orbitStartTime: heroOrbitStartTimeRef.current,
          });
          camera.position.copy(authoritativeSnapshot.position);
          camera.lookAt(authoritativeSnapshot.lookAtTarget);
          camera.filmOffset = authoritativeSnapshot.filmOffsetX;
          camera.updateProjectionMatrix();
          currentTarget.current.position.copy(authoritativeSnapshot.position);
          currentTarget.current.lookAt.copy(authoritativeSnapshot.lookAtTarget);
          seededFromAuthoritative = true;
          explosionSyncStartRef.current = {
            startPosition: authoritativeSnapshot.position.clone(),
            startLookAt: authoritativeSnapshot.lookAtTarget.clone(),
            destinationPosition: currentTarget.current.position.clone(),
            destinationLookAt: currentTarget.current.lookAt.clone(),
          };
          explosionFirstFrameLoggedRef.current = false;
          explosionCameraTraceUntilRef.current = elapsedSeconds + 1.5;
          firstPostHeroExplosionWriteLoggedRef.current = false;
          console.log('[UCC EXPLOSION SYNC START]', {
            state: animationData?.state,
            cameraState: animationData?.cameraState,
            focusedProject: animationData?.focusedProject ?? null,
            focusedFacet: animationData?.focusedFacet ?? null,
            cameraPositionBeforeSync: beforeSyncPosition.toArray(),
            authoritativeSnapshotPosition: authoritativeSnapshot.position.toArray(),
            authoritativeSnapshotLookAtTarget: authoritativeSnapshot.lookAtTarget.toArray(),
            authoritativeSnapshotFilmOffsetX: authoritativeSnapshot.filmOffsetX,
            transitionStartPositionAfterSync: camera.position.toArray(),
            transitionStartLookAtAfterSync: currentTarget.current.lookAt.toArray(),
            transitionDestinationPosition: currentTarget.current.position.toArray(),
            transitionDestinationLookAt: currentTarget.current.lookAt.toArray(),
            legacyHeroStartUsed: false,
          });
        }
        if (!seededFromAuthoritative) {
          // Snap to the current target immediately when fracture starts so the off-kilter pose is instant.
          camera.position.copy(currentTarget.current.position);
          camera.lookAt(currentTarget.current.lookAt);
        }
        fractureTiltRef.current = FRACTURE_TILT_RADIANS;
        fractureTiltActiveRef.current = true;
        fractureTiltAnchorPositionRef.current.copy(camera.position);
        fractureTiltAnchorLookAtRef.current.copy(currentTarget.current.lookAt);
        fractureJumpFrameRef.current = true;
      } else {
        fractureTiltActiveRef.current = false;
        fractureTiltRef.current = 0;
        fractureJumpFrameRef.current = false;
      }
    } else if (currentCrystalForm === 'whole') {
      fractureTiltActiveRef.current = false;
      fractureTiltRef.current = 0;
      fractureJumpFrameRef.current = false;
    }

    lastCrystalFormRef.current = currentCrystalForm;
  };

  const findAnchorInFacet = (facetKey) => {
    if (!facetRefs) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Camera Controller: No facet refs available for anchor search');
      }
      return null;
    }
    
    const facetIndex = canonicalFacetKeys.indexOf(facetKey);
    
    if (facetIndex === -1) {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ Camera Controller: Unknown facet key: ${facetKey}`);
      }
      return null;
    }
    
    const facetRef = facetRefs[facetIndex];
    
    if (!facetRef || !facetRef.current) {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ Camera Controller: Facet ref not available for ${facetKey} (index ${facetIndex})`);
      }
      return null;
    }
    
    const anchorName = `anchor_${facetKey}`;
    let anchorObject = null;
    
    anchorObject = facetRef.current.getObjectByName(anchorName);
    
    if (!anchorObject) {
      facetRef.current.traverse((child) => {
        if (child.name === anchorName) {
          anchorObject = child;
        }
      });
    }
    
    if (anchorObject) {
      const worldPosition = new THREE.Vector3();
      anchorObject.getWorldPosition(worldPosition);
      
      if (import.meta.env.DEV) {
        logger.debug(`🎯 Camera Controller: Fresh anchor position for ${facetKey}:`, {
          anchorName,
          worldPosition: worldPosition.toArray(),
          facetPosition: facetRef.current.position.toArray(),
          time: Date.now()
        });
      }
      
      return worldPosition;
    } else {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ Camera Controller: Anchor "${anchorName}" not found in facet ${facetKey}`);
      }
      return null;
    }
  };

  const getCameraTarget = (cameraConfig, focusedFacet, cameraState, focusedProjectId) => {
    const deviceKey = isMobile ? 'mobile' : 'desktop';
    const projectModeKey = cameraState === 'caseStudy' ? 'caseStudy' : 'selected';
    const authoredTarget =
      config?.projectCameraSettings?.[focusedProjectId]?.[deviceKey]?.[projectModeKey]?.target;
    const hasAuthoredTarget = authoredTarget !== undefined && authoredTarget !== null;
    if ((cameraState === 'project' || cameraState === 'caseStudy') && hasAuthoredTarget) {
      projectTargetLockRef.current = {
        facetKey: null,
        target: null,
        source: 'config'
      };

      return {
        ...cameraConfig,
        target: toVector3(authoredTarget),
        description: `${focusedFacet} ${cameraState} (authored target)`
      };
    }

    if ((cameraState === 'project' || cameraState === 'caseStudy') && focusedFacet && facetRefs) {
      const lockedTarget = projectTargetLockRef.current;
      const canRetargetFromConfig = !(
        lockedTarget.source === 'config' &&
        lockedTarget.facetKey === focusedFacet &&
        !cameraSettledRef.current
      );
      const shouldRefreshProjectTarget =
        lockedTarget.facetKey !== focusedFacet ||
        !lockedTarget.target ||
        (lockedTarget.source === 'config' && canRetargetFromConfig);

      if (shouldRefreshProjectTarget) {
        const anchorPosition = findAnchorInFacet(focusedFacet);

        if (anchorPosition) {
          projectTargetLockRef.current = {
            facetKey: focusedFacet,
            target: anchorPosition.clone(),
            source: 'anchor'
          };
        } else {
          const canSafelyFallbackToConfig = animationData?.crystalForm === 'exploded';

          if (canSafelyFallbackToConfig) {
            if (import.meta.env.DEV) {
              console.warn(`⚠️ Camera Controller: No anchor found for ${focusedFacet}, freezing config target for this move`);
            }

            projectTargetLockRef.current = {
              facetKey: focusedFacet,
              target: cameraConfig?.target ? cameraConfig.target.clone() : null,
              source: 'config'
            };
          } else {
            // During whole->exploded transitions, avoid freezing a config target.
            // Keep retrying anchor lookup until facets are in exploded state.
            projectTargetLockRef.current = {
              facetKey: focusedFacet,
              target: null,
              source: 'pending'
            };
          }
        }
      }

      if (projectTargetLockRef.current.target) {
        return {
          ...cameraConfig,
          target: projectTargetLockRef.current.target.clone(),
          description: `${focusedFacet} project (${projectTargetLockRef.current.source} locked)` 
        };
      }

      return {
        ...cameraConfig,
        description: `${focusedFacet} project (default target)`
      };
    }

    projectTargetLockRef.current = {
      facetKey: null,
      target: null,
      source: 'config'
    };
    
    return cameraConfig;
  };

  const toVector3 = (value) => {
    if (!value) {
      return new THREE.Vector3();
    }
    if (value.isVector3) {
      return value;
    }
    if (Array.isArray(value) && value.length >= 3) {
      return new THREE.Vector3(value[0], value[1], value[2]);
    }
    return new THREE.Vector3();
  };

  const getHeroOrbitCenter = () => {
    const centerValue = animationData?.crystalConfig?.positions?.center;
    if (Array.isArray(centerValue) && centerValue.length >= 3) {
      return new THREE.Vector3(centerValue[0], centerValue[1], centerValue[2]);
    }
    if (centerValue?.isVector3) {
      return centerValue.clone();
    }
    return heroOrbitCenterRef.current.clone();
  };


  const getHeroVerticalOffset = (center) => {
    const authoredHeroTarget = toVector3(config?.cameraTargets?.hero);
    const rawVerticalOffsetY = authoredHeroTarget.y - center.y;
    return rawVerticalOffsetY * HERO_VERTICAL_FRAMING_SCALE * HERO_VERTICAL_FRAMING_SIGN;
  };

  const resolveHeroTuning = (cameraConfig) => {
    const configured = cameraConfig?.cameraHeroTuning || cameraConfig?.camera?.heroTuning;
    const tuning = { ...DEFAULT_HERO_TUNING };
    let source = 'defaults';

    if (configured && typeof configured === 'object') {
      Object.keys(DEFAULT_HERO_TUNING).forEach((key) => {
        const value = configured[key];
        if (typeof value === 'number' && Number.isFinite(value)) {
          tuning[key] = value;
          source = 'camera.heroTuning';
        }
      });
    }

    return { tuning, source };
  };

  const resolveHeroFilmOffsetX = (center) => {
    const configuredFilmOffsetX = config?.cameraComposition?.hero?.filmOffsetX;
    if (typeof configuredFilmOffsetX === "number" && Number.isFinite(configuredFilmOffsetX)) {
      return { value: configuredFilmOffsetX, source: "composition.hero.filmOffsetX", legacyFallbackRan: false };
    }

    if (import.meta.env.DEV) {
      console.warn("[UCC HERO FILM OFFSET] Missing composition.hero.filmOffsetX; forcing 0 for test");
    }
    return { value: 0, source: "composition.hero.filmOffsetX missing (forced 0)", legacyFallbackRan: false };
  };

  const applyHeroFilmOffset = (center, branch = "hero") => {
    const resolved = resolveHeroFilmOffsetX(center);
    camera.filmOffset = resolved.value;
    if (import.meta.env.DEV) {
      console.log("[UCC HERO FILM OFFSET]", {
        branch,
        resolvedHeroFilmOffsetX: resolved.value,
        source: resolved.source,
        heroOrbitCenter: heroOrbitCenterRef.current.toArray(),
        heroLookAtTarget: center.toArray(),
        ignoreHeroTargetXForHorizontal: resolved.source === "composition.hero.filmOffsetX",
        finalFilmOffset: camera.filmOffset,
        legacyFallbackRan: resolved.legacyFallbackRan,
      });
    }
  };


  const updateAuthoritativeHeroCamera = ({ elapsed, center, filmOffsetX = 0, tuning }) => {
    const orbitElapsed = elapsed - heroOrbitStartTimeRef.current;
    const snapshot = getAuthoritativeHeroCameraSnapshot({
      elapsed: orbitElapsed,
      center,
      tuning,
      filmOffsetX,
    });
    camera.position.copy(snapshot.position);
    camera.lookAt(snapshot.lookAtTarget);
    camera.filmOffset = snapshot.filmOffsetX;
    camera.updateProjectionMatrix();
    return snapshot;
  };

  const getAuthoritativeHeroCameraSnapshot = ({ elapsed = 0, center, tuning, filmOffsetX, angleOverride }) => {
    const angle = Number.isFinite(angleOverride)
      ? angleOverride
      : tuning.baseAngle + elapsed * tuning.orbitSpeed;
    const position = new THREE.Vector3(
      center.x + Math.sin(angle) * tuning.radius,
      center.y + tuning.height,
      center.z + Math.cos(angle) * tuning.radius,
    );
    const lookAtTarget = new THREE.Vector3(center.x, center.y + tuning.lookAtYOffset, center.z);
    return {
      position,
      lookAtTarget,
      filmOffsetX: Number.isFinite(filmOffsetX) ? filmOffsetX : 0,
      angle,
      elapsed,
    };
  };

  const getCurrentAuthoritativeHeroSnapshot = ({ elapsed, center, tuning, filmOffsetX, orbitStartTime }) => {
    const orbitElapsed = elapsed - orbitStartTime;
    return getAuthoritativeHeroCameraSnapshot({
      elapsed: orbitElapsed,
      center,
      tuning,
      filmOffsetX,
    });
  };

  const syncHeroCameraRefs = (reason, { resetPosition = false } = {}) => {
    const heroCenter = getHeroOrbitCenter();
    const heroPosition = toVector3(config?.cameraPositions?.hero)
      .add(toVector3(config?.cameraOffsets?.global?.position))
      .add(toVector3(config?.cameraOffsets?.zones?.hero?.position));
    const heroTargetOffset = toVector3(config?.cameraOffsets?.global?.target)
      .add(toVector3(config?.cameraOffsets?.zones?.hero?.target));
    const authoredHeroTarget = toVector3(config?.cameraTargets?.hero)
      .add(heroTargetOffset);

    heroOrbitCenterRef.current.copy(heroCenter);
    heroCompositionOffsetRef.current.copy(heroTargetOffset);
    heroCompositionLateralRef.current = heroCompositionOffsetRef.current.x;
    heroVerticalOffsetRef.current = getHeroVerticalOffset(heroCenter);

    const heroLookAt = newLookAtTempRef.current.copy(heroCenter);
    heroLookAt.y += heroVerticalOffsetRef.current;
    currentTarget.current.lookAt.copy(heroLookAt);

    if (resetPosition) {
      currentTarget.current.position.copy(heroPosition);
      camera.position.copy(heroPosition);
      camera.lookAt(heroLookAt);
      camera.fov = currentTarget.current.fov ?? camera.fov;
      camera.updateProjectionMatrix();
    }

    if (import.meta.env.DEV) {
      console.log('[UCC HERO SYNC]', {
        reason,
        resetPosition,
        heroCenter: heroCenter.toArray(),
        heroPosition: heroPosition.toArray(),
        authoredHeroTarget: authoredHeroTarget.toArray(),
        heroLookAt: heroLookAt.toArray(),
        compositionLateral: heroCompositionLateralRef.current,
      });
    }
  };

  const vectorsEqual = (left, right) => {
    if (!left && !right) return true;
    if (!left || !right) return false;
    return left.equals(right);
  };

  const getConfigCameraState = (cameraState, focusedFacet, focusedProjectId) => {
    if (!config?.cameraPositions) return null;
    const deviceKey = isMobile ? 'mobile' : 'desktop';
    const resolveProjectViewSettings = () => {
      const selectedFromConfig = config?.projectCameraSettings?.[focusedProjectId]?.[deviceKey]?.selected;
      const caseStudyFromConfig = config?.projectCameraSettings?.[focusedProjectId]?.[deviceKey]?.caseStudy;
      const hasSelectedAuthoredPosition =
        Array.isArray(selectedFromConfig?.position) && selectedFromConfig.position.length === 3;
      const hasSelectedAuthoredTarget =
        Array.isArray(selectedFromConfig?.target) && selectedFromConfig.target.length === 3;
      const shouldUseLegacyEmergencyFallback =
        !hasSelectedAuthoredPosition || !hasSelectedAuthoredTarget;

      const selectedFallbackPosition = shouldUseLegacyEmergencyFallback
        ? toVector3(config.cameraPositions?.projects?.[focusedFacet])
        : null;
      const selectedFallbackTarget = shouldUseLegacyEmergencyFallback
        ? toVector3(config.cameraTargets?.projects?.[focusedFacet])
        : null;

      const selectedPosition = toVector3(selectedFromConfig?.position || selectedFallbackPosition);
      const selectedTarget = toVector3(selectedFromConfig?.target || selectedFallbackTarget);

      const authoredCaseStudyPosition = caseStudyFromConfig?.position
        ? toVector3(caseStudyFromConfig.position)
        : null;
      const authoredCaseStudyTarget = caseStudyFromConfig?.target
        ? toVector3(caseStudyFromConfig.target)
        : null;

      // Temporary debug behavior: force caseStudy noticeably closer unless clearly authored.
      const selectedDirection = new THREE.Vector3().subVectors(selectedPosition, selectedTarget);
      const selectedDistance = Math.max(selectedDirection.length(), 0.0001);
      const shouldForceCloserCaseStudy =
        !authoredCaseStudyPosition ||
        !authoredCaseStudyTarget;

      let caseStudyPosition = authoredCaseStudyPosition;
      let caseStudyTarget = authoredCaseStudyTarget;

      if (shouldForceCloserCaseStudy) {
        const closerDistance = Math.max(selectedDistance * 0.42, 0.55);
        const direction = selectedDirection.normalize();
        caseStudyTarget = selectedTarget.clone();
        caseStudyPosition = selectedTarget.clone().add(direction.multiplyScalar(closerDistance));
      }

      return {
        selected: {
          position: selectedPosition,
          target: selectedTarget
        },
        caseStudy: {
          position: caseStudyPosition || selectedPosition.clone(),
          target: caseStudyTarget || selectedTarget.clone()
        }
      };
    };

    if (cameraState === 'intro') {
      return {
        position: toVector3(config.cameraPositions.intro),
        target: toVector3(config.cameraTargets?.intro),
        fov: animationData?.cameraConfig?.fov,
        description: 'intro (layout/config)'
      };
    }

    if (cameraState === 'hero') {
      return {
        position: toVector3(config.cameraPositions.hero),
        target: toVector3(config.cameraTargets?.hero),
        fov: animationData?.cameraConfig?.fov,
        description: 'hero (layout/config)'
      };
    }

    if (cameraState === 'overview') {
      return {
        position: toVector3(config.cameraPositions.overview),
        target: toVector3(config.cameraTargets?.overview),
        fov: animationData?.cameraConfig?.fov,
        description: 'overview (layout/config)'
      };
    }

    if (cameraState === 'about') {
      return {
        position: toVector3(config.cameraPositions.about),
        target: toVector3(config.cameraTargets?.about),
        fov: animationData?.cameraConfig?.fov,
        description: 'about (layout/config)'
      };
    }

    if (cameraState === 'project' && focusedFacet) {
      if (isMobile) {
        const mobileSelected = config?.projectCameraSettings?.[focusedProjectId]?.mobile?.selected;
        if (mobileSelected?.position && mobileSelected?.target) {
          if (import.meta.env.DEV) {
            logger.debug('📹 [ProjectCamera Resolve]', {
              focusedProjectId,
              deviceKey,
              cameraState,
              selectedBranch: config?.projectCameraSettings?.[focusedProjectId]?.[deviceKey]?.selected || null,
              caseStudyBranch: config?.projectCameraSettings?.[focusedProjectId]?.[deviceKey]?.caseStudy || null,
              finalPosition: toVector3(mobileSelected.position).toArray(),
              finalTarget: toVector3(mobileSelected.target).toArray()
            });
          }
          return {
            position: toVector3(mobileSelected.position),
            target: toVector3(mobileSelected.target),
            fov: animationData?.cameraConfig?.fov,
            description: `${focusedFacet} project.selected (mobile authored)`
          };
        }
      }

      const projectViewSettings = resolveProjectViewSettings();
      if (import.meta.env.DEV) {
        logger.debug('📹 [ProjectCamera Resolve]', {
          focusedProjectId,
          deviceKey,
          cameraState,
          selectedBranch: config?.projectCameraSettings?.[focusedProjectId]?.[deviceKey]?.selected || null,
          caseStudyBranch: config?.projectCameraSettings?.[focusedProjectId]?.[deviceKey]?.caseStudy || null,
          finalPosition: projectViewSettings.selected.position?.toArray?.() || null,
          finalTarget: projectViewSettings.selected.target?.toArray?.() || null
        });
      }

      return {
        position: projectViewSettings.selected.position,
        target: projectViewSettings.selected.target,
        fov: animationData?.cameraConfig?.fov,
        description: `${focusedFacet} project.selected (projectCameraSettings)`
      };
    }

    if (cameraState === 'caseStudy' && focusedFacet) {
      if (isMobile) {
        const mobileCaseStudy = config?.projectCameraSettings?.[focusedProjectId]?.mobile?.caseStudy;
        if (mobileCaseStudy?.position && mobileCaseStudy?.target) {
          if (import.meta.env.DEV) {
            logger.debug('📹 [ProjectCamera Resolve]', {
              focusedProjectId,
              deviceKey,
              cameraState,
              selectedBranch: config?.projectCameraSettings?.[focusedProjectId]?.[deviceKey]?.selected || null,
              caseStudyBranch: config?.projectCameraSettings?.[focusedProjectId]?.[deviceKey]?.caseStudy || null,
              finalPosition: toVector3(mobileCaseStudy.position).toArray(),
              finalTarget: toVector3(mobileCaseStudy.target).toArray()
            });
          }
          return {
            position: toVector3(mobileCaseStudy.position),
            target: toVector3(mobileCaseStudy.target),
            fov: animationData?.cameraConfig?.fov,
            description: `${focusedFacet} caseStudy (mobile authored)`
          };
        }
      }

      const projectViewSettings = resolveProjectViewSettings();
      if (import.meta.env.DEV) {
        logger.debug('📹 [ProjectCamera Resolve]', {
          focusedProjectId,
          deviceKey,
          cameraState,
          selectedBranch: config?.projectCameraSettings?.[focusedProjectId]?.[deviceKey]?.selected || null,
          caseStudyBranch: config?.projectCameraSettings?.[focusedProjectId]?.[deviceKey]?.caseStudy || null,
          finalPosition: projectViewSettings.caseStudy.position?.toArray?.() || null,
          finalTarget: projectViewSettings.caseStudy.target?.toArray?.() || null
        });
      }

      return {
        position: projectViewSettings.caseStudy.position,
        target: projectViewSettings.caseStudy.target,
        fov: animationData?.cameraConfig?.fov,
        description: `${focusedFacet} caseStudy (projectCameraSettings)`
      };
    }

    return null;
  };

  useEffect(() => {
    currentTarget.current.position.copy(camera.position);
    currentTarget.current.fov = camera.fov;
    
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    currentTarget.current.lookAt.copy(camera.position).add(direction);
  }, [camera]);

  useEffect(() => {
    if (
      introActiveRef.current &&
      (animationData?.state !== 'hero' || animationData?.cameraState !== 'hero')
    ) {
      introActiveRef.current = false;
    }
  }, [animationData?.cameraState, animationData?.state]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches;
    isTouchDeviceRef.current = coarsePointer || 'ontouchstart' in window;
  }, []);

  useEffect(() => {
    if (
      !restartToken ||
      restartToken === lastRestartTokenRef.current ||
      !config?.cameraPositions?.intro ||
      !config?.cameraTargets?.intro
    ) {
      return;
    }

    lastRestartTokenRef.current = restartToken;

    const introPosition = toVector3(config.cameraPositions.intro)
      .add(toVector3(config?.cameraOffsets?.global?.position))
      .add(toVector3(config?.cameraOffsets?.zones?.intro?.position));
    const introTarget = toVector3(config.cameraTargets.intro)
      .add(toVector3(config?.cameraOffsets?.global?.target))
      .add(toVector3(config?.cameraOffsets?.zones?.intro?.target));
    const heroPosition = currentTarget.current.position.clone();
    const heroTarget = currentTarget.current.lookAt.clone();
    const heroOrbitCenter = getHeroOrbitCenter();
    const heroFov = currentTarget.current.fov ?? animationData?.cameraConfig?.fov ?? camera.fov;

    introStartedRef.current = true;
    introPlayedRef.current = false;
    introActiveRef.current = true;
    authoritativeHeroIntroCapturedRef.current = false;
    if (import.meta.env.DEV) console.log('[UCC INTRO] set active true', { reason: 'restart-token', restartToken });
    introStartTimeRef.current = performance.now();
    isOrbitingRef.current = false;
    orbitInitDelayRef.current = 0;
    cameraSettledRef.current = false;
    settleFrameCount.current = 0;

    introFromRef.current.position.copy(introPosition);
    introFromRef.current.lookAt.copy(introTarget);
    introFromRef.current.fov = heroFov;
    introToRef.current.position.copy(heroPosition);
    introToRef.current.lookAt.copy(heroTarget);
    introToRef.current.fov = heroFov;

    camera.position.copy(introPosition);
    camera.lookAt(introTarget);
    camera.fov = heroFov;
    camera.updateProjectionMatrix();

    currentTarget.current.position.copy(heroPosition);
    currentTarget.current.lookAt.copy(heroTarget);
    currentTarget.current.fov = heroFov;
    heroOrbitCenterRef.current.copy(heroOrbitCenter);
    heroCompositionOffsetRef.current.copy(heroTarget).sub(heroOrbitCenter);
    heroCompositionLateralRef.current = heroCompositionOffsetRef.current.x;
    heroVerticalOffsetRef.current = getHeroVerticalOffset(heroOrbitCenter);

    cameraMoveProgressRef.current = 0;
    if (sharedCameraMoveProgressRef) sharedCameraMoveProgressRef.current = 0;
    animationData?.setCameraMoveProgress?.(0);
    animationData?.setCameraSettled?.(false);
  }, [animationData, camera, config, restartToken, sharedCameraMoveProgressRef]);


  useEffect(() => {
    if (typeof window === 'undefined' || isTouchDeviceRef.current) return undefined;

    const handlePointerMove = (event) => {
      if (animationData?.state !== 'hero' || animationData?.cameraState !== 'hero') {
        return;
      }

      if (!lastPointerRef.current.time) {
        lastPointerRef.current = { x: event.clientX, y: event.clientY, time: event.timeStamp };
        return;
      }

      const dx = event.clientX - lastPointerRef.current.x;
      const dy = event.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: event.clientX, y: event.clientY, time: event.timeStamp };

      const azimuthDelta = dx * 0.00044;
      const polarDelta = dy * 0.0003;

      const targetVelocity = targetOrbitVelocityRef.current;
      const nextVelocity = new THREE.Vector2(-azimuthDelta, polarDelta);
      const magnitude = nextVelocity.length();

      if (magnitude > POINTER_DEADZONE) {
        const nextDirection = nextVelocity.clone().normalize();
        const currentDirection = pointerDirectionRef.current;
        const hasDirection = currentDirection.lengthSq() > 1e-6;
        const dot = hasDirection ? currentDirection.dot(nextDirection) : 1;

        if (!hasDirection || dot >= POINTER_DIRECTION_DOT) {
          currentDirection.copy(nextDirection);
          pointerDirectionDistanceRef.current = 0;
        } else {
          pointerDirectionDistanceRef.current += magnitude;
          if (pointerDirectionDistanceRef.current >= POINTER_DIRECTION_DISTANCE) {
            currentDirection.copy(nextDirection);
            pointerDirectionDistanceRef.current = 0;
          }
        }

        const speed = Math.min(magnitude, POINTER_MAX_SPEED);
        targetVelocity.copy(currentDirection).multiplyScalar(speed);
        pointerSwitchDistanceRef.current = 0;
      } else {
        pointerSwitchDistanceRef.current += magnitude;
      }

      targetVelocity.clampLength(0, POINTER_MAX_SPEED);
      lastPointerMoveTimeRef.current = event.timeStamp;
      userControlStrengthRef.current = 1;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [animationData?.cameraState, animationData?.state]);

  useEffect(() => {
    // FIXED: Reset orbit state when camera state changes
    if (animationData?.cameraState !== lastCameraStateRef.current) {
      const previousCameraState = lastCameraStateRef.current;
      isOrbitingRef.current = false;
      orbitInitDelayRef.current = 0;
      lastCameraStateRef.current = animationData?.cameraState;
      lastPointerRef.current = { x: 0, y: 0, time: 0 };
      lastPointerMoveTimeRef.current = 0;
      pointerDirectionRef.current.set(0, 0);
      pointerDirectionDistanceRef.current = 0;
      pointerSwitchDistanceRef.current = 0;
      targetOrbitVelocityRef.current.set(0, 0);
      orbitVelocityRef.current.set(0, 0);

      if (animationData?.cameraState === 'hero' && previousCameraState !== 'hero') {
        syncHeroCameraRefs('cameraState-transition-to-hero', { resetPosition: false });
      }

      if (animationData?.cameraState === 'intro' && config?.cameraPositions?.intro && config?.cameraTargets?.intro) {
        const introPosition = toVector3(config.cameraPositions.intro);
        const introTarget = toVector3(config.cameraTargets.intro);
        const introFov = animationData?.cameraConfig?.fov ?? currentTarget.current.fov ?? camera.fov;

        introStartedRef.current = false;
        introPlayedRef.current = false;
        introActiveRef.current = false;
        lastCameraConfig.current = null;
        cameraSettledRef.current = false;
        settleFrameCount.current = 0;
        cameraMoveProgressRef.current = 0;
        if (sharedCameraMoveProgressRef) sharedCameraMoveProgressRef.current = 0;
        animationData?.setCameraMoveProgress?.(0);
        animationData?.setCameraSettled?.(false);

        camera.position.copy(introPosition);
        camera.lookAt(introTarget);
        camera.fov = introFov;
        camera.updateProjectionMatrix();
        currentTarget.current.position.copy(introPosition);
        currentTarget.current.lookAt.copy(introTarget);
        currentTarget.current.fov = introFov;
        const heroOrbitCenter = getHeroOrbitCenter();
        heroOrbitCenterRef.current.copy(heroOrbitCenter);
        heroCompositionOffsetRef.current.copy(currentTarget.current.lookAt).sub(heroOrbitCenter);
        heroCompositionLateralRef.current = heroCompositionOffsetRef.current.x;
        heroVerticalOffsetRef.current = getHeroVerticalOffset(heroOrbitCenter);
      }
      
      if (import.meta.env.DEV) {
        logger.debug('📹 Camera state changed, resetting orbit:', animationData?.cameraState);
      }
    }

    // During fracture pauses, hold camera at its current position
    if (
      (animationData?.state === 'overview' && animationData?.cameraState === 'hero') ||
      (animationData?.state === 'hero' && animationData?.cameraState === 'overview')
    ) {
      isOrbitingRef.current = false;
      return;
    }

    if (!animationData?.cameraConfig && !config?.cameraPositions) return;

    if (import.meta.env.DEV) {
      const deviceKey = isMobile ? 'mobile' : 'desktop';
      logger.debug('[controller-preuse] config fields', {
        deviceKey,
        'camera.positions.hero': config?.cameraPositions?.hero ?? null,
        'camera.projects.leadership.selected.position':
          config?.projectCameraSettings?.project01?.[deviceKey]?.selected?.position ?? null,
        'camera.projects.leadership.caseStudy.target':
          config?.projectCameraSettings?.project01?.[deviceKey]?.caseStudy?.target ?? null
      });
    }

    const focusedProject = animationData.focusedProject ?? null;
    const focusedFacet = animationData.focusedFacet;
    const resolvedFocusedFacet = focusedProject
      ? (getSceneFacetKeyByProjectId(focusedProject) || focusedFacet)
      : focusedFacet;
    const cameraState = animationData.cameraState;
    const configCameraState = getConfigCameraState(cameraState, resolvedFocusedFacet, focusedProject);
    const baseConfig = configCameraState || animationData.cameraConfig;
    if (!baseConfig) return;
    
    const isProjectLikeCameraState = (cameraState === 'project' || cameraState === 'caseStudy');
    const shouldBypassProjectTargetProcessing =
      isMobile &&
      isProjectLikeCameraState &&
      Boolean(focusedProject) &&
      baseConfig?.position &&
      baseConfig?.target;
    const enhancedConfig = shouldBypassProjectTargetProcessing
      ? baseConfig
      : getCameraTarget(baseConfig, resolvedFocusedFacet, cameraState, focusedProject);
    const configuredOffsetPosition = isProjectLikeCameraState && resolvedFocusedFacet
      ? (isMobile ? null : config?.cameraOffsets?.projects?.[resolvedFocusedFacet]?.position)
      : config?.cameraOffsets?.zones?.[cameraState]?.position;
    const configuredOffsetTarget = isProjectLikeCameraState && resolvedFocusedFacet
      ? (isMobile ? null : config?.cameraOffsets?.projects?.[resolvedFocusedFacet]?.target)
      : config?.cameraOffsets?.zones?.[cameraState]?.target;

    const offsetPosition = toVector3(configuredOffsetPosition ?? enhancedConfig?.offsetPosition);
    const offsetTarget = toVector3(configuredOffsetTarget ?? enhancedConfig?.offsetTarget);
    offsetPosition.add(toVector3(config?.cameraOffsets?.global?.position));
    offsetTarget.add(toVector3(config?.cameraOffsets?.global?.target));
    const basePosition = enhancedConfig?.position ? enhancedConfig.position.clone() : null;
    const baseTarget = enhancedConfig?.target ? enhancedConfig.target.clone() : null;
    const finalPosition = basePosition ? basePosition.add(offsetPosition) : null;
    const finalTarget = baseTarget ? baseTarget.add(offsetTarget) : null;
    const orbitCenterTarget = baseTarget
      ? baseTarget.clone().add(toVector3(config?.cameraOffsets?.global?.target))
      : null;

    if (!enhancedConfig) {
      if (import.meta.env.DEV) {
        console.warn('📹 Camera Controller: No camera configuration available');
      }
      return;
    }

    const configChanged = !lastCameraConfig.current ||
      !vectorsEqual(finalPosition, lastCameraConfig.current.position) ||
      !vectorsEqual(finalTarget, lastCameraConfig.current.target) ||
      enhancedConfig.fov !== lastCameraConfig.current.fov ||
      enhancedConfig.description !== lastCameraConfig.current.description;

    if (configChanged) {
      if (import.meta.env.DEV) {
        const deviceMode = isMobile ? 'mobile' : 'desktop';
        const selectedConfigPosition =
          config?.projectCameraSettings?.[focusedProject]?.[deviceMode]?.selected?.position
          || null;
        const caseStudyConfigPosition =
          config?.projectCameraSettings?.[focusedProject]?.[deviceMode]?.caseStudy?.position
          || null;
        logger.debug('📹 Camera Controller: Enhanced camera target updated:', {
          state: animationData.state,
          cameraState: cameraState,
          viewMode: animationData?.viewMode ?? cameraState,
          activeProjectId: animationData?.focusedProject ?? null,
          deviceMode,
          focusedFacet: resolvedFocusedFacet,
          selectedPosition: selectedConfigPosition,
          caseStudyPosition: caseStudyConfigPosition,
          position: finalPosition?.toArray(),
          target: finalTarget?.toArray(),
          finalDestination: finalPosition?.toArray(),
          fov: enhancedConfig.fov,
          description: enhancedConfig.description 
        });
        logger.debug('📷 Effective hero/overview from config:', {
          hero: {
            position: config?.cameraPositions?.hero,
            target: config?.cameraTargets?.hero,
          },
          overview: {
            position: config?.cameraPositions?.overview,
            target: config?.cameraTargets?.overview,
          },
        });
      }

      if (finalPosition) {
        currentTarget.current.position.copy(finalPosition);
      }
      
      if (finalTarget) {
        currentTarget.current.lookAt.copy(finalTarget);
        if (cameraState === 'hero') {
          console.log('[UCC HERO CONFIG SOURCE]', {
            baseTarget: baseTarget?.toArray?.() || null,
            offsetTarget: offsetTarget?.toArray?.() || null,
            finalTarget: finalTarget?.toArray?.() || null,
            desktopHeroTarget: config?.cameraTargets?.hero ?? null,
            usingHeroCenterAsPivot: true,
          });
          syncHeroCameraRefs('config-changed-hero', { resetPosition: false });
        }
      }
      
      if (enhancedConfig.fov !== undefined) {
        currentTarget.current.fov = enhancedConfig.fov;
      }

      const shouldRunIntro =
        !introStartedRef.current &&
        !introPlayedRef.current &&
        !introActiveRef.current &&
        animationData?.state === 'hero' &&
        cameraState === 'hero' &&
        config?.cameraPositions?.intro &&
        config?.cameraTargets?.intro &&
        finalPosition &&
        finalTarget;

      if (shouldRunIntro) {
        const currentDirection = new THREE.Vector3();
        camera.getWorldDirection(currentDirection);

        introStartedRef.current = true;
        introActiveRef.current = true;
        authoritativeHeroIntroCapturedRef.current = false;
        introStartTimeRef.current = performance.now();
        introFromRef.current.position.copy(camera.position);
        introFromRef.current.lookAt.copy(camera.position).add(currentDirection);
        introFromRef.current.fov = camera.fov;
        const heroOrbitCenter = getHeroOrbitCenter();
        introToRef.current.position.copy(finalPosition);
        introToRef.current.lookAt.copy(heroOrbitCenter);
        introToRef.current.lookAt.y += getHeroVerticalOffset(heroOrbitCenter);
        introFinalTargetDebugRef.current.copy(finalTarget);
        heroOrbitCenterRef.current.copy(heroOrbitCenter);
        heroCompositionOffsetRef.current.copy(finalTarget).sub(heroOrbitCenter);
        heroCompositionLateralRef.current = heroCompositionOffsetRef.current.x;
        heroVerticalOffsetRef.current = getHeroVerticalOffset(heroOrbitCenter);
        introToRef.current.fov = enhancedConfig.fov ?? camera.fov;
        if (import.meta.env.DEV) console.log('[UCC INTRO] set active true', { reason: 'config-change shouldRunIntro', finalTarget: finalTarget?.toArray?.(), heroOrbitCenter: heroOrbitCenter.toArray() });
      }

      const positionDistance = camera.position.distanceTo(currentTarget.current.position);
      
      if (animationData.state === 'hero' && positionDistance > 3) {
        animationSpeed.current.position = 0.025;
        animationSpeed.current.lookAt = 0.025;
        animationSpeed.current.fov = 0.025;
      } else if (animationData.state === 'overview' && positionDistance > 2) {
        animationSpeed.current.position = 0.035;
        animationSpeed.current.lookAt = 0.035;
        animationSpeed.current.fov = 0.035;
      } else if (animationData.state === 'about' && positionDistance > 2) {
        animationSpeed.current.position = 0.02;
        animationSpeed.current.lookAt = 0.02;
        animationSpeed.current.fov = 0.02;
      } else if (isProjectLikeCameraState && resolvedFocusedFacet) {
        animationSpeed.current.position = 0.05;
        animationSpeed.current.lookAt = 0.05;
        animationSpeed.current.fov = 0.05;
        
        if (import.meta.env.DEV) {
          logger.debug(`📹 Camera Controller: Project focus camera update: ${resolvedFocusedFacet}, distance: ${positionDistance.toFixed(2)}, using anchor: ${enhancedConfig.description?.includes('anchor')}`);
        }
      } else {
        animationSpeed.current.position = 0.03;
        animationSpeed.current.lookAt = 0.03;
        animationSpeed.current.fov = 0.03;
      }

      const currentViewDirection = new THREE.Vector3();
      camera.getWorldDirection(currentViewDirection);
      const targetViewDirection = finalTarget
        ? new THREE.Vector3().subVectors(finalTarget, camera.position).normalize()
        : currentViewDirection.clone();

      cameraMoveBaselineRef.current = {
        position: finalPosition ? camera.position.distanceTo(finalPosition) : 0,
        lookAt: currentViewDirection.angleTo(targetViewDirection),
        fov: Math.abs((enhancedConfig.fov ?? camera.fov) - camera.fov)
      };

      lastCameraConfig.current = {
        position: finalPosition ? finalPosition.clone() : null,
        target: finalTarget ? finalTarget.clone() : null,
        fov: enhancedConfig.fov,
        description: enhancedConfig.description
      };

      orbitVelocityRef.current.set(0, 0);
      userControlStrengthRef.current = 0;
      isOrbitingRef.current = false;

      // FIXED: Reset settle tracking when new config is applied
      settleFrameCount.current = 0;
      cameraSettledRef.current = false;
      orbitInitDelayRef.current = 0; // ADDED: Reset orbit delay
      if (sharedCameraMoveProgressRef) sharedCameraMoveProgressRef.current = 0;
      animationData?.setCameraMoveProgress?.(0);
      if (animationData?.cameraSettled) {
        animationData.setCameraSettled(false);
      }
    }

    // Reset orbit when switching camera states and derive starting angle for hero
    if (cameraState === 'hero' && finalPosition) {
      heroOrbitAngle.current = Math.atan2(
        finalPosition.x,
        finalPosition.z
      );
      const relativeToCenter = new THREE.Vector3().subVectors(
        finalPosition,
        heroOrbitCenterRef.current
      );

      const horizontalRadius = Math.sqrt(
        relativeToCenter.x * relativeToCenter.x +
        relativeToCenter.z * relativeToCenter.z
      );
      const totalRadius = Math.sqrt(
        relativeToCenter.x * relativeToCenter.x +
        relativeToCenter.y * relativeToCenter.y +
        relativeToCenter.z * relativeToCenter.z
      );
      orbitRadiusRef.current = horizontalRadius;
      orbitHeightRef.current = relativeToCenter.y;
      orbitDistanceRef.current = totalRadius;
      heroPolarAngleRef.current = Math.atan2(
        relativeToCenter.y,
        horizontalRadius || 0.0001
      );
      // FIXED: Don't immediately set isOrbitingRef here
    } else {
      isOrbitingRef.current = false;
    }
  }, [
    animationData?.cameraConfig,
    animationData?.state,
    animationData?.cameraState,
    animationData?.focusedFacet,
    animationData?.focusedProject,
    config?.cameraPositions,
    config?.cameraTargets,
    config?.cameraOffsets,
    config?.projectCameraSettings,
    facetRefs,
    isMobile,
    camera
  ]);


  const logCameraWrite = (state, branch, reason, lookAtTarget = null, projectionUpdated = false, returns = false) => {
    lastCameraWriterRef.current = branch;
    if (!configCheckLoggedRef.current) {
      configCheckLoggedRef.current = true;
      const filmOffsetX = config?.cameraComposition?.hero?.filmOffsetX;
      console.log('[UCC CONFIG CHECK]', {
        cameraComposition: config?.cameraComposition ?? null,
        cameraDotComposition: config?.camera?.composition ?? null,
        heroComposition: config?.cameraComposition?.hero ?? null,
        heroFilmOffsetX: filmOffsetX,
        heroFilmOffsetXIsFinite: Number.isFinite(filmOffsetX),
        layoutVariant: config?.layoutVariant ?? null,
        desktopFilmOffsetPresent: config?.cameraComposition?.hero?.filmOffsetX ?? null,
      });
    }

    const debugSecond = Math.floor(state.clock.elapsedTime);
    if (debugSecond % 2 !== 0 || debugSecond === lastCameraWriteSecondRef.current) return;
    lastCameraWriteSecondRef.current = debugSecond;
    console.log(`[UCC CAMERA WRITE] ${branch}`, {
      elapsed: state.clock.elapsedTime,
      reason,
      state: animationData?.state,
      cameraState: animationData?.cameraState,
      focusedProject: animationData?.focusedProject ?? null,
      focusedFacet: animationData?.focusedFacet ?? null,
      introActive: introActiveRef.current,
      introStarted: introStartedRef.current,
      introPlayed: introPlayedRef.current,
      cameraPosition: camera.position.toArray(),
      lookAtTarget: lookAtTarget?.toArray?.() || null,
      filmOffset: camera.filmOffset,
      fov: camera.fov,
      projectionUpdated,
      returns
    });

    const inExplosionTraceWindow = state.clock.elapsedTime <= explosionCameraTraceUntilRef.current;
    if (inExplosionTraceWindow) {
      console.log('[UCC EXPLOSION CAMERA WRITE TRACE]', {
        elapsed: state.clock.elapsedTime,
        branch,
        reason,
        state: animationData?.state,
        cameraState: animationData?.cameraState,
        focusedProject: animationData?.focusedProject ?? null,
        focusedFacet: animationData?.focusedFacet ?? null,
        crystalForm: animationData?.crystalForm ?? null,
        cameraPositionAfter: camera.position.toArray(),
        lookAtTargetUsed: lookAtTarget?.toArray?.() || null,
        filmOffset: camera.filmOffset,
        fov: camera.fov,
        transitionProgress: cameraMoveProgressRef.current,
        sourceRefs: {
          currentTargetPosition: currentTarget.current?.position?.toArray?.() || null,
          currentTargetLookAt: currentTarget.current?.lookAt?.toArray?.() || null,
          fractureTiltAnchorPosition: fractureTiltAnchorPositionRef.current?.toArray?.() || null,
          fractureTiltAnchorLookAt: fractureTiltAnchorLookAtRef.current?.toArray?.() || null,
          explosionSyncStartPosition: explosionSyncStartRef.current?.startPosition?.toArray?.() || null,
          explosionSyncStartLookAt: explosionSyncStartRef.current?.startLookAt?.toArray?.() || null,
          explosionSyncDestinationPosition: explosionSyncStartRef.current?.destinationPosition?.toArray?.() || null,
          explosionSyncDestinationLookAt: explosionSyncStartRef.current?.destinationLookAt?.toArray?.() || null,
          finalTarget: lastCameraConfig.current?.target?.toArray?.() || null,
          baseTarget: config?.cameraTargets?.hero ?? null,
          offsetTarget: config?.cameraOffsets?.zones?.hero?.target ?? null,
        },
      });

      if (!firstPostHeroExplosionWriteLoggedRef.current && branch !== 'AUTHORITATIVE_HERO') {
        firstPostHeroExplosionWriteLoggedRef.current = true;
        console.log('[UCC FIRST POST-HERO EXPLOSION CAMERA WRITE]', {
          branch,
          reason,
          previousAuthoritativeHeroSnapshotPosition:
            lastAuthoritativeHeroSnapshotRef.current?.position?.toArray?.() || null,
          previousAuthoritativeHeroSnapshotLookAt:
            lastAuthoritativeHeroSnapshotRef.current?.lookAtTarget?.toArray?.() || null,
          cameraPositionImmediatelyAfterWrite: camera.position.toArray(),
          lookAtAfterWrite: lookAtTarget?.toArray?.() || null,
          sourceCurrentTargetPosition: currentTarget.current?.position?.toArray?.() || null,
          sourceCurrentTargetLookAt: currentTarget.current?.lookAt?.toArray?.() || null,
        });
      }
    }
  };

  useFrame((state, deltaTime) => {
    syncFractureTiltState(state.clock.elapsedTime);

    const debugSecond = Math.floor(state.clock.elapsedTime);

    const prevState = prevStateRef.current;
    const prevCameraState = prevCameraStateRef.current;
    const nextState = animationData?.state ?? null;
    const nextCameraState = animationData?.cameraState ?? null;
    const isReturnToHero =
      nextState === 'hero' &&
      nextCameraState === 'hero' &&
      (prevState !== 'hero' || prevCameraState !== 'hero');

    if (isReturnToHero) {
      console.log('[UCC HERO RETURN TRANSITION]', {
        prevState,
        prevCameraState,
        nextState,
        nextCameraState,
        cameraPosition: camera.position.toArray(),
        heroOrbitCenter: heroOrbitCenterRef.current.toArray(),
        introActive: introActiveRef.current,
        introStarted: introStartedRef.current,
        introPlayed: introPlayedRef.current,
        filmOffset: camera.filmOffset,
      });
    }

    prevStateRef.current = nextState;
    prevCameraStateRef.current = nextCameraState;

    if (debugSecond !== lastDebugSecondRef.current && debugSecond % 2 === 0) {
      lastDebugSecondRef.current = debugSecond;
      console.log('[UnifiedCameraController] useFrame running', {
        elapsed: state.clock.elapsedTime,
        cameraPosition: camera.position.toArray(),
        cameraFilmOffset: camera.filmOffset,
      });
    }
    const isEvenDebugSecond = debugSecond % 2 === 0;
    const shouldLogBranch = isEvenDebugSecond && debugSecond !== lastBranchDebugSecondRef.current;
    if (shouldLogBranch) {
      lastBranchDebugSecondRef.current = debugSecond;
      console.log('[UCC STATE SNAPSHOT]', {
        elapsed: state.clock.elapsedTime,
        state: animationData?.state,
        cameraState: animationData?.cameraState,
        focusedProject: animationData?.focusedProject ?? null,
        focusedFacet: animationData?.focusedFacet ?? null,
        isIntroActive: introActiveRef.current,
        introStarted: introStartedRef.current,
        introPlayed: introPlayedRef.current,
        isOrbiting: isOrbitingRef.current,
        fractureTiltActive: fractureTiltActiveRef.current,
        simplifiedAnimations,
        hasCurrentTarget: Boolean(currentTarget.current),
        cameraFilmOffset: camera.filmOffset,
      });
    }

    const isAuthoritativePlainHero =
      animationData?.state === 'hero' &&
      animationData?.cameraState === 'hero' &&
      !animationData?.focusedProject &&
      !animationData?.focusedFacet;

    if (isReturnToHero && isAuthoritativePlainHero) {
      heroOrbitStartTimeRef.current = state.clock.elapsedTime;
    }

    if (isAuthoritativePlainHero && introActiveRef.current) {
      const center = getHeroOrbitCenter();
      const { tuning } = resolveHeroTuning(config);
      const resolvedFilmOffsetX = resolveHeroFilmOffsetX(center).value;

      if (!authoritativeHeroIntroCapturedRef.current) {
        authoritativeHeroIntroCapturedRef.current = true;
        const introDestination = getAuthoritativeHeroCameraSnapshot({
          center,
          tuning,
          filmOffsetX: resolvedFilmOffsetX,
          angleOverride: tuning.baseAngle,
        });
        authoritativeHeroIntroToRef.current.position.copy(introDestination.position);
        authoritativeHeroIntroToRef.current.lookAtTarget.copy(introDestination.lookAtTarget);
        authoritativeHeroIntroToRef.current.filmOffsetX = introDestination.filmOffsetX;
        authoritativeHeroIntroToRef.current.angle = introDestination.angle;
        authoritativeHeroIntroToRef.current.elapsed = introDestination.elapsed;
        introFromRef.current.position.copy(camera.position);
        introFromRef.current.lookAt.copy(currentTarget.current?.lookAt || center);
      }

      const destination = authoritativeHeroIntroToRef.current;
      const elapsedMs = performance.now() - introStartTimeRef.current;
      const progress = THREE.MathUtils.clamp(elapsedMs / INTRO_DURATION_MS, 0, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const positionProgress = progress < 0.5
        ? 4 * Math.pow(progress, 3)
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const introLookAt = introLookAtTempRef.current.lerpVectors(
        introFromRef.current.lookAt,
        destination.lookAtTarget,
        easedProgress,
      );
      camera.position.lerpVectors(
        introFromRef.current.position,
        destination.position,
        positionProgress,
      );
      camera.lookAt(introLookAt);
      camera.filmOffset = destination.filmOffsetX;
      camera.updateProjectionMatrix();

      const completedThisFrame = progress >= 1;
      if (completedThisFrame) {
        introActiveRef.current = false;
        introPlayedRef.current = true;
        camera.position.copy(destination.position);
        camera.lookAt(destination.lookAtTarget);
        camera.filmOffset = destination.filmOffsetX;
        camera.updateProjectionMatrix();
        heroOrbitStartTimeRef.current = state.clock.elapsedTime;
        authoritativeHeroIntroCapturedRef.current = false;
      }
      return;
    }

    if (isAuthoritativePlainHero) {
      const center = getHeroOrbitCenter();
      const { tuning, source: tuningSource } = resolveHeroTuning(config);
      const configuredFilmOffsetX = config?.cameraComposition?.hero?.filmOffsetX;
      const resolvedFilmOffsetX = Number.isFinite(configuredFilmOffsetX) ? configuredFilmOffsetX : 0;
      const snapshot = updateAuthoritativeHeroCamera({
        elapsed: state.clock.elapsedTime,
        center,
        filmOffsetX: resolvedFilmOffsetX,
        tuning,
      });
      lastAuthoritativeHeroSnapshotRef.current = {
        position: snapshot.position.clone(),
        lookAtTarget: snapshot.lookAtTarget.clone(),
      };
      logCameraWrite(state, "AUTHORITATIVE_HERO", "authoritative-hero-update", snapshot.lookAtTarget, true, true);
      if (shouldLogBranch) {
        console.log('[UCC AUTHORITATIVE HERO]', {
          radius: tuning.radius,
          height: tuning.height,
          orbitSpeed: tuning.orbitSpeed,
          baseAngle: tuning.baseAngle,
          lookAtYOffset: tuning.lookAtYOffset,
          tuningSource,
          filmOffsetX: resolvedFilmOffsetX,
          center: center.toArray(),
          cameraPosition: camera.position.toArray(),
          lookAtTarget: snapshot.lookAtTarget.toArray(),
          state: animationData?.state,
          cameraState: animationData?.cameraState,
        });
      }
      return;
    }

    if (fractureJumpFrameRef.current) {
      fractureJumpFrameRef.current = false;
      camera.fov = currentTarget.current.fov;
      camera.updateProjectionMatrix();
      logCameraWrite(state, "TRANSITION", "fracture-jump-frame", fractureTiltAnchorLookAtRef.current, true, true);
      if (debugSecond !== lastHeroOrbitDebugSecondRef.current && debugSecond % 2 === 0) {
        lastHeroOrbitDebugSecondRef.current = debugSecond;
        console.log('[UnifiedCameraController] HERO ORBIT BRANCH ACTIVE', {
          finalFilmOffset: camera.filmOffset,
          cameraPosition: camera.position.toArray(),
        });
      }

      applyFractureTilt();
      if (shouldLogBranch) console.log('[UCC RETURN] reason: fracture-jump-frame');
      return;
    }

    if (
      fractureTiltActiveRef.current &&
      animationData?.crystalForm === 'exploded' &&
      animationData?.cameraState === 'hero'
    ) {
      const isPlainHero =
        animationData?.state === 'hero' &&
        !animationData?.focusedProject &&
        !animationData?.focusedFacet;
      let authoritativeSnapshot = null;
      if (isPlainHero && !fractureTiltLockSeededRef.current) {
        const center = getHeroOrbitCenter();
        const { tuning } = resolveHeroTuning(config);
        const filmOffsetX = resolveHeroFilmOffsetX(center).value;
        authoritativeSnapshot = getCurrentAuthoritativeHeroSnapshot({
          elapsed: state.clock.elapsedTime,
          center,
          tuning,
          filmOffsetX,
          orbitStartTime: heroOrbitStartTimeRef.current,
        });
        fractureTiltAnchorPositionRef.current.copy(authoritativeSnapshot.position);
        fractureTiltAnchorLookAtRef.current.copy(authoritativeSnapshot.lookAtTarget);
        fractureTiltLockSeededRef.current = true;
      }
      if (!explosionFirstFrameLoggedRef.current && explosionSyncStartRef.current) {
        explosionFirstFrameLoggedRef.current = true;
        const start = explosionSyncStartRef.current;
        console.log('[UCC EXPLOSION FIRST FRAME]', {
          cameraPosition: camera.position.toArray(),
          lookAtTarget: fractureTiltAnchorLookAtRef.current.toArray(),
          filmOffset: camera.filmOffset,
          transitionProgress: 0,
          startPosition: start.startPosition.toArray(),
          destinationPosition: start.destinationPosition.toArray(),
        });
      }
      const beforePosition = camera.position.clone();
      camera.position.copy(fractureTiltAnchorPositionRef.current);
      currentTarget.current.position.copy(fractureTiltAnchorPositionRef.current);
      camera.lookAt(fractureTiltAnchorLookAtRef.current);
      currentTarget.current.lookAt.copy(fractureTiltAnchorLookAtRef.current);
      camera.fov = currentTarget.current.fov;
      camera.updateProjectionMatrix();
      logCameraWrite(state, "TRANSITION", "fracture-tilt-lock", fractureTiltAnchorLookAtRef.current, true, true);
      console.log('[UCC FRACTURE TILT LOCK CAMERA]', {
        cameraPositionBeforeWrite: beforePosition.toArray(),
        cameraPositionAfterWrite: camera.position.toArray(),
        lookAtTarget: fractureTiltAnchorLookAtRef.current.toArray(),
        sourceUsed: 'fractureTiltAnchorRefs',
        authoritativeHeroSnapshotPosition: authoritativeSnapshot?.position?.toArray?.() || fractureTiltAnchorPositionRef.current.toArray(),
        authoritativeHeroSnapshotLookAt: authoritativeSnapshot?.lookAtTarget?.toArray?.() || fractureTiltAnchorLookAtRef.current.toArray(),
        finalFilmOffset: camera.filmOffset,
        state: animationData?.state,
        cameraState: animationData?.cameraState,
      });
      applyFractureTilt();
      console.log('[UCC EARLY RETURN]', { branch: "TRANSITION", reason: "fracture-tilt-lock", finalCameraPosition: camera.position.toArray(), finalFilmOffset: camera.filmOffset });
      if (shouldLogBranch) console.log('[UCC RETURN] reason: fracture-tilt-lock');
      return;
    }

    if (
      fractureTiltActiveRef.current &&
      animationData?.crystalForm === 'exploded' &&
      animationData?.cameraState !== 'hero'
    ) {
      if (!heroExplosionTransitionRef.current.active) {
        const transition = heroExplosionTransitionRef.current;
        transition.active = true;
        transition.startedAt = state.clock.elapsedTime;
        transition.startPosition.copy(camera.position);
        transition.startLookAt.copy(fractureTiltAnchorLookAtRef.current);
        transition.destinationPosition.copy(currentTarget.current.position);
        transition.destinationLookAt.copy(currentTarget.current.lookAt);
        transition.startFilmOffset = camera.filmOffset;
        transition.destinationFilmOffset = 0;
      }

      const transition = heroExplosionTransitionRef.current;
      const elapsed = state.clock.elapsedTime - transition.startedAt;
      const progress = THREE.MathUtils.clamp(elapsed / transition.duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      camera.position.lerpVectors(transition.startPosition, transition.destinationPosition, eased);
      const transitionLookAt = introLookAtTempRef.current.lerpVectors(
        transition.startLookAt,
        transition.destinationLookAt,
        eased,
      );
      camera.lookAt(transitionLookAt);
      camera.filmOffset = THREE.MathUtils.lerp(transition.startFilmOffset, transition.destinationFilmOffset, eased);
      camera.updateProjectionMatrix();
      logCameraWrite(state, "TRANSITION", "hero-explosion-to-destination", transitionLookAt, true, true);
      if (shouldLogBranch) {
        console.log('[UCC HERO EXPLOSION TRANSITION]', {
          progress,
          startPosition: transition.startPosition.toArray(),
          destinationPosition: transition.destinationPosition.toArray(),
          currentInterpolatedPosition: camera.position.toArray(),
          startLookAt: transition.startLookAt.toArray(),
          destinationLookAt: transition.destinationLookAt.toArray(),
          currentLookAt: transitionLookAt.toArray(),
          filmOffset: camera.filmOffset,
          fallbackBypassed: true,
        });
      }
      if (progress >= 1) {
        transition.active = false;
        fractureTiltActiveRef.current = false;
        fractureTiltRef.current = 0;
        camera.position.copy(transition.destinationPosition);
        camera.lookAt(transition.destinationLookAt);
        camera.filmOffset = transition.destinationFilmOffset;
        camera.updateProjectionMatrix();
        currentTarget.current.position.copy(transition.destinationPosition);
        currentTarget.current.lookAt.copy(transition.destinationLookAt);
        console.log('[UCC HERO EXPLOSION TRANSITION COMPLETE]', {
          finalPosition: camera.position.toArray(),
          finalLookAt: transition.destinationLookAt.toArray(),
          finalFilmOffset: camera.filmOffset,
          nextBranchExpected: animationData?.cameraState,
        });
      }
      return;
    }

    if (!fractureTiltActiveRef.current) {
      fractureTiltLockSeededRef.current = false;
    }

    if (!currentTarget.current || simplifiedAnimations) {
      if (simplifiedAnimations) {
        camera.position.copy(currentTarget.current.position);
        camera.lookAt(currentTarget.current.lookAt);
        applyFractureTilt();
        camera.fov = currentTarget.current.fov;
        camera.updateProjectionMatrix();
        cameraMoveProgressRef.current = 1;
        if (sharedCameraMoveProgressRef) sharedCameraMoveProgressRef.current = 1;
      animationData?.setCameraMoveProgress?.(1);
        if (!cameraSettledRef.current) {
          cameraSettledRef.current = true;
          animationData?.setCameraSettled?.(true);
        }
      }
      logCameraWrite(state, "FALLBACK", "simplified-or-missing-target", currentTarget.current.lookAt, simplifiedAnimations, true);
      console.log('[UCC EARLY RETURN]', { branch: "FALLBACK", reason: "simplified-or-missing-target", finalCameraPosition: camera.position.toArray(), finalFilmOffset: camera.filmOffset });
      if (shouldLogBranch) console.log('[UCC RETURN] reason: simplified-or-missing-target', { simplifiedAnimations });
      return;
    }

    // Orbit camera around crystal during hero state once settled
    if (introActiveRef.current && !isAuthoritativePlainHero) {
      if (shouldLogBranch) console.log('[UCC BRANCH] INTRO');
      const elapsed = performance.now() - introStartTimeRef.current;
      const progress = THREE.MathUtils.clamp(elapsed / INTRO_DURATION_MS, 0, 1);
      if (shouldLogBranch) {
        console.log('[UCC INTRO DIAG]', {
          introActive: introActiveRef.current,
          introStarted: introStartedRef.current,
          introPlayed: introPlayedRef.current,
          introStartTime: introStartTimeRef.current,
          elapsed,
          introDuration: INTRO_DURATION_MS,
          progress,
          state: animationData?.state,
          cameraState: animationData?.cameraState,
          reachesCompletion: progress >= 1,
          introToPosition: introToRef.current.position.toArray(),
          introToLookAt: introToRef.current.lookAt.toArray(),
          finalTargetUsedToCreateIntroTo: introFinalTargetDebugRef.current.toArray(),
          configHeroTarget: config?.cameraTargets?.hero ?? null,
          centerY: introToRef.current.lookAt.y - heroVerticalOffsetRef.current,
          authoredHeroTargetY: toVector3(config?.cameraTargets?.hero).y,
          rawVerticalOffsetY: toVector3(config?.cameraTargets?.hero).y - (introToRef.current.lookAt.y - heroVerticalOffsetRef.current),
          appliedVerticalOffsetY: heroVerticalOffsetRef.current,
          lookAtTargetY: introToRef.current.lookAt.y,
          cameraPositionY: camera.position.y,
          offsetTarget: config?.cameraOffsets?.zones?.hero?.target ?? null,
        });
      }
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const positionProgress = progress < 0.5
        ? 4 * Math.pow(progress, 3)
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const introLookAt = introLookAtTempRef.current.lerpVectors(
        introFromRef.current.lookAt,
        introToRef.current.lookAt,
        easedProgress
      );

      camera.position.lerpVectors(
        introFromRef.current.position,
        introToRef.current.position,
        positionProgress
      );
      camera.lookAt(introLookAt);
      applyHeroFilmOffset(introToRef.current.lookAt, "INTRO");
      applyFractureTilt();
      camera.fov = THREE.MathUtils.lerp(
        introFromRef.current.fov,
        introToRef.current.fov,
        easedProgress
      );
      camera.updateProjectionMatrix();
      logCameraWrite(state, "INTRO", "intro-interpolation", introLookAt, true, true);

      cameraMoveProgressRef.current = progress;
      if (sharedCameraMoveProgressRef) sharedCameraMoveProgressRef.current = progress;
      animationData?.setCameraMoveProgress?.(progress);
      animationData?.setCameraSettled?.(false);

      if (progress >= 1) {
        if (import.meta.env.DEV) console.log('[UCC INTRO] set active false', { progress, elapsed, prevIntroActive: true, nextIntroActive: false, introPlayedNext: true });
        introActiveRef.current = false;
        introPlayedRef.current = true;
        const introBeforePosition = camera.position.clone();
        camera.position.copy(introToRef.current.position);
        camera.lookAt(introToRef.current.lookAt);
        if (import.meta.env.DEV) {
          console.log("[UCC JUMP DIAG] INTRO_COMPLETE_WRITE", {
            branch: "INTRO",
            cameraPositionBefore: introBeforePosition.toArray(),
            cameraPositionAfter: camera.position.toArray(),
            lookAtTarget: introToRef.current.lookAt.toArray(),
            heroOrbitCenterRef: heroOrbitCenterRef.current.toArray(),
            resolvedHeroCenter: getHeroOrbitCenter().toArray(),
            introToPosition: introToRef.current.position.toArray(),
            introToLookAt: introToRef.current.lookAt.toArray(),
            currentPositionRef: null,
            targetPositionRef: null,
            currentTargetPosition: currentTarget.current.position.toArray(),
            currentTargetLookAt: currentTarget.current.lookAt.toArray(),
            finalTarget: lastCameraConfig.current?.target?.toArray?.() || null,
            baseTarget: config?.cameraTargets?.hero ?? null,
            offsetTarget: config?.cameraOffsets?.zones?.hero?.target ?? null,
            configCameraPositionHero: config?.cameraPositions?.hero ?? null,
            configCameraTargetHero: config?.cameraTargets?.hero ?? null,
            configHeroFilmOffsetX: config?.cameraComposition?.hero?.filmOffsetX ?? null,
          });
        }
        applyFractureTilt();
        camera.fov = introToRef.current.fov;
        camera.updateProjectionMatrix();
        currentTarget.current.position.copy(introToRef.current.position);
        currentTarget.current.lookAt.copy(introToRef.current.lookAt);
        currentTarget.current.fov = introToRef.current.fov;
        cameraMoveProgressRef.current = 1;
        if (sharedCameraMoveProgressRef) sharedCameraMoveProgressRef.current = 1;
        animationData?.setCameraMoveProgress?.(1);
      }

      console.log('[UCC EARLY RETURN]', { branch: "INTRO", reason: "intro-active", finalCameraPosition: camera.position.toArray(), finalFilmOffset: camera.filmOffset, heroOrbitCenter: heroOrbitCenterRef.current.toArray(), lookAt: introLookAt.toArray() });
      if (shouldLogBranch) console.log('[UCC RETURN] reason: intro-active');
      return;
    }

    if (animationData.state === 'hero' && animationData.cameraState === 'hero' && isOrbitingRef.current) {
      if (shouldLogBranch) console.log('[UCC BRANCH] HERO_ORBIT');
      const deltaMultiplier = deltaTime * 60;
      const speed = animationData.cameraConfig?.orbitSpeed || 0.00018;
      const nowMs = state.clock.elapsedTime * 1000;
      const idleMs = lastPointerMoveTimeRef.current
        ? nowMs - lastPointerMoveTimeRef.current
        : Number.POSITIVE_INFINITY;
      if (idleMs > POINTER_IDLE_MS) {
        const decay = Math.pow(POINTER_DECAY, deltaMultiplier);
        targetOrbitVelocityRef.current.multiplyScalar(decay);
        if (targetOrbitVelocityRef.current.lengthSq() < 1e-6) {
          targetOrbitVelocityRef.current.set(0, 0);
        }
      }

      const responseLerp = Math.min(Math.max(1 - Math.exp(-6 * deltaTime), 0.02), 0.12);
      orbitVelocityRef.current.lerp(targetOrbitVelocityRef.current, responseLerp);
      const velocityDecay = Math.pow(0.997, deltaMultiplier);
      orbitVelocityRef.current.multiplyScalar(velocityDecay);
      orbitVelocityRef.current.clampLength(0, POINTER_MAX_SPEED);

      const userActive = orbitVelocityRef.current.lengthSq() > 1e-6 ? 1 : 0;
      const influenceLerp = Math.min(Math.max(deltaTime * 5, 0.02), 0.2);

      userControlStrengthRef.current += (userActive - userControlStrengthRef.current) * influenceLerp;
      const idleSeconds = idleMs / 1000;
      const idleBlend = THREE.MathUtils.clamp(
        (idleSeconds - POINTER_RETURN_DELAY) / POINTER_RETURN_FADE,
        0,
        1
      );
      const autoOrbitStrength = (1 - Math.min(userControlStrengthRef.current, 1)) * idleBlend;

      const baseOrbitSpeed = speed * deltaMultiplier;
      heroOrbitAngle.current += baseOrbitSpeed * (0.4 + 0.6 * autoOrbitStrength);

      heroOrbitAngle.current += orbitVelocityRef.current.x;
      heroPolarAngleRef.current = THREE.MathUtils.clamp(
        heroPolarAngleRef.current + orbitVelocityRef.current.y,
        -0.35,
        0.95
      );

      const distance = orbitDistanceRef.current || Math.sqrt(
        orbitRadiusRef.current * orbitRadiusRef.current +
        orbitHeightRef.current * orbitHeightRef.current
      );
      const horizontal = Math.max(0.0001, Math.cos(heroPolarAngleRef.current)) * distance;
      const y = Math.sin(heroPolarAngleRef.current) * distance;
      const x = horizontal * Math.sin(heroOrbitAngle.current);
      const z = horizontal * Math.cos(heroOrbitAngle.current);

      const orbitCenter = heroOrbitCenterRef.current;

      camera.position
        .set(x, y, z)
        .add(orbitCenter);

      const heroLookAtTarget = newLookAtTempRef.current.copy(orbitCenter);
      heroLookAtTarget.y += heroVerticalOffsetRef.current;
      camera.lookAt(heroLookAtTarget);
      applyHeroFilmOffset(heroLookAtTarget, "HERO_ORBIT");
      applyFractureTilt();
      camera.fov = currentTarget.current.fov;
      camera.updateProjectionMatrix();
      if (import.meta.env.DEV && (state.clock.frame % 60 === 0)) {
        logger.debug('🎯 Hero orbit diagnostic', {
          branch: 'hero-orbit-active',
          crystalCenter: orbitCenter.toArray(),
          cameraPosition: camera.position.toArray(),
          lookAtTarget: orbitCenter.toArray(),
          desktopHeroTargetUsedInOrbit: false,
          filmOffset: camera.filmOffset,
          centerY: orbitCenter.y,
          authoredHeroTargetY: toVector3(config?.cameraTargets?.hero).y,
          rawVerticalOffsetY: toVector3(config?.cameraTargets?.hero).y - orbitCenter.y,
          appliedVerticalOffsetY: heroVerticalOffsetRef.current,
          lookAtTargetY: heroLookAtTarget.y,
          cameraPositionY: camera.position.y,
          fov: camera.fov
        });
      }

      currentTarget.current.position.copy(camera.position);

      animationData?.setCameraMoveProgress?.(1);
      animationData?.setCameraSettled?.(false);
      console.log('[UCC EARLY RETURN]', { branch: "HERO_ORBIT", reason: "hero-orbit-active", finalCameraPosition: camera.position.toArray(), finalFilmOffset: camera.filmOffset, heroOrbitCenter: heroOrbitCenterRef.current.toArray(), lookAt: heroLookAtTarget.toArray() });
      if (shouldLogBranch) console.log('[UCC RETURN] reason: hero-orbit-active');
      return;
    }

    const isHeroCameraPath = (animationData?.state === 'hero' && animationData?.cameraState === 'hero') || introActiveRef.current;
    if (!isHeroCameraPath && camera.filmOffset !== 0) {
      camera.filmOffset = 0;
      camera.updateProjectionMatrix();
      logCameraWrite(state, "CLEANUP_FILM_OFFSET", "non-hero-path", null, true, false);
      if (shouldLogBranch) console.log('[UCC FILM] cleared for non-hero path');
    }

    if (shouldLogBranch) {
      if (animationData?.cameraState === 'overview') console.log('[UCC BRANCH] OVERVIEW');
      else if (animationData?.cameraState === 'project' && animationData?.state === 'project_focused') console.log('[UCC BRANCH] SELECTED_PROJECT');
      else if (animationData?.cameraState === 'caseStudy') console.log('[UCC BRANCH] CASE_STUDY');
      else if (animationData?.cameraState === 'hero') console.log('[UCC BRANCH] HERO_IDLE');
      else console.log('[UCC BRANCH] FALLBACK', { cameraState: animationData?.cameraState, state: animationData?.state });
    }

    // FIXED: Use exponential smoothing with clamping
    const smoothingFactor = 1 - Math.exp(-6 * deltaTime);
    const clampedSmoothing = Math.min(Math.max(smoothingFactor, 0.01), 0.15);

    // Smooth position interpolation
    camera.position.lerp(currentTarget.current.position, clampedSmoothing);

    // Smooth look-at interpolation
    const currentDirection = currentDirectionTempRef.current;
    camera.getWorldDirection(currentDirection);

    const targetDirection = targetDirectionTempRef.current
      .subVectors(currentTarget.current.lookAt, camera.position)
      .normalize();

    currentDirection.lerp(targetDirection, clampedSmoothing).normalize();

    const newLookAt = newLookAtTempRef.current
      .addVectors(camera.position, currentDirection);

    if (animationData?.state === 'hero' && animationData?.cameraState === 'hero') {
      newLookAt.y = currentTarget.current.lookAt.y;
      applyHeroFilmOffset(newLookAt, "HERO_IDLE");
    }

    const heroIdleBeforePosition = camera.position.clone();
    camera.lookAt(newLookAt);
    if (import.meta.env.DEV && animationData?.state === "hero" && animationData?.cameraState === "hero") {
      console.log("[UCC JUMP DIAG] HERO_IDLE_WRITE", {
        branch: "HERO_IDLE",
        cameraPositionBefore: heroIdleBeforePosition.toArray(),
        cameraPositionAfter: camera.position.toArray(),
        lookAtTarget: newLookAt.toArray(),
        heroOrbitCenterRef: heroOrbitCenterRef.current.toArray(),
        resolvedHeroCenter: getHeroOrbitCenter().toArray(),
        introToPosition: introToRef.current.position.toArray(),
        introToLookAt: introToRef.current.lookAt.toArray(),
        currentPositionRef: null,
        targetPositionRef: null,
        currentTargetPosition: currentTarget.current.position.toArray(),
        currentTargetLookAt: currentTarget.current.lookAt.toArray(),
        finalTarget: lastCameraConfig.current?.target?.toArray?.() || null,
        baseTarget: config?.cameraTargets?.hero ?? null,
        offsetTarget: config?.cameraOffsets?.zones?.hero?.target ?? null,
        configCameraPositionHero: config?.cameraPositions?.hero ?? null,
        configCameraTargetHero: config?.cameraTargets?.hero ?? null,
        configHeroFilmOffsetX: config?.cameraComposition?.hero?.filmOffsetX ?? null,
      });
    }
    applyFractureTilt();

    // Smooth FOV interpolation
    const fovDiff = currentTarget.current.fov - camera.fov;
    camera.fov += fovDiff * clampedSmoothing;
    camera.updateProjectionMatrix();
    logCameraWrite(state, animationData?.cameraState === "hero" ? "HERO_IDLE" : "FALLBACK", "smoothed-update", newLookAt, true, false);
    console.log('[UCC END FRAME]', { elapsed: state.clock.elapsedTime, finalCameraPosition: camera.position.toArray(), finalFilmOffset: camera.filmOffset, finalWriter: lastCameraWriterRef.current });

    // Check if camera has settled at target
    const positionDiff = camera.position.distanceTo(currentTarget.current.position);
    const lookAtDiff = currentDirection.angleTo(targetDirection);
    const fovDistance = Math.abs(currentTarget.current.fov - camera.fov);
    const baselinePosition = Math.max(cameraMoveBaselineRef.current.position, SETTLE_EPSILON);
    const baselineLookAt = Math.max(cameraMoveBaselineRef.current.lookAt, SETTLE_EPSILON);
    const baselineFov = Math.max(cameraMoveBaselineRef.current.fov, SETTLE_EPSILON);
    const positionProgress = 1 - Math.min(positionDiff / baselinePosition, 1);
    const lookAtProgress = 1 - Math.min(lookAtDiff / baselineLookAt, 1);
    const fovProgress = 1 - Math.min(fovDistance / baselineFov, 1);
    const moveProgress = Math.min(positionProgress, lookAtProgress, fovProgress);
    const monotonicProgress = Number.isFinite(moveProgress)
      ? Math.max(cameraMoveProgressRef.current, THREE.MathUtils.clamp(moveProgress, 0, 1))
      : 1;
    cameraMoveProgressRef.current = monotonicProgress;
    if (sharedCameraMoveProgressRef) sharedCameraMoveProgressRef.current = monotonicProgress;
    animationData?.setCameraMoveProgress?.(monotonicProgress);

    if (
      positionDiff < SETTLE_EPSILON &&
      lookAtDiff < SETTLE_EPSILON &&
      fovDistance < SETTLE_EPSILON
    ) {
      settleFrameCount.current += 1;
      if (settleFrameCount.current >= SETTLE_FRAMES && !cameraSettledRef.current) {
        cameraSettledRef.current = true;
        cameraMoveProgressRef.current = 1;
        if (sharedCameraMoveProgressRef) sharedCameraMoveProgressRef.current = 1;
        animationData?.setCameraMoveProgress?.(1);
        animationData?.setCameraSettled?.(true);
      }
    } else {
      if (cameraSettledRef.current) {
        cameraSettledRef.current = false;
        animationData?.setCameraSettled?.(false);
      }
      settleFrameCount.current = 0;
      orbitInitDelayRef.current = 0; // ADDED: Reset orbit delay when not settled
    }

    // FIXED: Enhanced orbit initiation with additional delay and stricter conditions
    if (
      animationData.state === 'hero' &&
      animationData.cameraState === 'hero' &&
      cameraSettledRef.current &&
      !isOrbitingRef.current &&
      !introActiveRef.current
    ) {
      // ADDED: Additional delay after camera settles to prevent jumps
      orbitInitDelayRef.current += 1;
      
      if (orbitInitDelayRef.current >= ORBIT_DELAY_FRAMES) {
        // ADDED: Extra verification that camera is truly at target
        const finalPositionCheck = camera.position.distanceTo(currentTarget.current.position);
        const finalLookAtCheck = currentDirection.angleTo(targetDirection);
        
        if (finalPositionCheck < SETTLE_EPSILON * 0.5 && finalLookAtCheck < SETTLE_EPSILON * 0.5) {
          // Derive orbit parameters from the actual camera position to avoid visible jumps
          const center = heroOrbitCenterRef.current.clone();
          const relative = new THREE.Vector3().subVectors(camera.position, center);
          const cameraDistance = relative.length();
          const horizontalRadius = Math.sqrt(relative.x * relative.x + relative.z * relative.z);

          heroOrbitAngle.current = Math.atan2(relative.x, relative.z);
          heroPolarAngleRef.current = Math.atan2(relative.y, Math.max(0.0001, horizontalRadius));
          orbitRadiusRef.current = horizontalRadius;
          orbitHeightRef.current = relative.y;
          orbitDistanceRef.current = cameraDistance || orbitDistanceRef.current;
          isOrbitingRef.current = true;
          
          if (import.meta.env.DEV) {
            logger.debug('📹 Hero orbit initiated after delay:', {
              delay: orbitInitDelayRef.current,
              radius: orbitRadiusRef.current,
              height: orbitHeightRef.current,
              finalCheck: { pos: finalPositionCheck, look: finalLookAtCheck }
            });
          }
        } else {
          // Reset delay if final check fails
          orbitInitDelayRef.current = 0;
        }
      }
    }
  });

  useEffect(() => {
    if (isMobile) {
      Object.keys(animationSpeed.current).forEach(key => {
        animationSpeed.current[key] *= 0.7;
      });
    }
  }, [isMobile]);

  return null;
};

export default UnifiedCameraController;
