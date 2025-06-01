// SelectableFacet.jsx - Updated to remove all outline references
import React, { useRef, useState, useEffect } from 'react';
import { a } from '@react-spring/three';

/**
 * Component for a single facet that can be selected/hovered
 * CLEANED: All outline references removed
 */
const SelectableFacet = React.forwardRef(({
  model,
  spring,
  index,
  facetKey,
  isSelected = false,
  isHovered = false,
  color = '#ffffff',
  onSelect,
  onHover
}, ref) => {
  const localRef = useRef();
  
  // Use both the forwarded ref and local ref
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(localRef.current);
      } else {
        ref.current = localRef.current;
      }
    }
    
    // Check for anchors when model is loaded
    if (localRef.current) {
      let foundAnchor = false;
      localRef.current.traverse((child) => {
        if (child.name && child.name.startsWith('anchor_')) {
          // console.log(`Found anchor in facet ${facetKey}: ${child.name}`);
          foundAnchor = true;
        }
      });
      
      if (!foundAnchor) {
        // console.warn(`No anchor found in facet ${facetKey}`);
      }
    }
  }, [ref, localRef.current, facetKey]);
  
  // Event handlers
  const handlePointerOver = () => {
    if (onHover) onHover(facetKey);
  };
  
  const handlePointerOut = () => {
    if (onHover) onHover(null);
  };
  
  const handleClick = () => {
    if (onSelect) onSelect(facetKey);
  };
  
  // Important: Make sure to update the world matrix after position changes
  // This ensures anchors have the correct world position
  useEffect(() => {
    if (localRef.current) {
      localRef.current.updateWorldMatrix(true, true);
    }
  }, [spring.position.get()]);
  
  return (
    <a.group
      ref={localRef}
      position={spring.position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <primitive object={model.scene} />
      
      {/* REMOVED: All FacetOutline components and outline effect logic */}
    </a.group>
  );
});

export default SelectableFacet;