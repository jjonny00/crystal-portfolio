// src/caseStudies/secondsentence/SecondSentenceCaseStudy.jsx
//
// Second Sentence's case study is its devlog. One case study, two kinds of page,
// chosen by the overlay's subpath (CaseStudyNavContext):
//
//   null              the archive (DevlogArchive), at /work/secondsentence
//   'devlog/<slug>'   an entry (DevlogArticle), at /work/secondsentence/devlog/<slug>
//
// Both sit in the same CaseStudyPage, so the close button, Escape, the media
// viewer, the two colours and the Next Project block at the end are the ones
// every case study has. The devlog's own pieces are in src/devlog/.
//
// Tone rhythm: the intro paints no background, so the crystal shows through it
// as it does through every case study's hero (the registry entry is 'reveal');
// everything after it is tone B, and an entry is tone B throughout.

import React, { useContext, useLayoutEffect, useRef } from 'react';
import { CaseStudyPage } from '../system';
import { CaseStudyNavContext } from '../system/caseStudyNav';
import DevlogArchive from '../../devlog/components/DevlogArchive';
import DevlogArticle from '../../devlog/components/DevlogArticle';
import { entrySlugFromSubpath, getEntryBySlug } from '../../devlog/entries';
import { secondSentenceContent } from './secondSentenceContent';
import '../../devlog/devlog.css';

/**
 * Moving between the archive and an entry is a page change inside the same
 * layer: start the new page at its top (or, back on the archive, where the
 * reader left it), and move focus to its heading so a screen reader announces
 * it. Not on mount — the overlay owns the first scroll position (a prerendered
 * page the reader may already be partway down).
 */
const usePageChange = (pageKey, viewRef, headingRef) => {
  const previousKeyRef = useRef(pageKey);
  const archiveScrollRef = useRef(0);

  useLayoutEffect(() => {
    const previousKey = previousKeyRef.current;
    if (previousKey === pageKey) return;
    previousKeyRef.current = pageKey;

    const view = viewRef.current;
    const scroller = view?.closest('.cs-overlay');
    if (view) view.dataset.navigated = '';
    if (scroller) {
      if (previousKey === 'archive') archiveScrollRef.current = scroller.scrollTop;
      scroller.scrollTop = pageKey === 'archive' ? archiveScrollRef.current : 0;
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [pageKey, viewRef, headingRef]);
};

const SecondSentenceCaseStudy = ({ project, onClose }) => {
  const nav = useContext(CaseStudyNavContext);
  const entry = getEntryBySlug(entrySlugFromSubpath(nav?.subpath));
  const pageKey = entry ? entry.slug : 'archive';

  const viewRef = useRef(null);
  const headingRef = useRef(null);
  usePageChange(pageKey, viewRef, headingRef);

  return (
    <CaseStudyPage
      colors={project?.caseStudyColors}
      label={entry ? `${project.label} devlog: ${entry.title}` : `${project.label} devlog`}
      onClose={onClose}
    >
      {/* Keyed by page, so a new page mounts fresh (and plays the quick swap in
          devlog.css) rather than morphing out of the last one. */}
      <div className="dl-view" ref={viewRef} key={pageKey}>
        {entry ? (
          <DevlogArticle entry={entry} headingRef={headingRef} />
        ) : (
          <DevlogArchive project={project} content={secondSentenceContent} headingRef={headingRef} />
        )}
      </div>
    </CaseStudyPage>
  );
};

export default SecondSentenceCaseStudy;
