// FIXED: src/hooks/useUnifiedAnimationController.js
// Coordinated animation system with proper timing synchronization

import { useState, useEffect, useRef, useCallback } from 'react';
import { Vector3 } from 'three';

/**
 * FIXED: Animation Configuration with synchronized timing
 */
export const ANIMATION_CONFIG = {
  // FIXED: Coordinated camera positions
  camera: {
    hero: {
      position: new Vector3(0, 3.2, 2.4),
      target: new Vector3(0, 0.5, 0),
      fov: 32,
      description: 'Hero close view'
    },
    preExplosion: {
      position: new Vector3(0, 2.8, 3.8),
      target: new Vector3(0, 0.4, 0),
      fov: 38,
      description: 'Moving toward explosion view'
    },
    overview: {
      position: new Vector3(0, 2.5, 6.2),
      target: new Vector3(0, 0.3, 0),
      fov: 44,
      description: 'Overview with exploded crystal'
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

  // FIXED: Synchronized timing that prevents state/animation conflicts
  timing: {
    // Explosion sequence timing
    explosionPrepare: 400,
    explosionDuration: 1200,
    explosionSettle: 300,
    totalExplosionTime: 1900, // Total time for complete explosion sequence
    
    // FIXED: Reform sequence timing - based on camera movement time, not crystal time
    reformPrepare: 500,
    reformCrystalDuration: 1000,     // Time for crystal to reform (visual only)
    reformCameraDuration: 1800,      // Time for camera to fully reach target and stop
    reformTotalDuration: 2800,       // Total time to wait before changing state (camera time + buffer)
    
    // Project transitions
    projectFocus: 1200,
    projectSwitch: 800,
    
    // Animation coordination
    throttleMs: 30,
    stateChangeDelay: 100, // Delay between rapid state changes
  },

  scrollZones: {
    hero: { start: 0, end: 0.12 },
    overview: { start: 0.12, end: 0.24 },
    projects: { start: 0.24, end: 0.875 },
    about: { start: 0.875, end: 1.0 }
  },

  projectSections: {
    empathy:    { start: 0.24,   end: 0.3433 },
    narrative:  { start: 0.3433, end: 0.4466 },
    craft:      { start: 0.4466, end: 0.5499 },
    system:     { start: 0.5499, end: 0.6533 },
    leadership: { start: 0.6533, end: 0.7566 },
    exploration:{ start: 0.7566, end: 0.875 }
  }
};

// FIXED: Simplified animation states
const ANIMATION_STATES = {
  HERO: 'hero',
  EXPLODING: 'exploding',          // Single explosion state
  OVERVIEW: 'overview',
  FOCUSING_PROJECT: 'focusing_project',
  PROJECT_FOCUSED: 'project_focused',
  REFORMING: 'reforming',          // Single reform state
  ABOUT: 'about'
};

/**
 * FIXED: Zone calculation with better boundary handling
 */
const calculateCurrentZone = (scrollProgress, config = ANIMATION_CONFIG) => {
  const zones = config.scrollZones;
  
  // FIXED: Use precise boundary checking without overlap
  if (scrollProgress < zones.overview.start) {
    return {
      zone: 'hero',
      progress: scrollProgress / zones.hero.end,
      isEntering: false,
      isLeaving: scrollProgress > zones.hero.end * 0.8
    };
  }
  
  if (scrollProgress < zones.projects.start) {
    const progress = (scrollProgress - zones.overview.start) / (zones.overview.end - zones.overview.start);
    return {
      zone: 'overview',
      progress: Math.max(0, Math.min(progress, 1)),
      isEntering: scrollProgress < zones.overview.start + 0.01,
      isLeaving: scrollProgress > zones.overview.end - 0.01
    };
  }
  
  if (scrollProgress < zones.about.start) {
    const progress = (scrollProgress - zones.projects.start) / (zones.projects.end - zones.projects.start);
    return {
      zone: 'projects',
      progress: Math.max(0, Math.min(progress, 1)),
      isEntering: scrollProgress < zones.projects.start + 0.01,
      isLeaving: scrollProgress > zones.projects.end - 0.01
    };
  }
  
  const progress = (scrollProgress - zones.about.start) / (zones.about.end - zones.about.start);
  return {
    zone: 'about',
    progress: Math.max(0, Math.min(progress, 1)),
    isEntering: scrollProgress < zones.about.start + 0.01,
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
 * FIXED: Main controller with proper animation-state synchronization
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

  // FIXED: Better sequence tracking
  const animationSequence = useRef(null);
  const sequenceStartTime = useRef(null);
  const lastZone = useRef('hero');
  const lastProject = useRef(null);
  const isSequenceRunning = useRef(false);
  const pendingZoneChange = useRef(null);

  /**
   * FIXED: Clear animation sequence safely
   */
  const clearAnimationSequence = useCallback(() => {
    if (animationSequence.current) {
      clearTimeout(animationSequence.current);
      animationSequence.current = null;
    }
    isSequenceRunning.current = false;
    sequenceStartTime.current = null;
    pendingZoneChange.current = null;
  }, []);

  /**
   * FIXED: Start explosion sequence with proper coordination
   */
  const startExplosionSequence = useCallback(() => {
    if (isSequenceRunning.current) {
      if (debugMode) console.log('🚫 Explosion sequence blocked - animation in progress');
      return;
    }

    clearAnimationSequence();
    isSequenceRunning.current = true;
    sequenceStartTime.current = Date.now();
    
    if (debugMode) {
      console.log('🎬 Starting explosion sequence');
    }

    // Single explosion state that handles the entire sequence
    setAnimationState(prev => ({
      ...prev,
      state: ANIMATION_STATES.EXPLODING,
      crystalForm: 'exploded',
      cameraState: 'overview',
      isTransitioning: true
    }));

    // Wait for the complete explosion sequence to finish
    animationSequence.current = setTimeout(() => {
      setAnimationState(prev => ({
        ...prev,
        state: ANIMATION_STATES.OVERVIEW,
        isTransitioning: false
      }));
      
      clearAnimationSequence();
      
      if (debugMode) {
        console.log('✅ Explosion sequence complete');
      }
    }, config.timing.totalExplosionTime);
  }, [clearAnimationSequence, config, debugMode]);

  /**
   * FIXED: Start reform sequence with synchronized timing
   */
  const startReformSequence = useCallback(() => {
    if (isSequenceRunning.current) {
      if (debugMode) console.log('🚫 Reform sequence blocked - animation in progress');
      return;
    }

    clearAnimationSequence();
    isSequenceRunning.current = true;
    sequenceStartTime.current = Date.now();
    
    if (debugMode) {
      console.log('🎬 Starting reform sequence');
    }

    // FIXED: Single reform state that coordinates both crystal and camera
    setAnimationState(prev => ({
      ...prev,
      state: ANIMATION_STATES.REFORMING,
      crystalForm: 'whole',      // Crystal reforms immediately
      cameraState: 'about',      // Camera moves to ABOUT position (not hero!)
      focusedFacet: null,
      isTransitioning: true
    }));

    // FIXED: Wait for the complete reform sequence (both crystal and camera)
    animationSequence.current = setTimeout(() => {
      setAnimationState(prev => ({
        ...prev,
        state: ANIMATION_STATES.ABOUT,
        cameraState: 'about',    // EXPLICITLY set cameraState to match
        isTransitioning: false
      }));
      
      clearAnimationSequence();
      
      if (debugMode) {
        console.log('✅ Reform sequence complete');
      }
    }, config.timing.reformTotalDuration);
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
   * FIXED: Handle zone transitions with animation awareness
   */
  const handleZoneTransition = useCallback((fromZone, toZone, currentState) => {
    // If animation is running, queue the zone change
    if (isSequenceRunning.current) {
      pendingZoneChange.current = { fromZone, toZone };
      if (debugMode) {
        console.log(`🔄 Zone change queued: ${fromZone} → ${toZone} (animation in progress)`);
      }
      return;
    }

    if (debugMode) {
      console.log(`🗺️ Zone transition: ${fromZone} → ${toZone}`);
    }

    if (toZone === 'hero') {
      // FIXED: Always trigger reform when returning to hero (if coming from exploded state)
      if (currentState.crystalForm === 'exploded') {
        // This is the reform to hero case - camera should go to HERO position
        setAnimationState(prev => ({
          ...prev,
          state: ANIMATION_STATES.REFORMING,
          crystalForm: 'whole',
          cameraState: 'hero',      // Go to HERO position when reforming to hero
          focusedFacet: null,
          isTransitioning: true
        }));

        isSequenceRunning.current = true;
        animationSequence.current = setTimeout(() => {
          setAnimationState(prev => ({
            ...prev,
            state: ANIMATION_STATES.HERO,
            cameraState: 'hero',    // EXPLICITLY set cameraState to match
            isTransitioning: false
          }));
          clearAnimationSequence();
        }, config.timing.reformTotalDuration);
      } else {
        // Already whole crystal
        setAnimationState(prev => ({
          ...prev,
          state: ANIMATION_STATES.HERO,
          crystalForm: 'whole',
          cameraState: 'hero',
          focusedFacet: null,
          isTransitioning: false
        }));
      }
    }
    else if (toZone === 'overview') {
      if (fromZone === 'hero') {
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
    else if (toZone === 'projects') {
      setAnimationState(prev => ({
        ...prev,
        state: ANIMATION_STATES.PROJECT_FOCUSED,
        crystalForm: 'exploded',
        cameraState: 'project',
        isTransitioning: false
      }));
    }
    else if (toZone === 'about') {
      // FIXED: Always trigger reform sequence when entering about
      startReformSequence();
    }
  }, [config, debugMode, startExplosionSequence, startReformSequence]);

  /**
   * FIXED: Process pending zone changes when animations complete
   */
  useEffect(() => {
    if (!isSequenceRunning.current && pendingZoneChange.current) {
      const { fromZone, toZone } = pendingZoneChange.current;
      pendingZoneChange.current = null;
      
      if (debugMode) {
        console.log(`🔄 Processing queued zone change: ${fromZone} → ${toZone}`);
      }
      
      handleZoneTransition(fromZone, toZone, animationState);
    }
  }, [isSequenceRunning.current, handleZoneTransition, animationState, debugMode]);

  /**
   * FIXED: Main scroll update with better coordination
   */
  const updateFromScrollProgress = useCallback((scrollProgress) => {
    const currentZone = calculateCurrentZone(scrollProgress, config);
    const activeProject = calculateActiveProject(scrollProgress, config);
    
    const zoneChanged = currentZone.zone !== lastZone.current;
    const projectChanged = activeProject.project !== lastProject.current;

    // Handle zone changes
    if (zoneChanged) {
      handleZoneTransition(lastZone.current, currentZone.zone, animationState);
      lastZone.current = currentZone.zone;
    }

    // Handle project changes within projects zone
    if (currentZone.zone === 'projects' && projectChanged && activeProject.project) {
      if (!animationState.isTransitioning) {
        startProjectFocusSequence(activeProject.project);
      } else {
        setAnimationState(prev => ({
          ...prev,
          focusedFacet: activeProject.project
        }));
      }
      lastProject.current = activeProject.project;
    } else if (currentZone.zone !== 'projects' && lastProject.current) {
      setAnimationState(prev => ({
        ...prev,
        focusedFacet: null
      }));
      lastProject.current = null;
    }

    // Always update scroll progress and zone info
    setAnimationState(prev => ({
      ...prev,
      scrollProgress: scrollProgress,
      zoneInfo: currentZone,
      projectInfo: activeProject
    }));

    if (onStateChange) {
      onStateChange(animationState);
    }
  }, [
    config, 
    handleZoneTransition,
    startProjectFocusSequence,
    onStateChange,
    animationState
  ]);

  /**
   * Get current camera configuration
   */
  const getCurrentCameraConfig = useCallback(() => {
    let cameraConfig;
    
    if (animationState.cameraState === 'project' && animationState.focusedFacet) {
      cameraConfig = config.camera.projects[animationState.focusedFacet];
    } else {
      cameraConfig = config.camera[animationState.cameraState] || config.camera.hero;
    }
    
    // Debug logging to catch camera position changes
    if (process.env.NODE_ENV === 'development' && cameraConfig) {
      console.log(`📹 Camera config for state "${animationState.state}" cameraState "${animationState.cameraState}":`, {
        position: cameraConfig.position?.toArray(),
        target: cameraConfig.target?.toArray(),
        fov: cameraConfig.fov
      });
    }
    
    return cameraConfig;
  }, [animationState.cameraState, animationState.focusedFacet, animationState.state, config]);

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
      hasActiveSequence: isSequenceRunning.current,
      lastZone: lastZone.current,
      lastProject: lastProject.current,
      cameraState: animationState.cameraState,
      crystalForm: animationState.crystalForm,
      sequenceRunTime: sequenceStartTime.current ? Date.now() - sequenceStartTime.current : 0,
      pendingZoneChange: pendingZoneChange.current
    } : null
  };
};