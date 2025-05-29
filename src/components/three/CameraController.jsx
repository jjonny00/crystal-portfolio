// src/components/three/CameraController.jsx - Enhanced with raised intro position and smooth transitions
// Updated camera controller with higher intro close position and smooth scroll-driven transitions

import { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Enhanced camera states with raised intro close position
const CAMERA_STATES = {
  INTRO_CLOSE: {
    position: [0, 2.5, 2.8], // RAISED: Increased Y from 1.2 to 2.5 for higher viewpoint
    target: [0, 0.3, 0],
    rotation: [0, 0, 0],
    fov: 35,
    description: 'High intimate view of crystal - elevated perspective'
  },
  INTRO: {
    position: [0, 0, 4.5],
    target: [0, 0, 0],
    rotation: [0, 0, 0],
    fov: 45,
    description: 'Standard intro view - reached after scroll feedback'
  },
  EXPLOSION: {
    position: [0, 0, 8],
    target: [0, 0, 0],
    rotation: [0, 0, 0],
    fov: 45,
    description: 'Wide view to see all exploded facets'
  },
  PROJECT_EMPATHY: {
    position: [2.5, -2.0, 3.5],
    target: [0.3, -0.7, -0.2],
    rotation: [0, 0, 0],
    fov: 35,
    description: 'Close-up view of empathy facet'
  },
  PROJECT_NARRATIVE: {
    position: [2.8, 0.5, 3.2],
    target: [0.3, -0.1, -0.7],
    rotation: [0, 0, 0],
    fov: 35,
    description: 'Close-up view of narrative facet'
  },
  PROJECT_CRAFT: {
    position: [3.8, 2.3, 2.0],
    target: [1.3, 0.8, 0.5],
    rotation: [0, 0, 0],
    fov: 35,
    description: 'Close-up view of craft facet'
  },
  PROJECT_SYSTEM: {
    position: [-2.0, 1.2, 1.5],
    target: [-0.5, 0.2, -1.8],
    rotation: [0, 0, 0],
    fov: 35,
    description: 'Close-up view of system facet'
  },
  PROJECT_LEADERSHIP: {
    position: [2.9, 3.7, 2.4],
    target: [0.4, 1.2, 0.9],
    rotation: [0, 0, 0],
    fov: 35,
    description: 'Close-up view of leadership facet'
  },
  PROJECT_EXPLORATION: {
    position: [-2.1, 2.2, 2.5],
    target: [-0.6, 0.7, 0.0],
    rotation: [0, 0, 0],
    fov: 35,
    description: 'Close-up view of exploration facet'
  }
};

// Helper functions
const getCameraState = (stateName) => {
  return CAMERA_STATES[stateName] || null;
};

const getTransitionTiming = (fromState, toState) => {
  if (fromState === 'INTRO_CLOSE' && toState === 'INTRO') {
    return 800; // Smooth scroll transition
  }
  return 1200; // Default timing
};

const getTransitionEasing = (fromState, toState) => {
  // Smooth easing for all transitions
  return (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// Import state machine constants
import { CRYSTAL_STATES } from '../../machines/crystalStateMachine';

const CameraController = ({ 
  isExploded,
  crystalState,
  selectedFacet = null,
  facetRefs = { current: [] },
  config,
  facetLabels = [],
  debugMode = false,
  scrollCrystalData = null
}) => {
  const { camera, clock } = useThree();
  
  // Camera animation state
  const cameraAnimation = useRef({
    active: false,
    startTime: 0,
    duration: 1000,
    startPosition: null,
    targetPosition: null,
    startRotation: null,
    targetRotation: null,
    startFOV: null,
    targetFOV: null,
    easingFunction: null
  });
  
  // Enhanced scroll-based interpolation state for intro
  const scrollInterpolation = useRef({
    active: false,
    fromState: null,
    toState: null,
    fromPosition: null,
    toPosition: null,
    fromTarget: null,
    toTarget: null,
    fromFOV: null,
    toFOV: null
  });
  
  // State tracking
  const [currentCameraState, setCurrentCameraState] = useState('INTRO_CLOSE');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevCrystalState = useRef(CRYSTAL_STATES.WHOLE);
  const prevSelectedFacet = useRef(null);

  // Initialize camera to raised intro position
  useEffect(() => {
    const introCloseState = getCameraState('INTRO_CLOSE');
    if (introCloseState && !cameraAnimation.current.active) {
      camera.position.set(...introCloseState.position);
      camera.lookAt(...introCloseState.target);
      camera.fov = introCloseState.fov;
      camera.updateProjectionMatrix();
      setCurrentCameraState('INTRO_CLOSE');
      
      if (debugMode) {
        console.log('📹 Camera initialized to raised INTRO_CLOSE state:', introCloseState.position);
      }
    }
  }, [camera, debugMode]);

  // Enhanced scroll-based intro transitions with ultra-smooth camera movement
  useEffect(() => {
    if (!scrollCrystalData) return;
    
    const currentSection = scrollCrystalData.currentSection;
    
    // Handle silky smooth intro transitions (intro-close to intro)
    if ((currentSection.key === 'intro-close' || currentSection.key === 'intro') && 
        currentSection.enableScrollTransition) {
      
      // Calculate progress within the ENTIRE intro transition zone (both sections)
      let transitionProgress = 0;
      
      const introCloseSection = Object.values(scrollCrystalData.sections).find(s => s.key === 'intro-close');
      const introSection = Object.values(scrollCrystalData.sections).find(s => s.key === 'intro');
      
      if (introCloseSection && introSection) {
        // Total intro zone spans from intro-close start to intro end
        const totalIntroStart = introCloseSection.threshold;
        const totalIntroEnd = introSection.threshold + introSection.duration;
        const totalIntroDuration = totalIntroEnd - totalIntroStart;
        
        // Calculate progress across the entire intro zone
        const rawProgress = (scrollCrystalData.scrollProgress - totalIntroStart) / totalIntroDuration;
        transitionProgress = Math.max(0, Math.min(1, rawProgress));
        
        if (debugMode && Math.random() < 0.03) {
          console.log(`📹 Intro transition progress: ${Math.round(transitionProgress * 100)}% (scroll: ${Math.round(scrollCrystalData.scrollProgress * 100)}%)`);
        }
      }
      
      // Set up smooth interpolation between INTRO_CLOSE and INTRO
      if (!scrollInterpolation.current.active) {
        const fromState = getCameraState('INTRO_CLOSE');
        const toState = getCameraState('INTRO');
        
        if (fromState && toState) {
          scrollInterpolation.current = {
            active: true,
            fromState: 'INTRO_CLOSE',
            toState: 'INTRO',
            fromPosition: new THREE.Vector3(...fromState.position),
            toPosition: new THREE.Vector3(...toState.position),
            fromTarget: new THREE.Vector3(...fromState.target),
            toTarget: new THREE.Vector3(...toState.target),
            fromFOV: fromState.fov,
            toFOV: toState.fov
          };
          
          if (debugMode) {
            console.log('📹 Started ultra-smooth intro interpolation: INTRO_CLOSE → INTRO');
          }
        }
      }
      
      // Apply silky smooth interpolation based on scroll progress
      if (scrollInterpolation.current.active) {
        // Use ultra-smooth easing for intro camera movement
        const easedProgress = introSmoothEasing(transitionProgress);
        
        // Interpolate camera position
        const newPosition = new THREE.Vector3().lerpVectors(
          scrollInterpolation.current.fromPosition,
          scrollInterpolation.current.toPosition,
          easedProgress
        );
        
        // Interpolate look-at target
        const newTarget = new THREE.Vector3().lerpVectors(
          scrollInterpolation.current.fromTarget,
          scrollInterpolation.current.toTarget,
          easedProgress
        );
        
        // Interpolate FOV
        const newFOV = THREE.MathUtils.lerp(
          scrollInterpolation.current.fromFOV,
          scrollInterpolation.current.toFOV,
          easedProgress
        );
        
        // Apply to camera
        camera.position.copy(newPosition);
        camera.lookAt(newTarget);
        camera.fov = newFOV;
        camera.updateProjectionMatrix();
      }
    } else {
      // Clear scroll interpolation when not in intro transition
      if (scrollInterpolation.current.active) {
        scrollInterpolation.current.active = false;
        if (debugMode) {
          console.log('📹 Ended scroll interpolation');
        }
      }
      
      // IMPORTANT: Handle project camera states directly for immediate response
      if (currentSection.projectKey) {
        const projectCameraState = `PROJECT_${currentSection.projectKey.toUpperCase()}`;
        const targetState = getCameraState(projectCameraState);
        
        if (targetState && currentCameraState !== projectCameraState) {
          if (debugMode) {
            console.log(`📹 Direct project camera transition: ${currentCameraState} → ${projectCameraState}`);
          }
          
          // Immediate transition to project camera
          transitionToState(projectCameraState, currentCameraState);
          setCurrentCameraState(projectCameraState);
        }
      }
    }
  }, [
    scrollCrystalData?.scrollProgress, 
    scrollCrystalData?.currentSection, 
    camera, 
    debugMode,
    currentCameraState
  ]);

  // Handle crystal state changes (keep existing logic for non-intro states)
  useEffect(() => {
    if (prevCrystalState.current === crystalState) return;
    
    // Skip camera state transitions during intro scroll interpolation
    if (scrollInterpolation.current.active) {
      prevCrystalState.current = crystalState;
      return;
    }
    
    const newCameraState = mapCrystalStateToCameraState(crystalState, selectedFacet);
    
    if (newCameraState && newCameraState !== currentCameraState) {
      transitionToState(newCameraState, currentCameraState);
      setCurrentCameraState(newCameraState);
    }
    
    prevCrystalState.current = crystalState;
  }, [crystalState, selectedFacet, currentCameraState]);

  // Existing camera transition logic - FIXED to handle all project states
  const mapCrystalStateToCameraState = (crystalState, selectedFacet) => {
    switch (crystalState) {
      case CRYSTAL_STATES.WHOLE:
        return 'INTRO'; // Use standard intro, not close
      case CRYSTAL_STATES.FRACTURING:
        return 'INTRO';
      case CRYSTAL_STATES.EXPLODING:
        return 'EXPLOSION';
      case CRYSTAL_STATES.EXPLODED:
        return selectedFacet ? `PROJECT_${selectedFacet.toUpperCase()}` : 'EXPLOSION';
      case CRYSTAL_STATES.PROJECT_SELECTED:
        return selectedFacet ? `PROJECT_${selectedFacet.toUpperCase()}` : 'EXPLOSION';
      case CRYSTAL_STATES.REFORMING:
        return 'INTRO';
      default:
        return 'INTRO';
    }
  };

  // Existing transition function (unchanged)
  const transitionToState = (newStateKey, fromStateKey) => {
    const targetState = getCameraState(newStateKey);
    
    if (!targetState) {
      console.warn(`❌ Camera state '${newStateKey}' not found`);
      return;
    }
    
    if (debugMode) {
      console.log(`📹 Transitioning camera: ${fromStateKey} → ${newStateKey}`);
    }
    
    const duration = getTransitionTiming(fromStateKey, newStateKey);
    const easingFunction = getTransitionEasing(fromStateKey, newStateKey);
    
    cameraAnimation.current = {
      active: true,
      startTime: clock.getElapsedTime(),
      duration: duration / 1000,
      
      startPosition: camera.position.clone(),
      targetPosition: new THREE.Vector3(...targetState.position),
      
      startRotation: camera.quaternion.clone(),
      targetRotation: calculateLookAtQuaternion(targetState.position, targetState.target),
      
      startFOV: camera.fov,
      targetFOV: targetState.fov,
      
      easingFunction
    };
    
    setIsTransitioning(true);
  };

  const calculateLookAtQuaternion = (position, target) => {
    const tempCamera = new THREE.PerspectiveCamera();
    tempCamera.position.set(...position);
    tempCamera.lookAt(...target);
    return tempCamera.quaternion.clone();
  };

  // Animation frame loop (keep existing logic for non-scroll transitions)
  useFrame((state) => {
    if (!cameraAnimation.current.active) return;
    
    const elapsed = state.clock.getElapsedTime() - cameraAnimation.current.startTime;
    const progress = Math.min(elapsed / cameraAnimation.current.duration, 1);
    
    const easedProgress = cameraAnimation.current.easingFunction 
      ? cameraAnimation.current.easingFunction(progress)
      : progress;
    
    camera.position.lerpVectors(
      cameraAnimation.current.startPosition,
      cameraAnimation.current.targetPosition,
      easedProgress
    );
    
    camera.quaternion.slerpQuaternions(
      cameraAnimation.current.startRotation,
      cameraAnimation.current.targetRotation,
      easedProgress
    );
    
    camera.fov = THREE.MathUtils.lerp(
      cameraAnimation.current.startFOV,
      cameraAnimation.current.targetFOV,
      easedProgress
    );
    camera.updateProjectionMatrix();
    
    if (progress >= 1) {
      camera.position.copy(cameraAnimation.current.targetPosition);
      camera.quaternion.copy(cameraAnimation.current.targetRotation);
      camera.fov = cameraAnimation.current.targetFOV;
      camera.updateProjectionMatrix();
      
      cameraAnimation.current.active = false;
      setIsTransitioning(false);
      
      if (debugMode) {
        console.log(`📹 Camera transition complete: ${currentCameraState}`);
      }
    }
  });

  return null;
};

// Ultra-smooth easing function specifically for intro camera movement
const introSmoothEasing = (t) => {
  // Custom bezier-like curve for silky smooth intro movement
  if (t < 0.05) return 0; // Stay completely still at the very beginning
  if (t > 0.95) return 1; // Complete the movement at the end
  
  // Remap the middle 90% with ultra-smooth curve
  const adjusted = (t - 0.05) / 0.9;
  
  // Use smoothstep polynomial for silk-like movement
  return adjusted * adjusted * adjusted * (adjusted * (adjusted * 6 - 15) + 10);
};

// Smooth easing function for scroll interpolation (kept for compatibility)
const easeInOutCubic = (t) => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export default CameraController;