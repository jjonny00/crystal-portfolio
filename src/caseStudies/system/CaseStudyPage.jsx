// src/caseStudies/system/CaseStudyPage.jsx
//
// Page shell every case study wraps itself in: publishes the project's two
// colours as CSS custom properties, mounts the media viewer, and provides the
// shared chrome (skip link, back control, Escape to leave).

import React, { useEffect, useRef } from 'react';
import { MediaViewerProvider, useMediaViewer } from './MediaViewer';
import { buildCaseStudyThemeStyle } from './caseStudyTheme';
import './caseStudy.css';

const MAIN_ID = 'case-study-main';

// Escape belongs to the enlarged media while it is open — the lightbox closes
// itself and the reader stays in the case study.
const EscapeToClose = ({ onClose }) => {
  const { isOpen: viewerIsOpen } = useMediaViewer();

  useEffect(() => {
    if (!onClose || viewerIsOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, viewerIsOpen]);

  return null;
};

const CaseStudyPage = ({
  colors,
  /** Accessible name for the document region, e.g. "Mesa case study". */
  label,
  onClose = null,
  backLabel = 'Back',
  children,
}) => {
  const rootRef = useRef(null);

  // Move focus into the case study when it opens so keyboard and screen-reader
  // users start at the top of the new content rather than wherever they were.
  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div ref={rootRef} className="cs-root" style={buildCaseStudyThemeStyle(colors)} tabIndex={-1}>
      <a className="cs-skip-link" href={`#${MAIN_ID}`}>
        Skip to case study content
      </a>

      <MediaViewerProvider>
        <EscapeToClose onClose={onClose} />

        <main id={MAIN_ID} aria-label={label}>
          {children}
        </main>

        {onClose && (
          <button type="button" className="cs-back" onClick={onClose}>
            <span aria-hidden="true">&larr;</span>
            {backLabel}
          </button>
        )}
      </MediaViewerProvider>
    </div>
  );
};

export default CaseStudyPage;
