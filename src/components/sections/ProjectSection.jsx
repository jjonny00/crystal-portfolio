// src/components/sections/ProjectsSection.jsx
// Phase 2.2: Projects Grid Section with exploded crystal state
// Crystal State: Exploded view showing all facets with labels

import React, { useState, useEffect } from 'react';
import { animated, useSpring } from '@react-spring/web';

/**
 * Projects Grid Section Component
 * Shows all six design facets in an organized grid
 * Maps directly to crystal facets with matching colors
 */
const ProjectsSection = ({ 
  visible = true,
  onProjectSelect = null,
  selectedProject = null 
}) => {
  const [hoveredProject, setHoveredProject] = useState(null);

  // Project data mapping to crystal facets
  const projects = [
    { 
      key: 'empathy', 
      title: 'Empathy', 
      color: '#64ffda',
      description: 'Understanding user needs through research and empathy mapping.',
      skills: ['User Research', 'Personas', 'Journey Mapping'],
      gradient: 'linear-gradient(135deg, #64ffda 0%, #40e0d0 100%)'
    },
    { 
      key: 'narrative', 
      title: 'Narrative', 
      color: '#bb86fc',
      description: 'Crafting compelling stories that guide user experiences.',
      skills: ['Storytelling', 'Presentations', 'Vision Alignment'],
      gradient: 'linear-gradient(135deg, #bb86fc 0%, #9c5bf4 100%)'
    },
    { 
      key: 'craft', 
      title: 'Craft', 
      color: '#03dac6',
      description: 'Meticulous attention to visual and interactive details.',
      skills: ['Visual Design', 'Interaction', 'Motion Design'],
      gradient: 'linear-gradient(135deg, #03dac6 0%, #00bfa5 100%)'
    },
    { 
      key: 'system', 
      title: 'System', 
      color: '#cf6679',
      description: 'Building scalable design systems and architectures.',
      skills: ['Design Systems', 'Components', 'Documentation'],
      gradient: 'linear-gradient(135deg, #cf6679 0%, #b74f63 100%)'
    },
    { 
      key: 'leadership', 
      title: 'Leadership', 
      color: '#ffd600',
      description: 'Empowering teams and fostering design culture.',
      skills: ['Mentorship', 'Strategy', 'Team Building'],
      gradient: 'linear-gradient(135deg, #ffd600 0%, #ffb300 100%)'
    },
    { 
      key: 'exploration', 
      title: 'Exploration', 
      color: '#ff7043',
      description: 'Discovering opportunities through experimentation.',
      skills: ['Ideation', 'Prototyping', 'Innovation'],
      gradient: 'linear-gradient(135deg, #ff7043 0%, #ff5722 100%)'
    }
  ];

  // Main container animation
  const containerSpring = useSpring({
    from: { 
      opacity: 0, 
      transform: 'translateY(60px)' 
    },
    to: { 
      opacity: visible ? 1 : 0, 
      transform: visible ? 'translateY(0px)' : 'translateY(60px)' 
    },
    config: { tension: 200, friction: 24 },
    delay: visible ? 100 : 0
  });

  // Staggered animations for title
  const titleSpring = useSpring({
    from: { 
      opacity: 0, 
      transform: 'translateY(40px)' 
    },
    to: { 
      opacity: visible ? 1 : 0, 
      transform: visible ? 'translateY(0px)' : 'translateY(40px)' 
    },
    config: { tension: 280, friction: 26 },
    delay: visible ? 200 : 0
  });

  // Handle project interaction
  const handleProjectClick = (projectKey) => {
    if (onProjectSelect) {
      onProjectSelect(projectKey);
    }
  };

  const handleProjectHover = (projectKey, isHovering) => {
    setHoveredProject(isHovering ? projectKey : null);
  };

  return (
    <section 
      id="projects-overview"
      className="scroll-section"
      style={{
        minHeight: '100vh',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'normal',
        padding: '4rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundColor: 'transparent' // Let 3D background show through
      }}
    >
      <animated.div 
        style={{
          ...containerSpring,
          maxWidth: '1200px',
          width: '100%',
          textAlign: 'center'
        }}
      >
        {/* Section title */}
        <animated.div style={titleSpring}>
          <h2 style={{
            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
            fontWeight: '600',
            color: 'white',
            marginBottom: '1rem',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
          }}>
            Six Facets of Design
          </h2>
          
          <p style={{
            fontSize: 'clamp(1rem, 3vw, 1.25rem)',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '4rem',
            maxWidth: '600px',
            margin: '0 auto 4rem',
            lineHeight: '1.6',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.6)'
          }}>
            Each facet represents a core aspect of my design approach—click to explore how they come together to create meaningful experiences.
          </p>
        </animated.div>
        
        {/* Projects grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          marginTop: '2rem',
          '@media (max-width: 768px)': {
            gridTemplateColumns: '1fr',
            gap: '1.5rem'
          }
        }}>
          {projects.map((project, index) => {
            const isHovered = hoveredProject === project.key;
            const isSelected = selectedProject === project.key;
            
            return (
              <ProjectCard
                key={project.key}
                project={project}
                index={index}
                isHovered={isHovered}
                isSelected={isSelected}
                visible={visible}
                onClick={() => handleProjectClick(project.key)}
                onHover={(isHovering) => handleProjectHover(project.key, isHovering)}
              />
            );
          })}
        </div>

        {/* Instruction text */}
        <animated.div 
          style={{
            ...titleSpring,
            marginTop: '3rem'
          }}
        >
          <p style={{
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textAlign: 'center',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            fontWeight: '500'
          }}>
            Select a facet to explore in detail
          </p>
        </animated.div>
      </animated.div>

      {/* Background enhancement */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at center, rgba(5, 5, 5, 0.2) 0%, rgba(5, 5, 5, 0.6) 100%)',
        zIndex: 1,
        pointerEvents: 'none'
      }} />
    </section>
  );
};

/**
 * Individual Project Card Component
 * Represents each design facet with hover and selection states
 */
const ProjectCard = ({ 
  project, 
  index, 
  isHovered, 
  isSelected, 
  visible, 
  onClick, 
  onHover 
}) => {
  // Staggered entrance animation for each card
  const cardSpring = useSpring({
    from: { 
      opacity: 0, 
      transform: 'translateY(40px) scale(0.95)' 
    },
    to: { 
      opacity: visible ? 1 : 0, 
      transform: visible ? 'translateY(0px) scale(1)' : 'translateY(40px) scale(0.95)' 
    },
    config: { tension: 280, friction: 24 },
    delay: visible ? 300 + (index * 100) : 0
  });

  // Interaction animations
  const interactionSpring = useSpring({
    transform: isHovered || isSelected ? 'translateY(-8px) scale(1.02)' : 'translateY(0px) scale(1)',
    boxShadow: isHovered || isSelected 
      ? `0 20px 40px ${project.color}30, 0 8px 16px rgba(0, 0, 0, 0.3)`
      : '0 8px 24px rgba(0, 0, 0, 0.2)',
    config: { tension: 300, friction: 20 }
  });

  return (
    <animated.div
      style={{
        ...cardSpring,
        ...interactionSpring,
        background: `linear-gradient(135deg, 
          rgba(255, 255, 255, 0.08) 0%, 
          rgba(255, 255, 255, 0.03) 100%
        )`,
        backdropFilter: 'blur(20px)',
        padding: '2rem',
        borderRadius: '1rem',
        border: `1px solid ${isHovered || isSelected ? project.color : 'rgba(255, 255, 255, 0.1)'}`,
        cursor: 'pointer',
        position: 'relative',
        zIndex: 10,
        overflow: 'hidden',
        transition: 'border-color 0.3s ease'
      }}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Gradient background on hover */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: project.gradient,
        opacity: isHovered || isSelected ? 0.1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none'
      }} />

      {/* Project icon */}
      <div style={{
        width: '64px',
        height: '64px',
        background: project.color,
        borderRadius: '16px',
        margin: '0 auto 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        boxShadow: `0 8px 32px ${project.color}40`,
        position: 'relative',
        zIndex: 2
      }}>
        💎
      </div>
      
      {/* Project title */}
      <h3 style={{
        fontSize: '1.5rem',
        fontWeight: '600',
        color: 'white',
        marginBottom: '1rem',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        zIndex: 2
      }}>
        {project.title}
      </h3>
      
      {/* Project description */}
      <p style={{
        fontSize: '0.875rem',
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: '1.5rem',
        lineHeight: '1.5',
        position: 'relative',
        zIndex: 2
      }}>
        {project.description}
      </p>

      {/* Skills tags */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 2
      }}>
        {project.skills.map((skill, skillIndex) => (
          <span
            key={skillIndex}
            style={{
              background: `${project.color}20`,
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '1rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              border: `1px solid ${project.color}40`
            }}
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          width: '8px',
          height: '8px',
          background: project.color,
          borderRadius: '50%',
          boxShadow: `0 0 16px ${project.color}80`,
          zIndex: 3
        }} />
      )}
    </animated.div>
  );
};

export default ProjectsSection;