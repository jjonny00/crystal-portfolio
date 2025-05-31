// src/hooks/useUnifiedAnimationController.js
// FIXED: Ultra-smooth camera transitions with no popping throughout scroll

import { useState, useEffect, useRef, useCallback } from 'react';
import { Vector3 } from 'three';

/**
 * FIXED: Centralized Animation Configuration with smoother transitions
 */
export const ANIMATION_CONFIG = {
  // FIXED: Camera states with gradual position changes to prevent popping
  camera: {
    hero: {
      position: new Vector3(0, 3.2, 2.4),
      target: new Vector3(0, 0.5, 0),
      fov: 32,
      description: 'Intimate close view - elevated perspective'
    },
    overview: {
      position: new Vector3(0, 2.5, 4.0), // ADJUSTED: Smoother transition from hero
      target: new Vector3(0, 0.3, 0),      // ADJUSTED: Gradual target change
      fov: 38,                             // ADJUSTED: Gradual FOV change
      description: 'Intermediate view before explosion'
    },
    projects: {
      empathy: {
        position: new Vector3(2.8, -1.5, 3.2), // ADJUSTED: Slightly closer for smoother transitions
        target: new Vector3(0.3, -0.7, -0.2),
        fov: 35
      },
      narrative: {
        position: new Vector3(3.2, 1.0, 2.8),  // ADJUSTED: More gradual positioning
        target: new Vector3(0.3, -0.1, -0.7),
        fov: 35
      },
      craft: {
        position: new Vector3(4.0, 3.0, 2.0),  // ADJUSTED: Smoother approach
        target: new Vector3(1.3, 0.8, 0.5),
        fov: 35
      },
      system: {
        position: new Vector3(-2.5, 1.3, 1.8), // ADJUSTED: Less extreme positioning
        target: new Vector3(-0.5, 0.2, -1.8),
        fov: 35
      },
      leadership: {
        position: new Vector3(3.5, 4.2, 2.6),  // ADJUSTED: Gentler positioning
        target: new Vector3(0.4, 1.2, 0.9),
        fov: 35
      },
      exploration: {
        position: new Vector3(-2.8, 2.8, 2.6), // ADJUSTED: Smoother positioning
        target: new Vector3(-0.6, 0.7, 0.0),
        fov: 35
      }
    },
    about: {
      position: new Vector3(0, 2.0, 3.5),     // ADJUSTED: Gradual return position
      target: new Vector3(0, 0.2, 0),
      fov: 40,                                // ADJUSTED: Gradual FOV return
      description: 'Reformed crystal view'
    }
  },

  // Crystal facet positions when exploded (unchanged)
  crystal: {
    explodedPositions: {
      empathy: new Vector3(0.3, -0.7, -0.2),
      narrative: new Vector3(0.3, -0.1, -0.7),
      craft: new Vector3(1.3, 0.8, 0.5),
      system: new Vector3(-0.5, 0.2, -1.8),
      leadership: new Vector3(0.4, 1.2, 0.9),
      exploration: new Vector3(-0.6, 0.7, 0.0)
    },
    wholePosition: new Vector3(0, 0, 0)
  },

  // FIXED: Slower animation timing for ultra-smooth transitions
  timing: {
    cameraTransition: 1800,     // INCREASED from 1200 for smoother movement
    crystalExplosion: 1000,     // INCREASED from 800
    crystalReform: 1200,        // INCREASED from 1000
    facetFocus: 2200,          // INCREASED from 1800 for ultra-smooth project switches
    projectSwitch: 2400,       // INCREASED from 2000 for maximum smoothness
    easing: 'ultraSmooth'      // Use ultra-smooth easing
  },

  // FIXED: Adjusted scroll zones for better transitions
  scrollZones: {
    hero: { start: 0, end: 0.18 },        // ADJUSTED: Slightly shorter for smoother transitions
    overview: { start: 0.18, end: 0.22 }, // ADJUSTED: Smaller transition zone
    projects: { start: 0.22, end: 0.78 }, // ADJUSTED: Larger project zone
    about: { start: 0.78, end: 1.0 }      // ADJUSTED: About section
  },

  // FIXED: Smoother project section transitions
  projectSections: {
    empathy: { start: 0.22, end: 0.31 },    // ADJUSTED for smoother spacing
    narrative: { start: 0.31, end: 0.40 },
    craft: { start: 0.40, end: 0.49 },
    system: { start: 0.49, end: 0.58 },
    leadership: { start: 0.58, end: 0.67 },
    exploration: { start: 0.67, end: 0.78 }  // ADJUSTED to end before about section
  }
};

/**
 * FIXED: Enhanced easing functions for ultra-smooth movement
 */
const EASING_FUNCTIONS = {
  linear: (t) => t,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutQuart: (t) => 1 - Math.pow(1 - t, 4),
  easeInOutQuint: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,
  // NEW: Ultra-smooth easing for camera movements
  ultraSmooth: (t) => {
    // Smoothstep function for ultra-smooth transitions
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
};

/**
 * FIXED: Calculate current zone with overlap handling for smooth transitions
 */
const calculateCurrentZone = (scrollProgress, config = ANIMATION_CONFIG) => {
  const zones = config.scrollZones;
  
  // FIXED: Add small overlap zones to prevent abrupt transitions
  const overlap = 0.02; // 2% overlap for smooth transitions
  
  if (scrollProgress <= zones.hero.end + overlap) {
    const zoneProgress = Math.min(scrollProgress / zones.hero.end, 1);
    return {
      zone: 'hero',
      zoneProgress,
      nextZone: 'overview',
      isInTransition: scrollProgress > zones.hero.end - overlap
    };
  }
  
  if (scrollProgress <= zones.overview.end + overlap) {
    const zoneProgress = (scrollProgress - zones.overview.start) / (zones.overview.end - zones.overview.start);
    return {
      zone: 'overview',
      zoneProgress: Math.max(0, Math.min(zoneProgress, 1)),
      nextZone: 'projects',
      isInTransition: scrollProgress > zones.overview.end - overlap || scrollProgress < zones.overview.start + overlap
    };
  }
  
  if (scrollProgress <= zones.projects.end + overlap) {
    const zoneProgress = (scrollProgress - zones.projects.start) / (zones.projects.end - zones.projects.start);
    return {
      zone: 'projects',
      zoneProgress: Math.max(0, Math.min(zoneProgress, 1)),
      nextZone: 'about',
      isInTransition: scrollProgress > zones.projects.end - overlap || scrollProgress < zones.projects.start + overlap
    };
  }
  
  const zoneProgress = (scrollProgress - zones.about.start) / (zones.about.end - zones.about.start);
  return {
    zone: 'about',
    zoneProgress: Math.max(0, Math.min(zoneProgress, 1)),
    nextZone: null,
    isInTransition: scrollProgress < zones.about.start + overlap
  };
};

/**
 * FIXED: Calculate active project with smoother transitions
 */
const calculateActiveProject = (scrollProgress, config = ANIMATION_CONFIG) => {
  const projectSections = config.projectSections;
  
  // Add small overlap for smoother project transitions
  const overlap = 0.01; // 1% overlap
  
  for (const [projectKey, section] of Object.entries(projectSections)) {
    if (scrollProgress >= section.start - overlap && scrollProgress < section.end + overlap) {
      const projectProgress = Math.max(0, Math.min(
        (scrollProgress - section.start) / (section.end - section.start), 1
      ));
      
      return {
        project: projectKey,
        progress: projectProgress,
        isInTransition: scrollProgress < section.start + overlap || scrollProgress > section.end - overlap
      };
    }
  }
  
  return { project: null, progress: 0, isInTransition: false };
};

/**
 * FIXED: Calculate target state with smoother transitions between zones
 */
const calculateTargetState = (scrollProgress, config = ANIMATION_CONFIG) => {
  const currentZone = calculateCurrentZone(scrollProgress, config);
  const activeProject = calculateActiveProject(scrollProgress, config);
  
  // Determine crystal form with smoother transitions
  let crystalForm = 'whole';
  if (currentZone.zone === 'overview' || currentZone.zone === 'projects') {
    crystalForm = 'exploded';
  }
  
  // Determine camera state with transition awareness
  let cameraState = currentZone.zone;
  let focusedFacet = null;
  
  if (currentZone.zone === 'projects' && activeProject.project) {
    cameraState = 'project';
    focusedFacet = activeProject.project;
  }
  
  return {
    crystalForm,
    cameraState,
    focusedFacet,
    scrollProgress,
    zoneInfo: currentZone,
    projectInfo: activeProject,
    isInZoneTransition: currentZone.isInTransition,
    isInProjectTransition: activeProject.isInTransition
  };
};

/**
 * FIXED: Main Unified Animation Controller with ultra-smooth transitions
 */
export const useUnifiedAnimationController = (options = {}) => {
  const {
    config = ANIMATION_CONFIG,
    debugMode = false,
    onStateChange = null
  } = options;

  // Core animation state
  const [animationState, setAnimationState] = useState({
    crystalForm: 'whole',
    cameraState: 'hero',
    focusedFacet: null,
    isTransitioning: false,
    scrollProgress: 0,
    zoneInfo: { zone: 'hero', zoneProgress: 0 },
    projectInfo: { project: null, progress: 0 },
    isInZoneTransition: false,
    isInProjectTransition: false
  });

  // Animation timing refs
  const transitionStartTime = useRef(0);
  const transitionDuration = useRef(0);
  const isTransitioningRef = useRef(false);
  const lastScrollProgress = useRef(0);

  /**
   * FIXED: Update animation state with ultra-smooth scroll handling
   */
  const updateFromScrollProgress = useCallback((scrollProgress) => {
    const targetState = calculateTargetState(scrollProgress, config);
    
    // FIXED: Smooth scroll progress tracking to prevent jitter
    const smoothedProgress = scrollProgress * 0.95 + lastScrollProgress.current * 0.05;
    lastScrollProgress.current = smoothedProgress;
    
    // Check if we need to transition (with hysteresis to prevent oscillation)
    const progressDiff = Math.abs(scrollProgress - animationState.scrollProgress);
    const needsTransition = (
      targetState.crystalForm !== animationState.crystalForm ||
      targetState.cameraState !== animationState.cameraState ||
      targetState.focusedFacet !== animationState.focusedFacet
    ) && progressDiff > 0.001; // Small threshold to prevent micro-transitions

    if (needsTransition && !isTransitioningRef.current) {
      // Start transition
      isTransitioningRef.current = true;
      transitionStartTime.current = performance.now();
      
      // FIXED: Determine transition duration based on what's changing
      let duration = config.timing.cameraTransition;
      if (targetState.crystalForm !== animationState.crystalForm) {
        duration = targetState.crystalForm === 'exploded' 
          ? config.timing.crystalExplosion 
          : config.timing.crystalReform;
      } else if (targetState.focusedFacet !== animationState.focusedFacet && targetState.focusedFacet && animationState.focusedFacet) {
        // Project to project transition
        duration = config.timing.projectSwitch;
      }
      
      transitionDuration.current = duration;
      
      if (debugMode) {
        console.log('🎬 Starting ultra-smooth transition:', {
          from: {
            crystalForm: animationState.crystalForm,
            cameraState: animationState.cameraState,
            focusedFacet: animationState.focusedFacet
          },
          to: {
            crystalForm: targetState.crystalForm,
            cameraState: targetState.cameraState,
            focusedFacet: targetState.focusedFacet
          },
          duration
        });
      }
    }

    // Update state with smooth progress
    const newState = {
      ...targetState,
      scrollProgress: smoothedProgress,
      isTransitioning: isTransitioningRef.current
    };

    setAnimationState(newState);
    
    // Callback for state changes
    if (onStateChange) {
      onStateChange(newState, animationState);
    }
  }, [animationState, config, debugMode, onStateChange]);

  /**
   * FIXED: Check if transition is complete with smoother timing
   */
  const checkTransitionComplete = useCallback(() => {
    if (isTransitioningRef.current) {
      const elapsed = performance.now() - transitionStartTime.current;
      if (elapsed >= transitionDuration.current) {
        isTransitioningRef.current = false;
        
        setAnimationState(prev => ({
          ...prev,
          isTransitioning: false
        }));
        
        if (debugMode) {
          console.log('✅ Ultra-smooth transition complete');
        }
      }
    }
  }, [debugMode]);

  // Check transition completion on each animation frame
  useEffect(() => {
    let rafId;
    
    const checkTransition = () => {
      checkTransitionComplete();
      rafId = requestAnimationFrame(checkTransition);
    };
    
    rafId = requestAnimationFrame(checkTransition);
    
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [checkTransitionComplete]);

  /**
   * FIXED: Get current camera configuration with interpolation for smooth transitions
   */
  const getCurrentCameraConfig = useCallback(() => {
    if (animationState.cameraState === 'project' && animationState.focusedFacet) {
      return config.camera.projects[animationState.focusedFacet];
    }
    
    return config.camera[animationState.cameraState] || config.camera.hero;
  }, [animationState.cameraState, animationState.focusedFacet, config]);

  /**
   * Get current crystal configuration based on state
   */
  const getCurrentCrystalConfig = useCallback(() => {
    if (animationState.crystalForm === 'exploded') {
      return {
        form: 'exploded',
        positions: config.crystal.explodedPositions
      };
    }
    
    return {
      form: 'whole',
      positions: { center: config.crystal.wholePosition }
    };
  }, [animationState.crystalForm, config]);

  /**
   * Manual state override (for testing/debugging)
   */
  const overrideState = useCallback((newState) => {
    if (debugMode) {
      console.log('🎮 Manual state override:', newState);
    }
    
    setAnimationState(prev => ({
      ...prev,
      ...newState
    }));
  }, [debugMode]);

  return {
    // Current state
    animationState,
    
    // Configuration
    config,
    
    // Update functions
    updateFromScrollProgress,
    overrideState,
    
    // Current configs for 3D components
    cameraConfig: getCurrentCameraConfig(),
    crystalConfig: getCurrentCrystalConfig(),
    
    // Utility functions
    calculateTargetState: (progress) => calculateTargetState(progress, config),
    calculateCurrentZone: (progress) => calculateCurrentZone(progress, config),
    calculateActiveProject: (progress) => calculateActiveProject(progress, config),
    
    // Debug info
    debugInfo: debugMode ? {
      transitionDuration: transitionDuration.current,
      transitionElapsed: isTransitioningRef.current 
        ? performance.now() - transitionStartTime.current 
        : 0,
      isTransitioning: isTransitioningRef.current,
      smoothedProgress: lastScrollProgress.current,
      zoneTransition: animationState.isInZoneTransition,
      projectTransition: animationState.isInProjectTransition
    } : null
  };
};