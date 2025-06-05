// FIXED: src/hooks/useUnifiedAnimationController.js
// Coordinated animation system with proper sequencing to eliminate jumps

import { useState, useEffect, useRef, useCallback } from 'react';
import { Vector3 } from 'three';

/**
 * FIXED: Animation Configuration with precise timing coordination
 */
export const ANIMATION_CONFIG = {
  // FIXED: Coordinated camera positions that prevent jumps
  camera: {
    hero: {
      position: new Vector3(0, 3.2, 2.4),
      target: new Vector3(0, 0.5, 0),
      fov: 32,
      description: 'Hero close view'
    },
    // FIXED: Intermediate positions for smooth transitions
    preExplosion: {
      position: new Vector3(0, 2.8, 3.8),
      target: new Vector3(0, 0.4, 0),
      fov: 38,
      description: 'Moving toward explosion view'
    },
    // FIXED: Overview position that connects smoothly
    overview: {
      position: new Vector3(0, 2.5, 6.2),  // FIXED: Slightly closer to prevent jump
      target: new Vector3(0, 0.3, 0),
      fov: 44,
      description: 'Overview with exploded crystal - FIXED positioning'
    },
    // FIXED: Reform preparation position
    preReform: {
      position: new Vector3(0, 2.8, 5.5),  // NEW: Smooth transition position
      target: new Vector3(0, 0.3, 0),
      fov: 42,
      description: 'Preparing for crystal reform'
    },
    about: {
      position: new Vector3(0, 2.0, 3.5),
      target: new Vector3(0, 0.2, 0),
      fov: 40,
      description: 'About view with whole crystal'
    },
    projects: {
      empathy: {
        position: new Vector3(2.8, -1.5, 3.2),
        target: new Vector3(0.3, -0.7, -0.2),
        fov: 35,
        description: 'Empathy facet focus'
      },
      narrative: {
        position: new Vector3(3.5, 0.2, 2.8),
        target: new Vector3(0.3, -0.1, -0.7),
        fov: 35,
        description: 'Narrative facet focus'
      },
      craft: {
        position: new Vector3(3.8, 2.5, 3.0),
        target: new Vector3(1.3, 0.8, 0.5),
        fov: 35,
        description: 'Craft facet focus'
      },
      system: {
        position: new Vector3(-3.2, 1.0, 2.5),
        target: new Vector3(-0.5, 0.2, -1.8),
        fov: 35,
        description: 'System facet focus'
      },
      leadership: {
        position: new Vector3(1.2, 4.0, 3.2),
        target: new Vector3(0.4, 1.2, 0.9),
        fov: 35,
        description: 'Leadership facet focus'
      },
      exploration: {
        position: new Vector3(-2.8, 2.8, 2.6),
        target: new Vector3(-0.6, 0.7, 0.0),
        fov: 35,
        description: 'Exploration facet focus'
      }
    }
  },

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

  // FIXED: Coordinated timing that prevents conflicts
  timing: {
    // Explosion sequence - hero to overview
    explosionPrepare: 400,       // Move to pre-explosion position
    explosionDuration: 1200,     // Crystal explodes + camera to overview
    explosionSettle: 300,        // Final settling time
    
    // Reform sequence - overview/projects to about
    reformPrepare: 500,          // Move to pre-reform position
    reformDuration: 1000,        // Crystal reforms
    reformCameraMove: 800,       // Camera moves to final about position
    reformSettle: 200,           // Final settling
    
    // Project transitions
    projectFocus: 1200,          // Focus on specific project
    projectSwitch: 800,          // Switch between projects
    
    // General
    debounceMs: 150,             // Prevent rapid state changes
  },

  scrollZones: {
    hero: { start: 0, end: 0.12 },
    overview: { start: 0.12, end: 0.24 },
    projects: { start: 0.24, end: 0.875 },
    about: { start: 0.875, end: 1.0 }
  },

  projectSections: {
    empathy: { start: 0.24, end: 0.346 },
    narrative: { start: 0.346, end: 0.452 },
    craft: { start: 0.452, end: 0.558 },
    system: { start: 0.558, end: 0.664 },
    leadership: { start: 0.664, end: 0.77 },
    exploration: { start: 0.77, end: 0.875 }
  }
};

// FIXED: More precise animation states
const ANIMATION_STATES = {
  HERO: 'hero',
  PREPARING_EXPLOSION: 'preparing_explosion',
  EXPLODING: 'exploding',
  EXPLOSION_SETTLING: 'explosion_settling',
  OVERVIEW: 'overview',
  FOCUSING_PROJECT: 'focusing_project',
  PROJECT_FOCUSED: 'project_focused',
  PREPARING_REFORM: 'preparing_reform',
  REFORMING_CRYSTAL: 'reforming_crystal',      // FIXED: Crystal reforming phase
  REFORMING_CAMERA: 'reforming_camera',        // FIXED: Camera moving to final position
  REFORM_SETTLING: 'reform_settling',
  ABOUT: 'about'
};

/**
 * FIXED: Zone calculation with better transition detection
 */
const calculateCurrentZone = (scrollProgress, config = ANIMATION_CONFIG) => {
  const zones = config.scrollZones;
  const overlap = 0.01; // Smaller overlap to prevent conflicts
  
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
 * FIXED: Main controller with coordinated animation sequences
 */
export const useUnifiedAnimationController = (options = {}) => {
  const {
    config = ANIMATION_CONFIG,
    debugMode = false,
    onStateChange = null
  } = options;

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

  // FIXED: Better coordination refs
  const animationSequence = useRef(null);
  const animationPhase = useRef(null);  // Track which phase of animation we're in
  const lastZone = useRef('hero');
  const lastProject = useRef(null);
  const lastUpdateTime = useRef(0); // throttle scroll handling

  /**
   * FIXED: Clear animation sequence safely
   */
  const clearAnimationSequence = useCallback(() => {
    if (animationSequence.current) {
      clearTimeout(animationSequence.current);
      animationSequence.current = null;
    }
    if (animationPhase.current) {
      clearTimeout(animationPhase.current);
      animationPhase.current = null;
    }
  }, []);

  /**
   * FIXED: Coordinated explosion sequence (hero to overview)
   */
  const startExplosionSequence = useCallback(() => {
    clearAnimationSequence();
    
    if (debugMode) {
      console.log('🎬 Starting coordinated explosion sequence');
    }

    // Phase 1: Prepare for explosion (camera positioning)
    setAnimationState(prev => ({
      ...prev,
      state: ANIMATION_STATES.PREPARING_EXPLOSION,
      cameraState: 'preExplosion',
      isTransitioning: true
    }));

    animationSequence.current = setTimeout(() => {
      // Phase 2: Crystal explodes + camera moves to overview
      setAnimationState(prev => ({
        ...prev,
        state: ANIMATION_STATES.EXPLODING,
        crystalForm: 'exploded',
        cameraState: 'overview'  // FIXED: Direct to overview, no intermediate jumps
      }));

      animationSequence.current = setTimeout(() => {
        // Phase 3: Settle into stable overview state
        setAnimationState(prev => ({
          ...prev,
          state: ANIMATION_STATES.OVERVIEW,
          isTransitioning: false
        }));
        
        if (debugMode) {
          console.log('✅ Explosion sequence complete - camera should be stable at overview');
        }
        
        animationSequence.current = null;
      }, config.timing.explosionDuration);
    }, config.timing.explosionPrepare);
  }, [clearAnimationSequence, config, debugMode]);

  /**
   * FIXED: Coordinated reform sequence (overview/projects to about)
   */
  const startReformSequence = useCallback(() => {
    clearAnimationSequence();
    
    if (debugMode) {
      console.log('🎬 Starting coordinated reform sequence');
    }

    // Phase 1: Prepare for reform (move camera to pre-reform position)
    setAnimationState(prev => ({
      ...prev,
      state: ANIMATION_STATES.PREPARING_REFORM,
      cameraState: 'preReform',
      focusedFacet: null,  // Clear any focused facet
      isTransitioning: true
    }));

    animationSequence.current = setTimeout(() => {
      // Phase 2: Crystal starts reforming (but camera stays put)
      setAnimationState(prev => ({
        ...prev,
        state: ANIMATION_STATES.REFORMING_CRYSTAL,
        crystalForm: 'whole'  // Crystal reforms first
      }));

      animationSequence.current = setTimeout(() => {
        // Phase 3: Camera moves to final about position
        setAnimationState(prev => ({
          ...prev,
          state: ANIMATION_STATES.REFORMING_CAMERA,
          cameraState: 'about'  // FIXED: Now camera moves to final position
        }));

        animationSequence.current = setTimeout(() => {
          // Phase 4: Final settle
          setAnimationState(prev => ({
            ...prev,
            state: ANIMATION_STATES.ABOUT,
            isTransitioning: false
          }));
          
          if (debugMode) {
            console.log('✅ Reform sequence complete - crystal reformed and camera stable');
          }
          
          animationSequence.current = null;
        }, config.timing.reformCameraMove);
      }, config.timing.reformDuration);
    }, config.timing.reformPrepare);
  }, [clearAnimationSequence, config, debugMode]);

  /**
   * FIXED: Project focus sequence
   */
  const startProjectFocusSequence = useCallback((projectKey) => {
    if (debugMode) {
      console.log('🎯 Focusing on project:', projectKey);
    }

    setAnimationState(prev => ({
      ...prev,
      state: ANIMATION_STATES.FOCUSING_PROJECT,
      cameraState: 'project',
      focusedFacet: projectKey,
      isTransitioning: true
    }));

    // Clear any existing timeout
    if (animationSequence.current) {
      clearTimeout(animationSequence.current);
    }

    animationSequence.current = setTimeout(() => {
      setAnimationState(prev => ({
        ...prev,
        state: ANIMATION_STATES.PROJECT_FOCUSED,
        isTransitioning: false
      }));
      animationSequence.current = null;
    }, config.timing.projectFocus);
  }, [config, debugMode]);

  /**
   * FIXED: Main scroll update with throttling for smoother reactions
   */
  const updateFromScrollProgress = useCallback((scrollProgress) => {
    const now = performance.now();
    if (now - lastUpdateTime.current < 16) {
      return;
    }
    lastUpdateTime.current = now;

    const currentZone = calculateCurrentZone(scrollProgress, config);
    const activeProject = calculateActiveProject(scrollProgress, config);

    const zoneChanged = currentZone.zone !== lastZone.current;
    const projectChanged = activeProject.project !== lastProject.current;

      if (debugMode && zoneChanged) {
        console.log(`🗺️ Zone transition: ${lastZone.current} → ${currentZone.zone}`);
      }

      // FIXED: Only trigger animations on actual zone changes and when not already transitioning
      if (zoneChanged && !animationState.isTransitioning) {
        
        if (currentZone.zone === 'hero') {
          // Direct to hero - no animation needed since it's the start
          setAnimationState(prev => ({
            ...prev,
            state: ANIMATION_STATES.HERO,
            crystalForm: 'whole',
            cameraState: 'hero',
            focusedFacet: null,
            isTransitioning: false
          }));
        } 
        else if (currentZone.zone === 'overview') {
          if (lastZone.current === 'hero') {
            // FIXED: Hero to overview - trigger coordinated explosion
            startExplosionSequence();
          } else {
            // Coming from projects - just set overview state
            setAnimationState(prev => ({
              ...prev,
              state: ANIMATION_STATES.OVERVIEW,
              crystalForm: 'exploded',
              cameraState: 'overview',
              focusedFacet: null,
              isTransitioning: false
            }));
          }
        }
        else if (currentZone.zone === 'projects') {
          // Projects zone - exploded crystal, may have focused facet
          setAnimationState(prev => ({
            ...prev,
            state: ANIMATION_STATES.PROJECT_FOCUSED,
            crystalForm: 'exploded',
            cameraState: 'project',
            isTransitioning: false
          }));
        }
        else if (currentZone.zone === 'about') {
          // FIXED: About section - trigger coordinated reform
          if (animationState.crystalForm === 'exploded') {
            startReformSequence();
          } else {
            // Already reformed
            setAnimationState(prev => ({
              ...prev,
              state: ANIMATION_STATES.ABOUT,
              crystalForm: 'whole',
              cameraState: 'about',
              focusedFacet: null,
              isTransitioning: false
            }));
          }
        }

        lastZone.current = currentZone.zone;
      }

      // Handle project changes within projects zone
      if (currentZone.zone === 'projects' && projectChanged && activeProject.project) {
        if (debugMode) {
          console.log(`🎯 Project change: ${lastProject.current} → ${activeProject.project}`);
        }

        // Only trigger project focus if not already transitioning
        if (!animationState.isTransitioning) {
          startProjectFocusSequence(activeProject.project);
        } else {
          // Just update the focused facet if we're transitioning
          setAnimationState(prev => ({
            ...prev,
            focusedFacet: activeProject.project
          }));
        }

        lastProject.current = activeProject.project;
      } else if (currentZone.zone !== 'projects' && lastProject.current) {
        // Left projects zone
        setAnimationState(prev => ({
          ...prev,
          focusedFacet: null
        }));
        lastProject.current = null;
      }

      // Always update scroll progress and zone info
      setAnimationState(prev => ({
        ...prev,
        scrollProgress,
        zoneInfo: currentZone,
        projectInfo: activeProject
      }));

    // Call state change callback
    if (onStateChange) {
      onStateChange(animationState);
    }
  }, [
    config,
    debugMode,
    startExplosionSequence,
    startReformSequence,
    startProjectFocusSequence,
    onStateChange,
    animationState.isTransitioning,
    animationState.crystalForm
  ]);

  /**
   * FIXED: Get current camera configuration
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
      shouldRotate: animationState.crystalForm === 'whole' && 
                   animationState.state === ANIMATION_STATES.HERO,
      rotationSpeed: 0.0003
    };
  }, [animationState.crystalForm, animationState.state, config]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearAnimationSequence();
    };
  }, [clearAnimationSequence]);

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
      lastProject: lastProject.current,
      cameraState: animationState.cameraState,
      crystalForm: animationState.crystalForm
    } : null
  };
};