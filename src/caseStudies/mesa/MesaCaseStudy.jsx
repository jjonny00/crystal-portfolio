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
  FeaturedGallery,
} from '../system';
import TightOpenTightStages from './TightOpenTightStages';
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
      {/* No background of its own — the hero sits on the crystal facet, which is
          already this project's colour. Keeps the registry's entry: 'reveal'
          honest: nothing covers the scene until the reader scrolls past it. */}
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

      {/* Like the hero, this one sits on the crystal facet rather than painting
          over it — the arc of the match, read against the project's own colour.
          Two things follow, both already true for Mesa: the registry entry must
          be 'reveal' (or the root backstop would paint over the scene), and the
          overlay keeps the renderer awake whenever a section like this is near
          the viewport, so it never scrolls back onto a frozen, empty frame. */}
      <FeatureSection
        tone="a"
        background="none"
        align="start"
        title={c.tightOpenTight.title}
        intro={c.tightOpenTight.intro}
        caption={c.tightOpenTight.caption}
        takeaway={c.tightOpenTight.takeaway}
      >
        <TightOpenTightStages stages={c.tightOpenTight.stages} />
      </FeatureSection>

      {/* The power key and the six ability cards are one exhibit: the summary the
          player reads mid-match, and the detail that sits behind it. FeaturedGallery
          holds that relationship; the section only supplies the stage. */}
      <FeatureSection
        tone="b"
        align="start"
        title={c.costOfPower.title}
        intro={c.costOfPower.intro}
        caption={c.costOfPower.caption}
      >
        <FeaturedGallery
          featured={c.costOfPower.key}
          items={c.costOfPower.powers}
          columns={3}
        />
      </FeatureSection>

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
