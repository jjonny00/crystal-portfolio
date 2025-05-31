// src/components/sections/HeroSection.jsx
// Phase 2.1: Hero Section with crystal-themed introduction

import React, { useState, useEffect } from 'react';
import { animated, useSpring } from '@react-spring/web';

/**
 * Hero Section Component
 * Full viewport height introduction with crystal metaphor
 * Crystal State: Whole crystal, slow rotation
 */
const HeroSection = ({ 
  visible = true,
  scrollProgress = 0,
  onScrollHint = null 
}) => {
  const [hasScrolled, setHasScrolled] = useState(false);
  
  // Track if user has started scrolling to hide scroll hint
  useEffect(() => {
    if (scrollProgress > 0.05) {
      setHasScrolled(true);
    }
  }, [scrollProgress]);

  // Main content animation - entrance effect
  const contentSpring = useSpring({
    from: { 
      opacity: 0, 
      transform: 'translateY(40px)' 
    },
    to: { 
      opacity: visible ? 1 : 0, 
      transform: visible ? 'translateY(0px)' : 'translateY(40px)' 
    },
    config: { tension: 280, friction: 24 },
    delay: visible ? 200 : 0
  });

  // Staggered animation for subtitle
  const subtitleSpring = useSpring({
    from: { 
      opacity: 0, 
      transform: 'translateY(20px)' 
    },
    to: { 
      opacity: visible ? 1 : 0, 
      transform: visible ? 'translateY(0px)' : 'translateY(20px)' 
    },
    config: { tension: 300, friction: 26 },
    delay: visible ? 600 : 0
  });

  // Scroll hint animation with bounce
  const scrollHintSpring = useSpring({
    from: { 
      opacity: 0, 
      transform: 'translateY(20px)' 
    },
    to: { 
      opacity: visible && !hasScrolled ? 1 : 0, 
      transform: visible && !hasScrolled ? 'translateY(0px)' : 'translateY(20px)' 
    },
    config: { tension: 200, friction: 20 },
    delay: visible ? 1200 : 0
  });

  // Bouncing animation for scroll arrow
  const bounceSpring = useSpring({
    from: { transform: 'translateY(0px)' },
    to: async (next) => {
      if (!hasScrolled && visible) {
        while (!hasScrolled) {
          await next({ transform: 'translateY(-8px)' });
          await next({ transform: 'translateY(0px)' });
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    },
    config: { tension: 300, friction: 8 }
  });

  // Handle scroll hint click
  const handleScrollHint = () => {
    if (onScrollHint) {
      onScrollHint();
    } else {
      // Default scroll behavior
      window.scrollTo({
        top: window.innerHeight,
        behavior: 'smooth'
      });
    }
    setHasScrolled(true);
  };

  return (
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
        backgroundColor: 'transparent', // Let 3D background show through
        overflow: 'hidden'
      }}
    >
      {/* Main content container */}
      <div style={{
        textAlign: 'center',
        color: 'white',
        zIndex: 10,
        position: 'relative',
        maxWidth: '900px',
        width: '100%',
      }}>
        
        {/* Main headline */}
        <animated.h1 
          style={{
            ...contentSpring,
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            fontWeight: '700',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #64ffda 0%, #bb86fc 50%, #03dac6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: '1.1',
            textShadow: '0 4px 20px rgba(100, 255, 218, 0.3)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
          }}
        >
          Multifaceted Designer
        </animated.h1>
        
        {/* Subtitle with crystal metaphor */}
        <animated.div style={subtitleSpring}>
          <p style={{
            fontSize: 'clamp(1.125rem, 4vw, 1.5rem)',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '3rem',
            lineHeight: '1.6',
            maxWidth: '700px',
            margin: '0 auto 3rem',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)',
            fontWeight: '400'
          }}>
            Like a crystal refracting light into its spectrum, I approach design through 
            <strong style={{ color: '#64ffda', fontWeight: '600' }}> six interconnected facets</strong>—each 
            one essential to creating meaningful, impactful experiences.
          </p>
          
          {/* Role indicators */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            marginBottom: '4rem',
            flexWrap: 'wrap'
          }}>
            {[
              'Design Leader',
              'Systems Thinker', 
              'User Advocate'
            ].map((role, index) => (
              <span
                key={role}
                style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  fontWeight: '500',
                  padding: '0.5rem 1rem',
                  background: 'rgba(100, 255, 218, 0.1)',
                  borderRadius: '2rem',
                  border: '1px solid rgba(100, 255, 218, 0.3)',
                  backdropFilter: 'blur(10px)',
                  letterSpacing: '0.5px',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
                }}
              >
                {role}
              </span>
            ))}
          </div>
        </animated.div>
      </div>
      
      {/* Scroll hint indicator */}
      <animated.div 
        style={{
          ...scrollHintSpring,
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          cursor: 'pointer',
          zIndex: 10
        }}
        onClick={handleScrollHint}
      >
        <div style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.875rem',
          fontWeight: '400',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          textAlign: 'center',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          marginBottom: '0.5rem'
        }}>
          Scroll to explore
        </div>
        
        <animated.div style={bounceSpring}>
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ 
              opacity: 0.8,
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))'
            }}
          >
            <path 
              d="M7 10L12 15L17 10H7Z" 
              fill="#64ffda"
            />
          </svg>
        </animated.div>
        
        {/* Subtle gradient line beneath arrow */}
        <div style={{
          width: '2px',
          height: '20px',
          background: 'linear-gradient(180deg, #64ffda, transparent)',
          marginTop: '0.5rem',
          opacity: 0.6
        }} />
      </animated.div>

      {/* Background gradient overlay for better text contrast */}
      {/* <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at center, rgba(5, 5, 5, 0.3) 0%, rgba(5, 5, 5, 0.7) 100%)',
        zIndex: 1,
        pointerEvents: 'none'
      }} /> */}
      
      {/* Subtle animated grain texture for premium feel */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 25% 25%, rgba(100, 255, 218, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(187, 134, 252, 0.05) 0%, transparent 50%)
        `,
        zIndex: 2,
        pointerEvents: 'none',
        opacity: 0.8
      }} />
    </section>
  );
};

export default HeroSection;