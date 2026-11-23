// src/caseStudies/mesa/MesaCaseStudy.jsx
//
// Mesa, composed entirely from the reusable case-study system. This file is the
// whole page: which sections run, in what order, in which tone, and which
// custom visual (if any) goes in a section's content slot. Everything else is
// content in mesaContent.js.
//
// Six sections, the finishing pass (November 2026). Tone rhythm: every section sits on colour B except two
// that paint no background, so the crystal shows through — the hero, and the
// board's progression, the chapter where the game's structure is the subject.

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
import CaseStudyMedia from '../system/CaseStudyMedia';
import TightOpenTightStages from './TightOpenTightStages';
import { mesaContent } from './mesaContent';

const MesaCaseStudy = ({ project, onClose }) => {
  const c = mesaContent;

  return (
    <CaseStudyPage
      colors={project?.caseStudyColors}
      label={`${c.projectName} case study: ${c.title}`}
      onClose={onClose}
    >
      {/* No background of its own — the hero sits on the crystal facet,
          which is already this project's colour. Keeps the registry's entry:
          'reveal' honest: nothing covers the scene until the reader scrolls
          past it. */}
      <CaseStudyHero
        tone="a"
        background="none"
        projectName={c.projectName}
        title={c.title}
        intro={c.hero.intro}
        media={c.hero.media}
        metadata={c.hero.metadata}
      />

      <CaseStudyOverview
        tone="b"
        title={c.overview.title}
        body={c.overview.body}
        media={
          <MediaGallery
            layout="3-up"
            items={c.overview.gallery}
            caption={c.overview.caption}
            fit="cover"
          />
        }
      />

      {/* The five screens of one turn, read left to right. Phone
          screenshots are tall, so a rail at a shared height carries them where
          a stage spanning the width could only hold one: on desktop the five
          fit across, and on a phone the row becomes the swipe it already was. */}
      <SequenceSection
        tone="b"
        title={c.turnSequence.title}
        intro={c.turnSequence.intro}
        caption={c.turnSequence.caption}
      >
        <MediaRail items={c.turnSequence.steps} mobileHeight="126vw" />
      </SequenceSection>

      {/* Like the hero, this sits on the crystal facet rather than painting
          over it. Two things follow, both already true for Mesa: the registry
          entry must be 'reveal', and the overlay keeps the renderer awake
          whenever a section like this is near the viewport. */}
      <FeatureSection
        tone="a"
        background="none"
        align="start"
        title={c.board.title}
        intro={c.board.intro}
        caption={c.board.caption}
      >
        <TightOpenTightStages stages={c.board.stages} />
      </FeatureSection>

      {/* Steal's row of the power key, beside the copy, at about its own
          size (mesa.css): a small crop, not a stage. */}
      <SplitSection
        tone="b"
        direction="text-left"
        title={c.powers.title}
        body={c.powers.body}
        media={
          <CaseStudyMedia className="mesa-steal" {...c.powers.media} />
        }
      />

      {/* The ending carries the returning-player point; no outcome tiles (the
          launch figures are in the hero). */}
      <ConclusionSection
        tone="b"
        lessonsTitle={c.conclusion.lessonsTitle}
        lessons={c.conclusion.lessons}
      />
    </CaseStudyPage>
  );
};

export default MesaCaseStudy;
