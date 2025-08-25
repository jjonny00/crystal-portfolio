import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import Headline from '../ui/Headline';
import { deriveGlowFromBase } from '../../utils/color';
import { ANIMATION_CONFIG } from '../../hooks/useUnifiedAnimationController';
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
  labelPositions = {},
}) {
  const { camera, size } = useThree();
  const [visible, setVisible] = useState(false);
  const [fadeDuration, setFadeDuration] = useState(0.8);
  const layerRef = useRef(null);

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
    return () => {
      document.body.removeChild(layer);
    };
  }, []);

  // Convert world positions to screen space once
  const screenPositions = useMemo(() => {
    const vec = new Vector3();
    const result = {};
    Object.entries(labelPositions).forEach(([key, pos]) => {
      vec.fromArray(pos);
      vec.project(camera);
      result[key] = [
        (vec.x * 0.5 + 0.5) * size.width,
        (-vec.y * 0.5 + 0.5) * size.height,
      ];
    });
    return result;
  }, [labelPositions, camera, size.width, size.height]);

  const shouldShow = useMemo(() => {
    if (performanceProfile?.simplifiedAnimations) return false;
    if (animationData?.isScrolling) return false;
    if (animationData?.crystalForm !== 'exploded') return false;
    if (animationData?.currentZone !== 'overview') return false;
    if (animationData?.focusedProject) return false;
    return true;
  }, [
    animationData?.crystalForm,
    animationData?.currentZone,
    animationData?.focusedProject,
    animationData?.isScrolling,
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

  if (!layerRef.current) return null;
  if (performanceProfile?.simplifiedAnimations && !visible) return null;

  return createPortal(
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
    </>,
    layerRef.current
  );
});

export default FacetLabels;
