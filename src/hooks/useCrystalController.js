// src/hooks/useCrystalController.js - FIXED: Bidirectional zone transitions
// Simple, predictable crystal states based on page zones with proper reverse transitions

import { useState, useEffect, useRef, useCallback } from 'react';
import { CRYSTAL_STATES } from '../machines/crystalStateMachine';

/**
 * SIMPLE: Page zones instead of individual sections
 */
const PAGE_ZONES = {
  HERO: 'hero',           // Hero section
  PROJECTS: 'projects',   // Projects overview + all project sections  
  ABOUT: 'about'          // About section
};

/**
 * SIMPLE: Zone to crystal state mapping
 */
const ZONE_TO_CRYSTAL_STATE = {
  [PAGE_ZONES.HERO]: CRYSTAL_STATES.WHOLE,
  [PAGE_ZONES.PROJECTS]: CRYSTAL_STATES.EXPLODED,
  [PAGE_ZONES.ABOUT]: CRYSTAL_STATES.WHOLE
};

/**
 * SIMPLE: Map section ID to page zone
 */
const getPageZone = (sectionId) => {
  if (!sectionId) return PAGE_ZONES.HERO;
  
  if (sectionId === 'hero') return PAGE_ZONES.HERO;
  if (sectionId === 'about') return PAGE_ZONES.ABOUT;
  
  // ✅ FIXED: Explicitly handle projects-overview
  if (sectionId === 'projects-overview') return PAGE_ZONES.PROJECTS;
  if (sectionId.startsWith('project-')) return PAGE_ZONES.PROJECTS;
  
  return PAGE_ZONES.HERO;
};

/**
 * SIMPLE: Get selected facet from section ID (only for project sections)
 */
const getSelectedFacet = (sectionId) => {
  if (!sectionId || !sectionId.startsWith('project-')) return null;
  return sectionId.replace('project-', '');
};

/**
 * SIMPLE: Animation timing configuration
 */
const ANIMATION_CONFIG = {
  explosionDuration: 1400,  // How long explosion takes
  reformDuration: 1000,     // How long reform takes
  debounceMs: 200,          // Debounce for section changes
  visibilityThreshold: 0.3  // Minimum visibility to trigger
};

/**
 * Simple debounce utility
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
 * Scroll metrics for fast scroll detection
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
      const isFastScrolling = speed > 50; // Fast scroll threshold

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
 * FIXED: Zone-Based Crystal Controller with proper bidirectional transitions
 */
export const useCrystalController = (options = {}) => {
  const {
    scrollObserver,
    onStateChange = null,
    onFacetChange = null,
    debugMode = false
  } = options;

  // Crystal state management
  const [crystalState, setCrystalState] = useState(CRYSTAL_STATES.WHOLE);
  const [selectedFacet, setSelectedFacet] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Zone tracking
  const [currentZone, setCurrentZone] = useState(PAGE_ZONES.HERO);
  const previousZone = useRef(PAGE_ZONES.HERO);
  const animationTimeout = useRef(null);
  
  // Scroll metrics
  const scrollMetrics = useScrollMetrics();
  
  // Previous state tracking for callbacks
  const previousState = useRef(crystalState);
  const previousFacet = useRef(selectedFacet);

  /**
   * SIMPLE: Determine current zone from visible sections
   */
  const determineCurrentZone = useCallback((visibleSections) => {
    if (!visibleSections || visibleSections.size === 0) {
      return { zone: PAGE_ZONES.HERO, facet: null, sectionId: 'hero' };
    }

    // Find the most visible section
    let mostVisibleSection = null;
    let maxVisibility = 0;

    for (const [sectionId, sectionData] of visibleSections) {
      const visibility = sectionData.intersectionRatio || 0;
      
      if (visibility > maxVisibility && visibility > ANIMATION_CONFIG.visibilityThreshold) {
        maxVisibility = visibility;
        mostVisibleSection = sectionId;
      }
    }

    if (!mostVisibleSection) {
      return { zone: PAGE_ZONES.HERO, facet: null, sectionId: 'hero' };
    }

    const zone = getPageZone(mostVisibleSection);
    const facet = getSelectedFacet(mostVisibleSection);

    return { zone, facet, sectionId: mostVisibleSection };
  }, []);

  /**
   * FIXED: Handle zone changes with bidirectional transitions
   */
  const handleZoneChange = useCallback((newZone, newFacet, sectionId) => {
    const prevZone = previousZone.current;
    
    if (debugMode) {
      console.log(`🗺️ Zone change detected: ${prevZone} → ${newZone}`, {
        facet: newFacet,
        section: sectionId,
        currentState: crystalState
      });
    }

    // Update current zone
    setCurrentZone(newZone);
    previousZone.current = newZone;

    // Update selected facet (can change within same zone)
    if (newFacet !== selectedFacet) {
      setSelectedFacet(newFacet);
    }

    // Handle crystal state changes based on zone transitions
    if (prevZone !== newZone) {
      // Clear any existing animation timeout
      if (animationTimeout.current) {
        clearTimeout(animationTimeout.current);
        animationTimeout.current = null;
      }

      const targetState = ZONE_TO_CRYSTAL_STATE[newZone];
      
      if (debugMode) {
        console.log(`💎 Crystal state transition: ${crystalState} → ${targetState}`);
      }

      // FIXED: Handle all possible zone transitions

      // TO PROJECTS ZONE: Always explode (regardless of previous zone)
      if (newZone === PAGE_ZONES.PROJECTS && crystalState === CRYSTAL_STATES.WHOLE) {
        setIsTransitioning(true);
        
        // Start with fracturing
        setCrystalState(CRYSTAL_STATES.FRACTURING);
        
        animationTimeout.current = setTimeout(() => {
          setCrystalState(CRYSTAL_STATES.EXPLODING);
          
          animationTimeout.current = setTimeout(() => {
            setCrystalState(CRYSTAL_STATES.EXPLODED);
            setIsTransitioning(false);
            
            if (debugMode) {
              console.log('💥 Explosion sequence complete');
            }
          }, ANIMATION_CONFIG.explosionDuration);
        }, 400); // Fracture duration
      }
      
      // TO HERO OR ABOUT ZONE: Always reform (regardless of previous zone)
      else if ((newZone === PAGE_ZONES.HERO || newZone === PAGE_ZONES.ABOUT) && 
               crystalState !== CRYSTAL_STATES.WHOLE) {
        setIsTransitioning(true);
        
        setCrystalState(CRYSTAL_STATES.REFORMING);
        
        animationTimeout.current = setTimeout(() => {
          setCrystalState(CRYSTAL_STATES.WHOLE);
          setSelectedFacet(null); // Clear facet when reformed
          setIsTransitioning(false);
          
          if (debugMode) {
            console.log('🔄 Reform sequence complete');
          }
        }, ANIMATION_CONFIG.reformDuration);
      }
      
      // ALREADY IN CORRECT STATE: Skip animation
      else if (crystalState === targetState) {
        if (debugMode) {
          console.log(`✅ Already in target state ${targetState}, skipping animation`);
        }
        setIsTransitioning(false);
      }
    }
    
    // Within PROJECTS zone: only update facet, keep exploded state
    else if (newZone === PAGE_ZONES.PROJECTS && newFacet !== selectedFacet) {
      if (debugMode) {
        console.log(`🎯 Facet change within projects zone: ${selectedFacet} → ${newFacet}`);
      }
      // Facet already updated above, crystal stays exploded
    }
  }, [crystalState, selectedFacet, debugMode]);

  /**
   * SIMPLE: Debounced zone resolver
   */
  const debouncedZoneResolver = useCallback(
    debounce((visibleSections) => {
      const { zone, facet, sectionId } = determineCurrentZone(visibleSections);
      handleZoneChange(zone, facet, sectionId);
    }, ANIMATION_CONFIG.debounceMs),
    [determineCurrentZone, handleZoneChange]
  );

  /**
   * React to scroll observer changes
   */
  useEffect(() => {
    if (!scrollObserver || !scrollObserver.visibleSections) {
      return;
    }

    debouncedZoneResolver(scrollObserver.visibleSections);
  }, [scrollObserver?.visibleSections, debouncedZoneResolver]);

  /**
   * Handle state change callbacks
   */
  useEffect(() => {
    if (crystalState !== previousState.current) {
      if (debugMode) {
        console.log(`💎 Crystal state changed: ${previousState.current} → ${crystalState}`);
      }
      
      previousState.current = crystalState;
      
      if (onStateChange) {
        onStateChange(crystalState, previousState.current);
      }
    }
  }, [crystalState, onStateChange, debugMode]);

  useEffect(() => {
    if (selectedFacet !== previousFacet.current) {
      if (debugMode) {
        console.log(`🎯 Facet changed: ${previousFacet.current || 'none'} → ${selectedFacet || 'none'}`);
      }
      
      previousFacet.current = selectedFacet;
      
      if (onFacetChange) {
        onFacetChange(selectedFacet, previousFacet.current);
      }
    }
  }, [selectedFacet, onFacetChange, debugMode]);

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (animationTimeout.current) {
        clearTimeout(animationTimeout.current);
      }
    };
  }, []);

  /**
   * Manual override functions (simplified)
   */
  const overrideCrystalState = useCallback((state, facet = null) => {
    if (debugMode) {
      console.log('🎮 Manual override:', state, facet);
    }
    
    setCrystalState(state);
    if (facet !== undefined) {
      setSelectedFacet(facet);
    }
  }, [debugMode]);

  const clearAnimationQueue = useCallback(() => {
    if (animationTimeout.current) {
      clearTimeout(animationTimeout.current);
      animationTimeout.current = null;
    }
    setIsTransitioning(false);
    
    if (debugMode) {
      console.log('🧹 Animation cleared');
    }
  }, [debugMode]);

  return {
    // Current state
    crystalState,
    selectedFacet,
    isTransitioning,
    
    // Zone information
    currentZone,
    
    // Scroll metrics
    scrollDirection: scrollMetrics.direction,
    scrollSpeed: scrollMetrics.speed,
    isFastScrolling: scrollMetrics.isFastScrolling,
    
    // Control functions
    overrideCrystalState,
    clearAnimationQueue,
    
    // Debug information
    debugInfo: debugMode ? {
      currentZone,
      previousZone: previousZone.current,
      hasAnimationTimeout: !!animationTimeout.current,
      visibleSections: scrollObserver?.getVisibleSectionIds() || [],
      scrollMetrics,
      crystalState,
      targetState: ZONE_TO_CRYSTAL_STATE[currentZone]
    } : null
  };
};

export default useCrystalController;