// src/caseStudies/ge-experience-centers/GeExperienceCentersCaseStudy.jsx
//
// GE Experience Centers, composed from the reusable case-study system. This
// file is the whole page: which sections run, in what order, in which tone,
// and which custom visual (if any) goes in a section's media slot. Everything
// else is content in geExperienceCentersContent.js.
//
// Tone rhythm, as in Mesa and Flying Axes: every section sits on colour B
// except two that paint no background at all, so the crystal shows through —
// the hero, and the turn in the story where the Experience Selector lets a
// space change its purpose. Both follow from that: the registry entry must
// stay 'reveal', and the overlay keeps the renderer awake whenever either is
// near the viewport.

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
import ExperienceSelectorStage from './ExperienceSelectorStage';
import ApproachDiagram from './ApproachDiagram';
import { geExperienceCentersContent } from './geExperienceCentersContent';
import './geExperienceCenters.css';

const GeExperienceCentersCaseStudy = ({ project, onClose }) => {
  const c = geExperienceCentersContent;

  // The wall photo, then each diagram state as an item of its own, so a phone
  // (one item at a time) never shows half an explanation.
  const approachItems = [
    c.approach.wall,
    ...c.approach.states.map(({ key, ...state }) => ({
      key,
      autoHeight: true,
      children: <ApproachDiagram {...state} />,
    })),
  ];

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

      {/* A welcome and a working session, side by side: the two things the
          centers had to hold in one visit. */}
      <CaseStudyOverview
        tone="b"
        title={c.overview.title}
        body={c.overview.body}
        metadata={c.overview.metadata}
        media={
          <MediaGallery layout="2-up" items={c.overview.gallery} caption={c.overview.caption} />
        }
      />

      {/* The selector leads, with one area's display in two of its experiences
          beside it. The keycard paragraph closes the section beneath the stage. */}
      <FeatureSection
        tone="a"
        background="none"
        align="start"
        title={c.conversation.title}
        intro={c.conversation.intro}
        caption={c.conversation.caption}
        takeaway={c.conversation.closing}
      >
        <ExperienceSelectorStage selector={c.conversation.selector} states={c.conversation.states} />
      </FeatureSection>

      {/* The Dubai wall, then the interaction drawn as two states. Row heights
          are set here rather than left to the stylesheet because the diagrams
          size themselves from them (see geExperienceCenters.css). On phones
          the 4:3 photo comes in under the screen width, so the first diagram
          peeks past the edge. */}
      <SequenceSection
        tone="b"
        title={c.approach.title}
        intro={c.approach.intro}
        caption={
          <>
            {c.approach.caption}
            <span className="gec-note">{c.approach.note}</span>
          </>
        }
        takeaway={c.approach.closing}
      >
        <MediaRail items={approachItems} height="clamp(300px, 24vw, 440px)" mobileHeight="68vw" />
      </SequenceSection>

      <SplitSection
        tone="b"
        direction="text-right"
        title={c.expansion.title}
        body={c.expansion.body}
        media={c.expansion.media}
      />

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

export default GeExperienceCentersCaseStudy;
