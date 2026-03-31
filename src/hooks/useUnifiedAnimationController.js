// FIXED: src/hooks/useUnifiedAnimationController.js
// Simplified animation system with immediate state changes + enhanced debugging for background issues

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Vector3, Quaternion, Euler } from 'three';
import { fracture as fractureConfig } from '../crystalConfig';
import { orderedProjectKeys, getSceneFacetKeyByProjectId } from '../data/projects';

// Percentage of explode distance facets travel during fracture
const FRACTURE_DISTANCE = fractureConfig.distance;

/**
 * SIMPLIFIED: Animation Configuration with immediate state changes
 */
export const ANIMATION_CONFIG = {
  // Camera positions for immediate transitions
  camera: {
    intro: {
      position: new Vector3(0.16359952088021784, -2.0376618037026195, 1.1719674768510127),
      target: new Vector3(0.6, -2.9, 0),
      fov: 32,
      description: 'Intro dramatic close view',
      orbitSpeed: 0.0003
    },
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
const sectionCount = Math.max(orderedProjectKeys.length, 1);
const projectSectionSpan = (projectsZone.end - projectsZone.start) / sectionCount;

ANIMATION_CONFIG.projectSections = orderedProjectKeys.reduce((acc, projectKey, index) => {
  const start = projectsZone.start + projectSectionSpan * index;
  const end = index === orderedProjectKeys.length - 1
    ? projectsZone.end
    : start + projectSectionSpan;

  acc[projectKey] = {
    start,
    end
  };

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

const PROJECT_BOUNDARY_EPSILON = 0.0005;

const calculateActiveProjectFromSections = (scrollProgress, sections) => {
  if (!sections || sections.length === 0) {
    return { project: null, progress: 0 };
  }

  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    const isLastSection = index === sections.length - 1;
    const withinStart = scrollProgress >= (section.start - PROJECT_BOUNDARY_EPSILON);
    const withinEnd = isLastSection
      ? scrollProgress <= (section.end + PROJECT_BOUNDARY_EPSILON)
      : scrollProgress < (section.end + PROJECT_BOUNDARY_EPSILON);

    if (withinStart && withinEnd) {
      const span = Math.max(section.end - section.start, 0.00001);
      const progress = (scrollProgress - section.start) / span;
      return {
        project: section.project,
        progress: Math.max(0, Math.min(progress, 1))
      };
    }
  }

  return { project: null, progress: 0 };
};

const calculateActiveProjectFromTriggerPx = (triggerPx, sections) => {
  if (!Number.isFinite(triggerPx) || !sections || sections.length === 0) {
    return { project: null, progress: 0 };
  }

  for (const section of sections) {
    const startPx = section.startPx ?? 0;
    const endPx = section.endPx ?? startPx + 1;
    const withinStart = triggerPx >= (startPx - 1);
    const withinEnd = triggerPx < (endPx + 1);

    if (withinStart && withinEnd) {
      const span = Math.max(endPx - startPx, 1);
      const progress = (triggerPx - startPx) / span;
      return {
        project: section.project,
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
    onStateChange = null,
    introReplayToken = 0
  } = options;

  const [animationState, setAnimationState] = useState({
    state: ANIMATION_STATES.HERO,
    crystalForm: 'whole',
    cameraState: 'hero',
    focusedFacet: null,
    isTransitioning: false, // Will be managed by individual components
    scrollProgress: 0,
    zoneInfo: { zone: 'hero', progress: 0 },
    projectInfo: { project: null, progress: 0 },
    cameraSettled: false,
    cameraMoveProgress: 1
  });

  // Simplified refs for tracking changes
  const lastZone = useRef('hero');
  const lastProject = useRef(null);
  const updateTimeout = useRef(null);
  const cameraDelayTimeout = useRef(null);
  const introPreviewTimeout = useRef(null);
  const introPreviewActiveRef = useRef(false);
  const directProjectOverrideRef = useRef(null);
  const directZoneOverrideRef = useRef(null);
  const directProjectReleaseTimeoutRef = useRef(null);
  const runtimeProjectSectionsRef = useRef([]);

  const getRuntimeProjectSection = useCallback((projectKey) => {
    if (!projectKey) return null;
    return runtimeProjectSectionsRef.current.find((section) => section.project === projectKey) || null;
  }, []);

  const getProjectSectionStart = useCallback((projectKey) => {
    const runtimeSection = getRuntimeProjectSection(projectKey);
    if (runtimeSection) {
      return runtimeSection.start;
    }

    const fallbackSection = config?.projectSections?.[projectKey];
    return fallbackSection?.start ?? null;
  }, [config, getRuntimeProjectSection]);

  const measureProjectSectionsFromDom = useCallback(() => {
    if (typeof document === 'undefined') return;

    const container = document.querySelector('.scroll-container');
    if (!container) return;

    const maxScroll = Math.max(container.scrollHeight - container.clientHeight, 1);
    const projectNodes = Array.from(
      container.querySelectorAll(':scope > div > section.scroll-section.project[id^="project-"]')
    );
    const aboutNode = container.querySelector(':scope > div > section#about.scroll-section');

    if (projectNodes.length === 0) return;

    const projectStarts = projectNodes
      .map((node) => {
        const id = node.id || '';
        const project = id.startsWith('project-') ? id.slice('project-'.length) : null;
        if (!project) return null;

        const start = Math.min(Math.max(node.offsetTop / maxScroll, 0), 1);

        return {
          project,
          start,
          startPx: node.offsetTop
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);

    if (projectStarts.length === 0) return;

    const aboutStart = aboutNode
      ? Math.min(Math.max(aboutNode.offsetTop / maxScroll, 0), 1)
      : ANIMATION_CONFIG.scrollZones.about.start;
    const aboutStartPx = aboutNode ? aboutNode.offsetTop : Math.round(aboutStart * maxScroll);

    const measuredSections = projectStarts.map((entry, index) => {
      const nextStart = projectStarts[index + 1]?.start;
      const nextStartPx = projectStarts[index + 1]?.startPx;
      const rawEnd = nextStart ?? aboutStart;
      const rawEndPx = nextStartPx ?? aboutStartPx;
      const end = Math.max(rawEnd, entry.start + 0.00001);
      const endPx = Math.max(rawEndPx, entry.startPx + 1);

      return {
        project: entry.project,
        start: entry.start,
        end,
        startPx: entry.startPx,
        endPx,
      };
    });

    // Ensure the last project ends no later than about-start to avoid overlap drift.
    const lastIndex = measuredSections.length - 1;
    measuredSections[lastIndex].end = Math.max(
      Math.min(measuredSections[lastIndex].end, aboutStart),
      measuredSections[lastIndex].start + 0.00001
    );
    measuredSections[lastIndex].endPx = Math.max(
      Math.min(measuredSections[lastIndex].endPx, aboutStartPx),
      measuredSections[lastIndex].startPx + 1
    );

    runtimeProjectSectionsRef.current = measuredSections;
  }, []);

  const clearDirectProjectOverride = useCallback(() => {
    if (directProjectReleaseTimeoutRef.current) {
      clearTimeout(directProjectReleaseTimeoutRef.current);
      directProjectReleaseTimeoutRef.current = null;
    }
    directProjectOverrideRef.current = null;
  }, []);

  const setDirectProjectOverride = useCallback((projectKey) => {
    const sceneFacetKey = getSceneFacetKeyByProjectId(projectKey) || projectKey;

    if (!projectKey || !sceneFacetKey || !config?.camera?.projects?.[sceneFacetKey]) {
      clearDirectProjectOverride();
      return;
    }

    const createdAt = Date.now();

    directProjectOverrideRef.current = {
      projectKey,
      sceneFacetKey,
      createdAt
    };

    // Lock zone to projects while programmatic scrolling is in-flight so we
    // don't replay hero/overview transitions before reaching the target section.
    directZoneOverrideRef.current = {
      zoneKey: 'projects',
      createdAt,
    };

    setAnimationState((prev) => ({
      ...prev,
      state: ANIMATION_STATES.PROJECT_FOCUSED,
      crystalForm: 'exploded',
      cameraState: 'project',
      focusedFacet: sceneFacetKey,
      isTransitioning: false,
      projectInfo: { ...prev.projectInfo, project: projectKey },
    }));

    lastProject.current = projectKey;
  }, [clearDirectProjectOverride, config]);

  const clearDirectZoneOverride = useCallback(() => {
    directZoneOverrideRef.current = null;
  }, []);

  const clearIntroPreview = useCallback(() => {
    introPreviewActiveRef.current = false;
    if (introPreviewTimeout.current) {
      clearTimeout(introPreviewTimeout.current);
      introPreviewTimeout.current = null;
    }
  }, []);

  const setDirectZoneOverride = useCallback((zoneKey) => {
    if (!zoneKey || !config?.camera?.[zoneKey]) {
      clearDirectZoneOverride();
      return;
    }

    directZoneOverrideRef.current = {
      zoneKey,
      createdAt: Date.now()
    };

    setAnimationState(prev => {
      if (zoneKey === 'hero') {
        return {
          ...prev,
          state: ANIMATION_STATES.HERO,
          crystalForm: 'whole',
          cameraState: 'hero',
          focusedFacet: null,
          isTransitioning: false
        };
      }

      if (zoneKey === 'overview') {
        return {
          ...prev,
          state: ANIMATION_STATES.OVERVIEW,
          crystalForm: 'exploded',
          cameraState: 'overview',
          focusedFacet: null,
          isTransitioning: false
        };
      }

      if (zoneKey === 'about') {
        return {
          ...prev,
          state: ANIMATION_STATES.ABOUT,
          crystalForm: 'whole',
          cameraState: 'about',
          focusedFacet: null,
          isTransitioning: false
        };
      }

      return prev;
    });
  }, [clearDirectZoneOverride, config]);

  useEffect(() => {
    if (!introReplayToken || !config?.camera?.intro) return;

    clearIntroPreview();
    clearDirectProjectOverride();
    clearDirectZoneOverride();

    if (cameraDelayTimeout.current) {
      clearTimeout(cameraDelayTimeout.current);
      cameraDelayTimeout.current = null;
    }

    introPreviewActiveRef.current = true;
    lastZone.current = 'hero';
    lastProject.current = null;

    setAnimationState((prev) => ({
      ...prev,
      state: ANIMATION_STATES.HERO,
      crystalForm: 'whole',
      cameraState: 'intro',
      focusedFacet: null,
      isTransitioning: false,
      scrollProgress: 0,
      zoneInfo: { zone: 'hero', progress: 0, isEntering: false, isLeaving: false },
      projectInfo: { ...prev.projectInfo, project: null, progress: 0 }
    }));

    introPreviewTimeout.current = setTimeout(() => {
      introPreviewActiveRef.current = false;
      introPreviewTimeout.current = null;
      setAnimationState((prev) => ({
        ...prev,
        cameraState: 'hero'
      }));
    }, 1400);
  }, [clearDirectProjectOverride, clearDirectZoneOverride, clearIntroPreview, config, introReplayToken]);

  useEffect(() => {
    measureProjectSectionsFromDom();

    const handleResize = () => {
      measureProjectSectionsFromDom();
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [measureProjectSectionsFromDom]);

  const toQuaternionArray = useCallback((rotation) => {
    if (Array.isArray(rotation)) return rotation;
    if (rotation instanceof Quaternion) return rotation.toArray();
    return [0, 0, 0, 1];
  }, []);

  const explodedRotations = useMemo(() => {
    const eulerRotations = config?.facetRotationsEulerDeg;
    const sceneFacetKeys = Object.keys(config?.crystal?.explodedPositions || {});
    return sceneFacetKeys.reduce((acc, facetKey) => {
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
        focusedFacet: getSceneFacetKeyByProjectId(initialProject) || initialProject,
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
    const sceneFacetKey = getSceneFacetKeyByProjectId(projectKey) || projectKey;

    if (debugMode) {
      if (import.meta.env.DEV) console.log('🎯 IMMEDIATE Project focus:', projectKey, '->', sceneFacetKey);
    }

    if (import.meta.env.DEV) {
      console.log(`🎨 Background trigger: Project focus changed to "${projectKey}"`);
    }

    setAnimationState((prev) => ({
      ...prev,
      focusedFacet: sceneFacetKey,
      cameraState: 'project',
      isTransitioning: false,
      projectInfo: { ...prev.projectInfo, project: projectKey },
    }));
  }, [debugMode]);

  /**
   * FIXED: Main scroll update with hysteresis to prevent boundary flickering + enhanced debugging
   */
  const updateFromScrollProgress = useCallback((scrollProgress) => {
    if (runtimeProjectSectionsRef.current.length === 0) {
      measureProjectSectionsFromDom();
    }

    const container = typeof document !== 'undefined'
      ? document.querySelector('.scroll-container')
      : null;
    const triggerPx = container
      // Use top-of-viewport anchoring for section/project detection so
      // about/projects boundary logic matches snap alignment exactly.
      ? container.scrollTop + 1
      : Number.NaN;
    const activeProjectFromDom = calculateActiveProjectFromTriggerPx(
      triggerPx,
      runtimeProjectSectionsRef.current
    );
    let currentZone = calculateCurrentZone(scrollProgress, config);
    const activeProject = activeProjectFromDom.project
      ? activeProjectFromDom
      : calculateActiveProject(scrollProgress, config);

    // Resolve zone from the actual nearest DOM section first so camera and
    // focus logic don't fight static progress thresholds at section boundaries.
    if (container) {
      const sections = Array.from(container.querySelectorAll('.scroll-section[id]'));
      let nearestSection = null;
      let minDistance = Number.POSITIVE_INFINITY;

      sections.forEach((section) => {
        const distance = Math.abs(container.scrollTop - section.offsetTop);
        if (distance < minDistance) {
          minDistance = distance;
          nearestSection = section;
        }
      });

      const nearestSectionId = nearestSection?.id ?? null;
      const domZone = nearestSectionId === 'hero'
        ? 'hero'
        : nearestSectionId === 'overview'
          ? 'overview'
          : nearestSectionId === 'about'
            ? 'about'
            : nearestSectionId?.startsWith('project-')
              ? 'projects'
              : null;

      if (domZone) {
        currentZone = {
          ...currentZone,
          zone: domZone,
        };
      }
    }

    // When DOM clearly indicates a project section, keep projects-zone progress
    // aligned to DOM section bounds so transitions stay stable.
    const runtimeSections = runtimeProjectSectionsRef.current;
    const firstRuntimeSection = runtimeSections[0];
    const lastRuntimeSection = runtimeSections[runtimeSections.length - 1];
    if (activeProjectFromDom.project && currentZone.zone === 'projects' && firstRuntimeSection && lastRuntimeSection) {
      const span = Math.max(lastRuntimeSection.end - firstRuntimeSection.start, 0.00001);
      const domProjectsProgress = (scrollProgress - firstRuntimeSection.start) / span;
      currentZone = {
        ...currentZone,
        progress: Math.max(0, Math.min(domProjectsProgress, 1)),
        isEntering: false,
        isLeaving: false
      };
    }

    if (introPreviewActiveRef.current) {
      const withinHeroZone = scrollProgress <= (config.scrollZones?.hero?.end ?? 0.12);
      if (withinHeroZone) {
        setAnimationState((prev) => ({
          ...prev,
          scrollProgress,
          zoneInfo: currentZone,
          projectInfo: activeProject
        }));
        return;
      }
      clearIntroPreview();
    }
    const directOverrideProject = directProjectOverrideRef.current?.projectKey ?? null;
    const directOverrideZone = directZoneOverrideRef.current?.zoneKey ?? null;
    const lockedProjectInfo = directOverrideProject
      ? { ...activeProject, project: directOverrideProject }
      : activeProject;

    if (directOverrideZone && currentZone.zone !== directOverrideZone) {
      setAnimationState(prev => ({
        ...prev,
        scrollProgress: scrollProgress,
        zoneInfo: currentZone,
        projectInfo: lockedProjectInfo
      }));

      if (onStateChange) {
        onStateChange(animationState);
      }
      return;
    }

    if (directOverrideZone && currentZone.zone === directOverrideZone) {
      clearDirectZoneOverride();
    }
    
    // ENHANCED: Log scroll updates for background debugging
    if (import.meta.env.DEV && Math.random() < 0.05) { // Sample 5% of updates
      console.log('🔄 Animation state update:', {
        scrollProgress: scrollProgress.toFixed(3),
        currentZone: currentZone.zone,
        zoneProgress: currentZone.progress.toFixed(3),
        activeProject: activeProject.project,
        projectProgress: activeProject.progress.toFixed(3),
        lastZone: lastZone.current,
        lastProject: lastProject.current
      });
    }
    
    // FIXED: Add hysteresis to prevent boundary flickering
    const zoneChanged = currentZone.zone !== lastZone.current;
    const projectChanged = activeProject.project !== lastProject.current;

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
          const fallbackProject = lastZone.current === 'about'
            ? (orderedProjectKeys[orderedProjectKeys.length - 1] || null)
            : (orderedProjectKeys[0] || null);
          const initialProject = directOverrideProject
            || activeProject.project
            || fallbackProject;
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
      if (directOverrideProject && activeProject.project === directOverrideProject) {
        // IMPORTANT: Keep direct override active until the scroll has settled on
        // the target project, otherwise intermediate section crossings can
        // briefly retarget focus/camera and create visible "bounce".
        if (!directProjectReleaseTimeoutRef.current) {
          directProjectReleaseTimeoutRef.current = setTimeout(() => {
            directProjectReleaseTimeoutRef.current = null;

            // Only release if we are still on the intended target project.
            if (directProjectOverrideRef.current?.projectKey === activeProject.project) {
              clearDirectProjectOverride();
            }
          }, 320);
        }
      } else if (directProjectReleaseTimeoutRef.current) {
        clearTimeout(directProjectReleaseTimeoutRef.current);
        directProjectReleaseTimeoutRef.current = null;
      }

      const overrideActive = Boolean(directProjectOverrideRef.current?.projectKey);

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
      if (!overrideActive && projectChanged && activeProject.project) {
        if (import.meta.env.DEV) {
          console.log(`🎯 Project changed: ${lastProject.current} → ${activeProject.project}`);
          console.log(`🎨 Background trigger: Project changed to "${activeProject.project}"`);
        }
        handleProjectFocus(activeProject.project);
        lastProject.current = activeProject.project;
      }
      
      // Set initial project if none is set but we have an active project
      if (!overrideActive && !animationState.focusedFacet && activeProject.project) {
        if (import.meta.env.DEV) {
          console.log(`🎯 Setting initial project: ${activeProject.project}`);
          console.log(`🎨 Background trigger: Initial project set to "${activeProject.project}"`);
        }
        handleProjectFocus(activeProject.project);
        lastProject.current = activeProject.project;
      }
    } else if (directProjectOverrideRef.current?.projectKey && (currentZone.zone === 'hero' || currentZone.zone === 'about')) {
      clearDirectProjectOverride();
    } else if (currentZone.zone !== 'projects' && lastProject.current && !directProjectOverrideRef.current?.projectKey) {
      if (currentZone.zone === 'about') {
        clearDirectProjectOverride();
      }
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
      projectInfo: lockedProjectInfo
    }));

    if (onStateChange) {
      onStateChange(animationState);
    }
  }, [
    config,
    measureProjectSectionsFromDom,
    handleZoneTransition,
    handleProjectFocus,
    clearDirectProjectOverride,
    clearDirectZoneOverride,
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

  const setCameraMoveProgress = useCallback((value) => {
    const clamped = Math.max(0, Math.min(1, value));
    setAnimationState(prev => ({ ...prev, cameraMoveProgress: clamped }));
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
      clearIntroPreview();
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
      if (cameraDelayTimeout.current) {
         clearTimeout(cameraDelayTimeout.current);
      }
    };
  }, [clearIntroPreview]);

  return {
    // Current state
    animationState,

    // Configuration
    config,

    // Update functions
    updateFromScrollProgress,
    setCameraSettled,
    setCameraMoveProgress,
    setDirectProjectOverride,
    setDirectZoneOverride,
    getProjectSectionStart,
    
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
      crystalForm: animationState.crystalForm,
      directProjectOverride: directProjectOverrideRef.current?.projectKey || null,
      directZoneOverride: directZoneOverrideRef.current?.zoneKey || null
    } : null
  };
};
