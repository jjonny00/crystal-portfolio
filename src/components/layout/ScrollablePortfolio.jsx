// src/components/layout/ScrollablePortfolio.jsx
// AGGRESSIVE: Make scroll-container the actual scroll parent

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
        // CRITICAL: This div becomes the scroll parent
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        
        // Force it to be full viewport height and scrollable
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        
        // Apply scroll snap here
        scrollSnapType: 'y mandatory',
        scrollBehavior: 'smooth',
        
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
        minHeight: '800vh', // 8 sections × 100vh each
        position: 'relative'
      }}>
        
        {/* HERO SECTION */}
        <section 
          id="hero" 
          className="scroll-section"
          style={{
            // Force snap properties
            scrollSnapAlign: 'start',
            scrollSnapStop: 'always',
            
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
            scrollSnapStop: 'always',
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
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
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
            scrollSnapAlign: 'start',
            scrollSnapStop: 'always',
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