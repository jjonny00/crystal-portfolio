import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import Headline from '../ui/Headline';
import { ANIMATION_CONFIG } from '../../hooks/useUnifiedAnimationController';

// Predefined anchor positions in world space
const ANCHOR_WORLD_POSITIONS = {
  empathy: new Vector3(0.2, -2.37, -0.11),
  narrative: new Vector3(0.09, -1.16, -1.0),
  craft: new Vector3(1.39, 0.19, 0.7),
  system: new Vector3(-0.74, 0.19, -2.11),
  leadership: new Vector3(0.48, 2.01, 1.19),
  exploration: new Vector3(-0.83, 1.38, -0.07)
};

const OptimizedLabel = React.memo(function OptimizedLabel({
  project,
  onHover,
  scrollToProgress,
}) {
  const glow1 = project.headlineColor;
  const glow2 = project.headlineColor;

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
      <Headline as="h3" className="label-title" style={{ margin: 0, fontSize: '1.6rem' }}>
        {project.label}
      </Headline>
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
  // Do nothing while the crystal is transitioning or not exploded
  if (animationData?.isTransitioning || animationData?.crystalForm !== 'exploded') {
    return null;
  }

  const { camera, size } = useThree();
  const [anchorScreenPositions, setAnchorScreenPositions] = useState({});
  const [visible, setVisible] = useState(false);
  const [fadeDuration, setFadeDuration] = useState(0.8);
  const layerRef = useRef(null);
  const rootRef = useRef(null);
  const [rootReady, setRootReady] = useState(false);

  // Create DOM layer
  useEffect(() => {
    const layer = document.createElement('div');
    layer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:20';
    document.body.appendChild(layer);
    layerRef.current = layer;
    rootRef.current = createRoot(layer);
    setRootReady(true);
    return () => {
      rootRef.current?.unmount();
      document.body.removeChild(layer);
    };
  }, []);

  const calculateAndCacheAnchorPositions = useCallback(() => {
    const positions = {};
    Object.entries(ANCHOR_WORLD_POSITIONS).forEach(([facetKey, worldPos]) => {
      const vec = worldPos.clone().project(camera);
      const x = (vec.x * 0.5 + 0.5) * size.width;
      const y = (-vec.y * 0.5 + 0.5) * size.height;
      positions[facetKey] = { x, y };
    });
    setAnchorScreenPositions(positions);
  }, [camera, size]);

  useEffect(() => {
    if (
      animationData?.isTransitioning === false &&
      animationData?.crystalForm === 'exploded' &&
      animationData?.cameraSettled === true
    ) {
      calculateAndCacheAnchorPositions();
    }
  }, [animationData?.isTransitioning, animationData?.cameraSettled, animationData?.crystalForm, calculateAndCacheAnchorPositions]);

  // Fade labels in once positions are calculated
  useEffect(() => {
    let timeout;
    if (Object.keys(anchorScreenPositions).length > 0) {
      timeout = setTimeout(() => {
        setFadeDuration(0.8);
        setVisible(true);
      }, 0);
    } else {
      setFadeDuration(0.2);
      setVisible(false);
    }
    return () => clearTimeout(timeout);
  }, [anchorScreenPositions]);

  // Render labels using cached positions
  useEffect(() => {
    if (!rootReady || !rootRef.current) return;
    if (performanceProfile?.simplifiedAnimations || Object.keys(anchorScreenPositions).length === 0) {
      rootRef.current.render(null);
      return;
    }

    rootRef.current.render(
      <>
        {projects.map((project) => {
          const pos = anchorScreenPositions[project.facetKey];
          if (!pos) return null;
          return (
            <div
              key={project.facetKey}
              style={{
                position: 'absolute',
                left: `${pos.x}px`,
                top: `${pos.y}px`,
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
    anchorScreenPositions,
    projects,
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

