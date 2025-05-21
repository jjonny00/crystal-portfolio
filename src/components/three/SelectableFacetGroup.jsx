// SelectableFacetGroup.jsx - Updated for better anchor handling
import React, { useEffect } from 'react';
import SelectableFacet from './SelectableFacet';

/**
 * Component that renders a group of selectable facets
 * Updated to properly handle the anchors
 */
const SelectableFacetGroup = ({
  models,
  springs,
  facetLabels,
  facetRefs,
  selectedFacet = null,
  hoveredFacet = null,
  onFacetSelect,
  onFacetHover
}) => {
  // Ensure facetRefs is initialized correctly
  useEffect(() => {
    // Debug output to verify ref array is available
    console.log("SelectableFacetGroup mounted with refs:", 
      facetRefs ? `Array of length ${facetRefs.current ? facetRefs.current.length : 0}` : 'undefined');
    
    // Initialize refs array if needed
    if (facetRefs && !facetRefs.current) {
      facetRefs.current = Array(models.length).fill(null);
    }
  }, [facetRefs, models.length]);
  
  return (
    <group>
      {models.map((model, index) => {
        const facetKey = facetLabels[index].key;
        const isSelected = facetKey === selectedFacet;
        const isHovered = facetKey === hoveredFacet && !isSelected;
        
        // For debugging ref issues
        const setRef = (el) => {
          if (facetRefs && facetRefs.current) {
            // Store the reference to the facet
            facetRefs.current[index] = el;
            
            if (el) {
              // Log facet position when set
              console.log(`Set ref for facet ${facetKey} at index ${index}: `, 
                el.position ? [el.position.x, el.position.y, el.position.z] : 'No position');
              
              // Ensure world matrix is updated (important for anchor positioning)
              el.updateWorldMatrix(true, true);
            }
          }
        };
        
        return (
          <SelectableFacet
            key={facetKey}
            model={model}
            spring={springs[index]}
            ref={setRef}
            index={index}
            facetKey={facetKey}
            isSelected={isSelected}
            isHovered={isHovered}
            color={facetLabels[index].color}
            onSelect={onFacetSelect}
            onHover={onFacetHover}
          />
        );
      })}
    </group>
  );
};

export default SelectableFacetGroup;