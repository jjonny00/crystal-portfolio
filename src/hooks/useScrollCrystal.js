// src/hooks/useScrollCrystal.js - SIMPLIFIED VERSION for debugging
// This version removes complexity to isolate the scrolling issue

import { useState, useEffect, useCallback, useRef } from 'react';
import { CRYSTAL_STATES } from '../machines/crystalStateMachine';
import { getProjectByFacetKey } from '../data/projects';

/**
 * SIMPLIFIED scroll sections - easier to debug
 */
const SCROLL_SECTIONS = {
  INTRO_CLOSE: {
    key: 'intro-close',
    crystalState: CRYSTAL_STATES.WHOLE,
    threshold: 0,
    duration: 0.2,
    title: 'Intro Close'
  },
  
  INTRO: {
    key: 'intro',
    crystalState: CRYSTAL_STATES.WHOLE,
    threshold: 0.2,
    duration: 0.2,
    title: 'Intro'
  },
  
  PROJECTS_OVERVIEW: {
    key: 'projects-overview',
    crystalState: CRYSTAL_STATES.EXPLODED,
    threshold: 0.4,
    duration: 0.2,
    title: 'Projects'
  },
  
  PROJECT_EMPATHY: {
    key: 'project-empathy',
    crystalState: CRYSTAL_STATES.PROJECT_SELECTED,
    threshold: 0.6,
    duration: 0.15,
    title: 'Empathy',
    projectKey: 'empathy'
  },
  
  ABOUT: {
    key: 'about',
    crystalState: CRYSTAL_STATES.WHOLE,
    threshold: 0.8,
    duration: 0.2,
    title: 'About'
  }
};

const SECTIONS_ARRAY = Object.values(SCROLL_SECTIONS);

/**
 * SIMPLIFIED scroll crystal hook
 */
export const useScrollCrystal = (options = {}) => {
  const {
    enableScrollControl = true,
    debugMode = false,
    onSectionChange = null
  } = options;

  // Basic state
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(SCROLL_SECTIONS.INTRO_CLOSE);
  const [crystalState, setCrystalState] = useState(CRYSTAL_STATES.WHOLE);
  const [selectedProject, setSelectedProject] = useState(null);
  const [hoveredProject, setHoveredProject] = useState(null);
  
  // Simple visible sections
  const [visibleSections, setVisibleSections] = useState({
    intro: true,
    about: false,
    footer: false
  });

  // Calculate scroll progress
  const updateScrollProgress = useCallback(() => {
    if (!enableScrollControl) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    if (scrollHeight <= 0) {
      console.warn('📜 No scrollable content detected!');
      return;
    }

    const progress = Math.min(Math.max(scrollTop / scrollHeight, 0), 1);
    setScrollProgress(progress);

    if (debugMode) {
      console.log(`📜 Scroll: ${Math.round(progress * 100)}% (${scrollTop}px / ${scrollHeight}px)`);
    }
  }, [enableScrollControl, debugMode]);

  // Find current section
  const getCurrentSection = useCallback((progress) => {
    for (let i = SECTIONS_ARRAY.length - 1; i >= 0; i--) {
      const section = SECTIONS_ARRAY[i];
      if (progress >= section.threshold) {
        return section;
      }
    }
    return SCROLL_SECTIONS.INTRO_CLOSE;
  }, []);

  // Update section when scroll changes
  useEffect(() => {
    const newSection = getCurrentSection(scrollProgress);
    
    if (newSection.key !== currentSection.key) {
      const oldSection = currentSection;
      
      console.log(`🔄 Section: ${oldSection.key} → ${newSection.key} (${Math.round(scrollProgress * 100)}%)`);
      
      setCurrentSection(newSection);
      setCrystalState(newSection.crystalState);
      
      // Update selected project
      if (newSection.projectKey) {
        setSelectedProject(newSection.projectKey);
      } else {
        setSelectedProject(null);
      }

      // Update visible sections
      setVisibleSections({
        intro: newSection.key.includes('intro'),
        about: newSection.key === 'about',
        footer: newSection.key === 'footer'
      });

      // Callback
      if (onSectionChange) {
        onSectionChange(newSection, oldSection);
      }
    }
  }, [scrollProgress, currentSection.key, getCurrentSection, onSectionChange]);

  // Set up scroll listener
  useEffect(() => {
    if (!enableScrollControl) return;

    console.log('📜 Setting up scroll listener...');

    const handleScroll = () => {
      updateScrollProgress();
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial calculation
    updateScrollProgress();
    
    // Debug initial state
    setTimeout(() => {
      console.log('📜 Initial scroll setup:', {
        scrollHeight: document.documentElement.scrollHeight,
        windowHeight: window.innerHeight,
        bodyHeight: document.body.scrollHeight,
        scrollTop: window.pageYOffset
      });
    }, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enableScrollControl, updateScrollProgress]);

  // Navigation functions
  const goToSection = useCallback((sectionKey) => {
    const section = SCROLL_SECTIONS[sectionKey.toUpperCase()] || 
                   Object.values(SCROLL_SECTIONS).find(s => s.key === sectionKey);
    
    if (!section) {
      console.warn(`Section '${sectionKey}' not found`);
      return;
    }

    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetScroll = section.threshold * scrollHeight;
    
    console.log(`🎯 Navigating to ${sectionKey}: ${targetScroll}px`);
    
    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  }, []);

  const selectProject = useCallback((projectKey) => {
    goToSection(`project-${projectKey}`);
  }, [goToSection]);

  const handleProjectClose = useCallback(() => {
    goToSection('projects-overview');
  }, [goToSection]);

  const handleLoopBack = useCallback(() => {
    goToSection('intro-close');
  }, [goToSection]);

  // Helper functions
  const getCurrentProject = useCallback(() => {
    if (!selectedProject) return null;
    return getProjectByFacetKey(selectedProject);
  }, [selectedProject]);

  const isInProjectSection = useCallback(() => {
    return currentSection.key.startsWith('project-');
  }, [currentSection.key]);

  // Quick state checks
  const isInIntro = currentSection.key.includes('intro');
  const isInExplosion = currentSection.key === 'projects-overview';
  const isInProjects = currentSection.key.startsWith('project-');
  const isInReform = currentSection.key === 'about';

  // Return simplified data
  return {
    // Core state
    scrollProgress,
    rawScrollProgress: scrollProgress, // Same as smooth for now
    currentSection,
    crystalState,
    isTransitioning: false, // Simplified

    // Project state
    selectedProject,
    hoveredProject,
    setHoveredProject,

    // UI visibility
    visibleSections,

    // Navigation
    goToSection,
    selectProject,
    deselectProject: handleProjectClose,
    handleProjectClose,
    handleLoopBack,

    // Helpers
    getCurrentProject,
    isInProjectSection,

    // State checks
    isInIntro,
    isInExplosion,
    isInProjects,
    isInReform,

    // Project info
    projectCount: 1, // Simplified
    currentProjectIndex: 0,

    // Debug
    isScrolling: false,
    scrollVelocity: 0,
    debugMode,
    sections: SCROLL_SECTIONS
  };
};