import React from 'react';

const ProjectFocusSection = ({ project, isMobile = false }) => {
  if (!project) return null;

  const headlineColor = project.headlineColor || project.color || '#ffffff';
  const sectionIdKey = project.crystalKey || project.facetKey;

  const horizontalPadding = isMobile ? '24px' : 'clamp(80px, 9vw, 170px)';
  const contentWidth = isMobile ? '100%' : 'min(36vw, 640px)';

  return (
    <section
      id={`project-${sectionIdKey}`}
      className="scroll-section project"
      data-headline-color={headlineColor}
      style={{
        height: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        background: 'transparent',
        paddingLeft: horizontalPadding,
        paddingRight: horizontalPadding,
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          width: contentWidth,
          maxWidth: '100%'
        }}
      >
        <h1
          style={{
            margin: 0,
            color: headlineColor,
            fontFamily: '"ivypresto-display", "IvyPresto Display", "Playfair Display", Georgia, serif',
            fontSize: isMobile ? '44px' : '64px',
            fontStyle: 'normal',
            fontWeight: 400,
            lineHeight: 'normal',
            textTransform: 'uppercase'
          }}
        >
          {project.title}
        </h1>

        <p
          style={{
            margin: '8px 0 18px',
            color: '#E2DCC3',
            fontFamily: '"acumin-variable", "Acumin VF", sans-serif',
            fontSize: '16px',
            fontStyle: 'normal',
            fontWeight: 400,
            lineHeight: '30px',
            letterSpacing: '-0.32px',
            textTransform: 'uppercase'
          }}
        >
          {project.subtitle}
        </p>

        <p
          style={{
            margin: 0,
            color: '#E2DCC3',
            fontFamily: '"acumin-variable", "Acumin VF", sans-serif',
            fontSize: isMobile ? '22px' : '24px',
            fontStyle: 'normal',
            fontWeight: 300,
            lineHeight: '30px',
            letterSpacing: '-0.48px'
          }}
        >
          {project.description}
        </p>

        {project.secondaryCopy && (
          <p
            style={{
              margin: '30px 0 0',
              color: '#E2DCC3',
              fontFamily: '"acumin-variable", "Acumin VF", sans-serif',
              fontSize: isMobile ? '22px' : '24px',
              fontStyle: 'normal',
              fontWeight: 300,
              lineHeight: '30px',
              letterSpacing: '-0.48px'
            }}
          >
            {project.secondaryCopy}
          </p>
        )}

        {project.metrics && (
          <p
            style={{
              margin: '30px 0 0',
              color: '#E2DCC3',
              fontFamily: '"acumin-variable", "Acumin VF", sans-serif',
              fontSize: isMobile ? '22px' : '24px',
              fontStyle: 'normal',
              fontWeight: 300,
              lineHeight: '30px',
              letterSpacing: '-0.48px'
            }}
          >
            {project.metrics}
          </p>
        )}

        {project.roles && (
          <p
            style={{
              margin: '0',
              color: '#E2DCC3',
              fontFamily: '"acumin-variable", "Acumin VF", sans-serif',
              fontSize: isMobile ? '22px' : '24px',
              fontStyle: 'normal',
              fontWeight: 300,
              lineHeight: '30px',
              letterSpacing: '-0.48px'
            }}
          >
            {project.roles}
          </p>
        )}

        {project.cta && (
          <p
            style={{
              margin: '46px 0 0',
              color: headlineColor,
              textAlign: 'center',
              fontFamily: '"acumin-variable", "Acumin VF", sans-serif',
              fontSize: '24px',
              fontStyle: 'normal',
              fontWeight: 600,
              lineHeight: '30px',
              letterSpacing: '-0.48px'
            }}
          >
            {project.cta}
          </p>
        )}
      </div>
    </section>
  );
};

export default ProjectFocusSection;
