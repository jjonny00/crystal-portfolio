// src/hooks/useScrollCrystal.js - Enhanced with smooth animations and proper state transitions
// Fixed fracture/explosion animations and added smooth easing

import { useState, useEffect, useCallback, useRef } from 'react';
import { CRYSTAL_STATES, CRYSTAL_EVENTS, getNextState } from '../machines/crystalStateMachine';
import { getProjectByFacetKey } from '../data/projects';

/**
 * Enhanced scroll sections with proper animation states
 */
const SCROLL_SECTIONS = {
  INTRO_CLOSE: {
    key: 'intro-close',
    index: 0,
    crystalState: CRYSTAL_STATES.WHOLE,
    cameraState: 'INTRO_CLOSE',
    threshold: 0,
    duration: 0.06, // Slightly longer intro-close section
    title: 'Multifaceted Designer',
    subtitle: 'Jon Shaw',
    enableScrollTransition: true
  },
  
  INTRO: {
    key: 'intro',
    index: 1,
    crystalState: CRYSTAL_STATES.WHOLE,
    cameraState: 'INTRO',
    threshold: 0.06,
    duration: 0.09, // Much longer intro section for slower transition
    title: 'Multifaceted Designer',
    subtitle: 'Scroll to explore',
    enableScrollTransition: true
  },
  
  // NEW: Fracture transition state - moved much later for slower intro
  FRACTURING: {
    key: 'fracturing',
    index: 2,
    crystalState: CRYSTAL_STATES.FRACTURING,
    cameraState: 'INTRO',
    threshold: 0.15, // Same position, but intro section is now longer
    duration: 0.03,
    title: 'Breaking Apart',
    subtitle: 'Revealing the facets',
    isTransition: true
  },
  
  // NEW: Explosion transition state  
  EXPLODING: {
    key: 'exploding',
    index: 3,
    crystalState: CRYSTAL_STATES.EXPLODING,
    cameraState: 'EXPLOSION',
    threshold: 0.18,
    duration: 0.04,
    title: 'Expanding',
    subtitle: 'Exploring the possibilities',
    isTransition: true
  },
  
  PROJECTS_OVERVIEW: {
    key: 'projects-overview', 
    index: 4,
    crystalState: CRYSTAL_STATES.EXPLODED,
    cameraState: 'EXPLOSION',
    threshold: 0.22,
    duration: 0.03,
    title: 'Featured Projects',
    subtitle: 'Explore my work across six design facets'
  },
  
  PROJECT_EMPATHY: {
    key: 'project-empathy',
    index: 5,
    crystalState: CRYSTAL_STATES.PROJECT_SELECTED,
    cameraState: 'PROJECT_EMPATHY',
    threshold: 0.25,
    duration: 0.08,
    title: 'Empathy',
    subtitle: 'Understanding user needs and pain points',
    projectKey: 'empathy'
  },
  
  PROJECT_NARRATIVE: {
    key: 'project-narrative',
    index: 6,
    crystalState: CRYSTAL_STATES.PROJECT_SELECTED,
    cameraState: 'PROJECT_NARRATIVE',
    threshold: 0.33,
    duration: 0.08,
    title: 'Narrative',
    subtitle: 'Guiding teams through compelling stories',
    projectKey: 'narrative'
  },
  
  PROJECT_CRAFT: {
    key: 'project-craft',
    index: 7,
    crystalState: CRYSTAL_STATES.PROJECT_SELECTED,
    cameraState: 'PROJECT_CRAFT',
    threshold: 0.41,
    duration: 0.08,
    title: 'Craft',
    subtitle: 'Precision in every design detail',
    projectKey: 'craft'
  },
  
  PROJECT_SYSTEM: {
    key: 'project-system',
    index: 8,
    crystalState: CRYSTAL_STATES.PROJECT_SELECTED,
    cameraState: 'PROJECT_SYSTEM',
    threshold: 0.49,
    duration: 0.08,
    title: 'System',
    subtitle: 'Building scalable design systems',
    projectKey: 'system'
  },
  
  PROJECT_LEADERSHIP: {
    key: 'project-leadership',
    index: 9,
    crystalState: CRYSTAL_STATES.PROJECT_SELECTED,
    cameraState: 'PROJECT_LEADERSHIP',
    threshold: 0.57,
    duration: 0.08,
    title: 'Leadership',
    subtitle: 'Empowering teams to do their best work',
    projectKey: 'leadership'
  },
  
  PROJECT_EXPLORATION: {
    key: 'project-exploration',
    index: 10,
    crystalState: CRYSTAL_STATES.PROJECT_SELECTED,
    cameraState: 'PROJECT_EXPLORATION',
    threshold: 0.65,
    duration: 0.08,
    title: 'Exploration',
    subtitle: 'Finding opportunities in ambiguity',
    projectKey: 'exploration'
  },
  
  // NEW: Reforming transition state before about
  REFORMING: {
    key: 'reforming',
    index: 11,
    crystalState: CRYSTAL_STATES.REFORMING,
    cameraState: 'INTRO',
    threshold: 0.73,
    duration: 0.05,
    title: 'Returning Home',
    subtitle: 'Bringing it all together',
    isTransition: true
  },
  
  ABOUT: {
    key: 'about',
    index: 12,
    crystalState: CRYSTAL_STATES.WHOLE,
    cameraState: 'INTRO', // Use INTRO instead of ABOUT since we don't have that state
    threshold: 0.78,
    duration: 0.12,
    title: 'About Me',
    subtitle: 'The story behind the facets'
  },
  
  FOOTER: {
    key: 'footer',
    index: 13,
    crystalState: CRYSTAL_STATES.WHOLE,
    cameraState: 'INTRO', // Use INTRO instead of FOOTER since we don't have that state
    threshold: 0.90,
    duration: 0.10,
    title: 'Let\'s Connect',
    subtitle: 'Ready to create something beautiful together?'
  }
};

// Convert to array for easier processing
const SECTIONS_ARRAY = Object.values(SCROLL_SECTIONS);

/**
 * Enhanced easing functions for ultra-smooth scroll animations
 */
const easingFunctions = {
  // Ultra-smooth ease out for natural scroll stopping
  easeOut: (t) => 1 - Math.pow(1 - t, 4), // More pronounced ease out
  
  // Silky smooth ease in out for transitions  
  easeInOut: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
  
  // Extra gentle ease for continuous scrolling - perfect for intro camera movement
  gentle: (t) => t * t * t * (t * (t * 6 - 15) + 10), // Smoothstep polynomial
  
  // NEW: Ultra-smooth intro easing - specifically for camera movement
  introSmooth: (t) => {
    // Custom bezier-like curve for silky smooth intro movement
    if (t < 0.1) return 0; // Stay still at the beginning
    const adjusted = (t - 0.1) / 0.9; // Remap to 0-1 range
    return adjusted * adjusted * adjusted * (adjusted * (adjusted * 6 - 15) + 10);
  }
};

/**
 * Enhanced scroll crystal hook with smooth animations
 */
export const useScrollCrystal = (options = {}) => {
  const {
    enableScrollControl = true,
    debugMode = false,
    smoothTransitions = true,
    onSectionChange = null,
    easingDuration = 1200, // Increased from 800ms for more luxurious feel
    easingFunction = easingFunctions.gentle // Use gentle easing by default
  } = options;

  // Core state
  const [rawScrollProgress, setRawScrollProgress] = useState(0);
  const [smoothScrollProgress, setSmoothScrollProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(SCROLL_SECTIONS.INTRO_CLOSE);
  const [crystalState, setCrystalState] = useState(CRYSTAL_STATES.WHOLE);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Project selection state
  const [selectedProject, setSelectedProject] = useState(null);
  const [hoveredProject, setHoveredProject] = useState(null);
  
  // Visible sections state for UI components
  const [visibleSections, setVisibleSections] = useState({
    intro: true,
    about: false,
    footer: false
  });

  // Refs for smooth scrolling
  const lastSectionRef = useRef(currentSection);
  const scrollTimeoutRef = useRef(null);
  const easingAnimationRef = useRef(null);
  const lastScrollTime = useRef(Date.now());
  const isScrolling = useRef(false);
  const scrollVelocity = useRef(0);
  const lastRawProgress = useRef(0);

  // Calculate raw scroll progress
  const updateRawScrollProgress = useCallback(() => {
    if (!enableScrollControl) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    if (scrollHeight <= 0) {
      setRawScrollProgress(0);
      return;
    }

    const progress = Math.min(Math.max(scrollTop / scrollHeight, 0), 1);
    
    // Calculate velocity for smooth transitions
    const now = Date.now();
    const timeDelta = now - lastScrollTime.current;
    const progressDelta = progress - lastRawProgress.current;
    
    if (timeDelta > 0) {
      scrollVelocity.current = progressDelta / timeDelta;
    }
    
    setRawScrollProgress(progress);
    lastRawProgress.current = progress;
    lastScrollTime.current = now;

    if (debugMode && Math.random() < 0.05) { // Less frequent logging
      console.log(`📜 Raw scroll progress: ${Math.round(progress * 100)}%`);
    }
  }, [enableScrollControl, debugMode]);

  // Smooth scroll progress with easing when scroll stops
  useEffect(() => {
    if (!smoothTransitions) {
      setSmoothScrollProgress(rawScrollProgress);
      return;
    }

    // Cancel previous easing animation
    if (easingAnimationRef.current) {
      cancelAnimationFrame(easingAnimationRef.current);
    }

    const startProgress = smoothScrollProgress;
    const targetProgress = rawScrollProgress;
    const progressDiff = targetProgress - startProgress;

    // If difference is very small, just set directly
    if (Math.abs(progressDiff) < 0.001) {
      setSmoothScrollProgress(targetProgress);
      return;
    }

    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / easingDuration, 1);
      
      // Apply easing function
      const easedT = easingFunction(t);
      const currentProgress = startProgress + (progressDiff * easedT);
      
      setSmoothScrollProgress(currentProgress);
      
      if (t < 1) {
        easingAnimationRef.current = requestAnimationFrame(animate);
      } else {
        setSmoothScrollProgress(targetProgress);
        isScrolling.current = false;
      }
    };

    // Only use smooth easing if we're not actively scrolling
    if (!isScrolling.current && Math.abs(scrollVelocity.current) < 0.001) {
      animate();
    } else {
      // Direct update when actively scrolling
      setSmoothScrollProgress(rawScrollProgress);
    }

  }, [rawScrollProgress, smoothTransitions, easingDuration, easingFunction, smoothScrollProgress]);

  // Find current section based on scroll progress
  const getCurrentSectionFromProgress = useCallback((progress) => {
    // Find the section that contains this progress
    for (let i = SECTIONS_ARRAY.length - 1; i >= 0; i--) {
      const section = SECTIONS_ARRAY[i];
      if (progress >= section.threshold) {
        return section;
      }
    }
    return SCROLL_SECTIONS.INTRO_CLOSE;
  }, []);

  // Update current section when smooth scroll progress changes
  useEffect(() => {
    const newSection = getCurrentSectionFromProgress(smoothScrollProgress);
    
    if (newSection.key !== currentSection.key) {
      const oldSection = currentSection;
      
      if (debugMode) {
        console.log(`🔄 Section change: ${oldSection.key} → ${newSection.key}`);
        console.log(`🎭 Crystal state: ${newSection.crystalState}`);
      }

      setCurrentSection(newSection);
      
      // IMPORTANT: Use proper state machine transitions for crystal state
      if (newSection.crystalState !== crystalState) {
        setCrystalState(newSection.crystalState);
        
        // Force transition timing for fracture/explosion states
        if (newSection.crystalState === CRYSTAL_STATES.FRACTURING) {
          setTimeout(() => {
            if (currentSection.crystalState === CRYSTAL_STATES.FRACTURING) {
              setCrystalState(CRYSTAL_STATES.EXPLODING);
            }
          }, 350); // Match fracture duration from config
        }
      }
      
      // Update selected project if in project section
      if (newSection.projectKey) {
        setSelectedProject(newSection.projectKey);
      } else if (!newSection.key.startsWith('project-')) {
        setSelectedProject(null);
      }

      // Update visible sections for UI
      setVisibleSections({
        intro: newSection.key === 'intro-close' || newSection.key === 'intro',
        about: newSection.key === 'about', // Only show when actually in about section (after reform)
        footer: newSection.key === 'footer'
      });

      // Call section change callback
      if (onSectionChange) {
        onSectionChange(newSection, oldSection);
      }

      lastSectionRef.current = newSection;
    }
  }, [smoothScrollProgress, currentSection.key, crystalState, onSectionChange, debugMode, getCurrentSectionFromProgress]);

  // Set up scroll listener with improved detection
  useEffect(() => {
    if (!enableScrollControl) return;

    let scrollTimer = null;

    const handleScroll = () => {
      isScrolling.current = true;
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }

      // Update immediately
      updateRawScrollProgress();

      // Set transitioning state
      setIsTransitioning(true);

      // Detect when scrolling stops for smooth easing
      scrollTimer = setTimeout(() => {
        isScrolling.current = false;
      }, 50);

      // Clear transitioning state after scroll settles
      scrollTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 200);
    };

    // Use passive listeners for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial calculation
    updateRawScrollProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
      if (easingAnimationRef.current) {
        cancelAnimationFrame(easingAnimationRef.current);
      }
    };
  }, [enableScrollControl, updateRawScrollProgress]);

  // Navigation functions
  const goToSection = useCallback((sectionKey) => {
    const section = Object.values(SCROLL_SECTIONS).find(s => s.key === sectionKey);
    if (!section) {
      console.warn(`Section '${sectionKey}' not found`);
      return;
    }

    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetScroll = section.threshold * scrollHeight;
    
    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });

    if (debugMode) {
      console.log(`🎯 Navigating to section: ${sectionKey}`);
    }
  }, [debugMode]);

  const selectProject = useCallback((projectKey) => {
    const projectSectionKey = `project-${projectKey}`;
    goToSection(projectSectionKey);
  }, [goToSection]);

  const deselectProject = useCallback(() => {
    goToSection('projects-overview');
  }, [goToSection]);

  const handleProjectClose = useCallback(() => {
    deselectProject();
  }, [deselectProject]);

  const handleLoopBack = useCallback(() => {
    goToSection('intro-close');
  }, [goToSection]);

  // Helper functions
  const getCurrentProject = useCallback(() => {
    if (!selectedProject) return null;
    return getProjectByFacetKey(selectedProject);
  }, [selectedProject]);

  const isInProjectSection = useCallback(() => {
    return currentSection.key.startsWith('project-') && currentSection.key !== 'projects-overview';
  }, [currentSection.key]);

    // State checks - Updated to include reforming transition
    const isInIntro = currentSection.key === 'intro-close' || currentSection.key === 'intro';
    const isInExplosion = currentSection.key === 'projects-overview';
    const isInProjects = currentSection.key.startsWith('project-') && currentSection.key !== 'projects-overview';
    const isInReform = currentSection.key === 'reforming' || currentSection.key === 'about' || currentSection.key === 'footer';

  // Get project count for navigation
  const projectSections = SECTIONS_ARRAY.filter(s => s.projectKey);
  const projectCount = projectSections.length;
  const currentProjectIndex = selectedProject ? 
    projectSections.findIndex(s => s.projectKey === selectedProject) : -1;

  // Return the complete scroll crystal data object
  return {
    // Core state - use smooth progress for animations
    scrollProgress: smoothScrollProgress,
    rawScrollProgress, // Also provide raw progress if needed
    currentSection,
    crystalState,
    isTransitioning,

    // Project state
    selectedProject,
    hoveredProject,
    setHoveredProject,

    // UI visibility state
    visibleSections,

    // Navigation functions
    goToSection,
    selectProject,
    deselectProject,
    handleProjectClose,
    handleLoopBack,

    // Helper functions
    getCurrentProject,
    isInProjectSection,

    // Quick state checks
    isInIntro,
    isInExplosion, 
    isInProjects,
    isInReform,

    // Project navigation info
    projectCount,
    currentProjectIndex,

    // Scroll state info
    isScrolling: isScrolling.current,
    scrollVelocity: scrollVelocity.current,

    // Debug info
    debugMode,
    sections: SCROLL_SECTIONS
  };
};