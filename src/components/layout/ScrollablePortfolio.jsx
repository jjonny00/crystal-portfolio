// src/components/layout/ScrollablePortfolio.jsx
// FIXED: Eliminate nested scrolling issues

import React from 'react';
import HeroSection from '../sections/HeroSection';
import ProjectsSection from '../sections/ProjectsSection';
import ProjectFocusSection from '../sections/ProjectFocusSection';
import AboutSection from '../sections/AboutSection';
import { projects } from '../../data/projects';

const ScrollablePortfolio = () => {
  return (
    <div 
      className="scroll-container"
      style={{
        position: 'relative',
        zIndex: 10,
        
        // FIXED: Let height be determined by content
        minHeight: '800vh', // 8 sections × 100vh = 800vh total
        
        backgroundColor: 'transparent',
        pointerEvents: 'auto',
        
        // CRITICAL: Never set overflow properties on the main container
        // This was likely causing the nested scroll behavior
        
        // Ensure proper width without horizontal scroll
        width: '100%',
        maxWidth: '100vw',
        
        // Clean box model
        margin: 0,
        padding: 0,
        boxSizing: 'border-box'
      }}
    >
      {/* FIXED: Hero Section with absolute positioning constraints */}
      <section 
        id="hero" 
        className="scroll-section"
        style={{
          // CRITICAL: Exact height constraints
          height: '100vh',
          minHeight: '100vh',
          maxHeight: '100vh',
          
          // CRITICAL: Prevent any internal scrolling
          overflow: 'hidden',
          
          // Remove scroll-snap for now to test
          // scrollSnapAlign: 'start',
          // scrollSnapStop: 'normal',
          
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          
          // Ensure clean box model
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
          
          // Ensure full width
          width: '100%'
        }}
      >
        <HeroSection />
      </section>
      
      {/* FIXED: Projects Grid with same constraints */}
      <section 
        id="projects-overview" 
        className="scroll-section"
        style={{
          height: '100vh',
          minHeight: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
          // scrollSnapAlign: 'start',
          // scrollSnapStop: 'normal',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
          width: '100%'
        }}
      >
        <ProjectsSection />
      </section>
      
      {/* FIXED: Individual Project Sections with identical constraints */}
      {projects.map((project) => (
        <section 
          key={project.id}
          id={`project-${project.facetKey}`}
          className="scroll-section"
          style={{
            height: '100vh',
            minHeight: '100vh',
            maxHeight: '100vh',
            overflow: 'hidden',
            // scrollSnapAlign: 'start',
            // scrollSnapStop: 'normal',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
            width: '100%'
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

      {/* FIXED: About Section with same strict constraints */}
      <section 
        id="about" 
        className="scroll-section"
        style={{
          height: '100vh',
          minHeight: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
          // scrollSnapAlign: 'start',
          // scrollSnapStop: 'normal',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
          width: '100%'
        }}
      >
        <AboutSection />
      </section>
    </div>
  );
};

export default ScrollablePortfolio;