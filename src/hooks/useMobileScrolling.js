// src/hooks/useMobileScrolling.js
// Enhanced mobile touch handling with much slower, more controlled scrolling

import { useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for mobile touch scrolling optimization
 * Fixed with much slower, more controlled scrolling for better animation timing
 */
export const useMobileScrolling = (options = {}) => {
  const {
    enableTouchScrolling = true,
    preventOrbitOnMobile = true,
    smoothScrollFactor = 0.03,   // HEAVILY REDUCED: Much slower scrolling (was 0.10)
    momentumMultiplier = 0.08,   // HEAVILY REDUCED: Much less momentum (was 0.2)
    minSwipeDistance = 40,       // INCREASED: Require more deliberate swipes (was 25)
    debugMode = false
  } = options;

  const touchStartRef = useRef(null);
  const touchMoveRef = useRef(null);
  const isScrollingRef = useRef(false);
  const momentumAnimationRef = useRef(null);
  const lastVelocityRef = useRef(0);
  const scrollAccumulatorRef = useRef(0); // NEW: Accumulate small scroll amounts

  // Detect if device is mobile/tablet
  const isMobileDevice = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
  }, []);

  // Prevent default touch behaviors that interfere with scrolling
  const preventTouchDefaults = useCallback((e) => {
    // Allow scrolling but prevent other touch gestures
    if (e.touches.length > 1) {
      // Prevent pinch-to-zoom and multi-touch gestures
      e.preventDefault();
    }
  }, []);

  // Enhanced touch start handler
  const handleTouchStart = useCallback((e) => {
    if (!enableTouchScrolling || !isMobileDevice()) return;

    // Cancel any ongoing momentum scrolling
    if (momentumAnimationRef.current) {
      cancelAnimationFrame(momentumAnimationRef.current);
      momentumAnimationRef.current = null;
    }

    touchStartRef.current = {
      y: e.touches[0].clientY,
      x: e.touches[0].clientX,
      timestamp: Date.now(),
      scrollTop: window.pageYOffset
    };

    isScrollingRef.current = false;
    scrollAccumulatorRef.current = 0; // Reset accumulator

    if (debugMode) {
      console.log('📱 Touch start:', touchStartRef.current);
    }
  }, [enableTouchScrolling, isMobileDevice, debugMode]);

  // HEAVILY OPTIMIZED touch move handler with much slower, controlled scrolling
  const handleTouchMove = useCallback((e) => {
    if (!enableTouchScrolling || !isMobileDevice() || !touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaY = touchStartRef.current.y - touch.clientY;
    const deltaX = Math.abs(touchStartRef.current.x - touch.clientX);
    const timeDelta = Date.now() - touchStartRef.current.timestamp;

    // Only start scrolling after minimum swipe distance
    if (Math.abs(deltaY) < minSwipeDistance) return;

    // Determine if this is a vertical scroll gesture
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      isScrollingRef.current = true;
      
      // Calculate velocity for momentum (much more controlled)
      const velocity = (deltaY / timeDelta) * momentumMultiplier;
      lastVelocityRef.current = velocity;

      // MUCH slower scroll implementation with accumulator for micro-movements
      const scrollMultiplier = smoothScrollFactor * 0.3; // Extra heavy damping for mobile
      const scrollDelta = deltaY * scrollMultiplier;
      
      // Add to accumulator for very fine control
      scrollAccumulatorRef.current += scrollDelta;
      
      // Only apply scroll when accumulator reaches threshold (prevents micro-jitter)
      if (Math.abs(scrollAccumulatorRef.current) >= 2) { // 2px minimum scroll
        const newScrollTop = touchStartRef.current.scrollTop + scrollAccumulatorRef.current;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const clampedScroll = Math.max(0, Math.min(newScrollTop, maxScroll));

        // Use requestAnimationFrame for smooth scrolling
        requestAnimationFrame(() => {
          window.scrollTo({
            top: clampedScroll,
            behavior: 'auto'
          });
        });

        // Update touch start for next calculation (less frequently for smoother feel)
        touchStartRef.current.y = touch.clientY;
        touchStartRef.current.timestamp = Date.now();
        touchStartRef.current.scrollTop = clampedScroll;
        
        // Reset accumulator after applying scroll
        scrollAccumulatorRef.current = 0;
      }

      if (debugMode && Math.random() < 0.05) {
        console.log('📱 Touch scroll (ultra-slow):', { 
          deltaY: Math.round(deltaY), 
          velocity: Math.round(velocity * 1000) / 1000, 
          accumulator: Math.round(scrollAccumulatorRef.current * 100) / 100,
          scrollProgress: Math.round((window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100) + '%'
        });
      }
    }
  }, [enableTouchScrolling, isMobileDevice, smoothScrollFactor, momentumMultiplier, minSwipeDistance, debugMode]);

  // Touch end handler with heavily controlled momentum scrolling
  const handleTouchEnd = useCallback((e) => {
    if (!enableTouchScrolling || !isMobileDevice() || !touchStartRef.current) return;

    // Add much more controlled momentum scrolling
    if (isScrollingRef.current && Math.abs(lastVelocityRef.current) > 0.1) { // Higher threshold
      let currentVelocity = lastVelocityRef.current * 0.3; // Start with much more reduced velocity
      const friction = 0.88; // Much stronger friction (was 0.92)
      const minVelocity = 0.02; // Higher minimum to stop much sooner

      const momentumScroll = () => {
        if (Math.abs(currentVelocity) < minVelocity) {
          momentumAnimationRef.current = null;
          return;
        }

        // Much smaller momentum steps for fine control
        const deltaY = currentVelocity * 4; // Much reduced from 8
        const currentScroll = window.pageYOffset;
        const newScrollTop = currentScroll + deltaY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const clampedScroll = Math.max(0, Math.min(newScrollTop, maxScroll));

        requestAnimationFrame(() => {
          window.scrollTo({
            top: clampedScroll,
            behavior: 'auto'
          });
        });

        // Apply much stronger friction
        currentVelocity *= friction;

        // Continue momentum
        momentumAnimationRef.current = requestAnimationFrame(momentumScroll);
      };

      momentumAnimationRef.current = requestAnimationFrame(momentumScroll);

      if (debugMode) {
        console.log('📱 Starting ultra-controlled momentum:', Math.round(lastVelocityRef.current * 1000) / 1000);
      }
    }

    // Reset touch tracking
    touchStartRef.current = null;
    isScrollingRef.current = false;
    scrollAccumulatorRef.current = 0;

  }, [enableTouchScrolling, isMobileDevice, debugMode]);

  // Set up touch event listeners
  useEffect(() => {
    if (!isMobileDevice() || !enableTouchScrolling) return;

    // Add touch event listeners with passive: false to allow preventDefault
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Prevent unwanted touch behaviors
    document.addEventListener('touchstart', preventTouchDefaults, { passive: false });
    document.addEventListener('touchmove', preventTouchDefaults, { passive: false });

    // Cleanup
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchstart', preventTouchDefaults);
      document.removeEventListener('touchmove', preventTouchDefaults);
      
      if (momentumAnimationRef.current) {
        cancelAnimationFrame(momentumAnimationRef.current);
      }
    };
  }, [
    isMobileDevice, 
    enableTouchScrolling, 
    handleTouchStart, 
    handleTouchMove, 
    handleTouchEnd, 
    preventTouchDefaults
  ]);

  // Return mobile device detection for use in components
  return {
    isMobileDevice: isMobileDevice(),
    isScrolling: isScrollingRef.current,
    preventOrbitOnMobile
  };
};