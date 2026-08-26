// src/App.jsx - UPDATED: Integration with V2 performance and loading system

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import './styles/scroll-snap.css';
import './styles/app-frame.css';

// UPDATED: Import V2 systems
import { useAssetLoaderV2 } from './hooks/useAssetLoaderV2';
import { usePerformanceV2 } from './hooks/usePerformanceV2';
import LoaderV2, {
  LOADER_OVERLAY_FADE_MS,
  LOADER_SCENE_REVEAL_DELAY_MS
} from './ui/LoaderV2';

// Animation coordinator
import MasterAnimationCoordinator from './components/three/MasterAnimationCoordinator';
import { ANIMATION_CONFIG } from './hooks/useUnifiedAnimationController';
import { Euler, Quaternion, Vector3 } from 'three';

// Layout components
import ScrollablePortfolio from './components/layout/ScrollablePortfolio';
import Fixed3DCanvas from './components/layout/Fixed3DCanvas';

// UI components
import Navigation from './components/ui/Navigation';
import ControlsToggle from './components/ui/ControlsToggle';
import TabbedControlPanel from './components/ui/TabbedControlPanel';
import CrystalControls from './components/ui/CrystalControls';
import MaterialSelector from './components/ui/MaterialSelector';
import PostProcessingControls from './components/ui/PostProcessingControls';
import PerformanceControls from './components/ui/PerformanceControls';
import AccessibilityInstructions from './components/ui/AccessibilityInstructions';
import FpsDisplay, { PerformanceAlert } from './components/ui/FpsDisplay';
import VerticalEnergyLine from './components/ui/VerticalEnergyLine';

// Debug component
import PerformanceDebugPanel from './components/ui/PerformanceDebugPanel';

// Configuration and utilities
import * as defaultConfig from './crystalConfig';

// Case studies (lazy-loaded per project)
import CaseStudyOverlay from './caseStudies/CaseStudyOverlay';
import { foregroundColorForTone } from './caseStudies/system/caseStudyTheme';
import { caseStudyOpaqueAtMs } from './caseStudies/transitionTiming';
import { getProjectByAnyKey } from './data/projects';

import { isMobileDevice } from './utils/isMobileDevice.js';
import {
  NAVIGATION_DESTINATIONS,
  createNavigationIntentRequester,
} from './navigation/navigationIntent';

const projectKeys = ['empathy', 'narrative', 'craft', 'system', 'leadership', 'exploration'];
const zoneKeys = ['intro', 'hero', 'overview', 'about'];

// How long the scene keeps rendering after a case study opens. It has to outlast
// the case study's colour wash — the crystal is visible through the layer until
// that is fully opaque, so freezing (and hiding) the canvas any earlier would
// blink it out mid-transition. Derived, not a second copy of the timing.
const SCENE_FREEZE_DELAY_MS = caseStudyOpaqueAtMs + 260;

const toVecOrNull = (value) => (
  Array.isArray(value) && value.length === 3 && value.every((entry) => Number.isFinite(entry))
    ? [...value]
    : null
);

const vecChanged = (baseVec, nextVec) => {
  const base = toVecOrNull(baseVec);
  const next = toVecOrNull(nextVec);
  if (!base || !next) return false;
  return base.some((value, index) => value !== next[index]);
};


const getProjectRuntimeOverrides = (baseConfig, nextConfig) => {
  const overrides = {};

  projectKeys.forEach((project) => {
    if (vecChanged(baseConfig?.explodedPositions?.[project], nextConfig?.explodedPositions?.[project])) {
      overrides.explodedPositions = {
        ...(overrides.explodedPositions || {}),
        [project]: [...nextConfig.explodedPositions[project]]
      };
    }

    if (vecChanged(baseConfig?.facetRotationsEulerDeg?.[project], nextConfig?.facetRotationsEulerDeg?.[project])) {
      overrides.facetRotationsEulerDeg = {
        ...(overrides.facetRotationsEulerDeg || {}),
        [project]: [...nextConfig.facetRotationsEulerDeg[project]]
      };
    }

    if (vecChanged(
      baseConfig?.selectedFacetRotationsEulerDeg?.[project],
      nextConfig?.selectedFacetRotationsEulerDeg?.[project]
    )) {
      overrides.selectedFacetRotationsEulerDeg = {
        ...(overrides.selectedFacetRotationsEulerDeg || {}),
        [project]: [...nextConfig.selectedFacetRotationsEulerDeg[project]]
      };
    }
  });

  return overrides;
};

const getCameraRuntimeOverrides = (baseConfig, nextConfig) => {
  const overrides = {};

  zoneKeys.forEach((zone) => {
    if (vecChanged(baseConfig?.cameraPositions?.[zone], nextConfig?.cameraPositions?.[zone])) {
      overrides.positions = {
        ...(overrides.positions || {}),
        [zone]: [...nextConfig.cameraPositions[zone]]
      };
    }
  });

  projectKeys.forEach((project) => {
    if (vecChanged(baseConfig?.cameraPositions?.projects?.[project], nextConfig?.cameraPositions?.projects?.[project])) {
      overrides.positions = {
        ...(overrides.positions || {}),
        projects: {
          ...(overrides.positions?.projects || {}),
          [project]: [...nextConfig.cameraPositions.projects[project]]
        }
      };
    }
  });

  zoneKeys.forEach((zone) => {
    if (vecChanged(baseConfig?.cameraTargets?.[zone], nextConfig?.cameraTargets?.[zone])) {
      overrides.targets = {
        ...(overrides.targets || {}),
        [zone]: [...nextConfig.cameraTargets[zone]]
      };
    }
  });

  projectKeys.forEach((project) => {
    if (vecChanged(baseConfig?.cameraTargets?.projects?.[project], nextConfig?.cameraTargets?.projects?.[project])) {
      overrides.targets = {
        ...(overrides.targets || {}),
        projects: {
          ...(overrides.targets?.projects || {}),
          [project]: [...nextConfig.cameraTargets.projects[project]]
        }
      };
    }
  });

  ['position', 'target'].forEach((offsetKey) => {
    if (vecChanged(baseConfig?.cameraOffsets?.global?.[offsetKey], nextConfig?.cameraOffsets?.global?.[offsetKey])) {
      overrides.offsets = {
        ...(overrides.offsets || {}),
        global: {
          ...(overrides.offsets?.global || {}),
          [offsetKey]: [...nextConfig.cameraOffsets.global[offsetKey]]
        }
      };
    }
  });

  zoneKeys.forEach((zone) => {
    ['position', 'target'].forEach((offsetKey) => {
      if (vecChanged(baseConfig?.cameraOffsets?.zones?.[zone]?.[offsetKey], nextConfig?.cameraOffsets?.zones?.[zone]?.[offsetKey])) {
        overrides.offsets = {
          ...(overrides.offsets || {}),
          zones: {
            ...(overrides.offsets?.zones || {}),
            [zone]: {
              ...(overrides.offsets?.zones?.[zone] || {}),
              [offsetKey]: [...nextConfig.cameraOffsets.zones[zone][offsetKey]]
            }
          }
        };
      }
    });
  });

  projectKeys.forEach((project) => {
    ['position', 'target'].forEach((offsetKey) => {
      if (vecChanged(baseConfig?.cameraOffsets?.projects?.[project]?.[offsetKey], nextConfig?.cameraOffsets?.projects?.[project]?.[offsetKey])) {
        overrides.offsets = {
          ...(overrides.offsets || {}),
          projects: {
            ...(overrides.offsets?.projects || {}),
            [project]: {
              ...(overrides.offsets?.projects?.[project] || {}),
              [offsetKey]: [...nextConfig.cameraOffsets.projects[project][offsetKey]]
            }
          }
        };
      }
    });
  });

  return overrides;
};

// Convert UI config into animation config
const buildAnimationConfig = (uiConfig) => {
  const toVec = (arr) => new Vector3(...arr);
  const sumVec = (...arrs) =>
    arrs.reduce((acc, arr) => acc.add(new Vector3(...(arr ?? [0, 0, 0]))), new Vector3(0, 0, 0));
  const toQuatFromEulerDeg = (eulerDeg, fallback) => {
    if (!Array.isArray(eulerDeg)) return fallback.clone();
    const [x = 0, y = 0, z = 0] = eulerDeg;
    const euler = new Euler(
      x * (Math.PI / 180),
      y * (Math.PI / 180),
      z * (Math.PI / 180),
      'XYZ'
    );
    return new Quaternion().setFromEuler(euler);
  };
  if (!uiConfig?.cameraPositions) return ANIMATION_CONFIG;

  const globalOffsets = uiConfig.cameraOffsets?.global;
  const zoneOffsets = uiConfig.cameraOffsets?.zones;
  const projectOffsets = uiConfig.cameraOffsets?.projects;
  const cameraTargets = uiConfig.cameraTargets;

  return {
    ...ANIMATION_CONFIG,
    facetRotationsEulerDeg: uiConfig.facetRotationsEulerDeg ?? ANIMATION_CONFIG.facetRotationsEulerDeg ?? {},
    camera: {
      intro: {
        ...(ANIMATION_CONFIG.camera.intro || ANIMATION_CONFIG.camera.hero),
        position: toVec(uiConfig.cameraPositions.intro ?? uiConfig.cameraPositions.hero),
        target: toVec(cameraTargets?.intro ?? ANIMATION_CONFIG.camera.intro?.target?.toArray?.() ?? ANIMATION_CONFIG.camera.hero.target.toArray()),
        offsetPosition: sumVec(globalOffsets?.position, zoneOffsets?.intro?.position),
        offsetTarget: sumVec(globalOffsets?.target, zoneOffsets?.intro?.target)
      },
      hero: {
        ...ANIMATION_CONFIG.camera.hero,
        position: toVec(uiConfig.cameraPositions.hero),
        target: toVec(cameraTargets?.hero ?? ANIMATION_CONFIG.camera.hero.target.toArray()),
        offsetPosition: sumVec(globalOffsets?.position, zoneOffsets?.hero?.position),
        offsetTarget: sumVec(globalOffsets?.target, zoneOffsets?.hero?.target)
      },
      overview: {
        ...ANIMATION_CONFIG.camera.overview,
        position: toVec(uiConfig.cameraPositions.overview),
        target: toVec(cameraTargets?.overview ?? ANIMATION_CONFIG.camera.overview.target.toArray()),
        offsetPosition: sumVec(globalOffsets?.position, zoneOffsets?.overview?.position),
        offsetTarget: sumVec(globalOffsets?.target, zoneOffsets?.overview?.target)
      },
      about: {
        ...ANIMATION_CONFIG.camera.about,
        position: toVec(uiConfig.cameraPositions.about),
        target: toVec(cameraTargets?.about ?? ANIMATION_CONFIG.camera.about.target.toArray()),
        offsetPosition: sumVec(globalOffsets?.position, zoneOffsets?.about?.position),
        offsetTarget: sumVec(globalOffsets?.target, zoneOffsets?.about?.target)
      },
      projects: {
        empathy: {
          ...ANIMATION_CONFIG.camera.projects.empathy,
          position: toVec(uiConfig.cameraPositions.projects.empathy),
          target: toVec(cameraTargets?.projects?.empathy ?? ANIMATION_CONFIG.camera.projects.empathy.target.toArray()),
          offsetPosition: sumVec(globalOffsets?.position, projectOffsets?.empathy?.position),
          offsetTarget: sumVec(globalOffsets?.target, projectOffsets?.empathy?.target)
        },
        narrative: {
          ...ANIMATION_CONFIG.camera.projects.narrative,
          position: toVec(uiConfig.cameraPositions.projects.narrative),
          target: toVec(cameraTargets?.projects?.narrative ?? ANIMATION_CONFIG.camera.projects.narrative.target.toArray()),
          offsetPosition: sumVec(globalOffsets?.position, projectOffsets?.narrative?.position),
          offsetTarget: sumVec(globalOffsets?.target, projectOffsets?.narrative?.target)
        },
        craft: {
          ...ANIMATION_CONFIG.camera.projects.craft,
          position: toVec(uiConfig.cameraPositions.projects.craft),
          target: toVec(cameraTargets?.projects?.craft ?? ANIMATION_CONFIG.camera.projects.craft.target.toArray()),
          offsetPosition: sumVec(globalOffsets?.position, projectOffsets?.craft?.position),
          offsetTarget: sumVec(globalOffsets?.target, projectOffsets?.craft?.target)
        },
        system: {
          ...ANIMATION_CONFIG.camera.projects.system,
          position: toVec(uiConfig.cameraPositions.projects.system),
          target: toVec(cameraTargets?.projects?.system ?? ANIMATION_CONFIG.camera.projects.system.target.toArray()),
          offsetPosition: sumVec(globalOffsets?.position, projectOffsets?.system?.position),
          offsetTarget: sumVec(globalOffsets?.target, projectOffsets?.system?.target)
        },
        leadership: {
          ...ANIMATION_CONFIG.camera.projects.leadership,
          position: toVec(uiConfig.cameraPositions.projects.leadership),
          target: toVec(
            cameraTargets?.projects?.leadership ?? ANIMATION_CONFIG.camera.projects.leadership.target.toArray()
          ),
          offsetPosition: sumVec(globalOffsets?.position, projectOffsets?.leadership?.position),
          offsetTarget: sumVec(globalOffsets?.target, projectOffsets?.leadership?.target)
        },
        exploration: {
          ...ANIMATION_CONFIG.camera.projects.exploration,
          position: toVec(uiConfig.cameraPositions.projects.exploration),
          target: toVec(
            cameraTargets?.projects?.exploration ?? ANIMATION_CONFIG.camera.projects.exploration.target.toArray()
          ),
          offsetPosition: sumVec(globalOffsets?.position, projectOffsets?.exploration?.position),
          offsetTarget: sumVec(globalOffsets?.target, projectOffsets?.exploration?.target)
        }
      }
    },
    crystal: {
      ...ANIMATION_CONFIG.crystal,
      explodedPositions: {
        empathy: toVec(
          uiConfig.explodedPositions?.empathy ?? ANIMATION_CONFIG.crystal.explodedPositions.empathy.toArray()
        ),
        narrative: toVec(
          uiConfig.explodedPositions?.narrative ?? ANIMATION_CONFIG.crystal.explodedPositions.narrative.toArray()
        ),
        craft: toVec(
          uiConfig.explodedPositions?.craft ?? ANIMATION_CONFIG.crystal.explodedPositions.craft.toArray()
        ),
        system: toVec(
          uiConfig.explodedPositions?.system ?? ANIMATION_CONFIG.crystal.explodedPositions.system.toArray()
        ),
        leadership: toVec(
          uiConfig.explodedPositions?.leadership ?? ANIMATION_CONFIG.crystal.explodedPositions.leadership.toArray()
        ),
        exploration: toVec(
          uiConfig.explodedPositions?.exploration ?? ANIMATION_CONFIG.crystal.explodedPositions.exploration.toArray()
        )
      },
      explodedRotations: {
        empathy: toQuatFromEulerDeg(
          uiConfig.facetRotationsEulerDeg?.empathy,
          ANIMATION_CONFIG.crystal.explodedRotations.empathy
        ),
        narrative: toQuatFromEulerDeg(
          uiConfig.facetRotationsEulerDeg?.narrative,
          ANIMATION_CONFIG.crystal.explodedRotations.narrative
        ),
        craft: toQuatFromEulerDeg(
          uiConfig.facetRotationsEulerDeg?.craft,
          ANIMATION_CONFIG.crystal.explodedRotations.craft
        ),
        system: toQuatFromEulerDeg(
          uiConfig.facetRotationsEulerDeg?.system,
          ANIMATION_CONFIG.crystal.explodedRotations.system
        ),
        leadership: toQuatFromEulerDeg(
          uiConfig.facetRotationsEulerDeg?.leadership,
          ANIMATION_CONFIG.crystal.explodedRotations.leadership
        ),
        exploration: toQuatFromEulerDeg(
          uiConfig.facetRotationsEulerDeg?.exploration,
          ANIMATION_CONFIG.crystal.explodedRotations.exploration
        )
      }
    },
    timing: {
      ...(ANIMATION_CONFIG.timing || {}),
      ...(uiConfig.timing || {}),
      camera: {
        ...(ANIMATION_CONFIG.timing?.camera || {}),
        ...(uiConfig.timing?.camera || {}),
      },
      heroOverviewRuntime: {
        ...(ANIMATION_CONFIG.timing?.heroOverviewRuntime || {}),
        ...(uiConfig.timing?.heroOverviewRuntime || {}),
      },
    },
  };
};


const LOADER_EXIT_FADE_MS = LOADER_SCENE_REVEAL_DELAY_MS + LOADER_OVERLAY_FADE_MS;

function App() {
  // ========================================
  // UPDATED: V2 Performance and Asset Loading System
  // ========================================
  const [isAppReady, setIsAppReady] = useState(false);
  const [initProgress, setInitProgress] = useState(0);
  const [exitLoader, setExitLoader] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const loaderHideTimeoutRef = useRef(null);
  const loaderStartFadeTimeoutRef = useRef(null);
  const loaderRevealTimeoutRef = useRef(null);
  // Progress is now provided directly by hooks

  // UPDATED: Use V2 performance hook
  const {
    profile: performanceProfile,
    tier: performanceTier,
    isReady: performanceReady,
    error: performanceError,
    testResults,
    testProgress: testProgressHook,
    testStatus,
    updateProfile,
    forceRetest,
    clearCache,
    debugInfo
  } = usePerformanceV2();

  // UPDATED: Use V2 asset loader hook
  const {
    progress: assetProgressHook,
    currentAsset,
    loadedAssets,
    totalAssets,
    errors: assetErrors,
    isReady: assetsReady,
    hasErrors: assetHasErrors,
    retry: retryAssets
  } = useAssetLoaderV2(performanceReady ? performanceProfile : null);

  // Track when GLTF models have loaded via Fixed3DCanvas
  const fixedCanvasRef = useRef();
  
  // Basic state hooks
  const [hideAllUI, setHideAllUI] = useState(false);
  // Which top-nav item is highlighted, derived from the current scroll zone.
  const [activeNavLabel, setActiveNavLabel] = useState(null);
  // The section the scrollable content has settled on. Drives the About scrim so
  // it stays in sync with the section content on both scroll and nav clicks.
  const [settledSection, setSettledSection] = useState('hero');
  // Keeps the About scrim's blur mounted through the fade-out so the blur
  // doesn't visibly pop off before the opacity has finished animating.
  const [aboutScrimBlur, setAboutScrimBlur] = useState(false);
  const [perfDebug, setPerfDebug] = useState(false);
  const [snapSpeed, setSnapSpeed] = useState('medium');
  const [config, setConfig] = useState({
    ...defaultConfig,
    timing: {
      ...defaultConfig.timing,
      camera: {
        ...defaultConfig.timing.camera,
        facetZoomDuration: 1000,
        facetReturnDuration: 1200
      }
    }
  });
  const [animationConfig, setAnimationConfig] = useState(buildAnimationConfig(defaultConfig));
  const [cameraRuntimeOverrides, setCameraRuntimeOverrides] = useState({});
  const [projectRuntimeOverrides, setProjectRuntimeOverrides] = useState({});
  const [sceneRestartToken, setSceneRestartToken] = useState(0);
  const [materialVariant, setMaterialVariant] = useState('default');
  const [showUI, setShowUI] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [effectsEnabled, setEffectsEnabled] = useState({
    bloom: true,
    chromaticAberration: true,
    noise: true,
    vignette: false
  });
  const [postProcessingConfig, setPostProcessingConfig] = useState(config.postProcessing);
  const [viewMode, setViewMode] = useState('overview');
  const [activeProjectId, setActiveProjectId] = useState(null);

  // Case study overlay: the project whose case study is (or would be) open.
  const activeProject = useMemo(
    () => (activeProjectId ? getProjectByAnyKey(activeProjectId) : null),
    [activeProjectId]
  );
  const caseStudyOpen = viewMode === 'caseStudy';
  // Tone of the case-study section currently under the fixed top nav; null once
  // the overlay has finished fading out. Driven by the overlay rather than by
  // `caseStudyOpen` so the nav keeps its case-study colour through the exit.
  const [caseStudyNavTone, setCaseStudyNavTone] = useState(null);
  const navColor = caseStudyNavTone
    ? foregroundColorForTone(caseStudyNavTone, activeProject?.caseStudyColors)
    : null;

  // Leaving a case study returns to the project view it was opened from; the
  // scroll position, crystal state, and camera underneath are untouched.
  const closeCaseStudy = useCallback(() => {
    setViewMode((prev) => (prev === 'caseStudy' ? 'project' : prev));
  }, []);

  // Freeze-frame the 3D scene while a case study covers it. Where the crystal is
  // hidden behind opaque content, rendering it is pure waste — and a case study
  // is exactly where the browser needs its budget for images, scrolling, and the
  // lightbox. It stops on a finished frame and resumes from the same one (see
  // SceneFreezeGuard in Fixed3DCanvas for how the clock stays continuous).
  //
  // Two conditions have to hold. The entrance must have finished covering the
  // scene, and no on-screen section may be showing the scene through itself —
  // the overlay reports that second one, since a section can opt out of painting
  // a background entirely.
  const [caseStudyEntranceSettled, setCaseStudyEntranceSettled] = useState(false);
  const [caseStudySceneNeeded, setCaseStudySceneNeeded] = useState(false);
  const sceneFrozen =
    caseStudyOpen && caseStudyEntranceSettled && !caseStudySceneNeeded;

  useEffect(() => {
    if (!caseStudyOpen) {
      setCaseStudyEntranceSettled(false);
      return undefined;
    }
    const timeoutId = setTimeout(
      () => setCaseStudyEntranceSettled(true),
      SCENE_FREEZE_DELAY_MS
    );
    return () => clearTimeout(timeoutId);
  }, [caseStudyOpen]);

  // Simulate application initialization progress for loader
  useEffect(() => {
    let frame;
    const step = () => {
      setInitProgress((p) => {
        if (p >= 100) return 100;
        frame = requestAnimationFrame(step);
        return Math.min(100, p + 2);
      });
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Initialize effects from the detected device profile
  useEffect(() => {
    if (performanceProfile?.postProcessing) {
      // Apply unified noise and vignette settings regardless of profile.
      // Vignette is off across all tiers; bloom + CA come from the profile
      // (now enabled on every tier). Noise stays always-on.
      const unifiedEffects = {
        ...performanceProfile.postProcessing,
        noise: true,        // Always enabled
        vignette: false     // Off across all tiers
      };

      setEffectsEnabled(unifiedEffects);

      // Apply unified configuration values
      setPostProcessingConfig({
        ...performanceProfile.postProcessing,
        noise: { opacity: 0.15 },      // Unified value
        vignette: { darkness: 0.7 }    // Unified value
      });
    }
  }, [performanceProfile]);


  const beginLoaderFadeOut = useCallback((onReveal = null) => {
    setExitLoader(true);

    if (loaderHideTimeoutRef.current) {
      clearTimeout(loaderHideTimeoutRef.current);
    }
    if (loaderRevealTimeoutRef.current) {
      clearTimeout(loaderRevealTimeoutRef.current);
    }

    if (onReveal) {
      loaderRevealTimeoutRef.current = setTimeout(() => {
        loaderRevealTimeoutRef.current = null;
        onReveal();
      }, LOADER_SCENE_REVEAL_DELAY_MS);
    }

    loaderHideTimeoutRef.current = setTimeout(() => {
      setShowLoader(false);
      loaderHideTimeoutRef.current = null;
    }, LOADER_EXIT_FADE_MS);
  }, []);

  // Detect if mobile
  const isMobile = isMobileDevice();

  // ========================================
  // UPDATED: App ready detection with V2 system
  // ========================================
  useEffect(() => {
    if (performanceReady && assetsReady && initProgress >= 100 && !exitLoader) {
      if (import.meta.env.DEV) {
        console.log('🎯 App is ready - V2 system initialized:', {
          performanceReady,
          assetsReady,
          performanceTier,
          performanceProfile: {
            renderScale: performanceProfile.renderScale,
            pbrQuality: performanceProfile.pbrQuality,
            textureQuality: performanceProfile.textureQuality
          }
        });
      }
      setIsAppReady(true);
      setInitProgress(100);
      beginLoaderFadeOut();
    }
  }, [beginLoaderFadeOut, performanceReady, assetsReady, initProgress, exitLoader, performanceTier, performanceProfile]);

  useEffect(() => () => {
    if (loaderHideTimeoutRef.current) {
      clearTimeout(loaderHideTimeoutRef.current);
      loaderHideTimeoutRef.current = null;
    }
    if (loaderStartFadeTimeoutRef.current) {
      clearTimeout(loaderStartFadeTimeoutRef.current);
      loaderStartFadeTimeoutRef.current = null;
    }
    if (loaderRevealTimeoutRef.current) {
      clearTimeout(loaderRevealTimeoutRef.current);
      loaderRevealTimeoutRef.current = null;
    }
  }, []);

  // ========================================
  // Enhanced callbacks with better logging
  // ========================================

  const handleSnapSpeedChange = useCallback((speed) => {
    if (import.meta.env.DEV) console.log('🎯 Changing snap speed to:', speed);
    setSnapSpeed(speed);
  }, []);

  const handleAnimationStateChange = useCallback((newState, prevState) => {
    if (import.meta.env.DEV) {
      console.log('🎬 Animation state change:', { prev: prevState, new: newState });
    }

    // Keep the top-nav highlight in sync with the section the user is actually in.
    // The controller passes its full animationState object; map its zone to a label.
    const zone = newState?.zoneInfo?.zone ?? newState?.state;
    let label = null;
    if (zone === 'overview' || zone === 'projects' || zone === 'project_focused') {
      label = 'WORK';
    } else if (zone === 'about') {
      label = 'ABOUT';
    }
    setActiveNavLabel(label);
  }, []);

  // Drive the About scrim's blur: on immediately when entering About, off only
  // after the opacity fade-out has completed (so it never leaves the blur cost
  // running while the user is elsewhere).
  useEffect(() => {
    if (settledSection === 'about') {
      setAboutScrimBlur(true);
      return undefined;
    }
    const timeoutId = setTimeout(() => setAboutScrimBlur(false), 520);
    return () => clearTimeout(timeoutId);
  }, [settledSection]);

  const scrollToSection = useCallback((sectionId, behavior = 'smooth') => {
    const target = document.getElementById(sectionId);
    if (!target) return;

    const scrollContainer = document.querySelector('.scroll-container');
    if (scrollContainer) {
      if (behavior === 'auto') {
        // Force a TRULY instant jump. The container has CSS scroll-behavior:smooth,
        // which makes even `scrollTop = ...` animate — that animation traverses every
        // snap-mandatory section, firing intermediate zone transitions that fight the
        // directSelectZone override (the "conflicting jumping") and snap-latches on an
        // adjacent section. `behavior: 'instant'` overrides the CSS and lands directly.
        scrollContainer.scrollTo({ top: target.offsetTop, behavior: 'instant' });
      } else {
        scrollContainer.scrollTo({ top: target.offsetTop, behavior });
      }
      return;
    }

    target.scrollIntoView({ behavior, block: 'start' });
  }, []);

  const requestNavigationIntent = useMemo(() => createNavigationIntentRequester({
    onDestinationChange: (nextDestination) => {
      if (!import.meta.env.DEV) return;
      console.log('[navigation-intent] destination', nextDestination);
    },
    onIntent: (intent) => {
      // Hero ↔ Overview: drive the REAL scroll-driven transition rather than the
      // imperative directSelectZone override. A smooth scroll (the container's
      // default behavior) crosses the zone boundary gradually, which is exactly
      // what fires handleZoneTransition + the hero→overview explosion runtime. By
      // routing the click through the same scroll pipeline, clicking "Work" /
      // "Jon Shaw" runs identical code to scrolling — there is only one version
      // of the transition, so effects can't double-fire or drift.
      if (intent.destination === NAVIGATION_DESTINATIONS.HERO) {
        const scrollContainer = document.querySelector('.scroll-container');
        const firstProjectEl = document.querySelector('.scroll-section[id^="project-"]');
        const comingUpFromFar = Boolean(
          scrollContainer && firstProjectEl && scrollContainer.scrollTop >= firstProjectEl.offsetTop - 1
        );
        if (comingUpFromFar) {
          // From projects/about: clear overrides and set the hero state directly,
          // then jump immediately, so the camera flies straight to hero. (A smooth
          // scroll up across scroll-snap-mandatory sections latched on the last
          // project — "Jon Shaw" from About never reached hero.)
          fixedCanvasRef.current?.directSelectZone?.('hero');
          scrollToSection('hero', 'auto');
        } else {
          // From overview (adjacent): smooth scroll so the overview→hero reform
          // cinematic plays via the gradual boundary crossing.
          scrollToSection('hero', 'smooth');
        }
        return;
      }

      if (intent.destination === NAVIGATION_DESTINATIONS.OVERVIEW) {
        const scrollContainer = document.querySelector('.scroll-container');
        const overviewEl = document.getElementById('overview');
        const comingUpFromBelow = Boolean(
          scrollContainer && overviewEl && scrollContainer.scrollTop > overviewEl.offsetTop + 1
        );
        if (comingUpFromBelow) {
          // From projects/about: clear any lingering project override and set the
          // overview state directly, then jump immediately, so the camera flies
          // straight to the canonical overview pose. (A smooth scroll across
          // scroll-snap-mandatory sections gets latched on an intermediate project,
          // and a bare jump left the project override fighting the move so it never
          // reached overview.)
          fixedCanvasRef.current?.directSelectZone?.('overview');
          scrollToSection('overview', 'auto');
        } else {
          // From hero: smooth scroll so the hero→overview explosion cinematic plays
          // via the gradual boundary crossing.
          scrollToSection('overview', 'smooth');
        }
        return;
      }

      if (intent.destination === NAVIGATION_DESTINATIONS.ABOUT) {
        fixedCanvasRef.current?.directSelectZone?.('about');
        scrollToSection('about', intent.behavior);
      }
    },
  }), [scrollToSection]);

  // Top-nav destinations live in the portfolio underneath, so any nav click
  // dismisses an open case study before the usual intent runs.
  const handleHomeClick = useCallback(() => {
    closeCaseStudy();
    requestNavigationIntent({
      destination: NAVIGATION_DESTINATIONS.HERO,
      source: 'top-nav-logo',
      behavior: 'auto',
      legacyAction: 'directSelectZone+scrollToSection',
    });
  }, [closeCaseStudy, requestNavigationIntent]);

  const handleWorkClick = useCallback(() => {
    closeCaseStudy();
    requestNavigationIntent({
      destination: NAVIGATION_DESTINATIONS.OVERVIEW,
      source: 'top-nav-work',
      behavior: 'auto',
      legacyAction: 'directSelectZone+scrollToSection',
    });
  }, [closeCaseStudy, requestNavigationIntent]);

  const handleAboutClick = useCallback(() => {
    closeCaseStudy();
    requestNavigationIntent({
      destination: NAVIGATION_DESTINATIONS.ABOUT,
      source: 'top-nav-about',
      behavior: 'auto',
      legacyAction: 'directSelectZone+scrollToSection',
    });
  }, [closeCaseStudy, requestNavigationIntent]);

  const handleContactClick = useCallback(() => {}, []);

  const handleActiveProjectChange = useCallback((nextProjectId) => {
    setActiveProjectId(nextProjectId);
    setViewMode((prev) => {
      if (!nextProjectId) return 'overview';
      if (prev === 'caseStudy') return prev;
      return 'project';
    });
  }, []);

  const handleOpenCaseStudy = useCallback((projectId) => {
    if (!projectId) return;
    setActiveProjectId(projectId);
    setViewMode('caseStudy');
  }, []);

  const handleBackToProject = closeCaseStudy;

  const handleConfigUpdate = useCallback((newConfig) => {
    setConfig(newConfig);
    setAnimationConfig(buildAnimationConfig(newConfig));
    setCameraRuntimeOverrides(getCameraRuntimeOverrides(defaultConfig, newConfig));
    setProjectRuntimeOverrides(getProjectRuntimeOverrides(defaultConfig, newConfig));
  }, []);


  const handleRestartScene = useCallback(() => {
    const scrollContainer = document.querySelector('.scroll-container');

    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    if (loaderHideTimeoutRef.current) {
      clearTimeout(loaderHideTimeoutRef.current);
      loaderHideTimeoutRef.current = null;
    }
    if (loaderStartFadeTimeoutRef.current) {
      clearTimeout(loaderStartFadeTimeoutRef.current);
      loaderStartFadeTimeoutRef.current = null;
    }
    if (loaderRevealTimeoutRef.current) {
      clearTimeout(loaderRevealTimeoutRef.current);
      loaderRevealTimeoutRef.current = null;
    }

    setShowLoader(true);
    setExitLoader(false);

    loaderStartFadeTimeoutRef.current = setTimeout(() => {
      loaderStartFadeTimeoutRef.current = null;
      beginLoaderFadeOut(() => {
        setSceneRestartToken((prev) => prev + 1);
      });
    }, 60);
  }, [beginLoaderFadeOut]);

  const handleMaterialChange = useCallback((variant) => {
    if (import.meta.env.DEV) console.log("Changing material variant to:", variant);
    setMaterialVariant(variant);
  }, []);
  
  const handleToggleEffect = useCallback((effect, enabled, params = null) => {
    setEffectsEnabled(prev => ({
      ...prev,
      [effect]: enabled
    }));
    
    if (params) {
      setPostProcessingConfig(prev => ({
        ...prev,
        [effect]: {
          ...prev[effect],
          ...params
        }
      }));
    }
  }, []);
  
  // UPDATED: Performance config handler with V2 profile management
  const handlePerformanceConfigUpdate = useCallback((newConfig) => {
    if (import.meta.env.DEV) console.log("🔧 Performance config update:", newConfig);

    // Update performance profile through the V2 manager
    if (newConfig.pbrQuality && newConfig.pbrQuality !== performanceProfile.pbrQuality) {
      // This is a tier change, use the proper method
      let newTier = 'medium';
      if (newConfig.pbrQuality === 'high') newTier = 'high';
      else if (newConfig.pbrQuality === 'low') newTier = 'low';

      const overrides = {};
      if (newTier === 'low') overrides.simplifiedAnimations = false;
      if (typeof newConfig.useNormalMaps === 'boolean') overrides.useNormalMaps = newConfig.useNormalMaps;
      updateProfile(newTier, overrides);
    } else if (
      typeof newConfig.renderScale === 'number' &&
      newConfig.renderScale !== performanceProfile.renderScale
    ) {
      // Allow manual adjustment of render scale
      updateProfile(performanceTier, { renderScale: newConfig.renderScale });
    } else if (
      typeof newConfig.simplifiedAnimations === 'boolean' &&
      newConfig.simplifiedAnimations !== performanceProfile.simplifiedAnimations
    ) {
      updateProfile(performanceTier, { simplifiedAnimations: newConfig.simplifiedAnimations });
    } else if (
      typeof newConfig.useNormalMaps === 'boolean' &&
      newConfig.useNormalMaps !== performanceProfile.useNormalMaps
    ) {
      updateProfile(performanceTier, { useNormalMaps: newConfig.useNormalMaps });
    } else {
      // For other config changes, update local effects
      if (newConfig.postProcessing) {
        setEffectsEnabled(newConfig.postProcessing);
        setPostProcessingConfig(newConfig.postProcessing);
      }
    }
  }, [performanceProfile, performanceTier, updateProfile]);

  const toggleUI = useCallback(() => {
    setShowUI(!showUI);
  }, [showUI]);

  const togglePerfDebug = useCallback(() => {
    const next = !perfDebug;
    window.__PERF_DEBUG__ = next;
    setPerfDebug(next);
    if (import.meta.env.DEV) {
      console.log(`🛠️ Performance debug ${next ? 'enabled' : 'disabled'}`);
    }
  }, [perfDebug]);

  // Toggle body scrolling based on app readiness
  useEffect(() => {
    document.body.style.overflow = 'hidden';
  }, [isAppReady]);

  // UI Hide Toggle Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInputField = e.target.tagName === 'INPUT' || 
                          e.target.tagName === 'TEXTAREA' || 
                          e.target.isContentEditable;
      
      if (isInputField) return;
      
      if (e.key === 'u' || e.key === 'U') {
        if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
          e.preventDefault();
          setHideAllUI(prev => {
            const newState = !prev;
            if (import.meta.env.DEV) console.log(`🎨 UI Hidden: ${newState ? 'ON' : 'OFF'}`);
            return newState;
          });
        }
      }

      if (e.key === 'p' || e.key === 'P') {
        if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
          e.preventDefault();
          const next = !window.__PERF_DEBUG__;
          window.__PERF_DEBUG__ = next;
          setPerfDebug(next);
          if (import.meta.env.DEV) console.log(`🛠️ Performance debug ${next ? 'enabled' : 'disabled'}`);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Get canvas props based on performance profile
  const getOptimalCanvasProps = useCallback(() => {
    if (!performanceProfile) return {};
    
    return {
      gl: {
        antialias: performanceProfile.antialiasing !== false,
        powerPreference: performanceTier === 'high' ? 'high-performance' : 'default'
      },
      dpr: [
        1,
        Math.min(performanceProfile.maxPixelRatio || 2, window.devicePixelRatio) *
          (performanceProfile.renderScale || 1)
      ]
    };
  }, [performanceProfile, performanceTier]);

  const getOptimalEnvironmentProps = useCallback(() => {
    if (!performanceProfile) return {};
    
    return {
      files: defaultConfig.hdriPathForTier(performanceProfile.hdriQuality || 'medium')
    };
  }, [performanceProfile]);

  // UPDATED: Determine loader message and early return before app mounts
  let statusMessage = '';
  if (initProgress < 100) {
    statusMessage = 'Initializing...';
  } else if (!performanceReady) {
    statusMessage = 'Optimizing for your device...';
  } else if (!assetsReady) {
    if (currentAsset && /loaded|failed|timed out/i.test(currentAsset)) {
      statusMessage = 'Loading assets...';
    } else {
      statusMessage = currentAsset || 'Loading assets...';
    }
  } else {
    statusMessage = 'Finishing up...';
  }

  if (!isAppReady && !exitLoader) {
    // The frame ships with the loader too, otherwise the corners would square off
    // for the whole load and then round on hand-off.
    return (
      <>
        <LoaderV2
          initProgress={initProgress / 100}
          assetProgress={assetProgressHook / 100}
          testProgress={testProgressHook / 100}
          statusMessage={statusMessage}
        />
        <div className="app-frame" aria-hidden="true" />
      </>
    );
  }

  return (
    <>
      {/* UI Hide Toggle Button */}
      <button
        onClick={() => setHideAllUI(!hideAllUI)}
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          zIndex: 99999,
          backgroundColor: hideAllUI ? '#64ffda' : 'rgba(0, 0, 0, 0.7)',
          color: hideAllUI ? '#000' : 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        {hideAllUI ? 'Show UI (U)' : 'Hide UI (U)'}
      </button>

      {/* Navigation Bar */}
      {!hideAllUI && (
        <Navigation
          activeLabel={activeNavLabel}
          onHomeClick={handleHomeClick}
          onWorkClick={handleWorkClick}
          onAboutClick={handleAboutClick}
          onContactClick={handleContactClick}
          color={navColor}
        />
      )}

      {/* UPDATED: FPS Display with V2 performance tier info */}
      {!hideAllUI && (
        <FpsDisplay 
          visible={true}
          position="top-right"
          showDetails={false}
        />
      )}
      
      {/* UPDATED: Performance alerts with V2 tier-appropriate thresholds */}
      {!hideAllUI && (
        <PerformanceAlert
          visible={true}
          onPerformanceIssue={(data) => {
            if (import.meta.env.DEV) console.warn('Performance issue detected:', data);
          }}
        />
      )}

      {/* Master Animation Coordinator */}
      <MasterAnimationCoordinator
        debugMode={import.meta.env.DEV}
        onAnimationStateChange={handleAnimationStateChange}
        config={animationConfig}
        restartToken={sceneRestartToken}
        viewMode={viewMode}
        activeProjectId={activeProjectId}
      >
        {/* Fixed 3D Canvas */}
        {/* Restart remounts this (key includes sceneRestartToken) so the camera
            controller re-mounts fresh and replays the FULL intro from the authored
            intro pose — exactly like a page reload. The animation controller's
            introReplay effect resets controller state to a clean hero (it must NOT
            cycle through a separate 'intro' cameraState, or that becomes a SECOND
            intro trigger racing the remount — the old "plays twice" bug). */}
        <Fixed3DCanvas
          key={`${performanceProfile?.renderScale ?? 'default'}-${sceneRestartToken}`}
          ref={fixedCanvasRef}
          restartToken={sceneRestartToken}
          materialVariant={materialVariant}
          effectsEnabled={effectsEnabled}
          postProcessingConfig={postProcessingConfig}
          performanceProfile={performanceProfile}
          config={config}
          cameraRuntimeOverrides={cameraRuntimeOverrides}
          projectRuntimeOverrides={projectRuntimeOverrides}
          canvasProps={getOptimalCanvasProps()}
          environmentProps={getOptimalEnvironmentProps()}
          isMobile={isMobile}
          paused={sceneFrozen}
        />
      </MasterAnimationCoordinator>

      {/* About scrim — fixed viewport layer sitting between the 3D canvas
          (z-index 1) and the scrollable content (z-index 10). Fades in/out with
          the About zone and never scrolls, so the copy stays legible over the
          scene without the scrim ever appearing to move. */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 5,
          pointerEvents: 'none',
          background: 'rgba(6, 8, 12, 0.42)',
          backdropFilter: aboutScrimBlur ? 'blur(5px)' : 'none',
          WebkitBackdropFilter: aboutScrimBlur ? 'blur(5px)' : 'none',
          opacity: settledSection === 'about' ? 1 : 0,
          transition: 'opacity 450ms ease'
        }}
      />

      {/* Vertical energy line — one continuous 1px rail from the hero CTA
          through the full work overview. Fixed layer between the 3D canvas and
          the scrollable content; decorative and pointer-transparent. */}
      {!hideAllUI && <VerticalEnergyLine />}

      {/* Scrollable Content */}
      <ScrollablePortfolio
        snapSpeed={snapSpeed}
        hideContent={hideAllUI}
        viewMode={viewMode}
        activeProjectId={activeProjectId}
        onActiveProjectChange={handleActiveProjectChange}
        onOpenCaseStudy={handleOpenCaseStudy}
        onBackToProject={handleBackToProject}
        onSettledSectionChange={setSettledSection}
      />

      {/* Case study — a self-contained layer over the portfolio. Sits below the
          top nav so the site navigation stays available while reading. */}
      <CaseStudyOverlay
        project={activeProject}
        open={caseStudyOpen}
        onClose={closeCaseStudy}
        onToneChange={setCaseStudyNavTone}
        onSceneNeededChange={setCaseStudySceneNeeded}
      />

      {/* UI Controls */}
      {!hideAllUI && (
        <ControlsToggle 
          showUI={showUI} 
          toggleUI={toggleUI} 
          disabled={false}
        />
      )}
      
      {!hideAllUI && showUI && (
        <TabbedControlPanel 
          visible={true}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { label: 'Crystal' },
            { label: 'Materials' },
            { label: 'Effects' },
            { label: 'Performance' },
            { label: 'Scroll' }
          ]}
        >
          <CrystalControls config={config} onUpdate={handleConfigUpdate} onRestartScene={handleRestartScene} />
          
          <div>
            <MaterialSelector currentVariant={materialVariant} onChange={handleMaterialChange} />
          </div>
          
          <PostProcessingControls 
            effectsEnabled={effectsEnabled}
            onToggleEffect={handleToggleEffect}
            visible={true} 
            config={config}
          />
          
          <PerformanceControls
            performanceConfig={performanceProfile}
            onConfigUpdate={handlePerformanceConfigUpdate}
            visible={true}
            onToggleDebug={togglePerfDebug}
            debugEnabled={perfDebug}
          />

          <div>
            <h2 style={{ margin: '0 0 15px 0', fontSize: '16px', display: 'flex', alignItems: 'center' }}>
              <span role="img" aria-label="Scroll" style={{ marginRight: '8px' }}>📜</span>
              Scroll Settings
            </h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                fontSize: '14px', 
                marginBottom: '10px', 
                display: 'block',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                Snap Speed:
              </label>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '8px',
                marginBottom: '10px'
              }}>
                {['fast', 'medium', 'slow', 'extra-slow', 'no-snap'].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSnapSpeedChange(speed)}
                    style={{
                      backgroundColor: snapSpeed === speed ? '#64ffda' : 'rgba(255, 255, 255, 0.1)',
                      color: snapSpeed === speed ? '#000' : 'white',
                      border: `1px solid ${snapSpeed === speed ? '#64ffda' : 'rgba(255, 255, 255, 0.2)'}`,
                      padding: '8px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: snapSpeed === speed ? 'bold' : 'normal',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s ease',
                      minHeight: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {speed.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </TabbedControlPanel>
      )}
      
      {!hideAllUI && (
        <AccessibilityInstructions visible={true} />
      )}

      {/* UPDATED: Enhanced Debug Panel with V2 performance system info */}
      {perfDebug && (
        <PerformanceDebugPanel
          performanceConfig={performanceProfile}
          hasInitialized={performanceReady}
          initialProfileApplied={!!performanceProfile}
          tier={performanceTier}
          testResults={testResults}
          debugInfo={debugInfo}
          onForceRetest={forceRetest}
          onClearCache={clearCache}
        />
      )}

      {showLoader && (
        <LoaderV2
          initProgress={exitLoader ? 1 : initProgress / 100}
          assetProgress={exitLoader ? 1 : assetProgressHook / 100}
          testProgress={exitLoader ? 1 : testProgressHook / 100}
          statusMessage={exitLoader ? 'Launching...' : statusMessage}
          exiting={exitLoader}
        />
      )}

      {/* App frame — rounds the corners on mobile. Last in the tree and above
          every other layer, including the loader, so the frame is unbroken from
          the first paint. Decorative and pointer-transparent. */}
      <div className="app-frame" aria-hidden="true" />
    </>
  );
}

export default App;
