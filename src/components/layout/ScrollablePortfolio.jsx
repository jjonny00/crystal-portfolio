// src/components/layout/ScrollablePortfolio.jsx
// COMPLETE FILE - Copy and paste this entire file

import React, { useEffect } from 'react';
import HeroSection from '../sections/HeroSection';
import ProjectFocusSection from '../sections/ProjectFocusSection';
import AboutSection from '../sections/AboutSection';
import { projects } from '../../data/projects';
import { isMobileDevice } from '../../utils/isMobileDevice.js';

const ScrollablePortfolio = ({
  snapSpeed = 'medium', // 'fast', 'medium', 'slow', 'extra-slow', 'no-snap'
  hideContent = false,  // NEW: Hide content for screenshots
  layoutExperiment = {}
}) => {
  const {
    mode = 'full',
    disableContainerSnap = false
  } = layoutExperiment;

  const normalizedMode = mode ?? 'full';
  const experimentStage = normalizedMode === 'full' ? 'viewport-units' : normalizedMode;
  const hasPositioning = ['position-fixed', 'overflow', 'scroll-snap', 'viewport-units'].includes(experimentStage) || normalizedMode === 'full';
  const hasOverflow = ['overflow', 'scroll-snap', 'viewport-units'].includes(experimentStage) || normalizedMode === 'full';
  const hasViewportUnits = experimentStage === 'viewport-units' || normalizedMode === 'full';
  const allowScrollSnapStage = ['scroll-snap', 'viewport-units'].includes(experimentStage) || normalizedMode === 'full';
  const hasScrollSnap = allowScrollSnapStage && !disableContainerSnap;
  const shouldApplySnapClasses = hasScrollSnap;

  // Detect mobile via user agent to keep desktop interactions intact
  const isMobile = isMobileDevice();
  
  // Update snap speed when prop changes
  useEffect(() => {
    // Apply the snap speed class after a brief delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const container = document.querySelector('.scroll-container');
      if (container) {
        // Remove all existing speed classes
        container.classList.remove('fast-snap', 'medium-snap', 'slow-snap', 'extra-slow-snap', 'no-snap');

        if (!shouldApplySnapClasses) {
          if (import.meta.env.DEV) console.log('🧪 Scroll snap classes disabled by experiment mode:', normalizedMode);
          return;
        }

        // Add the new speed class
        const speedClass = snapSpeed === 'no-snap'
            ? 'no-snap'
            : `${snapSpeed}-snap`;
        container.classList.add(speedClass);

        if (import.meta.env.DEV) console.log('🎯 Applied snap speed:', snapSpeed);
        if (import.meta.env.DEV) console.log('🎯 Container classes:', container.className);
        if (import.meta.env.DEV) console.log('🎯 Computed scroll-snap-type:', getComputedStyle(container).scrollSnapType);
        if (import.meta.env.DEV) console.log('🎯 Computed scroll-behavior:', getComputedStyle(container).scrollBehavior);
      } else {
        if (import.meta.env.DEV) console.error('❌ Scroll container not found');
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [snapSpeed, shouldApplySnapClasses, normalizedMode]);
  
  // Debug logging
  useEffect(() => {
    if (import.meta.env.DEV) console.log('📏 ScrollablePortfolio received snapSpeed:', snapSpeed);
  }, [snapSpeed]);

  // Allow scrolling when overlay sections disable pointer events
  useEffect(() => {
    const container = document.querySelector('.scroll-container');
    if (!container) return;

    const handleWheel = (e) => {
      // If the event target isn't inside the scroll container, manually scroll it
      if (!e.target.closest('.scroll-container')) {
        container.scrollBy({ top: e.deltaY });
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Mobile scrolling uses native browser behavior

  const containerStyle = {
    position: hasPositioning ? 'absolute' : 'static',
    top: hasPositioning ? 0 : undefined,
    left: hasPositioning ? 0 : undefined,
    right: hasPositioning ? 0 : undefined,
    height: hasOverflow ? '100vh' : 'auto',
    minHeight: hasOverflow ? '100vh' : 'auto',
    overflowY: hasOverflow ? 'auto' : 'visible',
    overflowX: hasOverflow ? 'hidden' : 'visible',
    scrollSnapType: hasScrollSnap ? 'y mandatory' : 'none',
    scrollBehavior: hasScrollSnap ? 'smooth' : 'auto',
    zIndex: 10,
    WebkitOverflowScrolling: hasOverflow ? 'touch' : 'auto',
    backgroundColor: 'transparent',
    pointerEvents: isMobile ? 'auto' : (hasOverflow ? 'none' : 'auto'),
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
    opacity: hideContent ? 0 : 1
  };

  const sectionDimensions = hasViewportUnits
    ? { height: '100vh', minHeight: '100vh', maxHeight: '100vh' }
    : { height: 'auto', minHeight: 'auto', maxHeight: 'unset' };

  const heroSnapProps = hasScrollSnap
    ? { scrollSnapAlign: 'start', scrollSnapStop: 'always' }
    : { scrollSnapAlign: 'none', scrollSnapStop: 'normal' };

  const overviewSnapProps = hasScrollSnap
    ? { scrollSnapAlign: 'start', scrollSnapStop: 'normal' }
    : { scrollSnapAlign: 'none', scrollSnapStop: 'normal' };

  const projectSnapProps = hasScrollSnap
    ? { scrollSnapAlign: 'start', scrollSnapStop: 'always' }
    : { scrollSnapAlign: 'none', scrollSnapStop: 'normal' };

  const contentWrapperStyle = {
    width: '100%',
    minHeight: hasViewportUnits ? '800vh' : 'auto',
    position: 'relative',
    opacity: hideContent ? 0 : 1
  };

  return (
    <div
      className="scroll-container"
      style={containerStyle}
    >
      {/* Content wrapper - contains all sections */}
      <div style={contentWrapperStyle}>

        {/* HERO SECTION */}
        <section
          id="hero"
          className="scroll-section"
          style={{
            ...sectionDimensions,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            width: '100%',
            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
            pointerEvents: 'none',
            ...heroSnapProps
          }}
        >
          <HeroSection />
        </section>

        {/* PROJECTS OVERVIEW SECTION */}
        <section
          id="projects-overview"
          className="scroll-section"
          style={{
            ...sectionDimensions,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            width: '100%',
            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
            pointerEvents: 'none',
            ...overviewSnapProps
          }}
        >
        </section>

        {/* INDIVIDUAL PROJECT SECTIONS */}
        {projects.map((project, index) => (
          <section
            key={project.id}
            id={`project-${project.facetKey}`}
            className="scroll-section project"
            data-headline-color={project.color}
            style={{
              ...sectionDimensions,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              width: '100%',
              margin: 0,
              padding: 0,
              boxSizing: 'border-box',
              pointerEvents: 'auto',
              ...projectSnapProps
            }}
          >
            <ProjectFocusSection
              project={project}
              visible={true}
              onViewProject={(project) => {
                if (import.meta.env.DEV) console.log('View project:', project);
              }}
            />
          </section>
        ))}

        {/* ABOUT SECTION */}
        <section
          id="about"
          className="scroll-section"
          style={{
            ...sectionDimensions,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            width: '100%',
            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
            pointerEvents: 'auto',
            ...projectSnapProps
          }}
        >
          <AboutSection />
        </section>
        
      </div>
    </div>
  );
};

export default ScrollablePortfolio;
