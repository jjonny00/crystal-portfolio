// src/caseStudies/system/NextProjectSection.jsx
//
// The end of every case study: the way on to the next project. CaseStudyPage
// renders it after the case study's own sections, so no case study composes it.
//
//   Next Project
//   <Next project's name>  ->        [the facet map, its fragment lit]
//   <its subtitle>
//   ----------------------------------------------------------------
//   <- Previous · <name>                              View All Work ->
//
// In the facet map's order (Slipstream, Mesa, FundSeeder, Flying Axes, Forest
// Giant, GE), wrapping round at both ends. Each project link goes to that
// project's preview, as the facet map's index does (the host closes the case
// study and moves the scene on); View All Work goes where the nav's Work does.
// See docs/case-study-system.md.
//
// Tone "a", the project's colour: every case study ends on a tone-b section, so
// this one stands apart from it. The map is drawn in the section's ink.

import React, { useContext, useId } from 'react';
import CaseStudySection from './CaseStudySection';
import { CaseStudyNavContext } from './caseStudyNav';
import FacetMapGlyph from '../../components/facetMap/FacetMapGlyph';
import { FACET_MAP_ORDER } from '../../components/facetMap/facetMapData';
import { getProjectByAnyKey } from '../../data/projects';
import { VIEW_ALL_WORK_LABEL } from '../../data/siteCopy';
import { pathFor, projectPath } from '../../navigation/routes';
import { NAVIGATION_DESTINATIONS } from '../../navigation/navigationIntent';
import { inPageLinkHandler } from '../../navigation/linkClick';

const MAP_HEIGHT = 168;

const Arrow = ({ direction = 'right', className }) => (
  <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path
      d={direction === 'right' ? 'M2 8h11M9 4l4 4-4 4' : 'M14 8H3M7 4 3 8l4 4'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const NextProjectSection = () => {
  const nav = useContext(CaseStudyNavContext);
  const headingId = useId();
  const index = nav?.projectId ? FACET_MAP_ORDER.indexOf(nav.projectId) : -1;
  if (index === -1) return null;

  const count = FACET_MAP_ORDER.length;
  const nextId = FACET_MAP_ORDER[(index + 1) % count];
  const previousId = FACET_MAP_ORDER[(index - 1 + count) % count];
  const next = getProjectByAnyKey(nextId);
  const previous = getProjectByAnyKey(previousId);
  if (!next || !previous) return null;

  const goTo = (projectId) => inPageLinkHandler(() => nav.onSelectProject?.(projectId));

  return (
    <CaseStudySection
      tone="a"
      className="cs-next"
      innerClassName="cs-next__inner"
      aria-labelledby={headingId}
    >
      <nav className="cs-next__nav" aria-labelledby={headingId}>
        <div className="cs-next__main">
          <h2 className="type-caption-caps cs-next__eyebrow" id={headingId}>
            Next Project
          </h2>
          <a
            className="cs-next__link"
            href={projectPath(nextId)}
            onClick={nav.onSelectProject ? goTo(nextId) : undefined}
          >
            <span className="type-headline cs-next__title">
              {next.label}
              <Arrow className="cs-next__arrow" />
            </span>
            {next.subtitle && (
              <span className="type-subhead-sm cs-next__subtitle">{next.subtitle}</span>
            )}
          </a>
        </div>

        {/* The next project's place among the six. A picture: the link
            beside it says which project it is. */}
        <FacetMapGlyph
          className="cs-next__map"
          currentId={nextId}
          variant="ink"
          ink="currentColor"
          currentOutline="var(--cs-bg)"
          height={MAP_HEIGHT}
        />

        <div className="cs-next__foot">
          <a
            className="type-subhead-sm cs-next__minor"
            href={projectPath(previousId)}
            onClick={nav.onSelectProject ? goTo(previousId) : undefined}
          >
            <Arrow direction="left" className="cs-next__minor-arrow" />
            <span>
              Previous · {previous.label}
            </span>
          </a>
          <a
            className="type-subhead-sm cs-next__minor"
            href={pathFor(NAVIGATION_DESTINATIONS.OVERVIEW)}
            onClick={nav.onViewAllWork ? inPageLinkHandler(nav.onViewAllWork) : undefined}
          >
            <span>{VIEW_ALL_WORK_LABEL}</span>
            <Arrow className="cs-next__minor-arrow" />
          </a>
        </div>
      </nav>
    </CaseStudySection>
  );
};

export default NextProjectSection;
