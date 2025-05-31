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
  
  // Target values for smooth interpolation
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const targetFOV = useRef(45);
  
  // FIXED: Enhanced project switching with ultra-smooth transitions
  const projectSwitchState = useRef({
    isAnimating: false,
    phase: 'none', // 'none' | 'zoomOut' | 'zoomIn'
    startTime: 0,
    duration: 1800, // REDUCED from 2000 for snappier feel
    fromProject: null,
    toProject: null,
    intermediatePosition: new THREE.Vector3(0, 1.5, 5.5), // ADJUSTED for smoother overview
    intermediateLookAt: new THREE.Vector3(0, 0, 0),
    intermediateFOV: 50 // ADJUSTED FOV
  });
  
  // Previous values for smooth transitions
  const previousCameraState = useRef(null);
  const previousFocusedFacet = useRef(null);

  /**
   * FIXED: Handle project switching with smooth zoom-out-zoom-in
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
      
      // Start project switch animation
      projectSwitchState.current = {
        isAnimating: true,
        phase: 'zoomOut',
        startTime: performance.now(),
        duration: 1800, // Smooth but not too slow
        fromProject: previousProject,
        toProject: currentProject,
        intermediatePosition: new THREE.Vector3(0, 1.5, 5.5), // Better intermediate position
        intermediateLookAt: new THREE.Vector3(0, 0, 0),
        intermediateFOV: 50
      };
    }

    previousFocusedFacet.current = currentProject;
  }, [animationData?.focusedFacet, animationData?.cameraState]);

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
  }, [animationData?.cameraConfig, animationData?.cameraState]);

  /**
   * FIXED: Ultra-smooth camera animation every frame - NO POPPING
   */
  useFrame(() => {
    if (!animationData) return;

    // Handle project switching animation
    if (projectSwitchState.current.isAnimating) {
      const elapsed = performance.now() - projectSwitchState.current.startTime;
      const totalDuration = projectSwitchState.current.duration;
      const halfDuration = totalDuration / 2;
      
      if (elapsed < halfDuration) {
        // Phase 1: Zoom out - ULTRA SMOOTH
        projectSwitchState.current.phase = 'zoomOut';
        const progress = elapsed / halfDuration;
        const easedProgress = ultraSmoothEasing(progress);
        
        // Animate to intermediate position with ultra-smooth easing
        camera.position.lerp(projectSwitchState.current.intermediatePosition, easedProgress * 0.08); // REDUCED for ultra-smooth
        camera.fov = THREE.MathUtils.lerp(camera.fov, projectSwitchState.current.intermediateFOV, easedProgress * 0.08);
        camera.lookAt(projectSwitchState.current.intermediateLookAt);
        camera.updateProjectionMatrix();
        
      } else if (elapsed < totalDuration) {
        // Phase 2: Zoom in to new project - ULTRA SMOOTH
        if (projectSwitchState.current.phase === 'zoomOut') {
          // Just started zoom in phase - update targets to new project
          projectSwitchState.current.phase = 'zoomIn';
          
          // Get the new project's camera config
          const newProjectConfig = animationData.cameraConfig;
          if (newProjectConfig) {
            targetPosition.current.copy(newProjectConfig.position);
            targetLookAt.current.copy(newProjectConfig.target);
            targetFOV.current = newProjectConfig.fov;
          }
        }
        
        const progress = (elapsed - halfDuration) / halfDuration;
        const easedProgress = ultraSmoothEasing(progress);
        
        // Animate to final position with ultra-smooth easing
        camera.position.lerp(targetPosition.current, easedProgress * 0.06); // REDUCED for ultra-smooth
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV.current, easedProgress * 0.06);
        
        // Ultra-smooth look-at transition
        const direction = new THREE.Vector3();
        direction.subVectors(targetLookAt.current, camera.position).normalize();
        const lookAtPoint = new THREE.Vector3();
        lookAtPoint.addVectors(camera.position, direction);
        camera.lookAt(lookAtPoint);
        camera.updateProjectionMatrix();
        
      } else {
        // Animation complete
        projectSwitchState.current.isAnimating = false;
        projectSwitchState.current.phase = 'none';
        
        console.log('📹 Ultra-smooth project switch complete');
      }
      
      return; // Skip normal camera animation during project switching
    }

    // FIXED: Normal camera animation with ultra-smooth interpolation
    let baseLerpSpeed = 0.025; // HEAVILY REDUCED from 0.04 for ultra-smooth movement
    
    // Slightly faster during fast scrolling but still smooth
    if (animationData.isFastScrolling) {
      baseLerpSpeed *= 1.3; // REDUCED from 1.5
    }
    
    // Slightly faster during transitions but still smooth
    if (animationData.isTransitioning) {
      baseLerpSpeed *= 1.1; // REDUCED from 1.2
    }
    
    // Even slower on mobile for maximum smoothness
    if (isMobile) {
      baseLerpSpeed *= 0.75; // REDUCED from 0.8
    }
    
    // REDUCED max lerp speed to prevent any popping
    const lerpSpeed = Math.min(baseLerpSpeed, 0.08); // REDUCED max from 0.15

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