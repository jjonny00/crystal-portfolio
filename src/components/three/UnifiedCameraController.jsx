// FIXED: src/components/three/UnifiedCameraController.jsx
// Simplified camera controller with smooth transitions for immediate state changes

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * SIMPLIFIED: Camera Controller with smooth transitions to immediate target changes
 */
const UnifiedCameraController = ({ 
  animationData,
  config,
  isMobile = false 
}) => {
  const { camera } = useThree();
  
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
   * FIXED: Update camera targets when config changes with state-aware timing
   */
  useEffect(() => {
    if (!animationData?.cameraConfig) return;

    const newConfig = animationData.cameraConfig;
    
    // Check if config actually changed to avoid unnecessary updates
    const configChanged = !lastCameraConfig.current ||
      !newConfig.position?.equals(lastCameraConfig.current.position) ||
      !newConfig.target?.equals(lastCameraConfig.current.target) ||
      newConfig.fov !== lastCameraConfig.current.fov;

    if (configChanged) {
      if (process.env.NODE_ENV === 'development') {
        console.log('📹 Camera target updated:', {
          state: animationData.state,
          cameraState: animationData.cameraState,
          focusedFacet: animationData.focusedFacet,
          position: newConfig.position?.toArray(),
          target: newConfig.target?.toArray(),
          fov: newConfig.fov
        });
      }

      // Update targets immediately
      if (newConfig.position) {
        currentTarget.current.position.copy(newConfig.position);
      }
      
      if (newConfig.target) {
        currentTarget.current.lookAt.copy(newConfig.target);
      }
      
      if (newConfig.fov !== undefined) {
        currentTarget.current.fov = newConfig.fov;
      }

      // FIXED: State-aware animation speeds to match visual expectations
      const positionDistance = camera.position.distanceTo(currentTarget.current.position);
      
      // Different speeds based on the type of transition
      if (animationData.state === 'hero' && positionDistance > 3) {
        // Returning to hero from far away (about/projects) - smooth but not too slow
        animationSpeed.current.position = 0.025;
        animationSpeed.current.lookAt = 0.025;
        animationSpeed.current.fov = 0.025;
      } else if (animationData.state === 'overview' && positionDistance > 2) {
        // Moving to overview (explosion view) - slightly faster for drama
        animationSpeed.current.position = 0.035;
        animationSpeed.current.lookAt = 0.035;
        animationSpeed.current.fov = 0.035;
      } else if (animationData.state === 'about' && positionDistance > 2) {
        // Moving to about (reform view) - slower for contemplative feel
        animationSpeed.current.position = 0.02;
        animationSpeed.current.lookAt = 0.02;
        animationSpeed.current.fov = 0.02;
      } else if (animationData.cameraState === 'project' && animationData.focusedFacet) {
        // Project focus - quick and responsive
        animationSpeed.current.position = 0.05;
        animationSpeed.current.lookAt = 0.05;
        animationSpeed.current.fov = 0.05;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`📹 Project focus camera update: ${animationData.focusedFacet}, distance: ${positionDistance.toFixed(2)}`);
        }
      } else {
        // Default smooth speed
        animationSpeed.current.position = 0.03;
        animationSpeed.current.lookAt = 0.03;
        animationSpeed.current.fov = 0.03;
      }

      // Store current config for comparison
      lastCameraConfig.current = {
        position: newConfig.position?.clone(),
        target: newConfig.target?.clone(),
        fov: newConfig.fov
      };
    }
  }, [
    animationData?.cameraConfig, 
    animationData?.state, 
    animationData?.cameraState, 
    animationData?.focusedFacet, // FIXED: Add focusedFacet as dependency
    camera
  ]);

  /**
   * SIMPLIFIED: Smooth animation loop with consistent lerping
   */
  useFrame(() => {
    if (!currentTarget.current) return;

    const currentSpeeds = animationSpeed.current;

    // Smooth position interpolation
    camera.position.lerp(currentTarget.current.position, currentSpeeds.position);
    
    // Smooth look-at interpolation
    const currentDirection = new THREE.Vector3();
    camera.getWorldDirection(currentDirection);
    
    const targetDirection = new THREE.Vector3()
      .subVectors(currentTarget.current.lookAt, camera.position)
      .normalize();
    
    // Interpolate direction vectors
    currentDirection.lerp(targetDirection, currentSpeeds.lookAt);
    
    // Apply new look direction
    const newLookAt = new THREE.Vector3()
      .addVectors(camera.position, currentDirection);
    
    camera.lookAt(newLookAt);
    
    // Smooth FOV interpolation
    const fovDiff = currentTarget.current.fov - camera.fov;
    camera.fov += fovDiff * currentSpeeds.fov;
    camera.updateProjectionMatrix();

    // Optional: Debug logging for large movements
    if (process.env.NODE_ENV === 'development') {
      const positionDistance = camera.position.distanceTo(currentTarget.current.position);
      if (positionDistance > 0.1) {
        // Only log when camera is still moving significantly
        if (Math.random() < 0.01) { // Reduce log frequency
          console.log(`📹 Camera moving: distance ${positionDistance.toFixed(2)}, speed ${currentSpeeds.position.toFixed(3)}`);
        }
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
        animationSpeed.current[key] *= 0.7;
      });
    }
  }, [isMobile]);

  // This component doesn't render anything
  return null;
};

export default UnifiedCameraController;