import React from 'react';
import { animated, useSpring } from '@react-spring/web';
import Headline from '../ui/Headline';

const ProjectFocusSection = ({
  project,
  isMobile = false,
  visible = true,
  viewMode = 'overview',
  isActiveProject = false,
  onOpenCaseStudy = null,
  onBackToProject = null
}) => {
  if (!project) return null;

  const headlineColor = project.headlineColor || project.color || '#ffffff';
  const displayProject = isMobile && project.mobile ? { ...project, ...project.mobile } : project;
  const contentWidth = isMobile ? '100%' : 'min(34vw, 640px)';
  const isCaseStudy = visible && isActiveProject && viewMode === 'caseStudy';
  const isProjectView = visible && !isCaseStudy;

  const contentSpring = useSpring({
    from: {
      opacity: 0,
      transform: 'translateY(20px)'
    },
    to: {
      opacity: isProjectView ? 1 : 0,
      transform: isProjectView ? 'translateY(0px)' : 'translateY(20px)'
    },
    delay: isProjectView ? 180 : 0,
    config: {
      tension: 270,
      friction: 28
    }
  });

  const caseStudySpring = useSpring({
    from: {
      opacity: 0,
      transform: 'translateY(12px)'
    },
    to: {
      opacity: isCaseStudy ? 1 : 0,
      transform: isCaseStudy ? 'translateY(0px)' : 'translateY(12px)'
    },
    delay: isCaseStudy ? 520 : 0,
    config: {
      tension: 270,
      friction: 28
    }
  });

  return (
    <div
      style={{
        height: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'flex-start',
        background: 'transparent',
        boxSizing: 'border-box',
        paddingBottom: isMobile ? 'calc(4.75rem + env(safe-area-inset-bottom, 0px))' : 0
      }}
    >
      <animated.div
        style={{
          ...contentSpring,
          pointerEvents: isProjectView ? 'auto' : 'none',
          width: isMobile ? '100%' : '50vw',
          height: isMobile ? 'auto' : '100vh',
          position: isMobile ? 'static' : 'absolute',
          left: isMobile ? 'auto' : 0,
          top: isMobile ? 'auto' : 0,
          display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: isMobile ? 'flex-start' : 'center',
          paddingLeft: isMobile ? '16px' : 'clamp(20px, 2.5vw, 52px)',
          paddingRight: isMobile ? '16px' : 'clamp(20px, 2.5vw, 52px)',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            width: isMobile ? '100%' : contentWidth,
            maxWidth: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: isMobile ? '0.9rem' : '0',
            textAlign: 'left'
          }}
        >
          <Headline
            as="h1"
            style={{
              margin: 0,
              color: headlineColor,
              fontFamily: '"acumin-variable", "Acumin VF", sans-serif',
              fontSize: isMobile ? 'clamp(2.2rem, 11vw, 2.9rem)' : '96px',
              fontStyle: 'normal',
              fontStretch: '68%',
              fontWeight: 700,
              lineHeight: isMobile ? '1' : '96px',
              letterSpacing: isMobile ? '-0.02em' : '-1.92px',
              textTransform: 'uppercase',
              '--headline-ink': headlineColor,
              '--headline-glow1': headlineColor,
              '--headline-glow2': headlineColor
            }}
          >
            {displayProject.title}
          </Headline>

          <p
            style={{
              margin: isMobile ? '0 0 0.2rem' : '8px 0 18px',
              color: 'rgb(from #E2DCC3 r g b / 0.6)',
              fontFamily: '"acumin-variable", "Acumin VF", sans-serif',
              fontSize: isMobile ? '14px' : '16px',
              fontStyle: 'normal',
              fontWeight: 400,
              lineHeight: isMobile ? '1.35' : '30px',
              letterSpacing: isMobile ? '-0.2px' : '-0.32px',
              textTransform: 'uppercase'
            }}
          >
            {displayProject.subtitle}
          </p>

          <p
            style={{
              margin: 0,
              color: 'rgb(from #E2DCC3 r g b / 0.85)',
              fontFamily: '"acumin-variable", "Acumin VF", sans-serif',
              fontSize: isMobile ? '18px' : '24px',
              fontStyle: 'normal',
              fontWeight: 300,
              lineHeight: isMobile ? '1.38' : '30px',
              letterSpacing: isMobile ? '-0.24px' : '-0.48px'
            }}
          >
            {displayProject.description}
          </p>

          {displayProject.secondaryCopy && (
            <p
              style={{
                margin: isMobile ? '0.2rem 0 0' : '30px 0 0',
                color: 'rgb(from #E2DCC3 r g b / 0.85)',
                fontFamily: '"acumin-variable", "Acumin VF", sans-serif',
                fontSize: isMobile ? '18px' : '24px',
                fontStyle: 'normal',
                fontWeight: 300,
                lineHeight: isMobile ? '1.38' : '30px',
                letterSpacing: isMobile ? '-0.24px' : '-0.48px'
              }}
            >
              {displayProject.secondaryCopy}
            </p>
          )}

          {displayProject.metrics && (
            <p
              style={{
                margin: isMobile ? '0.2rem 0 0' : '30px 0 0',
                color: 'rgb(from #E2DCC3 r g b / 0.85)',
                fontFamily: '"acumin-variable", "Acumin VF", sans-serif',
                fontSize: isMobile ? '18px' : '24px',
                fontStyle: 'normal',
                fontWeight: 300,
                lineHeight: isMobile ? '1.38' : '30px',
                letterSpacing: isMobile ? '-0.24px' : '-0.48px'
              }}
            >
              {displayProject.metrics}
            </p>
          )}

          {displayProject.roles && (
            <p
              style={{
                margin: 0,
                color: 'rgb(from #E2DCC3 r g b / 0.85)',
                fontFamily: '"acumin-variable", "Acumin VF", sans-serif',
                fontSize: isMobile ? '18px' : '24px',
                fontStyle: 'normal',
                fontWeight: 300,
                lineHeight: isMobile ? '1.38' : '30px',
                letterSpacing: isMobile ? '-0.24px' : '-0.48px'
              }}
            >
              {displayProject.roles}
            </p>
          )}

          {displayProject.cta && (
            <button
              type="button"
              onClick={() => onOpenCaseStudy?.(project.facetKey || project.id)}
              style={{
                margin: isMobile ? '1rem 0 0' : '46px 0 0',
                color: headlineColor,
                textAlign: isMobile ? 'left' : 'center',
                fontFamily: '"acumin-variable", "Acumin VF", sans-serif',
                fontSize: isMobile ? '20px' : '24px',
                fontStyle: 'normal',
                fontWeight: 600,
                lineHeight: isMobile ? '1.35' : '30px',
                letterSpacing: '-0.48px',
                background: 'transparent',
                border: `1px solid ${headlineColor}`,
                borderRadius: '999px',
                padding: isMobile ? '10px 16px' : '12px 22px',
                cursor: 'pointer'
              }}
            >
              {displayProject.cta}
            </button>
          )}
        </div>
      </animated.div>

      <animated.div
        style={{
          ...caseStudySpring,
          position: 'absolute',
          inset: 0,
          pointerEvents: isCaseStudy ? 'auto' : 'none',
          padding: isMobile ? '1rem' : '2rem',
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 'min(900px, 92vw)',
            background: 'rgba(8, 10, 15, 0.72)',
            border: `1px solid rgb(from ${headlineColor} r g b / 0.45)`,
            borderRadius: '16px',
            padding: isMobile ? '1rem' : '1.5rem'
          }}
        >
          <button
            type="button"
            onClick={() => onBackToProject?.()}
            style={{
              position: 'sticky',
              top: 0,
              marginBottom: '1rem',
              background: 'transparent',
              border: `1px solid ${headlineColor}`,
              color: headlineColor,
              borderRadius: '999px',
              padding: '8px 14px',
              cursor: 'pointer'
            }}
          >
            Back to Project
          </button>
          <h2 style={{ margin: '0 0 0.5rem', color: headlineColor }}>{displayProject.title} Case Study</h2>
          <p style={{ margin: 0, color: 'rgb(from #E2DCC3 r g b / 0.92)' }}>
            {displayProject.description}
          </p>
        </div>
      </animated.div>
    </div>
  );
};

export default ProjectFocusSection;
