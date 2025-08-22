// src/components/layout/ScrollablePortfolio.jsx
// COMPLETE FILE - Copy and paste this entire file

import React, { useState, useEffect } from 'react';
import HeroSection from '../sections/HeroSection';
import ProjectFocusSection from '../sections/ProjectFocusSection';
import AboutSection from '../sections/AboutSection';
import { projects } from '../../data/projects';

const ScrollablePortfolio = ({
  snapSpeed = 'medium', // 'fast', 'medium', 'slow', 'extra-slow', 'no-snap'
  hideContent = false  // NEW: Hide content for screenshots
}) => {
  const [currentSnapSpeed, setCurrentSnapSpeed] = useState(snapSpeed);
  // Detect mobile via user agent to keep desktop interactions intact
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobi/i.test(navigator.userAgent);
  
  // Update snap speed when prop changes
  useEffect(() => {
    setCurrentSnapSpeed(snapSpeed);
    
    // Apply the snap speed class after a brief delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const container = document.querySelector('.scroll-container');
      if (container) {
        // Remove all existing speed classes
        container.classList.remove('fast-snap', 'medium-snap', 'slow-snap', 'extra-slow-snap', 'no-snap');
        
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
  }, [snapSpeed]);
  
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

  // Mobile scrolling now handled by native browser behavior
  
  return (
    <div 
      className="scroll-container"
      style={{
        // CRITICAL: This div becomes the scroll parent
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        
        // Force it to be full viewport height and scrollable
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        
        // NOTE: scroll-snap properties are now handled by CSS classes
        
        // Above 3D canvas
        zIndex: 10,
        
        // Mobile scroll support
        WebkitOverflowScrolling: 'touch',
        
        // Clean styling
        backgroundColor: 'transparent',
        pointerEvents: isMobile ? 'auto' : 'none',
        
        // Clean box model
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        
        // NEW: Hide content when needed for screenshots
        opacity: hideContent ? 0 : 1
      }}
    >
      {/* Content wrapper - contains all sections */}
      <div style={{
        // This wrapper holds all the content
        width: '100%',
        minHeight: '800vh', // 9 sections × 100vh each
        position: 'relative',
        
        // NEW: Make content invisible but keep structure for scrolling
        opacity: hideContent ? 0 : 1
      }}>
        
        {/* HERO SECTION */}
        <section 
          id="hero" 
          className="scroll-section"
          style={{
            // NOTE: scroll-snap properties now handled by CSS classes
            
            // Force exact height
            height: '100vh',
            minHeight: '100vh',
            maxHeight: '100vh',
            
            // Prevent internal scroll
            overflow: 'hidden',
            
            // Center content
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            
            // Clean layout
            position: 'relative',
            width: '100%',
            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
            pointerEvents: 'none'
          }}
        >
          <HeroSection />
        </section>
        
        {/* PROJECTS OVERVIEW SECTION */}
        <section 
          id="projects-overview" 
          className="scroll-section"
          style={{
            scrollSnapAlign: 'start',
            scrollSnapStop: 'normal',
            height: '100vh',
            minHeight: '100vh',
            maxHeight: '100vh',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            width: '100%',
            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
            pointerEvents: 'none'
          }}
        >
        </section>
        
        {/* INDIVIDUAL PROJECT SECTIONS */}
        {projects.map((project, index) => (
          <section 
            key={project.id}
            id={`project-${project.facetKey}`}
            className="scroll-section"
            style={{
              height: '100vh',
              minHeight: '100vh',
              maxHeight: '100vh',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              width: '100%',
              margin: 0,
              padding: 0,
              boxSizing: 'border-box',
              pointerEvents: 'auto'
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
            height: '100vh',
            minHeight: '100vh',
            maxHeight: '100vh',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            width: '100%',
            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
            pointerEvents: 'auto'
          }}
        >
          <AboutSection />
        </section>
        
      </div>
    </div>
  );
};

export default ScrollablePortfolio;