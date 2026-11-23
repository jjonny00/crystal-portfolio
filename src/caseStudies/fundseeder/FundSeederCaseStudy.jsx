// src/caseStudies/fundseeder/FundSeederCaseStudy.jsx
//
// FundSeeder, composed entirely from the reusable case-study system. This file
// is the whole page: which sections run, in what order, in which tone, and what
// goes in each section's media slot. Everything else is content in
// fundseederContent.js.
//
// Nine sections (globe media pass, November 2026). The hero and the tiers
// paint no background, so the crystal shows through them, as on every case
// study; the rest sit on colour B. Those two are load-bearing: the registry
// entry must stay `reveal`, and the overlay keeps the renderer awake whenever
// one is near the viewport.

import React from 'react';
import {
  CaseStudyPage,
  CaseStudyHero,
  CaseStudyOverview,
  SplitSection,
  SequenceSection,
  FeatureSection,
  ConclusionSection,
  MediaRail,
} from '../system';
import StrategyPaths from './StrategyPaths';
import TierLadder from './TierLadder';
import { fundseederContent } from './fundseederContent';

const FundSeederCaseStudy = ({ project, onClose }) => {
  const c = fundseederContent;

  return (
    <CaseStudyPage
      colors={project?.caseStudyColors}
      label={`${c.projectName} case study: ${c.title}`}
      onClose={onClose}
    >
      {/* The "Since your last visit" loop, bleeding off the right at desktop,
          full width above the copy on phones; the sample-data line under it. */}
      <CaseStudyHero
        tone="a"
        background="none"
        projectName={c.projectName}
        title={c.title}
        intro={c.hero.intro}
        media={c.hero.media}
        metadata={c.hero.metadata}
      />

      {/* What one added strategy sets off: split, one link across, merge at S. */}
      <CaseStudyOverview
        tone="b"
        title={c.overview.title}
        body={c.overview.body}
        media={<StrategyPaths {...c.overview.paths} />}
      />

      <SplitSection
        tone="b"
        direction="text-left"
        title={c.rivals.title}
        body={c.rivals.body}
        media={c.rivals.media}
      />

      {/* The tiers on mint, the crystal behind them. */}
      <FeatureSection
        tone="a"
        background="none"
        align="center"
        title={c.tiers.title}
        intro={c.tiers.intro}
      >
        <TierLadder {...c.tiers.ladder} />
      </FeatureSection>

      <FeatureSection
        tone="b"
        align="center"
        title={c.seeded.title}
        intro={c.seeded.intro}
        media={c.seeded.media}
        caption={c.seeded.media.caption}
        takeaway={c.seeded.takeaway}
      />

      <SplitSection
        tone="b"
        direction="text-right"
        title={c.countries.title}
        body={c.countries.body}
        media={c.countries.media}
      />

      {/* The pinned row in the wide stage, so the table text stays readable. */}
      <SequenceSection
        tone="b"
        title={c.compare.title}
        intro={c.compare.body}
        media={c.compare.pinned}
        caption={c.compare.pinned.caption}
      />

      {/* Signal's two details at one shared height, so mixed ratios stay level:
          the pairwise table at its own height, the connection strip beside it. */}
      <FeatureSection tone="b" align="start" title={c.signal.title} intro={c.signal.intro}>
        <MediaRail items={c.signal.media} height="275px" mobileHeight="220px" />
      </FeatureSection>

      {/* Counts, so set as figures: 0 → 20 seeded leads, $256M is secondary,
          and the date is said once for the pair. */}
      <ConclusionSection
        tone="b"
        outcomeTitle="Outcomes"
        outcomeStyle="figure"
        outcomes={c.conclusion.outcomes}
        outcomeNote={c.conclusion.outcomeNote}
        lessonsTitle={c.conclusion.lessonsTitle}
        lessons={c.conclusion.lessons}
      />
    </CaseStudyPage>
  );
};

export default FundSeederCaseStudy;
