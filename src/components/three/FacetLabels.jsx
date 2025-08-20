import React, { useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import Headline from '../ui/Headline';
import { deriveGlowFromBase } from '../../utils/color';
import { ANIMATION_CONFIG } from '../../hooks/useUnifiedAnimationController';
import '../../styles/facet-label.css';

const FacetLabels = ({ anchors = {}, projects = [], animationData, onHoverChange }) => {
  const groupRefs = useRef({});

  useFrame(() => {
    Object.entries(anchors).forEach(([key, anchor]) => {
      const group = groupRefs.current[key];
      if (anchor && group) {
        anchor.getWorldPosition(group.position);
      }
    });
  });

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
                  animationData.scrollToProgress(
                    ANIMATION_CONFIG.projectSections[facetKey].start
                  )
                }
                onHoverChange={onHoverChange}
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

  return (
    <div
      className="facet-label"
      onPointerEnter={() => {
        setHovered(true);
        onHoverChange?.(facetKey, true);
      }}
      onPointerLeave={() => {
        setHovered(false);
        onHoverChange?.(facetKey, false);
      }}
      onClick={onClick}
      style={{
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.2s',
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
