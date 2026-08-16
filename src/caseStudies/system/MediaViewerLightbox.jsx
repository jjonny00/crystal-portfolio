// src/caseStudies/system/MediaViewerLightbox.jsx
//
// Lightbox implementation detail. Nothing outside MediaViewer.jsx should import
// this file or `yet-another-react-lightbox` directly — replacing the library
// means rewriting this module and nothing else.
//
// The library gives us keyboard navigation, Escape-to-close, a focus trap with
// focus restore, touch/swipe, and pinch + wheel zoom out of the box.

import React, { useMemo } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';

const PLUGINS = [Captions, Zoom];

const MediaViewerLightbox = ({ slides, index, onClose }) => {
  const librarySlides = useMemo(
    () =>
      slides.map((slide) => ({
        src: slide.src,
        alt: slide.alt || '',
        description: slide.caption || undefined,
        width: slide.width || undefined,
        height: slide.height || undefined,
      })),
    [slides]
  );

  const single = librarySlides.length <= 1;

  return (
    <Lightbox
      open
      close={onClose}
      index={index}
      slides={librarySlides}
      plugins={PLUGINS}
      carousel={{ finite: true, padding: '2vmin' }}
      controller={{ closeOnBackdropClick: true, closeOnPullDown: true }}
      // Detailed diagrams need real magnification, not a 2x nudge.
      zoom={{ maxZoomPixelRatio: 4, scrollToZoom: true }}
      captions={{ descriptionTextAlign: 'center', showToggle: false }}
      styles={{ container: { backgroundColor: 'rgba(0, 4, 6, 0.94)' } }}
      render={
        single
          ? { buttonPrev: () => null, buttonNext: () => null }
          : undefined
      }
      animation={{ fade: 200, swipe: 300 }}
    />
  );
};

export default MediaViewerLightbox;
