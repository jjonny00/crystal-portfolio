// src/caseStudies/system/CaseStudyPage.jsx
//
// Page shell every case study wraps itself in: publishes the project's two
// colours as CSS custom properties, mounts the media viewer, and provides the
// shared chrome (skip link, back control, Escape to leave), and ends every case
// study with the way on to the next project (NextProjectSection).

import React, { useContext, useEffect, useRef } from 'react';
import { MediaViewerProvider, useMediaViewer } from './MediaViewer';
import { buildCaseStudyThemeStyle } from './caseStudyTheme';
import { CaseStudyExitContext } from './caseStudyExit';
import SquircleSurface from '../../components/ui/SquircleSurface';
import NextProjectSection from './NextProjectSection';
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
  /**
   * The way out's label, beside a cross. "Close" says what it does: the case
   * study is a layer over the portfolio, and closing it leaves the reader on
   * the project's preview it opened from. ("Back to <project>" read as going
   * somewhere new from a page already about that project.) On a phone the
   * button is the cross alone, in a circle (caseStudy.css).
   */
  backLabel = 'Close',
  /** Its accessible name, which a phone's cross alone has to carry. */
  backName = 'Close case study',
  children,
}) => {
  const rootRef = useRef(null);
  // The host can swap the way out (a case study opened from its own URL; see
  // caseStudyExit.js). The button and Escape both take it.
  const exitOverride = useContext(CaseStudyExitContext);
  const exitLabel = exitOverride?.label ?? backLabel;
  const onExit = exitOverride?.onExit ?? onClose;

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
        <EscapeToClose onClose={onExit} />

        <main id={MAIN_ID} aria-label={label}>
          {children}
          <NextProjectSection />
        </main>

        {onExit && (
          <button
            type="button"
            className={exitOverride ? 'cs-back' : 'cs-back cs-back--close'}
            aria-label={exitOverride ? undefined : backName}
            onClick={onExit}
          >
            <SquircleSurface />
            {/* The cross says "close", as the project index's does. A
                host-supplied exit leads somewhere new (caseStudyExit.js), so
                it keeps its words and goes without. */}
            {!exitOverride && (
              <svg className="cs-back__icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
            <span className="cs-back__label">{exitLabel}</span>
          </button>
        )}
      </MediaViewerProvider>
    </div>
  );
};

export default CaseStudyPage;
