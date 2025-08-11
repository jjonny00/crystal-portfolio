// src/components/layout/ScrollablePortfolio.jsx
// COMPLETE FILE - Copy and paste this entire file

import React, { useState, useEffect } from 'react';
import HeroSection from '../sections/HeroSection';
import ProjectsSection from '../sections/ProjectsSection';
import ProjectFocusSection from '../sections/ProjectFocusSection';
import AboutSection from '../sections/AboutSection';
import { projects } from '../../data/projects';

const ScrollablePortfolio = ({ 
  snapSpeed = 'medium', // 'fast', 'medium', 'slow', 'extra-slow', 'no-snap'
  hideContent = false  // NEW: Hide content for screenshots
}) => {
  const [currentSnapSpeed, setCurrentSnapSpeed] = useState(snapSpeed);
  
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
  
  return (
    <div
      style={{
        width: '100%',
        minHeight: '800vh', // 8 sections × 100vh each
        position: 'relative',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        // NEW: Hide content when needed for screenshots
        opacity: hideContent ? 0 : 1
      }}
    >
        
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
            boxSizing: 'border-box'
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
            boxSizing: 'border-box'
          }}
        >
          <ProjectsSection />
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
              boxSizing: 'border-box'
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
            boxSizing: 'border-box'
          }}
        >
          <AboutSection />
        </section>
        
    </div>
  );
};

export default ScrollablePortfolio;