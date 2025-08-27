// FIXED: src/components/three/FacetLabels.jsx
// Calculate anchor positions once at startup for optimal performance

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import Headline from '../ui/Headline';
import { deriveGlowFromBase } from '../../utils/color';
import { ANIMATION_CONFIG } from '../../hooks/useUnifiedAnimationController';
import { explodedPositions } from '../../crystalConfig';
import '../../styles/facet-label.css';

// FIXED: Actual anchor world positions from debug system (not offsets!)
const ANCHOR_WORLD_POSITIONS = {
  empathy: new Vector3(0.20, -2.37, -0.11),
  narrative: new Vector3(0.09, -1.16, -1.00),
  craft: new Vector3(1.39, 0.19, 0.70),
  system: new Vector3(-0.74, 0.19, -2.11),
  leadership: new Vector3(0.48, 2.01, 1.19),
  exploration: new Vector3(-0.83, 1.38, -0.07)
};

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
      <Headline as="h3" className="label-title" style={{ margin: 0, fontSize: '1.6rem' }}>
        {project.label}
      </Headline>
      <div className="label-description">{project.tagline}</div>
    </div>
  );
});

// FIXED: Calculate final anchor world positions once at startup
const FacetLabels = React.memo(function FacetLabels({
  projects = [],
  scrollToProgress,
  onHoverChange,
  animationData,
  performanceProfile,
  anchorOffsets = {}, // Not used - we have static data from Blender
}) {
  const { camera, size } = useThree();
  const [visible, setVisible] = useState(false);
  const [fadeDuration, setFadeDuration] = useState(0.8);
  const [rootReady, setRootReady] = useState(false);
  const [screenPositions, setScreenPositions] = useState({});
  
  const layerRef = useRef(null);
  const rootRef = useRef(null);
  const lastCameraHash = useRef('');

  // FIXED: Use actual anchor world positions from debug system
  const anchorWorldPositions = useMemo(() => {
    const positions = { ...ANCHOR_WORLD_POSITIONS };
    
    if (import.meta.env.DEV) {
      console.log('📍 Using actual anchor world positions from debug system:', 
        Object.fromEntries(
          Object.entries(positions).map(([key, vec]) => [key, vec.toArray()])
        )
      );
    }
    
    return positions;
  }, []); // Empty deps - these are static positions

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

  // FIXED: Use the same projection method as debug anchors (Html component)
  useEffect(() => {
    if (!camera || Object.keys(anchorWorldPositions).length === 0) return;

    // Create a hash of camera state to avoid unnecessary recalculations
    const cameraHash = `${camera.position.x.toFixed(2)},${camera.position.y.toFixed(2)},${camera.position.z.toFixed(2)},${size.width}x${size.height}`;
    
    if (cameraHash === lastCameraHash.current) {
      return; // No significant change
    }

    const newScreenPositions = {};

    Object.entries(anchorWorldPositions).forEach(([facetKey, worldPos]) => {
      // FIXED: Use the same projection math as Three.js Html component
      // This replicates what @react-three/drei's Html component does internally
      
      // Step 1: Apply view matrix (world to camera space)
      const vec = worldPos.clone();
      vec.applyMatrix4(camera.matrixWorldInverse);
      
      // Step 2: Apply projection matrix (camera to clip space)  
      vec.applyMatrix4(camera.projectionMatrix);
      
      // Step 3: Convert from clip space to screen space (same as Html component)
      const screenX = (vec.x * 0.5 + 0.5) * size.width;
      const screenY = (-vec.y * 0.5 + 0.5) * size.height;
      
      newScreenPositions[facetKey] = [screenX, screenY];
    });

    setScreenPositions(newScreenPositions);
    lastCameraHash.current = cameraHash;

    if (import.meta.env.DEV) {
      console.log('📍 Updated screen positions using Html component projection:', newScreenPositions);
    }
  }, [camera, size.width, size.height, anchorWorldPositions]);

  // FIXED: Only show labels in overview when crystal is exploded (not during animation)
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

  // FIXED: Delay label appearance until after explosion is complete
  useEffect(() => {
    let timeout;
    if (shouldShow) {
      timeout = setTimeout(() => {
        setFadeDuration(0.8);
        setVisible(true);
        if (import.meta.env.DEV) {
          console.log('📍 Showing facet labels at calculated anchor positions');
        }
      }, 1200); // Wait for explosion to complete
    } else {
      setFadeDuration(0.2);
      setVisible(false);
      if (import.meta.env.DEV && visible) {
        console.log('📍 Hiding facet labels');
      }
    }
    return () => clearTimeout(timeout);
  }, [shouldShow, visible]);

  // FIXED: Render labels using calculated anchor positions
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

// Helper function for testing actual anchor positions
export function testAnchorPositions() {
  if (!import.meta.env.DEV) return;
  
  console.group('🔍 Using Actual Anchor World Positions');
  Object.entries(ANCHOR_WORLD_POSITIONS).forEach(([facetKey, worldPos]) => {
    console.log(`${facetKey}:`, worldPos.toArray());
  });
  console.groupEnd();
}