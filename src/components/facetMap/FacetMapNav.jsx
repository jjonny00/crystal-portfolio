// src/components/facetMap/FacetMapNav.jsx
//
// The facet map on a project preview or a case study, and the button that opens
// the project index. See docs/facet-map.md. It always has the screen's bottom
// right to itself, on a preview and a case study alike, so it never moves
// between them, across from the case study's close button at the bottom left.
// Two layouts, by width:
//
// The dock (MQ_DESKTOP, 768px and up): the map alone, 72px tall, in a 104px
// circle in the index's dark (the project's name is already on screen, large),
// its bottom level with the close button's. Hover, keyboard focus or a click
// opens the index, a card that rises over it: the six projects by name, the
// current one in its own colour (projects.js), beside the map, which grows out
// of the dock's to the list's height, and "View All Work" across its foot. The
// card covers the dock, so the pointer's path from one into the other never
// crosses a gap. Pointing at a name or a fragment lights that fragment without
// selecting anything. Leaving waits a moment before closing, so a pointer that
// strays off an edge and comes back finds it still open.
//
// The disc (a phone): the last row of the screen, beside the project card's CTA,
// the map alone in a circle the CTA's height and colours (the project card's:
// its ink for the fill, the map drawn in its fill; lib/projectCardColors.js). A
// tap opens the index from it, rising as the dock's does, the map growing out of
// the disc's beside the names, the rows at least 50px tall, and "View All Work"
// along the foot with a close button where the disc was. Only a tap or the
// keyboard opens it; it never takes a swipe, so the page scrolls under the
// reader's thumb as before.
//
// Either way, choosing a project goes to its preview (from a case study, closing
// it first); choosing the current one only closes the index. Escape, a press
// outside (which does nothing else), or the page scrolling closes it.

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import FacetMapGlyph from './FacetMapGlyph';
import SquircleSurface from '../ui/SquircleSurface';
import { FACET_MAP_ORDER } from './facetMapData';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MQ_DESKTOP, MQ_REDUCED_MOTION } from '../../config/breakpoints';
import { getProjectByAnyKey } from '../../data/projects';
import { VIEW_ALL_WORK_LABEL } from '../../data/siteCopy';
import { projectCardColors } from '../../lib/projectCardColors';
import { pathFor, projectPath } from '../../navigation/routes';
import { NAVIGATION_DESTINATIONS } from '../../navigation/navigationIntent';
import { inPageLinkHandler } from '../../navigation/linkClick';
import '../../styles/facet-map.css';

/** The map's height in the dock. */
const DOCK_GLYPH_HEIGHT = 72;
/**
 * The map's height in the index that grows from the dock: about the list's
 * height beside it. It grows to this from the dock's (facet-map.css), so the
 * ratio is written there too.
 */
const PANEL_GLYPH_HEIGHT = 260;
/** The map's height in the phone's disc, chosen on device. */
const BUTTON_GLYPH_HEIGHT = 32;
/**
 * The map's height in the index that rises from the disc: what fits beside the
 * longest name across a phone's index (it shrinks to its column where that is
 * narrower). Written in facet-map.css too, for the grow.
 */
const PHONE_PANEL_GLYPH_HEIGHT = 200;

/** How long the pointer can be off the map and the index before it closes. */
const LEAVE_CLOSE_MS = 240;

/**
 * A press outside the open index only closes it: the click it would end in is
 * dropped, so the tap that dismisses the index doesn't also follow the link or
 * fragment under it. A press that turns into a scroll ends without a click (or
 * with pointercancel), and the page scrolls as usual.
 */
const swallowNextClick = () => {
  let timer = 0;
  const done = () => {
    clearTimeout(timer);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('pointercancel', done, true);
  };
  function onClick(event) {
    event.preventDefault();
    event.stopPropagation();
    done();
  }
  document.addEventListener('click', onClick, true);
  document.addEventListener('pointercancel', done, true);
  timer = setTimeout(done, 800);
};

const INDEX = FACET_MAP_ORDER.map((projectId) => {
  const project = getProjectByAnyKey(projectId);
  return {
    projectId,
    label: project?.label ?? projectId,
    // The current project's name takes its colour (projects.js).
    color: project?.headlineColor || project?.color || null,
  };
});

const FacetMapNav = ({
  /** From useFacetMapSelection. */
  selection,
  /** Go to a project's preview (App closes an open case study first). */
  onSelectProject,
  /** Go to the overview: All Work, the nav's Work. */
  onSelectOverview,
}) => {
  const reducedMotion = useMediaQuery(MQ_REDUCED_MOTION);
  // The portfolio's phone layout, the one with the project card.
  const compact = !useMediaQuery(MQ_DESKTOP);
  const { visible, projectId } = selection;
  const project = projectId ? getProjectByAnyKey(projectId) : null;
  const shown = visible;

  // The project card's colours: the fill in its ink, the map in its fill. Held
  // through a move, when no project is marked, so the button doesn't change
  // colour on the way out.
  const heldProjectRef = useRef(null);
  if (projectId) heldProjectRef.current = projectId;
  const heldProject = heldProjectRef.current ? getProjectByAnyKey(heldProjectRef.current) : null;
  const colors = heldProject ? projectCardColors(heldProject) : null;

  const [open, setOpen] = useState(false);
  // 'hover' closes when the pointer leaves; 'pinned' (a click, the keyboard)
  // stays until Escape, a click outside, or a choice.
  const openModeRef = useRef(null);
  const [highlightId, setHighlightId] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const closeTimerRef = useRef(0);
  // Focus handed back to the button on Escape is not the reader arriving there.
  const refocusingRef = useRef(false);
  const panelId = useId();

  const clearCloseTimer = () => {
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = 0;
  };

  const openIndex = useCallback((mode) => {
    clearCloseTimer();
    if (mode === 'pinned' || !openModeRef.current) openModeRef.current = mode;
    setOpen(true);
  }, []);

  const closeIndex = useCallback(({ returnFocus = false } = {}) => {
    clearCloseTimer();
    openModeRef.current = null;
    setOpen(false);
    setHighlightId(null);
    if (returnFocus) {
      refocusingRef.current = true;
      triggerRef.current?.focus();
      refocusingRef.current = false;
    }
  }, []);

  // Gone from the screen (a move away, About, the lightbox's own hiding aside),
  // the index goes with it.
  useEffect(() => {
    if (!shown) closeIndex();
  }, [shown, closeIndex]);

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  // Crossing between the layouts (a resize, a rotation), it starts closed.
  useEffect(() => {
    closeIndex();
  }, [compact, closeIndex]);

  // Escape and a click outside, while open.
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      closeIndex({ returnFocus: rootRef.current?.contains(document.activeElement) });
    };
    const onPointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      closeIndex();
      swallowNextClick();
    };
    // The page moving under it (a wheel, a trackpad, the keyboard) takes the
    // reader somewhere else; the index goes. Its own scrolling (a phone on its
    // side) doesn't count.
    const onScroll = (event) => {
      if (!rootRef.current?.contains(event.target)) closeIndex();
    };
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [open, closeIndex]);

  // Hover opens the dock's index only. The disc is a tap target, and a mouse
  // at a phone's width clicks it like one.
  const onPointerEnter = (event) => {
    if (compact || event.pointerType === 'touch') return;
    openIndex('hover');
  };

  const onPointerLeave = (event) => {
    if (event.pointerType === 'touch' || openModeRef.current !== 'hover') return;
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => closeIndex(), LEAVE_CLOSE_MS);
  };

  const onTriggerClick = () => {
    if (!open) openIndex('pinned');
    else if (openModeRef.current === 'hover') openModeRef.current = 'pinned';
    else closeIndex();
  };

  // Keyboard focus opens it, so tabbing onto the map walks straight on into the
  // index. A pointer's focus (the click itself) is left to the click.
  const onTriggerFocus = (event) => {
    if (compact || refocusingRef.current) return;
    if (event.target.matches?.(':focus-visible')) openIndex('pinned');
  };

  // Focus moving out of the map and the index altogether closes it.
  const onBlur = (event) => {
    if (!rootRef.current?.contains(event.relatedTarget) && openModeRef.current === 'pinned') {
      closeIndex();
    }
  };

  const choose = (id) => {
    closeIndex();
    if (id === projectId) return;
    onSelectProject?.(id);
  };

  // The six projects and the way to the overview.
  const panelBody = (
    <div className="facet-map__panel-body">
      <ol className="facet-map__list">
        {INDEX.map((item) => {
          const current = item.projectId === projectId;
          return (
            <li key={item.projectId}>
              <a
                className="facet-map__item"
                href={projectPath(item.projectId)}
                aria-current={current ? 'true' : undefined}
                data-highlight={item.projectId === highlightId ? '' : undefined}
                style={item.color ? { '--facet-map-item-color': item.color } : undefined}
                onClick={inPageLinkHandler(() => choose(item.projectId))}
                onPointerEnter={() => setHighlightId(item.projectId)}
                onPointerLeave={() => setHighlightId(null)}
                onFocus={() => setHighlightId(item.projectId)}
                onBlur={() => setHighlightId(null)}
              >
                <span className="facet-map__name type-headline-xs">{item.label}</span>
              </a>
            </li>
          );
        })}
      </ol>

      <a
        className="facet-map__overview type-subhead-sm"
        href={pathFor(NAVIGATION_DESTINATIONS.OVERVIEW)}
        onClick={inPageLinkHandler(() => {
          closeIndex();
          onSelectOverview?.();
        })}
      >
        {VIEW_ALL_WORK_LABEL}
        <span aria-hidden="true">&rarr;</span>
      </a>
    </div>
  );

  const triggerLabel = project
    ? `Project index. Current project: ${project.label}`
    : 'Project index';

  return (
    <div
      ref={rootRef}
      className="facet-map"
      data-shown={shown ? '' : undefined}
      data-open={open ? '' : undefined}
      data-layout={compact ? 'button' : 'dock'}
      data-place={compact ? 'bottom' : undefined}
      data-motion={reducedMotion ? undefined : ''}
      aria-hidden={shown ? undefined : true}
      style={compact && colors ? { '--facet-map-fill': colors.fg, '--facet-map-ink': colors.bg } : undefined}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onBlur={onBlur}
    >
      <button
        ref={triggerRef}
        type="button"
        className="facet-map__trigger"
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-controls={panelId}
        tabIndex={shown ? undefined : -1}
        onClick={onTriggerClick}
        onFocus={onTriggerFocus}
      >
        {/* On a phone, in the card's fill, as the CTA's label is. The dock is
            the index's own dark, whichever project: the white outlines, the
            current fragment in its colour. */}
        <FacetMapGlyph
          className="facet-map__trigger-map"
          currentId={projectId}
          variant={compact && colors ? 'ink' : 'button'}
          ink={colors?.bg}
          height={compact ? BUTTON_GLYPH_HEIGHT : DOCK_GLYPH_HEIGHT}
          animate={!reducedMotion}
        />
      </button>

      <nav id={panelId} className="facet-map__panel" aria-label="Project index" hidden={!open}>
        <SquircleSurface />
        {/* The names and the way to All Work, then the map beside them, which
            grows out of the button's (facet-map.css), and on a phone the close
            button, in the foot row where the disc was. */}
        {panelBody}
        <FacetMapGlyph
          className="facet-map__panel-map"
          currentId={projectId}
          highlightId={highlightId}
          height={compact ? PHONE_PANEL_GLYPH_HEIGHT : PANEL_GLYPH_HEIGHT}
          animate={!reducedMotion}
          onFragmentEnter={compact ? undefined : setHighlightId}
          onFragmentLeave={compact ? undefined : () => setHighlightId(null)}
          onFragmentClick={compact ? undefined : choose}
        />
        {compact && (
          <button
            type="button"
            className="facet-map__close"
            aria-label="Close project index"
            onClick={() => closeIndex({ returnFocus: true })}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </nav>
    </div>
  );
};

export default FacetMapNav;
