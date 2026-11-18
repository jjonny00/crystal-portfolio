// src/caseStudies/flying-axes/FlyingAxesCaseStudy.jsx
//
// Flying Axes, composed from the reusable case-study system. This file is the
// whole page: which sections run, in what order, in which tone, and which
// custom visual (if any) goes in a section's media slot. Everything else is
// content in flyingAxesContent.js.
//
// Five sections, the finishing pass (November 2026). Tone marks a chapter
// change rather than alternating: every section sits on colour B except two
// that paint no background, so the crystal shows through — the hero, and the
// turn from the game to how the venues ran. Both follow from that: the
// registry entry must stay 'reveal', and the overlay keeps the renderer awake
// whenever either is near the viewport.

import React from 'react';
import {
  CaseStudyPage,
  CaseStudyHero,
  SequenceSection,
  FeatureSection,
  ConclusionSection,
  MediaGallery,
  MediaRail,
} from '../system';
import ScoreboardCallouts from './ScoreboardCallouts';
import GameModesComparison from './GameModesComparison';
import VenueSystem from './VenueSystem';
import { flyingAxesContent } from './flyingAxesContent';
import './flyingAxes.css';

const FlyingAxesCaseStudy = ({ project, onClose }) => {
  const c = flyingAxesContent;

  return (
    <CaseStudyPage
      colors={project?.caseStudyColors}
      label={`${c.projectName} case study: ${c.title}`}
      onClose={onClose}
    >
      {/* The cage, uncropped, beside the introduction. */}
      <CaseStudyHero
        tone="a"
        background="none"
        projectName={c.projectName}
        title={c.title}
        intro={c.hero.intro}
        media={c.hero.media}
        metadata={c.hero.metadata}
      />

      {/* The scoreboard straight after the copy about sightlines, annotated,
          then quick entry and the scorecard: one exhibit of the session. The
          annotated board carries its own callouts, so its item is a custom
          child rather than a plain image. */}
      <FeatureSection tone="b" align="start" title={c.coach.title} intro={c.coach.intro}>
        <MediaGallery
          layout="3-up"
          items={[
            {
              key: 'scoreboard',
              autoHeight: true,
              children: <ScoreboardCallouts {...c.coach.scoreboard} />,
            },
            ...c.coach.gallery,
          ]}
          caption={c.coach.caption}
        />
      </FeatureSection>

      {/* The two formats, then the rules card that spread one variation. */}
      <SequenceSection tone="b" title={c.freeform.title} intro={c.freeform.intro}>
        <GameModesComparison {...c.freeform.formats} booklet={c.freeform.booklet} />
      </SequenceSection>

      {/* On the crystal: the story turns from the game to the venues. The
          diagram, then how the scoreboard was made as a strip beneath it: a
          direct child of the stage, so it runs edge to edge like every rail. */}
      <FeatureSection
        tone="a"
        background="none"
        align="start"
        title={c.venues.title}
        intro={c.venues.intro}
        caption={c.venues.caption}
      >
        <VenueSystem {...c.venues.system} />
        <MediaRail className="fa-venues-strip" items={c.venues.steps} />
      </FeatureSection>

      <ConclusionSection
        tone="b"
        outcomeTitle="Outcomes"
        outcomes={c.conclusion.outcomes}
        lessonsTitle={c.conclusion.lessonsTitle}
        lessons={c.conclusion.lessons}
      />
    </CaseStudyPage>
  );
};

export default FlyingAxesCaseStudy;
