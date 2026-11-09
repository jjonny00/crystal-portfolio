// src/devlog/components/ArticleNavigation.jsx
//
// The foot of every entry: the entries either side of it in publication order,
// then the way back to the archive.
//
//   <- Previous Entry                                    Next Entry ->
//      <its title>                                       <its title>
//   ------------------------------------------------------------------
//   Back to Devlog
//
// A direction with nothing in it (the first entry has no previous, the latest
// no next) is left out; the other keeps its side.

import React, { useId } from 'react';
import CaseStudySection from '../../caseStudies/system/CaseStudySection';
import Arrow from '../../components/ui/Arrow';
import { getAdjacentEntries } from '../entries';
import { useDevlogLinks } from './devlogLinks';

export const BACK_TO_DEVLOG_LABEL = 'Back to Devlog';

const PagerLink = ({ entry, direction, link }) => (
  <a className={`dl-pager__link dl-pager__link--${direction}`} {...link}>
    <span className="type-caption-caps dl-pager__label">
      {direction === 'previous' && <Arrow direction="left" className="dl-pager__arrow" />}
      {direction === 'previous' ? 'Previous Entry' : 'Next Entry'}
      {direction === 'next' && <Arrow className="dl-pager__arrow" />}
    </span>
    <span className="type-headline-sm dl-pager__title">{entry.title}</span>
  </a>
);

const ArticleNavigation = ({ entry }) => {
  const { linkTo } = useDevlogLinks();
  const headingId = useId();
  const { previous, next } = getAdjacentEntries(entry.slug);

  return (
    <CaseStudySection tone="b" className="dl-pager">
      <nav aria-labelledby={headingId}>
        <h2 className="cs-visually-hidden" id={headingId}>
          More from the devlog
        </h2>
        {(previous || next) && (
          <div className="dl-pager__row">
            {previous && <PagerLink entry={previous} direction="previous" link={linkTo(previous.slug)} />}
            {next && <PagerLink entry={next} direction="next" link={linkTo(next.slug)} />}
          </div>
        )}
        <div className="dl-pager__foot">
          <a className="type-subhead-sm dl-text-link" {...linkTo(null)}>
            <Arrow direction="left" className="dl-text-link__arrow" />
            <span>{BACK_TO_DEVLOG_LABEL}</span>
          </a>
        </div>
      </nav>
    </CaseStudySection>
  );
};

export default ArticleNavigation;
