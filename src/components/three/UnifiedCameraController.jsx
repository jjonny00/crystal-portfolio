// src/components/three/UnifiedCameraController.jsx
// FIXED: Coordinated camera movement that prevents jumps during transitions

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * FIXED: Camera Controller with transition coordination
 */
const UnifiedCameraController = ({ 
  animationData,
  config,
  isMobile = false 
}) => {
  const { camera } = useThree();
  
  // FIXED: Single source of truth for camera animation
  const currentTarget = useRef({
    position: new THREE.Vector3(),
    lookAt: new THREE.Vector3(), 
    fov: 45
  });
  
  // FIXED: Adaptive animation speed based on transition type
  const animationSpeed = useRef({
    position: 0.025,
    lookAt: 0.025,
    fov: 0.025
  });
  
  // State tracking for coordination
  const lastAnimationState = useRef(null);
  const transitionLock = useRef(false);

  /**
   * Initialize current target from camera's actual position
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
   * FIXED: Update targets with coordination and transition awareness
   */
  useEffect(() => {
    if (!animationData?.cameraConfig) return;

    const cameraConfig = animationData.cameraConfig;
    const currentState = animationData.state;
    
    // FIXED: Prevent camera updates during crystal animation sequences
    if (animationData.isTransitioning && 
        (currentState === 'preparing_explosion' || 
         currentState === 'exploding' || 
         currentState === 'preparing_reform' || 
         currentState === 'reforming')) {
      
      // Allow camera updates but use coordinated timing
      if (!transitionLock.current) {
        transitionLock.current = true;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📹 Camera coordinating with crystal animation:', currentState);
        }
      }
    } else {
      transitionLock.current = false;
    }
    
    // Check if the target position actually changed
    const positionChanged = cameraConfig.position && 
      !currentTarget.current.position.equals(cameraConfig.position);
    
    const targetChanged = cameraConfig.target && 
      !currentTarget.current.lookAt.equals(cameraConfig.target);
    
    const fovChanged = cameraConfig.fov && 
      Math.abs(currentTarget.current.fov - cameraConfig.fov) > 0.1;

    const hasChanged = positionChanged || targetChanged || fovChanged;

    if (hasChanged) {
      if (process.env.NODE_ENV === 'development') {
        console.log('📹 Camera target updated:', {
          state: currentState,
          facet: animationData.focusedFacet,
          position: cameraConfig.position?.toArray(),
          target: cameraConfig.target?.toArray(),
          fov: cameraConfig.fov,
          isTransitioning: animationData.isTransitioning
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

      // FIXED: Adjust animation speed based on transition type and coordination
      const isExplosionSequence = 
        currentState === 'preparing_explosion' || 
        currentState === 'exploding' || 
        currentState === 'explosion_settling';
        
      const isReformSequence = 
        currentState === 'preparing_reform' || 
        currentState === 'reforming' || 
        currentState === 'reform_settling';

      const isProjectSwitch = 
        lastAnimationState.current?.focusedFacet && 
        animationData.focusedFacet && 
        lastAnimationState.current.focusedFacet !== animationData.focusedFacet;

      if (isExplosionSequence) {
        // Coordinated with explosion timing
        animationSpeed.current.position = 0.018; // Slightly slower
        animationSpeed.current.lookAt = 0.018;
        animationSpeed.current.fov = 0.018;
      } else if (isReformSequence) {
        // Coordinated with reform timing
        animationSpeed.current.position = 0.022; // Slightly faster for reform
        animationSpeed.current.lookAt = 0.022;
        animationSpeed.current.fov = 0.022;
      } else if (isProjectSwitch) {
        // Smooth project transitions
        animationSpeed.current.position = 0.015; // Slower for ultra-smooth feel
        animationSpeed.current.lookAt = 0.015;
        animationSpeed.current.fov = 0.015;
      } else if (animationData.isFastScrolling) {
        // Faster during fast scrolling
        animationSpeed.current.position = 0.06;
        animationSpeed.current.lookAt = 0.06;
        animationSpeed.current.fov = 0.06;
      } else {
        // Normal speed
        animationSpeed.current.position = 0.03;
        animationSpeed.current.lookAt = 0.03;
        animationSpeed.current.fov = 0.03;
      }
    }

    // Track state changes
    lastAnimationState.current = {
      state: currentState,
      focusedFacet: animationData.focusedFacet,
      crystalForm: animationData.crystalForm
    };
  }, [animationData]);

  /**
   * FIXED: Ultra-smooth animation loop with coordination awareness
   */
  useFrame(() => {
    if (!currentTarget.current) return;

    // FIXED: Skip camera updates during critical crystal transitions
    if (transitionLock.current && animationData?.isTransitioning) {
      // During explosion/reform, move camera more deliberately
      const criticalSpeed = {
        position: 0.012,
        lookAt: 0.012,
        fov: 0.012
      };

      // Smooth position interpolation
      camera.position.lerp(currentTarget.current.position, criticalSpeed.position);
      
      // Smooth look-at interpolation
      const currentDirection = new THREE.Vector3();
      camera.getWorldDirection(currentDirection);
      
      const targetDirection = new THREE.Vector3()
        .subVectors(currentTarget.current.lookAt, camera.position)
        .normalize();
      
      currentDirection.lerp(targetDirection, criticalSpeed.lookAt);
      
      const newLookAt = new THREE.Vector3()
        .addVectors(camera.position, currentDirection);
      
      camera.lookAt(newLookAt);
      
      // Smooth FOV interpolation
      const fovDiff = currentTarget.current.fov - camera.fov;
      camera.fov += fovDiff * criticalSpeed.fov;
      camera.updateProjectionMatrix();
    } else {
      // Normal smooth animation
      camera.position.lerp(
        currentTarget.current.position, 
        animationSpeed.current.position
      );
      
      // Smooth look-at interpolation
      const currentDirection = new THREE.Vector3();
      camera.getWorldDirection(currentDirection);
      
      const targetDirection = new THREE.Vector3()
        .subVectors(currentTarget.current.lookAt, camera.position)
        .normalize();
      
      currentDirection.lerp(targetDirection, animationSpeed.current.lookAt);
      
      const newLookAt = new THREE.Vector3()
        .addVectors(camera.position, currentDirection);
      
      camera.lookAt(newLookAt);
      
      // Smooth FOV interpolation
      const fovDiff = currentTarget.current.fov - camera.fov;
      camera.fov += fovDiff * animationSpeed.current.fov;
      camera.updateProjectionMatrix();
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