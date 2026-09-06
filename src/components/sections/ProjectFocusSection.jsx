import React from 'react';
import { animated, useSpring } from '@react-spring/web';
import Headline from '../ui/Headline';

// The body copy blends against the live scene rather than sitting on a scrim —
// see legibility.css. Two things about how that is wired here:
//
//   • The class goes on the elements that carry the entrance spring, not on a
//     wrapper around them. A spring writes an opacity and a transform, and both
//     make an element an isolated group; a blended child inside one would blend
//     against its parent's empty backdrop and look untreated. Putting the mode
//     on the same element that owns the spring makes the group and the blend the
//     same box, so it blends against the page.
//   • Which is also why the spring moved off the single wrapper it used to sit
//     on and onto each element in turn. The values are shared, so the block
//     still fades and rises as one — but now each line is its own group, and the
//     title and the CTA can stay out of the blend simply by not asking for it.
const COPY_CLASS = 'legible-blend legible-ink';

// The ink these lines take in `adaptive` mode, measured against the scene behind
// them and published onto <html> by backdropInk.js. The authored colour is the
// fallback, so every other mode renders exactly what it always did.
const COPY_INK = (alpha) => `rgb(from var(--ink-copy, #E2DCC3) r g b / ${alpha})`;

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
  // Projects with a `caseStudySlug` render their case study in the full-page
  // overlay instead of this inline stub; the stub remains for the rest.
  const hasFullCaseStudy = Boolean(project.caseStudySlug);
  // Either way the preview copy clears out — for the full-page case study it
  // fades before the colour wash starts, so the crystal is briefly alone.
  const caseStudyOpen = visible && isActiveProject && viewMode === 'caseStudy';
  const isCaseStudy = caseStudyOpen && !hasFullCaseStudy;
  const isProjectView = visible && !caseStudyOpen;

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

  // Shared by every line of body copy. Only the size/leading metrics differ
  // between them, so the rest is stated once.
  const bodyStyle = {
    color: COPY_INK(0.85),
    fontFamily: '"acumin-variable", "Acumin VF", sans-serif',
    fontSize: isMobile ? '18px' : '24px',
    fontStyle: 'normal',
    fontWeight: 300,
    lineHeight: isMobile ? '1.38' : '30px',
    letterSpacing: isMobile ? '-0.24px' : '-0.48px'
  };

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
      {/* Plain, not animated: this used to carry the entrance spring for the
          whole block, which made it an isolated group and put a wall between the
          copy inside it and the scene it now blends with. The spring moved down
          onto the individual lines. */}
      <div
        style={{
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
        {/* ProjectScrim measures this block to size itself — it is the copy
            the scrim exists to ground. Keyed like the section id so the scrim
            can find it from the settled section alone. */}
        <div
          data-project-copy={project.facetKey || project.id}
          style={{
            width: isMobile ? '100%' : contentWidth,
            maxWidth: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: isMobile ? '0.9rem' : '0',
            textAlign: 'left'
          }}
        >
          {/* Unblended, as asked: the title is the project's accent colour and
              inverting it would swing the hue across the whole palette. It is
              also large and heavy enough to hold its own. */}
          <animated.div style={contentSpring}>
            <Headline
              as="h1"
              style={{
                margin: 0,
                color: headlineColor,
                fontFamily: '"acumin-variable", "Acumin VF", sans-serif',
                fontSize: isMobile ? 'clamp(2.2rem, 11vw, 2.9rem)' : '96px',
                fontStyle: 'normal',
                fontStretch: '68%',
                fontVariationSettings: '"wdth" 68',
                fontWeight: 700,
                lineHeight: isMobile ? '1' : '96px',
                letterSpacing: isMobile ? '-0.02em' : '-1.92px',
                textTransform: 'uppercase',
                '--headline-ink': headlineColor
              }}
            >
              {displayProject.title}
            </Headline>
          </animated.div>

          <animated.p
            className={COPY_CLASS}
            data-ink-region="copy"
            style={{
              ...contentSpring,
              margin: isMobile ? '0 0 0.2rem' : '8px 0 18px',
              color: COPY_INK(0.6),
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
          </animated.p>

          <animated.p
            className={COPY_CLASS}
            data-ink-region="copy"
            style={{ ...contentSpring, ...bodyStyle, margin: 0 }}
          >
            {displayProject.description}
          </animated.p>

          {displayProject.secondaryCopy && (
            <animated.p
              className={COPY_CLASS}
            data-ink-region="copy"
              style={{
                ...contentSpring,
                ...bodyStyle,
                margin: isMobile ? '0.2rem 0 0' : '30px 0 0'
              }}
            >
              {displayProject.secondaryCopy}
            </animated.p>
          )}

          {displayProject.metrics && (
            <animated.p
              className={COPY_CLASS}
            data-ink-region="copy"
              style={{
                ...contentSpring,
                ...bodyStyle,
                margin: isMobile ? '0.2rem 0 0' : '30px 0 0'
              }}
            >
              {displayProject.metrics}
            </animated.p>
          )}

          {displayProject.roles && (
            <animated.p
              className={COPY_CLASS}
            data-ink-region="copy"
              style={{ ...contentSpring, ...bodyStyle, margin: 0 }}
            >
              {displayProject.roles}
            </animated.p>
          )}

          {/* Unblended, as asked. It is also the one interactive element here,
              and a control whose colour moves with the scene reads as a state
              change rather than as an affordance. */}
          {displayProject.cta && (
            <animated.button
              type="button"
              onClick={() => onOpenCaseStudy?.(project.facetKey || project.id)}
              style={{
                ...contentSpring,
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
            </animated.button>
          )}
        </div>
      </div>

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
