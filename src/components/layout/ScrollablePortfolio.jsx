// src/components/layout/ScrollablePortfolio.jsx
// COMPLETE FILE - Copy and paste this entire file

import React, { useState, useEffect } from 'react';
import HeroSection from '../sections/HeroSection';
import ProjectsSection from '../sections/ProjectsSection';
import ProjectFocusSection from '../sections/ProjectFocusSection';
import AboutSection from '../sections/AboutSection';
import { projects } from '../../data/projects';

const ScrollablePortfolio = ({ 
  snapSpeed = 'medium' // 'fast', 'medium', 'slow', 'extra-slow', 'no-snap'
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
        
        console.log('🎯 Applied snap speed:', snapSpeed);
        console.log('🎯 Container classes:', container.className);
        console.log('🎯 Computed scroll-snap-type:', getComputedStyle(container).scrollSnapType);
        console.log('🎯 Computed scroll-behavior:', getComputedStyle(container).scrollBehavior);
      } else {
        console.error('❌ Scroll container not found');
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [snapSpeed]);
  
  // Debug logging
  useEffect(() => {
    console.log('📏 ScrollablePortfolio received snapSpeed:', snapSpeed);
  }, [snapSpeed]);
  
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
        pointerEvents: 'auto',
        
        // Clean box model
        margin: 0,
        padding: 0,
        boxSizing: 'border-box'
      }}
    >
      {/* Content wrapper - contains all sections */}
      <div style={{
        // This wrapper holds all the content
        width: '100%',
        minHeight: '800vh', // 9 sections × 100vh each
        position: 'relative'
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
                console.log('View project:', project);
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
    </div>
  );
};

export default ScrollablePortfolio;