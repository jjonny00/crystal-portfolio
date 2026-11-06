// src/components/facetMap/FacetMapNav.jsx
//
// The facet map on desktop: fixed in the left gutter beside a project preview or
// a case study, and the button that opens the project index. See
// docs/facet-map.md.
//
// Where it sits is useFacetMapHeight's (level with the preview titles, in the
// middle of the gutter, the same on a case study). Below the width where the
// gutter can hold it (facet-map.css) it is not shown; the phone's button is the
// next stage.
//
// The index opens on hover, on keyboard focus, or on a click, as a card that
// grows out of the map into the page: the map again, larger, beside the six
// projects by number and name, the current one marked "You are here", and a way
// to the crystal overview. Pointing at a name or a fragment lights that fragment
// without selecting anything. Choosing a project goes to its preview (from a case
// study, closing it first); choosing the current one only closes the index.
// Escape, a click outside, or the pointer leaving closes it.
//
// The card covers the map it grew from, so the pointer's path from one to the
// other never crosses a gap, and leaving waits a moment before closing, so a
// pointer that strays off an edge and comes back finds it still open.

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import FacetMapGlyph from './FacetMapGlyph';
import useFacetMapHeight from './useFacetMapHeight';
import SquircleSurface from '../ui/SquircleSurface';
import { FACET_MAP_ORDER } from './facetMapData';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MQ_REDUCED_MOTION } from '../../config/breakpoints';
import { getProjectByAnyKey } from '../../data/projects';
import { getScrimTone } from '../../legibility/scrimTone';
import { pathFor, projectPath } from '../../navigation/routes';
import { NAVIGATION_DESTINATIONS } from '../../navigation/navigationIntent';
import { inPageLinkHandler } from '../../navigation/linkClick';
import '../../styles/facet-map.css';

/** The map's height in the gutter: about the capital height of a preview title. */
const GLYPH_HEIGHT = 68;
/** The map's height in the index. */
const INDEX_GLYPH_HEIGHT = 101;

/** How long the pointer can be off the map and the index before it closes. */
const LEAVE_CLOSE_MS = 240;

const INDEX = FACET_MAP_ORDER.map((projectId, index) => ({
  projectId,
  number: String(index + 1).padStart(2, '0'),
  label: getProjectByAnyKey(projectId)?.label ?? projectId,
}));

const FacetMapNav = ({
  /** From useFacetMapSelection. */
  selection,
  /**
   * The case study's ink under the map, or null over the scene. Set, the map
   * draws in that ink rather than in project colour.
   */
  ink = null,
  /** Go to a project's preview (App closes an open case study first). */
  onSelectProject,
  /** Go to the crystal overview. */
  onSelectOverview,
}) => {
  const reducedMotion = useMediaQuery(MQ_REDUCED_MOTION);
  const { visible, projectId } = selection;
  const project = projectId ? getProjectByAnyKey(projectId) : null;
  const mapY = useFacetMapHeight(selection);
  const shown = visible && mapY !== null;

  // Over a preview whose copy is set dark (a light scrim), the outlines take
  // that ink too. Held through a move, when no project is marked, so they don't
  // flash white on the way out.
  const toneProjectRef = useRef(null);
  if (projectId) toneProjectRef.current = projectId;
  const tone = toneProjectRef.current ? getScrimTone(toneProjectRef.current) : null;
  const restInk = tone?.inverted ? tone.ink : null;

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

  // Escape and a click outside, while open.
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      closeIndex({ returnFocus: rootRef.current?.contains(document.activeElement) });
    };
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) closeIndex();
    };
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [open, closeIndex]);

  const onPointerEnter = (event) => {
    if (event.pointerType === 'touch') return;
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
    if (!refocusingRef.current && event.target.matches?.(':focus-visible')) openIndex('pinned');
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

  const triggerLabel = project
    ? `Project index. Current project: ${project.label}`
    : 'Project index';

  return (
    <div
      ref={rootRef}
      className="facet-map"
      data-shown={shown ? '' : undefined}
      data-open={open ? '' : undefined}
      data-motion={reducedMotion ? undefined : ''}
      aria-hidden={shown ? undefined : true}
      style={mapY !== null ? { '--facet-map-y': `${mapY}px` } : undefined}
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
        <FacetMapGlyph
          currentId={projectId}
          variant={ink ? 'ink' : 'color'}
          ink={ink || undefined}
          restInk={restInk}
          height={GLYPH_HEIGHT}
          animate={!reducedMotion}
        />
      </button>

      <nav id={panelId} className="facet-map__panel" aria-label="Project index" hidden={!open}>
        <SquircleSurface />
        <FacetMapGlyph
          className="facet-map__panel-map"
          currentId={projectId}
          highlightId={highlightId}
          height={INDEX_GLYPH_HEIGHT}
          animate={!reducedMotion}
          onFragmentEnter={setHighlightId}
          onFragmentLeave={() => setHighlightId(null)}
          onFragmentClick={choose}
        />

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
                    onClick={inPageLinkHandler(() => choose(item.projectId))}
                    onPointerEnter={() => setHighlightId(item.projectId)}
                    onPointerLeave={() => setHighlightId(null)}
                    onFocus={() => setHighlightId(item.projectId)}
                    onBlur={() => setHighlightId(null)}
                  >
                    <span className="facet-map__number type-caption-caps" aria-hidden="true">
                      {item.number}
                    </span>
                    <span className="facet-map__name type-headline-xs">{item.label}</span>
                    {current && (
                      <span className="facet-map__here type-caption-caps">You are here</span>
                    )}
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
            View crystal overview
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </nav>
    </div>
  );
};

export default FacetMapNav;
