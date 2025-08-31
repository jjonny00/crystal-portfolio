// FIXED: src/components/three/FacetLabels.jsx
// The issue is camera timing, not facet positions!

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import Headline from '../ui/Headline';
import { deriveGlowFromBase } from '../../utils/color';
import { ANIMATION_CONFIG } from '../../hooks/useUnifiedAnimationController';
import projects from '../../data/projects';

// Static anchor world positions (your original approach is correct!)
const ANCHOR_WORLD_POSITIONS = {
  empathy: new Vector3(0.20, -2.37, -0.11),
  narrative: new Vector3(0.09, -1.16, -1.00),
  craft: new Vector3(1.39, 0.19, 0.70),
  system: new Vector3(-0.74, 0.19, -2.11),
  leadership: new Vector3(0.48, 2.01, 1.19),
  exploration: new Vector3(-0.83, 1.38, -0.07)
};

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
  const { camera, size } = useThree();
  const [visible, setVisible] = useState(false);
  const [fadeDuration, setFadeDuration] = useState(0.8);
  const [rootReady, setRootReady] = useState(false);
  const [screenPositions, setScreenPositions] = useState({});
  
  const layerRef = useRef(null);
  const rootRef = useRef(null);
  const lastCameraHash = useRef('');

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

  // FIXED: Only calculate positions when camera is stable AND in overview mode
  useEffect(() => {
    if (!camera || Object.keys(ANCHOR_WORLD_POSITIONS).length === 0) return;

    // CRITICAL: Only calculate when we're definitely in overview mode with overview camera
    const isOverviewState = animationData?.currentZone === 'overview' &&
                           animationData?.cameraState === 'overview' &&
                           animationData?.crystalForm === 'exploded' &&
                           !animationData?.isTransitioning;
    
    if (!isOverviewState) {
      setScreenPositions({});
      return;
    }

    // Create camera hash that includes animation state
    const cameraHash = `${camera.position.x.toFixed(2)},${camera.position.y.toFixed(2)},${camera.position.z.toFixed(2)},${size.width}x${size.height}`;
    const stateHash = `${animationData.currentZone}-${animationData.cameraState}-${animationData.crystalForm}`;
    const fullHash = `${cameraHash}-${stateHash}`;
    
    if (fullHash === lastCameraHash.current) {
      return; // No significant change
    }

    // DEBUGGING: Log camera details
    if (import.meta.env.DEV) {
      console.log('📍 Calculating label positions:', {
        zone: animationData.currentZone,
        cameraState: animationData.cameraState,
        crystalForm: animationData.crystalForm,
        cameraPosition: camera.position.toArray(),
        isTransitioning: animationData.isTransitioning
      });
    }

    const newScreenPositions = {};

    Object.entries(ANCHOR_WORLD_POSITIONS).forEach(([facetKey, worldPos]) => {
      // Use the same projection math as Three.js Html component
      const vec = worldPos.clone();
      vec.applyMatrix4(camera.matrixWorldInverse);
      vec.applyMatrix4(camera.projectionMatrix);
      
      const screenX = (vec.x * 0.5 + 0.5) * size.width;
      const screenY = (-vec.y * 0.5 + 0.5) * size.height;
      
      newScreenPositions[facetKey] = [screenX, screenY];
    });

    setScreenPositions(newScreenPositions);
    lastCameraHash.current = fullHash;

    if (import.meta.env.DEV) {
      console.log('📍 Updated screen positions with stable camera:', newScreenPositions);
    }
  }, [
    camera, 
    size.width, 
    size.height, 
    animationData?.currentZone,
    animationData?.cameraState,
    animationData?.crystalForm,
    animationData?.isTransitioning
  ]);

  // Determine when labels should be visible
  const shouldShow = useMemo(() => {
    if (performanceProfile?.simplifiedAnimations) return false;
    if (animationData?.isScrolling) return false;
    if (animationData?.isTransitioning) return false;
    if (animationData?.crystalForm !== 'exploded') return false;
    if (animationData?.currentZone !== 'overview') return false;
    if (animationData?.focusedProject) return false;
    if (animationData?.cameraState !== 'overview') return false; // ADDED: Must be in overview camera mode
    return true;
  }, [
    animationData?.crystalForm,
    animationData?.currentZone,
    animationData?.focusedProject,
    animationData?.isScrolling,
    animationData?.isTransitioning,
    animationData?.cameraState, // ADDED: Camera state dependency
    performanceProfile?.simplifiedAnimations,
  ]);

  // FIXED: Wait for both shouldShow AND stable screen positions
  useEffect(() => {
    let timeout;
    if (shouldShow && Object.keys(screenPositions).length > 0) {
      // DEBUGGING: Log when we decide to show
      if (import.meta.env.DEV) {
        console.log('📍 Ready to show labels:', {
          shouldShow,
          hasPositions: Object.keys(screenPositions).length > 0,
          screenPositions
        });
      }
      
      timeout = setTimeout(() => {
        setFadeDuration(0.8);
        setVisible(true);
        if (import.meta.env.DEV) {
          console.log('📍 Showing facet labels with stable positions');
        }
      }, 500); // REDUCED: Less delay since we're now ensuring camera stability first
    } else {
      setFadeDuration(0.2);
      setVisible(false);
      if (import.meta.env.DEV && visible) {
        console.log('📍 Hiding facet labels');
      }
    }
    return () => clearTimeout(timeout);
  }, [shouldShow, screenPositions, visible]);

  // Render labels
  useEffect(() => {
    if (!rootRef.current || !layerRef.current || !rootReady) return;
    
    if (performanceProfile?.simplifiedAnimations && !visible) {
      rootRef.current.render(null);
      return;
    }

    // Only render if we have screen positions calculated
    if (Object.keys(screenPositions).length === 0) {
      rootRef.current.render(null);
      return;
    }

    rootRef.current.render(
      <>
        {projects.map((project) => {
          const pos = screenPositions[project.facetKey];
          if (!pos) {
            if (import.meta.env.DEV) {
              console.warn(`📍 No screen position calculated for project: ${project.facetKey}`);
            }
            return null;
          }
          
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