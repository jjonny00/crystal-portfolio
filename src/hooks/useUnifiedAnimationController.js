// FIXED: src/hooks/useUnifiedAnimationController.js
// Simplified animation system with immediate state changes + enhanced debugging for background issues

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Vector3, Quaternion, Euler } from 'three';
import { fracture as fractureConfig } from '../crystalConfig';
import { orderedFacetKeys, getFacetKeyByProjectId, getProjectById, getProjectIdByFacetKey } from '../data/projects';

// Percentage of explode distance facets travel during fracture
const FRACTURE_DISTANCE = fractureConfig.distance;

/**
 * SIMPLIFIED: Animation Configuration with immediate state changes
 */
export const ANIMATION_CONFIG = {
  // Camera positions for immediate transitions
  camera: {
    hero: {
      position: new Vector3(0, 3.2, 2.4),
      target: new Vector3(0, 0.5, 0),
      fov: 32,
      description: 'Hero close view',
      orbitSpeed: 0.0003
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
    explodedRotations: {
      empathy: new Quaternion(0, 0, 0, 1),
      narrative: new Quaternion(0, 0, 0, 1),
      craft: new Quaternion(0, 0, 0, 1),
      system: new Quaternion(0, 0, 0, 1),
      leadership: new Quaternion(0, 0, 0, 1),
      exploration: new Quaternion(0, 0, 0, 1)
    },
    wholePosition: new Vector3(0, 0, 0),
    explosionEase: (t) => 1 - Math.pow(1 - t, 3) // starts fast, smooth stop
  },

  // SIMPLIFIED: No complex timing - just smooth transition speeds
  timing: {
    smoothTransition: 50, // Debounce rapid changes
  },

  scrollZones: {
    hero: { start: 0, end: 0.12 },
    overview: { start: 0.12, end: 0.24 },
    projects: { start: 0.24, end: 0.875 },
    about: { start: 0.875, end: 1.0 }
  },

  projectSections: {}
};

const projectsZone = ANIMATION_CONFIG.scrollZones.projects;
const sectionCount = Math.max(orderedFacetKeys.length, 1);
const projectSectionSpan = (projectsZone.end - projectsZone.start) / sectionCount;

ANIMATION_CONFIG.projectSections = orderedFacetKeys.reduce((acc, facetKey, index) => {
  const start = projectsZone.start + projectSectionSpan * index;
  const end = index === orderedFacetKeys.length - 1
    ? projectsZone.end
    : start + projectSectionSpan;

  acc[facetKey] = {
    start,
    end
  };

  return acc;
}, {});

ANIMATION_CONFIG.projectSectionsById = orderedFacetKeys.reduce((acc, facetKey) => {
  const projectId = getProjectIdByFacetKey(facetKey);
  if (projectId) {
    acc[projectId] = ANIMATION_CONFIG.projectSections[facetKey];
  }
  return acc;
}, {});

// Derive fracture positions based on percentage of explode distance
ANIMATION_CONFIG.crystal.fracturePositions = Object.fromEntries(
  Object.entries(ANIMATION_CONFIG.crystal.explodedPositions).map(([key, vec]) => {
    const direction = vec.clone().normalize();
    const distance = vec.length() * FRACTURE_DISTANCE;
    return [key, direction.multiplyScalar(distance)];
  })
);
// Expose the distance so components can consistently compute fallback positions
ANIMATION_CONFIG.crystal.fractureDistance = FRACTURE_DISTANCE;
// How long to hold the facets at their fractured positions (seconds)
ANIMATION_CONFIG.crystal.fracturePause = fractureConfig.duration;
// Total time for fracture + explosion (seconds). Matches previous explode duration
// Total time for fracture + explosion (seconds). Matches original explode timing
ANIMATION_CONFIG.crystal.explodeDuration = 1.6;

// SIMPLIFIED: Only essential states (no intermediate transition states)
const ANIMATION_STATES = {
  HERO: 'hero',
  OVERVIEW: 'overview',
  PROJECT_FOCUSED: 'project_focused',
  ABOUT: 'about'
};

/**
 * FIXED: Zone calculation with hysteresis to prevent boundary flickering
 */
const calculateCurrentZone = (scrollProgress, config = ANIMATION_CONFIG) => {
  const zones = config.scrollZones;
  
  // Use more precise boundaries to prevent flickering
  if (scrollProgress <= zones.hero.end) {
    return {
      zone: 'hero',
      progress: scrollProgress / zones.hero.end,
      isEntering: false,
      isLeaving: scrollProgress > zones.hero.end * 0.85
    };
  }
  
  if (scrollProgress <= zones.overview.end) {
    const progress = (scrollProgress - zones.overview.start) / (zones.overview.end - zones.overview.start);
    return {
      zone: 'overview',
      progress: Math.max(0, Math.min(progress, 1)),
      isEntering: scrollProgress < zones.overview.start + 0.015,
      isLeaving: scrollProgress > zones.overview.end - 0.015
    };
  }
  
  if (scrollProgress <= zones.projects.end) {
    const progress = (scrollProgress - zones.projects.start) / (zones.projects.end - zones.projects.start);
    return {
      zone: 'projects',
      progress: Math.max(0, Math.min(progress, 1)),
      isEntering: scrollProgress < zones.projects.start + 0.015,
      isLeaving: scrollProgress > zones.projects.end - 0.015
    };
  }
  
  const progress = (scrollProgress - zones.about.start) / (zones.about.end - zones.about.start);
  return {
    zone: 'about',
    progress: Math.max(0, Math.min(progress, 1)),
    isEntering: scrollProgress < zones.about.start + 0.015,
    isLeaving: false
  };
};

const calculateActiveProject = (scrollProgress, config = ANIMATION_CONFIG) => {
  if (scrollProgress < config.scrollZones.projects.start) {
    return { projectId: null, facetKey: null, progress: 0 };
  }

  const projectSectionsById = config.projectSectionsById || {};

  for (const [projectId, section] of Object.entries(projectSectionsById)) {
    if (scrollProgress >= section.start && scrollProgress < section.end) {
      const progress = (scrollProgress - section.start) / (section.end - section.start);
      const facetKey = getFacetKeyByProjectId(projectId);

      if (!facetKey) continue;

      return {
        projectId,
        facetKey,
        progress: Math.max(0, Math.min(progress, 1))
      };
    }
  }

  return { projectId: null, facetKey: null, progress: 0 };
};

/**
 * SIMPLIFIED: Main controller with immediate state changes + enhanced debugging
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
    isTransitioning: false, // Will be managed by individual components
    scrollProgress: 0,
    zoneInfo: { zone: 'hero', progress: 0 },
    projectInfo: { projectId: null, facetKey: null, progress: 0 },
    cameraSettled: false
  });

  // Simplified refs for tracking changes
  const lastZone = useRef('hero');
  const lastProject = useRef(null);
  const updateTimeout = useRef(null);
  const cameraDelayTimeout = useRef(null);

  const toQuaternionArray = useCallback((rotation) => {
    if (Array.isArray(rotation)) return rotation;
    if (rotation instanceof Quaternion) return rotation.toArray();
    return [0, 0, 0, 1];
  }, []);

  const explodedRotations = useMemo(() => {
    const eulerRotations = config?.facetRotationsEulerDeg;
    return orderedFacetKeys.reduce((acc, facetKey) => {
      const eulerDeg = eulerRotations?.[facetKey];
      if (Array.isArray(eulerDeg)) {
        const [x = 0, y = 0, z = 0] = eulerDeg;
        const euler = new Euler(
          x * (Math.PI / 180),
          y * (Math.PI / 180),
          z * (Math.PI / 180),
          'XYZ'
        );
        acc[facetKey] = new Quaternion().setFromEuler(euler).toArray();
      } else {
        acc[facetKey] = toQuaternionArray(config?.crystal?.explodedRotations?.[facetKey]);
      }
      return acc;
    }, {});
  }, [config, toQuaternionArray]);

  /**
   * FIXED: Handle zone transitions with immediate state changes
   */
  const handleZoneTransition = useCallback((fromZone, toZone, initialProject = null) => {
    if (debugMode) {
      if (import.meta.env.DEV) console.log(`🗺️ IMMEDIATE Zone transition: ${fromZone} → ${toZone}`);
    }

    // Clear any pending delayed camera transitions when switching zones
    if (cameraDelayTimeout.current) {
      clearTimeout(cameraDelayTimeout.current);
      cameraDelayTimeout.current = null;
    }

    // IMMEDIATE state changes - no complex sequences
    if (toZone === 'hero') {
      // Reform crystal immediately but keep camera at overview until fracture pause completes
      setAnimationState(prev => ({
        ...prev,
        state: ANIMATION_STATES.HERO,
        crystalForm: 'whole',
        cameraState: 'overview', // Hold camera during reform pause
        focusedFacet: null,
        isTransitioning: false
      }));

      cameraDelayTimeout.current = setTimeout(() => {
        setAnimationState(prev => ({
          ...prev,
          cameraState: 'hero'
        }));
      }, (config.crystal.fracturePause || 0.5) * 1000);
    }
    else if (toZone === 'overview') {
      // Start explosion immediately but delay camera move until fracture pause completes
      setAnimationState(prev => ({
        ...prev,
        state: ANIMATION_STATES.OVERVIEW,
        crystalForm: 'exploded',     // Immediate
        cameraState: 'hero',         // Hold camera during fracture pause
        focusedFacet: null,
        isTransitioning: false
      }));

      cameraDelayTimeout.current = setTimeout(() => {
        setAnimationState(prev => ({
          ...prev,
          cameraState: 'overview'
        }));
      }, (config.crystal.fracturePause || 0.5) * 1000);
    }
    else if (toZone === 'projects') {
      // Immediately enter project state and set initial facet
      setAnimationState(prev => ({
        ...prev,
        state: ANIMATION_STATES.PROJECT_FOCUSED,
        crystalForm: 'exploded',     // Immediate
        cameraState: 'project',      // Immediate - this enables project camera positioning
        focusedFacet: initialProject,
        isTransitioning: false
      }));
      lastProject.current = initialProject;
    }
    else if (toZone === 'about') {
      setAnimationState(prev => ({
        ...prev,
        state: ANIMATION_STATES.ABOUT,
        crystalForm: 'whole',        // Immediate
        cameraState: 'about',        // Immediate
        focusedFacet: null,
        isTransitioning: false
      }));
    }
  }, [debugMode, config]);

  /**
   * SIMPLIFIED: Handle project focus (same pattern as before - it works!)
   */
  const handleProjectFocus = useCallback((projectKey) => {
    if (debugMode) {
      if (import.meta.env.DEV) console.log('🎯 IMMEDIATE Project focus:', projectKey);
    }

    // ENHANCED: Log when project focus changes for background debugging
    if (import.meta.env.DEV) {
      console.log(`🎨 Background trigger: Project focus changed to "${projectKey}"`);
    }

    // Immediate state change - same pattern as working projects
    setAnimationState(prev => ({
      ...prev,
      focusedFacet: projectKey,
      cameraState: 'project',  // This triggers camera to move to projects[projectKey]
      isTransitioning: false   // Let camera component handle smooth transition
    }));
  }, [debugMode]);



  const selectProjectFocusById = useCallback((projectId) => {
    const project = getProjectById(projectId);
    if (!project) {
      return false;
    }

    const facetKey = project.facetKey;

    if (lastZone.current !== 'projects') {
      handleZoneTransition(lastZone.current, 'projects', facetKey);
      lastZone.current = 'projects';
    } else {
      handleProjectFocus(facetKey);
    }

    lastProject.current = facetKey;
    setAnimationState((prev) => ({
      ...prev,
      state: ANIMATION_STATES.PROJECT_FOCUSED,
      crystalForm: 'exploded',
      cameraState: 'project',
      focusedFacet: facetKey,
      zoneInfo: {
        ...(prev.zoneInfo || {}),
        zone: 'projects'
      },
      projectInfo: {
        projectId,
        facetKey,
        progress: 0
      },
      isTransitioning: false
    }));

    return true;
  }, [handleProjectFocus, handleZoneTransition]);
  /**
   * FIXED: Main scroll update with hysteresis to prevent boundary flickering + enhanced debugging
   */
  const updateFromScrollProgress = useCallback((scrollProgress) => {
    const currentZone = calculateCurrentZone(scrollProgress, config);
    const activeProject = calculateActiveProject(scrollProgress, config);
    
    // ENHANCED: Log scroll updates for background debugging
    if (import.meta.env.DEV && Math.random() < 0.05) { // Sample 5% of updates
      console.log('🔄 Animation state update:', {
        scrollProgress: scrollProgress.toFixed(3),
        currentZone: currentZone.zone,
        zoneProgress: currentZone.progress.toFixed(3),
        activeProject: activeProject.projectId,
        projectProgress: activeProject.progress.toFixed(3),
        lastZone: lastZone.current,
        lastProject: lastProject.current
      });
    }
    
    // FIXED: Add hysteresis to prevent boundary flickering
    const zoneChanged = currentZone.zone !== lastZone.current;
    const projectChanged = activeProject.facetKey !== lastProject.current;

    // Only change zones if we're clearly in the new zone (not at boundary)
    if (zoneChanged) {
      // Add hysteresis - require being well into the new zone before switching
      const hysteresis = 0.02; // 2% buffer zone for most zones
      const projectsZoneHysteresis = 0; // Immediate transition at projects start
      let shouldChangeZone = false;

      if (currentZone.zone === 'hero' && currentZone.progress > hysteresis) {
        shouldChangeZone = true;
      } else if (currentZone.zone === 'overview') {
        if (currentZone.progress > hysteresis && currentZone.progress < (1 - hysteresis)) {
          shouldChangeZone = true;
        } else if (lastZone.current === 'projects' && currentZone.progress >= (1 - hysteresis)) {
          // Coming from projects and we're right at the boundary—still transition
          shouldChangeZone = true;
        }
      } else if (currentZone.zone === 'projects' && currentZone.progress >= projectsZoneHysteresis && currentZone.progress < (1 - projectsZoneHysteresis)) {
        shouldChangeZone = true;
      } else if (currentZone.zone === 'about' && currentZone.progress > hysteresis) {
        shouldChangeZone = true;
      }

      if (shouldChangeZone) {
        if (currentZone.zone === 'projects') {
          const fallbackProject = orderedFacetKeys[0] || null;
          const initialProject = calculateActiveProject(scrollProgress, config).facetKey || fallbackProject;
          if (debugMode || import.meta.env.DEV) {
            console.log(`🗺️ Zone change confirmed: ${lastZone.current} → ${currentZone.zone} (progress: ${currentZone.progress.toFixed(3)})`);
            console.log(`🧭 Projects zone transition at scroll ${scrollProgress.toFixed(3)} initialProject=${initialProject}`);
            console.log(`🎨 Background trigger: Zone changed to "${currentZone.zone}"`);
          }
          handleZoneTransition(lastZone.current, currentZone.zone, initialProject);
        } else {
          if (debugMode || import.meta.env.DEV) {
            console.log(`🗺️ Zone change confirmed: ${lastZone.current} → ${currentZone.zone} (progress: ${currentZone.progress.toFixed(3)})`);
            console.log(`🎨 Background trigger: Zone changed to "${currentZone.zone}"`);
          }
          handleZoneTransition(lastZone.current, currentZone.zone);
        }
        lastZone.current = currentZone.zone;
      }
    }

    // FIXED: Handle project changes within projects zone
    if (currentZone.zone === 'projects') {
      // First, ensure we're in project state when entering projects zone
      if (animationState.state !== ANIMATION_STATES.PROJECT_FOCUSED) {
        if (debugMode || import.meta.env.DEV) {
          console.log('🎯 Entering projects zone - setting project state');
          console.log('🎨 Background trigger: Entering projects zone');
        }
        setAnimationState(prev => ({
          ...prev,
          state: ANIMATION_STATES.PROJECT_FOCUSED,
          crystalForm: 'exploded',
          cameraState: 'project',
          isTransitioning: false
        }));
      }
      
      // Then handle project focus changes
      if (projectChanged && activeProject.facetKey) {
        // Reduce hysteresis for projects since they're working well
        const projectHysteresis = 0.05; // 5% into project section
        if (activeProject.progress > projectHysteresis) {
          if (import.meta.env.DEV) {
            console.log(`🎯 Project changed: ${lastProject.current} → ${activeProject.facetKey}`);
            console.log(`🎨 Background trigger: Project changed to "${activeProject.facetKey}"`);
          }
          handleProjectFocus(activeProject.facetKey);
          lastProject.current = activeProject.facetKey;
        }
      }
      
      // Set initial project if none is set but we have an active project
      if (!animationState.focusedFacet && activeProject.facetKey && activeProject.progress > 0.05) {
        if (import.meta.env.DEV) {
          console.log(`🎯 Setting initial project: ${activeProject.facetKey}`);
          console.log(`🎨 Background trigger: Initial project set to "${activeProject.facetKey}"`);
        }
        handleProjectFocus(activeProject.facetKey);
        lastProject.current = activeProject.facetKey;
      }
    } else if (currentZone.zone !== 'projects' && lastProject.current) {
      if (import.meta.env.DEV) {
        console.log('🎯 Clearing project focus - left projects zone');
        console.log('🎨 Background trigger: Left projects zone, clearing project focus');
      }
      setAnimationState(prev => ({
        ...prev,
        focusedFacet: null,
        // Ensure camera snaps back to the proper zone camera instead of hero fallback
        cameraState: currentZone.zone
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
    handleProjectFocus,
    onStateChange,
    animationState,
    debugMode
  ]);

  /**
   * Track when the camera has fully reached its target
   */
  const setCameraSettled = useCallback((value) => {
    setAnimationState(prev => ({ ...prev, cameraSettled: value }));
  }, []);

  /**
   * Get current camera configuration (same as before)
   */
  const getCurrentCameraConfig = useCallback(() => {
    let cameraConfig;
    
    if (animationState.cameraState === 'project') {
      cameraConfig = animationState.focusedFacet
        ? config.camera.projects[animationState.focusedFacet]
        // When no facet is focused, default to overview camera instead of hero fallback
        : config.camera.overview;
    } else {
      cameraConfig = config.camera[animationState.cameraState] || config.camera.hero;
    }
    
    return cameraConfig;
  }, [animationState.cameraState, animationState.focusedFacet, animationState.state, config, debugMode]);

  /**
   * Get current crystal configuration (same as before)
   */
  const getCurrentCrystalConfig = useCallback(() => {
    return {
      form: animationState.crystalForm,
      positions: animationState.crystalForm === 'exploded'
        ? config.crystal.explodedPositions
        : { center: config.crystal.wholePosition },
      fracturePositions: config.crystal.fracturePositions,
      fractureDistance: config.crystal.fractureDistance,
      fracturePause: config.crystal.fracturePause,
      explodeDuration: config.crystal.explodeDuration,
      explosionEase: config.crystal.explosionEase,
      explodedRotations,
      rotations: explodedRotations
    };
  }, [animationState.crystalForm, animationState.state, config, explodedRotations]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
      if (cameraDelayTimeout.current) {
         clearTimeout(cameraDelayTimeout.current);
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
    selectProjectFocusById,
    setCameraSettled,
    
    // Current configs for 3D components
    cameraConfig: getCurrentCameraConfig(),
    crystalConfig: getCurrentCrystalConfig(),
    
    // Debug info
    debugInfo: debugMode ? {
      currentState: animationState.state,
      isTransitioning: animationState.isTransitioning,
      lastZone: lastZone.current,
      lastProject: lastProject.current,
      cameraState: animationState.cameraState,
      crystalForm: animationState.crystalForm
    } : null
  };
};
