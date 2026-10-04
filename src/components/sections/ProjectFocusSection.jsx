import React from 'react';
import { animated, useSpring } from '@react-spring/web';
import Headline from '../ui/Headline';
import KnockoutButton from '../ui/KnockoutButton';
import { getScrimTone } from '../../legibility/scrimTone';
import { projectPath } from '../../navigation/routes';

// The body copy's ink is authored, not measured: every project names it in
// projects.js under `scrim.darkText`, and that answer holds at every screen size.
// It used to be a split — desktop took an ink measured against the live scene
// while mobile took the authored one — which meant a project set to dark copy got
// it on a phone and cream on a laptop, from the same flag.
//
// The blend classes below stay: they are what the `difference` and `exclusion`
// comparison modes act on (legibility.css, cycled with L), and `legible-ink`
// carries the colour transition between one project's ink and the next. Two
// things about how they are attached:
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

// The ink these lines take, at the alpha each one wants. A flat colour: it used
// to read `var(--ink-copy, …)` so backdropInk.js could override it per frame on
// desktop, and that override is what stopped `darkText` reaching a laptop.
const COPY_INK = (ink, alpha) => `rgb(from ${ink} r g b / ${alpha})`;

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
  // One recipe, both screen sizes. `darkText` on a project swaps this to the
  // near-black ink; it governs the body copy and nothing else. The CTA keeps the
  // project's own accent either way — see the note at the button.
  const tone = getScrimTone(project.facetKey || project.id);
  const copyInk = tone.ink;
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

  // Shared by every line of body copy, which is .type-body (type.css).
  const bodyClass = `type-body ${COPY_CLASS}`;
  const bodyStyle = { color: COPY_INK(copyInk, 0.85) };

  return (
    <div
      style={{
        // Mobile lays the copy out in the SMALL viewport at the top of the
        // section. The section is 100vh, which on iOS Safari is the viewport
        // with its toolbar hidden — so anything placed against the section's
        // bottom lands behind the toolbar and past the app frame's corners
        // while the toolbar is showing. The hero sizes in svh for the same
        // reason.
        height: isMobile ? '100svh' : '100vh',
        alignSelf: isMobile ? 'flex-start' : 'auto',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'flex-start',
        background: 'transparent',
        boxSizing: 'border-box',
        // On mobile the copy is a glass card sitting the card inset off the
        // bottom of the visible screen; see glass-card.css.
        paddingBottom: isMobile ? 'calc(var(--glass-card-inset) + env(safe-area-inset-bottom, 0px))' : 0
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
          paddingLeft: isMobile ? 'var(--glass-card-inset)' : 'clamp(20px, 2.5vw, 52px)',
          paddingRight: isMobile ? 'var(--glass-card-inset)' : 'clamp(20px, 2.5vw, 52px)',
          boxSizing: 'border-box'
        }}
      >
        {/* On mobile this block is the glass card the copy sits on (see
            glass-card.css), so it scrolls with the section and fades with the
            copy: in on the copy spring's delay, out at once. Tinted with the
            project's authored scrim colour, the same recipe the copy ink is
            picked against. Once faded it drops out of compositing entirely. */}
        <div
          className={isMobile ? 'glass-card' : undefined}
          style={{
            width: isMobile ? '100%' : contentWidth,
            maxWidth: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: isMobile ? '0.9rem' : '0',
            textAlign: 'left',
            ...(isMobile && {
              padding: 'var(--project-card-pad)',
              // The colour the glass picks up at its edge and in its fill.
              '--glass-accent': headlineColor,
              '--glass-tint': tone.wash,
              '--glass-tint-low': `rgba(${tone.rgb.join(', ')}, ${Math.min(0.9, tone.opacity + 0.25)})`,
              opacity: isProjectView ? 1 : 0,
              visibility: isProjectView ? 'visible' : 'hidden',
              transition: isProjectView
                ? 'opacity 450ms ease 180ms, visibility 0s linear 0s'
                : 'opacity 450ms ease, visibility 0s linear 450ms'
            })
          }}
        >
          {/* Unblended, as asked: the title is the project's accent colour and
              inverting it would swing the hue across the whole palette. It is
              also large and heavy enough to hold its own. */}
          <animated.div style={contentSpring}>
            {/* h2: the page's one h1 is the hero headline, and each project
                is a section under it. */}
            <Headline
              as="h2"
              className="type-headline"
              style={{
                margin: 0,
                color: headlineColor,
                '--headline-ink': headlineColor
              }}
            >
              {displayProject.title}
            </Headline>
          </animated.div>

          <animated.p
            className={`type-subhead-sm ${COPY_CLASS}`}
            style={{
              ...contentSpring,
              margin: isMobile ? '0 0 0.2rem' : '8px 0 18px',
              color: COPY_INK(copyInk, 0.6)
            }}
          >
            {displayProject.subtitle}
          </animated.p>

          <animated.p
            className={bodyClass}
            style={{ ...contentSpring, ...bodyStyle, margin: 0 }}
          >
            {displayProject.description}
          </animated.p>

          {displayProject.secondaryCopy && (
            <animated.p
              className={bodyClass}
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
              className={bodyClass}
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
              className={bodyClass}
              style={{ ...contentSpring, ...bodyStyle, margin: 0 }}
            >
              {displayProject.roles}
            </animated.p>
          )}

          {/* Unblended, as asked. It is also the one interactive element here,
              and a control whose colour moves with the scene reads as a state
              change rather than as an affordance — which is equally true of it
              moving with `darkText`. The accent is the project's, full strength,
              on every section and both screen sizes: it is the one place the
              project's own colour reaches the copy block, and darkening it to
              suit a light scrim cost more than it bought.

              Now the fill rather than the ink: the pill is the accent and the
              label is cut out of it, so the scene reads through the letterforms.
              See KnockoutButton for why that needs an SVG mask. */}
          {displayProject.cta && (
            <KnockoutButton
              label={displayProject.cta}
              color={headlineColor}
              isMobile={isMobile}
              href={projectPath(project.facetKey || project.id)}
              onClick={() => onOpenCaseStudy?.(project.facetKey || project.id)}
              springStyle={contentSpring}
              style={{ margin: isMobile ? '1rem 0 0' : '46px 0 0' }}
            />
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
