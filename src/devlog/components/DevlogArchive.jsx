// src/devlog/components/DevlogArchive.jsx
//
// The devlog's front page, at the project's own URL (/work/secondsentence).
//
//   Intro         the project, its descriptor, a short introduction and its
//                 current status. On the scene, like every case study's hero.
//   Latest Entry  the newest published entry, largest.
//   Earlier       every other entry, newest first, a grid that grows with
//                 Load More rather than all at once.
//   About         the game, briefly, for a reader who arrived on an entry.
//
// Before the first entry is published the latest slot says so, and the page is
// the intro and About.

import React, { useEffect, useId, useRef, useState } from 'react';
import CaseStudySection from '../../caseStudies/system/CaseStudySection';
import CaseStudyBody from '../../caseStudies/system/CaseStudyText';
import CaseStudyMetadata from '../../caseStudies/system/CaseStudyMetadata';
import { devlogEntries } from '../entries';
import EntryCard from './EntryCard';

// Earlier entries shown at first, and added by each Load More.
export const ARCHIVE_PAGE_SIZE = 6;

const Intro = ({ project, intro, status, headingRef }) => (
  <CaseStudySection
    tone="a"
    background="none"
    className="dl-top dl-intro"
    innerClassName="dl-intro__inner"
    aria-labelledby="dl-intro-title"
  >
    <h1
      ref={headingRef}
      id="dl-intro-title"
      className="type-headline cs-title dl-enter dl-intro__title"
      tabIndex={-1}
    >
      {project.title}
    </h1>
    <p className="type-subhead-sm dl-enter dl-intro__descriptor">{project.subtitle}</p>
    <CaseStudyBody className="dl-enter dl-intro__body" content={intro} />
    <CaseStudyMetadata className="dl-enter dl-intro__status" metadata={status} title="Status" />
  </CaseStudySection>
);

const Latest = ({ entry, emptyMessage }) => {
  const headingId = useId();
  return (
    <CaseStudySection tone="b" className="dl-latest" aria-labelledby={headingId}>
      <h2 className="type-caption-caps dl-eyebrow" id={headingId}>
        Latest Entry
      </h2>
      {entry ? (
        <EntryCard entry={entry} variant="featured" />
      ) : (
        <p className="type-body dl-empty">{emptyMessage}</p>
      )}
    </CaseStudySection>
  );
};

const Earlier = ({ entries }) => {
  const headingId = useId();
  const [shown, setShown] = useState(ARCHIVE_PAGE_SIZE);
  // After Load More, focus moves to the first entry it added, so a keyboard or
  // screen-reader reader carries on from where the list grew.
  const firstNewLinkRef = useRef(null);
  const focusFromRef = useRef(null);

  useEffect(() => {
    if (focusFromRef.current === null) return;
    focusFromRef.current = null;
    firstNewLinkRef.current?.focus();
  }, [shown]);

  if (!entries.length) return null;
  const visible = entries.slice(0, shown);
  const remaining = entries.length - visible.length;

  return (
    <CaseStudySection tone="b" className="dl-earlier" aria-labelledby={headingId}>
      <h2 className="type-caption-caps dl-eyebrow" id={headingId}>
        Earlier Entries
      </h2>
      <ul className="dl-grid">
        {visible.map((entry, index) => (
          <li key={entry.slug}>
            <EntryCard
              entry={entry}
              linkRef={index === shown - ARCHIVE_PAGE_SIZE && index > 0 ? firstNewLinkRef : null}
            />
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <div className="dl-more">
          <button
            type="button"
            className="type-subhead-sm dl-more__button"
            onClick={() => {
              focusFromRef.current = shown;
              setShown((count) => count + ARCHIVE_PAGE_SIZE);
            }}
          >
            Load More Entries
          </button>
        </div>
      )}
    </CaseStudySection>
  );
};

const AboutTheGame = ({ about }) => {
  const headingId = useId();
  return (
    <CaseStudySection tone="b" className="dl-about" innerClassName="dl-about__inner" aria-labelledby={headingId}>
      <h2 className="type-headline-sm cs-heading dl-about__title" id={headingId}>
        {about.title}
      </h2>
      <CaseStudyBody className="dl-about__body" content={about.body} />
      <dl className="dl-terms">
        {about.terms.map((term) => (
          <div className="dl-terms__item" key={term.name}>
            <dt className="type-subhead-sm dl-terms__name">{term.name}</dt>
            <dd className="type-body-sm dl-terms__text">{term.text}</dd>
          </div>
        ))}
      </dl>
    </CaseStudySection>
  );
};

const DevlogArchive = ({ project, content, headingRef = null }) => {
  const [latest, ...earlier] = devlogEntries;
  return (
    <>
      <Intro project={project} intro={content.intro} status={content.status} headingRef={headingRef} />
      <Latest entry={latest || null} emptyMessage={content.emptyMessage} />
      <Earlier entries={earlier} />
      <AboutTheGame about={content.about} />
    </>
  );
};

export default DevlogArchive;
