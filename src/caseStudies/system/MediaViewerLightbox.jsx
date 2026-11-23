// src/caseStudies/system/MediaViewerLightbox.jsx
//
// Lightbox implementation detail. Nothing outside MediaViewer.jsx should import
// this file or `yet-another-react-lightbox` directly — replacing the library
// means rewriting this module and nothing else.
//
// The library gives us keyboard navigation, Escape-to-close, a focus trap with
// focus restore, touch/swipe, and pinch + wheel zoom out of the box.
//
// Nothing covers the picture. The library pins the caption to the bottom of
// the slide and the toolbar (zoom, close) to the top, both over the image, and
// sizes the image from the slide's padding box. So the slide's bottom padding
// is the current caption's measured height, its top padding clears the taller
// of the site nav and the toolbar, and the image fits in what is left between.
// Measured, not guessed: the caption runs to one line or four depending on its
// text and the screen, and the toolbar's height is the library's.

import React, { useEffect, useMemo, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Video from 'yet-another-react-lightbox/plugins/video';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';

const PLUGINS = [Captions, Video, Zoom];

const VIDEO_TYPES = { mp4: 'video/mp4', webm: 'video/webm' };

// The space under the image when a slide has no caption.
const BOTTOM_GAP = '2vmin';

/**
 * The current slide's caption height and the toolbar's, in px (0 when absent),
 * kept up to date as they resize. Re-read whenever the slide changes.
 */
const useChromeHeights = (current, hasCaption) => {
  const [heights, setHeights] = useState({ caption: 0, toolbar: 0 });
  useEffect(() => {
    let observer = null;
    let watcher = null;
    let frame = 0;
    // The library renders the caption some frames after the slide (later still
    // the first time, while it measures itself), so until both are there, watch
    // the document for them.
    const attach = () => {
      if (observer) return;
      const caption = hasCaption
        ? document.querySelector('.yarl__slide_current .yarl__slide_captions_container')
        : null;
      const toolbar = document.querySelector('.yarl__toolbar');
      if ((hasCaption && !caption) || !toolbar) {
        if (!watcher) {
          watcher = new MutationObserver(attach);
          watcher.observe(document.body, { childList: true, subtree: true });
        }
        return;
      }
      watcher?.disconnect();
      watcher = null;
      const update = () => {
        const next = {
          caption: caption ? Math.ceil(caption.getBoundingClientRect().height) : 0,
          toolbar: Math.ceil(toolbar.getBoundingClientRect().bottom),
        };
        setHeights((prev) =>
          prev.caption === next.caption && prev.toolbar === next.toolbar ? prev : next
        );
      };
      update();
      observer = new ResizeObserver(update);
      if (caption) observer.observe(caption);
      observer.observe(toolbar);
    };
    frame = requestAnimationFrame(attach);
    return () => {
      cancelAnimationFrame(frame);
      watcher?.disconnect();
      observer?.disconnect();
    };
  }, [current, hasCaption]);
  return heights;
};

// The caption, and under it the note, if there is one.
const describe = ({ caption, note }) => {
  if (!note) return caption || undefined;
  return (
    <>
      {caption}
      {caption && <br />}
      {note}
    </>
  );
};

const MediaViewerLightbox = ({ slides, index, pixelated = false, onClose }) => {
  const librarySlides = useMemo(
    () =>
      slides.map((slide) => {
        const common = {
          description: describe(slide),
          width: slide.width || undefined,
          height: slide.height || undefined,
        };
        if (slide.type === 'video') {
          const extension = String(slide.src).split('?')[0].split('.').pop().toLowerCase();
          return {
            ...common,
            type: 'video',
            poster: slide.poster || undefined,
            sources: [{ src: slide.src, type: VIDEO_TYPES[extension] }],
            // A short clip, read like an animated image: muted, looping,
            // inline, playing as it comes up.
            autoPlay: true,
            muted: true,
            loop: true,
            playsInline: true,
            controls: false,
          };
        }
        return { ...common, src: slide.src, alt: slide.alt || '' };
      }),
    [slides]
  );

  const single = librarySlides.length <= 1;

  // Which slide is showing, so the caption under it can be measured.
  const [current, setCurrent] = useState(index);
  const hasCaption = Boolean(librarySlides[current]?.description);
  const chrome = useChromeHeights(current, hasCaption);

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
      captions={{ descriptionTextAlign: 'center', showToggle: false, descriptionMaxLines: 4 }}
      on={{ view: ({ index: viewed }) => setCurrent(viewed) }}
      styles={{
        container: { backgroundColor: 'rgba(0, 4, 6, 0.94)' },
        // Padding rather than moving the container, so the backdrop still covers
        // the whole window — including the strip the nav sits in.
        slide: {
          paddingTop: `calc(max(var(--page-nav-bottom, 62px), ${chrome.toolbar}px) + 2vmin)`,
          // The caption's own band: the image ends where the caption begins.
          paddingBottom: hasCaption && chrome.caption ? `${chrome.caption}px` : BOTTOM_GAP,
          // Inherited by the image: pixel art keeps its hard edges at any scale.
          ...(pixelated ? { imageRendering: 'pixelated' } : null),
        },
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
