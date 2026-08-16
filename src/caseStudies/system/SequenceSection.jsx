// src/caseStudies/system/SequenceSection.jsx
//
// For flows, processes, gameplay sequences, and interaction steps.
//
// The component knows nothing about how a sequence is drawn: the stage takes
// arbitrary children (SVG, a React diagram, an image, video, an animation, a
// custom interaction) and the child owns its own internal responsive
// behaviour. Supply `media` instead of children to fall back to the standard
// image/placeholder treatment.

import React, { useId } from 'react';
import CaseStudySection from './CaseStudySection';
import CaseStudyBody from './CaseStudyText';
import CaseStudyMedia, { renderMedia } from './CaseStudyMedia';

const SequenceSection = ({
  title,
  intro = null,
  media = null,
  caption = null,
  takeaway = null,
  tone = 'b',
  id = null,
  children = null,
}) => {
  const headingId = useId();

  return (
    <CaseStudySection
      tone={tone}
      id={id}
      className="cs-sequence"
      innerClassName="cs-sequence__inner"
      aria-labelledby={headingId}
    >
      {title && (
        <h2 className="cs-heading cs-sequence__heading" id={headingId}>
          {title}
        </h2>
      )}

      {intro && <CaseStudyBody content={intro} className="cs-sequence__intro" />}

      {(children || media) && (
        <div className="cs-sequence__stage">
          {children ? (
            <CaseStudyMedia autoHeight caption={caption}>
              {children}
            </CaseStudyMedia>
          ) : (
            renderMedia(media, { caption })
          )}
        </div>
      )}

      {takeaway && <CaseStudyBody content={takeaway} className="cs-sequence__takeaway" />}
    </CaseStudySection>
  );
};

export default SequenceSection;
