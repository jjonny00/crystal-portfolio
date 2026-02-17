import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useThree } from '@react-three/fiber';
import Headline from '../ui/Headline';
import { ANIMATION_CONFIG } from '../../hooks/useUnifiedAnimationController';
import { MQ_DESKTOP, MQ_HOVER_CAPABLE } from '../../config/breakpoints';
import { OVERVIEW_LAYOUT } from '../../config/overviewLayout';

const OptimizedLabel = React.memo(function OptimizedLabel({
  project,
  titleRef,
  onHover,
  onClick,
}) {
  const glow1 = project.headlineColor;
  const glow2 = project.headlineColor;

  return (
    <div
      className="facet-label-optimized"
      onPointerEnter={() => onHover?.(project.facetKey, true)}
      onPointerLeave={() => onHover?.(project.facetKey, false)}
      onClick={onClick}
      style={{
        '--headline-ink': project.headlineColor,
        '--headline-glow1': glow1,
        '--headline-glow2': glow2,
      }}
    >
      <div ref={titleRef}>
        <Headline
          as="h3"
          className="label-title"
          style={{ margin: 0, fontSize: '1.6rem' }}
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
  scrollToProgress,
  onHoverChange,
  animationData,
  performanceProfile,
}) {
  const { camera, size } = useThree();
  const [anchorScreenPositions, setAnchorScreenPositions] = useState({});
  const [visible, setVisible] = useState(false);
  const [fadeDuration, setFadeDuration] = useState(0.8);
  const [layoutMode, setLayoutMode] = useState('desktop');
  const [hoverCapable, setHoverCapable] = useState(false);
  const [hoveredFacetKey, setHoveredFacetKey] = useState(null);
  const [hoverLine, setHoverLine] = useState(null);
  const titleRefs = useRef(new Map());
  const layerRef = useRef(null);
  const rootRef = useRef(null);
  const fadeTimeoutRef = useRef(null);

  const inActiveOverview =
    animationData?.currentZone === 'overview' &&
    animationData?.crystalForm === 'exploded' &&
    animationData?.isTransitioning === false &&
    animationData?.cameraSettled === true;

  const activeLayout = useMemo(
    () => OVERVIEW_LAYOUT[layoutMode] ?? OVERVIEW_LAYOUT.desktop,
    [layoutMode],
  );

  const calculateAnchorPositions = useCallback(() => {
    const positions = {};
    Object.entries(activeLayout.anchors.overviewWorld).forEach(([facetKey, worldPos]) => {
      const projected = worldPos.clone().project(camera);
      positions[facetKey] = {
        x: (projected.x * 0.5 + 0.5) * size.width,
        y: (-projected.y * 0.5 + 0.5) * size.height,
      };
    });
    setAnchorScreenPositions(positions);
  }, [activeLayout, camera, size.height, size.width]);

  const recalcHoverLine = useCallback((facetKey) => {
    if (!facetKey || !hoverCapable) {
      setHoverLine(null);
      return;
    }

    const anchorPos = anchorScreenPositions[facetKey];
    const titleEl = titleRefs.current.get(facetKey);
    if (!anchorPos || !titleEl) {
      setHoverLine(null);
      return;
    }

    const rect = titleEl.getBoundingClientRect();
    setHoverLine({
      x1: anchorPos.x,
      y1: anchorPos.y,
      x2: rect.left,
      y2: rect.top + rect.height * 0.5,
    });
  }, [anchorScreenPositions, hoverCapable]);

  useEffect(() => {
    const desktopMq = window.matchMedia(MQ_DESKTOP);
    const hoverMq = window.matchMedia(MQ_HOVER_CAPABLE);

    const syncMediaState = () => {
      setLayoutMode(desktopMq.matches ? 'desktop' : 'mobile');
      setHoverCapable(hoverMq.matches);
    };

    syncMediaState();
    desktopMq.addEventListener('change', syncMediaState);
    hoverMq.addEventListener('change', syncMediaState);

    return () => {
      desktopMq.removeEventListener('change', syncMediaState);
      hoverMq.removeEventListener('change', syncMediaState);
    };
  }, []);

  useEffect(() => {
    if (!inActiveOverview) {
      setFadeDuration(0.2);
      setVisible(false);
      setHoveredFacetKey(null);
      setHoverLine(null);
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = setTimeout(() => {
        rootRef.current?.render(null);
        rootRef.current?.unmount();
        layerRef.current?.remove();
        rootRef.current = null;
        layerRef.current = null;
      }, 200);
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

    calculateAnchorPositions();
  }, [calculateAnchorPositions, inActiveOverview]);

  useEffect(() => {
    if (!inActiveOverview || !projects?.length) return;
    const firstFacetKey = projects[0].facetKey;
    const section = document.getElementById(`project-${firstFacetKey}`);
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.1) {
          setFadeDuration(0.2);
          setVisible(false);
          setHoveredFacetKey(null);
          setHoverLine(null);
        } else {
          setFadeDuration(0.8);
          setVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [inActiveOverview, projects]);

  useEffect(() => {
    if (!visible || !hoverCapable) {
      setHoverLine(null);
      return;
    }
    recalcHoverLine(hoveredFacetKey);
  }, [recalcHoverLine, hoveredFacetKey, visible, hoverCapable]);

  useEffect(() => {
    if (!rootRef.current || !inActiveOverview) return;
    if (
      performanceProfile?.simplifiedAnimations ||
      Object.keys(anchorScreenPositions).length === 0
    ) {
      rootRef.current.render(null);
      return;
    }

    const handleHover = (facetKey, isHovering) => {
      onHoverChange?.(facetKey, isHovering);

      if (!hoverCapable) {
        setHoveredFacetKey(null);
        setHoverLine(null);
        return;
      }

      setHoveredFacetKey(isHovering ? facetKey : null);
      if (!isHovering) {
        setHoverLine(null);
      }
    };

    rootRef.current.render(
      <>
        <div
          style={{
            position: 'absolute',
            width: activeLayout.labels.panelWidth,
            right: activeLayout.labels.right,
            top: activeLayout.labels.top,
            transform: activeLayout.labels.transform,
            opacity: visible ? 1 : 0,
            transition: `opacity ${fadeDuration}s`,
            pointerEvents: visible ? 'auto' : 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: activeLayout.labels.rowGap,
            alignItems: 'flex-end',
            textAlign: 'right',
          }}
        >
          {projects.map((project) => (
            <OptimizedLabel
              key={project.facetKey}
              project={project}
              titleRef={(el) => {
                if (el) {
                  titleRefs.current.set(project.facetKey, el);
                } else {
                  titleRefs.current.delete(project.facetKey);
                }
              }}
              onHover={handleHover}
              onClick={() =>
                scrollToProgress(
                  ANIMATION_CONFIG.projectSections[project.facetKey].start,
                )
              }
            />
          ))}
        </div>

        {hoverCapable && hoverLine && visible && (
          <svg
            width="100%"
            height="100%"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              overflow: 'visible',
            }}
          >
            <line
              x1={hoverLine.x1}
              y1={hoverLine.y1}
              x2={hoverLine.x2}
              y2={hoverLine.y2}
              stroke="rgba(255, 255, 255, 0.72)"
              strokeWidth="1.5"
            />
          </svg>
        )}
      </>,
    );
  }, [
    activeLayout,
    anchorScreenPositions,
    fadeDuration,
    hoverCapable,
    hoverLine,
    inActiveOverview,
    onHoverChange,
    performanceProfile?.simplifiedAnimations,
    projects,
    scrollToProgress,
    visible,
  ]);

  return null;
});

export default FacetLabels;
