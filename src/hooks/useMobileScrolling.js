// src/hooks/useMobileScrolling.js
// Enhanced mobile touch handling for smooth scroll-driven experience

import { useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for mobile touch scrolling optimization
 * Enhanced with much slower, more controlled scrolling on mobile
 */
export const useMobileScrolling = (options = {}) => {
  const {
    enableTouchScrolling = true,
    preventOrbitOnMobile = true,
    smoothScrollFactor = 0.25, // REDUCED: Much slower scrolling (was 0.8)
    momentumMultiplier = 0.3,   // NEW: Reduces momentum strength
    minSwipeDistance = 15,      // NEW: Minimum distance before scrolling starts
    debugMode = false
  } = options;

  const touchStartRef = useRef(null);
  const touchMoveRef = useRef(null);
  const isScrollingRef = useRef(false);
  const momentumAnimationRef = useRef(null);
  const lastVelocityRef = useRef(0);

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

    if (debugMode) {
      console.log('📱 Touch start:', touchStartRef.current);
    }
  }, [enableTouchScrolling, isMobileDevice, debugMode]);

  // Enhanced touch move handler with much slower, controlled scrolling
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

      // MUCH slower scroll implementation with additional damping
      const scrollMultiplier = smoothScrollFactor * 0.6; // Extra damping for mobile
      const newScrollTop = touchStartRef.current.scrollTop + (deltaY * scrollMultiplier);
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
      if (Math.abs(deltaY) > 20) { // Only update after significant movement
        touchStartRef.current.y = touch.clientY;
        touchStartRef.current.timestamp = Date.now();
        touchStartRef.current.scrollTop = clampedScroll;
      }

      if (debugMode && Math.random() < 0.1) {
        console.log('📱 Touch scroll (slow):', { 
          deltaY: Math.round(deltaY), 
          velocity: Math.round(velocity * 100) / 100, 
          scrollProgress: Math.round((clampedScroll / maxScroll) * 100) + '%'
        });
      }
    }
  }, [enableTouchScrolling, isMobileDevice, smoothScrollFactor, momentumMultiplier, minSwipeDistance, debugMode]);

  // Touch end handler with controlled momentum scrolling
  const handleTouchEnd = useCallback((e) => {
    if (!enableTouchScrolling || !isMobileDevice() || !touchStartRef.current) return;

    // Add much more controlled momentum scrolling
    if (isScrollingRef.current && Math.abs(lastVelocityRef.current) > 0.2) { // Higher threshold
      let currentVelocity = lastVelocityRef.current * 0.5; // Start with reduced velocity
      const friction = 0.92; // Stronger friction (was 0.95)
      const minVelocity = 0.05; // Higher minimum to stop sooner

      const momentumScroll = () => {
        if (Math.abs(currentVelocity) < minVelocity) {
          momentumAnimationRef.current = null;
          return;
        }

        // Much smaller momentum steps
        const deltaY = currentVelocity * 8; // Reduced from 16
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

        // Apply stronger friction
        currentVelocity *= friction;

        // Continue momentum
        momentumAnimationRef.current = requestAnimationFrame(momentumScroll);
      };

      momentumAnimationRef.current = requestAnimationFrame(momentumScroll);

      if (debugMode) {
        console.log('📱 Starting controlled momentum:', Math.round(lastVelocityRef.current * 100) / 100);
      }
    }

    // Reset touch tracking
    touchStartRef.current = null;
    isScrollingRef.current = false;

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