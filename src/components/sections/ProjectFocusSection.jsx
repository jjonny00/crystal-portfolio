import React from 'react';
import Headline from '../ui/Headline';

const CONTENT_COLUMN_STYLE = {
  position: 'relative',
  zIndex: 2,
  width: 'min(34vw, 700px)',
  minWidth: '460px',
  marginLeft: '11vw',
  marginRight: 0,
  color: 'rgba(255,255,255,0.95)'
};

const ProjectFocusSection = ({ project, isMobile = false }) => {
  if (!project) return null;

  const headlineColor = project.headlineColor || project.color || '#ffffff';
  const sectionIdKey = project.crystalKey || project.facetKey;

  return (
    <section
      id={`project-${sectionIdKey}`}
      className="scroll-section project"
      data-headline-color={headlineColor}
      style={{
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        background: 'transparent'
      }}
    >
      <div
        style={
          isMobile
            ? {
                ...CONTENT_COLUMN_STYLE,
                width: 'min(92vw, 680px)',
                minWidth: 'unset',
                marginLeft: '5vw',
                marginRight: '5vw'
              }
            : CONTENT_COLUMN_STYLE
        }
      >
        <Headline
          as="h1"
          style={{
            margin: 0,
            fontSize: isMobile ? 'clamp(3rem, 10vw, 4rem)' : 'clamp(4.1rem, 7.2vw, 6.4rem)',
            lineHeight: 0.95,
            fontFamily: '"ivypresto-display", "Playfair Display", Georgia, serif',
            '--headline-ink': headlineColor,
            '--headline-glow1': headlineColor,
            '--headline-glow2': headlineColor
          }}
        >
          {project.title}
        </Headline>

        <p
          style={{
            margin: '10px 0 28px',
            fontFamily: '"acumin-variable", sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            fontSize: isMobile ? '14px' : '32px',
            color: 'rgba(255,255,255,0.7)'
          }}
        >
          {project.subtitle}
        </p>

        <p style={{ fontSize: isMobile ? '21px' : '50px', lineHeight: 1.28, margin: 0 }}>
          {project.description}
        </p>

        {project.secondaryCopy && (
          <p style={{ fontSize: isMobile ? '21px' : '50px', lineHeight: 1.28, margin: '40px 0 0' }}>
            {project.secondaryCopy}
          </p>
        )}

        {project.metrics && (
          <p style={{ fontSize: isMobile ? '21px' : '42px', margin: '22px 0 0', lineHeight: 1.2 }}>
            {project.metrics}
          </p>
        )}

        {project.roles && (
          <p style={{ fontSize: isMobile ? '21px' : '42px', margin: '22px 0 0', color: 'rgba(255,255,255,0.85)' }}>
            {project.roles}
          </p>
        )}

        {project.cta && (
          <p style={{ fontSize: isMobile ? '22px' : '50px', margin: '54px 0 0', color: '#ece93e', fontWeight: 600 }}>
            {project.cta}
          </p>
        )}
      </div>
    </section>
  );
};

export default ProjectFocusSection;
