// src/devlog/components/MediaFigure.jsx
//
// One image in an entry, with an optional caption, enlargeable through the
// case studies' media viewer. CaseStudyMedia underneath, so it lazy-loads,
// reserves its space and enlarges exactly as a case study's images do.
//
//   <MediaFigure
//     src="/media/devlog/<entry>/dash-trail.webp"
//     alt="What the image shows, for someone who cannot see it."
//     caption="Optional. **Bold** works."
//     size="wide"            // "text" (the reading column) | "wide" (default) | "full"
//   />
//
// Its size is measured at build time (scripts/devlog/vitePlugin.mjs), so it
// needs no width or height. Leave `src` out and give `placeholder` a
// description to hold the space for an image still to come.

import React from 'react';
import CaseStudyMedia from '../../caseStudies/system/CaseStudyMedia';

export const MEDIA_SIZES = ['text', 'wide', 'full'];

const MediaFigure = ({
  src = null,
  fullSrc = null,
  alt = '',
  caption = null,
  size = 'wide',
  aspectRatio = null,
  width = null,
  height = null,
  fit = 'cover',
  expandable = true,
  placeholder = null,
  className = '',
}) => (
  <CaseStudyMedia
    className={`dl-media dl-media--${MEDIA_SIZES.includes(size) ? size : 'wide'} ${className}`.trim()}
    src={src}
    fullSrc={fullSrc}
    alt={alt}
    caption={caption}
    aspectRatio={aspectRatio}
    width={width}
    height={height}
    fit={fit}
    expandable={expandable && Boolean(src)}
    placeholder={src ? null : placeholder || alt || 'Image to come'}
  />
);

export default MediaFigure;
