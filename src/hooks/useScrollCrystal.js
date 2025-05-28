// hooks/useScrollCrystal.js
// Main hook for scroll-driven crystal experience

import { useState, useEffect, useCallback, useRef } from 'react';
import { CRYSTAL_STATES, CRYSTAL_EVENTS } from '../machines/crystalStateMachine';
import { projects } from '../data/projects';

/**
 * Scroll sections configuration
 * Defines the scroll-based narrative structure
 */
const SCROLL_SECTIONS = {
  INTRO: 'intro',           // Crystal idle state
  EXPLOSION: 'explosion',   // Crystal explodes
  PROJECTS: 'projects',     // Individual project views
  REFORM: 'reform'          // Crystal reforms back to intro
};

/**
 * Custom hook for scroll-driven crystal experience
 */
export const useScrollCrystal = ({
  onStateChange,
  onProjectChange,
  config
}) => {
  // Core state
  const [currentSection, setCurrentSection] = useState(SCROLL_SECTIONS.INTRO);
  const [crystalState, setCrystalState] = useState(CRYSTAL_STATES.WHOLE);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(-1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Refs for tracking scroll behavior
  const scrollTimeoutRef = useRef(null);
  const lastScrollY = useRef(0);
  const scrollDirection = useRef('down');
  const transitionTimerRef = useRef(null);
  
  // Calculate total scroll sections
  const totalSections = 2 + projects.length + 1; // intro + explosion + projects + reform
  const sectionHeight = 100; // Each section is 100vh
  
  /**
   * Handle scroll position and determine current section
   */
  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Determine scroll direction
    if (scrollY > lastScrollY.current) {
      scrollDirection.current = 'down';
    } else if (scrollY < lastScrollY.current) {
      scrollDirection.current = 'up';
    }
    lastScrollY.current = scrollY;
    
    // Calculate current section based on scroll position
    const rawSectionIndex = Math.floor(scrollY / windowHeight);
    const sectionProgress = (scrollY % windowHeight) / windowHeight;
    
    // Update overall scroll progress (0-1)
    const totalProgress = Math.min(scrollY / (documentHeight - windowHeight), 1);
    setScrollProgress(totalProgress);
    
    // Determine current section and handle transitions
    let newSection = currentSection;
    let newCrystalState = crystalState;
    let newProjectIndex = currentProjectIndex;
    
    if (rawSectionIndex === 0) {
      // Section 0: Intro (Crystal idle)
      newSection = SCROLL_SECTIONS.INTRO;
      newCrystalState = CRYSTAL_STATES.WHOLE;
      newProjectIndex = -1;
      
    } else if (rawSectionIndex === 1) {
      // Section 1: Explosion trigger
      newSection = SCROLL_SECTIONS.EXPLOSION;
      
      if (sectionProgress > 0.3 && crystalState === CRYSTAL_STATES.WHOLE) {
        // Trigger explosion when 30% into section
        newCrystalState = CRYSTAL_STATES.FRACTURING;
        setIsTransitioning(true);
        
        // Schedule state transitions
        setTimeout(() => {
          setCrystalState(CRYSTAL_STATES.EXPLODING);
        }, config?.timing?.fracture?.duration || 350);
        
        setTimeout(() => {
          setCrystalState(CRYSTAL_STATES.EXPLODED);
          setIsTransitioning(false);
        }, (config?.timing?.fracture?.duration || 350) + (config?.timing?.camera?.explodeDuration || 1600));
      }
      
    } else if (rawSectionIndex >= 2 && rawSectionIndex < 2 + projects.length) {
      // Project sections
      const projectIndex = rawSectionIndex - 2;
      newSection = SCROLL_SECTIONS.PROJECTS;
      newProjectIndex = projectIndex;
      
      if (crystalState !== CRYSTAL_STATES.PROJECT_SELECTED || currentProjectIndex !== projectIndex) {
        newCrystalState = CRYSTAL_STATES.PROJECT_SELECTED;
      }
      
    } else if (rawSectionIndex >= 2 + projects.length) {
      // Final section: Reform
      newSection = SCROLL_SECTIONS.REFORM;
      
      if (crystalState !== CRYSTAL_STATES.REFORMING && crystalState !== CRYSTAL_STATES.WHOLE) {
        newCrystalState = CRYSTAL_STATES.REFORMING;
        setIsTransitioning(true);
        
        // Schedule reform completion
        setTimeout(() => {
          setCrystalState(CRYSTAL_STATES.WHOLE);
          setCurrentProjectIndex(-1);
          setIsTransitioning(false);
          
          // Auto-scroll back to top after reform
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 1000);
        }, config?.timing?.camera?.reformDuration || 900);
      }
    }
    
    // Update state if changes occurred
    if (newSection !== currentSection) {
      setCurrentSection(newSection);
    }
    
    if (newCrystalState !== crystalState) {
      setCrystalState(newCrystalState);
      if (onStateChange) {
        onStateChange(newCrystalState);
      }
    }
    
    if (newProjectIndex !== currentProjectIndex) {
      setCurrentProjectIndex(newProjectIndex);
      if (onProjectChange && newProjectIndex >= 0 && newProjectIndex < projects.length) {
        onProjectChange(projects[newProjectIndex]);
      }
    }
    
  }, [currentSection, crystalState, currentProjectIndex, onStateChange, onProjectChange, config]);
  
  /**
   * Debounced scroll handler
   */
  const debouncedScrollHandler = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      handleScroll();
    }, 16); // ~60fps
  }, [handleScroll]);
  
  /**
   * Set up scroll listeners and document height
   */
  useEffect(() => {
    // Set document height to accommodate all sections
    const totalHeight = totalSections * window.innerHeight;
    document.body.style.height = `${totalHeight}px`;
    
    // Add scroll listener
    window.addEventListener('scroll', debouncedScrollHandler, { passive: true });
    
    // Initial scroll check
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', debouncedScrollHandler);
      document.body.style.height = 'auto';
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, [debouncedScrollHandler, totalSections, handleScroll]);
  
  /**
   * Get current project data
   */
  const getCurrentProject = useCallback(() => {
    if (currentProjectIndex >= 0 && currentProjectIndex < projects.length) {
      return projects[currentProjectIndex];
    }
    return null;
  }, [currentProjectIndex]);
  
  /**
   * Get scroll-based rotation for idle crystal
   */
  const getIdleRotation = useCallback((time) => {
    if (currentSection !== SCROLL_SECTIONS.INTRO) return [0, 0, 0];
    
    // Very slow rotation when idle
    const baseRotationY = time * 0.05; // Slow Y-axis rotation
    const bobY = Math.sin(time * 0.3) * 0.02; // Subtle vertical movement
    
    return [0, baseRotationY, bobY];
  }, [currentSection]);
  
  /**
   * Get progress through current section
   */
  const getSectionProgress = useCallback(() => {
    const windowHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const sectionIndex = Math.floor(scrollY / windowHeight);
    const sectionProgress = (scrollY % windowHeight) / windowHeight;
    
    return {
      sectionIndex,
      progress: sectionProgress,
      totalProgress: scrollProgress
    };
  }, [scrollProgress]);
  
  /**
   * Manual navigation functions
   */
  const goToSection = useCallback((sectionType, projectIndex = 0) => {
    let targetScrollY = 0;
    
    switch (sectionType) {
      case SCROLL_SECTIONS.INTRO:
        targetScrollY = 0;
        break;
      case SCROLL_SECTIONS.EXPLOSION:
        targetScrollY = window.innerHeight;
        break;
      case SCROLL_SECTIONS.PROJECTS:
        targetScrollY = (2 + projectIndex) * window.innerHeight;
        break;
      case SCROLL_SECTIONS.REFORM:
        targetScrollY = (2 + projects.length) * window.innerHeight;
        break;
    }
    
    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth'
    });
  }, []);
  
  /**
   * Navigation helpers
   */
  const goToNextProject = useCallback(() => {
    if (currentProjectIndex < projects.length - 1) {
      goToSection(SCROLL_SECTIONS.PROJECTS, currentProjectIndex + 1);
    }
  }, [currentProjectIndex, goToSection]);
  
  const goToPrevProject = useCallback(() => {
    if (currentProjectIndex > 0) {
      goToSection(SCROLL_SECTIONS.PROJECTS, currentProjectIndex - 1);
    } else if (currentProjectIndex === 0) {
      goToSection(SCROLL_SECTIONS.EXPLOSION);
    }
  }, [currentProjectIndex, goToSection]);
  
  return {
    // State
    currentSection,
    crystalState,
    currentProjectIndex,
    scrollProgress,
    isTransitioning,
    scrollDirection: scrollDirection.current,
    
    // Data
    getCurrentProject,
    totalSections,
    projectCount: projects.length,
    
    // Utilities
    getIdleRotation,
    getSectionProgress,
    
    // Navigation
    goToSection,
    goToNextProject,
    goToPrevProject,
    
    // Progress indicators
    isInIntro: currentSection === SCROLL_SECTIONS.INTRO,
    isInExplosion: currentSection === SCROLL_SECTIONS.EXPLOSION,
    isInProjects: currentSection === SCROLL_SECTIONS.PROJECTS,
    isInReform: currentSection === SCROLL_SECTIONS.REFORM
  };
};