// src/components/sections/AboutSection.jsx
// Phase 2.4: Enhanced About Section with crystal-themed design
// Crystal State: Reformed crystal or special "about" crystal configuration

import React, { useState, useEffect } from 'react';
import { animated, useSpring } from '@react-spring/web';

/**
 * Enhanced About Section Component
 * Comprehensive personal bio, philosophy, and contact information
 * Designed for integration into ScrollablePortfolio component
 */
const AboutSection = ({ 
  visible = true,
  scrollProgress = 0,
  isMobile = false 
}) => {
  const [hasAnimated, setHasAnimated] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

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

  const skillsSpring = useSpring({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0px)' : 'translateY(20px)',
    delay: visible ? 300 : 0,
    config: { tension: 280, friction: 26 }
  });

  const ctaSpring = useSpring({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0px)' : 'translateY(20px)',
    delay: visible ? 400 : 0,
    config: { tension: 300, friction: 20 }
  });

  // Crystal facet skills data
  const skillsByFacet = {
    empathy: {
      title: 'User Understanding',
      color: '#64ffda',
      icon: '💚',
      skills: ['User Research', 'Personas', 'Journey Mapping', 'Usability Testing', 'Design Thinking', 'Stakeholder Interviews']
    },
    narrative: {
      title: 'Strategic Communication',
      color: '#bb86fc',
      icon: '📖',
      skills: ['Storytelling', 'Presentation Design', 'Vision Alignment', 'Stakeholder Communication', 'Design Strategy', 'Content Strategy']
    },
    craft: {
      title: 'Design Excellence',
      color: '#03dac6',
      icon: '✨',
      skills: ['Visual Design', 'Interaction Design', 'Motion Design', 'Prototyping', 'Design Systems', 'Typography']
    },
    system: {
      title: 'Systematic Thinking',
      color: '#cf6679',
      icon: '🔧',
      skills: ['Information Architecture', 'Component Libraries', 'Design Tokens', 'Documentation', 'Process Design', 'Scalable Systems']
    },
    leadership: {
      title: 'Team Empowerment',
      color: '#ffd600',
      icon: '👥',
      skills: ['Mentorship', 'Cross-functional Collaboration', 'Design Strategy', 'Process Optimization', 'Team Building', 'Culture Development']
    },
    exploration: {
      title: 'Innovation & Discovery',
      color: '#ff7043',
      icon: '🚀',
      skills: ['Concept Development', 'Design Exploration', 'Rapid Prototyping', 'Emerging Technologies', 'Research Methods', 'Innovation Workshops']
    }
  };

  // Professional experience timeline
  const experience = [
    {
      company: 'Meta',
      role: 'Senior Design Lead',
      period: '2022 - Present',
      description: 'Leading design for next-generation AR/VR experiences. Building design systems that scale across multiple platforms.',
      achievements: ['Led team of 8 designers', 'Shipped 3 major product features', 'Established design system standards']
    },
    {
      company: 'Apple',
      role: 'Principal Designer',
      period: '2019 - 2022',
      description: 'Designed user experiences for iOS and macOS applications. Focused on accessibility and inclusive design.',
      achievements: ['Improved accessibility metrics by 40%', 'Led design for 2 major iOS features', 'Mentored 12 junior designers']
    },
    {
      company: 'Airbnb',
      role: 'Senior Product Designer',
      period: '2017 - 2019',
      description: 'Designed end-to-end experiences for host and guest platforms. Collaborated with international teams.',
      achievements: ['Increased conversion by 25%', 'Launched in 15 new markets', 'Built localization design framework']
    }
  ];

  // Tab content
  const tabContent = {
    about: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Personal Bio */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '2rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              margin: '0 0 1rem 0',
              color: '#64ffda',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>👋</span> About Me
            </h3>
            <p style={{
              fontSize: '1rem',
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: '0 0 1rem 0'
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

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              margin: '0 0 1rem 0',
              color: '#bb86fc',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>💎</span> Design Philosophy
            </h3>
            <p style={{
              fontSize: '1rem',
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: '0 0 1rem 0'
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

        {/* Key Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '1rem'
        }}>
          {[
            { label: 'Years Experience', value: '10+', icon: '📅' },
            { label: 'Products Shipped', value: '25+', icon: '🚀' },
            { label: 'Teams Led', value: '8', icon: '👥' },
            { label: 'Companies', value: '3', icon: '🏢' }
          ].map((stat, index) => (
            <div key={index} style={{
              background: 'rgba(100, 255, 218, 0.1)',
              padding: '1.5rem',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid rgba(100, 255, 218, 0.2)'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#64ffda',
                marginBottom: '0.25rem'
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),

    skills: (
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        {Object.entries(skillsByFacet).map(([key, facet]) => (
          <div
            key={key}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '1.5rem',
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
              fontSize: '1rem',
              fontWeight: '600',
              margin: '0 0 1rem 0',
              color: facet.color,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>{facet.icon}</span>
              {facet.title}
            </h3>
            
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              {facet.skills.map((skill, index) => (
                <span
                  key={index}
                  style={{
                    background: `${facet.color}20`,
                    color: 'white',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
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
    ),

    experience: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {experience.map((job, index) => (
          <div key={index} style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            position: 'relative'
          }}>
            {/* Timeline connector */}
            {index < experience.length - 1 && (
              <div style={{
                position: 'absolute',
                left: '2rem',
                bottom: '-2rem',
                width: '2px',
                height: '2rem',
                background: 'linear-gradient(180deg, #64ffda, transparent)',
                opacity: 0.5
              }} />
            )}
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#64ffda',
                  margin: '0 0 0.25rem 0'
                }}>
                  {job.company}
                </h3>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: 'white',
                  margin: '0'
                }}>
                  {job.role}
                </div>
              </div>
              <div style={{
                background: 'rgba(100, 255, 218, 0.2)',
                color: '#64ffda',
                padding: '0.5rem 1rem',
                borderRadius: '1rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                {job.period}
              </div>
            </div>
            
            <p style={{
              fontSize: '1rem',
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '1rem'
            }}>
              {job.description}
            </p>
            
            <div>
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#bb86fc',
                margin: '0 0 0.5rem 0'
              }}>
                Key Achievements:
              </h4>
              <ul style={{
                margin: 0,
                paddingLeft: '1rem',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                {job.achievements.map((achievement, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>
                    {achievement}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    )
  };

  return (
    <section 
      id="about"
      className="scroll-section"
      style={{
        minHeight: '100vh',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'normal',
        padding: isMobile ? '4rem 1rem' : '6rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundColor: 'transparent'
      }}
    >
      <animated.div 
        style={{
          ...containerSpring,
          maxWidth: '1200px',
          width: '100%',
          position: 'relative',
          zIndex: 10
        }}
      >
        
        {/* Header */}
        <animated.div style={titleSpring}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{
              fontSize: isMobile ? 'clamp(2rem, 8vw, 3rem)' : 'clamp(2.5rem, 6vw, 4rem)',
              fontWeight: '700',
              margin: '0 0 1rem 0',
              background: 'linear-gradient(135deg, #64ffda 0%, #bb86fc 50%, #03dac6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center',
              lineHeight: '1.1'
            }}>
              About This Approach
            </h1>
            
            <p style={{
              fontSize: isMobile ? '1rem' : '1.25rem',
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
              maxWidth: '700px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              Like a crystal refracting light into its spectrum, I approach design through multiple interconnected facets—each one essential to creating meaningful, impactful experiences.
            </p>
          </div>
        </animated.div>

        {/* Tab Navigation */}
        <animated.div style={contentSpring}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '3rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '0.5rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {[
              { key: 'about', label: 'About', icon: '👋' },
              { key: 'skills', label: 'Skills', icon: '💎' },
              { key: 'experience', label: 'Experience', icon: '🚀' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  background: activeTab === tab.key ? 'rgba(100, 255, 218, 0.2)' : 'transparent',
                  color: activeTab === tab.key ? '#64ffda' : 'rgba(255, 255, 255, 0.7)',
                  border: 'none',
                  padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
                  borderRadius: '8px',
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minHeight: '44px' // Touch target
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.key) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.key) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </animated.div>

        {/* Tab Content */}
        <animated.div style={skillsSpring}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(20px)',
            padding: isMobile ? '2rem' : '3rem',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {tabContent[activeTab]}
          </div>
        </animated.div>

        {/* Contact CTA */}
        <animated.div style={ctaSpring}>
          <div style={{
            textAlign: 'center',
            marginTop: '3rem',
            padding: '2rem',
            background: 'rgba(100, 255, 218, 0.1)',
            borderRadius: '16px',
            border: '1px solid rgba(100, 255, 218, 0.2)'
          }}>
            <h3 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '600',
              margin: '0 0 1rem 0',
              color: '#64ffda',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <span>✨</span> Let's Create Something Beautiful Together
            </h3>
            <p style={{
              fontSize: '1rem',
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '0 0 2rem 0',
              maxWidth: '500px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              Whether you're looking to solve a complex design challenge or build a world-class design team, I'd love to hear about your vision.
            </p>
            
            {/* Contact buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <a
                href="mailto:jon.shaw@example.com"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '12px 24px',
                  background: '#64ffda',
                  color: '#000',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  minHeight: '48px' // Touch target
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
                  <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Get in Touch
              </a>
              
              <a
                href="/assets/documents/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '12px 24px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.2s ease',
                  minHeight: '48px' // Touch target
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Download Resume
              </a>
            </div>
            
            {/* Social Links */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              marginTop: '2rem',
              flexWrap: 'wrap'
            }}>
              {[
                { name: 'LinkedIn', href: 'https://linkedin.com/in/jonshaw', icon: '💼' },
                { name: 'Behance', href: 'https://behance.net/jonshaw', icon: '🎨' },
                { name: 'Dribbble', href: 'https://dribbble.com/jonshaw', icon: '🏀' },
                { name: 'Twitter', href: 'https://twitter.com/jonshaw', icon: '🐦' }
              ].map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '2rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    minHeight: '36px' // Touch target
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(100, 255, 218, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(100, 255, 218, 0.4)';
                    e.currentTarget.style.color = '#64ffda';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                  }}
                >
                  <span>{link.icon}</span>
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </animated.div>
      </animated.div>

      {/* Background Enhancement */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at center, rgba(100, 255, 218, 0.05) 0%, transparent 70%)',
        zIndex: 1,
        pointerEvents: 'none'
      }} />
    </section>
  );
};

export default AboutSection;