// src/caseStudies/system/SplitSection.jsx
//
//   <SplitSection direction="text-left" … />   text column left, media bleeds right
//   <SplitSection direction="text-right" … />  media bleeds left, text column right
//
// One component, two directional variants — the grid areas swap, the markup
// does not. On mobile both variants collapse to the reading order the reference
// uses: title, body, media, caption.

import React, { useId } from 'react';
import CaseStudySection from './CaseStudySection';
import CaseStudyBody from './CaseStudyText';
import { renderMedia } from './CaseStudyMedia';

export const SPLIT_DIRECTIONS = ['text-left', 'text-right'];

const SplitSection = ({
  title,
  direction = 'text-left',
  media = null,
  tone = 'b',
  body = null,
  id = null,
  children = null,
}) => {
  const headingId = useId();
  const usableDirection = SPLIT_DIRECTIONS.includes(direction) ? direction : 'text-left';

  return (
    <CaseStudySection
      tone={tone}
      id={id}
      className="cs-split"
      innerClassName="cs-split__inner"
      aria-labelledby={headingId}
      data-direction={usableDirection}
    >
      {title && (
        <h2 className="cs-heading cs-split__heading" id={headingId}>
          {title}
        </h2>
      )}

      <div className="cs-split__body">
        <CaseStudyBody content={body} />
        {children}
      </div>

      {media && <div className="cs-split__media">{renderMedia(media)}</div>}
    </CaseStudySection>
  );
};

export default SplitSection;
