// src/components/facetMap/FacetMapNav.jsx
//
// The facet map beside a project preview or a case study, and the button that
// opens the project index. See docs/facet-map.md. Two layouts, by width:
//
// In the gutter (MQ_FACET_MAP_GUTTER, 1230px and up): fixed in the middle of the
// left gutter, level with the preview titles (useFacetMapHeight), the same on a
// case study.
//
// The button (narrower, and every phone): a dark disc with the map inside it.
// On a phone it has the bottom right to itself, on a preview and a case study
// alike: the last row of the screen, beside the project card's CTA or across
// from the case study's close button, the same height and the same distance
// from the edges, so it never moves. It takes the CTA's colours there (the
// card's ink, the map drawn in the card's fill). On a tablet it sits at the top
// right under the nav.
//
// A tap opens the index from it: the map, "Projects", a close button where the
// disc was, the six projects in rows at least 50px tall, and the way to the
// overview. At the top it drops down; at the bottom it rises, the header at its
// foot, so the close button is still where the disc was. Only a tap or the
// keyboard opens it; it never takes a swipe, so the page scrolls under the
// reader's thumb as before, and a touch anywhere outside closes it.
//
// In the gutter the index opens on hover, on keyboard focus, or on a click, as a card that
// grows out of the map into the page: the map again, larger, beside the six
// projects by name, the current one in its own colour (projects.js), and a way
// to the crystal overview. Pointing at a name or a fragment lights that fragment
// without selecting anything. Choosing a project goes to its preview (from a case
// study, closing it first); choosing the current one only closes the index.
// Escape, a click outside (which does nothing else), the page scrolling, or the
// pointer leaving closes it.
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
import { MQ_DESKTOP, MQ_FACET_MAP_GUTTER, MQ_REDUCED_MOTION } from '../../config/breakpoints';
import { getProjectByAnyKey } from '../../data/projects';
import { getScrimTone } from '../../legibility/scrimTone';
import { projectCardColors } from '../../lib/projectCardColors';
import { pathFor, projectPath } from '../../navigation/routes';
import { NAVIGATION_DESTINATIONS } from '../../navigation/navigationIntent';
import { inPageLinkHandler } from '../../navigation/linkClick';
import '../../styles/facet-map.css';

/** The map's height in the gutter: about the capital height of a preview title. */
const GLYPH_HEIGHT = 68;
/** The map's height in the index. */
const INDEX_GLYPH_HEIGHT = 101;
/** The map's height in the button's disc, chosen on device. */
const BUTTON_GLYPH_HEIGHT = 32;
/** The map's height in the dropped index's header. */
const DROP_GLYPH_HEIGHT = 40;

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
  const compact = !useMediaQuery(MQ_FACET_MAP_GUTTER);
  // The portfolio's phone layout, the one with the project card.
  const phone = !useMediaQuery(MQ_DESKTOP);
  const { visible, projectId } = selection;
  const project = projectId ? getProjectByAnyKey(projectId) : null;

  // Where the button sits: in the bottom row on a phone, at the top on a tablet.
  const place = compact ? (phone ? 'bottom' : 'top') : null;

  // The gutter's place is level with the titles; the button's is fixed.
  const mapY = useFacetMapHeight({ visible: visible && !compact, projectId });
  const shown = visible && (compact || mapY !== null);

  // Over a preview whose copy is set dark (a light scrim), the outlines take
  // that ink too. Held through a move, when no project is marked, so they don't
  // flash white on the way out.
  const toneProjectRef = useRef(null);
  if (projectId) toneProjectRef.current = projectId;
  const tone = toneProjectRef.current ? getScrimTone(toneProjectRef.current) : null;
  const restInk = tone?.inverted ? tone.ink : null;
  // In the bottom row, the card CTA's colours: the disc in the card's ink, the
  // map in its fill. Held through a move as the outlines are.
  const tonedProject = toneProjectRef.current ? getProjectByAnyKey(toneProjectRef.current) : null;
  const discColors = place === 'bottom' && tonedProject ? projectCardColors(tonedProject) : null;

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
  }, [compact, place, closeIndex]);

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

  // Hover opens the gutter's index only. The button is a tap target, and a
  // mouse at a narrow window clicks it like one.
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
        View crystal overview
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
      data-layout={compact ? 'button' : 'gutter'}
      data-place={place ?? undefined}
      data-motion={reducedMotion ? undefined : ''}
      aria-hidden={shown ? undefined : true}
      style={{
        ...(!compact && mapY !== null && { '--facet-map-y': `${mapY}px` }),
        ...(discColors && { '--facet-map-disc-fill': discColors.fg }),
      }}
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
        {compact && discColors ? (
          // On the CTA's fill, in the card's colour, as the CTA's label is.
          <FacetMapGlyph
            currentId={projectId}
            variant="ink"
            ink={discColors.bg}
            height={BUTTON_GLYPH_HEIGHT}
            animate={!reducedMotion}
          />
        ) : compact ? (
          // On its own dark disc: the colour variant's white outlines, whatever
          // the page under it.
          <FacetMapGlyph
            currentId={projectId}
            variant="button"
            height={BUTTON_GLYPH_HEIGHT}
            animate={!reducedMotion}
          />
        ) : (
          <FacetMapGlyph
            currentId={projectId}
            variant={ink ? 'ink' : 'color'}
            ink={ink || undefined}
            restInk={restInk}
            height={GLYPH_HEIGHT}
            animate={!reducedMotion}
          />
        )}
      </button>

      <nav id={panelId} className="facet-map__panel" aria-label="Project index" hidden={!open}>
        <SquircleSurface />
        {/* Rising from the bottom, the header is at the foot (CSS), its close
            button where the disc was; the order here follows, so the tab order
            reads as the eye does. */}
        {place === 'bottom' && panelBody}
        {compact ? (
          <div className="facet-map__panel-head">
            <FacetMapGlyph
              currentId={projectId}
              highlightId={highlightId}
              variant="button"
              height={DROP_GLYPH_HEIGHT}
              animate={!reducedMotion}
            />
            <span className="facet-map__panel-title type-caption-caps">Projects</span>
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
          </div>
        ) : (
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
        )}
        {place !== 'bottom' && panelBody}
      </nav>
    </div>
  );
};

export default FacetMapNav;
