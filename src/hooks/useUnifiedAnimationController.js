// FIXED: src/hooks/useUnifiedAnimationController.js
// Simplified animation system with immediate state changes + enhanced debugging for background issues

import { useState, useEffect, useRef, useCallback } from 'react';
import { Vector3 } from 'three';

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
      description: 'Hero close view'
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

  projectSections: {
    empathy:    { start: 0.24,   end: 0.3433 },
    narrative:  { start: 0.3433, end: 0.4466 },
    craft:      { start: 0.4466, end: 0.5499 },
    system:     { start: 0.5499, end: 0.6533 },
    leadership: { start: 0.6533, end: 0.7566 },
    exploration:{ start: 0.7566, end: 0.875 }
  }
};

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
export const calculateCurrentZone = (scrollProgress, config = ANIMATION_CONFIG) => {
  const zones = config.scrollZones || {};

  // Guard against missing zone information to avoid runtime errors
  if (!zones.hero || !zones.overview || !zones.projects || !zones.about) {
    return {
      zone: 'hero',
      progress: scrollProgress,
      isEntering: false,
      isLeaving: false
    };
  }

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

export const calculateActiveProject = (scrollProgress, config = ANIMATION_CONFIG) => {
  if (scrollProgress < config.scrollZones.projects.start) {
    return { project: null, progress: 0 };
  }
  
  const projectSections = config.projectSections;
  
  for (const [projectKey, section] of Object.entries(projectSections)) {
    if (scrollProgress >= section.start && scrollProgress < section.end) {
      const progress = (scrollProgress - section.start) / (section.end - section.start);
      
      // ENHANCED: Debug logging for project detection and background updates
      if (import.meta.env.DEV && Math.random() < 0.1) {
        console.log(`🎯 Project detected: ${projectKey}, progress: ${progress.toFixed(3)}, scroll: ${scrollProgress.toFixed(3)}`);
      }
      
      return {
        project: projectKey,
        progress: Math.max(0, Math.min(progress, 1))
      };
    }
  }
  
  return { project: null, progress: 0 };
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

  // Dynamic configuration that updates based on measured DOM sections
  const [dynamicConfig, setDynamicConfig] = useState(config);

  useEffect(() => {
    const measureSections = () => {
      const container = document.querySelector('.scroll-container');
      if (!container) return;

      const sections = container.querySelectorAll('.scroll-section');
      const maxScroll = Math.max(container.scrollHeight - container.clientHeight, 1);

      setDynamicConfig(prev => {
        const zones = { ...prev.scrollZones };
        const projectSections = { ...prev.projectSections };

        sections.forEach((section) => {
          const start = section.offsetTop / maxScroll;
          const end = (section.offsetTop + section.offsetHeight) / maxScroll;
          const id = section.id;

          if (id === 'hero') {
            zones.hero = { start: 0, end };
          } else if (id === 'overview') {
            zones.overview = { start, end };
          } else if (id === 'about') {
            zones.about = { start, end: 1 };
          } else if (id.startsWith('project-')) {
            const key = id.replace('project-', '');
            projectSections[key] = { start, end };
          }
        });

        if (Object.keys(projectSections).length) {
          const starts = Object.values(projectSections).map(s => s.start);
          const ends = Object.values(projectSections).map(s => s.end);
          zones.projects = { start: Math.min(...starts), end: Math.max(...ends) };
        }

        return { ...prev, scrollZones: zones, projectSections };
      });
    };

    const timeout = setTimeout(measureSections, 1000);
    window.addEventListener('resize', measureSections);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', measureSections);
    };
  }, [config]);

  const [animationState, setAnimationState] = useState({
    state: ANIMATION_STATES.HERO,
    crystalForm: 'whole',
    cameraState: 'hero',
    focusedFacet: null,
    isTransitioning: false, // Will be managed by individual components
    scrollProgress: 0,
    zoneInfo: { zone: 'hero', progress: 0 },
    projectInfo: { project: null, progress: 0 }
  });

  // Simplified refs for tracking changes
  const lastZone = useRef('hero');
  const lastProject = useRef(null);
  const updateTimeout = useRef(null);

  /**
   * FIXED: Handle zone transitions with immediate state changes
   */
  const handleZoneTransition = useCallback((fromZone, toZone) => {
    if (debugMode) {
      if (import.meta.env.DEV) console.log(`🗺️ IMMEDIATE Zone transition: ${fromZone} → ${toZone}`);
    }

    // IMMEDIATE state changes - no complex sequences
    if (toZone === 'hero') {
      setAnimationState(prev => ({
        ...prev,
        state: ANIMATION_STATES.HERO,
        crystalForm: 'whole',        // Immediate
        cameraState: 'hero',         // Immediate
        focusedFacet: null,
        isTransitioning: false       // Let components handle their own transitions
      }));
    }
    else if (toZone === 'overview') {
      setAnimationState(prev => ({
        ...prev,
        state: ANIMATION_STATES.OVERVIEW,
        crystalForm: 'exploded',     // Immediate
        cameraState: 'overview',     // Immediate
        focusedFacet: null,
        isTransitioning: false
      }));
    }
    else if (toZone === 'projects') {
      // Don't set focusedFacet here - let the project handling logic do it
      setAnimationState(prev => ({
        ...prev,
        state: ANIMATION_STATES.PROJECT_FOCUSED,
        crystalForm: 'exploded',     // Immediate
        cameraState: 'project',      // Immediate - this enables project camera positioning
        isTransitioning: false
      }));
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
  }, [debugMode]);

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

  /**
   * FIXED: Main scroll update with hysteresis to prevent boundary flickering + enhanced debugging
   */
  const updateFromScrollProgress = useCallback((scrollProgress) => {
    const currentZone = calculateCurrentZone(scrollProgress, dynamicConfig);
    const activeProject = calculateActiveProject(scrollProgress, dynamicConfig);

    // DEBUG: Log potential mismatches between scroll and visible section
    if (debugMode || import.meta.env.DEV) {
      console.log('Animation State Update:', {
        scrollProgress: scrollProgress.toFixed(4),
        detectedZone: currentZone.zone,
        detectedProject: activeProject.project,
        timestamp: performance.now(),
        visibleSection: document.querySelector('.scroll-section[data-headline-color]')?.id || null
      });
    }
    
    // FIXED: Add hysteresis to prevent boundary flickering
    const zoneChanged = currentZone.zone !== lastZone.current;
    const projectChanged = activeProject.project !== lastProject.current;

    // Only change zones if we're clearly in the new zone (not at boundary)
    if (zoneChanged) {
      // Add hysteresis - require being well into the new zone before switching
      const hysteresis = 0.05; // 5% buffer zone
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
      } else if (currentZone.zone === 'projects' && currentZone.progress > hysteresis && currentZone.progress < (1 - hysteresis)) {
        shouldChangeZone = true;
      } else if (currentZone.zone === 'about' && currentZone.progress > hysteresis) {
        shouldChangeZone = true;
      }
      
      if (shouldChangeZone) {
        if (debugMode || import.meta.env.DEV) {
          console.log(`🗺️ Zone change confirmed: ${lastZone.current} → ${currentZone.zone} (progress: ${currentZone.progress.toFixed(3)})`);
          console.log(`🎨 Background trigger: Zone changed to "${currentZone.zone}"`);
        }
        handleZoneTransition(lastZone.current, currentZone.zone);
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
      if (projectChanged && activeProject.project) {
        // Reduce hysteresis for projects since they're working well
        const projectHysteresis = 0.1; // 10% into project section
        if (activeProject.progress > projectHysteresis) {
          if (import.meta.env.DEV) {
            console.log(`🎯 Project changed: ${lastProject.current} → ${activeProject.project}`);
            console.log(`🎨 Background trigger: Project changed to "${activeProject.project}"`);
          }
          handleProjectFocus(activeProject.project);
          lastProject.current = activeProject.project;
        }
      }
      
      // Set initial project if none is set but we have an active project
      if (!animationState.focusedFacet && activeProject.project && activeProject.progress > 0.05) {
        if (import.meta.env.DEV) {
          console.log(`🎯 Setting initial project: ${activeProject.project}`);
          console.log(`🎨 Background trigger: Initial project set to "${activeProject.project}"`);
        }
        handleProjectFocus(activeProject.project);
        lastProject.current = activeProject.project;
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
    dynamicConfig,
    handleZoneTransition,
    handleProjectFocus,
    onStateChange,
    animationState,
    debugMode
  ]);

  /**
   * Get current camera configuration (same as before)
   */
  const getCurrentCameraConfig = useCallback(() => {
    let cameraConfig;
    
    if (animationState.cameraState === 'project') {
      cameraConfig = animationState.focusedFacet
        ? dynamicConfig.camera.projects[animationState.focusedFacet]
        // When no facet is focused, default to overview camera instead of hero fallback
        : dynamicConfig.camera.overview;
    } else {
      cameraConfig = dynamicConfig.camera[animationState.cameraState] || dynamicConfig.camera.hero;
    }
    
    return cameraConfig;
  }, [animationState.cameraState, animationState.focusedFacet, animationState.state, dynamicConfig, debugMode]);

  /**
   * Get current crystal configuration (same as before)
   */
  const getCurrentCrystalConfig = useCallback(() => {
    return {
      form: animationState.crystalForm,
      positions: animationState.crystalForm === 'exploded' 
        ? dynamicConfig.crystal.explodedPositions
        : { center: dynamicConfig.crystal.wholePosition },
      shouldRotate: animationState.crystalForm === 'whole' && 
                   animationState.state === ANIMATION_STATES.HERO,
      rotationSpeed: 0.0003
    };
  }, [animationState.crystalForm, animationState.state, dynamicConfig]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
    };
  }, []);

  return {
    // Current state
    animationState,

    // Configuration
    config: dynamicConfig,
    
    // Update functions
    updateFromScrollProgress,
    
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