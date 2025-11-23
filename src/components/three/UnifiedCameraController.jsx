// FIXED: src/components/three/UnifiedCameraController.jsx
// Fixed hero orbit jump by adding stricter orbit initiation conditions

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { facetKeys as canonicalFacetKeys } from '../../data/projects';

const UnifiedCameraController = ({
  animationData,
  isMobile = false,
  simplifiedAnimations = false,
  facetRefs = null
}) => {
  const { camera, gl } = useThree();

  // Input context
  const isTouchDeviceRef = useRef(false);

  // Passive parallax tracking
  const parallaxTarget = useRef(new THREE.Vector2(0, 0));
  const parallaxSmoothed = useRef(new THREE.Vector2(0, 0));
  const zeroParallax = useRef(new THREE.Vector2(0, 0));
  const parallaxPositionOffset = useRef(new THREE.Vector3());
  const parallaxLookAtOffset = useRef(new THREE.Vector3());
  const tempLookAt = useRef(new THREE.Vector3());

  // Drag orbit tracking
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0, time: 0 });
  const orbitVelocityRef = useRef(new THREE.Vector2(0, 0));
  const userControlStrengthRef = useRef(0);

  // Orbit angles
  const heroPolarAngleRef = useRef(0);
  const orbitDistanceRef = useRef(0);

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

  // Track when camera has reached its target
  const settleFrameCount = useRef(0);
  const cameraSettledRef = useRef(false);
  const SETTLE_EPSILON = 0.01;
  const SETTLE_FRAMES = 5;

  // ADDED: Additional tracking for orbit initiation
  const orbitInitDelayRef = useRef(0);
  const ORBIT_DELAY_FRAMES = 30; // Wait 30 frames after settling before starting orbit
  const lastCameraStateRef = useRef(null);

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
      const anchorPosition = findAnchorInFacet(focusedFacet);
      
      if (anchorPosition) {
        return {
          ...cameraConfig,
          target: anchorPosition,
          description: `${focusedFacet} project (anchor targeted)` 
        };
      } else {
        if (import.meta.env.DEV) {
          console.warn(`⚠️ Camera Controller: No anchor found for ${focusedFacet}, using default target`);
        }
        return {
          ...cameraConfig,
          description: `${focusedFacet} project (default target)`
        };
      }
    }
    
    return cameraConfig;
  };

  useEffect(() => {
    currentTarget.current.position.copy(camera.position);
    currentTarget.current.fov = camera.fov;
    
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    currentTarget.current.lookAt.copy(camera.position).add(direction);
  }, [camera]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches;
    isTouchDeviceRef.current = coarsePointer || 'ontouchstart' in window;
  }, []);

  useEffect(() => {
    const element = gl?.domElement;

    if (!element || isTouchDeviceRef.current) return undefined;

    const handlePointerMove = (event) => {
      const rect = element.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;

      parallaxTarget.current.set(nx, ny);

      if (!isDraggingRef.current || animationData?.state !== 'hero' || animationData?.cameraState !== 'hero') {
        return;
      }

      const dx = event.clientX - lastPointerRef.current.x;
      const dy = event.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: event.clientX, y: event.clientY, time: event.timeStamp };

      const azimuthDelta = dx * 0.0018;
      const polarDelta = dy * 0.0012;

      heroOrbitAngle.current -= azimuthDelta;
      heroPolarAngleRef.current = THREE.MathUtils.clamp(
        heroPolarAngleRef.current + polarDelta,
        -0.35,
        0.95
      );

      orbitVelocityRef.current.set(-azimuthDelta, polarDelta);
      orbitVelocityRef.current.clampLength(0, 0.009);
      userControlStrengthRef.current = 1;
    };

    const handlePointerDown = (event) => {
      if (animationData?.state !== 'hero' || animationData?.cameraState !== 'hero') return;

      isDraggingRef.current = true;
      orbitVelocityRef.current.set(0, 0);
      lastPointerRef.current = { x: event.clientX, y: event.clientY, time: event.timeStamp };
      userControlStrengthRef.current = 1;
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    element.addEventListener('pointerleave', handlePointerUp);

    return () => {
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      element.removeEventListener('pointerleave', handlePointerUp);
    };
  }, [animationData?.cameraState, animationData?.state, gl]);

  useEffect(() => {
    // FIXED: Reset orbit state when camera state changes
    if (animationData?.cameraState !== lastCameraStateRef.current) {
      isOrbitingRef.current = false;
      orbitInitDelayRef.current = 0;
      lastCameraStateRef.current = animationData?.cameraState;
      
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

    if (!animationData?.cameraConfig) return;

    const baseConfig = animationData.cameraConfig;
    const focusedFacet = animationData.focusedFacet;
    const cameraState = animationData.cameraState;
    
    const enhancedConfig = getCameraTarget(baseConfig, focusedFacet, cameraState);

    if (!enhancedConfig) {
      if (import.meta.env.DEV) {
        console.warn('📹 Camera Controller: No camera configuration available');
      }
      return;
    }

    const configChanged = !lastCameraConfig.current ||
      !enhancedConfig.position?.equals(lastCameraConfig.current.position) ||
      !enhancedConfig.target?.equals(lastCameraConfig.current.target) ||
      enhancedConfig.fov !== lastCameraConfig.current.fov ||
      enhancedConfig.description !== lastCameraConfig.current.description;

    if (configChanged) {
      if (import.meta.env.DEV) {
        console.log('📹 Camera Controller: Enhanced camera target updated:', {
          state: animationData.state,
          cameraState: cameraState,
          focusedFacet: focusedFacet,
          position: enhancedConfig.position?.toArray(),
          target: enhancedConfig.target?.toArray(),
          fov: enhancedConfig.fov,
          description: enhancedConfig.description 
        });
      }

      if (enhancedConfig.position) {
        currentTarget.current.position.copy(enhancedConfig.position);
      }
      
      if (enhancedConfig.target) {
        currentTarget.current.lookAt.copy(enhancedConfig.target);
      }
      
      if (enhancedConfig.fov !== undefined) {
        currentTarget.current.fov = enhancedConfig.fov;
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
      } else if (cameraState === 'project' && focusedFacet) {
        animationSpeed.current.position = 0.05;
        animationSpeed.current.lookAt = 0.05;
        animationSpeed.current.fov = 0.05;
        
        if (import.meta.env.DEV) {
          console.log(`📹 Camera Controller: Project focus camera update: ${focusedFacet}, distance: ${positionDistance.toFixed(2)}, using anchor: ${enhancedConfig.description?.includes('anchor')}`);
        }
      } else {
        animationSpeed.current.position = 0.03;
        animationSpeed.current.lookAt = 0.03;
        animationSpeed.current.fov = 0.03;
      }

      lastCameraConfig.current = {
        position: enhancedConfig.position?.clone(),
        target: enhancedConfig.target?.clone(),
        fov: enhancedConfig.fov,
        description: enhancedConfig.description
      };

      orbitVelocityRef.current.set(0, 0);
      userControlStrengthRef.current = 0;

      // FIXED: Reset settle tracking when new config is applied
      settleFrameCount.current = 0;
      cameraSettledRef.current = false;
      orbitInitDelayRef.current = 0; // ADDED: Reset orbit delay
      if (animationData?.cameraSettled) {
        animationData.setCameraSettled(false);
      }
    }

    // Reset orbit when switching camera states and derive starting angle for hero
    if (cameraState === 'hero' && enhancedConfig.position) {
      heroOrbitAngle.current = Math.atan2(
        enhancedConfig.position.x,
        enhancedConfig.position.z
      );
      const horizontalRadius = Math.sqrt(
        enhancedConfig.position.x * enhancedConfig.position.x +
        enhancedConfig.position.z * enhancedConfig.position.z
      );
      const totalRadius = Math.sqrt(
        enhancedConfig.position.x * enhancedConfig.position.x +
        enhancedConfig.position.y * enhancedConfig.position.y +
        enhancedConfig.position.z * enhancedConfig.position.z
      );
      orbitRadiusRef.current = horizontalRadius;
      orbitHeightRef.current = enhancedConfig.position.y;
      orbitDistanceRef.current = totalRadius;
      heroPolarAngleRef.current = Math.atan2(
        enhancedConfig.position.y,
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
    facetRefs,
    camera
  ]);

  useFrame((state, deltaTime) => {
    if (!currentTarget.current || simplifiedAnimations) {
      if (simplifiedAnimations) {
        camera.position.copy(currentTarget.current.position);
        camera.lookAt(currentTarget.current.lookAt);
        camera.fov = currentTarget.current.fov;
        camera.updateProjectionMatrix();
        if (!cameraSettledRef.current) {
          cameraSettledRef.current = true;
          animationData?.setCameraSettled?.(true);
        }
      }
      return;
    }

    // Orbit camera around crystal during hero state once settled
    if (animationData.state === 'hero' && animationData.cameraState === 'hero' && isOrbitingRef.current) {
      const deltaMultiplier = deltaTime * 60;
      const speed = animationData.cameraConfig?.orbitSpeed || 0.00018;
      const userActive = isDraggingRef.current || orbitVelocityRef.current.lengthSq() > 1e-6 ? 1 : 0;
      const influenceLerp = Math.min(Math.max(deltaTime * 5, 0.02), 0.2);

      userControlStrengthRef.current += (userActive - userControlStrengthRef.current) * influenceLerp;
      const autoOrbitStrength = 1 - Math.min(userControlStrengthRef.current, 1);

      heroOrbitAngle.current += speed * deltaMultiplier * autoOrbitStrength;

      if (!isDraggingRef.current && orbitVelocityRef.current.lengthSq() > 1e-6) {
        heroOrbitAngle.current += orbitVelocityRef.current.x;
        heroPolarAngleRef.current = THREE.MathUtils.clamp(
          heroPolarAngleRef.current + orbitVelocityRef.current.y,
          -0.35,
          0.95
        );
        const decay = Math.pow(0.88, deltaMultiplier);
        orbitVelocityRef.current.multiplyScalar(decay);
        if (orbitVelocityRef.current.lengthSq() < 1e-6) {
          orbitVelocityRef.current.set(0, 0);
        }
      }

      const distance = orbitDistanceRef.current || Math.sqrt(
        orbitRadiusRef.current * orbitRadiusRef.current +
        orbitHeightRef.current * orbitHeightRef.current
      );
      const horizontal = Math.max(0.0001, Math.cos(heroPolarAngleRef.current)) * distance;
      const y = Math.sin(heroPolarAngleRef.current) * distance;
      const x = horizontal * Math.sin(heroOrbitAngle.current);
      const z = horizontal * Math.cos(heroOrbitAngle.current);

      const parallaxLerp = 1 - Math.exp(-6 * deltaTime);
      const parallaxGoal = isTouchDeviceRef.current ? zeroParallax.current : parallaxTarget.current;
      parallaxSmoothed.current.lerp(parallaxGoal, parallaxLerp);

      const parallaxStrength = 0.14;
      parallaxPositionOffset.current.set(
        parallaxSmoothed.current.x * parallaxStrength,
        parallaxSmoothed.current.y * parallaxStrength * 0.6,
        -parallaxSmoothed.current.x * parallaxStrength * 0.4
      );
      parallaxLookAtOffset.current.set(
        parallaxSmoothed.current.x * parallaxStrength * 0.3,
        parallaxSmoothed.current.y * parallaxStrength * 0.3,
        0
      );

      camera.position.set(x, y, z).add(parallaxPositionOffset.current);
      tempLookAt.current.copy(currentTarget.current.lookAt).add(parallaxLookAtOffset.current);
      camera.lookAt(tempLookAt.current);
      camera.fov = currentTarget.current.fov;
      camera.updateProjectionMatrix();

      currentTarget.current.position.set(x, y, z);

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

    // Smooth FOV interpolation
    const fovDiff = currentTarget.current.fov - camera.fov;
    camera.fov += fovDiff * clampedSmoothing;
    camera.updateProjectionMatrix();

    // Check if camera has settled at target
    const positionDiff = camera.position.distanceTo(currentTarget.current.position);
    const lookAtDiff = currentDirection.angleTo(targetDirection);

    if (positionDiff < SETTLE_EPSILON && lookAtDiff < SETTLE_EPSILON) {
      settleFrameCount.current += 1;
      if (settleFrameCount.current >= SETTLE_FRAMES && !cameraSettledRef.current) {
        cameraSettledRef.current = true;
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
      !isOrbitingRef.current
    ) {
      // ADDED: Additional delay after camera settles to prevent jumps
      orbitInitDelayRef.current += 1;
      
      if (orbitInitDelayRef.current >= ORBIT_DELAY_FRAMES) {
        // ADDED: Extra verification that camera is truly at target
        const finalPositionCheck = camera.position.distanceTo(currentTarget.current.position);
        const finalLookAtCheck = currentDirection.angleTo(targetDirection);
        
        if (finalPositionCheck < SETTLE_EPSILON * 0.5 && finalLookAtCheck < SETTLE_EPSILON * 0.5) {
          // Derive orbit parameters from the actual camera position to avoid visible jumps
          const cameraDistance = camera.position.distanceTo(currentTarget.current.lookAt);
          const horizontalRadius = Math.sqrt(
            camera.position.x * camera.position.x + camera.position.z * camera.position.z
          );

          heroOrbitAngle.current = Math.atan2(camera.position.x, camera.position.z);
          heroPolarAngleRef.current = Math.atan2(camera.position.y, Math.max(0.0001, horizontalRadius));
          orbitRadiusRef.current = horizontalRadius;
          orbitHeightRef.current = camera.position.y;
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