// src/hooks/useScrollObserver.js
// FIXED: Scroll observer that works with .scroll-container as the scroll parent

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * FIXED: Observer configuration that uses scroll-container as root
 */
const getObserverConfig = (scrollContainer) => ({
  // CRITICAL: Use scroll-container as root instead of viewport
  root: scrollContainer,
  threshold: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0],
  rootMargin: '0px'
});

/**
 * FIXED: Calculate section progress relative to scroll container
 */
const calculateSectionProgress = (entry, scrollContainer) => {
  const { intersectionRatio, boundingClientRect } = entry;
  
  if (!scrollContainer) return intersectionRatio;
  
  const containerRect = scrollContainer.getBoundingClientRect();
  const elementTop = boundingClientRect.top - containerRect.top;
  const containerHeight = containerRect.height;
  
  // Check if section is snapped to top (within 10px)
  if (Math.abs(elementTop) < 10 && intersectionRatio > 0.8) {
    return 1; // Fully visible and snapped
  }
  
  // Calculate smooth progress
  if (elementTop > containerHeight * 0.8 || elementTop < -boundingClientRect.height * 0.8) {
    return 0;
  }
  
  return Math.max(0, Math.min(1,
    (containerHeight - elementTop) / (containerHeight + boundingClientRect.height)
  ));
};

/**
 * Enhanced useScrollObserver Hook that works with scroll-container
 */
export const useScrollObserver = (options = {}) => {
  const {
    sectionSelector = '.scroll-section',
    containerSelector = '.scroll-container',
    debounceMs = 32,
    onSectionChange = null,
    onProgressChange = null,
    debugMode = false
  } = options;

  // State
  const [visibleSections, setVisibleSections] = useState(new Map());
  const [currentSection, setCurrentSection] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isSnapping, setIsSnapping] = useState(false);
  
  // Refs
  const observerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const sectionsRef = useRef(new Map());
  const lastUpdateRef = useRef(0);
  const snapTimeoutRef = useRef(null);

  /**
   * FIXED: Debounce function that accounts for snapping
   */
  const debounce = useCallback((func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  /**
   * FIXED: Handle intersection changes with scroll container awareness
   */
  const handleIntersection = useCallback(
    debounce((entries) => {
      const now = performance.now();
      
      if (now - lastUpdateRef.current < debounceMs) {
        return;
      }
      lastUpdateRef.current = now;

      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      const newVisibleSections = new Map();
      let mostVisibleSection = null;
      let maxVisibility = 0;
      let snapCandidate = null;

      entries.forEach((entry) => {
        const sectionId = entry.target.id;
        const progress = calculateSectionProgress(entry, scrollContainer);
        
        if (entry.isIntersecting) {
          newVisibleSections.set(sectionId, {
            element: entry.target,
            progress,
            intersectionRatio: entry.intersectionRatio,
            bounds: entry.boundingClientRect
          });

          // Check for snap position (element at top of container)
          const containerRect = scrollContainer.getBoundingClientRect();
          const elementTop = entry.boundingClientRect.top - containerRect.top;
          
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
        
        if (debugMode) {
          console.log(`📍 Section changed: ${oldSection?.id || 'none'} → ${activeSection.id}${activeSection.isSnapped ? ' (SNAPPED)' : ''}`);
        }
      }

      // Calculate scroll progress based on sections
      if (activeSection) {
        const sections = Array.from(scrollContainer.querySelectorAll(sectionSelector));
        const currentIndex = sections.findIndex(section => section.id === activeSection.id);
        const totalSections = sections.length;
        
        if (totalSections > 0) {
          let overallProgress;
          
          if (activeSection.isSnapped) {
            // Clean progress for snapped sections
            overallProgress = currentIndex / Math.max(1, totalSections - 1);
          } else {
            // Smooth progress for transitioning sections
            const baseProgress = currentIndex / Math.max(1, totalSections - 1);
            const sectionProgress = activeSection.progress / totalSections;
            overallProgress = Math.min(1, baseProgress + sectionProgress);
          }
          
          setScrollProgress(overallProgress);
          
          if (onProgressChange) {
            onProgressChange(overallProgress, activeSection);
          }
        }
      }
    }, debounceMs),
    [currentSection, debounceMs, onSectionChange, onProgressChange, sectionSelector, isSnapping, debugMode]
  );

  /**
   * FIXED: Set up Intersection Observer with scroll container as root
   */
  useEffect(() => {
    // Find the scroll container
    const scrollContainer = document.querySelector(containerSelector);
    if (!scrollContainer) {
      console.error(`Scroll container not found: ${containerSelector}`);
      return;
    }
    
    scrollContainerRef.current = scrollContainer;

    // Clean up existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create observer with scroll container as root
    const observerConfig = getObserverConfig(scrollContainer);
    observerRef.current = new IntersectionObserver(
      handleIntersection,
      observerConfig
    );

    // Find and observe all sections within the scroll container
    const sections = scrollContainer.querySelectorAll(sectionSelector);
    sections.forEach((section) => {
      if (section.id) {
        observerRef.current.observe(section);
        sectionsRef.current.set(section.id, section);
      } else {
        console.warn('Section without ID found:', section);
      }
    });

    if (debugMode) {
      console.log(`🔍 ScrollObserver: Watching ${sections.length} sections in container`);
    }

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
  }, [handleIntersection, sectionSelector, containerSelector, debugMode]);

  /**
   * FIXED: Scroll to section within the scroll container
   */
  const scrollToSection = useCallback((sectionId, behavior = 'smooth') => {
    const scrollContainer = scrollContainerRef.current;
    const section = sectionsRef.current.get(sectionId) || 
                    document.getElementById(sectionId);
    
    if (section && scrollContainer) {
      // Calculate the position relative to the scroll container
      const containerTop = scrollContainer.offsetTop;
      const sectionTop = section.offsetTop;
      const scrollPosition = sectionTop - containerTop;
      
      // Scroll the container
      scrollContainer.scrollTo({
        top: scrollPosition,
        behavior: behavior
      });
      
      // Set snapping state
      setIsSnapping(true);
      setTimeout(() => setIsSnapping(false), 1000);
      
      if (debugMode) {
        console.log(`🎯 Scrolling to ${sectionId} at position ${scrollPosition}`);
      }
    } else {
      console.warn(`Section ${sectionId} or scroll container not found`);
    }
  }, [debugMode]);

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
   * Get adjacent section
   */
  const getAdjacentSection = useCallback((direction = 'next') => {
    if (!currentSection || !scrollContainerRef.current) return null;

    const sections = Array.from(scrollContainerRef.current.querySelectorAll(sectionSelector));
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
   * Navigate to adjacent section
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
    scrollContainer: scrollContainerRef.current,
    
    // Debug info
    debugInfo: {
      observedSections: sectionsRef.current.size,
      visibleCount: visibleSections.size,
      currentSectionId: currentSection?.id || null,
      scrollProgress: Math.round(scrollProgress * 100) + '%',
      isSnapping,
      hasScrollContainer: !!scrollContainerRef.current
    }
  };
};

/**
 * FIXED: Crystal scroll observer that works with the new container
 */
export const useCrystalScrollObserver = (options = {}) => {
  const {
    onCrystalStateChange = null,
    debugMode = false,
    ...scrollObserverOptions
  } = options;

  const scrollObserver = useScrollObserver({
    ...scrollObserverOptions,
    debugMode
  });

  // Map sections to crystal states
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
        
        if (debugMode) {
          console.log(`💎 Crystal state changed: ${currentCrystalState} → ${newState}`);
        }
      }

      if (newFacet !== selectedFacet) {
        setSelectedFacet(newFacet);
        
        if (debugMode) {
          console.log(`🎯 Selected facet changed: ${selectedFacet} → ${newFacet}`);
        }
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
    onCrystalStateChange,
    debugMode
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