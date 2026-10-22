// src/caseStudies/forest-giant/ForestGiantCaseStudy.jsx
//
// Forest Giant, composed from the reusable case-study system. This file is the
// whole page: which sections run, in what order, in which tone, and which
// arrangement goes in a section's media slot. Everything else is content in
// forestGiantContent.js.
//
// Tone rhythm, as in Mesa, Flying Axes and GE: every section sits on colour B
// except two that paint no background at all, so the crystal shows through —
// the hero, and the turn in the story where the leadership team builds the
// practice together. Both follow from that: the registry entry must stay
// 'reveal', and the overlay keeps the renderer awake whenever either is near
// the viewport.

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
import { forestGiantContent } from './forestGiantContent';

const ForestGiantCaseStudy = ({ project, onClose }) => {
  const c = forestGiantContent;

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

      {/* Three projects across the studio's range, beneath the narrative. */}
      <CaseStudyOverview
        tone="b"
        title={c.overview.title}
        body={c.overview.body}
        metadata={c.overview.metadata}
        media={<MediaGallery layout="3-up" items={c.overview.gallery} />}
      />

      <SplitSection
        tone="b"
        direction="text-left"
        title={c.responsibility.title}
        body={c.responsibility.body}
        media={c.responsibility.media}
      />

      {/* The guide itself, beside how it was made. The paragraph on what the
          guide gave project leads closes the section beneath the stage. */}
      <FeatureSection
        tone="a"
        background="none"
        align="start"
        title={c.practice.title}
        intro={c.practice.intro}
        takeaway={c.practice.closing}
      >
        <MediaGallery layout="2-up" items={c.practice.gallery} caption={c.practice.caption} />
      </FeatureSection>

      {/* A worksheet over a session of the same kind: the guidance, then it in use. */}
      <SplitSection
        tone="b"
        direction="text-right"
        title={c.means.title}
        body={c.means.body}
        media={<MediaGallery layout="stacked" items={c.means.gallery} caption={c.means.caption} />}
      />

      {/* The work and the studio life the practice made room for. */}
      <SequenceSection tone="b" title={c.possible.title} intro={c.possible.intro}>
        <MediaRail items={c.possible.rail} caption={c.possible.caption} mobileHeight="68vw" />
      </SequenceSection>

      {/* No visual: the reflection closes the study. */}
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

export default ForestGiantCaseStudy;
