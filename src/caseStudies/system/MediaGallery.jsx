// src/caseStudies/system/MediaGallery.jsx
//
// Arranges several media items in one slot. Every item routes through
// CaseStudyMedia, so enlargement, lazy loading, alt text, and aspect-ratio
// reservation behave identically to a standalone image — and opening one item
// hands the whole set to the viewer so a reader can page through it.

import React, { useMemo } from 'react';
import CaseStudyMedia from './CaseStudyMedia';
import { useMediaViewer } from './MediaViewer';
import { CaseStudyInline } from './CaseStudyText';

export const GALLERY_LAYOUTS = ['2-up', '3-up', 'stacked'];

const MediaGallery = ({
  items = [],
  layout = '2-up',
  /** One caption describing the whole set; items may still caption themselves. */
  caption = null,
  expandable = true,
  fit = 'cover',
  aspectRatio = null,
  className = '',
  ...rest
}) => {
  const usableLayout = GALLERY_LAYOUTS.includes(layout) ? layout : '2-up';
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
      <div className="cs-gallery" data-layout={usableLayout}>
        {items.map((item, index) => {
          // The viewer index only counts items that actually have a source.
          const slideIndex = items
            .slice(0, index)
            .filter((candidate) => candidate && candidate.src).length;

          return (
            <CaseStudyMedia
              key={item.key || item.src || `item-${index}`}
              fit={fit}
              aspectRatio={aspectRatio}
              expandable={expandable}
              onExpand={slides.length ? () => viewer.open(slides, slideIndex) : null}
              {...item}
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

export default MediaGallery;
