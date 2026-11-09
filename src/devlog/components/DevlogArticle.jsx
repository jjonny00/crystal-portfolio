// src/devlog/components/DevlogArticle.jsx
//
// One entry, at /work/<project>/devlog/<slug>. The same layout for every entry,
// so writing one is writing Markdown:
//
//   Back to Devlog
//   Category · Date
//   TITLE (the page's h1)
//   Summary
//   [featured media: the entry's video, or its cover; wider than the text]
//   Body, in a reading column; its media can run wider
//   Previous / Next / Back to Devlog
//
// The header renders from the entry's metadata at once; the body is its own
// chunk, usually fetched already (hover on its card, or main.jsx on a deep link).

import React, { Suspense, lazy } from 'react';
import CaseStudySection from '../../caseStudies/system/CaseStudySection';
import Arrow from '../../components/ui/Arrow';
import { getResolvedEntryBody, preloadEntryBody } from '../entries';
import ArticleNavigation, { BACK_TO_DEVLOG_LABEL } from './ArticleNavigation';
import EntryMeta from './EntryMeta';
import GameplayVideo from './GameplayVideo';
import MediaFigure from './MediaFigure';
import { mdxComponents } from './mdxComponents';
import { useDevlogLinks } from './devlogLinks';

// One per entry, and stable: a new lazy component each render would remount the body.
const lazyBodies = new Map();
const getLazyBody = (slug) => {
  if (!lazyBodies.has(slug)) {
    lazyBodies.set(slug, lazy(() => preloadEntryBody(slug).then((Body) => ({ default: Body }))));
  }
  return lazyBodies.get(slug);
};

const coverRatio = (cover) => (cover?.width && cover?.height ? `${cover.width} / ${cover.height}` : null);

const FeaturedMedia = ({ entry }) => {
  const { cover, video } = entry;
  if (video) {
    return (
      <GameplayVideo
        className="dl-enter dl-article__media"
        src={video}
        poster={cover?.src}
        title={cover?.alt || entry.title}
        aspectRatio={coverRatio(cover) || '16 / 9'}
      />
    );
  }
  return (
    <MediaFigure
      className="dl-enter dl-article__media"
      src={cover?.src || null}
      alt={cover?.alt || ''}
      width={cover?.width}
      height={cover?.height}
      aspectRatio={coverRatio(cover) || '16 / 9'}
      placeholder={`Cover for “${entry.title}”`}
    />
  );
};

const DevlogArticle = ({ entry, headingRef = null }) => {
  const { linkTo } = useDevlogLinks();
  const Body = getResolvedEntryBody(entry.slug) || getLazyBody(entry.slug);

  return (
    <>
      <CaseStudySection
        tone="b"
        className="dl-top dl-article"
        aria-labelledby={`dl-title-${entry.slug}`}
      >
        <header className="dl-article__head">
          <a className="type-subhead-sm dl-text-link dl-enter dl-article__back" {...linkTo(null)}>
            <Arrow direction="left" className="dl-text-link__arrow" />
            <span>{BACK_TO_DEVLOG_LABEL}</span>
          </a>
          <EntryMeta entry={entry} className="dl-enter dl-article__meta" />
          <h1
            ref={headingRef}
            id={`dl-title-${entry.slug}`}
            className="type-headline cs-title dl-enter dl-article__title"
            tabIndex={-1}
          >
            {entry.title}
          </h1>
          <p className="type-body dl-enter dl-article__summary">{entry.summary}</p>
        </header>

        <FeaturedMedia entry={entry} />

        <div className="type-body cs-body dl-prose">
          <Suspense fallback={<p className="dl-prose__loading">Loading entry…</p>}>
            <Body components={mdxComponents} />
          </Suspense>
        </div>
      </CaseStudySection>

      <ArticleNavigation entry={entry} />
    </>
  );
};

export default DevlogArticle;
