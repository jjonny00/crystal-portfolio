// components/three/FacetGroup.jsx
import React from 'react';
import { a } from '@react-spring/three';

// Component to render all facets with physics-based animations
const FacetGroup = ({ models, springs, facetRefs }) => {
  return (
    <group>
      {models.map((model, index) => (
        <a.group 
          key={index}
          ref={(el) => facetRefs.current[index] = el}
          position={springs[index].position}
        >
          <primitive object={model.scene} />
        </a.group>
      ))}
    </group>
  );
};

export default FacetGroup;