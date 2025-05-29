// src/components/three/CameraController.jsx - Enhanced for smooth scroll-driven transitions
// Updated camera controller with interpolated intro transitions

import { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// We'll define camera states inline for now since the config file doesn't exist yet
const CAMERA_STATES = {
  INTRO_CLOSE: {
    position: [0, 1.2, 2.8],
    target: [0, 0.3, 0],
    rotation: [0, 0, 0],
    fov: 35,
    description: 'Close intimate view of crystal with bottom out of frame'
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
  // NEW: Scroll data for smooth intro transitions
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
  
  // NEW: Scroll-based interpolation state for intro
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

  // Initialize camera to close intro position
  useEffect(() => {
    const introCloseState = getCameraState('INTRO_CLOSE');
    if (introCloseState && !cameraAnimation.current.active) {
      camera.position.set(...introCloseState.position);
      camera.lookAt(...introCloseState.target);
      camera.fov = introCloseState.fov;
      camera.updateProjectionMatrix();
      setCurrentCameraState('INTRO_CLOSE');
      
      if (debugMode) {
        console.log('📹 Camera initialized to INTRO_CLOSE state');
      }
    }
  }, [camera, debugMode]);

  // NEW: Handle scroll-based intro transitions
  useEffect(() => {
    if (!scrollCrystalData) return;
    
    const currentSection = scrollCrystalData.currentSection;
    
    // Check if we're in the intro scroll transition zone
    if (currentSection.key === 'intro' && currentSection.enableScrollTransition) {
      const scrollInSection = (scrollCrystalData.scrollProgress - currentSection.threshold) / currentSection.duration;
      const clampedProgress = Math.max(0, Math.min(1, scrollInSection));
      
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
            console.log('📹 Started scroll interpolation: INTRO_CLOSE → INTRO');
          }
        }
      }
      
      // Apply smooth interpolation based on scroll progress
      if (scrollInterpolation.current.active) {
        const easedProgress = easeInOutCubic(clampedProgress);
        
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
        
        if (debugMode && Math.random() < 0.1) { // Log occasionally to avoid spam
          console.log(`📹 Scroll interpolation: ${Math.round(clampedProgress * 100)}%`);
        }
      }
    } else {
      // Clear scroll interpolation when not in intro transition
      if (scrollInterpolation.current.active) {
        scrollInterpolation.current.active = false;
        if (debugMode) {
          console.log('📹 Ended scroll interpolation');
        }
      }
    }
  }, [scrollCrystalData?.scrollProgress, scrollCrystalData?.currentSection, camera, debugMode]);

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

  // Existing camera transition logic (unchanged)
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

// Smooth easing function for scroll interpolation
const easeInOutCubic = (t) => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export default CameraController;