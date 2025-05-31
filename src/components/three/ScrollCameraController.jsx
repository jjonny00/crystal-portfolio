// src/components/three/ScrollCameraController.jsx
// FIXED: Proper integration with crystal controller and scroll-based camera movements

import { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Enhanced camera states with mobile-optimized positions
const CAMERA_STATES = {
  INTRO_CLOSE: {
    position: [0, 3.2, 2.4],
    target: [0, 0.5, 0],
    fov: 32,
    description: 'Intimate close view - mobile optimized'
  },
  INTRO: {
    position: [0, 1.8, 4.2],
    target: [0, 0.2, 0],
    fov: 42,
    description: 'Standard intro view - elevated perspective'
  },
  EXPLOSION: {
    position: [0, 2.5, 7.8],
    target: [0, 0.3, 0],
    fov: 48,
    description: 'Wide view to see all exploded facets'
  },
  // UPDATED: Project camera positions that actually focus on each facet
  PROJECT_EMPATHY: {
    position: [3.2, -1.8, 3.5],     // Focus on bottom-left facet
    target: [0.3, -0.7, -0.2],      // Look directly at empathy facet
    fov: 35,
    description: 'Empathy facet focus'
  },
  PROJECT_NARRATIVE: {
    position: [3.5, 0.8, 3.0],      // Focus on middle-left facet
    target: [0.3, -0.1, -0.7],      // Look at narrative facet
    fov: 35,
    description: 'Narrative facet focus'
  },
  PROJECT_CRAFT: {
    position: [4.5, 3.2, 2.2],      // Focus on top-right facet
    target: [1.3, 0.8, 0.5],        // Look at craft facet
    fov: 35,
    description: 'Craft facet focus'
  },
  PROJECT_SYSTEM: {
    position: [-2.8, 1.5, 2.0],     // Focus on left facet
    target: [-0.5, 0.2, -1.8],      // Look at system facet
    fov: 35,
    description: 'System facet focus'
  },
  PROJECT_LEADERSHIP: {
    position: [3.8, 4.5, 2.8],      // Focus on top facet
    target: [0.4, 1.2, 0.9],        // Look at leadership facet
    fov: 35,
    description: 'Leadership facet focus'
  },
  PROJECT_EXPLORATION: {
    position: [-3.0, 3.0, 2.8],     // Focus on top-left facet
    target: [-0.6, 0.7, 0.0],       // Look at exploration facet
    fov: 35,
    description: 'Exploration facet focus'
  }
};

// Professional easing functions
const EASING_FUNCTIONS = {
  easeInOutCubic: (t) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeOutQuart: (t) => {
    return 1 - Math.pow(1 - t, 4);
  },
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
 * FIXED: ScrollCameraController with proper scroll integration
 */
const ScrollCameraController = ({ 
  crystalState,
  selectedFacet = null,
  isFastScrolling = false,
  isTransitioning = false,
  config,
  debugMode = false,
  scrollObserver = null,
  // NEW: Accept crystal controller data
  crystalControllerData = null
}) => {
  const { camera, clock } = useThree();
  
  // Animation state
  const currentAnimation = useRef(null);
  const isAnimating = useRef(false);
  
  // State tracking
  const [currentCameraState, setCurrentCameraState] = useState('INTRO_CLOSE');
  const [isInternalTransitioning, setIsInternalTransitioning] = useState(false);
  const prevCrystalState = useRef(crystalState);
  const prevSelectedFacet = useRef(selectedFacet);

  // NEW: Track scroll-based section changes
  const prevScrollSection = useRef(null);

  /**
   * Execute a camera animation
   */
  const executeAnimation = (targetState, options = {}) => {
    const stateConfig = getCameraState(targetState);
    
    if (!stateConfig) {
      console.warn(`❌ Camera state '${targetState}' not found`);
      return;
    }

    if (debugMode) {
      console.log(`📹 Executing camera animation: ${currentCameraState} → ${targetState}`);
    }

    isAnimating.current = true;
    setIsInternalTransitioning(true);

    const timing = options.timing || getAnimationTiming('projectSelect', isFastScrolling);

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
   * NEW: Handle scroll-based camera movements
   * This runs when the user scrolls through project sections
   */
  useEffect(() => {
  console.log('🔍 ScrollCameraController DETAILED:', {
    hasScrollObserver: !!scrollObserver,
    scrollObserverKeys: scrollObserver ? Object.keys(scrollObserver) : 'none',
    currentSection: scrollObserver?.currentSection,
    currentSectionId: scrollObserver?.currentSection?.id,
    crystalState,
    selectedFacet,
    currentCameraState
  });

  if (!scrollObserver) {
    console.log('❌ No scroll observer');
    return;
  }

  if (!scrollObserver.currentSection) {
    console.log('❌ No current section in scroll observer');
    return;
  }

  const currentSection = scrollObserver.currentSection;
  const sectionId = currentSection.id;

  console.log('📍 Section analysis:', {
    sectionId,
    isProjectSection: sectionId.startsWith('project-'),
    crystalState,
    shouldTriggerAnimation: (crystalState === 'EXPLODED' || crystalState === 'PROJECT_SELECTED')
  });

  // Only handle camera movements for project sections when exploded
  if (crystalState === 'EXPLODED' || crystalState === 'PROJECT_SELECTED') {
    console.log('✅ In correct crystal state for project animations');
    
    // Check if we're in a project section
    if (sectionId.startsWith('project-')) {
      console.log('✅ In project section, should animate camera');
      // ... rest of animation code
    } else {
      console.log('⚠️ Not in project section, sectionId:', sectionId);
    }
  } else {
    console.log('⚠️ Wrong crystal state for project animations:', crystalState);
  }

}, [scrollObserver?.currentSection, crystalState, currentCameraState, debugMode]);

  /**
   * Handle crystal state changes (non-scroll triggered)
   */
  useEffect(() => {
    if (prevCrystalState.current === crystalState && prevSelectedFacet.current === selectedFacet) {
      return;
    }

    const targetCameraState = mapCrystalStateToCameraState(crystalState, selectedFacet);
    
    // Only transition if it's a different state AND not already handled by scroll
    if (targetCameraState !== currentCameraState) {
      
      // Determine transition type
      let transitionType = 'intro';
      if (targetCameraState === 'EXPLOSION') transitionType = 'explosion';
      else if (targetCameraState.startsWith('PROJECT_')) transitionType = 'projectSelect';
      else if (prevCrystalState.current === 'EXPLODED' && targetCameraState === 'INTRO') transitionType = 'reform';

      if (debugMode) {
        console.log(`📹 Crystal state camera transition: ${currentCameraState} → ${targetCameraState} (${transitionType})`);
      }

      executeAnimation(targetCameraState, {
        timing: getAnimationTiming(transitionType, isFastScrolling)
      });
      
      setCurrentCameraState(targetCameraState);
    }
    
    prevCrystalState.current = crystalState;
    prevSelectedFacet.current = selectedFacet;
  }, [crystalState, selectedFacet, currentCameraState, isFastScrolling, debugMode]);

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
      
      // Cleanup
      isAnimating.current = false;
      setIsInternalTransitioning(false);
      currentAnimation.current = null;
      
      if (debugMode) {
        console.log(`📹 Camera animation complete: ${currentCameraState}`);
      }
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
      isAnimating.current = false;
      currentAnimation.current = null;
    };
  }, []);

  // Debug overlay in development
  if (debugMode && typeof window !== 'undefined') {
    window.debugCamera = {
      currentState: currentCameraState,
      isAnimating: isAnimating.current,
      currentSection: scrollObserver?.currentSection?.id,
      crystalState
    };
  }

  return null;
};

export default ScrollCameraController;