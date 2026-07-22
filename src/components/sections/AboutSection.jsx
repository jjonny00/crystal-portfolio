// src/components/sections/AboutSection.jsx

import React from 'react';
import { animated, useSpring } from '@react-spring/web';
import '../../styles/about-section.css';

const PARAGRAPHS = [
  'Every project has shaped how I approach the next, refining the process, challenging assumptions, and finding clearer ways to turn an idea into an experience. Over time, that process has expanded to move fluidly between systems thinking, visual design, and implementation. I’m most interested in the point where structure becomes experience, when rules, feedback, and tradeoffs take on a clear, expressive form people can understand and feel.',
  'I co-founded the studio that became Forest Giant and spent fifteen years helping grow it from a small team into a multidisciplinary studio of more than thirty people. Today, my work ranges from shaping complex product systems at FundSeeder to building and testing combat mechanics in Slipstream. Prototyping allows me to carry ideas into playable form, where they can be tested through interaction rather than debated in the abstract.',
  'I believe the strongest work comes from blended teams. Bringing designers, developers, stakeholders, and other disciplines into the process early exposes blind spots, surfaces constraints sooner, and gives each perspective a real hand in shaping the outcome. I often work between those groups, preserving intent as ideas move toward implementation and making sure no voice is lost, especially the user or player at the center of the system.'
];

const STATS = [
  { value: '20+ Years', label: 'Designing interactive systems' },
  { value: '15 Years · 30+ Person Team', label: 'Building and leading a multidisciplinary studio' },
  { value: '150K Downloads · Top 5 Free Game', label: 'Mesa’s first week on iOS' }
];

/**
 * About section — personal bio, background, and career highlights.
 * The section scrolls internally when the content exceeds the available
 * height (notably on smaller / mobile viewports).
 */
const AboutSection = ({
  visible = true,
  photoSrc = null
}) => {
  const contentSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(28px)' },
    to: {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0px)' : 'translateY(28px)'
    },
    delay: visible ? 160 : 0,
    config: { tension: 270, friction: 26 }
  });

  return (
    <div className="about-section">
      <div className="about-section__inner">
        <animated.div className="about-section__content" style={contentSpring}>
          <div className="about-section__body">
            <h1 className="about-section__title">Shaped Through Iteration</h1>

            {PARAGRAPHS.map((paragraph, index) => (
              <p key={index} className="about-section__paragraph">
                {paragraph}
              </p>
            ))}

            <div className="about-section__stats">
              {STATS.map((stat) => (
                <div key={stat.value} className="about-section__stat">
                  <p className="about-section__stat-value">{stat.value}</p>
                  <p className="about-section__stat-label">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="about-section__photo">
            {photoSrc ? (
              <img
                className="about-section__photo-img"
                src={photoSrc}
                alt="Portrait of Jon Shaw"
              />
            ) : (
              <div className="about-section__photo-placeholder">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="9" r="4" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="M4.5 20a7.5 7.5 0 0 1 15 0"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="about-section__photo-label">Photo</span>
              </div>
            )}
          </div>
        </animated.div>
      </div>
    </div>
  );
};

export default AboutSection;
