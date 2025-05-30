// src/hooks/useCrystalController.js
// Phase 3.1: Scroll-Triggered Crystal Controller
// Maps scroll positions to crystal states without hijacking scroll behavior

import { useState, useEffect, useRef, useCallback } from 'react';
import { CRYSTAL_STATES } from '../machines/crystalStateMachine';

/**
 * Section to Crystal State Mapping
 * Defines how each page section maps to crystal animation states
 */
const SECTION_TO_CRYSTAL_STATE = {
  'hero': CRYSTAL_STATES.WHOLE,
  'projects-overview': CRYSTAL_STATES.EXPLODED,
  'project-empathy': { 
    state: CRYSTAL_STATES.PROJECT_SELECTED, 
    facet: 'empathy' 
  },
  'project-narrative': { 
    state: CRYSTAL_STATES.PROJECT_SELECTED, 
    facet: 'narrative' 
  },
  'project-craft': { 
    state: CRYSTAL_STATES.PROJECT_SELECTED, 
    facet: 'craft' 
  },
  'project-system': { 
    state: CRYSTAL_STATES.PROJECT_SELECTED, 
    facet: 'system' 
  },
  'project-leadership': { 
    state: CRYSTAL_STATES.PROJECT_SELECTED, 
    facet: 'leadership' 
  },
  'project-exploration': { 
    state: CRYSTAL_STATES.PROJECT_SELECTED, 
    facet: 'exploration' 
  },
  'about': CRYSTAL_STATES.WHOLE // Reformed state
};

/**
 * Animation timing configuration
 * Controls transition speeds and easing
 */
const ANIMATION_CONFIG = {
  // State transition delays to prevent conflicts
  stateChangeDebounce: 100, // ms
  
  // Minimum visibility threshold to trigger state change
  visibilityThreshold: 0.3, // 30% visible
  
  // Fast scroll detection threshold
  fastScrollThreshold: 50, // px per frame
  
  // Animation easing curves
  easingCurves: {
    explosion: 'easeOutCubic',
    reformation: 'easeInOutCubic',
    projectSelection: 'easeOutQuart'
  },
  
  // Priority system for conflicting states
  statePriority: {
    [CRYSTAL_STATES.PROJECT_SELECTED]: 3,
    [CRYSTAL_STATES.EXPLODED]: 2,
    [CRYSTAL_STATES.WHOLE]: 1
  }
};

/**
 * Debounce utility for state changes
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Calculate transition priority between states
 */
const getTransitionPriority = (fromState, toState) => {
  const fromPriority = ANIMATION_CONFIG.statePriority[fromState] || 0;
  const toPriority = ANIMATION_CONFIG.statePriority[toState] || 0;
  return toPriority - fromPriority;
};

/**
 * Determine best crystal state from multiple visible sections
 */
const resolveCrystalState = (visibleSections, scrollDirection = 'down') => {
  if (!visibleSections || visibleSections.size === 0) {
    return { state: CRYSTAL_STATES.WHOLE, facet: null };
  }

  let bestCandidate = null;
  let highestPriority = -1;
  let highestVisibility = 0;

  // Evaluate each visible section
  for (const [sectionId, sectionData] of visibleSections) {
    const mapping = SECTION_TO_CRYSTAL_STATE[sectionId];
    if (!mapping) continue;

    const crystalState = typeof mapping === 'object' ? mapping.state : mapping;
    const facet = typeof mapping === 'object' ? mapping.facet : null;
    
    const priority = ANIMATION_CONFIG.statePriority[crystalState] || 0;
    const visibility = sectionData.intersectionRatio || 0;

    // Only consider sections that meet visibility threshold
    if (visibility < ANIMATION_CONFIG.visibilityThreshold) continue;

    // Prefer higher priority states, then higher visibility
    const isCandidate = priority > highestPriority || 
                       (priority === highestPriority && visibility > highestVisibility);

    if (isCandidate) {
      highestPriority = priority;
      highestVisibility = visibility;
      bestCandidate = {
        state: crystalState,
        facet,
        sectionId,
        visibility,
        priority
      };
    }
  }

  return bestCandidate || { state: CRYSTAL_STATES.WHOLE, facet: null };
};

/**
 * Detect scroll direction and speed
 */
const useScrollMetrics = () => {
  const [scrollMetrics, setScrollMetrics] = useState({
    direction: 'down',
    speed: 0,
    isFastScrolling: false
  });
  
  const lastScrollY = useRef(window.pageYOffset);
  const lastTimestamp = useRef(Date.now());

  useEffect(() => {
    const updateScrollMetrics = () => {
      const currentScrollY = window.pageYOffset;
      const currentTime = Date.now();
      
      const deltaY = currentScrollY - lastScrollY.current;
      const deltaTime = Math.max(currentTime - lastTimestamp.current, 1);
      
      const speed = Math.abs(deltaY) / deltaTime;
      const direction = deltaY > 0 ? 'down' : 'up';
      const isFastScrolling = speed > ANIMATION_CONFIG.fastScrollThreshold;

      setScrollMetrics({
        direction,
        speed,
        isFastScrolling
      });

      lastScrollY.current = currentScrollY;
      lastTimestamp.current = currentTime;
    };

    let rafId;
    const handleScroll = () => {
      rafId = requestAnimationFrame(updateScrollMetrics);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return scrollMetrics;
};

/**
 * Main Crystal Controller Hook
 * Manages crystal state based on scroll position and section visibility
 */
export const useCrystalController = (options = {}) => {
  const {
    scrollObserver, // Required: scroll observer instance
    onStateChange = null,
    onFacetChange = null,
    debugMode = false,
    enableAnimationQueue = true
  } = options;

  // Crystal state management
  const [crystalState, setCrystalState] = useState(CRYSTAL_STATES.WHOLE);
  const [selectedFacet, setSelectedFacet] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Animation queue for managing transitions
  const animationQueue = useRef([]);
  const transitionTimeouts = useRef(new Set());
  
  // Scroll metrics for intelligent state resolution
  const scrollMetrics = useScrollMetrics();
  
  // Previous state tracking
  const previousState = useRef(crystalState);
  const previousFacet = useRef(selectedFacet);

  /**
   * Process animation queue
   */
  const processAnimationQueue = useCallback(() => {
    if (animationQueue.current.length === 0 || isTransitioning) {
      return;
    }

    const nextAnimation = animationQueue.current.shift();
    setIsTransitioning(true);

    if (debugMode) {
      console.log('🎬 Processing crystal animation:', nextAnimation);
    }

    // Apply state change
    setCrystalState(nextAnimation.state);
    setSelectedFacet(nextAnimation.facet);

    // Set transition completion timeout
    const timeout = setTimeout(() => {
      setIsTransitioning(false);
      transitionTimeouts.current.delete(timeout);
      
      // Process next animation in queue
      if (animationQueue.current.length > 0) {
        processAnimationQueue();
      }
    }, nextAnimation.duration || 1200);

    transitionTimeouts.current.add(timeout);
  }, [isTransitioning, debugMode]);

  /**
   * Queue state change with conflict resolution
   */
  const queueStateChange = useCallback((targetState, targetFacet = null, options = {}) => {
    const {
      priority = 0,
      duration = 1200,
      immediate = false
    } = options;

    // Skip if same state
    if (targetState === crystalState && targetFacet === selectedFacet) {
      return;
    }

    const animation = {
      state: targetState,
      facet: targetFacet,
      priority,
      duration,
      timestamp: Date.now()
    };

    if (immediate || !enableAnimationQueue) {
      // Clear queue and apply immediately
      animationQueue.current = [animation];
      processAnimationQueue();
    } else {
      // Add to queue with priority sorting
      animationQueue.current.push(animation);
      animationQueue.current.sort((a, b) => b.priority - a.priority);
      
      // Process if not currently transitioning
      if (!isTransitioning) {
        processAnimationQueue();
      }
    }

    if (debugMode) {
      console.log('📋 Crystal animation queued:', animation);
    }
  }, [crystalState, selectedFacet, isTransitioning, enableAnimationQueue, processAnimationQueue, debugMode]);

  /**
   * Debounced state resolver
   */
  const debouncedStateResolver = useCallback(
    debounce((visibleSections) => {
      const resolved = resolveCrystalState(visibleSections, scrollMetrics.direction);
      
      if (debugMode) {
        console.log('🔍 Crystal state resolved:', resolved);
      }

      // Calculate transition priority
      const transitionPriority = getTransitionPriority(crystalState, resolved.state);
      const isFastScroll = scrollMetrics.isFastScrolling;

      // Queue the state change
      queueStateChange(resolved.state, resolved.facet, {
        priority: transitionPriority,
        duration: isFastScroll ? 800 : 1200, // Faster transitions during fast scroll
        immediate: isFastScroll && transitionPriority > 0 // Skip queue for important fast scroll changes
      });
    }, ANIMATION_CONFIG.stateChangeDebounce),
    [crystalState, scrollMetrics, queueStateChange, debugMode]
  );

  /**
   * React to scroll observer changes
   */
  useEffect(() => {
    if (!scrollObserver || !scrollObserver.visibleSections) {
      return;
    }

    debouncedStateResolver(scrollObserver.visibleSections);
  }, [scrollObserver?.visibleSections, scrollObserver?.currentSection, debouncedStateResolver]);

  /**
   * Handle state change callbacks
   */
  useEffect(() => {
    if (crystalState !== previousState.current) {
      previousState.current = crystalState;
      
      if (onStateChange) {
        onStateChange(crystalState, previousState.current);
      }
    }
  }, [crystalState, onStateChange]);

  useEffect(() => {
    if (selectedFacet !== previousFacet.current) {
      previousFacet.current = selectedFacet;
      
      if (onFacetChange) {
        onFacetChange(selectedFacet, previousFacet.current);
      }
    }
  }, [selectedFacet, onFacetChange]);

  /**
   * Cleanup timeouts on unmount
   */
  useEffect(() => {
    return () => {
      transitionTimeouts.current.forEach(timeout => clearTimeout(timeout));
      transitionTimeouts.current.clear();
    };
  }, []);

  /**
   * Manual override functions for external control
   */
  const overrideCrystalState = useCallback((state, facet = null, immediate = false) => {
    queueStateChange(state, facet, {
      priority: 999, // Highest priority
      immediate
    });
  }, [queueStateChange]);

  /**
   * Clear animation queue (emergency reset)
   */
  const clearAnimationQueue = useCallback(() => {
    animationQueue.current = [];
    transitionTimeouts.current.forEach(timeout => clearTimeout(timeout));
    transitionTimeouts.current.clear();
    setIsTransitioning(false);
  }, []);

  return {
    // Current state
    crystalState,
    selectedFacet,
    isTransitioning,
    
    // Scroll metrics
    scrollDirection: scrollMetrics.direction,
    scrollSpeed: scrollMetrics.speed,
    isFastScrolling: scrollMetrics.isFastScrolling,
    
    // Control functions
    overrideCrystalState,
    clearAnimationQueue,
    
    // Debug information
    debugInfo: debugMode ? {
      animationQueueLength: animationQueue.current.length,
      activeTimeouts: transitionTimeouts.current.size,
      currentMapping: scrollObserver?.currentSection ? 
        SECTION_TO_CRYSTAL_STATE[scrollObserver.currentSection.id] : null,
      visibleSections: scrollObserver?.getVisibleSectionIds() || [],
      scrollMetrics
    } : null
  };
};

/**
 * Lightweight hook for simple crystal state without advanced features
 */
export const useSimpleCrystalController = (scrollObserver) => {
  const [crystalState, setCrystalState] = useState(CRYSTAL_STATES.WHOLE);
  const [selectedFacet, setSelectedFacet] = useState(null);

  useEffect(() => {
    if (!scrollObserver?.currentSection) return;

    const mapping = SECTION_TO_CRYSTAL_STATE[scrollObserver.currentSection.id];
    if (!mapping) return;

    const newState = typeof mapping === 'object' ? mapping.state : mapping;
    const newFacet = typeof mapping === 'object' ? mapping.facet : null;

    setCrystalState(newState);
    setSelectedFacet(newFacet);
  }, [scrollObserver?.currentSection]);

  return {
    crystalState,
    selectedFacet,
    isTransitioning: false
  };
};

export default useCrystalController;