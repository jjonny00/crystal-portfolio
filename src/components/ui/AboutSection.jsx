// src/components/ui/AboutSection.jsx
// About section component with crystal-themed design

import React, { useState, useEffect } from 'react';
import { animated, useSpring } from '@react-spring/web';

const AboutSection = ({ visible = false, onClose }) => {
  const [isVisible, setIsVisible] = useState(visible);
  
  // Update visibility when prop changes
  useEffect(() => {
    if (visible) {
      setIsVisible(true);
    }
  }, [visible]);
  
  // Main container animation
  const containerSpring = useSpring({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0px)' : 'translateY(40px)',
    config: {
      tension: 280,
      friction: 24
    },
    onRest: () => {
      if (!visible) {
        setIsVisible(false);
      }
    }
  });
  
  // Staggered content animations
  const titleSpring = useSpring({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0px)' : 'translateY(20px)',
    delay: visible ? 100 : 0,
    config: { tension: 300, friction: 26 }
  });
  
  const contentSpring = useSpring({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0px)' : 'translateY(15px)',
    delay: visible ? 200 : 0,
    config: { tension: 300, friction: 26 }
  });
  
  const skillsSpring = useSpring({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0px)' : 'translateY(15px)',
    delay: visible ? 300 : 0,
    config: { tension: 300, friction: 26 }
  });
  
  // Don't render if not visible
  if (!isVisible && !visible) return null;
  
  // Skills data organized by crystal facets
  const skillsByFacet = {
    empathy: {
      title: 'User Understanding',
      color: '#64ffda',
      skills: ['User Research', 'Personas', 'Journey Mapping', 'Usability Testing', 'Design Thinking']
    },
    narrative: {
      title: 'Strategic Communication',
      color: '#bb86fc',
      skills: ['Storytelling', 'Presentation Design', 'Vision Alignment', 'Stakeholder Communication']
    },
    craft: {
      title: 'Design Excellence',
      color: '#03dac6',
      skills: ['Visual Design', 'Interaction Design', 'Motion Design', 'Prototyping', 'Design Systems']
    },
    system: {
      title: 'Systematic Thinking',
      color: '#cf6679',
      skills: ['Information Architecture', 'Component Libraries', 'Design Tokens', 'Documentation']
    },
    leadership: {
      title: 'Team Empowerment',
      color: '#ffd600',
      skills: ['Mentorship', 'Cross-functional Collaboration', 'Design Strategy', 'Process Optimization']
    },
    exploration: {
      title: 'Innovation & Discovery',
      color: '#ff7043',
      skills: ['Concept Development', 'Design Exploration', 'Rapid Prototyping', 'Emerging Technologies']
    }
  };
  
  return (
    <animated.div
      style={{
        ...containerSpring,
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        background: 'linear-gradient(135deg, rgba(5, 5, 5, 0.95) 0%, rgba(15, 15, 25, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        zIndex: 1000,
        overflow: 'auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          zIndex: 1001
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor" />
        </svg>
      </button>
      
      {/* Main content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '80px 24px 60px',
        color: 'white'
      }}>
        
        {/* Header */}
        <animated.div style={titleSpring}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            fontWeight: '700',
            margin: '0 0 24px 0',
            background: 'linear-gradient(135deg, #64ffda 0%, #bb86fc 50%, #03dac6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
            lineHeight: '1.1'
          }}>
            Multifaceted Designer
          </h1>
          
          <div style={{
            fontSize: '1.25rem',
            color: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
            maxWidth: '600px',
            margin: '0 auto 60px',
            lineHeight: '1.6'
          }}>
            Like a crystal refracting light into its spectrum, I approach design through multiple interconnected facets—each one essential to creating meaningful, impactful experiences.
          </div>
        </animated.div>
        
        {/* Bio Section */}
        <animated.div style={contentSpring}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px',
            marginBottom: '80px'
          }}>
            
            {/* Personal Bio */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '32px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                margin: '0 0 20px 0',
                color: '#64ffda'
              }}>
                About Me
              </h2>
              <p style={{
                fontSize: '1rem',
                lineHeight: '1.7',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: '0 0 16px 0'
              }}>
                I'm a design leader who believes in the power of human-centered design to solve complex problems. With over a decade of experience, I've helped teams at companies like Apple, Meta, and Airbnb create products that millions of people use every day.
              </p>
              <p style={{
                fontSize: '1rem',
                lineHeight: '1.7',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: '0'
              }}>
                My approach is rooted in empathy, elevated by craft, and guided by systems thinking. I believe the best design happens when diverse perspectives come together around a shared vision.
              </p>
            </div>
            
            {/* Philosophy */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '32px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                margin: '0 0 20px 0',
                color: '#bb86fc'
              }}>
                Design Philosophy
              </h2>
              <p style={{
                fontSize: '1rem',
                lineHeight: '1.7',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: '0 0 16px 0'
              }}>
                Great design is like a well-cut crystal—it takes light from many sources and focuses it into something brilliant and purposeful. Each facet matters, and the magic happens in how they work together.
              </p>
              <p style={{
                fontSize: '1rem',
                lineHeight: '1.7',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: '0'
              }}>
                I believe in leading with questions, not assumptions. In building bridges between disciplines. In creating systems that scale both technically and culturally.
              </p>
            </div>
          </div>
        </animated.div>
        
        {/* Skills by Facet */}
        <animated.div style={skillsSpring}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '600',
            textAlign: 'center',
            margin: '0 0 40px 0',
            color: 'white'
          }}>
            The Six Facets
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {Object.entries(skillsByFacet).map(([key, facet]) => (
              <div
                key={key}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '24px',
                  borderRadius: '12px',
                  border: `1px solid ${facet.color}40`,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${facet.color}10`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  margin: '0 0 16px 0',
                  color: facet.color
                }}>
                  {facet.title}
                </h3>
                
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {facet.skills.map((skill, index) => (
                    <span
                      key={index}
                      style={{
                        background: `${facet.color}20`,
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        border: `1px solid ${facet.color}40`
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </animated.div>
        
        {/* Call to Action */}
        <div style={{
          textAlign: 'center',
          marginTop: '80px',
          padding: '40px',
          background: 'rgba(100, 255, 218, 0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(100, 255, 218, 0.2)'
        }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: '0 0 16px 0',
            color: '#64ffda'
          }}>
            Let's Create Something Beautiful Together
          </h3>
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.8)',
            margin: '0 0 24px 0',
            maxWidth: '500px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Whether you're looking to solve a complex design challenge or build a world-class design team, I'd love to hear about your vision.
          </p>
          <a
            href="mailto:jon.shaw@example.com"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: '#64ffda',
              color: '#000',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(100, 255, 218, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="L22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Get in Touch
          </a>
        </div>
      </div>
    </animated.div>
  );
};

export default AboutSection;