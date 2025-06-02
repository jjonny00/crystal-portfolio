// src/hooks/useUnifiedAnimationController.js
// FIXED: Better scroll zone timing and smooth camera transitions

import { useState, useEffect, useRef, useCallback } from 'react';
import { Vector3 } from 'three';

/**
 * FIXED: Centralized Animation Configuration with corrected scroll zones
 */
export const ANIMATION_CONFIG = {
  // Camera states with gradual position changes to prevent popping
  camera: {
    hero: {
        position: new Vector3(0, 3.2, 2.4),
        target: new Vector3(0, 0.5, 0),
        fov: 32,
        description: 'Intimate close view - elevated perspective'
    },
    overview: {
        position: new Vector3(0, 2.5, 4.0),
        target: new Vector3(0, 0.3, 0),
        fov: 38,
        description: 'Intermediate view before explosion'
    },
    projects: {
        // EMPATHY - Bottom-left facet (existing)
        empathy: {
        position: new Vector3(2.8, -1.5, 3.2),
        target: new Vector3(0.3, -0.7, -0.2),
        fov: 35,
        description: 'Close view of empathy facet'
        },
        
        // NARRATIVE - Middle-left facet (NEW)
        narrative: {
        position: new Vector3(3.5, 0.2, 2.8),
        target: new Vector3(0.3, -0.1, -0.7),
        fov: 35,
        description: 'Close view of narrative facet'
        },
        
        // CRAFT - Top-right facet (NEW)
        craft: {
        position: new Vector3(3.8, 2.5, 3.0),
        target: new Vector3(1.3, 0.8, 0.5),
        fov: 35,
        description: 'Close view of craft facet'
        },
        
        // SYSTEM - Left facet (NEW)
        system: {
        position: new Vector3(-3.2, 1.0, 2.5),
        target: new Vector3(-0.5, 0.2, -1.8),
        fov: 35,
        description: 'Close view of system facet'
        },
        
        // LEADERSHIP - Top facet (NEW)
        leadership: {
        position: new Vector3(1.2, 4.0, 3.2),
        target: new Vector3(0.4, 1.2, 0.9),
        fov: 35,
        description: 'Close view of leadership facet'
        },
        
        // EXPLORATION - Top-left facet (existing)
        exploration: {
        position: new Vector3(-2.8, 2.8, 2.6),
        target: new Vector3(-0.6, 0.7, 0.0),
        fov: 35,
        description: 'Close view of exploration facet'
        }
    },
    about: {
        position: new Vector3(0, 2.0, 3.5),
        target: new Vector3(0, 0.2, 0),
        fov: 40,
        description: 'Reformed crystal view'
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

  // FIXED: Slower animation timing for ultra-smooth transitions
  timing: {
    cameraTransition: 1600,     // INCREASED for smoother movement
    crystalExplosion: 1000,     
    crystalReform: 1200,        
    facetFocus: 2000,          // INCREASED for ultra-smooth project switches
    projectSwitch: 2200,       // INCREASED for maximum smoothness
    easing: 'ultraSmooth'      // Use ultra-smooth easing
  },

  // FIXED: Corrected scroll zones for 8 sections (hero, overview, 6 projects, about)
  scrollZones: {
    hero: { start: 0, end: 0.125 },        // FIXED: 1/8 of page (section 1)
    overview: { start: 0.125, end: 0.25 }, // FIXED: 1/8 of page (section 2)
    projects: { start: 0.25, end: 0.875 }, // FIXED: 6/8 of page (sections 3-8)
    about: { start: 0.875, end: 1.0 }      // FIXED: 1/8 of page (section 8)
  },

  // FIXED: Project section transitions aligned with actual scroll positions
  projectSections: {
    empathy: { start: 0.25, end: 0.375 },     // Section 3: 25-37.5%
    narrative: { start: 0.375, end: 0.5 },    // Section 4: 37.5-50%
    craft: { start: 0.5, end: 0.625 },        // Section 5: 50-62.5%
    system: { start: 0.625, end: 0.75 },      // Section 6: 62.5-75%
    leadership: { start: 0.75, end: 0.875 },  // Section 7: 75-87.5%
    exploration: { start: 0.875, end: 1.0 }   // Section 8: 87.5-100% (overlaps with about)
  }
};

/**
 * Enhanced easing functions for ultra-smooth movement
 */
const EASING_FUNCTIONS = {
  linear: (t) => t,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutQuart: (t) => 1 - Math.pow(1 - t, 4),
  easeInOutQuint: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,
  // Ultra-smooth easing for camera movements
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
  
  // Add small overlap zones to prevent abrupt transitions
  const overlap = 0.01; // 1% overlap for smooth transitions
  
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
 * FIXED: Calculate active project with proper camera position updates
 */
const calculateActiveProject = (scrollProgress, config = ANIMATION_CONFIG) => {
  const projectSections = config.projectSections;
  
  // No overlap - make transitions more distinct
  for (const [projectKey, section] of Object.entries(projectSections)) {
    if (scrollProgress >= section.start && scrollProgress < section.end) {
      const projectProgress = Math.max(0, Math.min(
        (scrollProgress - section.start) / (section.end - section.start), 1
      ));
      
      // Debug logging for project detection
    //   if (process.env.NODE_ENV === 'development') {
    //     console.log(`🎯 Active project: ${projectKey} (${Math.round(projectProgress * 100)}%)`, {
    //       scrollProgress: Math.round(scrollProgress * 1000) / 1000,
    //       section: section,
    //       projectProgress: Math.round(projectProgress * 1000) / 1000
    //     });
    //   }
      
      return {
        project: projectKey,
        progress: projectProgress,
        isInTransition: false // Remove transition flag that might be interfering
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
 * Main Unified Animation Controller with ultra-smooth transitions
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
    const smoothedProgress = scrollProgress * 0.98 + lastScrollProgress.current * 0.02;
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
      
      // Determine transition duration based on what's changing
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
   * Check if transition is complete with smoother timing
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
     * FIXED: Get current camera configuration with proper project handling
     */
    const getCurrentCameraConfig = useCallback(() => {
    // Make sure we have the right camera state
    if (animationState.cameraState === 'project' && animationState.focusedFacet) {
        const projectCamera = config.camera.projects[animationState.focusedFacet];
        
        if (projectCamera) {
        // if (process.env.NODE_ENV === 'development') {
        //     console.log(`📹 Using project camera for: ${animationState.focusedFacet}`, projectCamera);
        // }
        return projectCamera;
        } else {
        console.warn(`⚠️ No camera config found for project: ${animationState.focusedFacet}`);
        }
    }

    const fallbackCamera = config.camera[animationState.cameraState] || config.camera.hero;

    // if (process.env.NODE_ENV === 'development') {
    //     console.log(`📹 Using fallback camera for state: ${animationState.cameraState}`, fallbackCamera);
    // }

    return fallbackCamera;
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