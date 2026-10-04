// src/components/sections/AboutSection.jsx

import React from 'react';
import { animated, useSpring } from '@react-spring/web';
import '../../styles/about-section.css';
import { ABOUT_PARAGRAPHS as PARAGRAPHS, ABOUT_STATS as STATS, ABOUT_TITLE } from '../../data/siteCopy';

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
        {/* One spring for the whole block. The other sections carry theirs on
            each line, because a line that blends against the scene has to be the
            outermost box of its own group — About does not blend. Its scrim is
            set from the worst frame the scene can produce, so the copy is a flat
            white that never has to react to anything. */}
        <animated.div className="about-section__content" style={contentSpring}>
          <div className="about-section__body">
            <h2 className="about-section__title">{ABOUT_TITLE}</h2>

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
