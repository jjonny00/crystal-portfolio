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
      // 2vmin around each slide, and the nav's height on top of that: the site
      // nav is drawn above this layer (z-index 10000 against the portal's 9999),
      // so an image scaled to fill the height would otherwise run underneath the
      // wordmark. Most obvious on a phone, where the slides are portrait.
      carousel={{ finite: true, padding: '2vmin' }}
      controller={{ closeOnBackdropClick: true, closeOnPullDown: true }}
      // Detailed diagrams need real magnification, not a 2x nudge.
      zoom={{ maxZoomPixelRatio: 4, scrollToZoom: true }}
      captions={{ descriptionTextAlign: 'center', showToggle: false }}
      styles={{
        container: { backgroundColor: 'rgba(0, 4, 6, 0.94)' },
        // Padding rather than moving the container, so the backdrop still covers
        // the whole window — including the strip the nav sits in.
        slide: { paddingTop: 'calc(var(--page-nav-bottom, 62px) + 2vmin)' },
      }}
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
