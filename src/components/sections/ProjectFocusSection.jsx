import React, { useRef } from 'react';
import { animated, useSpring } from '@react-spring/web';
import { PROJECT_ROUTES } from '../../config/projectRouteTiming';
import { msUntilProjectRouteContent } from '../../lib/projectRouteClock';
import Headline from '../ui/Headline';
import KnockoutButton from '../ui/KnockoutButton';
import SquircleSurface from '../ui/SquircleSurface';
import { ctaTypeStyle } from '../ui/ctaType';
import { getScrimTone } from '../../legibility/scrimTone';
import { projectPath } from '../../navigation/routes';
import { inPageLinkHandler } from '../../navigation/linkClick';
import { projectCardColors } from '../../lib/projectCardColors';

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

// The copy's beat after its section settles, when no camera move says otherwise.
const CONTENT_DELAY_MS = 180;
// The body copy follows the title in by this much, and the CTA by as much again.
const CONTENT_STAGGER_MS = 80;

// How long the copy waits once it may show. Arriving from the index or the
// project before, it waits for the camera's move in (projectRouteTiming's
// contentAt), which the section settling usually precedes. Back from the case
// study the copy hears of it first, a frame before the camera starts, so that
// point is counted from now.
const contentDelayFor = (projectKey, fromCaseStudy) => {
  if (fromCaseStudy) {
    const { durationMs, contentAt } = PROJECT_ROUTES.caseStudyToProject;
    return durationMs * contentAt;
  }
  return msUntilProjectRouteContent('overviewToProject', projectKey)
    ?? msUntilProjectRouteContent('projectToProject', projectKey)
    ?? CONTENT_DELAY_MS;
};

const ProjectFocusSection = ({
  project,
  isMobile = false,
  visible = true,
  viewMode = 'overview',
  isActiveProject = false,
  onOpenCaseStudy = null,
  onBackToProject = null
}) => {
  // Fixed when the copy is cleared to show, held until it hides again.
  const revealRef = useRef({ shown: false, delayMs: CONTENT_DELAY_MS });
  const wasCaseStudyRef = useRef(false);

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

  if (isProjectView && !revealRef.current.shown) {
    revealRef.current = {
      shown: true,
      delayMs: contentDelayFor(project.facetKey || project.id, wasCaseStudyRef.current)
    };
  } else if (!isProjectView && revealRef.current.shown) {
    revealRef.current = { shown: false, delayMs: CONTENT_DELAY_MS };
  }
  wasCaseStudyRef.current = caseStudyOpen;
  const revealDelayMs = revealRef.current.delayMs;

  // Title and subtitle, then the body, then the CTA: in together, a beat apart;
  // out at once.
  const copySpring = (staggerMs) => ({
    from: {
      opacity: 0,
      transform: 'translateY(20px)'
    },
    to: {
      opacity: isProjectView ? 1 : 0,
      transform: isProjectView ? 'translateY(0px)' : 'translateY(20px)'
    },
    delay: isProjectView ? revealDelayMs + staggerMs : 0,
    config: {
      tension: 270,
      friction: 28
    }
  });
  const contentSpring = useSpring(copySpring(0));
  const bodySpring = useSpring(copySpring(CONTENT_STAGGER_MS));
  const ctaSpring = useSpring(copySpring(2 * CONTENT_STAGGER_MS));

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

  // On mobile the copy sits on a solid card in the case study hero's colours,
  // so its ink is the card's and the legibility blends stay off.
  const { bg: cardBg, fg: cardFg } = projectCardColors(project);
  const copyClass = isMobile ? '' : COPY_CLASS;

  // Shared by every line of body copy, which is .type-body (type.css).
  const bodyClass = `type-body ${copyClass}`;
  const bodyStyle = { color: isMobile ? cardFg : COPY_INK(copyInk, 0.85) };
  const ctaHref = projectPath(project.facetKey || project.id);
  const openCaseStudy = () => onOpenCaseStudy?.(project.facetKey || project.id);

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
        // On mobile the copy is a card across the full width, running to the
        // bottom of the visible screen; see project-card.css.
        paddingBottom: 0
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
          paddingLeft: isMobile ? 0 : 'clamp(20px, 2.5vw, 52px)',
          paddingRight: isMobile ? 0 : 'clamp(20px, 2.5vw, 52px)',
          boxSizing: 'border-box'
        }}
      >
        {/* On mobile this block is the card the copy sits on (see
            project-card.css), so it scrolls with the section and fades with the
            copy: in on the copy spring's delay, out at once. Once faded it drops
            out of compositing entirely. */}
        {/* The copy is content, not background: a click on it (or a drag to
            select it) never goes back to Work. See SceneBackgroundClick. */}
        {/* Desktop: every project's copy block is as tall as the tallest one
            (--project-copy-height, set by useSharedProjectCopyHeight), the copy
            set from its top and the CTA at its bottom. So the titles all sit at
            one height, and the CTAs at another, whichever project is showing,
            and the facet map, level with the titles, never moves. On a phone
            the block is the card, as tall as its copy: the map sits in the
            bottom row there, beside the CTA. */}
        <div
          className={isMobile ? 'project-card' : undefined}
          data-scene-click-ignore=""
          data-project-copy={isMobile ? undefined : ''}
          style={{
            width: isMobile ? '100%' : contentWidth,
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            ...(!isMobile && { minHeight: 'var(--project-copy-height, 0px)' }),
            gap: isMobile ? 'calc(0.9rem * var(--project-card-v))' : '0',
            textAlign: 'left',
            ...(isMobile && {
              '--project-card-bg': cardBg,
              '--project-card-fg': cardFg,
              opacity: isProjectView ? 1 : 0,
              visibility: isProjectView ? 'visible' : 'hidden',
              transition: isProjectView
                ? `opacity 450ms ease ${revealDelayMs}ms, visibility 0s linear 0s`
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
            {/* The facet map sits level with this title (FacetMapNav). */}
            <Headline
              as="h2"
              className="type-headline"
              data-facet-map-title={project.facetKey || project.id}
              style={{
                margin: 0,
                color: isMobile ? cardFg : headlineColor,
                '--headline-ink': isMobile ? cardFg : headlineColor
              }}
            >
              {displayProject.title}
            </Headline>
          </animated.div>

          <animated.p
            className={`type-subhead-sm ${copyClass}`}
            style={{
              ...contentSpring,
              // On mobile the card's 0.9rem gap is pulled in to sit the
              // descriptor close under the title.
              margin: isMobile ? 'calc(-0.55rem * var(--project-card-v)) 0 calc(0.2rem * var(--project-card-v))' : '8px 0 18px',
              color: isMobile ? COPY_INK(cardFg, 0.7) : COPY_INK(copyInk, 0.6)
            }}
          >
            {displayProject.subtitle}
          </animated.p>

          <animated.p
            className={bodyClass}
            style={{ ...bodySpring, ...bodyStyle, margin: 0 }}
          >
            {displayProject.description}
          </animated.p>

          {displayProject.secondaryCopy && (
            <animated.p
              className={bodyClass}
              style={{
                ...bodySpring,
                ...bodyStyle,
                margin: isMobile ? 'calc(0.2rem * var(--project-card-v)) 0 0' : '30px 0 0'
              }}
            >
              {displayProject.secondaryCopy}
            </animated.p>
          )}

          {displayProject.metrics && (
            <animated.p
              className={bodyClass}
              style={{
                ...bodySpring,
                ...bodyStyle,
                margin: isMobile ? 'calc(0.2rem * var(--project-card-v)) 0 0' : '30px 0 0'
              }}
            >
              {displayProject.metrics}
            </animated.p>
          )}

          {displayProject.roles && (
            <animated.p
              className={bodyClass}
              style={{ ...bodySpring, ...bodyStyle, margin: 0 }}
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
          {/* Mobile: the case study's way back in reverse, a pill in the card's
              ink with the label in its fill, across the card's last row but
              for the facet map's disc at its right (project-card.css). Same
              link and click as the button. */}
          {displayProject.cta && isMobile && (
            <animated.a
              className="project-card__cta"
              href={ctaHref}
              onClick={inPageLinkHandler(openCaseStudy)}
              style={ctaSpring}
            >
              <SquircleSurface />
              {/* The hero CTA's phone size where the row has room for it;
                  narrower, every project's label comes down together, to what
                  fits the longest ("Designing Around Essence", 11.5 times its
                  size across) in the pill's width (cqi, project-card.css). */}
              <span style={{ ...ctaTypeStyle(true), fontSize: 'min(21px, 8.6cqi)' }}>
                {displayProject.cta}
              </span>
            </animated.a>
          )}

          {/* The space above the CTA: 46px at least, and whatever the block's
              shared height adds. */}
          {displayProject.cta && !isMobile && (
            <div data-project-copy-spacer="" style={{ flex: '1 0 46px' }} />
          )}

          {displayProject.cta && !isMobile && (
            <KnockoutButton
              label={displayProject.cta}
              color={headlineColor}
              isMobile={isMobile}
              href={ctaHref}
              onClick={openCaseStudy}
              springStyle={ctaSpring}
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
