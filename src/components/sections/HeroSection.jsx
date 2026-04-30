// src/components/sections/HeroSection.jsx

import React, { useState, useEffect } from 'react';
import { animated, useSpring } from '@react-spring/web';

import useProjectHeadlineColor from '../../hooks/useProjectHeadlineColor';
import Headline from '../ui/Headline';
import '../../styles/hero-section.css';

/**
 * Hero Section Component
 * Full viewport introduction with crystal metaphor
 */
const HeroSection = ({
  visible = true,
  scrollProgress = 0,
  onScrollHint = null
}) => {
  useProjectHeadlineColor();

  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    if (scrollProgress > 0.05) {
      setHasScrolled(true);
    }
  }, [scrollProgress]);

  const contentSpring = useSpring({
    from: {
      opacity: 0,
      transform: 'translateY(40px)'
    },
    to: {
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(40px)'
    },
    config: { tension: 280, friction: 24 },
    delay: visible ? 200 : 0
  });

  const subtitleSpring = useSpring({
    from: {
      opacity: 1,
      transform: 'none'
    },
    to: {
      opacity: visible ? 1 : 1,
      transform: 'none'
    },
    config: { tension: 300, friction: 26 },
    delay: 0
  });

  const scrollHintSpring = useSpring({
    from: {
      opacity: 0,
      transform: 'translateY(20px)'
    },
    to: {
      opacity: visible && !hasScrolled ? 1 : 0,
      transform: visible && !hasScrolled ? 'none' : 'translateY(20px)'
    },
    config: { tension: 200, friction: 20 },
    delay: visible ? 1200 : 0
  });

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

  const handleScrollHint = () => {
    if (onScrollHint) {
      onScrollHint();
    } else {
      window.scrollTo({
        top: window.innerHeight,
        behavior: 'smooth'
      });
    }
    setHasScrolled(true);
  };

  return (
    <div className="hero-section">
      <div className="hero-section__content">
        <animated.div style={contentSpring}>
          <Headline as="h1" className="hero-section__title">
            Shaped through iteration.
          </Headline>
        </animated.div>

        <animated.div style={subtitleSpring} className="hero-section__body-block">
          <p className="hero-section__body-copy blend-force">
            Across products, platforms, and industries, I’ve worked with teams to solve complex
            problems through systems thinking, clear communication, and stubborn optimism.
          </p>
          <p className="hero-section__body-copy blend-force">
            Each facet of this crystal reflects a moment that shaped how I design.
          </p>
        </animated.div>
      </div>

      <animated.button
        type="button"
        className="hero-section__scroll-hint"
        style={scrollHintSpring}
        onClick={handleScrollHint}
        aria-label="Scroll to explore"
      >
        <span className="hero-section__scroll-label">Scroll to explore</span>
        <animated.div style={bounceSpring}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ opacity: 0.8, filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))' }}
          >
            <path d="M7 10L12 15L17 10H7Z" fill="#64ffda" />
          </svg>
        </animated.div>
        <span className="hero-section__scroll-line" />
      </animated.button>
    </div>
  );
};

export default HeroSection;
