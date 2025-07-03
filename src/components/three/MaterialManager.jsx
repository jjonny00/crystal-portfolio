// components/three/MaterialManager.jsx - UPDATED: Respects performance profiles
// CRITICAL: Prevents PBR materials from loading when disabled by performance profile

import React, { useRef, useEffect } from 'react';
import CrystalMaterial from '../materials/CrystalMaterial';
import * as THREE from 'three';

/**
 * Component to manage and apply the correct material based on selected variant
 * UPDATED: Now respects performance profile settings and creates appropriate materials
 */
const MaterialManager = ({
  materialVariant,
  config,
  materialRef,
  performanceConfig = {},
  onMaterialReady = null
}) => {
  // Create separate refs for each material type to prevent sharing
  const crystalMaterialRef = useRef();
  const basicMaterialRef = useRef();
  
  // CRITICAL: Check if PBR is disabled by performance profile
  const usePBR = performanceConfig.usePBR !== false; // Default to true if undefined
  
  console.log('🎨 MaterialManager: PBR enabled?', usePBR, 'Performance config:', performanceConfig);

  // Create basic material for low-performance devices
  useEffect(() => {
    if (!usePBR && !basicMaterialRef.current) {
      console.log('🚫 Creating basic material (PBR disabled by performance profile)');
      
      // Create variant-specific basic materials
      let materialProps = {
        transparent: true,
        side: THREE.DoubleSide,
        fog: true,
        depthWrite: false,
        depthTest: true
      };

      // Apply variant-specific properties to basic material
      switch(materialVariant) {
        case 'glass':
          materialProps = {
            ...materialProps,
            color: new THREE.Color('#ffffff'),
            opacity: 0.3,
            emissive: new THREE.Color('#ffffff'),
            emissiveIntensity: 0.05
          };
          break;
          
        case 'gem':
          materialProps = {
            ...materialProps,
            color: new THREE.Color('#7b4bbc'),
            opacity: 0.6,
            emissive: new THREE.Color('#7b4bbc'),
            emissiveIntensity: 0.1
          };
          break;
          
        case 'holographic':
          materialProps = {
            ...materialProps,
            color: new THREE.Color('#00ffff'),
            opacity: 0.5,
            emissive: new THREE.Color('#00ffff'),
            emissiveIntensity: 0.15
          };
          break;
          
        default:
          materialProps = {
            ...materialProps,
            color: config.materials.crystal.color,
            opacity: 0.8,
            emissive: new THREE.Color(config.materials.crystal.emissive).multiplyScalar(0.1),
            emissiveIntensity: 0.2
          };
          break;
      }
      
      const basicMaterial = new THREE.MeshLambertMaterial(materialProps);
      basicMaterialRef.current = basicMaterial;
      console.log('✅ Basic material created for low-performance device:', materialVariant);
      if (onMaterialReady) onMaterialReady(basicMaterial);
    }
  }, [usePBR, config.materials.crystal.color, config.materials.crystal.emissive, materialVariant]);

  // Update basic material when variant changes (for non-PBR mode)
  useEffect(() => {
    if (!usePBR && basicMaterialRef.current) {
      console.log('🔄 Updating basic material for variant:', materialVariant);
      
      const material = basicMaterialRef.current;
      
      // Update material properties based on variant
      switch(materialVariant) {
        case 'glass':
          material.color.set('#ffffff');
          material.opacity = 0.3;
          material.emissive.set('#ffffff');
          material.emissiveIntensity = 0.05;
          break;
          
        case 'gem':
          material.color.set('#7b4bbc');
          material.opacity = 0.6;
          material.emissive.set('#7b4bbc');
          material.emissiveIntensity = 0.1;
          break;
          
        case 'holographic':
          material.color.set('#00ffff');
          material.opacity = 0.5;
          material.emissive.set('#00ffff');
          material.emissiveIntensity = 0.15;
          break;
          
        default:
          material.color.copy(config.materials.crystal.color);
          material.opacity = 0.8;
          material.emissive.copy(new THREE.Color(config.materials.crystal.emissive).multiplyScalar(0.1));
          material.emissiveIntensity = 0.2;
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
    
    // Clear previous material if it exists
    if (materialRef.current) {
      console.log('🗑️ Disposing previous material:', materialRef.current.type);
      // Don't dispose immediately - will be handled when component unmounts
    }
    
    // Assign the appropriate material ref based on performance and variant
    if (!usePBR) {
      // Use basic material for low-performance devices
      materialRef.current = basicMaterialRef.current;
      console.log('✅ Using basic material (PBR disabled)');
    } else {
      // Use PBR crystal material for high-performance devices
      materialRef.current = crystalMaterialRef.current;
      console.log('✅ Using PBR crystal material:', materialVariant);
    }

    if (onMaterialReady) onMaterialReady(materialRef.current);
  }, [materialVariant, materialRef, usePBR]);
  
  // Only render PBR material component if PBR is enabled
  if (!usePBR) {
    console.log('🚫 Skipping PBR material component (disabled by performance profile)');
    return null; // Don't render the expensive PBR material component
  }

  // Render PBR materials for high-performance devices
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