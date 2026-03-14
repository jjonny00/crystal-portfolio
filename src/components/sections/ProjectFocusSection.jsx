import React from 'react';
import Headline from '../ui/Headline';

const ProjectFocusSection = ({ project, isMobile = false }) => {
  if (!project) return null;

  const headlineColor = project.headlineColor || project.color || '#ffffff';

  return (
    <section
      id={`project-${project.facetKey}`}
      className="scroll-section project"
      data-headline-color={headlineColor}
      style={{
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      {project.imageUrl && (
        <img
          src={project.imageUrl}
          alt={project.title}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(18, 10, 28, 0.86) 0%, rgba(25, 14, 35, 0.74) 42%, rgba(11, 8, 20, 0.1) 100%)'
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: 'min(760px, 92vw)',
          marginLeft: isMobile ? '4vw' : '12vw',
          marginRight: isMobile ? '4vw' : 0,
          color: 'rgba(255,255,255,0.95)'
        }}
      >
        <Headline
          as="h1"
          style={{
            margin: 0,
            fontSize: isMobile ? 'clamp(3rem, 10vw, 4rem)' : 'clamp(4rem, 8vw, 6.2rem)',
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
