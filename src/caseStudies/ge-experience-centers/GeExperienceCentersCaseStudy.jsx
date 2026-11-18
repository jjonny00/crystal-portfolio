// src/caseStudies/ge-experience-centers/GeExperienceCentersCaseStudy.jsx
//
// GE Experience Centers, composed from the reusable case-study system. This
// file is the whole page: which sections run, in what order, in which tone,
// and which custom visual (if any) goes in a section's media slot. Everything
// else is content in geExperienceCentersContent.js.
//
// Four sections, the finishing pass (November 2026): the hero, then straight
// to proximity, host control, and the regional platform story as the ending.
//
// Tone marks a chapter change rather than alternating: every section sits on
// colour B except two that paint no background, so the crystal shows through —
// the hero, and host control, where the space itself changes purpose. Both
// follow from that: the registry entry must stay 'reveal', and the overlay
// keeps the renderer awake whenever either is near the viewport.

import React from 'react';
import {
  CaseStudyPage,
  CaseStudyHero,
  SequenceSection,
  FeatureSection,
  ConclusionSection,
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
      onClose={onClose}
    >
      <CaseStudyHero
        tone="a"
        background="none"
        projectName={c.projectName}
        title={c.title}
        intro={c.hero.intro}
        media={c.hero.media}
        metadata={c.hero.metadata}
      />

      {/* The Dubai wall with its expanded block marked, then the interaction
          drawn as two states, under one caption. Row heights are set here
          rather than left to the stylesheet because the diagrams size
          themselves from them (see geExperienceCenters.css). */}
      <SequenceSection
        tone="b"
        title={c.approach.title}
        intro={c.approach.intro}
        caption={c.approach.caption}
      >
        <MediaRail items={approachItems} height="clamp(300px, 24vw, 440px)" mobileHeight="68vw" />
      </SequenceSection>

      {/* The selector leads, with one area's display in two of its
          experiences beside it. */}
      <FeatureSection
        tone="a"
        background="none"
        align="start"
        title={c.hosts.title}
        intro={c.hosts.intro}
        caption={c.hosts.caption}
      >
        <ExperienceSelectorStage selector={c.hosts.selector} states={c.hosts.states} />
      </FeatureSection>

      {/* The ending: one platform, three centers, and what the hosts did with
          it. */}
      <ConclusionSection
        tone="b"
        lessonsTitle={c.conclusion.lessonsTitle}
        lessons={c.conclusion.lessons}
      />
    </CaseStudyPage>
  );
};

export default GeExperienceCentersCaseStudy;
