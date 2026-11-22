// src/components/sections/AboutSection.jsx

import React from 'react';
import { animated, useSpring } from '@react-spring/web';
import '../../styles/about-section.css';
import SquircleSurface from '../ui/SquircleSurface';
import { ctaTypeStyle } from '../ui/ctaType';
import { inPageLinkHandler } from '../../navigation/linkClick';
import { ART_WALL_PATH } from '../../navigation/routes';
import {
  ABOUT_BLUESKY,
  ABOUT_PARAGRAPHS as PARAGRAPHS,
  ABOUT_RESUME,
  ABOUT_STATS as STATS,
  ABOUT_TITLE,
  ART_WALL_TITLE,
} from '../../data/siteCopy';
import portrait from '../../assets/about/portrait.webp';
import comicTeaser from '../../assets/about/space-strip.webp';

// Bluesky's butterfly, in its own blue, ahead of the label.
const BlueskyMark = () => (
  <svg className="about-section__bluesky-mark" viewBox="0 0 600 530" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M135.72 44.03C202.216 93.951 273.74 195.17 300 249.49c26.26-54.316 97.78-155.54 164.28-205.46C512.26 8.01 590-19.86 590 68.82c0 17.71-10.15 148.79-16.11 170.09-20.72 74-96.22 92.88-163.38 81.46 117.39 19.96 147.25 86.09 82.76 152.22-122.48 125.59-176.04-31.51-189.77-71.76-2.52-7.38-3.7-10.84-3.5-7.9.2-2.94-.98.52-3.5 7.9-13.73 40.25-67.29 197.35-189.77 71.76-64.49-66.13-34.63-132.26 82.76-152.22-67.16 11.42-142.66-7.46-163.38-81.46C20.15 217.61 10 86.53 10 68.82 10-19.86 87.74 8.01 135.72 44.03Z"
    />
  </svg>
);

/**
 * About: the bio, the résumé and Bluesky, the portrait with the way into the art
 * wall beneath it, and three metric rows.
 *
 * Desktop is two columns over the scene: heading, bio, links and metrics on the
 * left; the portrait and the comic link on the right. A phone reads it in one
 * column, in the markup's order: heading, bio, links, portrait, comic link,
 * metrics. The section scrolls internally when the content exceeds the
 * available height.
 */
const AboutSection = ({
  visible = true,
  isMobile = false,
  // Opens the art wall over the scene (App). The link is a real href, so a
  // modified click opens the wall's own URL in a new tab.
  onOpenArtWall = null,
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

            <div className="about-section__actions">
              <a
                className="about-section__resume"
                href={ABOUT_RESUME.href}
                target="_blank"
                rel="noopener"
                style={ctaTypeStyle(isMobile)}
              >
                <SquircleSurface />
                {ABOUT_RESUME.label}
              </a>
              <a
                className="type-body-sm about-section__bluesky"
                href={ABOUT_BLUESKY.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <BlueskyMark />
                {ABOUT_BLUESKY.label}
              </a>
            </div>
          </div>

          <div className="about-section__media">
            <img
              className="about-section__portrait"
              src={portrait}
              width="1284"
              height="1617"
              alt="Jon Shaw, in the dark, with a pink and blue beam of light shining through his glasses."
              decoding="async"
            />
            {/* The panel and its label are one link into the wall. */}
            <a
              className="about-section__comics"
              href={ART_WALL_PATH}
              onClick={onOpenArtWall ? inPageLinkHandler(onOpenArtWall) : undefined}
            >
              <img
                className="about-section__comics-panel"
                src={comicTeaser}
                width="943"
                height="481"
                alt="A comic panel: in a starry sky above a small planet, a speech bubble asks, “Well, what d’ya wanna do now?”"
                decoding="async"
              />
              <span className="type-body-sm about-section__comics-label">
                {ART_WALL_TITLE} <span aria-hidden="true">→</span>
              </span>
            </a>
          </div>

          <div className="about-section__stats">
            {STATS.map((stat) => (
              <div key={stat.value} className="about-section__stat">
                <p className="about-section__stat-value">{stat.value}</p>
                <p className="about-section__stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </animated.div>
      </div>
    </div>
  );
};

export default AboutSection;
