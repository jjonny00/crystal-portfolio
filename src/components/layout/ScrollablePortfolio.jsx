// src/components/layout/ScrollablePortfolio.jsx
// Main scrollable page structure component - replaces scroll hijacking

import React from 'react';

/**
 * ScrollablePortfolio - The main layout component that provides native scrolling
 * This replaces the current scroll-hijacked App.jsx system
 */
const ScrollablePortfolio = () => {
  return (
    <div 
      className="scroll-container"
      style={{
        // REMOVE height constraint to allow natural document scrolling
        minHeight: '100vh',
        // REMOVE overflow properties - let document handle scrolling
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
        }}
      >
        <div style={{
          textAlign: 'center',
          color: 'white',
          zIndex: 10,
          position: 'relative',
        }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 8vw, 4rem)',
            fontWeight: '700',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #64ffda 0%, #bb86fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Multifaceted Designer
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 4vw, 1.25rem)',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '2rem',
            maxWidth: '600px',
            margin: '0 auto 2rem',
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
          }}>
            <div style={{
              color: 'rgba(255, 255, 255, 0.6)',
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
          padding: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
          }}>
            Six Facets of Design
          </h2>
          
          {/* Projects grid placeholder */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
          }}>
            {[
              { key: 'empathy', title: 'Empathy', color: '#64ffda' },
              { key: 'narrative', title: 'Narrative', color: '#bb86fc' },
              { key: 'craft', title: 'Craft', color: '#03dac6' },
              { key: 'system', title: 'System', color: '#cf6679' },
              { key: 'leadership', title: 'Leadership', color: '#ffd600' },
              { key: 'exploration', title: 'Exploration', color: '#ff7043' },
            ].map((facet) => (
              <div
                key={facet.key}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '2rem',
                  borderRadius: '1rem',
                  border: `1px solid ${facet.color}40`,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${facet.color}10`;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <h3 style={{
                  color: facet.color,
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                }}>
                  {facet.title}
                </h3>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                }}>
                  Explore this facet of design thinking and implementation.
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
          }}
        >
          <div style={{
            maxWidth: '800px',
            width: '100%',
            textAlign: 'center',
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
            }}>
              💎
            </div>
            
            <h2 style={{
              fontSize: 'clamp(2rem, 6vw, 3rem)',
              fontWeight: '600',
              color: 'white',
              marginBottom: '1.5rem',
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
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 20px ${project.color}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
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
          padding: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{
          maxWidth: '800px',
          width: '100%',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 6vw, 3rem)',
            fontWeight: '600',
            color: 'white',
            marginBottom: '2rem',
          }}>
            About This Approach
          </h2>
          
          <p style={{
            fontSize: '1.125rem',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1.7',
            marginBottom: '2rem',
          }}>
            Great design is like a well-cut crystal—it takes light from many sources and focuses it into something brilliant and purposeful. Each facet matters, and the magic happens in how they work together.
          </p>
          
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
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(100, 255, 218, 0.1)';
          }}>
            Get in Touch
          </button>
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