// components/three/MaterialManager.jsx
import React from 'react';
import CrystalMaterial from '../materials/CrystalMaterial';
import BlackOpalMaterial from '../materials/BlackOpalMaterial';
import BlackOpalSolidBase from '../materials/BlackOpalSolidBase';
import BlackOpalSolidEmissive from '../materials/BlackOpalSolidEmissive';
import IceOpalMaterial from '../materials/IceOpalMaterial';

// Component to manage and apply the correct material based on selected variant
const MaterialManager = ({ 
  materialVariant, 
  blackOpalConfig, 
  iceOpalConfig, 
  config, 
  materialRef 
}) => {
  // Return the appropriate material component based on the variant
  switch (materialVariant) {
    case 'blackOpal':
      return (
        <BlackOpalMaterial 
          config={blackOpalConfig} 
          materialRef={materialRef} 
        />
      );
    
    case 'blackOpalSolidBase':
      return (
        <BlackOpalSolidBase
          config={blackOpalConfig}
          materialRef={materialRef}
        />
      );
    
    case 'blackOpalSolidEmissive':
      return (
        <BlackOpalSolidEmissive
          config={blackOpalConfig}
          materialRef={materialRef}
        />
      );
    
    case 'iceOpal':
      return (
        <IceOpalMaterial
          config={iceOpalConfig}
          materialRef={materialRef}
        />
      );
    
    default:
      return (
        <CrystalMaterial 
          config={config} 
          materialRef={materialRef} 
          variant={materialVariant} 
        />
      );
  }
};

export default MaterialManager;