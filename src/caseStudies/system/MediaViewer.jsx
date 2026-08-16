// src/caseStudies/system/MediaViewer.jsx
//
// The one place the app knows which lightbox library it uses.
//
// Case-study components only ever call `useMediaViewer().open(slides, index)`
// with our own slide shape, so the implementation behind this boundary can be
// swapped without touching a single case study. The implementation module is
// lazily imported, which keeps the library and its stylesheet out of the
// initial bundle until a reader actually enlarges something.

import React, {
  Suspense,
  createContext,
  lazy,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

const LightboxImpl = lazy(() => import('./MediaViewerLightbox.jsx'));

const MediaViewerContext = createContext(null);

const EMPTY_STATE = { slides: [], index: 0 };

/**
 * Our slide shape (deliberately not the library's):
 *   { src, alt, caption, width, height }
 * `src` should be the highest-resolution source available for that item.
 */
export const MediaViewerProvider = ({ children }) => {
  const [state, setState] = useState(EMPTY_STATE);
  const triggerRef = useRef(null);

  const open = useCallback((slides, index = 0) => {
    const usable = (Array.isArray(slides) ? slides : [slides]).filter(
      (slide) => slide && slide.src
    );
    if (!usable.length) return;

    // Remember what opened the viewer so focus can be handed back on close.
    triggerRef.current =
      typeof document !== 'undefined' ? document.activeElement : null;

    setState({
      slides: usable,
      index: Math.min(Math.max(index, 0), usable.length - 1),
    });
  }, []);

  const close = useCallback(() => {
    setState(EMPTY_STATE);
    const trigger = triggerRef.current;
    triggerRef.current = null;
    if (trigger && typeof trigger.focus === 'function') {
      trigger.focus({ preventScroll: true });
    }
  }, []);

  const isOpen = state.slides.length > 0;
  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <MediaViewerContext.Provider value={value}>
      {children}
      {isOpen && (
        <Suspense fallback={null}>
          <LightboxImpl slides={state.slides} index={state.index} onClose={close} />
        </Suspense>
      )}
    </MediaViewerContext.Provider>
  );
};

const NOOP_VIEWER = Object.freeze({ open: () => {}, close: () => {}, isOpen: false });

/**
 * Returns `{ open, close, isOpen }`. Outside a provider these are inert, so a
 * section component can be rendered standalone (tests, storybook) without
 * blowing up.
 */
export const useMediaViewer = () => {
  const context = useContext(MediaViewerContext);
  return context || NOOP_VIEWER;
};

export default MediaViewerProvider;
