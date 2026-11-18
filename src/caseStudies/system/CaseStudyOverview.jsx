// src/caseStudies/system/CaseStudyOverview.jsx
//
// Narrative + media in the content column. The project's metadata lives in the
// hero (CaseStudyHero's `metadata`), not here.

import React, { useId } from 'react';
import CaseStudySection from './CaseStudySection';
import CaseStudyBody from './CaseStudyText';
import { renderMedia } from './CaseStudyMedia';

const CaseStudyOverview = ({
  title,
  body = null,
  media = null,
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
        <h2 className="type-headline-sm cs-heading cs-overview__heading" id={headingId}>
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
    </CaseStudySection>
  );
};

export default CaseStudyOverview;
