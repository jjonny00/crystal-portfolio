import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useThree } from '@react-three/fiber';
import Headline from '../ui/Headline';
import { ANIMATION_CONFIG } from '../../hooks/useUnifiedAnimationController';
import { MQ_HOVER_CAPABLE } from '../../config/breakpoints';
import { useLayoutConfig } from '../../hooks/useLayoutConfig';
import '../../styles/facet-label.css';

const TOUCH_TAP_MAX_MOVE_PX = 14;
const isTouchHitDebugEnabled = () => {
  if (typeof window === 'undefined') return false;
  if (window.__TOUCH_HIT_DEBUG__ === true) return true;
  return new URLSearchParams(window.location.search).get('touchHitDebug') === '1';
};

const OptimizedLabel = React.memo(function OptimizedLabel({
  project,
  titleRef,
  onHover,
  onClick,
  visible,
}) {
  const glow1 = project.headlineColor;
  const glow2 = project.headlineColor;
  const runtimeKey = project.facetKey || project.id;

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
  const [touchDebugEvent, setTouchDebugEvent] = useState('idle');
  const titleRefs = useRef(new Map());
  const layerRef = useRef(null);
  const rootRef = useRef(null);
  const fadeTimeoutRef = useRef(null);
  const touchStartRef = useRef(new Map());

  const inActiveOverview =
    animationData?.currentZone === 'overview' &&
    animationData?.crystalForm === 'exploded' &&
    animationData?.isTransitioning === false &&
    animationData?.cameraSettled === true;

  const { variant, layout, error } = useLayoutConfig();
  const overviewWorld = layout?.anchors?.overviewWorld;
  const touchHitDebugEnabled = isTouchHitDebugEnabled();

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
    const firstFacetKey = projects[0].facetKey || projects[0].id;
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

    const selectProject = (projectKey) => {
      onDirectProjectSelect?.(projectKey);
      if (scrollToProject) {
        scrollToProject(projectKey);
        return;
      }
      scrollToProgress(ANIMATION_CONFIG.projectSections[projectKey].start);
    };

    const handleTouchTargetPointerDown = (event, projectKey) => {
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
      if (touchHitDebugEnabled) {
        setTouchDebugEvent(`down:${projectKey} (${Math.round(event.clientX)}, ${Math.round(event.clientY)})`);
      }
      touchStartRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        projectKey
      });
    };

    const handleTouchTargetPointerUp = (event, projectKey) => {
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
      const start = touchStartRef.current.get(event.pointerId);
      touchStartRef.current.delete(event.pointerId);
      if (!start) return;

      const travel = Math.hypot(event.clientX - start.x, event.clientY - start.y);
      if (touchHitDebugEnabled) {
        setTouchDebugEvent(`up:${projectKey} travel=${travel.toFixed(1)}px`);
      }
      if (travel <= TOUCH_TAP_MAX_MOVE_PX) {
        if (touchHitDebugEnabled) {
          setTouchDebugEvent(`activate:${projectKey} <= ${TOUCH_TAP_MAX_MOVE_PX}px`);
        }
        selectProject(projectKey);
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
                  titleRefs.current.set(project.facetKey || project.id, el);
                } else {
                  titleRefs.current.delete(project.facetKey || project.id);
                }
              }}
              onHover={handleHover}
              onClick={() => selectProject(project.facetKey || project.id)}
              visible={visible}
            />
          ))}
        </div>
        {!hoverCapable && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              pointerEvents: touchHitDebugEnabled ? 'auto' : 'none',
              background: touchHitDebugEnabled ? 'rgba(255, 40, 40, 0.12)' : 'transparent',
              zIndex: 21
            }}
          >
            {touchHitDebugEnabled && (
              <div
                style={{
                  position: 'fixed',
                  top: 12,
                  left: 12,
                  color: '#fff',
                  fontSize: '12px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.75)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  pointerEvents: 'none'
                }}
              >
                touch overlay mounted · {touchDebugEvent}
              </div>
            )}
            {projects.map((project) => {
              const projectKey = project.facetKey || project.id;
              const anchor = anchorScreenPositions[projectKey];
              if (!anchor || !visible) return null;

              return (
                <button
                  key={`touch-hit-${projectKey}`}
                  type="button"
                  aria-label={`Open ${project.label}`}
                  onPointerDown={(event) => handleTouchTargetPointerDown(event, projectKey)}
                  onPointerUp={(event) => handleTouchTargetPointerUp(event, projectKey)}
                  onTouchStart={() => {
                    if (touchHitDebugEnabled) setTouchDebugEvent(`touchstart:${projectKey}`);
                  }}
                  onTouchEnd={() => {
                    if (touchHitDebugEnabled) setTouchDebugEvent(`touchend:${projectKey}`);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${anchor.x}px`,
                    top: `${anchor.y}px`,
                    width: 'clamp(64px, 12vw, 120px)',
                    height: 'clamp(64px, 12vw, 120px)',
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '999px',
                    padding: 0,
                    margin: 0,
                    background: touchHitDebugEnabled ? 'rgba(45, 212, 191, 0.35)' : 'transparent',
                    opacity: touchHitDebugEnabled ? 1 : 0,
                    pointerEvents: 'auto',
                    touchAction: 'pan-y',
                    cursor: 'pointer',
                    border: touchHitDebugEnabled ? '2px solid #14b8a6' : '0',
                    color: touchHitDebugEnabled ? '#fff' : 'transparent',
                    fontSize: touchHitDebugEnabled ? '11px' : '0',
                    fontWeight: 700
                  }}
                >
                  {touchHitDebugEnabled ? projectKey : null}
                </button>
              );
            })}
            {touchHitDebugEnabled && projects[0] && (
              <button
                type="button"
                onPointerDown={() => setTouchDebugEvent('debug button down')}
                onPointerUp={() => {
                  const projectKey = projects[0].facetKey || projects[0].id;
                  setTouchDebugEvent(`debug select:${projectKey}`);
                  selectProject(projectKey);
                }}
                onTouchStart={() => setTouchDebugEvent('debug touchstart')}
                onTouchEnd={() => setTouchDebugEvent('debug touchend')}
                style={{
                  position: 'fixed',
                  right: 16,
                  bottom: 16,
                  width: 160,
                  height: 56,
                  borderRadius: 12,
                  border: '2px solid #fff',
                  background: '#2563eb',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  pointerEvents: 'auto',
                  touchAction: 'manipulation',
                  zIndex: 22
                }}
              >
                DEBUG SELECT {projects[0].facetKey || projects[0].id}
              </button>
            )}
          </div>
        )}

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
    touchHitDebugEnabled,
    touchDebugEvent,
    variant,
    visible,
  ]);

  return null;
});

export default FacetLabels;
