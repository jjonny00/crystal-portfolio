// src/components/three/ScrollCameraController.jsx
// Phase 3.2: Enhanced Camera Controller with Animation Queue System
// Removes scroll event listeners, accepts target states from crystal controller

import { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Enhanced camera states with mobile-optimized positions
const CAMERA_STATES = {
  INTRO_CLOSE: {
    position: [0, 3.2, 2.4], // Higher, more intimate mobile viewing
    target: [0, 0.5, 0],
    rotation: [0, 0, 0],
    fov: 32,
    description: 'Intimate close view - mobile optimized'
  },
  INTRO: {
    position: [0, 1.8, 4.2], // Elevated standard view
    target: [0, 0.2, 0],
    rotation: [0, 0, 0],
    fov: 42,
    description: 'Standard intro view - elevated perspective'
  },
  EXPLOSION: {
    position: [0, 2.5, 7.8], // Higher vantage point for explosion
    target: [0, 0.3, 0],
    rotation: [0, 0, 0],
    fov: 48,
    description: 'Wide elevated view for exploded facets'
  },
  PROJECT_EMPATHY: {
    position: [2.8, -1.5, 3.2],
    target: [0.4, -0.5, -0.1],
    rotation: [0, 0, 0],
    fov: 35,
    description: 'Empathy facet focus'
  },
  PROJECT_NARRATIVE: {
    position: [3.2, 1.2, 2.8],
    target: [0.5, 0.1, -0.5],
    rotation: [0, 0, 0],
    fov: 35,
    description: 'Narrative facet focus'
  },
  PROJECT_CRAFT: {
    position: [4.2, 2.8, 1.8],
    target: [1.4, 1.0, 0.3],
    rotation: [0, 0, 0],
    fov: 35,
    description: 'Craft facet focus'
  },
  PROJECT_SYSTEM: {
    position: [-2.4, 1.8, 1.2],
    target: [-0.3, 0.4, -1.6],
    rotation: [0, 0, 0],
    fov: 35,
    description: 'System facet focus'
  },
  PROJECT_LEADERSHIP: {
    position: [3.4, 4.2, 2.0],
    target: [0.6, 1.4, 0.7],
    rotation: [0, 0, 0],
    fov: 35,
    description: 'Leadership facet focus'
  },
  PROJECT_EXPLORATION: {
    position: [-2.6, 2.8, 2.2],
    target: [-0.4, 0.9, -0.2],
    rotation: [0, 0, 0],
    fov: 35,
    description: 'Exploration facet focus'
  }
};

// Professional easing functions
const EASING_FUNCTIONS = {
  // Smooth cubic ease for general transitions
  easeInOutCubic: (t) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },
  
  // Bouncy ease for intro sequences
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  
  // Quick ease for fast scrolling
  easeOutQuart: (t) => {
    return 1 - Math.pow(1 - t, 4);
  },
  
  // Gentle ease for project selection
  easeInOutQuint: (t) => {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
  }
};

// Animation timing configurations
const ANIMATION_TIMINGS = {
  intro: { duration: 1000, easing: 'easeInOutCubic' },
  explosion: { duration: 1400, easing: 'easeOutBack' },
  projectSelect: { duration: 1200, easing: 'easeInOutQuint' },
  reform: { duration: 900, easing: 'easeInOutCubic' },
  fastScroll: { duration: 600, easing: 'easeOutQuart' }
};

// Helper functions
const getCameraState = (stateName) => {
  return CAMERA_STATES[stateName] || null;
};

const getAnimationTiming = (transitionType, isFastScrolling = false) => {
  if (isFastScrolling) {
    return ANIMATION_TIMINGS.fastScroll;
  }
  return ANIMATION_TIMINGS[transitionType] || ANIMATION_TIMINGS.intro;
};

const calculateLookAtQuaternion = (position, target) => {
  const tempCamera = new THREE.PerspectiveCamera();
  tempCamera.position.set(...position);
  tempCamera.lookAt(...target);
  return tempCamera.quaternion.clone();
};

/**
 * ScrollCameraController - Phase 3.2 Enhanced Camera Controller
 * 
 * Key Features:
 * - Animation queue system prevents interruption during fast scrolling
 * - Mobile-optimized camera positions with higher, more intimate viewing angles
 * - Professional easing functions for smooth movement
 * - Accepts target states from crystal controller (no scroll listeners)
 * - Improved state management with conflict resolution
 */
const ScrollCameraController = ({ 
  crystalState,
  selectedFacet = null,
  isFastScrolling = false,
  isTransitioning = false,
  config,
  debugMode = false
}) => {
  const { camera, clock } = useThree();
  
  // Animation queue system to prevent interruption
  const animationQueue = useRef([]);
  const isAnimating = useRef(false);
  const currentAnimation = useRef(null);
  
  // State tracking
  const [currentCameraState, setCurrentCameraState] = useState('INTRO_CLOSE');
  const [isInternalTransitioning, setIsInternalTransitioning] = useState(false);
  const prevCrystalState = useRef(crystalState);
  const prevSelectedFacet = useRef(selectedFacet);

  /**
   * Execute a camera animation
   */
  const executeAnimation = (animationConfig) => {
    const { targetState, timing, priority } = animationConfig;
    const stateConfig = getCameraState(targetState);
    
    if (!stateConfig) {
      console.warn(`❌ Camera state '${targetState}' not found`);
      processNextAnimation();
      return;
    }

    if (debugMode) {
      console.log(`📹 Executing camera animation: ${currentCameraState} → ${targetState}`);
    }

    isAnimating.current = true;
    setIsInternalTransitioning(true);

    // Store animation configuration
    currentAnimation.current = {
      startTime: clock.getElapsedTime(),
      duration: timing.duration / 1000,
      
      startPosition: camera.position.clone(),
      targetPosition: new THREE.Vector3(...stateConfig.position),
      
      startRotation: camera.quaternion.clone(),
      targetRotation: calculateLookAtQuaternion(stateConfig.position, stateConfig.target),
      
      startFOV: camera.fov,
      targetFOV: stateConfig.fov,
      
      easingFunction: EASING_FUNCTIONS[timing.easing] || EASING_FUNCTIONS.easeInOutCubic,
      targetState
    };
  };

  /**
   * Process next animation in queue
   */
  const processNextAnimation = () => {
    if (animationQueue.current.length > 0 && !isAnimating.current) {
      const nextAnimation = animationQueue.current.shift();
      executeAnimation(nextAnimation);
    }
  };

  /**
   * Queue animation with priority and conflict resolution
   */
  const queueAnimation = (targetState, options = {}) => {
    const {
      priority = 0,
      transitionType = 'intro',
      immediate = false
    } = options;

    // Skip if same state
    if (targetState === currentCameraState) {
      return;
    }

    const timing = getAnimationTiming(transitionType, isFastScrolling);
    
    const animationConfig = {
      targetState,
      timing,
      priority,
      timestamp: Date.now()
    };

    if (immediate) {
      // Clear queue and execute immediately
      animationQueue.current = [animationConfig];
      if (!isAnimating.current) {
        processNextAnimation();
      }
    } else {
      // Add to queue with priority sorting
      animationQueue.current.push(animationConfig);
      animationQueue.current.sort((a, b) => b.priority - a.priority);
      
      // Process if not currently animating
      if (!isAnimating.current) {
        processNextAnimation();
      }
    }

    if (debugMode) {
      console.log(`📋 Camera animation queued: ${targetState} (priority: ${priority})`);
    }
  };

  /**
   * Map crystal state to camera state
   */
  const mapCrystalStateToCameraState = (crystalState, selectedFacet) => {
    switch (crystalState) {
      case 'WHOLE':
        return 'INTRO';
      case 'FRACTURING':
        return 'INTRO';
      case 'EXPLODING':
        return 'EXPLOSION';
      case 'EXPLODED':
        return selectedFacet ? `PROJECT_${selectedFacet.toUpperCase()}` : 'EXPLOSION';
      case 'PROJECT_SELECTED':
        return selectedFacet ? `PROJECT_${selectedFacet.toUpperCase()}` : 'EXPLOSION';
      case 'REFORMING':
        return 'INTRO';
      default:
        return 'INTRO';
    }
  };

  /**
   * Get transition type for timing
   */
  const getTransitionType = (fromState, toState) => {
    if (toState === 'EXPLOSION') return 'explosion';
    if (toState.startsWith('PROJECT_')) return 'projectSelect';
    if (fromState === 'EXPLOSION' && toState === 'INTRO') return 'reform';
    return 'intro';
  };

  /**
   * Handle crystal state changes
   */
  useEffect(() => {
    if (prevCrystalState.current === crystalState && prevSelectedFacet.current === selectedFacet) {
      return;
    }

    const targetCameraState = mapCrystalStateToCameraState(crystalState, selectedFacet);
    const transitionType = getTransitionType(currentCameraState, targetCameraState);
    
    // Calculate priority based on transition importance
    let priority = 1;
    if (crystalState === 'PROJECT_SELECTED') priority = 3;
    else if (crystalState === 'EXPLODED') priority = 2;
    else if (isFastScrolling) priority = 4;

    queueAnimation(targetCameraState, {
      priority,
      transitionType,
      immediate: isFastScrolling && priority > 2
    });

    prevCrystalState.current = crystalState;
    prevSelectedFacet.current = selectedFacet;
  }, [crystalState, selectedFacet, currentCameraState, isFastScrolling]);

  /**
   * Animation frame loop
   */
  useFrame((state) => {
    if (!currentAnimation.current || !isAnimating.current) return;

    const elapsed = state.clock.getElapsedTime() - currentAnimation.current.startTime;
    const progress = Math.min(elapsed / currentAnimation.current.duration, 1);
    
    const easedProgress = currentAnimation.current.easingFunction(progress);
    
    // Interpolate position
    camera.position.lerpVectors(
      currentAnimation.current.startPosition,
      currentAnimation.current.targetPosition,
      easedProgress
    );
    
    // Interpolate rotation
    camera.quaternion.slerpQuaternions(
      currentAnimation.current.startRotation,
      currentAnimation.current.targetRotation,
      easedProgress
    );
    
    // Interpolate FOV
    camera.fov = THREE.MathUtils.lerp(
      currentAnimation.current.startFOV,
      currentAnimation.current.targetFOV,
      easedProgress
    );
    camera.updateProjectionMatrix();
    
    // Check if animation is complete
    if (progress >= 1) {
      // Ensure final values are set precisely
      camera.position.copy(currentAnimation.current.targetPosition);
      camera.quaternion.copy(currentAnimation.current.targetRotation);
      camera.fov = currentAnimation.current.targetFOV;
      camera.updateProjectionMatrix();
      
      // Update state and cleanup
      setCurrentCameraState(currentAnimation.current.targetState);
      isAnimating.current = false;
      setIsInternalTransitioning(false);
      currentAnimation.current = null;
      
      if (debugMode) {
        console.log(`📹 Camera animation complete: ${currentCameraState}`);
      }
      
      // Process next animation in queue
      setTimeout(processNextAnimation, 50); // Small delay to prevent conflicts
    }
  });

  /**
   * Initialize camera to intro close position
   */
  useEffect(() => {
    const introCloseState = getCameraState('INTRO_CLOSE');
    if (introCloseState && !currentAnimation.current) {
      camera.position.set(...introCloseState.position);
      camera.lookAt(...introCloseState.target);
      camera.fov = introCloseState.fov;
      camera.updateProjectionMatrix();
      
      if (debugMode) {
        console.log('📹 Camera initialized to INTRO_CLOSE position');
      }
    }
  }, [camera, debugMode]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      animationQueue.current = [];
      isAnimating.current = false;
      currentAnimation.current = null;
    };
  }, []);

  /**
   * Emergency clear function for external control
   */
  const clearAnimationQueue = () => {
    animationQueue.current = [];
    isAnimating.current = false;
    currentAnimation.current = null;
    setIsInternalTransitioning(false);
    
    if (debugMode) {
      console.log('🧹 Camera animation queue cleared');
    }
  };

  // Expose clear function globally for debugging (only in development)
  if (debugMode && typeof window !== 'undefined') {
    window.clearCameraQueue = clearAnimationQueue;
  }

  return null; // This component doesn't render anything
};

export default ScrollCameraController;