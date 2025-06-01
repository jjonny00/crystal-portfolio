// src/components/layout/ScrollablePortfolio.jsx
// FIXED: Proper section heights and spacing

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
        minHeight: '800vh', // FIXED: 8 sections × 100vh = 800vh total
        backgroundColor: 'transparent',
        pointerEvents: 'auto',
      }}
    >
      {/* FIXED: Hero Section - exactly 100vh, no overlap */}
      <section 
        id="hero" 
        className="scroll-section"
        style={{
          height: '100vh', // FIXED: Exact height, no more, no less
          scrollSnapAlign: 'start',
          scrollSnapStop: 'normal',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <HeroSection />
      </section>
      
      {/* FIXED: Projects Grid - exactly 100vh, positioned right after hero */}
      <section 
        id="projects-overview" 
        className="scroll-section"
        style={{
          height: '100vh', // FIXED: Exact height
          scrollSnapAlign: 'start',
          scrollSnapStop: 'normal',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <ProjectsSection />
      </section>
      
      {/* FIXED: Individual Project Sections - each exactly 100vh */}
      {projects.map((project) => (
        <section 
          key={project.id}
          id={`project-${project.facetKey}`} // CRITICAL: Must match facet keys
          className="scroll-section"
          style={{
            height: '100vh', // FIXED: Each project gets exactly 100vh
            scrollSnapAlign: 'start',
            scrollSnapStop: 'normal',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
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

      {/* FIXED: About Section - exactly 100vh */}
      <section 
        id="about" 
        className="scroll-section"
        style={{
          height: '100vh', // FIXED: Exact height
          scrollSnapAlign: 'start',
          scrollSnapStop: 'normal',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <AboutSection />
      </section>
    </div>
  );
};

export default ScrollablePortfolio;