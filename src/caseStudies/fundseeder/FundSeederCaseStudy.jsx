// src/caseStudies/fundseeder/FundSeederCaseStudy.jsx
//
// FundSeeder, composed entirely from the reusable case-study system. This file
// is the whole page: which sections run, in what order, in which tone, and what
// goes in each section's media slot. Everything else is content in
// fundseederContent.js.
//
// Six sections, the finishing pass (November 2026). Tone marks a chapter
// change rather than alternating: the hero and the turn into the competition
// itself (tiers and nearby rivals) paint no background, so the crystal shows
// through them; everything else sits on colour B.
//
// Two things follow from the sections that paint no background, and both are
// load-bearing:
//   - the registry entry must stay `reveal`, or the colour wash would paint
//     over the very thing these sections are showing;
//   - the overlay keeps the renderer awake whenever one of them is near the
//     viewport, so scrolling back never lands on a frozen, empty frame.

import React from 'react';
import {
  CaseStudyPage,
  CaseStudyHero,
  CaseStudyOverview,
  SplitSection,
  FeatureSection,
  ConclusionSection,
} from '../system';
import RankingFlow from './RankingFlow';
import NextStepComposition from './NextStepComposition';
import PinnedTable from './PinnedTable';
import StackedMedia from './StackedMedia';
import { fundseederContent } from './fundseederContent';

const FundSeederCaseStudy = ({ project, onClose }) => {
  const c = fundseederContent;

  return (
    <CaseStudyPage
      colors={project?.caseStudyColors}
      label={`${c.projectName} case study: ${c.title}`}
      onClose={onClose}
    >
      {/* The before/after sentence stays in the intro for skimmers; the
          additional responsibilities are in the role rail. */}
      <CaseStudyHero
        tone="a"
        background="none"
        projectName={c.projectName}
        title={c.title}
        intro={c.hero.intro}
        media={c.hero.media}
        metadata={c.hero.metadata}
      />

      {/* What one added strategy sets off, drawn live. */}
      <CaseStudyOverview
        tone="b"
        title={c.overview.title}
        body={c.overview.body}
        media={<RankingFlow {...c.overview.flow} />}
      />

      {/* The tier ladder above the closest competition: two scales of the same
          idea, on the crystal. */}
      <FeatureSection
        tone="a"
        background="none"
        align="start"
        title={c.nextStep.title}
        intro={c.nextStep.intro}
      >
        <NextStepComposition ladder={c.nextStep.ladder} rivals={c.nextStep.rivals} />
      </FeatureSection>

      {/* The pinned row beside the copy about it. */}
      <SplitSection
        tone="b"
        direction="text-left"
        title={c.compare.title}
        body={c.compare.body}
        media={<PinnedTable {...c.compare.pinned} />}
      />

      {/* Signal's details, stacked and expandable. */}
      <FeatureSection tone="b" align="start" title={c.signal.title} intro={c.signal.intro}>
        <StackedMedia items={c.signal.media} />
      </FeatureSection>

      {/* Counts, so set as figures: 17 leads, 1,027 is its context, and the date
          is said once for the pair. */}
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
