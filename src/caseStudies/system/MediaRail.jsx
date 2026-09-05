// src/caseStudies/system/MediaRail.jsx
//
// A row of media at one shared height, scrolled horizontally when it does not
// fit — a sequence of screens, steps, or frames read left to right:
//
//   <MediaRail items={c.turnSequence.steps} mobileHeight="126vw" />
//
// Height is what the rail fixes; each item takes its width from its own aspect
// ratio. That is the opposite of MediaGallery, which fixes the columns and lets
// the height follow, and it is what keeps a row of mixed ratios level. Give it
// tall phone screenshots and they come out the same height; give it a mix of
// portrait and landscape and the row still reads as one band.
//
// On desktop the default height is sized so a handful of items fit the stage
// without scrolling. On phones it becomes the horizontal scroller the shape
// implies: one set height, the next item peeking past the edge to say there is
// more, momentum scrolling, and snap. Both come from the same two properties —
// `height` and `mobileHeight` — because the media decides what reads well at
// each size, not the component.
//
// Like every other slot, items route through CaseStudyMedia, so they get lazy
// loading, alt text, aspect-ratio reservation, and placeholders; opening any one
// of them hands the whole rail to the viewer, in order.

import React, { useMemo } from 'react';
import CaseStudyMedia from './CaseStudyMedia';
import { useMediaViewer } from './MediaViewer';
import { CaseStudyInline } from './CaseStudyText';

const MediaRail = ({
  items = [],
  /** Row height at desktop. Any CSS length; omit for the stylesheet's default. */
  height = null,
  /** Row height on phones, where the rail scrolls. Usually the taller of the two. */
  mobileHeight = null,
  /** One caption for the whole rail; items may still caption themselves. */
  caption = null,
  expandable = true,
  fit = 'contain',
  className = '',
  ...rest
}) => {
  const viewer = useMediaViewer();

  const slides = useMemo(
    () =>
      items
        .filter((item) => item && item.src)
        .map((item) => ({
          src: item.fullSrc || item.src,
          alt: item.alt || '',
          caption: typeof item.caption === 'string' ? item.caption : undefined,
        })),
    [items]
  );

  if (!items.length) return null;

  return (
    <figure className={`cs-media ${className}`.trim()} {...rest}>
      <div
        className="cs-rail"
        style={{
          ...(height ? { '--cs-rail-height': height } : null),
          ...(mobileHeight ? { '--cs-rail-height-mobile': mobileHeight } : null),
        }}
      >
        {items.map((item, index) => {
          // The viewer index only counts items that actually have a source.
          const slideIndex = items
            .slice(0, index)
            .filter((candidate) => candidate && candidate.src).length;

          // An item's `key` identifies it in content ('rotate', 'confirm', …);
          // it is React's key here, not a prop to spread onto the media.
          const { key: itemKey, ...media } = item || {};

          return (
            <CaseStudyMedia
              key={itemKey || media.src || `item-${index}`}
              className="cs-rail__item"
              fit={fit}
              expandable={expandable}
              onExpand={slides.length ? () => viewer.open(slides, slideIndex) : null}
              {...media}
            />
          );
        })}
      </div>

      {caption && (
        <figcaption className="cs-caption cs-media__caption">
          {typeof caption === 'string' ? <CaseStudyInline text={caption} /> : caption}
        </figcaption>
      )}
    </figure>
  );
};

export default MediaRail;
