import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Headline from '../ui/Headline';
import { MQ_HOVER_CAPABLE } from '../../config/breakpoints';
import {
  OVERVIEW_COLUMN,
  OVERVIEW_RAIL_GAP_PX,
  OVERVIEW_RAIL_X_FALLBACK_VW,
} from '../../config/overviewLayout';
import { useLayoutConfig } from '../../hooks/useLayoutConfig';
import { getProjectIdBySceneFacetKey } from '../../data/projects';
import { setRailActiveProject, setRailOverviewVisible } from '../../lib/verticalRailSignal';
import '../../styles/facet-label.css';

// The column hangs off the vertical energy line, which publishes its measured x
// as `--overview-rail-x` — so the labels sit beside the line rather than the line
// having to travel to them.
const OVERVIEW_COLUMN_LEFT = `calc(var(--overview-rail-x, ${OVERVIEW_RAIL_X_FALLBACK_VW}vw) + ${OVERVIEW_RAIL_GAP_PX}px)`;

// Stagger between label reveals during the hero → overview transition. Applied as
// a transition-delay on the existing container fade, so it rides that transition
// rather than introducing a second, independent timer.
const LABEL_REVEAL_STAGGER_MS = 70;

const LABEL_FADE_IN_MS = 800;
const LABEL_FADE_OUT_MS = 200;

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

  return (
    <div
      className="facet-label-optimized"
      onPointerEnter={() => onHover?.(runtimeKey, true)}
      onPointerLeave={() => onHover?.(runtimeKey, false)}
      onClick={onClick}
      // Read by VerticalEnergyLine to measure the active strip's bounds — this
      // element spans exactly the title through the bottom of the subhead.
      data-rail-project={runtimeKey}
      style={{
        opacity: isRevealed ? 1 : 0,
        transition: `opacity ${revealDurationMs}ms ease ${isRevealed ? revealDelayMs : 0}ms`,
        '--headline-ink': isDisplayActive ? project.headlineColor : '#ffffff',
        '--headline-glow1': isDisplayActive ? project.headlineColor : '#ffffff',
        '--headline-glow2': isDisplayActive ? project.headlineColor : '#ffffff',
        '--headline-glow-strength': isDisplayActive ? 0.38 : 0.2,
        '--headline-transition-out': `${transitionMs}ms`,
        textAlign: 'left',
        width: '100%',
        cursor: 'pointer'
      }}
    >
      <div ref={titleRef} data-facet-key={runtimeKey}>
        <Headline
          as="h3"
          className="label-title"
          style={{ margin: 0 }}
        >
          {project.label}
        </Headline>
      </div>
      <div className="label-description">{project.tagline}</div>
    </div>
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
}) {
  const [anchorsReady, setAnchorsReady] = useState(false);
  const [visible, setVisible] = useState(false);
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

  useEffect(() => {
    if (!inActiveOverview || !projects?.length) return;
    const firstFacetKey = projects[0].facetKey || projects[0].id;
    const section = document.getElementById(`project-${firstFacetKey}`);
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.1) {
          setFadeDurationMs(LABEL_FADE_OUT_MS);
          setVisible(false);
          setLabelHoveredFacetKey(null);
          onLabelsReadyChange?.(false);
        } else {
          setFadeDurationMs(LABEL_FADE_IN_MS);
          setVisible(true);
          onLabelsReadyChange?.(false);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [inActiveOverview, onLabelsReadyChange, projects]);

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

    rootRef.current.render(
      <>
        <div
          ref={labelLayerContentRef}
          onTransitionEnd={(event) => {
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
          }}
          style={{
            position: 'absolute',
            width: variant === 'desktop' ? `${OVERVIEW_COLUMN.widthVw}vw` : '100%',
            right: variant === 'desktop' ? 'auto' : 0,
            left: variant === 'desktop' ? OVERVIEW_COLUMN_LEFT : 0,
            top: variant === 'desktop' ? '50%' : 'auto',
            bottom: variant === 'desktop' ? 'auto' : 'calc(4.75rem + env(safe-area-inset-bottom, 0px))',
            transform: variant === 'desktop' ? 'translateY(-50%)' : 'none',
            paddingLeft: variant === 'desktop' ? 0 : '16px',
            paddingRight: variant === 'desktop' ? 0 : '16px',
            opacity: visible ? 1 : 0,
            transition: `opacity ${fadeDurationMs}ms`,
            display: 'flex',
            flexDirection: 'column',
            gap: variant === 'desktop' ? '1.5rem' : '0.8rem',
            alignItems: 'flex-start',
            textAlign: 'left',
            boxSizing: 'border-box',
            pointerEvents: visible ? 'auto' : 'none',
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
        </div>

      </>,
    );
  }, [
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
    variant,
    visible,
  ]);

  return null;
});

export default FacetLabels;
