// FIXED: src/components/three/UnifiedCameraController.jsx
// Camera controller that prevents jumps and coordinates smoothly with animation sequences

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * FIXED: Camera Controller with eliminated jumps and smooth coordination
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
  
  // FIXED: Adaptive animation speeds based on transition state
  const animationSpeed = useRef({
    position: 0.025,
    lookAt: 0.025,
    fov: 0.025
  });
  
  // FIXED: State coordination tracking
  const lastAnimationState = useRef(null);
  const coordinatedTransition = useRef(false);
  const stateChangeTimeout = useRef(null);

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
   * FIXED: Coordinated camera updates that prevent jumps
   */
  useEffect(() => {
    if (!animationData?.cameraConfig) return;

    const newState = animationData.state;
    const newCameraState = animationData.cameraState;
    const isTransitioning = animationData.isTransitioning;
    
    // FIXED: Detect when we're in a coordinated sequence
    const isCoordinatedSequence = 
      newState === 'preparing_explosion' ||
      newState === 'exploding' ||
      newState === 'explosion_settling' ||
      newState === 'preparing_reform' ||
      newState === 'reforming_crystal' ||
      newState === 'reforming_camera' ||
      newState === 'reform_settling';
    
    // FIXED: Only update camera targets when necessary
    const shouldUpdateCamera = 
      !lastAnimationState.current ||
      lastAnimationState.current.cameraState !== newCameraState ||
      (!coordinatedTransition.current && isCoordinatedSequence);

    if (shouldUpdateCamera) {
      const cameraConfig = animationData.cameraConfig;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📹 Camera target updated:', {
          state: newState,
          cameraState: newCameraState,
          isTransitioning,
          isCoordinated: isCoordinatedSequence,
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

      // FIXED: Coordinated animation speeds
      if (isCoordinatedSequence) {
        coordinatedTransition.current = true;
        
        // Different speeds for different phases
        if (newState === 'preparing_explosion' || newState === 'preparing_reform') {
          // Preparation phases - medium speed
          animationSpeed.current.position = 0.035;
          animationSpeed.current.lookAt = 0.035;
          animationSpeed.current.fov = 0.035;
        } else if (newState === 'exploding' || newState === 'reforming_camera') {
          // Main animation phases - slower for smoothness
          animationSpeed.current.position = 0.025;
          animationSpeed.current.lookAt = 0.025;
          animationSpeed.current.fov = 0.025;
        } else if (newState === 'reforming_crystal') {
          // Crystal reform phase - camera should stay relatively still
          animationSpeed.current.position = 0.015;
          animationSpeed.current.lookAt = 0.015;
          animationSpeed.current.fov = 0.015;
        } else {
          // Settling phases - slightly faster to snap to final position
          animationSpeed.current.position = 0.045;
          animationSpeed.current.lookAt = 0.045;
          animationSpeed.current.fov = 0.045;
        }
        
        // FIXED: Clear coordination flag after sequence
        if (stateChangeTimeout.current) {
          clearTimeout(stateChangeTimeout.current);
        }
        
        stateChangeTimeout.current = setTimeout(() => {
          coordinatedTransition.current = false;
          
          // Return to normal speeds
          animationSpeed.current.position = 0.03;
          animationSpeed.current.lookAt = 0.03;
          animationSpeed.current.fov = 0.03;
          
          if (process.env.NODE_ENV === 'development') {
            console.log('📹 Coordinated transition completed, returning to normal speeds');
          }
        }, 2000); // Give enough time for sequences to complete
        
      } else if (!isTransitioning) {
        // Non-coordinated, non-transitioning updates
        coordinatedTransition.current = false;
        
        if (animationData.isFastScrolling) {
          // Fast scrolling
          animationSpeed.current.position = 0.08;
          animationSpeed.current.lookAt = 0.08;
          animationSpeed.current.fov = 0.08;
        } else {
          // Normal speed
          animationSpeed.current.position = 0.03;
          animationSpeed.current.lookAt = 0.03;
          animationSpeed.current.fov = 0.03;
        }
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
   * FIXED: Ultra-smooth animation loop with coordination awareness
   */
  useFrame(() => {
    if (!currentTarget.current) return;

    // FIXED: Use current animation speeds (which are set based on coordination state)
    const currentSpeeds = animationSpeed.current;

    // Smooth position interpolation
    camera.position.lerp(currentTarget.current.position, currentSpeeds.position);
    
    // Smooth look-at interpolation
    const currentDirection = new THREE.Vector3();
    camera.getWorldDirection(currentDirection);
    
    const targetDirection = new THREE.Vector3()
      .subVectors(currentTarget.current.lookAt, camera.position)
      .normalize();
    
    currentDirection.lerp(targetDirection, currentSpeeds.lookAt);
    
    const newLookAt = new THREE.Vector3()
      .addVectors(camera.position, currentDirection);
    
    camera.lookAt(newLookAt);
    
    // Smooth FOV interpolation
    const fovDiff = currentTarget.current.fov - camera.fov;
    camera.fov += fovDiff * currentSpeeds.fov;
    camera.updateProjectionMatrix();
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

  /**
   * Cleanup
   */
  useEffect(() => {
    return () => {
      if (stateChangeTimeout.current) {
        clearTimeout(stateChangeTimeout.current);
      }
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default UnifiedCameraController;