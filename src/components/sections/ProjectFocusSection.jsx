import React from 'react';
import Headline from '../ui/Headline';

const ProjectFocusSection = ({ project, isMobile = false }) => {
  if (!project) return null;

  const headlineColor = project.headlineColor || project.color || '#ffffff';
  const sectionIdKey = project.crystalKey || project.facetKey;

  const contentWidth = isMobile ? '100%' : 'min(34vw, 640px)';

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
        boxSizing: 'border-box'
      }}
    >
      <div
        style={
          isMobile
            ? {
                width: '100%',
                paddingLeft: '22px',
                paddingRight: '22px',
                boxSizing: 'border-box'
              }
            : {
                position: 'absolute',
                left: 0,
                top: 0,
                width: '50vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingLeft: 'clamp(20px, 2.5vw, 52px)',
                paddingRight: 'clamp(20px, 2.5vw, 52px)',
                boxSizing: 'border-box'
              }
        }
      >
        <div
          style={{
            width: contentWidth,
            maxWidth: '100%'
          }}
        >
          <Headline
            as="h1"
            style={{
              margin: 0,
              color: headlineColor,
              fontFamily: '"ivypresto-display", "IvyPresto Display", "Playfair Display", Georgia, serif',
              fontSize: isMobile ? '44px' : '64px',
              fontStyle: 'normal',
              fontWeight: 400,
              lineHeight: 'normal',
              textTransform: 'uppercase',
              '--headline-ink': headlineColor,
              '--headline-glow1': headlineColor,
              '--headline-glow2': headlineColor
            }}
          >
            {project.title}
          </Headline>

          <p
            style={{
              margin: '8px 0 18px',
              color: 'rgb(from #E2DCC3 r g b / 0.6)',
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
              color: 'rgb(from #E2DCC3 r g b / 0.85)',
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
                color: 'rgb(from #E2DCC3 r g b / 0.85)',
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
                color: 'rgb(from #E2DCC3 r g b / 0.85)',
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
                margin: 0,
                color: 'rgb(from #E2DCC3 r g b / 0.85)',
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
      </div>
    </section>
  );
};

export default ProjectFocusSection;
