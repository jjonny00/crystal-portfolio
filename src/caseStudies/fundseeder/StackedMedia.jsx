// src/caseStudies/fundseeder/StackedMedia.jsx
//
// Dense interface captures stacked one above another in a FeatureSection
// stage, each at its own measure: a full-width lead, then supporting views at
// the widths their content reads best at (`maxWidth` on each item). The
// leaderboard comparison and the Signal views both use it.
//
// Not a row of thumbnails: these screens are unreadable small, so every item
// keeps its own ratio (contain, never a cover crop) and the whole set opens in
// the viewer for the detail a phone can't show.

import React, { useMemo } from 'react';
import CaseStudyMedia from '../system/CaseStudyMedia';
import { useMediaViewer } from '../system/MediaViewer';
import './fundseeder.css';

const StackedMedia = ({ items = [] }) => {
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

  return (
    <div className="fs-stack">
      {items.map(({ key, maxWidth, ...media }) => {
        const slideIndex = slides.findIndex((slide) => slide.src === (media.fullSrc || media.src));
        return (
          <CaseStudyMedia
            key={key}
            className="fs-stack__item"
            style={maxWidth ? { '--fs-stack-max': maxWidth } : undefined}
            fit="contain"
            expandable
            onExpand={slideIndex >= 0 ? () => viewer.open(slides, slideIndex) : null}
            {...media}
          />
        );
      })}
    </div>
  );
};

export default StackedMedia;
