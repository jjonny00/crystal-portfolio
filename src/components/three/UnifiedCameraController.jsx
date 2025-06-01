// src/components/three/UnifiedCameraController.jsx
// FIXED: Smooth camera movement with no popping throughout scroll

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * FIXED: Unified Camera Controller with ultra-smooth interpolation
 * No more camera popping - one continuous fluid movement
 */
const UnifiedCameraController = ({ 
  animationData,
  config,
  isMobile = false 
}) => {
  const { camera } = useThree();
  
  // FIXED: Use current camera position as baseline, not preset positions
  const currentCameraPosition = useRef(new THREE.Vector3());
  const currentCameraTarget = useRef(new THREE.Vector3());
  const currentCameraFOV = useRef(45);
  
  // Target values for smooth interpolation
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const targetFOV = useRef(45);
  
  // FIXED: Enhanced project switching with ultra-smooth transitions
  const projectSwitchState = useRef({
    isAnimating: false,
    phase: 'none', // 'none' | 'directTransition'
    startTime: 0,
    duration: 1400, // REDUCED from 2000 for snappier feel
    fromProject: null,
    toProject: null,
    // REMOVED: Fixed intermediate positions - use current position instead
    startPosition: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    startFOV: 45
  });
  
  // Previous values for smooth transitions
  const previousCameraState = useRef(null);
  const previousFocusedFacet = useRef(null);

  // Initialize current camera state from actual camera
  useEffect(() => {
    currentCameraPosition.current.copy(camera.position);
    currentCameraFOV.current = camera.fov;
    
    // Calculate current look-at direction
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    currentCameraTarget.current.copy(camera.position).add(direction);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📹 Camera state initialized from current position:', {
        position: currentCameraPosition.current.toArray(),
        fov: currentCameraFOV.current
      });
    }
  }, [camera]);

  /**
   * FIXED: Handle project switching with smooth movement from current position
   */
  useEffect(() => {
    if (!animationData) return;

    const currentProject = animationData.focusedFacet;
    const previousProject = previousFocusedFacet.current;

    // Check if we're switching between projects (not just entering/leaving projects)
    const isSwitchingProjects = previousProject && 
                               currentProject && 
                               previousProject !== currentProject &&
                               animationData.cameraState === 'project';

    if (isSwitchingProjects) {
      console.log('📹 Starting ultra-smooth project switch:', previousProject, '→', currentProject);
      
      // FIXED: Use CURRENT camera position as starting point
      currentCameraPosition.current.copy(camera.position);
      
      // Calculate current look-at direction
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      currentCameraTarget.current.copy(camera.position).add(direction);
      currentCameraFOV.current = camera.fov;
      
      // Start project switch animation from CURRENT position
      projectSwitchState.current = {
        isAnimating: true,
        phase: 'directTransition', // SIMPLIFIED: Direct transition
        startTime: performance.now(),
        duration: 1400, // Smooth but not too slow
        fromProject: previousProject,
        toProject: currentProject,
        // Store current position as starting point
        startPosition: currentCameraPosition.current.clone(),
        startTarget: currentCameraTarget.current.clone(),
        startFOV: currentCameraFOV.current
      };
    }

    previousFocusedFacet.current = currentProject;
  }, [animationData?.focusedFacet, animationData?.cameraState, camera]);

  /**
   * FIXED: Update target values when animation state changes - NO POPPING
   */
  useEffect(() => {
    if (!animationData?.cameraConfig) return;

    // Don't update targets during project switching animation
    if (projectSwitchState.current.isAnimating) return;

    const cameraConfig = animationData.cameraConfig;
    
    // SMOOTH update - no sudden jumps
    if (cameraConfig.position) {
      targetPosition.current.copy(cameraConfig.position);
    }
    
    if (cameraConfig.target) {
      targetLookAt.current.copy(cameraConfig.target);
    }
    
    if (cameraConfig.fov) {
      targetFOV.current = cameraConfig.fov;
    }

    // Update current state tracking
    currentCameraPosition.current.copy(camera.position);
    currentCameraFOV.current = camera.fov;

    // Log camera state changes in development
    if (process.env.NODE_ENV === 'development') {
      const stateChanged = previousCameraState.current !== animationData.cameraState;
      
      if (stateChanged) {
        console.log('📹 Camera target updated:', {
          cameraState: animationData.cameraState,
          focusedFacet: animationData.focusedFacet,
          position: targetPosition.current.toArray().map(v => Math.round(v * 100) / 100),
          target: targetLookAt.current.toArray().map(v => Math.round(v * 100) / 100),
          fov: targetFOV.current
        });
        
        previousCameraState.current = animationData.cameraState;
      }
    }
  }, [animationData?.cameraConfig, animationData?.cameraState, camera]);

  /**
   * FIXED: Ultra-smooth camera animation every frame - NO POPPING
   */
  useFrame(() => {
    if (!animationData) return;

    // Handle project switching animation
    if (projectSwitchState.current.isAnimating) {
      const elapsed = performance.now() - projectSwitchState.current.startTime;
      const progress = Math.min(elapsed / projectSwitchState.current.duration, 1);
      
      // Ultra-smooth easing
      const easedProgress = ultraSmoothEasing(progress);
      
      // FIXED: Get target position for new project
      const newProjectConfig = animationData.cameraConfig;
      if (newProjectConfig) {
        // Interpolate from CURRENT position to target position
        camera.position.lerpVectors(
          projectSwitchState.current.startPosition,
          newProjectConfig.position,
          easedProgress
        );
        
        camera.fov = THREE.MathUtils.lerp(
          projectSwitchState.current.startFOV,
          newProjectConfig.fov,
          easedProgress
        );
        
        // Smooth look-at transition
        const targetDirection = new THREE.Vector3()
          .subVectors(newProjectConfig.target, newProjectConfig.position)
          .normalize();
        
        const startDirection = new THREE.Vector3()
          .subVectors(projectSwitchState.current.startTarget, projectSwitchState.current.startPosition)
          .normalize();
        
        const currentDirection = new THREE.Vector3()
          .lerpVectors(startDirection, targetDirection, easedProgress);
        
        const lookAtPoint = new THREE.Vector3()
          .addVectors(camera.position, currentDirection);
        
        camera.lookAt(lookAtPoint);
        camera.updateProjectionMatrix();
      }
      
      if (progress >= 1) {
        // Animation complete
        projectSwitchState.current.isAnimating = false;
        console.log('📹 Ultra-smooth project switch complete');
      }
      
      return; // Skip normal camera animation during project switching
    }

    // FIXED: Normal camera animation with ultra-smooth interpolation
    let baseLerpSpeed = 0.02; // HEAVILY REDUCED from 0.025 for ultra-smooth movement
    
    // Slightly faster during fast scrolling but still smooth
    if (animationData.isFastScrolling) {
      baseLerpSpeed *= 1.1; // REDUCED from 1.3
    }
    
    // Slightly faster during transitions but still smooth
    if (animationData.isTransitioning) {
      baseLerpSpeed *= 1.05; // REDUCED from 1.1
    }
    
    // Even slower on mobile for maximum smoothness
    if (isMobile) {
      baseLerpSpeed *= 0.9; // REDUCED from 0.75
    }
    
    // REDUCED max lerp speed to prevent any popping
    const lerpSpeed = Math.min(baseLerpSpeed, 0.06); // REDUCED max from 0.08

    // Ultra-smooth position transition
    camera.position.lerp(targetPosition.current, lerpSpeed);
    
    // Ultra-smooth look-at transition
    const direction = new THREE.Vector3();
    direction.subVectors(targetLookAt.current, camera.position).normalize();
    
    const currentDirection = new THREE.Vector3();
    camera.getWorldDirection(currentDirection);
    
    // Ultra-smooth direction interpolation
    currentDirection.lerp(direction, lerpSpeed);
    
    // Apply the new look direction smoothly
    const lookAtPoint = new THREE.Vector3();
    lookAtPoint.addVectors(camera.position, currentDirection);
    camera.lookAt(lookAtPoint);
    
    // Ultra-smooth FOV transition
    const fovDiff = targetFOV.current - camera.fov;
    camera.fov += fovDiff * lerpSpeed;
    camera.updateProjectionMatrix();
    
    // Update current state tracking
    currentCameraPosition.current.copy(camera.position);
    currentCameraFOV.current = camera.fov;
  });

  /**
   * Initialize camera position on mount - SMOOTH
   */
  useEffect(() => {
    if (animationData?.cameraConfig) {
      // Set initial position smoothly (small lerp on first load)
      camera.position.lerp(animationData.cameraConfig.position, 0.1);
      camera.lookAt(animationData.cameraConfig.target);
      camera.fov = THREE.MathUtils.lerp(camera.fov, animationData.cameraConfig.fov, 0.1);
      camera.updateProjectionMatrix();
      
      // Update targets
      targetPosition.current.copy(animationData.cameraConfig.position);
      targetLookAt.current.copy(animationData.cameraConfig.target);
      targetFOV.current = animationData.cameraConfig.fov;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📹 Camera initialized smoothly:', {
          position: camera.position.toArray(),
          fov: camera.fov
        });
      }
    }
  }, []); // Only run on mount

  // This component doesn't render anything in the scene
  return null;
};

/**
 * FIXED: Ultra-smooth easing function - no harsh transitions
 */
const ultraSmoothEasing = (t) => {
  // Use smoothstep for ultra-smooth transitions
  return t * t * t * (t * (t * 6 - 15) + 10);
};

export default UnifiedCameraController;