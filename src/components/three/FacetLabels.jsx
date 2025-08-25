import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import Headline from '../ui/Headline';
import { deriveGlowFromBase } from '../../utils/color';
import { ANIMATION_CONFIG } from '../../hooks/useUnifiedAnimationController';
import { explodedPositions } from '../../crystalConfig';
import '../../styles/facet-label.css';

// Individual label rendered without card styling
const OptimizedLabel = React.memo(function OptimizedLabel({
  project,
  onHover,
  scrollToProgress,
}) {
  const { glow1, glow2 } = useMemo(
    () => deriveGlowFromBase(project.headlineColor),
    [project.headlineColor]
  );

  return (
    <div
      className="facet-label-optimized"
      onPointerEnter={() => onHover?.(project.facetKey, true)}
      onPointerLeave={() => onHover?.(project.facetKey, false)}
      onClick={() =>
        scrollToProgress(
          ANIMATION_CONFIG.projectSections[project.facetKey].start
        )
      }
      style={{
        '--headline-ink': project.headlineColor,
        '--headline-glow1': glow1,
        '--headline-glow2': glow2,
      }}
    >
      <Headline as="h3" className="label-title" style={{ margin: 0, fontSize: '1rem' }}>
        {project.label}
      </Headline>
      <div className="label-description">{project.tagline}</div>
    </div>
  );
});

// Render facet labels as static screen-space elements
const FacetLabels = React.memo(function FacetLabels({
  projects = [],
  scrollToProgress,
  onHoverChange,
  animationData,
  performanceProfile,
  anchorOffsets = {},
}) {
  const { camera, size } = useThree();
  const [visible, setVisible] = useState(false);
  const [fadeDuration, setFadeDuration] = useState(0.8);
  const [rootReady, setRootReady] = useState(false);
  const layerRef = useRef(null);
  const rootRef = useRef(null);

  // Create a fixed layer for labels
  useEffect(() => {
    const layer = document.createElement('div');
    layer.style.position = 'fixed';
    layer.style.top = '0';
    layer.style.left = '0';
    layer.style.width = '100%';
    layer.style.height = '100%';
    layer.style.pointerEvents = 'none';
    layer.style.zIndex = '20';
    document.body.appendChild(layer);
    layerRef.current = layer;
    rootRef.current = createRoot(layer);
    setRootReady(true);
    return () => {
      rootRef.current?.unmount();
      document.body.removeChild(layer);
    };
  }, []);

  // Convert static exploded positions plus anchor offsets to screen space
  const screenPositions = useMemo(() => {
    const vec = new Vector3();
    const offset = new Vector3();
    const result = {};
    Object.entries(explodedPositions).forEach(([key, pos]) => {
      vec.fromArray(pos);
      if (anchorOffsets[key]) {
        offset.fromArray(anchorOffsets[key]);
        vec.add(offset);
      }
      vec.project(camera);
      result[key] = [
        (vec.x * 0.5 + 0.5) * size.width,
        (-vec.y * 0.5 + 0.5) * size.height,
      ];
    });
    return result;
  }, [camera, size.width, size.height, anchorOffsets]);

  const shouldShow = useMemo(() => {
    if (performanceProfile?.simplifiedAnimations) return false;
    if (animationData?.isScrolling) return false;
    if (animationData?.isTransitioning) return false;
    if (animationData?.crystalForm !== 'exploded') return false;
    if (animationData?.currentZone !== 'overview') return false;
    if (animationData?.focusedProject) return false;
    return true;
  }, [
    animationData?.crystalForm,
    animationData?.currentZone,
    animationData?.focusedProject,
    animationData?.isScrolling,
    animationData?.isTransitioning,
    performanceProfile?.simplifiedAnimations,
  ]);

  // Delay fade-in so we avoid showing during active explosion
  useEffect(() => {
    let timeout;
    if (shouldShow) {
      timeout = setTimeout(() => {
        setFadeDuration(0.8);
        setVisible(true);
      }, 500);
    } else {
      setFadeDuration(0.2);
      setVisible(false);
    }
    return () => clearTimeout(timeout);
  }, [shouldShow]);

  // Render labels into detached root
  useEffect(() => {
    if (!rootRef.current) return;
    if (!layerRef.current) return;
    if (performanceProfile?.simplifiedAnimations && !visible) {
      rootRef.current.render(null);
      return;
    }

    rootRef.current.render(
      <>
        {projects.map((project) => {
          const pos = screenPositions[project.facetKey];
          if (!pos) return null;
          return (
            <div
              key={project.facetKey}
              style={{
                position: 'absolute',
                left: `${pos[0]}px`,
                top: `${pos[1]}px`,
                transform: 'translate(-50%, -50%)',
                opacity: visible ? 1 : 0,
                transition: `opacity ${fadeDuration}s`,
                pointerEvents: visible ? 'auto' : 'none',
              }}
            >
              <OptimizedLabel
                project={project}
                onHover={onHoverChange}
                scrollToProgress={scrollToProgress}
              />
            </div>
          );
        })}
      </>
    );
  }, [
    projects,
    screenPositions,
    visible,
    fadeDuration,
    onHoverChange,
    scrollToProgress,
    performanceProfile?.simplifiedAnimations,
    rootReady,
  ]);

  return null;
});

export default FacetLabels;
