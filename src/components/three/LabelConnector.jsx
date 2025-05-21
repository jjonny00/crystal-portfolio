// Alternative approach: LabelConnector.jsx - adds visual connection between facets and labels
import React, { useRef, useEffect } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Component to create a visual connection between facets and their labels
 * This can be used as an alternative or complement to positioning labels
 */
const LabelConnector = ({ 
  facetPosition, 
  labelPosition, 
  color, 
  visible = true, 
  lineWidth = 0.5,
  opacity = 0.4
}) => {
  // Skip rendering if not visible or positions are missing
  if (!visible || !facetPosition || !labelPosition) return null;
  
  // Create points for the line
  const points = [
    new THREE.Vector3(...facetPosition),
    new THREE.Vector3(...labelPosition)
  ];
  
  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth}
      opacity={opacity}
      transparent={true}
      dashed={false}
    />
  );
};

/**
 * Enhanced connector component that animates with the facets
 */
const AnimatedLabelConnector = ({ 
  facetRef, 
  labelPosition, 
  color, 
  visible = true, 
  lineWidth = 0.5,
  opacity = 0.4
}) => {
  const linePoints = useRef([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0)
  ]);
  
  // Update line position on each frame to follow facet
  useFrame(() => {
    if (facetRef && facetRef.position && labelPosition) {
      linePoints.current[0].set(
        facetRef.position.x,
        facetRef.position.y,
        facetRef.position.z
      );
      
      linePoints.current[1].set(
        labelPosition[0],
        labelPosition[1],
        labelPosition[2]
      );
    }
  });
  
  if (!visible) return null;
  
  return (
    <Line
      points={linePoints.current}
      color={color}
      lineWidth={lineWidth}
      opacity={opacity}
      transparent={true}
      dashed={false}
    />
  );
};

export { LabelConnector, AnimatedLabelConnector };