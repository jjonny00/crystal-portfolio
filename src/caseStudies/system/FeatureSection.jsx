// src/caseStudies/system/FeatureSection.jsx
//
// Full-width visual centrepiece: centred title, short intro, an unrestricted
// content slot, caption, and an optional takeaway.
//
//   <FeatureSection title="Tight, Open, Tight" intro={…} caption={…} takeaway={…}>
//     <TightOpenTightDiagram />
//   </FeatureSection>
//
// The stage is intentionally a blank canvas: its height comes from whatever it
// contains, never from the viewport, and the feature owns its own responsive
// behaviour.

import React, { useId } from 'react';
import CaseStudySection from './CaseStudySection';
import CaseStudyBody from './CaseStudyText';
import CaseStudyMedia, { renderMedia } from './CaseStudyMedia';

const FeatureSection = ({
  title,
  intro = null,
  media = null,
  caption = null,
  takeaway = null,
  tone = 'a',
  /** 'none' paints no background, so the 3D scene shows through. See CaseStudySection. */
  background = 'tone',
  /**
   * 'center' matches the reference design. 'start' left-aligns the copy and
   * pulls the stage onto the same gutter, so every left edge in the section
   * agrees and the space either side of the stage is equal.
   */
  align = 'center',
  id = null,
  children = null,
}) => {
  const headingId = useId();

  return (
    <CaseStudySection
      tone={tone}
      background={background}
      id={id}
      className="cs-feature"
      innerClassName="cs-feature__inner"
      aria-labelledby={headingId}
      data-align={align === 'start' ? 'start' : undefined}
    >
      {title && (
        <h2 className="cs-heading cs-feature__heading" id={headingId}>
          {title}
        </h2>
      )}

      {intro && <CaseStudyBody content={intro} className="cs-feature__intro" />}

      {(children || media) && (
        <div className="cs-feature__stage">
          {children ? (
            <CaseStudyMedia autoHeight caption={caption}>
              {children}
            </CaseStudyMedia>
          ) : (
            renderMedia(media, { caption })
          )}
        </div>
      )}

      {takeaway && <CaseStudyBody content={takeaway} className="cs-feature__takeaway" />}
    </CaseStudySection>
  );
};

export default FeatureSection;
