// src/hooks/useScrollObserver.js
// Intersection Observer hook to replace scroll event listeners

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Configuration for Intersection Observer
 * Optimized for crystal animation triggers
 */
const OBSERVER_CONFIG = {
  // Multiple thresholds for smooth progress tracking
  threshold: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0],
  // Trigger slightly before section is fully visible
  rootMargin: '-5% 0px -5% 0px',
  // Use document viewport as root
  root: null
};

/**
 * Mobile-optimized observer configuration
 * Larger trigger areas for better mobile experience
 */
const MOBILE_OBSERVER_CONFIG = {
  threshold: [0, 0.2, 0.5, 0.8, 1.0],
  rootMargin: '-10% 0px -10% 0px',
  root: null
};

/**
 * Calculate section progress based on intersection ratio and position
 */
const calculateSectionProgress = (entry) => {
  const { intersectionRatio, boundingClientRect, rootBounds } = entry;
  
  // Calculate how far into the viewport the section is
  const elementTop = boundingClientRect.top;
  const elementHeight = boundingClientRect.height;
  const viewportHeight = rootBounds.height;
  
  // Return progress from 0 to 1
  return Math.max(0, Math.min(1,
    (viewportHeight - elementTop) / (viewportHeight + elementHeight)
  ));
};

/**
 * Debounce function to prevent rapid state changes
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
 * useScrollObserver Hook
 * Replaces scroll event listeners with Intersection Observer
 */
export const useScrollObserver = (options = {}) => {
  const {
    sectionSelector = '.scroll-section',
    debounceMs = 16, // ~60fps
    onSectionChange = null,
    onProgressChange = null,
    isMobile = false
  } = options;

  // State for visible sections and their progress
  const [visibleSections, setVisibleSections] = useState(new Map());
  const [currentSection, setCurrentSection] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Refs for cleanup and performance
  const observerRef = useRef(null);
  const sectionsRef = useRef(new Map());
  const lastUpdateRef = useRef(0);

  /**
   * Handle intersection changes
   */
  const handleIntersection = useCallback(
    debounce((entries) => {
      const now = performance.now();
      
      // Skip if updating too frequently
      if (now - lastUpdateRef.current < debounceMs) {
        return;
      }
      lastUpdateRef.current = now;

      const newVisibleSections = new Map();
      let mostVisibleSection = null;
      let maxVisibility = 0;

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

          // Track the most visible section
          if (entry.intersectionRatio > maxVisibility) {
            maxVisibility = entry.intersectionRatio;
            mostVisibleSection = {
              id: sectionId,
              element: entry.target,
              progress,
              intersectionRatio: entry.intersectionRatio
            };
          }
        }
      });

      // Update visible sections
      setVisibleSections(newVisibleSections);

      // Update current section if it changed
      if (mostVisibleSection && (!currentSection || currentSection.id !== mostVisibleSection.id)) {
        const oldSection = currentSection;
        setCurrentSection(mostVisibleSection);
        
        // Callback for section changes
        if (onSectionChange) {
          onSectionChange(mostVisibleSection, oldSection);
        }
      }

      // Calculate overall scroll progress
      if (mostVisibleSection) {
        const sections = Array.from(document.querySelectorAll(sectionSelector));
        const currentIndex = sections.findIndex(section => section.id === mostVisibleSection.id);
        const totalSections = sections.length;
        
        if (totalSections > 0) {
          const baseProgress = currentIndex / Math.max(1, totalSections - 1);
          const sectionProgress = mostVisibleSection.progress / totalSections;
          const overallProgress = Math.min(1, baseProgress + sectionProgress);
          
          setScrollProgress(overallProgress);
          
          if (onProgressChange) {
            onProgressChange(overallProgress, mostVisibleSection);
          }
        }
      }
    }, debounceMs),
    [currentSection, debounceMs, onSectionChange, onProgressChange, sectionSelector]
  );

  /**
   * Set up Intersection Observer
   */
  useEffect(() => {
    // Clean up existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Use mobile-optimized config if needed
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

    console.log(`🔍 ScrollObserver: Watching ${sections.length} sections`);

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      sectionsRef.current.clear();
    };
  }, [handleIntersection, sectionSelector, isMobile]);

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
   * Scroll to a specific section
   */
  const scrollToSection = useCallback((sectionId, behavior = 'smooth') => {
    const section = sectionsRef.current.get(sectionId) || 
                    document.getElementById(sectionId);
    
    if (section) {
      section.scrollIntoView({ 
        behavior,
        block: 'start'
      });
    } else {
      console.warn(`Section ${sectionId} not found`);
    }
  }, []);

  /**
   * Get the next/previous section relative to current
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

  return {
    // Current state
    currentSection,
    visibleSections,
    scrollProgress,
    
    // Query functions
    getSectionData,
    isSectionVisible,
    getVisibleSectionIds,
    
    // Navigation functions
    scrollToSection,
    getAdjacentSection,
    
    // Utility
    isObserving: !!observerRef.current,
    
    // Debug info
    debugInfo: {
      observedSections: sectionsRef.current.size,
      visibleCount: visibleSections.size,
      currentSectionId: currentSection?.id || null,
      scrollProgress: Math.round(scrollProgress * 100) + '%'
    }
  };
};

/**
 * Higher-order hook for crystal-specific scroll observation
 * Maps sections to crystal states
 */
export const useCrystalScrollObserver = (options = {}) => {
  const {
    onCrystalStateChange = null,
    ...scrollObserverOptions
  } = options;

  const scrollObserver = useScrollObserver(scrollObserverOptions);

  // Map sections to crystal states
  const getCrystalState = useCallback((sectionId) => {
    if (!sectionId) return 'WHOLE';

    if (sectionId === 'hero') return 'WHOLE';
    if (sectionId === 'projects-overview') return 'EXPLODED';
    if (sectionId.startsWith('project-')) return 'PROJECT_SELECTED';
    if (sectionId === 'about') return 'WHOLE';
    if (sectionId === 'footer') return 'WHOLE';
    
    return 'WHOLE'; // Default fallback
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
      const newState = getCrystalState(scrollObserver.currentSection.id);
      const newFacet = getSelectedFacet(scrollObserver.currentSection.id);

      if (newState !== currentCrystalState) {
        setCurrentCrystalState(newState);
      }

      if (newFacet !== selectedFacet) {
        setSelectedFacet(newFacet);
      }

      // Callback for crystal state changes
      if (onCrystalStateChange) {
        onCrystalStateChange({
          crystalState: newState,
          selectedFacet: newFacet,
          section: scrollObserver.currentSection,
          progress: scrollObserver.scrollProgress
        });
      }
    }
  }, [
    scrollObserver.currentSection, 
    scrollObserver.scrollProgress,
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
      selectedFacet
    }
  };
};

export default useScrollObserver;