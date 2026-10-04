// src/components/sections/HeroSection.jsx

import React from 'react';
import { animated, useSpring } from '@react-spring/web';

import useProjectHeadlineColor from '../../hooks/useProjectHeadlineColor';
import Headline from '../ui/Headline';
import '../../styles/hero-section.css';
// The intro, long and short. Same shape as a project's `mobile` block in
// data/projects.js: the phone gets its own tighter cut rather than the desktop
// paragraph reflowed down a narrow column. Shared with the prerendered page.
import {
  HERO_BODY_COPY as BODY_COPY,
  HERO_BODY_COPY_MOBILE as BODY_COPY_MOBILE,
} from '../../data/siteCopy';

const ARROW_DOWN_SRC = '/assets/ui/SVG/arrow-down.svg';

/**
 * Hero Section Component
 * Full viewport introduction with crystal metaphor.
 *
 * The CTA's arrow is the anchor the vertical energy line is measured from
 * (`data-hero-rail-anchor`) — see VerticalEnergyLine.jsx. Keeping the CTA in
 * normal flow rather than absolutely positioned is what lets the rail derive its
 * x and starting y from layout instead of viewport coordinates.
 */
const HeroSection = ({
  visible = true,
  isMobile = false,
  onScrollHint = null
}) => {
  useProjectHeadlineColor();

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

  const ctaSpring = useSpring({
    from: {
      opacity: 0,
      transform: 'translateY(20px)'
    },
    to: {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0px)' : 'translateY(20px)'
    },
    config: { tension: 200, friction: 20 },
    delay: visible ? 1000 : 0
  });

  const handleScrollHint = () => {
    if (onScrollHint) {
      onScrollHint();
      return;
    }

    // `.scroll-container` is the real scroller (see scroll-snap.css), not the
    // document — scrolling the window here would do nothing.
    const container = document.querySelector('.scroll-container');
    const overview = document.getElementById('overview');

    if (container && overview) {
      container.scrollTo({ top: overview.offsetTop, behavior: 'smooth' });
      return;
    }

    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <div className="hero-section">
      <div className="hero-section__content">
        <animated.div style={contentSpring} className="hero-section__headline-block">
          <Headline as="h1" className="type-headline-lg hero-section__title">
            <span className="visually-hidden">Jon Shaw: </span>
            <span className="hero-section__title-line">THE SYSTEMS</span>
            <span className="hero-section__title-line">BENEATH</span>
            <span className="hero-section__title-line">THE SURFACE</span>
          </Headline>
        </animated.div>

        <animated.div style={subtitleSpring} className="hero-section__body-block">
          <p className="type-subhead-lg hero-section__role">
            <span className="hero-section__role-line">PRINCIPAL PRODUCT DESIGNER</span>
            <span className="hero-section__role-line">SYSTEMS AND INTERACTION</span>
          </p>
          <p className="type-body-lg hero-section__body-copy">
            {isMobile ? BODY_COPY_MOBILE : BODY_COPY}
          </p>
        </animated.div>

        <animated.div style={ctaSpring} className="hero-section__cta-block">
          <button
            type="button"
            className="hero-section__cta"
            onClick={handleScrollHint}
          >
            <img
              className="hero-section__cta-arrow"
              data-hero-rail-anchor
              src={ARROW_DOWN_SRC}
              alt=""
              aria-hidden="true"
              width={19}
              height={21}
            />
            <span className="hero-section__cta-label">LOOK BENEATH THE SURFACE</span>
          </button>
        </animated.div>
      </div>
    </div>
  );
};

export default HeroSection;
