// src/components/three/UnifiedCameraController.jsx
// FIXED: No more camera popping - single smooth animation system

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * FIXED: Single Animation System - No More Popping
 * All camera movements use the same smooth lerp system
 */
const UnifiedCameraController = ({ 
  animationData,
  config,
  isMobile = false 
}) => {
  const { camera } = useThree();
  
  // SINGLE source of truth for camera animation
  const currentTarget = useRef({
    position: new THREE.Vector3(),
    lookAt: new THREE.Vector3(), 
    fov: 45
  });
  
  // Animation speed control
  const animationSpeed = useRef({
    position: 0.025,  // Smooth but responsive
    lookAt: 0.025,
    fov: 0.025
  });
  
  // State tracking for debug
  const lastAnimationData = useRef(null);

  /**
   * FIXED: Initialize current target from camera's actual position
   */
  useEffect(() => {
    currentTarget.current.position.copy(camera.position);
    currentTarget.current.fov = camera.fov;
    
    // Calculate current look-at direction
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    currentTarget.current.lookAt.copy(camera.position).add(direction);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📹 Camera initialized from current position:', {
        position: camera.position.toArray(),
        fov: camera.fov
      });
    }
  }, [camera]);

  /**
   * FIXED: Update targets for EVERY animation data change
   * Never set camera directly, only update targets
   */
  useEffect(() => {
    if (!animationData?.cameraConfig) return;

    const cameraConfig = animationData.cameraConfig;
    
    // FIXED: Always check if the target position actually changed
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
          state: animationData.cameraState,
          facet: animationData.focusedFacet,
          position: cameraConfig.position?.toArray(),
          target: cameraConfig.target?.toArray(),
          fov: cameraConfig.fov,
          positionChanged,
          targetChanged,
          fovChanged
        });
      }

      // FIXED: Update all targets regardless of what changed
      if (cameraConfig.position) {
        currentTarget.current.position.copy(cameraConfig.position);
      }
      
      if (cameraConfig.target) {
        currentTarget.current.lookAt.copy(cameraConfig.target);
      }
      
      if (cameraConfig.fov !== undefined) {
        currentTarget.current.fov = cameraConfig.fov;
      }

      // Adjust animation speed based on transition type
      const isProjectSwitch = 
        lastAnimationData.current?.focusedFacet && 
        animationData.focusedFacet && 
        lastAnimationData.current.focusedFacet !== animationData.focusedFacet;

      if (isProjectSwitch) {
        // Slower for project switches for ultra-smooth feel
        animationSpeed.current.position = 0.012;
        animationSpeed.current.lookAt = 0.012;
        animationSpeed.current.fov = 0.012;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Project switch detected:', lastAnimationData.current.focusedFacet, '→', animationData.focusedFacet);
        }
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

    // Always update last animation data to track changes
    lastAnimationData.current = {
      cameraState: animationData.cameraState,
      focusedFacet: animationData.focusedFacet,
      crystalForm: animationData.crystalForm
    };
  }, [animationData]);

  /**
   * FIXED: Single smooth animation loop - no conflicts
   * This is the ONLY place the camera gets modified
   */
  useFrame(() => {
    if (!currentTarget.current) return;

    // Smooth position interpolation
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
  });

  /**
   * Handle mobile optimizations
   */
  useEffect(() => {
    if (isMobile) {
      // Slower animation on mobile for smoother feel
      animationSpeed.current.position *= 0.8;
      animationSpeed.current.lookAt *= 0.8;
      animationSpeed.current.fov *= 0.8;
    }
  }, [isMobile]);

  // This component doesn't render anything
  return null;
};

export default UnifiedCameraController;