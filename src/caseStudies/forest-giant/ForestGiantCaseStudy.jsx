// src/caseStudies/forest-giant/ForestGiantCaseStudy.jsx
//
// Forest Giant, composed from the reusable case-study system. This file is the
// whole page: which sections run, in what order, in which tone, and which
// arrangement goes in a section's media slot. Everything else is content in
// forestGiantContent.js.
//
// Five sections, the finishing pass (November 2026): the studio's history and
// work in the opening, the tacit-knowledge problem, the critique method, the
// project-prep guide, and the reflection. Tone marks a chapter change rather
// than alternating: every section sits on colour B except two that paint no
// background, so the crystal shows through — the hero, and the guide. Both
// follow from that: the registry entry must stay 'reveal', and the overlay
// keeps the renderer awake whenever either is near the viewport.

import React from 'react';
import {
  CaseStudyPage,
  CaseStudyHero,
  SplitSection,
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
      onClose={onClose}
    >
      {/* The studio's history is in the intro; three named examples of its
          work run as a compact, captioned 3-up across the foot. */}
      <CaseStudyHero
        tone="a"
        background="none"
        projectName={c.projectName}
        title={c.title}
        intro={c.hero.intro}
        media={c.hero.media}
        metadata={c.hero.metadata}
        after={<MediaGallery layout="3-up" items={c.hero.gallery} fit="cover" />}
      />

      <SplitSection
        tone="b"
        direction="text-left"
        title={c.explicit.title}
        body={c.explicit.body}
        media={c.explicit.media}
      />

      <SplitSection
        tone="b"
        direction="text-right"
        title={c.critique.title}
        body={c.critique.body}
        media={c.critique.media}
      />

      {/* Four whole pages of the guide as a strip, swiped on a phone and read
          full size in the viewer. */}
      <FeatureSection
        tone="a"
        background="none"
        align="start"
        title={c.practice.title}
        intro={c.practice.intro}
        caption={c.practice.caption}
      >
        <MediaRail items={c.practice.pages} />
      </FeatureSection>

      <ConclusionSection
        tone="b"
        lessonsTitle={c.conclusion.lessonsTitle}
        lessons={c.conclusion.lessons}
      />
    </CaseStudyPage>
  );
};

export default ForestGiantCaseStudy;
