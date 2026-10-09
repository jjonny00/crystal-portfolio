import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useFrame, useThree } from '@react-three/fiber';
import { Box3, Vector3 } from 'three';
import Headline from '../ui/Headline';
import { MQ_HOVER_CAPABLE } from '../../config/breakpoints';
import {
  OVERVIEW_COLUMN,
  OVERVIEW_COLUMN_RIGHT_MOBILE_PX,
  OVERVIEW_RAIL_GAP_MOBILE_PX,
  OVERVIEW_RAIL_GAP_PX,
  OVERVIEW_RAIL_X_FALLBACK_MOBILE_PX,
  OVERVIEW_RAIL_X_FALLBACK_VW,
} from '../../config/overviewLayout';
import { useLayoutConfig } from '../../hooks/useLayoutConfig';
import { getProjectIdBySceneFacetKey, getSceneFacetKeyByProjectId } from '../../data/projects';
import PlacedOverviewLabels from './PlacedOverviewLabels';
import { OVERVIEW_LABEL_DEFAULTS } from './overviewLabelPlacement';
import { setRailActiveProject, setRailOverviewVisible } from '../../lib/verticalRailSignal';
import { inPageLinkHandler } from '../../navigation/linkClick';
import { projectPath } from '../../navigation/routes';
import '../../styles/facet-label.css';

// The column hangs off the vertical energy line, which publishes its measured x
// as `--overview-rail-x` — so the labels sit beside the line rather than the line
// having to travel to them. True on mobile as well, where the line runs just
// inside the left margin and the labels take the rest of the width.
const OVERVIEW_COLUMN_LEFT = `calc(var(--overview-rail-x, ${OVERVIEW_RAIL_X_FALLBACK_VW}vw) + ${OVERVIEW_RAIL_GAP_PX}px)`;
const OVERVIEW_COLUMN_LEFT_MOBILE = `calc(var(--overview-rail-x, ${OVERVIEW_RAIL_X_FALLBACK_MOBILE_PX}px) + ${OVERVIEW_RAIL_GAP_MOBILE_PX}px)`;

// Stagger between label reveals during the hero → overview transition. Applied as
// a transition-delay on the existing container fade, so it rides that transition
// rather than introducing a second, independent timer.
const LABEL_REVEAL_STAGGER_MS = 70;

const LABEL_FADE_IN_MS = 800;
const LABEL_FADE_OUT_MS = 200;

// Placed labels only re-render for a fragment that has moved by more than this.
const POINT_EPSILON_PX = 0.75;

// Each fragment's middle, found once as its bounding box's centre and kept in
// the fragment's own space so it stays a fixed point on the fragment.
const fragmentMiddles = new WeakMap();
const _box = new Box3();
const _point = new Vector3();

// Where each fragment's middle is on screen, in viewport px, keyed like the
// projects. Null until every fragment is there to measure.
const measureFragmentPoints = ({ projects, facetRefs, facetKeys, camera, size, canvasRect }) => {
  const points = {};
  camera.updateMatrixWorld();
  for (const project of projects) {
    const runtimeKey = project.facetKey || project.id;
    const sceneKey = getSceneFacetKeyByProjectId(runtimeKey) || runtimeKey;
    const index = facetKeys?.indexOf(sceneKey) ?? -1;
    const facet = index === -1 ? null : facetRefs?.current?.[index]?.current;
    if (!facet) return null;
    let local = fragmentMiddles.get(facet);
    if (!local) {
      facet.updateWorldMatrix(true, true);
      _box.setFromObject(facet);
      if (_box.isEmpty()) return null;
      local = facet.worldToLocal(_box.getCenter(new Vector3()));
      fragmentMiddles.set(facet, local);
    }
    facet.updateWorldMatrix(true, false);
    _point.copy(local).applyMatrix4(facet.matrixWorld).project(camera);
    points[runtimeKey] = {
      x: canvasRect.left + ((_point.x + 1) / 2) * size.width,
      y: canvasRect.top + ((1 - _point.y) / 2) * size.height,
    };
  }
  return points;
};

const samePoints = (a, b) =>
  Boolean(a && b) &&
  Object.keys(b).every(
    (key) => a[key] && Math.abs(a[key].x - b[key].x) < POINT_EPSILON_PX && Math.abs(a[key].y - b[key].y) < POINT_EPSILON_PX,
  );

const OptimizedLabel = React.memo(function OptimizedLabel({
  project,
  titleRef,
  onHover,
  onClick,
  isTargetActive = false,
  isRevealed = true,
  revealDelayMs = 0,
  revealDurationMs = 800,
}) {
  const FADE_IN_MS = 120;
  const FADE_OUT_MS = 1300;
  const runtimeKey = project.facetKey || project.id;
  const [isDisplayActive, setIsDisplayActive] = useState(false);
  const [transitionMs, setTransitionMs] = useState(FADE_OUT_MS);
  const fadeInTimeoutRef = useRef(null);
  const pendingFadeOutRef = useRef(false);

  useEffect(() => {
    if (isTargetActive) {
      pendingFadeOutRef.current = false;
      if (fadeInTimeoutRef.current) {
        clearTimeout(fadeInTimeoutRef.current);
      }

      setTransitionMs(FADE_IN_MS);
      setIsDisplayActive(true);

      fadeInTimeoutRef.current = setTimeout(() => {
        fadeInTimeoutRef.current = null;
        if (pendingFadeOutRef.current) {
          pendingFadeOutRef.current = false;
          setTransitionMs(FADE_OUT_MS);
          setIsDisplayActive(false);
        }
      }, FADE_IN_MS);
      return;
    }

    if (fadeInTimeoutRef.current) {
      pendingFadeOutRef.current = true;
      return;
    }

    pendingFadeOutRef.current = false;
    setTransitionMs(FADE_OUT_MS);
    setIsDisplayActive(false);
  }, [isTargetActive]);

  useEffect(() => () => {
    if (fadeInTimeoutRef.current) {
      clearTimeout(fadeInTimeoutRef.current);
    }
  }, []);

  // A list item, not a heading: the project sections below carry each project's
  // heading, and the overview is the list of them. Each one is a link to the
  // project's own URL, so the list is the site's index of its work for anything
  // that follows links; a plain click still flies the camera in place.
  return (
    <li
      className="facet-label-optimized"
      onPointerEnter={() => onHover?.(runtimeKey, true)}
      onPointerLeave={() => onHover?.(runtimeKey, false)}
      // Read by VerticalEnergyLine to measure the active strip's bounds — this
      // element spans exactly the title through the bottom of the subhead.
      data-rail-project={runtimeKey}
      style={{
        opacity: isRevealed ? 1 : 0,
        transition: `opacity ${revealDurationMs}ms ease ${isRevealed ? revealDelayMs : 0}ms`,
        '--headline-ink': isDisplayActive ? project.headlineColor : '#ffffff',
        '--headline-transition-out': `${transitionMs}ms`,
        textAlign: 'left',
        width: '100%',
        cursor: 'pointer'
      }}
    >
      <a
        href={projectPath(runtimeKey)}
        onClick={inPageLinkHandler(onClick)}
        style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}
      >
        <div ref={titleRef} data-facet-key={runtimeKey}>
          <Headline
            as="p"
            className="type-headline-sm label-title"
            style={{ margin: 0 }}
          >
            {project.label}
          </Headline>
        </div>
        <p className="type-subhead-sm label-description">{project.tagline}</p>
      </a>
    </li>
  );
});

const FacetLabels = React.memo(function FacetLabels({
  projects = [],
  onSelectProject,
  onHoverChange,
  hoveredFacetKey: externallyHoveredFacetKey = null,
  animationData,
  performanceProfile,
  onDomAnchorChange,
  alwaysOnFacetKey,
  onAlwaysOnDomAnchorChange,
  onLabelsReadyChange,
  // Released partway through the hero -> overview explosion, once the facets have
  // all but reached their anchors — UnifiedCrystalScene owns that clock and the
  // exact point (LABEL_REVEAL_EXPLOSION_FRACTION). The labels wait for it rather
  // than fading up over facets still in flight. Defaults true so a caller that
  // does not pass it gets the old behaviour instead of labels that never appear.
  labelRevealReady = true,
  // For placed labels, which sit beside their fragments.
  facetRefs,
  facetKeys,
}) {
  const [anchorsReady, setAnchorsReady] = useState(false);
  const [visible, setVisible] = useState(false);
  // What the scroll position says, kept apart from whether the labels are up.
  // See the two effects below for why the decision cannot live in the observer.
  const [firstProjectClear, setFirstProjectClear] = useState(false);
  const [fadeDurationMs, setFadeDurationMs] = useState(LABEL_FADE_IN_MS);
  const [hoverCapable, setHoverCapable] = useState(false);
  const [labelHoveredFacetKey, setLabelHoveredFacetKey] = useState(null);
  const titleRefs = useRef(new Map());
  const layerRef = useRef(null);
  const rootRef = useRef(null);
  const fadeTimeoutRef = useRef(null);
  const labelLayerContentRef = useRef(null);

  const inActiveOverview =
    animationData?.currentZone === 'overview' &&
    animationData?.crystalForm === 'exploded' &&
    animationData?.isTransitioning === false;

  const { variant, layout, error } = useLayoutConfig();
  const overviewWorld = layout?.anchors?.overviewWorld;
  // `list` is the column (desktop) or glass card (mobile); `placed` sets each
  // label beside its fragment (PlacedOverviewLabels).
  const labelConfig = useMemo(
    () => ({ ...OVERVIEW_LABEL_DEFAULTS, ...(layout?.overviewLabels || {}) }),
    [layout],
  );
  const placed = labelConfig.mode === 'placed';

  // Placed labels: where the fragments are on screen. Measured from the moment
  // the labels are about to come up until they have finished fading in (the
  // fragments are still settling from the explosion), and again after a
  // resize; held still otherwise, so labels and lines do not ride the
  // fragments' idle drift.
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const [fragmentPoints, setFragmentPoints] = useState(null);
  const [canvasRect, setCanvasRect] = useState({ left: 0, top: 0, width: 0 });
  const measureUntilRef = useRef(0);

  useEffect(() => {
    const rect = gl.domElement.getBoundingClientRect();
    setCanvasRect({ left: rect.left, top: rect.top, width: rect.width });
  }, [gl, size]);

  useEffect(() => {
    if (!placed || !inActiveOverview || !labelRevealReady) return;
    measureUntilRef.current =
      performance.now() + LABEL_FADE_IN_MS + LABEL_REVEAL_STAGGER_MS * projects.length + 200;
  }, [inActiveOverview, labelRevealReady, placed, projects.length, size]);

  useFrame(() => {
    if (!placed || performance.now() > measureUntilRef.current) return;
    const next = measureFragmentPoints({ projects, facetRefs, facetKeys, camera, size, canvasRect });
    if (next) setFragmentPoints((previous) => (samePoints(previous, next) ? previous : next));
  });

  // The single active project, however it was activated: hovering the label here,
  // or hovering the matching facet in the scene (which arrives as
  // `externallyHoveredFacetKey` from the shared hover-source state in
  // UnifiedCrystalScene). Same expression the labels use for their own active
  // treatment, so label and strip can never disagree.
  const activeRuntimeKey = useMemo(() => {
    if (labelHoveredFacetKey) return labelHoveredFacetKey;
    if (!externallyHoveredFacetKey) return null;
    return getProjectIdBySceneFacetKey(externallyHoveredFacetKey) || externallyHoveredFacetKey;
  }, [externallyHoveredFacetKey, labelHoveredFacetKey]);

  const activeProjectColor = useMemo(
    () => projects.find((project) => (project.facetKey || project.id) === activeRuntimeKey)?.color ?? null,
    [activeRuntimeKey, projects]
  );

  // Publish to the vertical energy line. It renders in App's tree, so it cannot
  // read this component's state directly (this layer lives in its own React
  // root); the snapshot store keeps that one-way and re-render free.
  useEffect(() => {
    const railVisible = inActiveOverview && visible;
    setRailOverviewVisible(railVisible);

    if (!railVisible) {
      setRailActiveProject(null, null);
      return;
    }

    const activeProject = projects.find(
      (project) => (project.facetKey || project.id) === activeRuntimeKey
    );
    setRailActiveProject(
      activeProject ? (activeProject.facetKey || activeProject.id) : null,
      activeProject?.color ?? null
    );
  }, [activeRuntimeKey, inActiveOverview, projects, visible]);

  useEffect(() => () => {
    setRailOverviewVisible(false);
    setRailActiveProject(null, null);
  }, []);

  const emitDomAnchorPoint = useCallback((facetKey) => {
    if (!hoverCapable || !onDomAnchorChange || !facetKey) return;
    const titleEl = titleRefs.current.get(facetKey);
    if (!titleEl) return;

    const rect = titleEl.getBoundingClientRect();
    onDomAnchorChange(facetKey, {
      x: rect.left,
      y: rect.top + rect.height * 0.5,
    });
  }, [hoverCapable, onDomAnchorChange]);

  const emitAlwaysOnDomAnchorPoint = useCallback((facetKey) => {
    if (!onAlwaysOnDomAnchorChange || !facetKey) return;
    const titleEl = titleRefs.current.get(facetKey);
    if (!titleEl) return;

    const rect = titleEl.getBoundingClientRect();
    onAlwaysOnDomAnchorChange(facetKey, {
      x: rect.left,
      y: rect.top + rect.height * 0.5,
    });
  }, [onAlwaysOnDomAnchorChange]);

  // Labels are positioned statically via CSS; this only gates whether the label
  // layer renders, mirroring the old "anchor positions computed" readiness check
  // (true iff the layout actually provides overview anchors).
  const markAnchorsReady = useCallback(() => {
    setAnchorsReady(Boolean(overviewWorld) && Object.keys(overviewWorld).length > 0);
  }, [overviewWorld]);

  useEffect(() => {
    const hoverMq = window.matchMedia(MQ_HOVER_CAPABLE);

    const syncHoverState = () => {
      setHoverCapable(hoverMq.matches);
    };

    syncHoverState();
    hoverMq.addEventListener('change', syncHoverState);

    return () => {
      hoverMq.removeEventListener('change', syncHoverState);
    };
  }, []);

  useEffect(() => {
    if (!inActiveOverview) {
      setFadeDurationMs(LABEL_FADE_OUT_MS);
      setVisible(false);
      setLabelHoveredFacetKey(null);
      onDomAnchorChange?.(null, null);
      onAlwaysOnDomAnchorChange?.(null, null);
      onLabelsReadyChange?.(false);
      clearTimeout(fadeTimeoutRef.current);
      // Outlasts the fade above — the opacity: 0 render lands a commit after this
      // timer is armed, so tearing down at exactly the fade duration would clip
      // the last frames of it.
      fadeTimeoutRef.current = setTimeout(() => {
        rootRef.current?.render(null);
        rootRef.current?.unmount();
        layerRef.current?.remove();
        rootRef.current = null;
        layerRef.current = null;
      }, LABEL_FADE_OUT_MS + 160);
      return;
    }

    clearTimeout(fadeTimeoutRef.current);

    if (!rootRef.current) {
      const layer = document.createElement('div');
      layer.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:20';
      document.body.appendChild(layer);
      layerRef.current = layer;
      rootRef.current = createRoot(layer);
    }

    markAnchorsReady();
  }, [markAnchorsReady, inActiveOverview, onAlwaysOnDomAnchorChange, onDomAnchorChange, onLabelsReadyChange]);

  // Reports the scroll position and nothing else. The reveal decision moved to the
  // effect below because an observer only fires when the intersection CHANGES:
  // deciding here would strand the labels hidden whenever `labelRevealReady` turned
  // true after the last crossing — which on the hero -> overview path it always
  // does, since the crossing starts the explosion that the labels are waiting on.
  useEffect(() => {
    if (!inActiveOverview || !projects?.length) return;
    const firstFacetKey = projects[0].facetKey || projects[0].id;
    const section = document.getElementById(`project-${firstFacetKey}`);
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setFirstProjectClear(entry.intersectionRatio < 0.1),
      { threshold: 0.1 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [inActiveOverview, projects]);

  // Labels are up only once the overview is clear of the first project section AND
  // the explosion has released them. Leaving the overview is not handled here — the
  // teardown effect above owns that, including the fade-out it has to paint before
  // unmounting the layer.
  useEffect(() => {
    if (!inActiveOverview) return;

    if (firstProjectClear && labelRevealReady) {
      setFadeDurationMs(LABEL_FADE_IN_MS);
      setVisible(true);
      onLabelsReadyChange?.(false);
      return;
    }

    setFadeDurationMs(LABEL_FADE_OUT_MS);
    setVisible(false);
    setLabelHoveredFacetKey(null);
    onLabelsReadyChange?.(false);
  }, [labelRevealReady, firstProjectClear, inActiveOverview, onLabelsReadyChange]);

  useEffect(() => {
    if (!inActiveOverview || !visible) return;
    onLabelsReadyChange?.(false);

    const rafA = requestAnimationFrame(() => {
      const node = labelLayerContentRef.current;
      if (!node) return;
      requestAnimationFrame(() => {
        const computed = window.getComputedStyle(node);
        if (computed.opacity === '1') {
          const alwaysOnKey = alwaysOnFacetKey || projects[0]?.facetKey || projects[0]?.id;
          if (alwaysOnKey) {
            emitAlwaysOnDomAnchorPoint(alwaysOnKey);
          }
          onLabelsReadyChange?.(true);
        }
      });
    });

    return () => cancelAnimationFrame(rafA);
  }, [alwaysOnFacetKey, emitAlwaysOnDomAnchorPoint, inActiveOverview, onLabelsReadyChange, projects, visible]);

  useEffect(() => {
    if (!inActiveOverview || !visible) return undefined;
    const alwaysOnKey = alwaysOnFacetKey || projects[0]?.facetKey || projects[0]?.id;
    if (!alwaysOnKey) return undefined;

    const handleResize = () => {
      emitAlwaysOnDomAnchorPoint(alwaysOnKey);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [alwaysOnFacetKey, emitAlwaysOnDomAnchorPoint, inActiveOverview, projects, visible]);

  useEffect(() => {
    if (!hoverCapable || !labelHoveredFacetKey) return undefined;

    const handleResize = () => {
      emitDomAnchorPoint(labelHoveredFacetKey);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [emitDomAnchorPoint, hoverCapable, labelHoveredFacetKey]);

  useEffect(() => {
    // Deliberately NOT gated on `inActiveOverview`: leaving the overview sets
    // `visible` false and then unmounts this layer on a timer, and if the effect
    // bailed out here that opacity: 0 would never be painted — the layer would be
    // yanked at full opacity instead of fading. `visible` is what governs the
    // fade; the root's existence is what governs whether there is anything to
    // paint into.
    if (!rootRef.current) return;
    if (!layout || error) {
      rootRef.current.render(null);
      return;
    }
    if (
      performanceProfile?.simplifiedAnimations ||
      !anchorsReady
    ) {
      rootRef.current.render(null);
      return;
    }

    // Selecting a project jumps straight to its section, which may never bring the
    // FIRST project section far enough into view for the IntersectionObserver
    // above to fire. Start the same fade here so the labels always clear on the
    // way out, whether you scrolled to a project or picked one from this list.
    const handleSelect = (facetKey) => {
      setFadeDurationMs(LABEL_FADE_OUT_MS);
      setVisible(false);
      setLabelHoveredFacetKey(null);
      onSelectProject?.(facetKey);
    };

    const handleHover = (facetKey, isHovering) => {
      onHoverChange?.(facetKey, isHovering);

      if (!hoverCapable) {
        setLabelHoveredFacetKey(null);
        onDomAnchorChange?.(facetKey, null);
        return;
      }

      setLabelHoveredFacetKey(isHovering ? facetKey : null);
      if (isHovering) {
        emitDomAnchorPoint(facetKey);
      } else {
        onDomAnchorChange?.(facetKey, null);
      }
    };

    const handleLayerTransitionEnd = (event) => {
      // The labels themselves now fade with a stagger, and those transition
      // events bubble — only this container's own fade means "settled".
      if (event.target !== event.currentTarget) return;
      if (event.propertyName !== 'opacity') return;
      if (!visible) return;
      requestAnimationFrame(() => {
        const alwaysOnKey = alwaysOnFacetKey || projects[0]?.facetKey || projects[0]?.id;
        if (alwaysOnKey) {
          emitAlwaysOnDomAnchorPoint(alwaysOnKey);
        }
        onLabelsReadyChange?.(true);
      });
    };

    const activeRuntimeKeyNow =
      labelHoveredFacetKey ||
      getProjectIdBySceneFacetKey(externallyHoveredFacetKey) ||
      externallyHoveredFacetKey;

    if (placed) {
      rootRef.current.render(
        <PlacedOverviewLabels
          ref={labelLayerContentRef}
          onTransitionEnd={handleLayerTransitionEnd}
          projects={projects}
          points={fragmentPoints}
          config={labelConfig}
          canvas={canvasRect}
          visible={visible}
          fadeMs={fadeDurationMs}
          staggerMs={LABEL_REVEAL_STAGGER_MS}
          activeKey={activeRuntimeKeyNow}
          interactive={hoverCapable}
          onHover={handleHover}
          onSelect={handleSelect}
          labelRef={(runtimeKey, el) => {
            const title = el?.querySelector('[data-facet-key]');
            if (title) {
              titleRefs.current.set(runtimeKey, title);
            } else {
              titleRefs.current.delete(runtimeKey);
            }
          }}
        />,
      );
      return;
    }

    rootRef.current.render(
      <>
        <ul
          ref={labelLayerContentRef}
          onTransitionEnd={handleLayerTransitionEnd}
          // On mobile the list is its own glass card (glass-card.css), inset from
          // the screen edges, so the card fades in and out with the labels. Its
          // left padding keeps the text hanging off the energy line exactly where
          // it did without the card; the vertical padding is in facet-label.css.
          className={variant === 'desktop' ? undefined : 'glass-card'}
          aria-label="Selected work"
          style={{
            listStyle: 'none',
            margin: 0,
            position: 'absolute',
            width: variant === 'desktop' ? `${OVERVIEW_COLUMN.widthVw}vw` : 'auto',
            right: variant === 'desktop' ? 'auto' : 'var(--glass-card-inset)',
            left: variant === 'desktop' ? OVERVIEW_COLUMN_LEFT : 'var(--glass-card-inset)',
            top: variant === 'desktop' ? '50%' : 'auto',
            bottom: variant === 'desktop' ? 'auto' : 'calc(var(--glass-card-inset) + env(safe-area-inset-bottom, 0px))',
            transform: variant === 'desktop' ? 'translateY(-50%)' : 'none',
            // Desktop has no inset of its own: `left`/`right` above already place
            // the column, and padding would push the text off the line it hangs from.
            paddingLeft: variant === 'desktop' ? 0 : `calc(${OVERVIEW_COLUMN_LEFT_MOBILE} - var(--glass-card-inset) - 1px)`,
            paddingRight: variant === 'desktop' ? 0 : `${OVERVIEW_COLUMN_RIGHT_MOBILE_PX}px`,
            paddingTop: variant === 'desktop' ? 0 : 'var(--overview-card-pad-top)',
            paddingBottom: variant === 'desktop' ? 0 : 'var(--overview-card-pad-bottom)',
            // The card picks up the highlighted project's colour in its rim and
            // fill, easing between projects; unset, glass-card.css falls back to
            // a cool lavender.
            ...(variant !== 'desktop' && activeProjectColor && { '--glass-accent': activeProjectColor }),
            opacity: visible ? 1 : 0,
            transition: variant === 'desktop'
              ? `opacity ${fadeDurationMs}ms`
              : `opacity ${fadeDurationMs}ms, --glass-accent 500ms ease`,
            display: 'flex',
            flexDirection: 'column',
            // Mobile spacing lives with the label sizes in facet-label.css.
            gap: variant === 'desktop' ? '1.5rem' : 'var(--overview-label-gap)',
            alignItems: 'flex-start',
            textAlign: 'left',
            boxSizing: 'border-box',
            // Interactive for a mouse only. This column lives in a fixed portal on
            // document.body, not inside the scroll container, so a touch it captures
            // is a touch that can never scroll the page — a swipe that happens to
            // start on a label would just die there. On touch the labels go inert and
            // OverviewTouchPicker hit-tests them by rect instead, clicking through to
            // the same handler.
            pointerEvents: hoverCapable && visible ? 'auto' : 'none',
          }}
          data-rail-list
        >
          {projects.map((project, index) => {
            const runtimeKey = project.facetKey || project.id;
            const externallyHoveredRuntimeKey =
              getProjectIdBySceneFacetKey(externallyHoveredFacetKey) || externallyHoveredFacetKey;
            const isActive =
              externallyHoveredRuntimeKey === runtimeKey || labelHoveredFacetKey === runtimeKey;
            return (
            <OptimizedLabel
              key={runtimeKey}
              project={project}
              titleRef={(el) => {
                if (el) {
                  titleRefs.current.set(runtimeKey, el);
                } else {
                  titleRefs.current.delete(runtimeKey);
                }
              }}
              onHover={handleHover}
              onClick={() => handleSelect(runtimeKey)}
              isTargetActive={isActive}
              isRevealed={visible}
              revealDelayMs={index * LABEL_REVEAL_STAGGER_MS}
              revealDurationMs={fadeDurationMs}
            />
            );
          })}
        </ul>

      </>,
    );
  }, [
    activeProjectColor,
    anchorsReady,
    fadeDurationMs,
    hoverCapable,
    inActiveOverview,
    alwaysOnFacetKey,
    emitAlwaysOnDomAnchorPoint,
    emitDomAnchorPoint,
    error,
    layout,
    onDomAnchorChange,
    onSelectProject,
    onHoverChange,
    performanceProfile?.simplifiedAnimations,
    projects,
    onAlwaysOnDomAnchorChange,
    externallyHoveredFacetKey,
    labelHoveredFacetKey,
    canvasRect,
    fragmentPoints,
    labelConfig,
    placed,
    variant,
    visible,
  ]);

  return null;
});

export default FacetLabels;
