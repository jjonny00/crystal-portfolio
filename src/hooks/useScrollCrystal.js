// src/hooks/useScrollCrystal.js
// Comprehensive scroll-based crystal control system

import { useState, useEffect, useCallback, useRef } from 'react';
import { CRYSTAL_STATES, CRYSTAL_EVENTS, getNextState } from '../machines/crystalStateMachine';

/**
 * Scroll sections configuration
 * Defines the structure and behavior of each scroll section
 */
const SCROLL_SECTIONS = {
  INTRO: {
    key: 'intro',
    index: 0,
    crystalState: CRYSTAL_STATES.WHOLE,
    cameraState: 'INTRO',
    threshold: 0, // 0% scroll
    duration: 0.25, // 25% of viewport height
    title: 'Multifaceted Designer',
    subtitle: 'Jon Shaw'
  },
  
  PROJECTS: {
    key: 'projects', 
    index: 1,
    crystalState: CRYSTAL_STATES.EXPLODED,
    cameraState: 'EXPLOSION',
    threshold: 0.25, // 25% scroll
    duration: 0.5, // 50% of viewport height (25% to 75%)
    title: 'Featured Projects',
    subtitle: 'Explore my work across six design facets'
  },
  
  ABOUT: {
    key: 'about',
    index: 2, 
    crystalState: CRYSTAL_STATES.WHOLE,
    cameraState: 'ABOUT',
    threshold: 0.75, // 75% scroll
    duration: 0.15, // 15% of viewport height (75% to 90%)
    title: 'About Me',
    subtitle: 'The story behind the facets'
  },
  
  FOOTER: {
    key: 'footer',
    index: 3,
    crystalState: CRYSTAL_STATES.WHOLE, 
    cameraState: 'FOOTER',
    threshold: 0.9, // 90% scroll
    duration: 0.1, // 10% of viewport height (90% to 100%)
    title: 'Let\'s Connect',
    subtitle: 'Ready to create something beautiful together?'
  }
};

/**
 * Custom hook for scroll-based crystal control
 * Manages crystal state, camera positions, and section visibility
 */
export const useScrollCrystal = (options = {}) => {
  const {
    enableScrollControl = true,
    debugMode = true, // Enable by default for now to help troubleshoot
    onSectionChange = null,
    smoothTransitions = true
  } = options;
  
  // State tracking
  const [currentSection, setCurrentSection] = useState(SCROLL_SECTIONS.INTRO);
  const [crystalState, setCrystalState] = useState(CRYSTAL_STATES.WHOLE);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // State transition tracking for failsafe
  const stateTransitionRef = useRef({
    lastTransition: Date.now(),
    pendingState: null,
    timeoutId: null
  });
  
  // Project selection state
  const [selectedProject, setSelectedProject] = useState(null);
  const [hoveredProject, setHoveredProject] = useState(null);
  
  // Section visibility state
  const [visibleSections, setVisibleSections] = useState({
    intro: true,
    projects: false,
    about: false,
    footer: false
  });
  
  // References
  const lastSectionRef = useRef(SCROLL_SECTIONS.INTRO);
  const transitionTimeoutRef = useRef(null);
  const scrollTicking = useRef(false);
  
  /**
   * Calculate current section based on scroll position
   */
  const calculateCurrentSection = useCallback((scrollPercent) => {
    const sections = Object.values(SCROLL_SECTIONS);
    
    // Find the active section based on scroll thresholds
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      if (scrollPercent >= section.threshold) {
        return section;
      }
    }
    
    return SCROLL_SECTIONS.INTRO;
  }, []);
  
  /**
   * Handle scroll events with throttling
   */
  const handleScroll = useCallback(() => {
    if (!enableScrollControl || scrollTicking.current) return;
    
    scrollTicking.current = true;
    
    requestAnimationFrame(() => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;
      
      setScrollProgress(scrollPercent);
      
      const newSection = calculateCurrentSection(scrollPercent);
      
      if (newSection.key !== currentSection.key && !isTransitioning) {
        handleSectionTransition(newSection);
      }
      
      scrollTicking.current = false;
    });
  }, [enableScrollControl, currentSection.key, isTransitioning, calculateCurrentSection]);
  
  /**
   * Handle crystal state transitions based on section
   */
  const handleCrystalStateTransition = useCallback((newSection) => {
    const targetState = newSection.crystalState;
    
    if (targetState !== crystalState) {
      if (debugMode) {
        console.log(`💎 Crystal state transition needed: ${crystalState} → ${targetState}`);
      }
      
      // Clear any existing timeout
      if (stateTransitionRef.current.timeoutId) {
        clearTimeout(stateTransitionRef.current.timeoutId);
      }
      
      // Handle the state machine sequence properly
      if (crystalState === CRYSTAL_STATES.WHOLE && targetState === CRYSTAL_STATES.EXPLODED) {
        // Start the explosion sequence
        console.log('💎 Starting explosion sequence: WHOLE → FRACTURING');
        setCrystalState(CRYSTAL_STATES.FRACTURING);
        stateTransitionRef.current.lastTransition = Date.now();
        stateTransitionRef.current.pendingState = CRYSTAL_STATES.EXPLODED;
        
        // After fracturing completes, move to exploding
        setTimeout(() => {
          console.log('💎 Continuing explosion: FRACTURING → EXPLODING');
          setCrystalState(CRYSTAL_STATES.EXPLODING);
          
          // After exploding completes, move to exploded
          setTimeout(() => {
            console.log('💎 Completing explosion: EXPLODING → EXPLODED');
            setCrystalState(CRYSTAL_STATES.EXPLODED);
            stateTransitionRef.current.pendingState = null;
          }, 1200);
        }, 350);
        
        // Failsafe: Force completion if stuck
        setTimeout(() => {
          console.warn('💎 FAILSAFE: Forcing explosion completion');
          setCrystalState(CRYSTAL_STATES.EXPLODED);
          stateTransitionRef.current.pendingState = null;
        }, 3000);
        
      } else if (crystalState === CRYSTAL_STATES.EXPLODED && targetState === CRYSTAL_STATES.WHOLE) {
        // Start the reform sequence
        console.log('💎 Starting reform sequence: EXPLODED → REFORMING');
        setCrystalState(CRYSTAL_STATES.REFORMING);
        stateTransitionRef.current.lastTransition = Date.now();
        stateTransitionRef.current.pendingState = CRYSTAL_STATES.WHOLE;
        
        // After reforming completes, move to whole
        setTimeout(() => {
          console.log('💎 Completing reform: REFORMING → WHOLE');
          setCrystalState(CRYSTAL_STATES.WHOLE);
          stateTransitionRef.current.pendingState = null;
        }, 900);
        
        // Failsafe for reform
        setTimeout(() => {
          console.warn('💎 FAILSAFE: Forcing reform completion');
          setCrystalState(CRYSTAL_STATES.WHOLE);
          stateTransitionRef.current.pendingState = null;
        }, 2000);
        
      } else if (targetState === CRYSTAL_STATES.PROJECT_SELECTED) {
        console.log('💎 Selecting project');
        setCrystalState(CRYSTAL_STATES.PROJECT_SELECTED);
        stateTransitionRef.current.pendingState = null;
        
      } else if (crystalState === CRYSTAL_STATES.PROJECT_SELECTED && targetState === CRYSTAL_STATES.EXPLODED) {
        console.log('💎 Deselecting project');
        setCrystalState(CRYSTAL_STATES.EXPLODED);
        stateTransitionRef.current.pendingState = null;
        
      } else if (crystalState === CRYSTAL_STATES.PROJECT_SELECTED && targetState === CRYSTAL_STATES.WHOLE) {
        // Go from project selected back to whole (via reform)
        console.log('💎 Project to intro: PROJECT_SELECTED → REFORMING');
        setCrystalState(CRYSTAL_STATES.REFORMING);
        stateTransitionRef.current.lastTransition = Date.now();
        stateTransitionRef.current.pendingState = CRYSTAL_STATES.WHOLE;
        
        setTimeout(() => {
          console.log('💎 Completing return to intro: REFORMING → WHOLE');
          setCrystalState(CRYSTAL_STATES.WHOLE);
          stateTransitionRef.current.pendingState = null;
        }, 900);
        
      } else {
        // Handle any other direct transitions
        console.log(`💎 Direct transition: ${crystalState} → ${targetState}`);
        setCrystalState(targetState);
        stateTransitionRef.current.pendingState = null;
      }
      
      if (debugMode) {
        console.log(`💎 Crystal state transition initiated`);
      }
    }
  }, [crystalState, debugMode]);
  
  /**
   * Handle section transitions
   */
  const handleSectionTransition = useCallback((newSection) => {
    if (debugMode) {
      console.log(`🔄 Section transition: ${currentSection.key} → ${newSection.key}`);
      console.log(`🔄 Crystal state before: ${crystalState}`);
    }
    
    setIsTransitioning(true);
    
    // Clear any existing timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    // Update section
    setCurrentSection(newSection);
    
    // Handle crystal state transitions
    handleCrystalStateTransition(newSection);
    
    // Update section visibility
    updateSectionVisibility(newSection);
    
    // Notify parent component
    if (onSectionChange) {
      onSectionChange(newSection, currentSection);
    }
    
    // Reset transition state after animation
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
      lastSectionRef.current = newSection;
      
      if (debugMode) {
        console.log(`🔄 Section transition complete: ${newSection.key}`);
        console.log(`🔄 Final crystal state: ${crystalState}`);
      }
    }, smoothTransitions ? 2000 : 100); // Longer timeout to account for crystal animations
    
  }, [currentSection, debugMode, onSectionChange, smoothTransitions, crystalState, handleCrystalStateTransition]);
  
  /**
   * Update section visibility for UI components
   */
  const updateSectionVisibility = useCallback((newSection) => {
    setVisibleSections({
      intro: newSection.key === 'intro',
      projects: newSection.key === 'projects', 
      about: newSection.key === 'about',
      footer: newSection.key === 'footer'
    });
  }, []);
  
  /**
   * Programmatically go to a specific section
   */
  const goToSection = useCallback((sectionKey) => {
    const section = Object.values(SCROLL_SECTIONS).find(s => s.key === sectionKey);
    
    if (!section) {
      console.warn(`Section '${sectionKey}' not found`);
      return;
    }
    
    // Calculate target scroll position
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetScroll = section.threshold * docHeight;
    
    // Smooth scroll to section
    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
    
    if (debugMode) {
      console.log(`🎯 Navigating to section: ${sectionKey} (${targetScroll}px)`);
    }
  }, [debugMode]);
  
  /**
   * Handle project selection within projects section
   */
  const selectProject = useCallback((projectKey) => {
    if (currentSection.key !== 'projects') {
      // First navigate to projects section
      goToSection('projects');
      
      // Then select the project after a delay
      setTimeout(() => {
        setSelectedProject(projectKey);
        setCrystalState(CRYSTAL_STATES.PROJECT_SELECTED);
      }, 1000);
    } else {
      setSelectedProject(projectKey);
      setCrystalState(CRYSTAL_STATES.PROJECT_SELECTED);
    }
    
    if (debugMode) {
      console.log(`🎨 Project selected: ${projectKey}`);
    }
  }, [currentSection.key, goToSection, debugMode]);
  
  /**
   * Deselect current project
   */
  const deselectProject = useCallback(() => {
    setSelectedProject(null);
    
    if (currentSection.key === 'projects') {
      setCrystalState(CRYSTAL_STATES.EXPLODED);
    }
    
    if (debugMode) {
      console.log('🎨 Project deselected');
    }
  }, [currentSection.key, debugMode]);
  
  /**
   * Handle project detail card close - FIXED to return to intro
   */
  const handleProjectClose = useCallback(() => {
    // Always return to intro section when closing project details
    deselectProject();
    goToSection('intro');
    
    if (debugMode) {
      console.log('🎨 Project closed, returning to intro');
    }
  }, [deselectProject, goToSection, debugMode]);
  
  /**
   * Handle footer loop back to intro
   */
  const handleLoopBack = useCallback(() => {
    goToSection('intro');
    
    if (debugMode) {
      console.log('🔄 Looping back to intro from footer');
    }
  }, [goToSection, debugMode]);
  
  // Set up scroll listeners
  useEffect(() => {
    if (!enableScrollControl) return;
    
    // Initial scroll position check
    handleScroll();
    
    // Add scroll listener with passive flag for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [enableScrollControl, handleScroll]);
  
  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle if not in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const sections = Object.values(SCROLL_SECTIONS);
      const currentIndex = sections.findIndex(s => s.key === currentSection.key);
      
      switch (e.key) {
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          if (currentIndex > 0) {
            goToSection(sections[currentIndex - 1].key);
          }
          break;
          
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          if (currentIndex < sections.length - 1) {
            goToSection(sections[currentIndex + 1].key);
          }
          break;
          
        case 'Home':
          e.preventDefault();
          goToSection('intro');
          break;
          
        case 'End':
          e.preventDefault();
          goToSection('footer');
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSection.key, goToSection]);
  
  // Debug logging with crystal state tracking
  useEffect(() => {
    if (debugMode) {
      console.log(`📍 Current section: ${currentSection.key}`, {
        crystalState,
        scrollProgress: Math.round(scrollProgress * 100) + '%',
        isTransitioning,
        selectedProject: selectedProject || 'none'
      });
    }
  }, [currentSection.key, crystalState, scrollProgress, isTransitioning, debugMode, selectedProject]);
  

  // Cleanup effect for timeouts
  useEffect(() => {
    return () => {
      // Clean up any pending timeouts
      if (stateTransitionRef.current.timeoutId) {
        clearTimeout(stateTransitionRef.current.timeoutId);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Current state
    currentSection,
    crystalState,
    isTransitioning,
    scrollProgress,
    
    // Project state
    selectedProject,
    hoveredProject,
    setHoveredProject,
    
    // Section visibility
    visibleSections,
    
    // Navigation methods
    goToSection,
    selectProject,
    deselectProject,
    handleProjectClose, // FIXED: Returns to intro
    handleLoopBack,
    
    // Section data
    sections: SCROLL_SECTIONS,
    
    // Debug helpers
    debug: debugMode ? {
      sections: Object.values(SCROLL_SECTIONS),
      currentIndex: Object.values(SCROLL_SECTIONS).findIndex(s => s.key === currentSection.key)
    } : null
  };
};
    // Current state
    currentSection,
    crystalState,
    isTransitioning,
    scrollProgress,
    
    // Project state
    selectedProject,
    hoveredProject,
    setHoveredProject,
    
    // Section visibility
    visibleSections,
    
    // Navigation methods
    goToSection,
    selectProject,
    deselectProject,
    handleProjectClose, // FIXED: Returns to intro
    handleLoopBack,
    
    // Section data
    sections: SCROLL_SECTIONS,
    
    // Debug helpers
    debug: debugMode ? {
      sections: Object.values(SCROLL_SECTIONS),
      currentIndex: Object.values(SCROLL_SECTIONS).findIndex(s => s.key === currentSection.key)
    } : null
  };
};