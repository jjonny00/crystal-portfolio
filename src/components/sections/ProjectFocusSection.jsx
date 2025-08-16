// src/components/sections/ProjectFocusSection.jsx
// Phase 2.3: Individual Project Focus Areas
// UPDATED: Removed "View Full Project" button and modal functionality

import React, { useState, useEffect } from 'react';
import { animated, useSpring } from '@react-spring/web';
import Headline from '../ui/Headline';

/**
 * ProjectFocusSection Component
 * Individual full-viewport sections for each project
 * Maps directly to crystal facets with focused camera view
 * UPDATED: Removed modal functionality
 */
const ProjectFocusSection = ({ 
  project,
  visible = true,
  scrollProgress = 0,
  // REMOVED: onViewProject prop since we're not using modals
  isMobile = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Track if component has been visible for entrance animation
  useEffect(() => {
    if (visible && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [visible, hasAnimated]);

  // Main container animation with parallax effect
  const containerSpring = useSpring({
    opacity: visible ? 1 : 0,
    transform: visible 
      ? `translateY(${scrollProgress * 20}px)` // Subtle parallax
      : 'translateY(60px)',
    config: { tension: 200, friction: 24 },
    delay: visible ? 0 : 0
  });

  // Staggered animations for content sections
  const titleSpring = useSpring({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0px)' : 'translateY(40px)',
    delay: visible ? 100 : 0,
    config: { tension: 280, friction: 26 }
  });

  const contentSpring = useSpring({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0px)' : 'translateY(30px)',
    delay: visible ? 200 : 0,
    config: { tension: 280, friction: 26 }
  });

  // REMOVED: ctaSpring since we're not showing the button anymore

  const imageSpring = useSpring({
    opacity: visible && imageLoaded ? 1 : 0,
    transform: visible && imageLoaded ? 'scale(1)' : 'scale(1.1)',
    delay: visible ? 300 : 0,
    config: { tension: 200, friction: 25 }
  });

  // REMOVED: handleViewProject since we're not using modals

  // Generate project stats based on project data
  const getProjectStats = () => {
    return [
      { label: 'Role', value: project.role || 'Lead Designer' },
      { label: 'Timeline', value: project.timeline || '3 months' },
      { label: 'Team Size', value: project.teamSize || '4 people' },
      { label: 'Platform', value: project.platform || 'Web & Mobile' }
    ];
  };

  // Get methodologies for this facet
  const getMethodologies = () => {
    const methodologiesMap = {
      empathy: ['User Interviews', 'Persona Development', 'Journey Mapping', 'Usability Testing'],
      narrative: ['Storyboarding', 'Content Strategy', 'Information Architecture', 'User Flows'],
      craft: ['Design Systems', 'Visual Design', 'Interaction Design', 'Prototyping'],
      system: ['Component Libraries', 'Design Tokens', 'Documentation', 'Version Control'],
      leadership: ['Team Coordination', 'Stakeholder Management', 'Design Strategy', 'Mentorship'],
      exploration: ['Design Sprints', 'Concept Development', 'A/B Testing', 'Innovation Workshops']
    };
    
    return methodologiesMap[project.facetKey] || ['Design Thinking', 'User Research', 'Prototyping'];
  };

  if (!project) {
    if (import.meta.env.DEV) console.warn('ProjectFocusSection: No project provided');
    return null;
  }

  return (
    <section 
      id={`project-${project.facetKey}`}
      className="scroll-section project"
      style={{
        height: '100vh',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'normal',
        padding: isMobile ? '2rem 1rem' : '4rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundColor: 'transparent',
        overflow: 'hidden'
      }}
    >
      <animated.div 
        style={{
          ...containerSpring,
          maxWidth: '1400px',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? '3rem' : '4rem',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10
        }}
      >
        
        {/* Content Section */}
        <div style={{
          order: isMobile ? 2 : 1,
          textAlign: isMobile ? 'center' : 'left'
        }}>
          
          {/* Project Title & Facet */}
          <animated.div style={titleSpring}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1rem',
              justifyContent: isMobile ? 'center' : 'flex-start'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: project.color,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                boxShadow: `0 8px 32px ${project.color}40`,
                flexShrink: 0
              }}>
                💎
              </div>
              
              <div>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: project.color,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginBottom: '0.25rem'
                }}>
                  {project.facetKey}
                </div>
                {/* <h1 style={{
                  fontSize: isMobile ? 'clamp(1.75rem, 6vw, 2.5rem)' : 'clamp(2rem, 4vw, 3rem)',
                  fontWeight: '400',
                  color: 'white',
                  margin: 0,
                  lineHeight: '1.1',
                  fontFamily: '"ivypresto-display", "Playfair Display", Georgia, "Times New Roman", serif'
                }}>
                  {project.title}
                </h1> */}
                <Headline 
                  as="h1"
                  style={{
                    fontSize: isMobile ? 'clamp(1.75rem, 6vw, 2.5rem)' : 'clamp(2rem, 4vw, 3rem)',
                    fontWeight: '400',
                    margin: 0,
                    lineHeight: '1.1',
                    fontFamily: '"ivypresto-display", "Playfair Display", Georgia, "Times New Roman", serif'
                  }}
                >
                  {project.title}
                </Headline>
              </div>
            </div>
          </animated.div>

          {/* Project Description */}
          <animated.div style={contentSpring}>
            <p style={{
              fontSize: isMobile ? '1rem' : '1.125rem',
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: '1.6',
              marginBottom: '2rem',
              maxWidth: '600px',
              margin: isMobile ? '0 auto 2rem' : '0 0 2rem 0'
            }}>
              {project.description}
            </p>

            {/* Project Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {getProjectStats().map((stat, index) => (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '1rem',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: `1px solid ${project.color}20`
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginBottom: '0.25rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {stat.label}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'white',
                    fontWeight: '600'
                  }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Technologies & Methodologies */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '1.5rem',
              marginBottom: '2.5rem'
            }}>
              {/* Technologies */}
              <div>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: project.color,
                  marginBottom: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Technologies
                </h3>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  {project.technologies.map((tech, index) => (
                    <span
                      key={index}
                      style={{
                        background: `${project.color}20`,
                        color: 'white',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        border: `1px solid ${project.color}40`
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Methodologies */}
              <div>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: project.color,
                  marginBottom: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Methodologies
                </h3>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  {getMethodologies().map((method, index) => (
                    <span
                      key={index}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.9)',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* OPTIONAL: External links if available */}
            {(project.demoUrl || project.githubUrl) && (
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: isMobile ? 'center' : 'flex-start',
                flexWrap: 'wrap'
              }}>
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '10px 20px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${project.color}20`;
                      e.currentTarget.style.borderColor = `${project.color}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12C2 16.42 4.87 20.17 8.84 21.5C9.34 21.58 9.5 21.27 9.5 21C9.5 20.77 9.5 20.14 9.5 19.31C6.73 19.91 6.14 17.97 6.14 17.97C5.68 16.81 5.03 16.5 5.03 16.5C4.12 15.88 5.1 15.9 5.1 15.9C6.1 15.97 6.63 16.93 6.63 16.93C7.5 18.45 8.97 18 9.54 17.76C9.63 17.11 9.89 16.67 10.17 16.42C7.95 16.17 5.62 15.31 5.62 11.5C5.62 10.39 6 9.5 6.65 8.79C6.55 8.54 6.2 7.5 6.75 6.15C6.75 6.15 7.59 5.88 9.5 7.17C10.29 6.95 11.15 6.84 12 6.84C12.85 6.84 13.71 6.95 14.5 7.17C16.41 5.88 17.25 6.15 17.25 6.15C17.8 7.5 17.45 8.54 17.35 8.79C18 9.5 18.38 10.39 18.38 11.5C18.38 15.32 16.04 16.16 13.81 16.41C14.17 16.72 14.5 17.33 14.5 18.26C14.5 19.6 14.5 20.68 14.5 21C14.5 21.27 14.66 21.59 15.17 21.5C19.14 20.16 22 16.42 22 12C22 6.48 17.52 2 12 2Z" fill="currentColor" />
                    </svg>
                    View Code
                  </a>
                )}
              </div>
            )}
          </animated.div>

          {/* REMOVED: Call to Action button section */}
        </div>

        {/* Project Visual/Preview */}
        <animated.div 
          style={{
            ...imageSpring,
            order: isMobile ? 1 : 2,
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            background: `linear-gradient(135deg, ${project.color}20, rgba(255, 255, 255, 0.05))`,
            border: `1px solid ${project.color}30`,
            minHeight: isMobile ? '300px' : '500px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Project Image */}
          {project.imageUrl ? (
            <img
              src={project.imageUrl}
              alt={project.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '16px'
              }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)} // Show fallback on error
            />
          ) : (
            /* Fallback Graphic */
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${project.color}30, ${project.color}10)`,
              color: project.color,
              fontSize: '4rem'
            }}>
              💎
            </div>
          )}

          {/* Gradient Overlay for Better Text Contrast */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: `linear-gradient(to top, ${project.color}40, transparent)`,
            pointerEvents: 'none'
          }} />
        </animated.div>
      </animated.div>

      {/* Background Enhancement */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at ${isMobile ? '50%' : '75%'} 50%, ${project.color}08 0%, transparent 70%)`,
        zIndex: 1,
        pointerEvents: 'none'
      }} />

      {/* Decorative Elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '5%',
        width: '200px',
        height: '200px',
        background: `radial-gradient(circle, ${project.color}15, transparent 70%)`,
        borderRadius: '50%',
        zIndex: 1,
        pointerEvents: 'none',
        opacity: isMobile ? 0.3 : 0.6
      }} />
    </section>
  );
};

export default ProjectFocusSection;