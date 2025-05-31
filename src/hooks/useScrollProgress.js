// src/hooks/useScrollProgress.js
// Phase 1: Simple, reliable scroll progress calculation

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Throttle function for performance
 */
const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Debounce function for scroll end detection
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
 * Calculate scroll velocity for animation speed adjustments
 */
const useScrollVelocity = () => {
  const [velocity, setVelocity] = useState(0);
  const lastScrollY = useRef(window.pageYOffset);
  const lastTimestamp = useRef(Date.now());

  const updateVelocity = useCallback(() => {
    const currentScrollY = window.pageYOffset;
    const currentTime = Date.now();
    
    const deltaY = Math.abs(currentScrollY - lastScrollY.current);
    const deltaTime = Math.max(currentTime - lastTimestamp.current, 1);
    
    const currentVelocity = deltaY / deltaTime; // pixels per ms
    setVelocity(currentVelocity);

    lastScrollY.current = currentScrollY;
    lastTimestamp.current = currentTime;
  }, []);

  return { velocity, updateVelocity };
};

/**
 * Main scroll progress hook
 * Provides reliable 0-1 progress through the entire document
 */
export const useScrollProgress = (options = {}) => {
  const {
    throttleMs = 16,        // ~60fps updates
    debounceMs = 150,       // Scroll end detection
    includeVelocity = true, // Include velocity calculations
    debugMode = false
  } = options;

  // State
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [documentHeight, setDocumentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Scroll velocity
  const { velocity, updateVelocity } = useScrollVelocity();

  // Refs for cleanup
  const scrollListenerRef = useRef(null);
  const resizeListenerRef = useRef(null);

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
        scrollableHeight: docHeight - vpHeight
      });
    }
  }, [debugMode]);

  /**
   * Calculate scroll progress (0 to 1)
   */
  const calculateScrollProgress = useCallback(() => {
    const scrolled = window.pageYOffset || document.documentElement.scrollTop;
    const maxScroll = Math.max(documentHeight - viewportHeight, 1); // Prevent division by zero
    const progress = Math.min(Math.max(scrolled / maxScroll, 0), 1); // Clamp between 0 and 1
    
    return progress;
  }, [documentHeight, viewportHeight]);

  /**
   * Handle scroll events
   */
  const handleScroll = useCallback(() => {
    const progress = calculateScrollProgress();
    setScrollProgress(progress);
    setIsScrolling(true);
    
    // Update velocity if enabled
    if (includeVelocity) {
      updateVelocity();
    }
    
    if (debugMode && Math.random() < 0.05) { // Only log occasionally
      console.log('📜 Scroll progress:', {
        progress: Math.round(progress * 100) + '%',
        scrollY: window.pageYOffset,
        velocity: Math.round(velocity * 1000) / 1000
      });
    }
  }, [calculateScrollProgress, includeVelocity, updateVelocity, velocity, debugMode]);

  /**
   * Handle scroll end
   */
  const handleScrollEnd = useCallback(() => {
    setIsScrolling(false);
    
    if (debugMode) {
      console.log('📜 Scroll ended at:', Math.round(scrollProgress * 100) + '%');
    }
  }, [scrollProgress, debugMode]);

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
   * Set up event listeners
   */
  useEffect(() => {
    // Initial dimension calculation
    updateDocumentDimensions();
    
    // Set up throttled scroll listener
    const throttledScroll = throttle(handleScroll, throttleMs);
    const debouncedScrollEnd = debounce(handleScrollEnd, debounceMs);
    
    // Combined scroll handler
    const scrollHandler = () => {
      throttledScroll();
      debouncedScrollEnd();
    };
    
    // Set up resize listener
    const throttledResize = throttle(handleResize, 100);
    
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
  }, [handleScroll, handleScrollEnd, handleResize, throttleMs, debounceMs, updateDocumentDimensions]);

  /**
   * Get scroll progress within a specific zone
   */
  const getZoneProgress = useCallback((zoneName, zones) => {
    const zone = zones[zoneName];
    if (!zone) return 0;
    
    const zoneProgress = Math.max(0, Math.min(1, 
      (scrollProgress - zone.start) / (zone.end - zone.start)
    ));
    
    return zoneProgress;
  }, [scrollProgress]);

  /**
   * Check if we're in a specific zone
   */
  const isInZone = useCallback((zoneName, zones) => {
    const zone = zones[zoneName];
    if (!zone) return false;
    
    return scrollProgress >= zone.start && scrollProgress <= zone.end;
  }, [scrollProgress]);

  /**
   * Get current zone from zones config
   */
  const getCurrentZone = useCallback((zones) => {
    for (const [zoneName, zone] of Object.entries(zones)) {
      if (scrollProgress >= zone.start && scrollProgress <= zone.end) {
        return {
          name: zoneName,
          progress: getZoneProgress(zoneName, zones),
          zone: zone
        };
      }
    }
    return null;
  }, [scrollProgress, getZoneProgress]);

  /**
   * Scroll to specific progress (0-1)
   */
  const scrollToProgress = useCallback((targetProgress, behavior = 'smooth') => {
    const maxScroll = documentHeight - viewportHeight;
    const targetScrollY = targetProgress * maxScroll;
    
    window.scrollTo({
      top: targetScrollY,
      behavior: behavior
    });
  }, [documentHeight, viewportHeight]);

  /**
   * Scroll to specific zone
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
    
    // Document info
    documentHeight,
    viewportHeight,
    maxScroll: Math.max(documentHeight - viewportHeight, 0),
    
    // Zone utilities
    getZoneProgress,
    isInZone,
    getCurrentZone,
    
    // Navigation
    scrollToProgress,
    scrollToZone,
    
    // Utilities
    isFastScrolling: velocity > 50, // Threshold for "fast" scrolling
    scrollDirection: velocity > 0 ? 'down' : 'up',
    
    // Debug info
    debugInfo: debugMode ? {
      scrollY: window.pageYOffset,
      progress: Math.round(scrollProgress * 100) + '%',
      velocity: Math.round(velocity * 1000) / 1000,
      documentHeight,
      viewportHeight,
      isScrolling
    } : null
  };
};