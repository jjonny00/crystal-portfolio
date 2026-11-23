// src/caseStudies/system/ConclusionSection.jsx
//
// Outcomes on the left, reflection on the right; stacked on mobile.
//
// Outcomes are a plain repeating structure — { value, detail } — with no cap on
// how many a case study lists. `outcomeStyle="figure"` sets each value as a
// large numeral on its own line with its unit beneath, for outcomes that are
// counts; `outcomeNote` is one line under the set (a reporting date, said once
// for all of them). An outcome's `from` shows a before and after as one figure
// ("0 → 20"); `secondary` sets it smaller, under the headline. With no outcomes, the reflection runs alone at the body
// copy's measure rather than leaving the outcomes column empty.

import React, { useId } from 'react';
import CaseStudySection from './CaseStudySection';
import CaseStudyBody, { CaseStudyInline } from './CaseStudyText';

const ConclusionSection = ({
  outcomeTitle = 'Outcome',
  outcomes = [],
  /** 'text' (default) or 'figure': large numerals, the unit underneath. */
  outcomeStyle = 'text',
  /** One line under the outcomes, e.g. the date the figures are as of. */
  outcomeNote = null,
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
  const figure = outcomeStyle === 'figure';

  return (
    <CaseStudySection
      tone={tone}
      id={id}
      className={hasOutcomes ? 'cs-conclusion' : 'cs-conclusion cs-conclusion--lessons-only'}
      innerClassName="cs-conclusion__inner"
      aria-labelledby={hasOutcomes ? outcomeHeadingId : lessonsHeadingId}
    >
      {hasOutcomes && (
        <div className="cs-conclusion__outcomes" data-style={outcomeStyle}>
          <h2 className="type-headline-sm cs-heading cs-conclusion__heading" id={outcomeHeadingId}>
            {outcomeTitle}
          </h2>
          <dl className="cs-outcomes">
            {outcomes.map((outcome, index) => (
              <div
                key={outcome.key || `${outcome.value}-${index}`}
                data-secondary={outcome.secondary ? '' : undefined}
              >
                <dt className={`${figure ? 'type-headline-lg' : 'type-subhead-sm'} cs-outcome__value`}>
                  {outcome.from && (
                    <>
                      <span className="cs-outcome__from">{outcome.from}</span>
                      <span className="cs-outcome__arrow" aria-label="to">
                        →
                      </span>
                    </>
                  )}
                  <CaseStudyInline text={outcome.value} keyPrefix={`outcome-${index}`} />
                </dt>
                {outcome.detail && (
                  <dd className={`${figure ? 'type-body' : 'type-body-sm'} cs-outcome__detail`}>
                    <CaseStudyInline
                      text={outcome.detail}
                      keyPrefix={`outcome-detail-${index}`}
                    />
                  </dd>
                )}
              </div>
            ))}
          </dl>
          {outcomeNote && <p className="type-caption cs-outcome__note">{outcomeNote}</p>}
        </div>
      )}

      <div className="cs-conclusion__lessons">
        {lessonsTitle && (
          <h2 className="type-headline-sm cs-heading cs-conclusion__heading" id={lessonsHeadingId}>
            {lessonsTitle}
          </h2>
        )}
        <CaseStudyBody content={lessons} />
        {takeaway && (
          <p className="type-body cs-conclusion__takeaway">
            <CaseStudyInline text={takeaway} keyPrefix="conclusion-takeaway" />
          </p>
        )}
        {children}
      </div>
    </CaseStudySection>
  );
};

export default ConclusionSection;
