// src/hooks/useScrollObserver.js
// ENHANCED: Scroll observer optimized for CSS scroll snapping

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Enhanced configuration for scroll snapping compatibility
 */
const OBSERVER_CONFIG = {
  // Adjusted thresholds for better snap detection
  threshold: [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1.0],
  // Tighter margins for more precise detection with scroll snap
  rootMargin: '-10% 0px -10% 0px',
  root: null
};

/**
 * Mobile-optimized observer configuration
 */
const MOBILE_OBSERVER_CONFIG = {
  threshold: [0, 0.25, 0.5, 0.75, 1.0],
  rootMargin: '-15% 0px -15% 0px',
  root: null
};

/**
 * Calculate section progress with scroll snap awareness
 */
const calculateSectionProgress = (entry) => {
  const { intersectionRatio, boundingClientRect, rootBounds } = entry;
  
  // For scroll snapping, we want cleaner 0/1 states when sections are snapped
  const elementTop = boundingClientRect.top;
  const elementHeight = boundingClientRect.height;
  const viewportHeight = rootBounds.height;
  
  // If the section is near the top (snapped position), return 1
  if (Math.abs(elementTop) < 10) { // Within 10px of perfect alignment
    return 1;
  }
  
  // If the section is mostly out of view, return 0
  if (elementTop > viewportHeight * 0.8 || elementTop < -elementHeight * 0.8) {
    return 0;
  }
  
  // Otherwise calculate smooth progress
  return Math.max(0, Math.min(1,
    (viewportHeight - elementTop) / (viewportHeight + elementHeight)
  ));
};

/**
 * Enhanced debounce with scroll snap detection
 */
const debounceWithSnap = (func, wait) => {
  let timeout;
  let lastCall = 0;
  
  return function executedFunction(...args) {
    const now = Date.now();
    
    // If this is a rapid call (likely during snap), use shorter wait
    const dynamicWait = (now - lastCall < 100) ? wait / 2 : wait;
    
    const later = () => {
      clearTimeout(timeout);
      lastCall = now;
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, dynamicWait);
  };
};

/**
 * Detect if browser supports scroll snapping
 */
const supportsScrollSnap = () => {
  return CSS.supports('scroll-snap-type', 'y mandatory') || 
         CSS.supports('scroll-snap-type', 'y proximity');
};

/**
 * Enhanced useScrollObserver Hook with scroll snap support
 */
export const useScrollObserver = (options = {}) => {
  const {
    sectionSelector = '.scroll-section',
    debounceMs = supportsScrollSnap() ? 32 : 16, // Longer debounce with scroll snap
    onSectionChange = null,
    onProgressChange = null,
    isMobile = false
  } = options;

  // State
  const [visibleSections, setVisibleSections] = useState(new Map());
  const [currentSection, setCurrentSection] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isSnapping, setIsSnapping] = useState(false);
  
  // Refs
  const observerRef = useRef(null);
  const sectionsRef = useRef(new Map());
  const lastUpdateRef = useRef(0);
  const snapTimeoutRef = useRef(null);

  /**
   * Enhanced intersection handler with snap detection
   */
  const handleIntersection = useCallback(
    debounceWithSnap((entries) => {
      const now = performance.now();
      
      // Skip if updating too frequently (unless during snap)
      if (!isSnapping && now - lastUpdateRef.current < debounceMs) {
        return;
      }
      lastUpdateRef.current = now;

      const newVisibleSections = new Map();
      let mostVisibleSection = null;
      let maxVisibility = 0;
      let snapCandidate = null;

      entries.forEach((entry) => {
        const sectionId = entry.target.id;
        const progress = calculateSectionProgress(entry);
        
        if (entry.isIntersecting) {
          newVisibleSections.set(sectionId, {
            element: entry.target,
            progress,
            intersectionRatio: entry.intersectionRatio,
            bounds: entry.boundingClientRect
          });

          // Check for snap position (element at top of viewport)
          const elementTop = entry.boundingClientRect.top;
          if (Math.abs(elementTop) < 20 && entry.intersectionRatio > 0.8) {
            snapCandidate = {
              id: sectionId,
              element: entry.target,
              progress: 1,
              intersectionRatio: entry.intersectionRatio,
              isSnapped: true
            };
          }

          // Track most visible section
          if (entry.intersectionRatio > maxVisibility) {
            maxVisibility = entry.intersectionRatio;
            mostVisibleSection = {
              id: sectionId,
              element: entry.target,
              progress,
              intersectionRatio: entry.intersectionRatio,
              isSnapped: !!snapCandidate && snapCandidate.id === sectionId
            };
          }
        }
      });

      // Prefer snapped section over most visible
      const activeSection = snapCandidate || mostVisibleSection;

      // Update visible sections
      setVisibleSections(newVisibleSections);

      // Handle section changes
      if (activeSection && (!currentSection || currentSection.id !== activeSection.id)) {
        const oldSection = currentSection;
        setCurrentSection(activeSection);
        
        // Detect snapping state
        if (activeSection.isSnapped && !isSnapping) {
          setIsSnapping(true);
          
          // Clear snapping state after a delay
          if (snapTimeoutRef.current) {
            clearTimeout(snapTimeoutRef.current);
          }
          snapTimeoutRef.current = setTimeout(() => {
            setIsSnapping(false);
          }, 500);
        }
        
        // Section change callback
        if (onSectionChange) {
          onSectionChange(activeSection, oldSection);
        }
        
        console.log(`📍 Section changed: ${oldSection?.id || 'none'} → ${activeSection.id}${activeSection.isSnapped ? ' (SNAPPED)' : ''}`);
      }

      // Calculate enhanced scroll progress
      if (activeSection) {
        const sections = Array.from(document.querySelectorAll(sectionSelector));
        const currentIndex = sections.findIndex(section => section.id === activeSection.id);
        const totalSections = sections.length;
        
        if (totalSections > 0) {
          // For snapped sections, use clean progress values
          if (activeSection.isSnapped) {
            const snapProgress = currentIndex / Math.max(1, totalSections - 1);
            setScrollProgress(snapProgress);
          } else {
            // Use smooth progress for non-snapped sections
            const baseProgress = currentIndex / Math.max(1, totalSections - 1);
            const sectionProgress = activeSection.progress / totalSections;
            const overallProgress = Math.min(1, baseProgress + sectionProgress);
            setScrollProgress(overallProgress);
          }
          
          if (onProgressChange) {
            onProgressChange(scrollProgress, activeSection);
          }
        }
      }
    }, debounceMs),
    [currentSection, debounceMs, onSectionChange, onProgressChange, sectionSelector, isSnapping]
  );

  /**
   * Set up enhanced Intersection Observer
   */
  useEffect(() => {
    // Clean up existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Use appropriate config
    const observerConfig = isMobile ? MOBILE_OBSERVER_CONFIG : OBSERVER_CONFIG;

    // Create new observer
    observerRef.current = new IntersectionObserver(
      handleIntersection,
      observerConfig
    );

    // Find and observe all sections
    const sections = document.querySelectorAll(sectionSelector);
    sections.forEach((section) => {
      if (section.id) {
        observerRef.current.observe(section);
        sectionsRef.current.set(section.id, section);
      } else {
        console.warn('Section without ID found:', section);
      }
    });

    console.log(`🔍 Enhanced ScrollObserver: Watching ${sections.length} sections ${supportsScrollSnap() ? 'with scroll snap support' : ''}`);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current);
      }
      sectionsRef.current.clear();
    };
  }, [handleIntersection, sectionSelector, isMobile]);

  /**
   * Enhanced scroll to section with snap support
   */
  const scrollToSection = useCallback((sectionId, behavior = 'smooth') => {
    const section = sectionsRef.current.get(sectionId) || 
                    document.getElementById(sectionId);
    
    if (section) {
      // For scroll snap support, ensure we scroll to the exact top
      section.scrollIntoView({ 
        behavior,
        block: 'start',
        inline: 'nearest'
      });
      
      // Set snapping state temporarily
      setIsSnapping(true);
      setTimeout(() => setIsSnapping(false), 1000);
      
    } else {
      console.warn(`Section ${sectionId} not found`);
    }
  }, []);

  /**
   * Get section data by ID
   */
  const getSectionData = useCallback((sectionId) => {
    return visibleSections.get(sectionId) || null;
  }, [visibleSections]);

  /**
   * Check if a section is visible
   */
  const isSectionVisible = useCallback((sectionId) => {
    return visibleSections.has(sectionId);
  }, [visibleSections]);

  /**
   * Get all visible section IDs
   */
  const getVisibleSectionIds = useCallback(() => {
    return Array.from(visibleSections.keys());
  }, [visibleSections]);

  /**
   * Get the next/previous section with snap awareness
   */
  const getAdjacentSection = useCallback((direction = 'next') => {
    if (!currentSection) return null;

    const sections = Array.from(document.querySelectorAll(sectionSelector));
    const currentIndex = sections.findIndex(section => section.id === currentSection.id);
    
    if (currentIndex === -1) return null;

    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    const nextSection = sections[nextIndex];
    
    return nextSection ? {
      id: nextSection.id,
      element: nextSection
    } : null;
  }, [currentSection, sectionSelector]);

  /**
   * Navigate to next/previous section
   */
  const navigateToAdjacent = useCallback((direction = 'next') => {
    const adjacentSection = getAdjacentSection(direction);
    if (adjacentSection) {
      scrollToSection(adjacentSection.id);
    }
  }, [getAdjacentSection, scrollToSection]);

  return {
    // Current state
    currentSection,
    visibleSections,
    scrollProgress,
    isSnapping,
    
    // Query functions
    getSectionData,
    isSectionVisible,
    getVisibleSectionIds,
    
    // Navigation functions
    scrollToSection,
    getAdjacentSection,
    navigateToAdjacent,
    
    // Utility
    isObserving: !!observerRef.current,
    supportsScrollSnap: supportsScrollSnap(),
    
    // Debug info
    debugInfo: {
      observedSections: sectionsRef.current.size,
      visibleCount: visibleSections.size,
      currentSectionId: currentSection?.id || null,
      scrollProgress: Math.round(scrollProgress * 100) + '%',
      isSnapping,
      snapSupported: supportsScrollSnap()
    }
  };
};

/**
 * Enhanced crystal scroll observer with snap support
 */
export const useCrystalScrollObserver = (options = {}) => {
  const {
    onCrystalStateChange = null,
    ...scrollObserverOptions
  } = options;

  const scrollObserver = useScrollObserver(scrollObserverOptions);

  // Enhanced crystal state mapping with snap awareness
  const getCrystalState = useCallback((sectionId, isSnapped = false) => {
    if (!sectionId) return 'WHOLE';

    if (sectionId === 'hero') return 'WHOLE';
    if (sectionId === 'projects-overview') return 'EXPLODED';
    
    // Individual project sections
    if (sectionId.startsWith('project-')) return 'PROJECT_SELECTED';
    
    if (sectionId === 'about') return 'WHOLE';
    
    return 'WHOLE';
  }, []);

  // Get selected facet from project section
  const getSelectedFacet = useCallback((sectionId) => {
    if (!sectionId || !sectionId.startsWith('project-')) return null;
    return sectionId.replace('project-', '');
  }, []);

  // Track crystal state changes
  const [currentCrystalState, setCurrentCrystalState] = useState('WHOLE');
  const [selectedFacet, setSelectedFacet] = useState(null);

  // Update crystal state when section changes
  useEffect(() => {
    if (scrollObserver.currentSection) {
      const newState = getCrystalState(
        scrollObserver.currentSection.id, 
        scrollObserver.currentSection.isSnapped
      );
      const newFacet = getSelectedFacet(scrollObserver.currentSection.id);

      if (newState !== currentCrystalState) {
        setCurrentCrystalState(newState);
      }

      if (newFacet !== selectedFacet) {
        setSelectedFacet(newFacet);
      }

      // Enhanced callback with snap information
      if (onCrystalStateChange) {
        onCrystalStateChange({
          crystalState: newState,
          selectedFacet: newFacet,
          section: scrollObserver.currentSection,
          progress: scrollObserver.scrollProgress,
          isSnapped: scrollObserver.currentSection.isSnapped || false,
          isSnapping: scrollObserver.isSnapping
        });
      }
    }
  }, [
    scrollObserver.currentSection, 
    scrollObserver.scrollProgress,
    scrollObserver.isSnapping,
    getCrystalState,
    getSelectedFacet,
    currentCrystalState,
    selectedFacet,
    onCrystalStateChange
  ]);

  return {
    ...scrollObserver,
    
    // Crystal-specific state
    crystalState: currentCrystalState,
    selectedFacet,
    
    // Crystal-specific helpers
    getCrystalState,
    getSelectedFacet,
    
    // Enhanced debug info
    debugInfo: {
      ...scrollObserver.debugInfo,
      crystalState: currentCrystalState,
      selectedFacet,
      snapTransitions: scrollObserver.isSnapping
    }
  };
};

export default useScrollObserver;