// components/three/MaterialManager.jsx - Updated to prevent material sharing
// CLEANED: Removed any potential outline material references

import React, { useRef, useEffect } from 'react';
import CrystalMaterial from '../materials/CrystalMaterial';

/**
 * Component to manage and apply the correct material based on selected variant
 * Updated to prevent material sharing between variants
 * CLEANED: All outline material references removed
 */
const MaterialManager = ({ 
  materialVariant,
  config,
  materialRef,
  performanceConfig = {}
}) => {
  // Create separate refs for each material type to prevent sharing
  const crystalMaterialRef = useRef();
  
  // Update the main material ref whenever the variant changes
  useEffect(() => {
    console.log('MaterialManager: Variant changed to', materialVariant);
    
    // Clear previous material if it exists to prevent memory leaks
    if (materialRef.current) {
      console.log('Disposing previous material');
      // Don't dispose yet - will be handled when component unmounts
    }
    
    // Assign the appropriate material ref based on the current variant
    switch (materialVariant) {
      default:
        materialRef.current = crystalMaterialRef.current;
        console.log('Set material to default crystal variant:', materialVariant);
        break;
    }
  }, [materialVariant, materialRef]);
  
  // Always render all material managers but only one will be active
  return (
    <>
      {/* Crystal material variants - always rendered but only one is used */}
      <CrystalMaterial 
        config={config} 
        materialRef={crystalMaterialRef} 
        variant={materialVariant === 'default' || 
                 materialVariant === 'glass' || 
                 materialVariant === 'gem' || 
                 materialVariant === 'holographic' ? materialVariant : 'default'}
        performanceConfig={performanceConfig}
      />
      
    </>
  );
};

export default MaterialManager;