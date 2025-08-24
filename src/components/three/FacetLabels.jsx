import React, { useEffect, useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
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
  projects = [],
  scrollToProgress,
  onHoverChange,
  animationData,
  performanceProfile,
  labelPositions = {},
}) {
  const [visible, setVisible] = useState(false);
  const [fadeDuration, setFadeDuration] = useState(0.8);

  const shouldShow = useMemo(() => {
    if (performanceProfile?.simplifiedAnimations) return false;
    if (animationData?.isScrolling) return false;
    if (animationData?.crystalForm !== 'exploded') return false;
    if (animationData?.currentZone !== 'overview') return false;
    if (animationData?.focusedProject) return false;
    if (typeof animationData?.zoneProgress === 'number' && animationData.zoneProgress < 0.8) return false;
    return true;
  }, [
    animationData?.crystalForm,
    animationData?.currentZone,
    animationData?.focusedProject,
    animationData?.isScrolling,
    animationData?.zoneProgress,
    performanceProfile?.simplifiedAnimations,
  ]);

  useEffect(() => {
    if (shouldShow) {
      setFadeDuration(0.8);
      setVisible(true);
    } else {
      setFadeDuration(0.2);
      setVisible(false);
    }
  }, [shouldShow]);

  if (performanceProfile?.simplifiedAnimations && !visible) {
    return null;
  }

  return (
    <>
      {projects.map((project) => {
        const position = labelPositions[project.facetKey];
        if (!position) return null;

        return (
          <group key={project.facetKey} position={position}>
            <Html
              center
              portal={{ current: document.body }}
              distanceFactor={10}
              style={{
                pointerEvents: visible ? 'auto' : 'none',
                zIndex: 20,
                opacity: visible ? 1 : 0,
                transition: `opacity ${fadeDuration}s`,
                willChange: 'opacity',
              }}
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

