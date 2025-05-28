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
    duration: 0.2, // 20% of viewport height
    title: 'Multifaceted Designer',
    subtitle: 'Jon Shaw'
  },
  
  PROJECTS_OVERVIEW: {
    key: 'projects-overview', 
    index: 1,
    crystalState: CRYSTAL_STATES.EXPLODED,
    cameraState: 'EXPLOSION',
    threshold: 0.2, // 20% scroll
    duration: 0.05, // 5% of viewport height (20% to 25%)
    title: 'Featured Projects',
    subtitle: 'Explore my work across six design facets'
  },
  
  PROJECT_EMPATHY: {
    key: 'project-empathy',
    index: 2,
    crystalState: CRYSTAL_STATES.PROJECT_SELECTED,
    cameraState: 'PROJECT_EMPATHY',
    threshold: 0.25, // 25% scroll
    duration: 0.08, // 8% of viewport height
    title: 'Empathy',
    subtitle: 'Understanding user needs and pain points',
    projectKey: 'empathy'
  },
  
  PROJECT_NARRATIVE: {
    key: 'project-narrative',
    index: 3,
    crystalState: CRYSTAL_STATES.PROJECT_SELECTED,
    cameraState: 'PROJECT_NARRATIVE',
    threshold: 0.33, // 33% scroll
    duration: 0.08, // 8% of viewport height
    title: 'Narrative',
    subtitle: 'Guiding teams through compelling stories',
    projectKey: 'narrative'
  },
  
  PROJECT_CRAFT: {
    key: 'project-craft',
    index: 4,
    crystalState: CRYSTAL_STATES.PROJECT_SELECTED,
    cameraState: 'PROJECT_CRAFT',
    threshold: 0.41, // 41% scroll
    duration: 0.08, // 8% of viewport height
    title: 'Craft',
    subtitle: 'Precision in every design detail',
    projectKey: 'craft'
  },
  
  PROJECT_SYSTEM: {
    key: 'project-system',
    index: 5,
    crystalState: CRYSTAL_STATES.PROJECT_SELECTED,
    cameraState: 'PROJECT_SYSTEM',
    threshold: 0.49, // 49% scroll
    duration: 0.08, // 8% of viewport height
    title: 'System',
    subtitle: 'Building scalable design systems',
    projectKey: 'system'
  },
  
  PROJECT_LEADERSHIP: {
    key: 'project-leadership',
    index: 6,
    crystalState: CRYSTAL_STATES.PROJECT_SELECTED,
    cameraState: 'PROJECT_LEADERSHIP',
    threshold: 0.57, // 57% scroll
    duration: 0.08, // 8% of viewport height
    title: 'Leadership',
    subtitle: 'Empowering teams to do their best work',
    projectKey: 'leadership'
  },
  
  PROJECT_EXPLORATION: {
    key: 'project-exploration',
    index: 7,
    crystalState: CRYSTAL_STATES.PROJECT_SELECTED,
    cameraState: 'PROJECT_EXPLORATION',
    threshold: 0.65, // 65% scroll
    duration: 0.08, // 8% of viewport height
    title: 'Exploration',
    subtitle: 'Finding opportunities in ambiguity',
    projectKey: 'exploration'
  },
  
  ABOUT: {
    key: 'about',
    index: 8, 
    crystalState: CRYSTAL_STATES.WHOLE,
    cameraState: 'ABOUT',
    threshold: 0.73, // 73% scroll
    duration: 0.12, // 12% of viewport height (73% to 85%)
    title: 'About Me',
    subtitle: 'The story behind the facets'
  },
  
  FOOTER: {
    key: 'footer',
    index: 9,
    crystalState: CRYSTAL_STATES.WHOLE, 
    cameraState: 'FOOTER',
    threshold: 0.85, // 85% scroll
    duration: 0.15, // 15% of viewport height (85% to 100%)
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
    'projects-overview': false,
    'project-empathy': false,
    'project-narrative': false,
    'project-craft': false,
    'project-system': false,
    'project-leadership': false,
    'project-exploration': false,
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
   * Update section visibility for UI components
   */
  const updateSectionVisibility = useCallback((newSection) => {
    // Reset all to false first
    const newVisibility = {
      intro: false,
      'projects-overview': false,
      'project-empathy': false,
      'project-narrative': false,
      'project-craft': false,
      'project-system': false,
      'project-leadership': false,
      'project-exploration': false,
      about: false,
      footer: false
    };
    
    // Set current section to true
    newVisibility[newSection.key] = true;
    
    // Also show projects overview when in any project section
    if (newSection.key.startsWith('project-')) {
      newVisibility['projects-overview'] = true;
    }
    
    setVisibleSections(newVisibility);
  }, []);
  
  /**
   * Handle crystal state transitions based on section
   */
  const handleCrystalStateTransition = useCallback((newSection) => {
    const targetState = newSection.crystalState;
    
    // If we're moving to a project section, set the selected project
    if (newSection.projectKey) {
      setSelectedProject(newSection.projectKey);
    } else if (newSection.key === 'projects-overview') {
      setSelectedProject(null); // Clear selection for overview
    } else if (!newSection.key.startsWith('project-')) {
      setSelectedProject(null); // Clear selection when leaving projects entirely
    }
    
    if (targetState !== crystalState) {
      if (debugMode) {
        console.log(`💎 Crystal state transition needed: ${crystalState} → ${targetState}`);
        if (newSection.projectKey) {
          console.log(`🎨 Project focus: ${newSection.projectKey}`);
        }
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
        
      } else if (crystalState === CRYSTAL_STATES.EXPLODED && targetState === CRYSTAL_STATES.PROJECT_SELECTED) {
        // Direct transition to project selected
        console.log('💎 Transitioning to project selected');
        setCrystalState(CRYSTAL_STATES.PROJECT_SELECTED);
        stateTransitionRef.current.pendingState = null;
        
      } else if (crystalState === CRYSTAL_STATES.PROJECT_SELECTED && targetState === CRYSTAL_STATES.EXPLODED) {
        // Return to exploded view
        console.log('💎 Returning to exploded view');
        setCrystalState(CRYSTAL_STATES.EXPLODED);
        stateTransitionRef.current.pendingState = null;
        
      } else if ((crystalState === CRYSTAL_STATES.EXPLODED || crystalState === CRYSTAL_STATES.PROJECT_SELECTED) && targetState === CRYSTAL_STATES.WHOLE) {
        // Start the reform sequence
        console.log('💎 Starting reform sequence → REFORMING');
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
        // Direct transition to any project
        console.log('💎 Direct transition to project selected');
        setCrystalState(CRYSTAL_STATES.PROJECT_SELECTED);
        stateTransitionRef.current.pendingState = null;
        
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
      
      // Allow section transitions even during crystal state transitions
      // but prevent rapid fire transitions
      if (newSection.key !== currentSection.key) {
        if (debugMode) {
          console.log(`🔄 Scroll detected section change: ${currentSection.key} → ${newSection.key} (${Math.round(scrollPercent * 100)}%)`);
        }
        handleSectionTransition(newSection);
      }
      
      scrollTicking.current = false;
    });
  }, [enableScrollControl, currentSection.key, calculateCurrentSection, debugMode]);
  
  /**
   * Handle section transitions
   */
  const handleSectionTransition = useCallback((newSection) => {
    if (debugMode) {
      console.log(`🔄 Section transition: ${currentSection.key} → ${newSection.key}`);
      console.log(`🔄 Crystal state before: ${crystalState}`);
    }
    
    // Don't prevent transitions - let them happen even during crystal animations
    setIsTransitioning(true);
    
    // Clear any existing timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    // Update section immediately
    setCurrentSection(newSection);
    
    // Handle crystal state transitions
    handleCrystalStateTransition(newSection);
    
    // Update section visibility immediately
    updateSectionVisibility(newSection);
    
    // Notify parent component
    if (onSectionChange) {
      onSectionChange(newSection, currentSection);
    }
    
    // Reset transition state after a shorter delay to allow continuous scrolling
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
      lastSectionRef.current = newSection;
      
      if (debugMode) {
        console.log(`🔄 Section transition complete: ${newSection.key}`);
        console.log(`🔄 Final crystal state: ${crystalState}`);
      }
    }, 500); // Reduced from 2000 to allow faster transitions
    
  }, [currentSection, debugMode, onSectionChange, crystalState, handleCrystalStateTransition, updateSectionVisibility]);
  
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
    // Find the corresponding project section
    const projectSectionKey = `project-${projectKey}`;
    const projectSection = Object.values(SCROLL_SECTIONS).find(s => s.key === projectSectionKey);
    
    if (projectSection) {
      goToSection(projectSectionKey);
    }
    
    if (debugMode) {
      console.log(`🎨 Project selected: ${projectKey}`);
    }
  }, [goToSection, debugMode]);
  
  /**
   * Get current project based on current section
   */
  const getCurrentProject = useCallback(() => {
    if (currentSection.projectKey) {
      return {
        facetKey: currentSection.projectKey,
        title: currentSection.title,
        subtitle: currentSection.subtitle
      };
    }
    return null;
  }, [currentSection]);
  
  /**
   * Check if we're in any project section
   */
  const isInProjectSection = useCallback(() => {
    return currentSection.key.startsWith('project-');
  }, [currentSection.key]);
  
  /**
   * Deselect current project
   */
  const deselectProject = useCallback(() => {
    // Go back to projects overview
    goToSection('projects-overview');
    
    if (debugMode) {
      console.log('🎨 Project deselected, returning to overview');
    }
  }, [goToSection, debugMode]);
  
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
    
    // New project helpers
    getCurrentProject,
    isInProjectSection,
    
    // Section data
    sections: SCROLL_SECTIONS,
    
    // Debug helpers
    debug: debugMode ? {
      sections: Object.values(SCROLL_SECTIONS),
      currentIndex: Object.values(SCROLL_SECTIONS).findIndex(s => s.key === currentSection.key),
      currentProject: getCurrentProject()
    } : null
  };
};