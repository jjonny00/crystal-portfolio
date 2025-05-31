// src/hooks/useUnifiedAnimationController.js
// Phase 1: Core Animation Engine - Single source of truth for all animations

import { useState, useEffect, useRef, useCallback } from 'react';
import { Vector3 } from 'three';

/**
 * Centralized Animation Configuration
 * All positions, timings, and easing in one place for easy tweaking
 */
export const ANIMATION_CONFIG = {
  // Camera states for each section
  camera: {
    hero: {
      position: new Vector3(0, 3.2, 2.4),
      target: new Vector3(0, 0.5, 0),
      fov: 32,
      description: 'Intimate close view - elevated perspective'
    },
    overview: {
      position: new Vector3(0, 1.8, 7.0),
      target: new Vector3(0, 0.2, 0),
      fov: 45,
      description: 'Wide view to see crystal clearly before explosion'
    },
    projects: {
      empathy: {
        position: new Vector3(3.2, -1.8, 3.5),
        target: new Vector3(0.3, -0.7, -0.2),
        fov: 35
      },
      narrative: {
        position: new Vector3(3.5, 0.8, 3.0),
        target: new Vector3(0.3, -0.1, -0.7),
        fov: 35
      },
      craft: {
        position: new Vector3(4.5, 3.2, 2.2),
        target: new Vector3(1.3, 0.8, 0.5),
        fov: 35
      },
      system: {
        position: new Vector3(-2.8, 1.5, 2.0),
        target: new Vector3(-0.5, 0.2, -1.8),
        fov: 35
      },
      leadership: {
        position: new Vector3(3.8, 4.5, 2.8),
        target: new Vector3(0.4, 1.2, 0.9),
        fov: 35
      },
      exploration: {
        position: new Vector3(-3.0, 3.0, 2.8),
        target: new Vector3(-0.6, 0.7, 0.0),
        fov: 35
      }
    },
    about: {
      position: new Vector3(0, 2.5, 3.0),
      target: new Vector3(0, 0.3, 0),
      fov: 38,
      description: 'Close reformed crystal view'
    }
  },

  // Crystal facet positions when exploded
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

  // Animation timing and easing
  timing: {
    cameraTransition: 1200,     // ms for camera movements
    crystalExplosion: 800,      // ms for crystal explosion
    crystalReform: 1000,        // ms for crystal reform
    facetFocus: 1800,          // ms for focusing on specific facet (INCREASED for smoother transitions)
    projectSwitch: 2000,       // ms for switching between projects (NEW - slower transitions)
    easing: 'easeInOutCubic'   // Unified easing function
  },

  // Page scroll zones (as percentages of total scroll)
  scrollZones: {
    hero: { start: 0, end: 0.20 },        // 0-20%
    overview: { start: 0.20, end: 0.25 }, // 20-25% (brief transition zone)
    projects: { start: 0.25, end: 0.75 }, // 25-75% (large zone for all projects)
    about: { start: 0.75, end: 1.0 }      // 75-100%
  },

  // Project sections within the projects zone
  projectSections: {
    empathy: { start: 0.25, end: 0.33 },
    narrative: { start: 0.33, end: 0.42 },
    craft: { start: 0.42, end: 0.50 },
    system: { start: 0.50, end: 0.58 },
    leadership: { start: 0.58, end: 0.67 },
    exploration: { start: 0.67, end: 0.75 }
  }
};

/**
 * Easing functions for smooth animations
 */
const EASING_FUNCTIONS = {
  linear: (t) => t,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutQuart: (t) => 1 - Math.pow(1 - t, 4),
  easeInOutQuint: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2
};

/**
 * Calculate what zone we're in based on scroll progress
 */
const calculateCurrentZone = (scrollProgress, config = ANIMATION_CONFIG) => {
  const zones = config.scrollZones;
  
  if (scrollProgress <= zones.hero.end) {
    return {
      zone: 'hero',
      zoneProgress: scrollProgress / zones.hero.end,
      nextZone: 'overview'
    };
  }
  
  if (scrollProgress <= zones.overview.end) {
    const zoneProgress = (scrollProgress - zones.overview.start) / (zones.overview.end - zones.overview.start);
    return {
      zone: 'overview',
      zoneProgress,
      nextZone: 'projects'
    };
  }
  
  if (scrollProgress <= zones.projects.end) {
    const zoneProgress = (scrollProgress - zones.projects.start) / (zones.projects.end - zones.projects.start);
    return {
      zone: 'projects',
      zoneProgress,
      nextZone: 'about'
    };
  }
  
  const zoneProgress = (scrollProgress - zones.about.start) / (zones.about.end - zones.about.start);
  return {
    zone: 'about',
    zoneProgress,
    nextZone: null
  };
};

/**
 * Calculate which project is active based on scroll progress
 */
const calculateActiveProject = (scrollProgress, config = ANIMATION_CONFIG) => {
  const projectSections = config.projectSections;
  
  for (const [projectKey, section] of Object.entries(projectSections)) {
    if (scrollProgress >= section.start && scrollProgress < section.end) {
      const projectProgress = (scrollProgress - section.start) / (section.end - section.start);
      return {
        project: projectKey,
        progress: projectProgress
      };
    }
  }
  
  return { project: null, progress: 0 };
};

/**
 * Calculate target animation state based on scroll progress
 */
const calculateTargetState = (scrollProgress, config = ANIMATION_CONFIG) => {
  const currentZone = calculateCurrentZone(scrollProgress, config);
  const activeProject = calculateActiveProject(scrollProgress, config);
  
  // Determine crystal form
  let crystalForm = 'whole';
  if (currentZone.zone === 'overview' || currentZone.zone === 'projects') {
    crystalForm = 'exploded';
  }
  
  // Determine camera state
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
    projectInfo: activeProject
  };
};

/**
 * Main Unified Animation Controller Hook
 * Single source of truth for all animation state
 */
export const useUnifiedAnimationController = (options = {}) => {
  const {
    config = ANIMATION_CONFIG,
    debugMode = false,
    onStateChange = null
  } = options;

  // Core animation state
  const [animationState, setAnimationState] = useState({
    crystalForm: 'whole',      // 'whole' | 'exploded'
    cameraState: 'hero',       // 'hero' | 'overview' | 'project' | 'about'
    focusedFacet: null,        // null | 'empathy' | 'narrative' | etc.
    isTransitioning: false,
    scrollProgress: 0,
    zoneInfo: { zone: 'hero', zoneProgress: 0 },
    projectInfo: { project: null, progress: 0 }
  });

  // Animation timing refs
  const transitionStartTime = useRef(0);
  const transitionDuration = useRef(0);
  const isTransitioningRef = useRef(false);

  /**
   * Update animation state based on scroll progress
   */
  const updateFromScrollProgress = useCallback((scrollProgress) => {
    const targetState = calculateTargetState(scrollProgress, config);
    
    // Check if we need to transition
    const needsTransition = (
      targetState.crystalForm !== animationState.crystalForm ||
      targetState.cameraState !== animationState.cameraState ||
      targetState.focusedFacet !== animationState.focusedFacet
    );

    if (needsTransition && !isTransitioningRef.current) {
      // Start transition
      isTransitioningRef.current = true;
      transitionStartTime.current = performance.now();
      
      // Determine transition duration based on what's changing
      let duration = config.timing.cameraTransition;
      if (targetState.crystalForm !== animationState.crystalForm) {
        duration = targetState.crystalForm === 'exploded' 
          ? config.timing.crystalExplosion 
          : config.timing.crystalReform;
      }
      
      transitionDuration.current = duration;
      
      if (debugMode) {
        console.log('🎬 Starting transition:', {
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

    // Update state
    const newState = {
      ...targetState,
      isTransitioning: isTransitioningRef.current
    };

    setAnimationState(newState);
    
    // Callback for state changes
    if (onStateChange) {
      onStateChange(newState, animationState);
    }
  }, [animationState, config, debugMode, onStateChange]);

  /**
   * Check if transition is complete
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
          console.log('✅ Transition complete');
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
   * Get current camera configuration based on state
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
      isTransitioning: isTransitioningRef.current
    } : null
  };
};