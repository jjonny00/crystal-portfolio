// src/components/layout/ScrollablePortfolio.jsx
// Fixed scrollable page structure with proper layering and visibility

import React from 'react';

/**
 * ScrollablePortfolio - The main layout component that provides native scrolling
 * Fixed to ensure content is visible above the 3D canvas
 */
const ScrollablePortfolio = () => {
  return (
    <div 
      className="scroll-container"
      style={{
        position: 'relative',
        zIndex: 10, // IMPORTANT: Above the 3D canvas (which is z-index: 1)
        minHeight: '500vh', // IMPORTANT: Ensure enough content to scroll
        backgroundColor: 'transparent', // Let 3D background show through
        pointerEvents: 'auto', // Allow interactions with content
      }}
    >
      {/* Hero Section */}
      <section 
        id="hero"
        className="scroll-section"
        style={{
          height: '100vh',
          scrollSnapAlign: 'start',
          scrollSnapStop: 'normal',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 2rem',
        }}
      >
        <div style={{
          textAlign: 'center',
          color: 'white',
          zIndex: 10,
          position: 'relative',
          maxWidth: '800px',
          width: '100%',
        }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 8vw, 4rem)',
            fontWeight: '700',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #64ffda 0%, #bb86fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: '1.2',
          }}>
            Multifaceted Designer
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 4vw, 1.25rem)',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '2rem',
            lineHeight: '1.6',
          }}>
            Like a crystal refracting light into its spectrum, I approach design through multiple interconnected facets.
          </p>
          
          {/* Scroll hint */}
          <div style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'bounce 2s infinite',
            color: 'rgba(255, 255, 255, 0.6)',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '0.875rem',
              marginBottom: '0.5rem',
            }}>
              Scroll to explore
            </div>
            <div style={{
              fontSize: '1.5rem',
              color: '#64ffda',
            }}>
              ↓
            </div>
          </div>
        </div>
      </section>

      {/* Projects Overview Section */}
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
          zIndex: 10,
        }}
      >
        <div style={{
          maxWidth: '1200px',
          width: '100%',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 6vw, 3rem)',
            fontWeight: '600',
            color: 'white',
            marginBottom: '3rem',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
          }}>
            Six Facets of Design
          </h2>
          
          {/* Projects grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
          }}>
            {[
              { key: 'empathy', title: 'Empathy', color: '#64ffda', description: 'Understanding user needs through research and empathy mapping.' },
              { key: 'narrative', title: 'Narrative', color: '#bb86fc', description: 'Crafting compelling stories that guide user experiences.' },
              { key: 'craft', title: 'Craft', color: '#03dac6', description: 'Meticulous attention to visual and interactive details.' },
              { key: 'system', title: 'System', color: '#cf6679', description: 'Building scalable design systems and architectures.' },
              { key: 'leadership', title: 'Leadership', color: '#ffd600', description: 'Empowering teams and fostering design culture.' },
              { key: 'exploration', title: 'Exploration', color: '#ff7043', description: 'Discovering opportunities through experimentation.' },
            ].map((facet) => (
              <div
                key={facet.key}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  padding: '2rem',
                  borderRadius: '1rem',
                  border: `1px solid ${facet.color}40`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${facet.color}15`;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 8px 32px ${facet.color}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <h3 style={{
                  color: facet.color,
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  textShadow: `0 0 10px ${facet.color}40`,
                }}>
                  {facet.title}
                </h3>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                }}>
                  {facet.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Individual Project Sections */}
      {[
        { key: 'empathy', title: 'Empathy', color: '#64ffda', description: 'Understanding user needs through research and empathy mapping.' },
        { key: 'narrative', title: 'Narrative', color: '#bb86fc', description: 'Crafting compelling stories that guide user experiences.' },
        { key: 'craft', title: 'Craft', color: '#03dac6', description: 'Meticulous attention to visual and interactive details.' },
        { key: 'system', title: 'System', color: '#cf6679', description: 'Building scalable design systems and architectures.' },
        { key: 'leadership', title: 'Leadership', color: '#ffd600', description: 'Empowering teams and fostering design culture.' },
        { key: 'exploration', title: 'Exploration', color: '#ff7043', description: 'Discovering opportunities through experimentation.' },
      ].map((project) => (
        <section 
          key={project.key}
          id={`project-${project.key}`}
          className="scroll-section"
          style={{
            height: '100vh',
            scrollSnapAlign: 'start',
            scrollSnapStop: 'normal',
            padding: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div style={{
            maxWidth: '800px',
            width: '100%',
            textAlign: 'center',
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(20px)',
            padding: '3rem',
            borderRadius: '2rem',
            border: `1px solid ${project.color}30`,
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: project.color,
              borderRadius: '16px',
              margin: '0 auto 2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              boxShadow: `0 8px 32px ${project.color}40`,
            }}>
              💎
            </div>
            
            <h2 style={{
              fontSize: 'clamp(2rem, 6vw, 3rem)',
              fontWeight: '600',
              color: 'white',
              marginBottom: '1.5rem',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
            }}>
              {project.title}
            </h2>
            
            <p style={{
              fontSize: '1.25rem',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '3rem',
              lineHeight: '1.6',
            }}>
              {project.description}
            </p>
            
            <button style={{
              background: project.color,
              color: '#000',
              border: 'none',
              padding: '12px 32px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: `0 4px 16px ${project.color}40`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 24px ${project.color}60`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 16px ${project.color}40`;
            }}>
              View Full Project
            </button>
          </div>
        </section>
      ))}

      {/* About Section */}
      <section 
        id="about"
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
          zIndex: 10,
        }}
      >
        <div style={{
          maxWidth: '1000px',
          width: '100%',
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px)',
          padding: '4rem',
          borderRadius: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '3rem',
          }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 6vw, 3rem)',
              fontWeight: '600',
              color: 'white',
              marginBottom: '2rem',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
            }}>
              About This Approach
            </h2>
            
            <p style={{
              fontSize: '1.125rem',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: '1.7',
              marginBottom: '2rem',
              maxWidth: '700px',
              margin: '0 auto 2rem',
            }}>
              Great design is like a well-cut crystal—it takes light from many sources and focuses it into something brilliant and purposeful. Each facet matters, and the magic happens in how they work together.
            </p>
          </div>

          {/* Skills grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem',
          }}>
            {[
              { title: 'Design Thinking', skills: ['User Research', 'Problem Framing', 'Ideation'] },
              { title: 'Visual Craft', skills: ['Interface Design', 'Typography', 'Color Theory'] },
              { title: 'Systems', skills: ['Design Systems', 'Component Libraries', 'Documentation'] },
              { title: 'Leadership', skills: ['Team Building', 'Mentorship', 'Strategy'] },
            ].map((category, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '1.5rem',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <h3 style={{
                  color: '#64ffda',
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                }}>
                  {category.title}
                </h3>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}>
                  {category.skills.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      style={{
                        background: 'rgba(100, 255, 218, 0.2)',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Contact CTA */}
          <div style={{
            textAlign: 'center',
          }}>
            <button style={{
              background: 'rgba(100, 255, 218, 0.1)',
              color: '#64ffda',
              border: '1px solid rgba(100, 255, 218, 0.3)',
              padding: '12px 32px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(100, 255, 218, 0.2)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(100, 255, 218, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              Get in Touch
            </button>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <section 
        id="footer"
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
          zIndex: 10,
        }}
      >
        <div style={{
          maxWidth: '800px',
          width: '100%',
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px)',
          padding: '3rem',
          borderRadius: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
            fontWeight: '600',
            color: 'white',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #64ffda 0%, #bb86fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Jon Shaw
          </h2>
          
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '2rem',
            lineHeight: '1.5',
          }}>
            Multifaceted Designer • Design Leader • Systems Thinker
          </p>

          {/* Social links */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '2rem',
          }}>
            {[
              { name: 'Email', href: 'mailto:jon.shaw@example.com' },
              { name: 'LinkedIn', href: 'https://linkedin.com/in/jonshaw' },
              { name: 'Behance', href: 'https://behance.net/jonshaw' },
              { name: 'Dribbble', href: 'https://dribbble.com/jonshaw' },
            ].map((link) => (
              <a
                key={link.name}
                href={link.href}
                target={link.name !== 'Email' ? '_blank' : undefined}
                rel={link.name !== 'Email' ? 'noopener noreferrer' : undefined}
                style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '2rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
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
                {link.name}
              </a>
            ))}
          </div>

          <div style={{
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.5)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '1rem',
          }}>
            © 2024 Jon Shaw. All rights reserved.
          </div>
        </div>
      </section>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          40% {
            transform: translateX(-50%) translateY(-10px);
          }
          60% {
            transform: translateX(-50%) translateY(-5px);
          }
        }
        
        /* Apply scroll snap to document body instead of container */
        html {
          scroll-snap-type: y proximity;
          scroll-behavior: smooth;
        }
        
        .scroll-section {
          scroll-snap-align: start;
        }
        
        /* Mobile-specific scroll snap adjustments */
        @media (max-width: 768px) {
          html {
            scroll-snap-type: y mandatory;
          }
          
          body {
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
    </div>
  );
};

export default ScrollablePortfolio;