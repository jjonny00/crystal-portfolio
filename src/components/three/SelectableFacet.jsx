// SelectableFacet.jsx - Updated to better handle anchors
import React, { useRef, useState, useEffect } from 'react';
import { a } from '@react-spring/three';
import FacetOutline from './FacetOutline';

/**
 * Component for a single facet that can be selected/hovered
 * Updated to properly handle anchors
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
  const [facetMesh, setFacetMesh] = useState(null);
  
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
          console.log(`Found anchor in facet ${facetKey}: ${child.name}`);
          foundAnchor = true;
        }
      });
      
      if (!foundAnchor) {
        console.warn(`No anchor found in facet ${facetKey}`);
      }
    }
  }, [ref, localRef.current, facetKey]);
  
  // Find the first mesh in the model after it's loaded
  useEffect(() => {
    if (!localRef.current) return;
    
    // Find the first mesh in the scene
    let foundMesh = null;
    localRef.current.traverse((child) => {
      if (!foundMesh && child.isMesh) {
        foundMesh = child;
      }
    });
    
    if (foundMesh) {
      setFacetMesh(foundMesh);
    }
  }, [model]);
  
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
      
      {/* Outline effect for selected or hovered facets */}
      {facetMesh && (isSelected || isHovered) && (
        <FacetOutline
          visible={true}
          originalMesh={facetMesh}
          color={color}
          thickness={isSelected ? 0.04 : 0.02}
          opacity={isSelected ? 0.8 : 0.6}
        />
      )}
    </a.group>
  );
});

export default SelectableFacet;