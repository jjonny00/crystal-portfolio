// FIXED: src/components/three/UnifiedCameraController.jsx
// Fixed hero orbit jump by adding stricter orbit initiation conditions

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { facetKeys as canonicalFacetKeys, getSceneFacetKeyByProjectId } from '../../data/projects';

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
  const FRACTURE_TILT_RADIANS = 0.055;
  const FRACTURE_TILT_RELEASE_DISTANCE = 0.015;
  const fractureTiltRef = useRef(0);
  const fractureTiltActiveRef = useRef(false);
  const fractureTiltAnchorPositionRef = useRef(new THREE.Vector3());
  const lastCrystalFormRef = useRef(animationData?.crystalForm ?? 'whole');

  const applyFractureTilt = () => {
    if (!fractureTiltActiveRef.current) return;

    if (Math.abs(fractureTiltRef.current) > 0.00001) {
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
        console.log(`🎯 Camera Controller: Fresh anchor position for ${facetKey}:`, {
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

  const getCameraTarget = (cameraConfig, focusedFacet, cameraState) => {
    if (cameraState === 'project' && focusedFacet && facetRefs) {
      const lockedTarget = projectTargetLockRef.current;
      const shouldRefreshProjectTarget =
        lockedTarget.facetKey !== focusedFacet || !lockedTarget.target;

      if (shouldRefreshProjectTarget) {
        const anchorPosition = findAnchorInFacet(focusedFacet);

        if (anchorPosition) {
          projectTargetLockRef.current = {
            facetKey: focusedFacet,
            target: anchorPosition.clone(),
            source: 'anchor'
          };
        } else {
          if (import.meta.env.DEV) {
            console.warn(`⚠️ Camera Controller: No anchor found for ${focusedFacet}, freezing config target for this move`);
          }

          projectTargetLockRef.current = {
            facetKey: focusedFacet,
            target: cameraConfig?.target ? cameraConfig.target.clone() : null,
            source: 'config'
          };
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

  const vectorsEqual = (left, right) => {
    if (!left && !right) return true;
    if (!left || !right) return false;
    return left.equals(right);
  };

  const getConfigCameraState = (cameraState, focusedFacet) => {
    if (!config?.cameraPositions) return null;

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
      return {
        position: toVector3(config.cameraPositions?.projects?.[focusedFacet]),
        target: toVector3(config.cameraTargets?.projects?.[focusedFacet]),
        fov: animationData?.cameraConfig?.fov,
        description: `${focusedFacet} project (layout/config)`
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
    const heroFov = currentTarget.current.fov ?? animationData?.cameraConfig?.fov ?? camera.fov;

    introStartedRef.current = true;
    introPlayedRef.current = false;
    introActiveRef.current = true;
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
    heroOrbitCenterRef.current.copy(heroTarget);

    cameraMoveProgressRef.current = 0;
    if (sharedCameraMoveProgressRef) sharedCameraMoveProgressRef.current = 0;
    animationData?.setCameraMoveProgress?.(0);
    animationData?.setCameraSettled?.(false);
  }, [animationData, camera, config, restartToken, sharedCameraMoveProgressRef]);


  useEffect(() => {
    const currentCrystalForm = animationData?.crystalForm ?? 'whole';
    const previousCrystalForm = lastCrystalFormRef.current;

    if (previousCrystalForm !== 'exploded' && currentCrystalForm === 'exploded') {
      fractureTiltRef.current = FRACTURE_TILT_RADIANS;
      fractureTiltActiveRef.current = true;
      fractureTiltAnchorPositionRef.current.copy(camera.position);
    }

    if (currentCrystalForm === 'whole') {
      fractureTiltActiveRef.current = false;
      fractureTiltRef.current = 0;
    }

    lastCrystalFormRef.current = currentCrystalForm;
  }, [animationData?.crystalForm, camera]);

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
        heroOrbitCenterRef.current.copy(introTarget);
      }
      
      if (import.meta.env.DEV) {
        console.log('📹 Camera state changed, resetting orbit:', animationData?.cameraState);
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

    const focusedProject = animationData.focusedProject ?? null;
    const focusedFacet = animationData.focusedFacet;
    const resolvedFocusedFacet = focusedProject
      ? (getSceneFacetKeyByProjectId(focusedProject) || focusedFacet)
      : focusedFacet;
    const cameraState = animationData.cameraState;
    const configCameraState = getConfigCameraState(cameraState, resolvedFocusedFacet);
    const baseConfig = configCameraState || animationData.cameraConfig;
    if (!baseConfig) return;
    
    const enhancedConfig = getCameraTarget(baseConfig, resolvedFocusedFacet, cameraState);
    const configuredOffsetPosition = cameraState === 'project' && resolvedFocusedFacet
      ? config?.cameraOffsets?.projects?.[resolvedFocusedFacet]?.position
      : config?.cameraOffsets?.zones?.[cameraState]?.position;
    const configuredOffsetTarget = cameraState === 'project' && resolvedFocusedFacet
      ? config?.cameraOffsets?.projects?.[resolvedFocusedFacet]?.target
      : config?.cameraOffsets?.zones?.[cameraState]?.target;

    const offsetPosition = toVector3(configuredOffsetPosition ?? enhancedConfig?.offsetPosition);
    const offsetTarget = toVector3(configuredOffsetTarget ?? enhancedConfig?.offsetTarget);
    offsetPosition.add(toVector3(config?.cameraOffsets?.global?.position));
    offsetTarget.add(toVector3(config?.cameraOffsets?.global?.target));
    const basePosition = enhancedConfig?.position ? enhancedConfig.position.clone() : null;
    const baseTarget = enhancedConfig?.target ? enhancedConfig.target.clone() : null;
    const finalPosition = basePosition ? basePosition.add(offsetPosition) : null;
    const finalTarget = baseTarget ? baseTarget.add(offsetTarget) : null;

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
        console.log('📹 Camera Controller: Enhanced camera target updated:', {
          state: animationData.state,
          cameraState: cameraState,
          focusedFacet: resolvedFocusedFacet,
          position: finalPosition?.toArray(),
          target: finalTarget?.toArray(),
          fov: enhancedConfig.fov,
          description: enhancedConfig.description 
        });
        console.log('📷 Effective hero/overview from config:', {
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
          heroOrbitCenterRef.current.copy(finalTarget);
        }
      }
      
      if (enhancedConfig.fov !== undefined) {
        currentTarget.current.fov = enhancedConfig.fov;
      }

      const shouldRunIntro =
        !introStartedRef.current &&
        !introPlayedRef.current &&
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
        introStartTimeRef.current = performance.now();
        introFromRef.current.position.copy(camera.position);
        introFromRef.current.lookAt.copy(camera.position).add(currentDirection);
        introFromRef.current.fov = camera.fov;
        introToRef.current.position.copy(finalPosition);
        introToRef.current.lookAt.copy(finalTarget);
        introToRef.current.fov = enhancedConfig.fov ?? camera.fov;
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
      } else if (cameraState === 'project' && resolvedFocusedFacet) {
        animationSpeed.current.position = 0.05;
        animationSpeed.current.lookAt = 0.05;
        animationSpeed.current.fov = 0.05;
        
        if (import.meta.env.DEV) {
          console.log(`📹 Camera Controller: Project focus camera update: ${resolvedFocusedFacet}, distance: ${positionDistance.toFixed(2)}, using anchor: ${enhancedConfig.description?.includes('anchor')}`);
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
    facetRefs,
    camera
  ]);

  useFrame((state, deltaTime) => {
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
      return;
    }

    // Orbit camera around crystal during hero state once settled
    if (introActiveRef.current) {
      const elapsed = performance.now() - introStartTimeRef.current;
      const progress = THREE.MathUtils.clamp(elapsed / INTRO_DURATION_MS, 0, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const positionProgress = progress < 0.5
        ? 4 * Math.pow(progress, 3)
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const introLookAt = new THREE.Vector3().lerpVectors(
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
      applyFractureTilt();
      camera.fov = THREE.MathUtils.lerp(
        introFromRef.current.fov,
        introToRef.current.fov,
        easedProgress
      );
      camera.updateProjectionMatrix();

      cameraMoveProgressRef.current = progress;
      if (sharedCameraMoveProgressRef) sharedCameraMoveProgressRef.current = progress;
      animationData?.setCameraMoveProgress?.(progress);
      animationData?.setCameraSettled?.(false);

      if (progress >= 1) {
        introActiveRef.current = false;
        introPlayedRef.current = true;
        camera.position.copy(introToRef.current.position);
        camera.lookAt(introToRef.current.lookAt);
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

      return;
    }

    if (animationData.state === 'hero' && animationData.cameraState === 'hero' && isOrbitingRef.current) {
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
      camera.lookAt(orbitCenter);
      applyFractureTilt();
      camera.fov = currentTarget.current.fov;
      camera.updateProjectionMatrix();

      currentTarget.current.position.copy(camera.position);

      animationData?.setCameraMoveProgress?.(1);
      animationData?.setCameraSettled?.(false);
      return;
    }

    // FIXED: Use exponential smoothing with clamping
    const smoothingFactor = 1 - Math.exp(-6 * deltaTime);
    const clampedSmoothing = Math.min(Math.max(smoothingFactor, 0.01), 0.15);

    // Smooth position interpolation
    camera.position.lerp(currentTarget.current.position, clampedSmoothing);

    // Smooth look-at interpolation
    const currentDirection = new THREE.Vector3();
    camera.getWorldDirection(currentDirection);

    const targetDirection = new THREE.Vector3()
      .subVectors(currentTarget.current.lookAt, camera.position)
      .normalize();

    currentDirection.lerp(targetDirection, clampedSmoothing).normalize();

    const newLookAt = new THREE.Vector3()
      .addVectors(camera.position, currentDirection);

    camera.lookAt(newLookAt);
    applyFractureTilt();

    // Smooth FOV interpolation
    const fovDiff = currentTarget.current.fov - camera.fov;
    camera.fov += fovDiff * clampedSmoothing;
    camera.updateProjectionMatrix();

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
            console.log('📹 Hero orbit initiated after delay:', {
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
