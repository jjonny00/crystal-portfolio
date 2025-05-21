// components/three/FacetOutline.jsx
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

// Component for creating outline effect on facets
const FacetOutline = ({ 
  visible, 
  originalMesh, 
  color = '#ffffff', 
  thickness = 0.02,
  opacity = 0.8 
}) => {
  const outlineRef = useRef();
  
  // Create a scaled version of the original geometry
  useEffect(() => {
    if (!originalMesh || !outlineRef.current) return;
    
    // Clone the original geometry
    const geometry = originalMesh.geometry.clone();
    
    // Scale it slightly larger to create outline effect
    const scale = 1 + thickness;
    geometry.scale(scale, scale, scale);
    
    // Update the outline mesh
    outlineRef.current.geometry.dispose();
    outlineRef.current.geometry = geometry;
  }, [originalMesh, thickness]);
  
  if (!originalMesh) return null;
  
  return (
    <mesh 
      ref={outlineRef}
      position={originalMesh.position}
      rotation={originalMesh.rotation}
      scale={originalMesh.scale}
      visible={visible}
    >
      <bufferGeometry />
      <meshBasicMaterial 
        color={color}
        transparent={true}
        opacity={opacity}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
};

export default FacetOutline;