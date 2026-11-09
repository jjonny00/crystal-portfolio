// src/devlog/components/EntryCard.jsx
//
// An entry in the archive: cover, category and date, headline, summary. Two
// sizes from the same markup:
//
//   featured   the latest entry, cover beside the copy on desktop, with a
//              Read Entry link under the summary
//   card       every earlier entry, in the archive's grid
//
// The headline is the link, stretched over the whole card (devlog.css), so the
// card is one click target while a screen reader hears one link with the
// entry's title as its name. Everything shows without hover.

import React from 'react';
import CaseStudyMedia from '../../caseStudies/system/CaseStudyMedia';
import Arrow from '../../components/ui/Arrow';
import EntryMeta from './EntryMeta';
import { useDevlogLinks } from './devlogLinks';

// Covers are cropped to one shape in the archive, so the grid reads as a grid.
const CARD_RATIO = '16 / 9';

export const READ_ENTRY_LABEL = 'Read Entry';

const EntryCard = ({ entry, variant = 'card', headingLevel = 'h3', linkRef = null }) => {
  const Heading = headingLevel;
  const { linkTo } = useDevlogLinks();
  const link = linkTo(entry.slug);
  const featured = variant === 'featured';

  return (
    <article className={`dl-card dl-card--${variant}`}>
      <CaseStudyMedia
        className="dl-card__media"
        src={entry.cover?.src || null}
        alt={entry.cover?.alt || ''}
        width={entry.cover?.width}
        height={entry.cover?.height}
        placeholder={entry.cover ? null : `Cover for “${entry.title}”`}
        aspectRatio={CARD_RATIO}
        fit="cover"
        priority={featured}
      />

      <div className="dl-card__text">
        <EntryMeta entry={entry} />
        <Heading className="type-headline-sm dl-card__title">
          <a className="dl-card__link" ref={linkRef} {...link}>
            {entry.title}
          </a>
        </Heading>
        <p className={`${featured ? 'type-body' : 'type-body-sm'} dl-card__summary`}>{entry.summary}</p>
        {featured && (
          // Says what the card does; the stretched headline link is what takes
          // the click, so this is not a second link.
          <p className="type-subhead-sm dl-card__cta" aria-hidden="true">
            {READ_ENTRY_LABEL}
            <Arrow className="dl-card__cta-arrow" />
          </p>
        )}
      </div>
    </article>
  );
};

export default EntryCard;
