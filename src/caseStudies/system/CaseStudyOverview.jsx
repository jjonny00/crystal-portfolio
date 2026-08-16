// src/caseStudies/system/CaseStudyOverview.jsx
//
// Narrative + media in the content column, project metadata in a rail.
//
// Desktop: heading over the narrative, rail starting level with the first line
// of body copy. Mobile: the rail moves ahead of the narrative and becomes the
// compact two-column grid from the reference. Same markup, different grid.

import React, { useId } from 'react';
import CaseStudySection from './CaseStudySection';
import CaseStudyBody from './CaseStudyText';
import CaseStudyMetadata from './CaseStudyMetadata';
import { renderMedia } from './CaseStudyMedia';

const CaseStudyOverview = ({
  title,
  body = null,
  media = null,
  metadata = null,
  tone = 'b',
  id = null,
  children = null,
}) => {
  const headingId = useId();

  return (
    <CaseStudySection
      tone={tone}
      id={id}
      className="cs-overview"
      innerClassName="cs-overview__inner"
      aria-labelledby={headingId}
    >
      {title && (
        <h2 className="cs-heading cs-overview__heading" id={headingId}>
          {title}
        </h2>
      )}

      <div className="cs-overview__content">
        <CaseStudyBody content={body} />
        {media && (
          <div className="cs-overview__media">{renderMedia(media)}</div>
        )}
        {children}
      </div>

      <CaseStudyMetadata metadata={metadata} className="cs-overview__rail" />
    </CaseStudySection>
  );
};

export default CaseStudyOverview;
