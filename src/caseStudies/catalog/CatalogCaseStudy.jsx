// src/caseStudies/catalog/CatalogCaseStudy.jsx
//
// A catalogue of every section component and every variation, filled with dummy
// copy at a realistic length. Not linked from the site — it is opened from the
// hidden dev menu (the button under Hide UI in App.jsx) and exists to make
// choosing a layout for a new case study a matter of looking rather than
// guessing.
//
// Section titles are the component names on purpose, so the vocabulary here and
// the vocabulary in a real case study are the same.
//
// Keep this current: adding a section component or a variation to the system
// means adding it here too, or the catalogue quietly starts lying.

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
  MediaRail,
} from '../system';
import { catalogContent } from './catalogContent';

const CatalogCaseStudy = ({ project, onClose }) => {
  const c = catalogContent;

  return (
    <CaseStudyPage
      colors={project?.caseStudyColors}
      label={`${c.projectName}: ${c.title}`}
      backLabel="Close catalog"
      onClose={onClose}
    >
      {/* --- CaseStudyHero ------------------------------------------------ */}
      <CaseStudyHero
        tone="a"
        projectName={c.projectName}
        title={c.title}
        intro={c.hero.intro}
        media={c.hero.media}
      />

      {/* --- CaseStudyOverview -------------------------------------------- */}
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
          />
        }
      />

      {/* --- SplitSection, both directions -------------------------------- */}
      <SplitSection
        tone="b"
        direction="text-left"
        title={c.splitLeft.title}
        body={c.splitLeft.body}
        media={{ ...c.splitLeft.media, caption: c.splitLeft.caption }}
      />

      <SplitSection
        tone="a"
        direction="text-right"
        title={c.splitRight.title}
        body={c.splitRight.body}
        media={{ ...c.splitRight.media, caption: c.splitRight.caption }}
      />

      {/* --- SequenceSection, media slot ---------------------------------- */}
      <SequenceSection
        tone="b"
        title={c.sequenceMedia.title}
        intro={c.sequenceMedia.intro}
        media={c.sequenceMedia.media}
        caption={c.sequenceMedia.caption}
      />

      {/* --- MediaRail, in a SequenceSection stage ------------------------ */}
      <SequenceSection
        tone="b"
        title={c.sequenceRail.title}
        intro={c.sequenceRail.intro}
        takeaway={c.sequenceRail.takeaway}
      >
        <MediaRail
          items={c.sequenceRail.rail}
          caption={c.sequenceRail.caption}
          mobileHeight="126vw"
        />
      </SequenceSection>

      {/* --- FeatureSection, centred (the reference default) -------------- */}
      <FeatureSection
        tone="a"
        title={c.featureCentered.title}
        intro={c.featureCentered.intro}
        media={c.featureCentered.media}
        caption={c.featureCentered.caption}
        takeaway={c.featureCentered.takeaway}
      />

      {/* --- FeatureSection, left-aligned, hosting a 2-up ----------------- */}
      <FeatureSection
        tone="b"
        align="start"
        title={c.featureStart.title}
        intro={c.featureStart.intro}
      >
        <MediaGallery
          layout="2-up"
          items={c.featureStart.gallery}
          caption={c.featureStart.caption}
        />
      </FeatureSection>

      {/* --- FeaturedGallery ---------------------------------------------- */}
      <SequenceSection tone="a" title={c.featured.title} intro={c.featured.intro}>
        <FeaturedGallery
          featured={c.featured.featured}
          items={c.featured.items}
          columns={3}
          caption={c.featured.caption}
        />
      </SequenceSection>

      {/* --- MediaGallery, remaining layouts ------------------------------ */}
      <SequenceSection tone="b" title={c.galleries.title} intro={c.galleries.intro}>
        <MediaGallery layout="3-up" items={c.galleries.threeUp} />
        <MediaGallery
          layout="stacked"
          items={c.galleries.stacked}
          caption={c.galleries.caption}
        />
      </SequenceSection>

      {/* --- CaseStudyMedia, the ratios ----------------------------------- */}
      <SequenceSection
        tone="b"
        title={c.mediaPrimitive.title}
        intro={c.mediaPrimitive.intro}
      >
        <MediaRail
          items={c.mediaPrimitive.ratios}
          caption={c.mediaPrimitive.caption}
          mobileHeight="90vw"
        />
      </SequenceSection>

      {/* --- ConclusionSection -------------------------------------------- */}
      <ConclusionSection
        tone="b"
        outcomes={c.conclusion.outcomes}
        lessons={c.conclusion.lessons}
        takeaway={c.conclusion.takeaway}
      />
    </CaseStudyPage>
  );
};

export default CatalogCaseStudy;
