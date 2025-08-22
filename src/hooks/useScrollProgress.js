// src/hooks/useScrollProgress.js
// FIXED: Scroll progress calculation that works with .scroll-container

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * FIXED: Enhanced scroll progress hook that works with scroll container
 */
export const useScrollProgress = (options = {}) => {
  const {
    containerSelector = '.scroll-container',
    throttleMs = 16,
    debounceMs = 100,
    includeVelocity = true,
    debugMode = false
  } = options;

  // State
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [currentSection, setCurrentSection] = useState(null);
  const [velocity, setVelocity] = useState(0);

  // Refs
  const scrollContainerRef = useRef(null);
  const lastScrollTop = useRef(0);
  const lastTimestamp = useRef(Date.now());
  const scrollListenerRef = useRef(null);
  const resizeListenerRef = useRef(null);

  /**
   * Throttle function optimized for container scrolling
   */
  const throttle = useCallback((func, limit) => {
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
  }, []);

  /**
   * Debounce function for scroll end detection
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
   * Calculate container dimensions
   */
  const updateContainerDimensions = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const scrollHeight = container.scrollHeight;
    
    setContainerHeight(containerRect.height);
    setContentHeight(scrollHeight);
    
    // if (debugMode) {
    //   if (import.meta.env.DEV) console.log('📏 Container dimensions updated:', {
    //     containerHeight: containerRect.height,
    //     contentHeight: scrollHeight,
    //     scrollableHeight: scrollHeight - containerRect.height
    //   });
    // }
  }, [debugMode]);

  /**
   * FIXED: Calculate scroll progress relative to container
   */
  const calculateScrollProgress = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return 0;
    
    const scrollTop = container.scrollTop;
    const maxScroll = Math.max(container.scrollHeight - container.clientHeight, 1);
    let progress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
    
      // DEBUG: Log scroll calculation
      // if (debugMode) {
      //   if (import.meta.env.DEV) console.log('📏 Scroll Debug:', {
      //     scrollTop,
      //     maxScroll,
      //     rawProgress: progress,
      //     containerHeight: container.clientHeight,
      //     contentHeight: container.scrollHeight
      //   });
      // }

      return progress;
    }, [debugMode]);

  /**
   * Update velocity calculation
   */
  const updateVelocity = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const currentScrollTop = container.scrollTop;
    const currentTime = Date.now();
    
    const deltaY = Math.abs(currentScrollTop - lastScrollTop.current);
    const deltaTime = Math.max(currentTime - lastTimestamp.current, 1);
    
    const currentVelocity = deltaY / deltaTime; // pixels per ms
    setVelocity(currentVelocity);

    lastScrollTop.current = currentScrollTop;
    lastTimestamp.current = currentTime;
  }, []);

  /**
   * Determine current section
   */
  const determineCurrentSection = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return null;
    
    const sections = container.querySelectorAll('.scroll-section');
    const scrollTop = container.scrollTop;
    
    let currentSectionId = null;
    let minDistance = Infinity;
    
    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const distance = Math.abs(scrollTop - sectionTop);
      
      if (distance < minDistance) {
        minDistance = distance;
        currentSectionId = section.id;
      }
    });
    
    return currentSectionId;
  }, []);

  /**
   * FIXED: Handle scroll events on the container
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
    
    // if (debugMode && Math.random() < 0.05) {
    //   if (import.meta.env.DEV) console.log('📜 Container scroll progress:', {
    //     progress: Math.round(progress * 100) + '%',
    //     scrollTop: scrollContainerRef.current?.scrollTop,
    //     velocity: Math.round(velocity * 1000) / 1000,
      //     currentSection: sectionId
      //   });
    // }
    }, [
      calculateScrollProgress,
      determineCurrentSection,
      currentSection,
      includeVelocity,
      updateVelocity,
      velocity,
      debugMode
    ]);

  /**
   * Handle scroll end
   */
    const handleScrollEnd = useCallback(debounce(() => {
    setIsScrolling(false);

    if (debugMode) {
      if (import.meta.env.DEV) console.log('📜 Container scroll ended at:', {
        progress: Math.round(scrollProgress * 100) + '%',
        section: currentSection
      });
    }
  }, debounceMs), [scrollProgress, currentSection, debugMode, debounceMs]);

  /**
   * Handle container resize
   */
  const handleResize = useCallback(() => {
    updateContainerDimensions();
    
    // Recalculate progress after resize
    const progress = calculateScrollProgress();
    setScrollProgress(progress);
  }, [updateContainerDimensions, calculateScrollProgress]);

  /**
   * FIXED: Set up event listeners on the scroll container
   */
  useEffect(() => {
    // Find the scroll container
    const container = document.querySelector(containerSelector);
    if (!container) {
      if (import.meta.env.DEV) console.error(`Scroll container not found: ${containerSelector}`);
      return;
    }
    
    scrollContainerRef.current = container;
    
    // Initial setup
    updateContainerDimensions();
    
    // Set up scroll listener on container
    const throttledScroll = throttle(handleScroll, throttleMs);
    
    const scrollHandler = () => {
      throttledScroll();
      handleScrollEnd();
    };
    
    // Set up resize listener on window (for container size changes)
    const throttledResize = throttle(handleResize, 100);
    
    // Add listeners
    container.addEventListener('scroll', scrollHandler, { passive: true });
    window.addEventListener('resize', throttledResize, { passive: true });
    
    // Store refs for cleanup
    scrollListenerRef.current = scrollHandler;
    resizeListenerRef.current = throttledResize;
    
    // Initial calculation
    handleScroll();
    
    // if (debugMode) {
    //   if (import.meta.env.DEV) console.log('🔍 Scroll progress attached to container:', containerSelector);
    // }
    
    // Cleanup
    return () => {
      if (container && scrollListenerRef.current) {
        container.removeEventListener('scroll', scrollListenerRef.current);
      }
      if (resizeListenerRef.current) {
        window.removeEventListener('resize', resizeListenerRef.current);
      }
    };
  }, [
    containerSelector,
    handleScroll,
    handleScrollEnd,
    handleResize,
    throttleMs,
    updateContainerDimensions,
    debugMode
  ]);

  /**
   * Enhanced zone progress calculation
   */
    const getZoneProgress = useCallback((zoneName, zones) => {
      const zone = zones[zoneName];
      if (!zone) return 0;

      return Math.max(0, Math.min(1,
        (scrollProgress - zone.start) / (zone.end - zone.start)
      ));
    }, [scrollProgress]);

  /**
   * Check if in zone
   */
  const isInZone = useCallback((zoneName, zones) => {
    const zone = zones[zoneName];
    if (!zone) return false;
    return scrollProgress >= zone.start && scrollProgress <= zone.end;
  }, [scrollProgress]);

  /**
   * Get current zone
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
   * FIXED: Scroll to progress within container
   */
  const scrollToProgress = useCallback((targetProgress, behavior = 'smooth') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const maxScroll = container.scrollHeight - container.clientHeight;
    const targetScrollTop = targetProgress * maxScroll;
    
    container.scrollTo({
      top: targetScrollTop,
      behavior: behavior
    });
  }, []);

  /**
   * Scroll to zone
   */
  const scrollToZone = useCallback((zoneName, zones, behavior = 'smooth') => {
    const zone = zones[zoneName];
    if (!zone) {
      if (import.meta.env.DEV) console.warn(`Zone "${zoneName}" not found`);
      return;
    }
    
    scrollToProgress(zone.start, behavior);
  }, [scrollToProgress]);

  return {
    // Current state
      scrollProgress,
      isScrolling,
      velocity: includeVelocity ? velocity : 0,
      currentSection,
    
    // Container info
    containerHeight,
    contentHeight,
    maxScroll: Math.max(contentHeight - containerHeight, 0),
    scrollContainer: scrollContainerRef.current,
    
      // Zone utilities
      getZoneProgress,
      isInZone,
      getCurrentZone,
    
    // Navigation
    scrollToProgress,
    scrollToZone,
    
      // Utilities
      isFastScrolling: velocity > 50,
      scrollDirection: velocity > 0 ? 'down' : 'up',
    
    // Debug info
    debugInfo: debugMode ? {
      scrollTop: scrollContainerRef.current?.scrollTop || 0,
      progress: Math.round(scrollProgress * 100) + '%',
      velocity: Math.round(velocity * 1000) / 1000,
      containerHeight,
      contentHeight,
      isScrolling,
        currentSection,
        hasContainer: !!scrollContainerRef.current
      } : null
    };
  };