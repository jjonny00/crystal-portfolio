// src/hooks/useUnifiedAnimationController.js
// FIXED: Proper explosion timing, smooth reverse animation, and camera coordination

import { useState, useEffect, useRef, useCallback } from 'react';
import { Vector3 } from 'three';

/**
 * FIXED: Animation Configuration with proper explosion timing
 */
export const ANIMATION_CONFIG = {
  // Camera states with coordinated positions
  camera: {
    hero: {
      position: new Vector3(0, 3.2, 2.4),
      target: new Vector3(0, 0.5, 0),
      fov: 32,
      description: 'Intimate close view - elevated perspective'
    },
    // NEW: Pre-explosion state for smooth transition
    preExplosion: {
      position: new Vector3(0, 2.8, 3.8),
      target: new Vector3(0, 0.4, 0),
      fov: 38,
      description: 'Ready for explosion view'
    },
    // NEW: Post-explosion state before focusing on projects
    postExplosion: {
      position: new Vector3(0, 2.5, 6.5),
      target: new Vector3(0, 0.3, 0),
      fov: 45,
      description: 'Wide view showing all exploded facets'
    },
    overview: {
      position: new Vector3(0, 2.2, 5.5),
      target: new Vector3(0, 0.2, 0),
      fov: 42,
      description: 'Projects overview with exploded crystal'
    },
    projects: {
      empathy: {
        position: new Vector3(2.8, -1.5, 3.2),
        target: new Vector3(0.3, -0.7, -0.2),
        fov: 35,
        description: 'Close view of empathy facet'
      },
      narrative: {
        position: new Vector3(3.5, 0.2, 2.8),
        target: new Vector3(0.3, -0.1, -0.7),
        fov: 35,
        description: 'Close view of narrative facet'
      },
      craft: {
        position: new Vector3(3.8, 2.5, 3.0),
        target: new Vector3(1.3, 0.8, 0.5),
        fov: 35,
        description: 'Close view of craft facet'
      },
      system: {
        position: new Vector3(-3.2, 1.0, 2.5),
        target: new Vector3(-0.5, 0.2, -1.8),
        fov: 35,
        description: 'Close view of system facet'
      },
      leadership: {
        position: new Vector3(1.2, 4.0, 3.2),
        target: new Vector3(0.4, 1.2, 0.9),
        fov: 35,
        description: 'Close view of leadership facet'
      },
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

  // FIXED: Coordinated timing for smooth animations
  timing: {
    // Hero to overview transition
    heroToOverview: 1200,
    
    // Explosion sequence
    explosionPrepare: 600,    // Time to get to pre-explosion camera
    explosionDuration: 1400,  // Crystal explosion time
    explosionSettle: 400,     // Time to settle into overview
    
    // Project transitions
    overviewToProject: 1800,  // First project focus
    projectToProject: 1600,   // Between projects
    
    // Reform sequence
    reformPrepare: 800,       // Move camera for reform
    reformDuration: 1200,     // Crystal reform time
    reformComplete: 600,      // Return to final position
    
    // NEW: Reverse explosion timing
    reverseExplosionDuration: 1000,  // Faster reverse
    
    easing: 'ultraSmooth'
  },

  // FIXED: More precise scroll zones
  scrollZones: {
    hero: { start: 0, end: 0.125 },
    overview: { start: 0.125, end: 0.25 },
    projects: { start: 0.25, end: 0.875 },
    about: { start: 0.875, end: 1.0 }
  },

  // Project section mapping
  projectSections: {
    empathy: { start: 0.25, end: 0.375 },
    narrative: { start: 0.375, end: 0.5 },
    craft: { start: 0.5, end: 0.625 },
    system: { start: 0.625, end: 0.75 },
    leadership: { start: 0.75, end: 0.875 },
    exploration: { start: 0.875, end: 1.0 }
  }
};

/**
 * Enhanced state tracking for coordinated animations
 */
const ANIMATION_STATES = {
  HERO: 'hero',
  PREPARING_EXPLOSION: 'preparing_explosion',
  EXPLODING: 'exploding',
  EXPLOSION_SETTLING: 'explosion_settling',
  OVERVIEW: 'overview',
  FOCUSING_PROJECT: 'focusing_project',
  PROJECT_FOCUSED: 'project_focused',
  PREPARING_REFORM: 'preparing_reform',
  REFORMING: 'reforming',
  REFORM_SETTLING: 'reform_settling',
  ABOUT: 'about'
};

/**
 * FIXED: Calculate current zone with better transition detection
 */
const calculateCurrentZone = (scrollProgress, config = ANIMATION_CONFIG) => {
  const zones = config.scrollZones;
  
  // Small overlap for transition detection
  const overlap = 0.02;
  
  if (scrollProgress <= zones.hero.end) {
    return {
      zone: 'hero',
      progress: scrollProgress / zones.hero.end,
      isEntering: false,
      isLeaving: scrollProgress > zones.hero.end - overlap
    };
  }
  
  if (scrollProgress <= zones.overview.end) {
    const progress = (scrollProgress - zones.overview.start) / (zones.overview.end - zones.overview.start);
    return {
      zone: 'overview',
      progress: Math.max(0, Math.min(progress, 1)),
      isEntering: scrollProgress < zones.overview.start + overlap,
      isLeaving: scrollProgress > zones.overview.end - overlap
    };
  }
  
  if (scrollProgress <= zones.projects.end) {
    const progress = (scrollProgress - zones.projects.start) / (zones.projects.end - zones.projects.start);
    return {
      zone: 'projects',
      progress: Math.max(0, Math.min(progress, 1)),
      isEntering: scrollProgress < zones.projects.start + overlap,
      isLeaving: scrollProgress > zones.projects.end - overlap
    };
  }
  
  const progress = (scrollProgress - zones.about.start) / (zones.about.end - zones.about.start);
  return {
    zone: 'about',
    progress: Math.max(0, Math.min(progress, 1)),
    isEntering: scrollProgress < zones.about.start + overlap,
    isLeaving: false
  };
};

/**
 * FIXED: Calculate active project
 */
const calculateActiveProject = (scrollProgress, config = ANIMATION_CONFIG) => {
  if (scrollProgress < config.scrollZones.projects.start) {
    return { project: null, progress: 0 };
  }
  
  const projectSections = config.projectSections;
  
  for (const [projectKey, section] of Object.entries(projectSections)) {
    if (scrollProgress >= section.start && scrollProgress < section.end) {
      const progress = (scrollProgress - section.start) / (section.end - section.start);
      return {
        project: projectKey,
        progress: Math.max(0, Math.min(progress, 1))
      };
    }
  }
  
  return { project: null, progress: 0 };
};

/**
 * Main Unified Animation Controller with coordinated timing
 */
export const useUnifiedAnimationController = (options = {}) => {
  const {
    config = ANIMATION_CONFIG,
    debugMode = false,
    onStateChange = null
  } = options;

  // Enhanced animation state
  const [animationState, setAnimationState] = useState({
    state: ANIMATION_STATES.HERO,
    crystalForm: 'whole',
    cameraState: 'hero',
    focusedFacet: null,
    isTransitioning: false,
    scrollProgress: 0,
    zoneInfo: { zone: 'hero', progress: 0 },
    projectInfo: { project: null, progress: 0 }
  });

  // Animation coordination refs
  const animationSequence = useRef(null);
  const lastZone = useRef('hero');
  const lastProject = useRef(null);

  /**
   * FIXED: Coordinated animation sequences
   */
  const startAnimationSequence = useCallback((sequenceName, targetState) => {
    // Clear any existing sequence
    if (animationSequence.current) {
      clearTimeout(animationSequence.current);
    }

    setAnimationState(prev => ({ ...prev, isTransitioning: true }));

    if (debugMode) {
      console.log(`🎬 Starting ${sequenceName} sequence`);
    }

    switch (sequenceName) {
      case 'explode':
        // Phase 1: Prepare for explosion
        setAnimationState(prev => ({
          ...prev,
          state: ANIMATION_STATES.PREPARING_EXPLOSION,
          cameraState: 'preExplosion'
        }));

        animationSequence.current = setTimeout(() => {
          // Phase 2: Start explosion
          setAnimationState(prev => ({
            ...prev,
            state: ANIMATION_STATES.EXPLODING,
            crystalForm: 'exploded',
            cameraState: 'postExplosion'
          }));

          animationSequence.current = setTimeout(() => {
            // Phase 3: Settle into overview
            setAnimationState(prev => ({
              ...prev,
              state: ANIMATION_STATES.OVERVIEW,
              cameraState: 'overview',
              isTransitioning: false
            }));
            animationSequence.current = null;
          }, config.timing.explosionDuration);
        }, config.timing.explosionPrepare);
        break;

      case 'reform':
        // Phase 1: Prepare for reform
        setAnimationState(prev => ({
          ...prev,
          state: ANIMATION_STATES.PREPARING_REFORM,
          cameraState: 'postExplosion',
          focusedFacet: null
        }));

        animationSequence.current = setTimeout(() => {
          // Phase 2: Start reform (reverse explosion)
          setAnimationState(prev => ({
            ...prev,
            state: ANIMATION_STATES.REFORMING,
            crystalForm: 'whole',
            cameraState: 'preExplosion'
          }));

          animationSequence.current = setTimeout(() => {
            // Phase 3: Complete reform
            setAnimationState(prev => ({
              ...prev,
              state: ANIMATION_STATES.HERO,
              cameraState: 'hero',
              isTransitioning: false
            }));
            animationSequence.current = null;
          }, config.timing.reverseExplosionDuration);
        }, config.timing.reformPrepare);
        break;

      case 'focusProject':
        setAnimationState(prev => ({
          ...prev,
          state: ANIMATION_STATES.FOCUSING_PROJECT,
          cameraState: 'project',
          focusedFacet: targetState.project
        }));

        animationSequence.current = setTimeout(() => {
          setAnimationState(prev => ({
            ...prev,
            state: ANIMATION_STATES.PROJECT_FOCUSED,
            isTransitioning: false
          }));
          animationSequence.current = null;
        }, config.timing.overviewToProject);
        break;

      case 'switchProject':
        setAnimationState(prev => ({
          ...prev,
          isTransitioning: true,
          focusedFacet: targetState.project
        }));

        animationSequence.current = setTimeout(() => {
          setAnimationState(prev => ({
            ...prev,
            isTransitioning: false
          }));
          animationSequence.current = null;
        }, config.timing.projectToProject);
        break;
    }
  }, [config, debugMode]);

  /**
   * FIXED: Update animation state with proper sequencing
   */
  const updateFromScrollProgress = useCallback((scrollProgress) => {
    const currentZone = calculateCurrentZone(scrollProgress, config);
    const activeProject = calculateActiveProject(scrollProgress, config);
    
    // Detect zone changes
    const zoneChanged = currentZone.zone !== lastZone.current;
    const projectChanged = activeProject.project !== lastProject.current;

    if (zoneChanged) {
      if (debugMode) {
        console.log(`🗺️ Zone change: ${lastZone.current} → ${currentZone.zone}`);
      }

      // Handle zone transitions with proper sequencing
      if (lastZone.current === 'hero' && currentZone.zone === 'overview') {
        // FIXED: Start explosion when entering overview
        startAnimationSequence('explode');
      } else if (lastZone.current === 'overview' && currentZone.zone === 'hero') {
        // FIXED: Reverse explosion when going back to hero
        startAnimationSequence('reform');
      } else if (currentZone.zone === 'about') {
        // Direct transition to about
        setAnimationState(prev => ({
          ...prev,
          state: ANIMATION_STATES.ABOUT,
          crystalForm: 'whole',
          cameraState: 'about',
          focusedFacet: null,
          isTransitioning: false
        }));
      }

      lastZone.current = currentZone.zone;
    }

    // Handle project changes within projects zone
    if (currentZone.zone === 'projects' && projectChanged && activeProject.project) {
      if (debugMode) {
        console.log(`🎯 Project change: ${lastProject.current} → ${activeProject.project}`);
      }

      if (!lastProject.current) {
        // First project focus
        startAnimationSequence('focusProject', activeProject);
      } else {
        // Switch between projects
        startAnimationSequence('switchProject', activeProject);
      }

      lastProject.current = activeProject.project;
    } else if (currentZone.zone !== 'projects' && lastProject.current) {
      // Left projects zone
      lastProject.current = null;
    }

    // Update base state
    setAnimationState(prev => ({
      ...prev,
      scrollProgress,
      zoneInfo: currentZone,
      projectInfo: activeProject
    }));

    // State change callback
    if (onStateChange) {
      onStateChange(animationState);
    }
  }, [config, debugMode, startAnimationSequence, onStateChange, animationState]);

  /**
   * Get current camera configuration
   */
  const getCurrentCameraConfig = useCallback(() => {
    if (animationState.cameraState === 'project' && animationState.focusedFacet) {
      return config.camera.projects[animationState.focusedFacet];
    }
    
    return config.camera[animationState.cameraState] || config.camera.hero;
  }, [animationState.cameraState, animationState.focusedFacet, config]);

  /**
   * Get current crystal configuration
   */
  const getCurrentCrystalConfig = useCallback(() => {
    return {
      form: animationState.crystalForm,
      positions: animationState.crystalForm === 'exploded' 
        ? config.crystal.explodedPositions 
        : { center: config.crystal.wholePosition },
      // NEW: Add rotation state for idle crystal
      shouldRotate: animationState.crystalForm === 'whole' && 
                   animationState.state === ANIMATION_STATES.HERO,
      rotationSpeed: 0.0003 // Very subtle rotation
    };
  }, [animationState.crystalForm, animationState.state, config]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (animationSequence.current) {
        clearTimeout(animationSequence.current);
      }
    };
  }, []);

  return {
    // Current state
    animationState,
    
    // Configuration
    config,
    
    // Update functions
    updateFromScrollProgress,
    
    // Current configs for 3D components
    cameraConfig: getCurrentCameraConfig(),
    crystalConfig: getCurrentCrystalConfig(),
    
    // Debug info
    debugInfo: debugMode ? {
      currentState: animationState.state,
      isTransitioning: animationState.isTransitioning,
      hasActiveSequence: !!animationSequence.current,
      lastZone: lastZone.current,
      lastProject: lastProject.current
    } : null
  };
};