// src/caseStudies/mesa/MesaCaseStudy.jsx
//
// Mesa, composed entirely from the reusable case-study system. This file is the
// whole page: which sections run, in what order, in which tone, and which
// custom visual (if any) goes in a section's content slot. Everything else is
// content in mesaContent.js.

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
} from '../system';
import TightOpenTightPlaceholder from './TightOpenTightPlaceholder';
import { mesaContent } from './mesaContent';

const MesaCaseStudy = ({ project, onClose }) => {
  const c = mesaContent;

  return (
    <CaseStudyPage
      colors={project?.caseStudyColors}
      label={`${c.projectName} case study: ${c.title}`}
      backLabel={`Back to ${project?.label || c.projectName}`}
      onClose={onClose}
    >
      <CaseStudyHero
        tone="a"
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
        media={
          <MediaGallery
            layout="3-up"
            items={c.overview.gallery}
            caption={c.overview.caption}
            fit="cover"
          />
        }
      />

      <SequenceSection
        tone="b"
        title={c.turnSequence.title}
        intro={c.turnSequence.intro}
        media={c.turnSequence.media}
        caption={c.turnSequence.caption}
      />

      <SplitSection
        tone="b"
        direction="text-left"
        title={c.boardTeaches.title}
        body={c.boardTeaches.body}
        media={{ ...c.boardTeaches.media, caption: c.boardTeaches.caption }}
      />

      <FeatureSection
        tone="a"
        title={c.tightOpenTight.title}
        intro={c.tightOpenTight.intro}
        caption={c.tightOpenTight.caption}
        takeaway={c.tightOpenTight.takeaway}
      >
        <TightOpenTightPlaceholder />
      </FeatureSection>

      <SplitSection
        tone="b"
        direction="text-right"
        title={c.costOfPower.title}
        body={c.costOfPower.body}
        media={{ ...c.costOfPower.media, caption: c.costOfPower.caption }}
      />

      <SequenceSection
        tone="b"
        title={c.asynchronous.title}
        intro={c.asynchronous.intro}
        media={c.asynchronous.media}
        caption={c.asynchronous.caption}
      />

      <ConclusionSection
        tone="b"
        outcomes={c.conclusion.outcomes}
        lessons={c.conclusion.lessons}
        takeaway={c.conclusion.takeaway}
      />
    </CaseStudyPage>
  );
};

export default MesaCaseStudy;
