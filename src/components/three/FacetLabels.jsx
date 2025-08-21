import React, { useRef, useState, useCallback } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import Headline from '../ui/Headline';
import { deriveGlowFromBase } from '../../utils/color';
import { ANIMATION_CONFIG } from '../../hooks/useUnifiedAnimationController';
import '../../styles/facet-label.css';

const FacetLabels = ({ anchors = {}, projects = [], scrollToProgress, onHoverChange }) => {
  const groupRefs = useRef({});
  const [hoveredFacetKey, setHoveredFacetKey] = useState(null);

  useFrame(() => {
    Object.entries(anchors).forEach(([key, anchor]) => {
      const group = groupRefs.current[key];
      if (anchor && group) {
        // Freeze label position while it is hovered so the pointer doesn't slip off
        if (hoveredFacetKey !== key) {
          anchor.getWorldPosition(group.position);
        }
      }
    });
  });

  const handleHoverChange = useCallback(
    (facetKey, hovering) => {
      setHoveredFacetKey(prev => (hovering ? facetKey : prev === facetKey ? null : prev));
      onHoverChange?.(facetKey, hovering);
    },
    [onHoverChange]
  );

  return (
    <>
      {projects.map((project) => {
        const { facetKey } = project;
        const anchor = anchors[facetKey];
        if (!anchor) return null;

        const { glow1, glow2 } = deriveGlowFromBase(project.headlineColor);

        return (
          <group
            key={facetKey}
            ref={(ref) => {
              if (ref) groupRefs.current[facetKey] = ref;
            }}
          >
            <Html center style={{ pointerEvents: 'auto' }}>
              <Label
                project={project}
                facetKey={facetKey}
                glow1={glow1}
                glow2={glow2}
                onClick={() =>
                  scrollToProgress(
                    ANIMATION_CONFIG.projectSections[facetKey].start
                  )
                }
                onHoverChange={handleHoverChange}
              />
            </Html>
          </group>
        );
      })}
    </>
  );
};

const Label = ({ project, facetKey, onClick, onHoverChange, glow1, glow2 }) => {
  const [hovered, setHovered] = useState(false);

  const handlePointerEnter = () => {
    if (import.meta.env.DEV) {
      console.log(`🏷️ Label hover START: ${facetKey}`);
    }

    setHovered(true);
    onHoverChange?.(facetKey, true);
  };

  const handlePointerLeave = () => {
    if (import.meta.env.DEV) {
      console.log(`🏷️ Label hover END: ${facetKey}`);
    }

    setHovered(false);
    onHoverChange?.(facetKey, false);
  };

  return (
    <div
      className="facet-label"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
      onClick={onClick}
      style={{
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.2s',
        // FIXED: Ensure the label has enough area for stable hover
        padding: '0.75rem 1rem', // Increased padding
        minWidth: '200px', // Minimum width to prevent tiny hover areas
        cursor: 'pointer',
      }}
    >
      <div className="label-container">
        <div className="label-logo">
          <img src={project.logo} alt={`${project.title} logo`} />
        </div>
        <div>
          <Headline
            as="h3"
            className="label-title"
            style={{
              '--headline-ink': project.headlineColor,
              '--headline-glow1': glow1,
              '--headline-glow2': glow2,
            }}
          >
            {project.label}
          </Headline>
          <div className="label-description">{project.tagline}</div>
        </div>
      </div>
    </div>
  );
};

export default FacetLabels;