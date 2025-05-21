// components/three/MaterialManager.jsx - Updated to prevent material sharing
import React, { useRef, useEffect } from 'react';
import CrystalMaterial from '../materials/CrystalMaterial';
import BlackOpalMaterial from '../materials/BlackOpalMaterial';
import BlackOpalSolidBase from '../materials/BlackOpalSolidBase';
import BlackOpalSolidEmissive from '../materials/BlackOpalSolidEmissive';
import IceOpalMaterial from '../materials/IceOpalMaterial';

/**
 * Component to manage and apply the correct material based on selected variant
 * Updated to prevent material sharing between variants
 */
const MaterialManager = ({ 
  materialVariant, 
  blackOpalConfig, 
  iceOpalConfig, 
  config, 
  materialRef,
  performanceConfig = {}
}) => {
  // Create separate refs for each material type to prevent sharing
  const crystalMaterialRef = useRef();
  const blackOpalMaterialRef = useRef();
  const blackOpalSolidBaseRef = useRef();
  const blackOpalSolidEmissiveRef = useRef();
  const iceOpalMaterialRef = useRef();
  
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
      case 'blackOpal':
        materialRef.current = blackOpalMaterialRef.current;
        console.log('Set material to blackOpal');
        break;
      case 'blackOpalSolidBase':
        materialRef.current = blackOpalSolidBaseRef.current;
        console.log('Set material to blackOpalSolidBase');
        break;
      case 'blackOpalSolidEmissive':
        materialRef.current = blackOpalSolidEmissiveRef.current;
        console.log('Set material to blackOpalSolidEmissive');
        break;
      case 'iceOpal':
        materialRef.current = iceOpalMaterialRef.current;
        console.log('Set material to iceOpal');
        break;
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
      
      {/* BlackOpal material - only used when that variant is selected */}
      <BlackOpalMaterial 
        config={blackOpalConfig} 
        materialRef={blackOpalMaterialRef}
        performanceConfig={performanceConfig}
      />
      
      {/* BlackOpalSolidBase - diagnostic variant */}
      <BlackOpalSolidBase
        config={blackOpalConfig}
        materialRef={blackOpalSolidBaseRef}
        performanceConfig={performanceConfig}
      />
      
      {/* BlackOpalSolidEmissive - diagnostic variant */}
      <BlackOpalSolidEmissive
        config={blackOpalConfig}
        materialRef={blackOpalSolidEmissiveRef}
        performanceConfig={performanceConfig}
      />
      
      {/* IceOpal material */}
      <IceOpalMaterial
        config={iceOpalConfig}
        materialRef={iceOpalMaterialRef}
        performanceConfig={performanceConfig}
      />
    </>
  );
};

export default MaterialManager;