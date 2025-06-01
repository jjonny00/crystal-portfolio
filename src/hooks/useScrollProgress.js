// src/hooks/useScrollProgress.js
// ENHANCED: Scroll progress calculation optimized for CSS scroll snapping

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Throttle function optimized for scroll snapping
 */
const throttleWithSnap = (func, limit) => {
  let inThrottle;
  let lastScrollY = 0;
  
  return function() {
    const args = arguments;
    const context = this;
    const currentScrollY = window.pageYOffset;
    
    // Detect potential snap (small movements)
    const isLikelySnapping = Math.abs(currentScrollY - lastScrollY) < 5;
    const dynamicLimit = isLikelySnapping ? limit / 2 : limit;
    
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, dynamicLimit);
    }
    
    lastScrollY = currentScrollY;
  };
};

/**
 * Enhanced debounce with snap detection
 */
const debounceWithSnapDetection = (func, wait) => {
  let timeout;
  let isSnapping = false;
  
  return function executedFunction(...args) {
    const wasSnapping = isSnapping;
    
    // Detect if we're in a snapping scenario
    isSnapping = args[0] && args[0].isSnapping;
    
    // Use shorter delay during snapping for responsiveness
    const dynamicWait = isSnapping || wasSnapping ? wait / 3 : wait;
    
    const later = () => {
      clearTimeout(timeout);
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
 * Enhanced scroll velocity calculation with snap awareness
 */
const useScrollVelocity = () => {
  const [velocity, setVelocity] = useState(0);
  const [isSnapping, setIsSnapping] = useState(false);
  const lastScrollY = useRef(window.pageYOffset);
  const lastTimestamp = useRef(Date.now());
  const snapDetectionTimeout = useRef(null);

  const updateVelocity = useCallback(() => {
    const currentScrollY = window.pageYOffset;
    const currentTime = Date.now();
    
    const deltaY = Math.abs(currentScrollY - lastScrollY.current);
    const deltaTime = Math.max(currentTime - lastTimestamp.current, 1);
    
    const currentVelocity = deltaY / deltaTime; // pixels per ms
    
    // Detect snapping (very small movements followed by stops)
    const isLikelySnapping = deltaY < 3 && currentVelocity < 0.1;
    
    if (isLikelySnapping && !isSnapping) {
      setIsSnapping(true);
      // Clear snapping state after a delay
      if (snapDetectionTimeout.current) {
        clearTimeout(snapDetectionTimeout.current);
      }
      snapDetectionTimeout.current = setTimeout(() => {
        setIsSnapping(false);
      }, 200);
    }
    
    setVelocity(currentVelocity);

    lastScrollY.current = currentScrollY;
    lastTimestamp.current = currentTime;
  }, [isSnapping]);

  return { velocity, updateVelocity, isSnapping };
};

/**
 * Enhanced scroll progress hook with CSS scroll snap support
 */
export const useScrollProgress = (options = {}) => {
  const {
    throttleMs = supportsScrollSnap() ? 24 : 16, // Slightly slower with scroll snap
    debounceMs = supportsScrollSnap() ? 100 : 150, // Faster response with snap
    includeVelocity = true,
    includeSnapDetection = true,
    debugMode = false
  } = options;

  // State
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [documentHeight, setDocumentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [currentSection, setCurrentSection] = useState(null);

  // Enhanced scroll velocity with snap detection
  const { velocity, updateVelocity, isSnapping } = useScrollVelocity();

  // Refs for cleanup
  const scrollListenerRef = useRef(null);
  const resizeListenerRef = useRef(null);
  const snapStateRef = useRef(false);

  /**
   * Calculate document dimensions
   */
  const updateDocumentDimensions = useCallback(() => {
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    
    const vpHeight = window.innerHeight;
    
    setDocumentHeight(docHeight);
    setViewportHeight(vpHeight);
    
    if (debugMode) {
      console.log('📏 Document dimensions updated:', {
        documentHeight: docHeight,
        viewportHeight: vpHeight,
        scrollableHeight: docHeight - vpHeight,
        snapSupported: supportsScrollSnap()
      });
    }
  }, [debugMode]);

  /**
   * Enhanced scroll progress calculation with snap awareness
   */
  const calculateScrollProgress = useCallback(() => {
    const scrolled = window.pageYOffset || document.documentElement.scrollTop;
    const maxScroll = Math.max(documentHeight - viewportHeight, 1);
    let progress = Math.min(Math.max(scrolled / maxScroll, 0), 1);
    
    // For scroll snapping, quantize progress to cleaner values when snapped
    if (supportsScrollSnap() && isSnapping) {
      // Detect which section we're likely snapped to
      const sections = document.querySelectorAll('.scroll-section');
      if (sections.length > 0) {
        let closestSectionIndex = 0;
        let minDistance = Infinity;
        
        sections.forEach((section, index) => {
          const sectionTop = section.offsetTop;
          const distance = Math.abs(scrolled - sectionTop);
          if (distance < minDistance) {
            minDistance = distance;
            closestSectionIndex = index;
          }
        });
        
        // If we're very close to a section (snapped), use quantized progress
        if (minDistance < 50) { // Within 50px of perfect alignment
          const quantizedProgress = closestSectionIndex / Math.max(sections.length - 1, 1);
          progress = quantizedProgress;
          
          if (debugMode) {
            console.log(`📍 Snapped to section ${closestSectionIndex}, quantized progress: ${Math.round(progress * 100)}%`);
          }
        }
      }
    }
    
    return progress;
  }, [documentHeight, viewportHeight, isSnapping, debugMode]);

  /**
   * Determine current section based on scroll position
   */
  const determineCurrentSection = useCallback(() => {
    const sections = document.querySelectorAll('.scroll-section');
    const scrolled = window.pageYOffset;
    
    let currentSectionId = null;
    let minDistance = Infinity;
    
    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const distance = Math.abs(scrolled - sectionTop);
      
      if (distance < minDistance) {
        minDistance = distance;
        currentSectionId = section.id;
      }
    });
    
    return currentSectionId;
  }, []);

  /**
   * Handle scroll events with snap awareness
   */
  const handleScroll = useCallback(() => {
    const progress = calculateScrollProgress();
    const sectionId = determineCurrentSection();
    
    setScrollProgress(progress);
    setIsScrolling(true);
    
    if (sectionId !== currentSection) {
      setCurrentSection(sectionId);
    }
    
    // Update velocity if enabled
    if (includeVelocity) {
      updateVelocity();
    }
    
    if (debugMode && Math.random() < 0.03) { // Log occasionally
      console.log('📜 Enhanced scroll progress:', {
        progress: Math.round(progress * 100) + '%',
        scrollY: window.pageYOffset,
        velocity: Math.round(velocity * 1000) / 1000,
        isSnapping,
        currentSection: sectionId,
        snapSupported: supportsScrollSnap()
      });
    }
  }, [
    calculateScrollProgress, 
    determineCurrentSection,
    currentSection,
    includeVelocity, 
    updateVelocity, 
    velocity, 
    isSnapping,
    debugMode
  ]);

  /**
   * Enhanced scroll end detection with snap awareness
   */
  const handleScrollEnd = useCallback(debounceWithSnapDetection(() => {
    setIsScrolling(false);
    
    if (debugMode) {
      console.log('📜 Scroll ended at:', {
        progress: Math.round(scrollProgress * 100) + '%',
        section: currentSection,
        wasSnapping: isSnapping
      });
    }
  }, debounceMs), [scrollProgress, currentSection, isSnapping, debugMode, debounceMs]);

  /**
   * Handle window resize
   */
  const handleResize = useCallback(() => {
    updateDocumentDimensions();
    
    // Recalculate progress after resize
    const progress = calculateScrollProgress();
    setScrollProgress(progress);
  }, [updateDocumentDimensions, calculateScrollProgress]);

  /**
   * Set up event listeners with snap optimization
   */
  useEffect(() => {
    // Initial dimension calculation
    updateDocumentDimensions();
    
    // Set up optimized scroll listener
    const throttledScroll = throttleWithSnap(handleScroll, throttleMs);
    
    // Combined scroll handler
    const scrollHandler = () => {
      throttledScroll();
      handleScrollEnd({ isSnapping });
    };
    
    // Set up resize listener
    const throttledResize = throttleWithSnap(handleResize, 100);
    
    // Add listeners
    window.addEventListener('scroll', scrollHandler, { passive: true });
    window.addEventListener('resize', throttledResize, { passive: true });
    
    // Store refs for cleanup
    scrollListenerRef.current = scrollHandler;
    resizeListenerRef.current = throttledResize;
    
    // Initial scroll calculation
    handleScroll();
    
    // Cleanup
    return () => {
      if (scrollListenerRef.current) {
        window.removeEventListener('scroll', scrollListenerRef.current);
      }
      if (resizeListenerRef.current) {
        window.removeEventListener('resize', resizeListenerRef.current);
      }
    };
  }, [
    handleScroll, 
    handleScrollEnd, 
    handleResize, 
    throttleMs, 
    updateDocumentDimensions,
    isSnapping
  ]);

  /**
   * Enhanced zone progress calculation with snap awareness
   */
  const getZoneProgress = useCallback((zoneName, zones) => {
    const zone = zones[zoneName];
    if (!zone) return 0;
    
    let zoneProgress = Math.max(0, Math.min(1, 
      (scrollProgress - zone.start) / (zone.end - zone.start)
    ));
    
    // Quantize zone progress when snapping
    if (supportsScrollSnap() && isSnapping) {
      zoneProgress = Math.round(zoneProgress * 4) / 4; // Snap to quarters
    }
    
    return zoneProgress;
  }, [scrollProgress, isSnapping]);

  /**
   * Enhanced scroll to progress with snap support
   */
  const scrollToProgress = useCallback((targetProgress, behavior = 'smooth') => {
    const maxScroll = documentHeight - viewportHeight;
    const targetScrollY = targetProgress * maxScroll;
    
    // For scroll snap support, try to align to nearest section
    if (supportsScrollSnap()) {
      const sections = document.querySelectorAll('.scroll-section');
      if (sections.length > 0) {
        let closestSection = null;
        let minDistance = Infinity;
        
        sections.forEach((section) => {
          const sectionTop = section.offsetTop;
          const distance = Math.abs(targetScrollY - sectionTop);
          if (distance < minDistance) {
            minDistance = distance;
            closestSection = section;
          }
        });
        
        if (closestSection && minDistance < viewportHeight * 0.2) {
          // Scroll to the closest section instead
          closestSection.scrollIntoView({
            behavior,
            block: 'start',
            inline: 'nearest'
          });
          return;
        }
      }
    }
    
    // Fallback to normal scroll
    window.scrollTo({
      top: targetScrollY,
      behavior: behavior
    });
  }, [documentHeight, viewportHeight]);

  /**
   * Enhanced zone navigation with snap awareness
   */
  const scrollToZone = useCallback((zoneName, zones, behavior = 'smooth') => {
    const zone = zones[zoneName];
    if (!zone) {
      console.warn(`Zone "${zoneName}" not found`);
      return;
    }
    
    scrollToProgress(zone.start, behavior);
  }, [scrollToProgress]);

  return {
    // Current state
    scrollProgress,
    isScrolling,
    velocity: includeVelocity ? velocity : 0,
    isSnapping: includeSnapDetection ? isSnapping : false,
    currentSection,
    
    // Document info
    documentHeight,
    viewportHeight,
    maxScroll: Math.max(documentHeight - viewportHeight, 0),
    
    // Zone utilities (enhanced)
    getZoneProgress,
    isInZone: useCallback((zoneName, zones) => {
      const zone = zones[zoneName];
      if (!zone) return false;
      return scrollProgress >= zone.start && scrollProgress <= zone.end;
    }, [scrollProgress]),
    
    getCurrentZone: useCallback((zones) => {
      for (const [zoneName, zone] of Object.entries(zones)) {
        if (scrollProgress >= zone.start && scrollProgress <= zone.end) {
          return {
            name: zoneName,
            progress: getZoneProgress(zoneName, zones),
            zone: zone,
            isSnapped: isSnapping
          };
        }
      }
      return null;
    }, [scrollProgress, getZoneProgress, isSnapping]),
    
    // Enhanced navigation
    scrollToProgress,
    scrollToZone,
    
    // Utilities with snap awareness
    isFastScrolling: velocity > (isSnapping ? 20 : 50), // Lower threshold when snapping
    scrollDirection: velocity > 0 ? 'down' : 'up',
    supportsScrollSnap: supportsScrollSnap(),
    
    // Debug info
    debugInfo: debugMode ? {
      scrollY: window.pageYOffset,
      progress: Math.round(scrollProgress * 100) + '%',
      velocity: Math.round(velocity * 1000) / 1000,
      documentHeight,
      viewportHeight,
      isScrolling,
      isSnapping,
      currentSection,
      snapSupported: supportsScrollSnap()
    } : null
  };
};