// src/caseStudies/flying-axes/FlyingAxesCaseStudy.jsx
//
// Flying Axes, composed from the reusable case-study system. This file is the
// whole page: which sections run, in what order, in which tone, and which
// custom visual (if any) goes in a section's media slot. Everything else is
// content in flyingAxesContent.js.
//
// Tone rhythm, as in Mesa: every section sits on colour B except two that
// paint no background at all, so the crystal shows through — the hero, and the
// turn in the story where coaches change the game. Both follow from that: the
// registry entry must stay 'reveal', and the overlay keeps the renderer awake
// whenever either is near the viewport.

import React from 'react';
import {
  CaseStudyPage,
  CaseStudyHero,
  CaseStudyOverview,
  SplitSection,
  SequenceSection,
  FeatureSection,
  ConclusionSection,
  MediaGallery,
  MediaRail,
} from '../system';
import ScoreboardCallouts from './ScoreboardCallouts';
import { flyingAxesContent } from './flyingAxesContent';
import './flyingAxes.css';

const FlyingAxesCaseStudy = ({ project, onClose }) => {
  const c = flyingAxesContent;

  return (
    <CaseStudyPage
      colors={project?.caseStudyColors}
      label={`${c.projectName} case study: ${c.title}`}
      backLabel={`Back to ${project?.label || c.projectName}`}
      onClose={onClose}
    >
      <CaseStudyHero
        tone="a"
        background="none"
        projectName={c.projectName}
        title={c.title}
        intro={c.hero.intro}
        media={c.hero.media}
      />

      <CaseStudyOverview
        tone="b"
        title={c.overview.title}
        body={c.overview.body}
        metadata={c.overview.metadata}
        media={c.overview.media}
      />

      {/* The close-up and the board in place, as one pair: what the display
          says, then where it hangs. The close-up carries its own callouts, so
          its item is a custom child rather than a plain image. */}
      <FeatureSection
        tone="b"
        align="start"
        title={c.match.title}
        intro={c.match.intro}
      >
        <MediaGallery
          layout="2-up"
          items={[
            {
              key: 'scoreboard',
              autoHeight: true,
              children: <ScoreboardCallouts {...c.match.scoreboard} />,
            },
            c.match.venue,
          ]}
          caption={c.match.caption}
        />
      </FeatureSection>

      {/* The app, then what it printed: the session and its souvenir, stacked
          in the order a visit runs. */}
      <SplitSection
        tone="b"
        direction="text-left"
        title={c.coach.title}
        body={c.coach.body}
        media={<MediaGallery layout="stacked" items={c.coach.gallery} />}
      />

      {/* The stage sits after the booklet paragraph, and the observation and
          league-play paragraphs close the section beneath it. The mapping
          session, then three pages from the booklet, read left to right. All
          four are landscape, so on phones the rail runs shorter than its
          default: each item comes in under the screen width and the next one
          peeks past the edge. */}
      <FeatureSection
        tone="a"
        background="none"
        align="start"
        title={c.changeTheGame.title}
        intro={c.changeTheGame.intro}
        caption={c.changeTheGame.caption}
        takeaway={c.changeTheGame.closing}
      >
        <MediaRail items={c.changeTheGame.steps} mobileHeight="56vw" />
      </FeatureSection>

      {/* How the scoreboard was made, read left to right: four photos of mixed
          shapes, so a rail at one shared height carries them as one band. */}
      <SequenceSection
        tone="b"
        title={c.venues.title}
        intro={c.venues.body}
        caption={c.venues.caption}
      >
        <MediaRail items={c.venues.steps} />
      </SequenceSection>

      <ConclusionSection
        tone="b"
        outcomeTitle="Outcomes"
        outcomes={c.conclusion.outcomes}
        lessonsTitle={c.conclusion.lessonsTitle}
        lessons={c.conclusion.lessons}
        takeaway={c.conclusion.takeaway}
      />
    </CaseStudyPage>
  );
};

export default FlyingAxesCaseStudy;
