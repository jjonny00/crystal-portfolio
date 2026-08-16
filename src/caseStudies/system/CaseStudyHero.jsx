// src/caseStudies/system/CaseStudyHero.jsx
//
// Opening section: project name, case study title, intro copy, hero media.
//
// Desktop places the project name across the full width, the copy in a narrow
// left column, and the media bleeding off the right edge. Mobile is a different
// composition, not a shrunk grid: project name, case study title, media, copy.
// Both come out of the same markup — only the grid areas change.

import React, { useId } from 'react';
import CaseStudySection from './CaseStudySection';
import CaseStudyBody from './CaseStudyText';
import { renderMedia } from './CaseStudyMedia';

const CaseStudyHero = ({
  projectName,
  title,
  intro = null,
  media = null,
  tone = 'a',
  id = 'case-study-hero',
  children = null,
}) => {
  const headingId = useId();

  return (
    <CaseStudySection
      tone={tone}
      id={id}
      className="cs-hero"
      innerClassName="cs-hero__inner"
      aria-labelledby={headingId}
    >
      <h1 className="cs-title cs-hero__title" id={headingId}>
        {projectName}
      </h1>

      {title && <h2 className="cs-subtitle cs-hero__subtitle">{title}</h2>}

      <div className="cs-hero__text">
        <CaseStudyBody content={intro} />
        {children}
      </div>

      {media && (
        <div className="cs-hero__media">
          {renderMedia(media, { priority: true, fit: 'cover' })}
        </div>
      )}
    </CaseStudySection>
  );
};

export default CaseStudyHero;
