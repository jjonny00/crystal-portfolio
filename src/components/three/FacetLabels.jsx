import React, { useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import Headline from '../ui/Headline';
import { deriveGlowFromBase } from '../../utils/color';
import { ANIMATION_CONFIG } from '../../hooks/useUnifiedAnimationController';

const FacetLabels = ({ anchors = {}, projects = [], animationData }) => {
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
                glow1={glow1}
                glow2={glow2}
                onClick={() =>
                  animationData.scrollToProgress(
                    ANIMATION_CONFIG.projectSections[facetKey].start
                  )
                }
              />
            </Html>
          </group>
        );
      })}
    </>
  );
};

const Label = ({ project, onClick, glow1, glow2 }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.2s',
        textAlign: 'center',
        userSelect: 'none',
      }}
    >
      <Headline
        as="h3"
        style={{
          margin: 0,
          fontSize: '1rem',
          '--headline-ink': project.headlineColor,
          '--headline-glow1': glow1,
          '--headline-glow2': glow2,
        }}
      >
        {project.label}
      </Headline>
      <div
        style={{
          marginTop: '0.25rem',
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.8)',
        }}
      >
        {project.tagline}
      </div>
    </div>
  );
};

export default FacetLabels;
