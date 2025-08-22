import React, { useRef, useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import Headline from '../ui/Headline';
import { deriveGlowFromBase } from '../../utils/color';
import { ANIMATION_CONFIG } from '../../hooks/useUnifiedAnimationController';
import '../../styles/facet-label.css';

const FacetLabels = ({ anchors = {}, projects = [], scrollToProgress, onHoverChange }) => {
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
            <Html
              center
              portal={{ current: document.body }}
              style={{ pointerEvents: 'auto', zIndex: 20 }}
            >
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
  const hoverTimeout = useRef();

  useEffect(() => {
    return () => {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }
    };
  }, []);

  // FIXED: Remove the timeout delay that was causing the hover to end immediately
  const handlePointerEnter = () => {
    // Clear any pending timeout
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    
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
    
    // FIXED: Reduced timeout from 100ms to 50ms and added better cleanup
    hoverTimeout.current = setTimeout(() => {
      setHovered(false);
      onHoverChange?.(facetKey, false);
      hoverTimeout.current = null;
    }, 50); // Shorter delay to reduce flickering
  };

  // FIXED: Add mouse events as backup in case pointer events have issues
  const handleMouseEnter = () => {
    handlePointerEnter();
  };

  const handleMouseLeave = () => {
    handlePointerLeave();
  };

    // Handle label click without clearing hover; hover will reset on scroll
    const handleClick = () => {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = null;
      }
      onClick?.();
    };

  return (
    <div
      className="facet-label"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
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