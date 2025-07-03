// MaterialManager.jsx - UPDATED: Add reflections to non-PBR materials
// Option 1: Use MeshStandardMaterial instead of MeshLambertMaterial

import React, { useRef, useEffect } from 'react';
import CrystalMaterial from '../materials/CrystalMaterial';
import * as THREE from 'three';

const MaterialManager = ({
  materialVariant,
  config,
  materialRef,
  performanceConfig = {},
  onMaterialReady = null
}) => {
  const crystalMaterialRef = useRef();
  const basicMaterialRef = useRef();
  
  const usePBR = performanceConfig.usePBR !== false;
  
  console.log('🎨 MaterialManager: PBR enabled?', usePBR, 'Performance config:', performanceConfig);

  // UPDATED: Create better basic material with reflections
  useEffect(() => {
    if (!usePBR && !basicMaterialRef.current) {
      console.log('🔄 Creating enhanced basic material (PBR disabled but with reflections)');
      
      // OPTION 1: Use MeshStandardMaterial (supports envMap but no transmission)
      let materialProps = {
        transparent: true,
        side: THREE.DoubleSide,
        fog: true,
        depthWrite: false,
        depthTest: true,
        
        // KEY: Add environment map support
        envMapIntensity: 0.8,  // Adjust reflection strength
        metalness: 0.1,        // Small amount for subtle reflections
        roughness: 0.3,        // Control reflection sharpness
      };

      // Apply variant-specific properties
      switch(materialVariant) {
        case 'glass':
          materialProps = {
            ...materialProps,
            color: new THREE.Color('#ffffff'),
            opacity: 0.4,           // Increased opacity for better reflections
            emissive: new THREE.Color('#ffffff'),
            emissiveIntensity: 0.02,
            metalness: 0.0,         // Glass isn't metallic
            roughness: 0.1,         // Very smooth for clear reflections
            envMapIntensity: 1.2,   // Strong reflections for glass
          };
          break;
          
        case 'gem':
          materialProps = {
            ...materialProps,
            color: new THREE.Color('#7b4bbc'),
            opacity: 0.7,
            emissive: new THREE.Color('#7b4bbc'),
            emissiveIntensity: 0.05,
            metalness: 0.2,         // Slight metallic for gem-like reflections
            roughness: 0.05,        // Very smooth for sharp reflections
            envMapIntensity: 1.0,
          };
          break;
          
        case 'holographic':
          materialProps = {
            ...materialProps,
            color: new THREE.Color('#00ffff'),
            opacity: 0.6,
            emissive: new THREE.Color('#00ffff'),
            emissiveIntensity: 0.1,
            metalness: 0.8,         // High metallic for holographic effect
            roughness: 0.0,         // Mirror-like reflections
            envMapIntensity: 1.5,   // Strong reflections
          };
          break;
          
        default:
          materialProps = {
            ...materialProps,
            color: config.materials.crystal.color,
            opacity: 0.8,
            emissive: new THREE.Color(config.materials.crystal.emissive).multiplyScalar(0.1),
            emissiveIntensity: 0.2,
            metalness: 0.1,
            roughness: 0.2,
            envMapIntensity: 0.8,
          };
          break;
      }
      
      // UPDATED: Use MeshStandardMaterial instead of MeshLambertMaterial
      const basicMaterial = new THREE.MeshStandardMaterial(materialProps);
      basicMaterialRef.current = basicMaterial;
      
      console.log('✅ Enhanced basic material created with reflections:', materialVariant);
      if (onMaterialReady) onMaterialReady(basicMaterial);
    }
  }, [usePBR, config.materials.crystal.color, config.materials.crystal.emissive, materialVariant]);

  // UPDATED: Update basic material when variant changes (now with reflection support)
  useEffect(() => {
    if (!usePBR && basicMaterialRef.current) {
      console.log('🔄 Updating enhanced basic material for variant:', materialVariant);
      
      const material = basicMaterialRef.current;
      
      // Update material properties based on variant
      switch(materialVariant) {
        case 'glass':
          material.color.set('#ffffff');
          material.opacity = 0.4;
          material.emissive.set('#ffffff');
          material.emissiveIntensity = 0.02;
          material.metalness = 0.0;
          material.roughness = 0.1;
          material.envMapIntensity = 1.2;
          break;
          
        case 'gem':
          material.color.set('#7b4bbc');
          material.opacity = 0.7;
          material.emissive.set('#7b4bbc');
          material.emissiveIntensity = 0.05;
          material.metalness = 0.2;
          material.roughness = 0.05;
          material.envMapIntensity = 1.0;
          break;
          
        case 'holographic':
          material.color.set('#00ffff');
          material.opacity = 0.6;
          material.emissive.set('#00ffff');
          material.emissiveIntensity = 0.1;
          material.metalness = 0.8;
          material.roughness = 0.0;
          material.envMapIntensity = 1.5;
          break;
          
        default:
          material.color.copy(config.materials.crystal.color);
          material.opacity = 0.8;
          material.emissive.copy(new THREE.Color(config.materials.crystal.emissive).multiplyScalar(0.1));
          material.emissiveIntensity = 0.2;
          material.metalness = 0.1;
          material.roughness = 0.2;
          material.envMapIntensity = 0.8;
          break;
      }
      
      material.needsUpdate = true;
    }
  }, [materialVariant, usePBR, config.materials.crystal]);

  // Update the main material ref whenever the variant or performance config changes
  useEffect(() => {
    console.log('🔄 MaterialManager: Updating material reference', {
      variant: materialVariant,
      usePBR,
      previousMaterial: materialRef.current?.type
    });
    
    if (materialRef.current) {
      console.log('🗑️ Disposing previous material:', materialRef.current.type);
    }
    
    if (!usePBR) {
      materialRef.current = basicMaterialRef.current;
      console.log('✅ Using enhanced basic material with reflections (PBR disabled)');
    } else {
      materialRef.current = crystalMaterialRef.current;
      console.log('✅ Using PBR crystal material:', materialVariant);
    }

    if (onMaterialReady) onMaterialReady(materialRef.current);
  }, [materialVariant, materialRef, usePBR]);
  
  // Only render PBR material component if PBR is enabled
  if (!usePBR) {
    console.log('🚫 Skipping PBR material component (disabled by performance profile)');
    return null;
  }

  return (
    <CrystalMaterial 
      config={config} 
      materialRef={crystalMaterialRef} 
      variant={materialVariant === 'default' ||
               materialVariant === 'glass' ||
               materialVariant === 'gem' ||
               materialVariant === 'holographic' ? materialVariant : 'default'}
      performanceConfig={performanceConfig}
      onMaterialReady={onMaterialReady}
    />
  );
};

export default MaterialManager;