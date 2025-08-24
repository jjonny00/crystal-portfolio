import React, { useRef, useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import Headline from '../ui/Headline';
import { deriveGlowFromBase } from '../../utils/color';
import { ANIMATION_CONFIG } from '../../hooks/useUnifiedAnimationController';
import '../../styles/facet-label.css';

// Individual label rendered in HTML overlay
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

// Optimized facet labels component
const FacetLabels = React.memo(function FacetLabels({
  anchors = {},
  projects = [],
  scrollToProgress,
  onHoverChange,
  animationData,
  performanceProfile,
}) {
  const groupRefs = useRef({});
  const lastUpdateTime = useRef(0);

  const shouldShowLabels = useMemo(() => {
    if (performanceProfile?.simplifiedAnimations) return false;
    if (animationData?.isScrolling) return false;
    return animationData?.crystalForm === 'exploded';
  }, [
    animationData?.crystalForm,
    animationData?.isScrolling,
    performanceProfile?.simplifiedAnimations,
  ]);

  useFrame((state) => {
    if (!shouldShowLabels) return;
    const now = state.clock.elapsedTime;

    // During transitions (like explosion animation), update every frame for smooth motion
    const interval = animationData?.isTransitioning ? 0 : 0.066;
    if (now - lastUpdateTime.current < interval) return;
    lastUpdateTime.current = now;

    Object.entries(anchors).forEach(([key, anchor]) => {
      const group = groupRefs.current[key];
      if (anchor && group) {
        anchor.getWorldPosition(group.position);
      }
    });
  });

  if (!shouldShowLabels) {
    return null;
  }

  return (
    <>
      {projects.map((project) => {
        const anchor = anchors[project.facetKey];
        if (!anchor) return null;

        return (
          <group
            key={project.facetKey}
            ref={(ref) => {
              if (ref) groupRefs.current[project.facetKey] = ref;
            }}
          >
            <Html
              center
              portal={{ current: document.body }}
              distanceFactor={10}
              style={{ pointerEvents: 'auto', zIndex: 20 }}
            >
              <OptimizedLabel
                project={project}
                onHover={onHoverChange}
                scrollToProgress={scrollToProgress}
              />
            </Html>
          </group>
        );
      })}
    </>
  );
});

export default FacetLabels;

