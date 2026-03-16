import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useThree } from '@react-three/fiber';
import Headline from '../ui/Headline';
import { ANIMATION_CONFIG } from '../../hooks/useUnifiedAnimationController';
import { MQ_HOVER_CAPABLE } from '../../config/breakpoints';
import { useLayoutConfig } from '../../hooks/useLayoutConfig';
import '../../styles/facet-label.css';

const OptimizedLabel = React.memo(function OptimizedLabel({
  project,
  titleRef,
  onHover,
  onClick,
  visible,
}) {
  const glow1 = project.headlineColor;
  const glow2 = project.headlineColor;
  const runtimeKey = project.facetKey || project.id || project.crystalKey;

  return (
    <div
      className="facet-label-optimized"
      onPointerEnter={() => onHover?.(runtimeKey, true)}
      onPointerLeave={() => onHover?.(runtimeKey, false)}
      onClick={onClick}
      style={{
        '--headline-ink': project.headlineColor,
        '--headline-glow1': glow1,
        '--headline-glow2': glow2,
        textAlign: 'left',
        width: '100%',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div ref={titleRef}>
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
  scrollToProgress,
  scrollToProject,
  onDirectProjectSelect,
  onHoverChange,
  animationData,
  performanceProfile,
  onDomAnchorChange,
}) {
  const { camera, size } = useThree();
  const [anchorScreenPositions, setAnchorScreenPositions] = useState({});
  const [visible, setVisible] = useState(false);
  const [fadeDuration, setFadeDuration] = useState(0.8);
  const [hoverCapable, setHoverCapable] = useState(false);
  const [hoveredFacetKey, setHoveredFacetKey] = useState(null);
  const titleRefs = useRef(new Map());
  const layerRef = useRef(null);
  const rootRef = useRef(null);
  const fadeTimeoutRef = useRef(null);

  const inActiveOverview =
    animationData?.currentZone === 'overview' &&
    animationData?.crystalForm === 'exploded' &&
    animationData?.isTransitioning === false &&
    animationData?.cameraSettled === true;

  const { variant, layout, error } = useLayoutConfig();
  const overviewWorld = layout?.anchors?.overviewWorld;

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

  const calculateAnchorPositions = useCallback(() => {
    if (!overviewWorld) {
      setAnchorScreenPositions({});
      return;
    }

    const positions = {};
    Object.entries(overviewWorld).forEach(([facetKey, worldPos]) => {
      const projected = worldPos.clone().project(camera);
      positions[facetKey] = {
        x: (projected.x * 0.5 + 0.5) * size.width,
        y: (-projected.y * 0.5 + 0.5) * size.height,
      };
    });
    setAnchorScreenPositions(positions);
  }, [camera, overviewWorld, size.height, size.width]);

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
      setFadeDuration(0.2);
      setVisible(false);
      setHoveredFacetKey(null);
      onDomAnchorChange?.(null, null);
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
  }, [calculateAnchorPositions, inActiveOverview, onDomAnchorChange]);

  useEffect(() => {
    if (!inActiveOverview || !projects?.length) return;
    const firstFacetKey = projects[0].facetKey || projects[0].id || projects[0].crystalKey;
    const section = document.getElementById(`project-${firstFacetKey}`);
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.1) {
          setFadeDuration(0.2);
          setVisible(false);
          setHoveredFacetKey(null);
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
    if (!hoverCapable || !hoveredFacetKey) return undefined;

    const handleResize = () => {
      emitDomAnchorPoint(hoveredFacetKey);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [emitDomAnchorPoint, hoverCapable, hoveredFacetKey]);

  useEffect(() => {
    if (!rootRef.current || !inActiveOverview) return;
    if (!layout || error) {
      rootRef.current.render(null);
      return;
    }
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
        onDomAnchorChange?.(facetKey, null);
        return;
      }

      setHoveredFacetKey(isHovering ? facetKey : null);
      if (isHovering) {
        emitDomAnchorPoint(facetKey);
      } else {
        onDomAnchorChange?.(facetKey, null);
      }
    };

    rootRef.current.render(
      <>
        <div
          style={{
            position: 'absolute',
            width: variant === 'desktop' ? '33.333vw' : '100%',
            right: variant === 'desktop' ? '6%' : 0,
            left: variant === 'desktop' ? 'auto' : 0,
            top: variant === 'desktop' ? '50%' : 'auto',
            bottom: variant === 'desktop' ? 'auto' : 'calc(4.75rem + env(safe-area-inset-bottom, 0px))',
            transform: variant === 'desktop' ? 'translateY(-50%)' : 'none',
            paddingLeft: variant === 'desktop' ? 0 : '16px',
            paddingRight: variant === 'desktop' ? 0 : '16px',
            opacity: visible ? 1 : 0,
            transition: `opacity ${fadeDuration}s`,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: variant === 'desktop' ? '1.5rem' : '0.8rem',
            alignItems: 'flex-start',
            textAlign: 'left',
            boxSizing: 'border-box',
          }}
        >
          {projects.map((project) => (
            <OptimizedLabel
              key={project.id || project.facetKey}
              project={project}
              titleRef={(el) => {
                if (el) {
                  titleRefs.current.set(project.facetKey || project.id || project.crystalKey, el);
                } else {
                  titleRefs.current.delete(project.facetKey || project.id || project.crystalKey);
                }
              }}
              onHover={handleHover}
              onClick={() =>
                {
                  onDirectProjectSelect?.(project.facetKey || project.id || project.crystalKey);
                  if (scrollToProject) {
                    scrollToProject(project.facetKey || project.id || project.crystalKey);
                    return;
                  }
                  scrollToProgress(
                    ANIMATION_CONFIG.projectSections[project.facetKey || project.id || project.crystalKey].start,
                  );
                }
              }
              visible={visible}
            />
          ))}
        </div>

      </>,
    );
  }, [
    anchorScreenPositions,
    fadeDuration,
    hoverCapable,
    inActiveOverview,
    emitDomAnchorPoint,
    error,
    layout,
    onDomAnchorChange,
    onDirectProjectSelect,
    onHoverChange,
    performanceProfile?.simplifiedAnimations,
    projects,
    scrollToProgress,
    scrollToProject,
    variant,
    visible,
  ]);

  return null;
});

export default FacetLabels;
