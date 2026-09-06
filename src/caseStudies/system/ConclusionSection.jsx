// src/caseStudies/system/ConclusionSection.jsx
//
// Outcomes on the left, reflection on the right; stacked on mobile.
//
// Outcomes are a plain repeating structure — { value, detail } — with no cap on
// how many a case study lists.

import React, { useId } from 'react';
import CaseStudySection from './CaseStudySection';
import CaseStudyBody, { CaseStudyInline } from './CaseStudyText';

const ConclusionSection = ({
  outcomeTitle = 'Outcome',
  outcomes = [],
  lessonsTitle = 'Lessons Learned',
  lessons = null,
  /** Closing statement rendered at full emphasis under the reflection. */
  takeaway = null,
  tone = 'b',
  id = null,
  children = null,
}) => {
  const outcomeHeadingId = useId();
  const lessonsHeadingId = useId();
  const hasOutcomes = Array.isArray(outcomes) && outcomes.length > 0;

  return (
    <CaseStudySection
      tone={tone}
      id={id}
      className="cs-conclusion"
      innerClassName="cs-conclusion__inner"
      aria-labelledby={hasOutcomes ? outcomeHeadingId : lessonsHeadingId}
    >
      <div className="cs-conclusion__outcomes">
        {hasOutcomes && (
          <>
            <h2 className="cs-heading cs-conclusion__heading" id={outcomeHeadingId}>
              {outcomeTitle}
            </h2>
            <dl className="cs-outcomes">
              {outcomes.map((outcome, index) => (
                <div key={outcome.key || `${outcome.value}-${index}`}>
                  <dt className="cs-outcome__value">
                    <CaseStudyInline text={outcome.value} keyPrefix={`outcome-${index}`} />
                  </dt>
                  {outcome.detail && (
                    <dd className="cs-outcome__detail">
                      <CaseStudyInline
                        text={outcome.detail}
                        keyPrefix={`outcome-detail-${index}`}
                      />
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </>
        )}
      </div>

      <div className="cs-conclusion__lessons">
        {lessonsTitle && (
          <h2 className="cs-heading cs-conclusion__heading" id={lessonsHeadingId}>
            {lessonsTitle}
          </h2>
        )}
        <CaseStudyBody content={lessons} />
        {takeaway && (
          <p className="cs-conclusion__takeaway">
            <CaseStudyInline text={takeaway} keyPrefix="conclusion-takeaway" />
          </p>
        )}
        {children}
      </div>
    </CaseStudySection>
  );
};

export default ConclusionSection;
