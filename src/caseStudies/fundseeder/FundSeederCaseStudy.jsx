// src/caseStudies/fundseeder/FundSeederCaseStudy.jsx
//
// FundSeeder, composed entirely from the reusable case-study system. This file
// is the whole page: which sections run, in what order, in which tone, and what
// goes in each section's media slot. Everything else is content in
// fundseederContent.js.
//
// Tone rhythm: the three sections that would otherwise sit on colour A paint no
// background at all, so the crystal shows through them — the hero, the tiers,
// and identity. Colour A is the facet behind them, so a section that would have
// been mint is the scene instead, and the dark sections between them read as
// the page closing back over it.
//
// Two things follow from that, and both are load-bearing:
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
  SequenceSection,
  FeatureSection,
  ConclusionSection,
  MediaGallery,
} from '../system';
import { fundseederContent } from './fundseederContent';

const FundSeederCaseStudy = ({ project, onClose }) => {
  const c = fundseederContent;

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

      {/* The public product and the internal one, side by side from the start:
          the caption's claim that they are two sides of one system is easier to
          accept when all three are in view at once. */}
      <CaseStudyOverview
        tone="b"
        title={c.overview.title}
        body={c.overview.body}
        metadata={c.overview.metadata}
        media={
          <MediaGallery layout="3-up" items={c.overview.gallery} caption={c.overview.caption} />
        }
      />

      {/* The tier ladder is the case study's centrepiece, so it gets the centred
          feature treatment and the full width of a stage. */}
      <FeatureSection
        tone="a"
        background="none"
        title={c.tiers.title}
        intro={c.tiers.intro}
        media={c.tiers.media}
        caption={c.tiers.caption}
        takeaway={c.tiers.takeaway}
      />

      {/* Two views of the same ranking — the list and the filters that narrow it
          — so they read as one pair rather than two separate screens. Left
          aligned: the copy is an argument about structure, not a reveal. */}
      <FeatureSection
        tone="b"
        align="start"
        title={c.leaderboard.title}
        intro={c.leaderboard.intro}
      >
        <MediaGallery
          layout="2-up"
          items={c.leaderboard.gallery}
          caption={c.leaderboard.caption}
        />
      </FeatureSection>

      {/* Media bleeds off the left, copy on the right. The three questions are a
          list because the copy introduces them as one set. */}
      <SplitSection
        tone="b"
        direction="text-right"
        title={c.nextRival.title}
        body={[
          ...c.nextRival.body,
          <ul key="questions">
            {c.nextRival.questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>,
        ]}
        takeaway={c.nextRival.takeaway}
        media={
          <MediaGallery
            layout="stacked"
            items={c.nextRival.gallery}
            caption={c.nextRival.caption}
          />
        }
      />

      <SplitSection
        tone="a"
        background="none"
        direction="text-left"
        title={c.identity.title}
        body={c.identity.body}
        media={
          <MediaGallery
            layout="stacked"
            items={c.identity.gallery}
            caption={c.identity.caption}
          />
        }
      />

      {/* Where the ladder leads. A sequence rather than a feature: the diagram is
          a pipeline, and the section's job is to hand the competition over to
          the review process that ends it. */}
      <SequenceSection
        tone="b"
        title={c.destination.title}
        intro={c.destination.intro}
        media={c.destination.media}
        caption={c.destination.caption}
        takeaway={c.destination.takeaway}
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

export default FundSeederCaseStudy;
