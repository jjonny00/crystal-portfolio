// FIXED: src/components/three/UnifiedCameraController.jsx
// Camera controller with animation-synchronized timing

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * FIXED: Camera Controller with synchronized animation timing
 */
const UnifiedCameraController = ({ 
  animationData,
  config,
  isMobile = false 
}) => {
  const { camera } = useThree();
  
  // FIXED: Current camera target tracking
  const currentTarget = useRef({
    position: new THREE.Vector3(),
    lookAt: new THREE.Vector3(), 
    fov: 45
  });
  
  // FIXED: Animation speed and timing coordination
  const animationSpeed = useRef({
    position: 0.025,
    lookAt: 0.025,
    fov: 0.025
  });
  
  // FIXED: Animation state coordination
  const lastAnimationState = useRef(null);
  const stateChangeTime = useRef(null);
  const isInCoordinatedSequence = useRef(false);

  /**
   * Initialize camera target from current position
   */
  useEffect(() => {
    currentTarget.current.position.copy(camera.position);
    currentTarget.current.fov = camera.fov;
    
    // Calculate current look-at direction
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    currentTarget.current.lookAt.copy(camera.position).add(direction);
  }, [camera]);

  /**
   * FIXED: Coordinated camera updates with proper sequencing
   */
  useEffect(() => {
    if (!animationData?.cameraConfig) return;

    const newState = animationData.state;
    const newCameraState = animationData.cameraState;
    const isTransitioning = animationData.isTransitioning;
    
    // FIXED: Detect coordinated sequences
    const coordinatedStates = ['exploding', 'reforming'];
    const wasInSequence = isInCoordinatedSequence.current;
    const nowInSequence = coordinatedStates.includes(newState);
    
    // Update sequence tracking
    isInCoordinatedSequence.current = nowInSequence;
    
    // FIXED: Only update camera targets when necessary and safe
    const shouldUpdateCamera =
      !lastAnimationState.current ||
      lastAnimationState.current.state !== newState ||
      lastAnimationState.current.cameraState !== newCameraState ||
      lastAnimationState.current.focusedFacet !== animationData.focusedFacet ||
      // Always update when entering/exiting coordinated sequences
      (wasInSequence !== nowInSequence);

    if (shouldUpdateCamera) {
      const cameraConfig = animationData.cameraConfig;
      stateChangeTime.current = Date.now();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📹 Camera target updated:', {
          state: newState,
          cameraState: newCameraState,
          isTransitioning,
          isCoordinated: nowInSequence,
          position: cameraConfig.position?.toArray(),
          target: cameraConfig.target?.toArray(),
          fov: cameraConfig.fov
        });
      }

      // Update targets
      if (cameraConfig.position) {
        currentTarget.current.position.copy(cameraConfig.position);
      }
      
      if (cameraConfig.target) {
        currentTarget.current.lookAt.copy(cameraConfig.target);
      }
      
      if (cameraConfig.fov !== undefined) {
        currentTarget.current.fov = cameraConfig.fov;
      }

      // FIXED: Set animation speeds based on state and timing
      if (nowInSequence) {
        // In coordinated sequences, use specific timing
        if (newState === 'exploding') {
          // Explosion sequence - smooth movement to overview
          animationSpeed.current.position = 0.02;
          animationSpeed.current.lookAt = 0.02;
          animationSpeed.current.fov = 0.02;
        } else if (newState === 'reforming') {
          // FIXED: Reform sequence - slower movement to ensure smooth completion
          // Use slower speeds so camera takes the full 1800ms to reach target
          animationSpeed.current.position = 0.015;  // Slower to match longer duration
          animationSpeed.current.lookAt = 0.015;
          animationSpeed.current.fov = 0.015;
        }
      } else if (isTransitioning) {
        // Other transitions
        if (animationData.isFastScrolling) {
          animationSpeed.current.position = 0.08;
          animationSpeed.current.lookAt = 0.08;
          animationSpeed.current.fov = 0.08;
        } else {
          animationSpeed.current.position = 0.04;
          animationSpeed.current.lookAt = 0.04;
          animationSpeed.current.fov = 0.04;
        }
      } else {
        // Non-transitioning states
        animationSpeed.current.position = 0.03;
        animationSpeed.current.lookAt = 0.03;
        animationSpeed.current.fov = 0.03;
      }
    }

    // Update state tracking
    lastAnimationState.current = {
      state: newState,
      cameraState: newCameraState,
      focusedFacet: animationData.focusedFacet,
      isTransitioning
    };
  }, [animationData]);

  /**
   * FIXED: Ultra-smooth animation loop with timing awareness
   */
  useFrame(() => {
    if (!currentTarget.current) return;

    // Use current animation speeds
    const currentSpeeds = animationSpeed.current;

    // FIXED: Calculate distance to target for dynamic speed adjustment
    const positionDistance = camera.position.distanceTo(currentTarget.current.position);
    const fovDistance = Math.abs(camera.fov - currentTarget.current.fov);
    
    // FIXED: Dynamic speed adjustment for coordinated sequences
    let speedMultiplier = 1.0;
    
    if (isInCoordinatedSequence.current) {
      const timeSinceStateChange = stateChangeTime.current ? Date.now() - stateChangeTime.current : 0;
      
      if (animationData.state === 'reforming') {
        // FIXED: Ensure camera movement completes in the full 1800ms duration
        const timeProgress = timeSinceStateChange / 1800; // 1800ms camera movement time
        const distanceProgress = 1 - (positionDistance / 10); // Normalize distance
        
        // Don't speed up too much - let it take the full time
        if (timeProgress > 0.8 && distanceProgress < 0.7) {
          speedMultiplier = 1.5; // Gentle speed up if really behind
        }
        
        // Debug info for reform timing
        if (process.env.NODE_ENV === 'development' && timeSinceStateChange % 200 < 16) {
          console.log(`📹 Reform: ${timeProgress.toFixed(2)} time, ${distanceProgress.toFixed(2)} dist, speed: ${speedMultiplier.toFixed(1)}`);
        }
      }
    }

    // Apply speed multiplier
    const adjustedSpeeds = {
      position: currentSpeeds.position * speedMultiplier,
      lookAt: currentSpeeds.lookAt * speedMultiplier,
      fov: currentSpeeds.fov * speedMultiplier
    };

    // Smooth position interpolation
    camera.position.lerp(currentTarget.current.position, adjustedSpeeds.position);
    
    // Smooth look-at interpolation
    const currentDirection = new THREE.Vector3();
    camera.getWorldDirection(currentDirection);
    
    const targetDirection = new THREE.Vector3()
      .subVectors(currentTarget.current.lookAt, camera.position)
      .normalize();
    
    currentDirection.lerp(targetDirection, adjustedSpeeds.lookAt);
    
    const newLookAt = new THREE.Vector3()
      .addVectors(camera.position, currentDirection);
    
    camera.lookAt(newLookAt);
    
    // Smooth FOV interpolation
    const fovDiff = currentTarget.current.fov - camera.fov;
    camera.fov += fovDiff * adjustedSpeeds.fov;
    camera.updateProjectionMatrix();

    // Debug logging for coordinated sequences
    if (process.env.NODE_ENV === 'development' && isInCoordinatedSequence.current) {
      const timeSinceChange = stateChangeTime.current ? Date.now() - stateChangeTime.current : 0;
      if (timeSinceChange % 500 < 16) { // Log every 500ms
        console.log(`📹 Camera sync: ${animationData.state}, distance: ${positionDistance.toFixed(2)}, time: ${timeSinceChange}ms`);
      }
    }
  });

  /**
   * Handle mobile optimizations
   */
  useEffect(() => {
    if (isMobile) {
      // Slower animation on mobile for smoother feel
      Object.keys(animationSpeed.current).forEach(key => {
        animationSpeed.current[key] *= 0.8;
      });
    }
  }, [isMobile]);

  // This component doesn't render anything
  return null;
};

export default UnifiedCameraController;