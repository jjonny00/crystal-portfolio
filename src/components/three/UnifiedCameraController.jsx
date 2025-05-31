// src/components/three/UnifiedCameraController.jsx
// Phase 1: Single camera controller with enhanced project switching

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Unified Camera Controller
 * Enhanced with zoom-out-zoom-in transitions for project switching
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
  
  // Project switching animation state
  const projectSwitchState = useRef({
    isAnimating: false,
    phase: 'none', // 'none' | 'zoomOut' | 'zoomIn'
    startTime: 0,
    duration: 2000,
    fromProject: null,
    toProject: null,
    intermediatePosition: new THREE.Vector3(),
    intermediateLookAt: new THREE.Vector3(),
    intermediateFOV: 55
  });
  
  // Previous values for smooth transitions
  const previousCameraState = useRef(null);
  const previousFocusedFacet = useRef(null);

  /**
   * Handle project switching with zoom-out-zoom-in animation
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
      console.log('📹 Starting project switch animation:', previousProject, '→', currentProject);
      
      // Start project switch animation
      projectSwitchState.current = {
        isAnimating: true,
        phase: 'zoomOut',
        startTime: performance.now(),
        duration: animationData.config?.timing?.projectSwitch || 2000,
        fromProject: previousProject,
        toProject: currentProject,
        intermediatePosition: new THREE.Vector3(0, 2, 6), // Zoom out position
        intermediateLookAt: new THREE.Vector3(0, 0, 0),   // Look at center
        intermediateFOV: 55 // Wider FOV for overview
      };
    }

    previousFocusedFacet.current = currentProject;
  }, [animationData?.focusedFacet, animationData?.cameraState]);

  /**
   * Update target values when animation state changes
   */
  useEffect(() => {
    if (!animationData?.cameraConfig) return;

    // Don't update targets during project switching animation
    if (projectSwitchState.current.isAnimating) return;

    const cameraConfig = animationData.cameraConfig;
    
    // Update target position
    if (cameraConfig.position) {
      targetPosition.current.copy(cameraConfig.position);
    }
    
    // Update target look-at
    if (cameraConfig.target) {
      targetLookAt.current.copy(cameraConfig.target);
    }
    
    // Update target FOV
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
   * Smooth camera animation every frame
   */
  useFrame(() => {
    if (!animationData) return;

    // Handle project switching animation
    if (projectSwitchState.current.isAnimating) {
      const elapsed = performance.now() - projectSwitchState.current.startTime;
      const totalDuration = projectSwitchState.current.duration;
      const halfDuration = totalDuration / 2;
      
      if (elapsed < halfDuration) {
        // Phase 1: Zoom out
        projectSwitchState.current.phase = 'zoomOut';
        const progress = elapsed / halfDuration;
        const easedProgress = easeInOutCubic(progress);
        
        // Animate to intermediate position
        camera.position.lerp(projectSwitchState.current.intermediatePosition, easedProgress * 0.15);
        camera.fov = THREE.MathUtils.lerp(camera.fov, projectSwitchState.current.intermediateFOV, easedProgress * 0.15);
        camera.lookAt(projectSwitchState.current.intermediateLookAt);
        camera.updateProjectionMatrix();
        
      } else if (elapsed < totalDuration) {
        // Phase 2: Zoom in to new project
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
        const easedProgress = easeInOutCubic(progress);
        
        // Animate to final position
        camera.position.lerp(targetPosition.current, easedProgress * 0.1);
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV.current, easedProgress * 0.1);
        
        // Smooth look-at transition
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
        
        console.log('📹 Project switch animation complete');
      }
      
      return; // Skip normal camera animation during project switching
    }

    // Normal camera animation (when not switching projects)
    let baseLerpSpeed = 0.04; // REDUCED from 0.05 for smoother transitions
    
    // Faster transitions during fast scrolling
    if (animationData.isFastScrolling) {
      baseLerpSpeed *= 1.5; // REDUCED from 2 for less aggressive speed changes
    }
    
    // Faster transitions during explicit transitions
    if (animationData.isTransitioning) {
      baseLerpSpeed *= 1.2; // REDUCED from 1.5
    }
    
    // Slower on mobile for smoother feel
    if (isMobile) {
      baseLerpSpeed *= 0.8;
    }
    
    // Clamp lerp speed
    const lerpSpeed = Math.min(baseLerpSpeed, 0.15); // REDUCED max from 0.2

    // Smooth position transition
    camera.position.lerp(targetPosition.current, lerpSpeed);
    
    // Smooth look-at transition
    const direction = new THREE.Vector3();
    direction.subVectors(targetLookAt.current, camera.position).normalize();
    
    const currentDirection = new THREE.Vector3();
    camera.getWorldDirection(currentDirection);
    
    // Lerp the direction vector
    currentDirection.lerp(direction, lerpSpeed);
    
    // Apply the new look direction
    const lookAtPoint = new THREE.Vector3();
    lookAtPoint.addVectors(camera.position, currentDirection);
    camera.lookAt(lookAtPoint);
    
    // Smooth FOV transition
    const fovDiff = targetFOV.current - camera.fov;
    camera.fov += fovDiff * lerpSpeed;
    camera.updateProjectionMatrix();
  });

  /**
   * Initialize camera position on mount
   */
  useEffect(() => {
    if (animationData?.cameraConfig) {
      // Set initial position immediately (no lerp on first load)
      camera.position.copy(animationData.cameraConfig.position);
      camera.lookAt(animationData.cameraConfig.target);
      camera.fov = animationData.cameraConfig.fov;
      camera.updateProjectionMatrix();
      
      // Update targets
      targetPosition.current.copy(animationData.cameraConfig.position);
      targetLookAt.current.copy(animationData.cameraConfig.target);
      targetFOV.current = animationData.cameraConfig.fov;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📹 Camera initialized:', {
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
 * Easing function for smooth animations
 */
const easeInOutCubic = (t) => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export default UnifiedCameraController;