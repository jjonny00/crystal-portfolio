// MaterialManager.jsx - OPTIMIZED: Fast mobile crystal material that still looks great
// Creates materials that perform well on mobile while maintaining crystal appearance

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
  const optimizedMobileRef = useRef();
  
  // FIXED: Null safety with proper defaults
  const safePerformanceConfig = performanceConfig || {
    usePBR: true,
    useNormalMaps: true,
    textureQuality: 'high',
    renderScale: 1.0
  };
  
  const usePBR = safePerformanceConfig.usePBR !== false;
  
  console.log('🎨 MaterialManager: PBR enabled?', usePBR, 'Performance config:', safePerformanceConfig);

  // OPTIMIZED: Create high-performance mobile material using MeshStandardMaterial
  useEffect(() => {
    if (!usePBR && !optimizedMobileRef.current) {
      console.log('🚀 Creating OPTIMIZED mobile crystal material');
      
      // Use MeshStandardMaterial instead of MeshPhysicalMaterial for mobile
      // This removes expensive features like transmission, clearcoat, iridescence
      let materialProps = {
        // Basic PBR properties (much cheaper than Physical)
        color: new THREE.Color('#4488ff'), // Slightly blue crystal color
        metalness: 0.1,                     // Slight metallic look
        roughness: 0.15,                    // Smooth but not mirror-like
        
        // Environment mapping for reflections (key for crystal look!)
        envMapIntensity: 2.0,               // Strong environment reflections
        
        // NO transparency - major performance gain!
        transparent: false,
        opacity: 1.0,
        
        // Standard material properties
        side: THREE.FrontSide,              // Only render front faces (perf gain)
        fog: true,
        
        // CRITICAL: Enable depth writing for proper rendering
        depthWrite: true,
        depthTest: true,
        
        // Emissive glow to simulate internal light
        emissive: new THREE.Color('#001166'), // Dark blue emissive
        emissiveIntensity: 0.2,             // Subtle internal glow
        
        // Use higher precision only when needed
        precision: safePerformanceConfig.highPrecision ? 'highp' : 'mediump'
      };

      // Apply variant-specific properties (optimized versions)
      switch(materialVariant) {
        case 'glass':
          materialProps.color.set('#f0f8ff');        // Very light blue
          materialProps.metalness = 0.0;             // Glass isn't metallic
          materialProps.roughness = 0.05;            // Very smooth
          materialProps.envMapIntensity = 2.5;       // Strong reflections
          materialProps.emissive.set('#ffffff');     // White emissive
          materialProps.emissiveIntensity = 0.1;     // Subtle
          break;
          
        case 'gem':
          materialProps.color.set('#6644bb');        // Purple gem
          materialProps.metalness = 0.3;             // More metallic
          materialProps.roughness = 0.05;            // Very smooth
          materialProps.envMapIntensity = 1.8;       // Good reflections
          materialProps.emissive.set('#220044');     // Purple emissive
          materialProps.emissiveIntensity = 0.3;     // More pronounced
          break;
          
        case 'holographic':
          materialProps.color.set('#00dddd');        // Cyan
          materialProps.metalness = 0.8;             // Very metallic
          materialProps.roughness = 0.0;             // Mirror-like
          materialProps.envMapIntensity = 3.0;       // Maximum reflections
          materialProps.emissive.set('#004444');     // Cyan emissive
          materialProps.emissiveIntensity = 0.4;     // Strong glow
          break;
          
        default:
          // Use config colors if available
          if (config.materials.crystal.color) {
            materialProps.color.copy(config.materials.crystal.color);
          }
          if (config.materials.crystal.emissive) {
            materialProps.emissive.copy(config.materials.crystal.emissive);
          }
          materialProps.emissiveIntensity = 0.2;
          break;
      }
      
      // Create the optimized material
      const optimizedMaterial = new THREE.MeshStandardMaterial(materialProps);
      optimizedMobileRef.current = optimizedMaterial;
      
      console.log('✅ OPTIMIZED mobile material created:', {
        variant: materialVariant,
        transparent: optimizedMaterial.transparent,
        metalness: optimizedMaterial.metalness,
        roughness: optimizedMaterial.roughness,
        envMapIntensity: optimizedMaterial.envMapIntensity,
        emissiveIntensity: optimizedMaterial.emissiveIntensity
      });
      
      if (onMaterialReady) onMaterialReady(optimizedMaterial);
    }
  }, [usePBR, config.materials.crystal.color, config.materials.crystal.emissive, materialVariant, onMaterialReady]);

  // Update material when variant changes
  useEffect(() => {
    if (!usePBR && optimizedMobileRef.current) {
      console.log('🔄 Updating optimized mobile material for variant:', materialVariant);
      
      const material = optimizedMobileRef.current;
      
      // Store current emissive intensity to preserve glow effects
      const currentEmissiveIntensity = material.emissiveIntensity;
      
      // Update material properties based on variant
      switch(materialVariant) {
        case 'glass':
          material.color.set('#f0f8ff');
          material.metalness = 0.0;
          material.roughness = 0.05;
          material.envMapIntensity = 2.5;
          material.emissive.set('#ffffff');
          material.emissiveIntensity = Math.max(0.1, currentEmissiveIntensity);
          break;
          
        case 'gem':
          material.color.set('#6644bb');
          material.metalness = 0.3;
          material.roughness = 0.05;
          material.envMapIntensity = 1.8;
          material.emissive.set('#220044');
          material.emissiveIntensity = Math.max(0.3, currentEmissiveIntensity);
          break;
          
        case 'holographic':
          material.color.set('#00dddd');
          material.metalness = 0.8;
          material.roughness = 0.0;
          material.envMapIntensity = 3.0;
          material.emissive.set('#004444');
          material.emissiveIntensity = Math.max(0.4, currentEmissiveIntensity);
          break;
          
        default:
          if (config.materials.crystal.color) {
            material.color.copy(config.materials.crystal.color);
          }
          if (config.materials.crystal.emissive) {
            material.emissive.copy(config.materials.crystal.emissive);
          }
          material.metalness = 0.1;
          material.roughness = 0.15;
          material.envMapIntensity = 2.0;
          material.emissiveIntensity = Math.max(0.2, currentEmissiveIntensity);
          break;
      }
      
      material.needsUpdate = true;
    }
  }, [materialVariant, usePBR, config.materials.crystal]);

  // SIMPLIFIED: Normal map support for mobile (optional)
  useEffect(() => {
    if (!usePBR && optimizedMobileRef.current && safePerformanceConfig.useNormalMaps && config.assets.textures.normalMap) {
      console.log('🔧 Adding normal map to optimized mobile material');
      
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(config.assets.textures.normalMap, (texture) => {
        // Basic texture setup
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(5, 5); // Simple repeat
        
        // Mobile-optimized texture settings
        texture.minFilter = THREE.LinearFilter;      // No mipmaps for mobile
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;             // Save memory
        texture.anisotropy = 1;                      // No anisotropic filtering
        
        optimizedMobileRef.current.normalMap = texture;
        optimizedMobileRef.current.normalScale = new THREE.Vector2(0.5, 0.5); // Subtle normal
        optimizedMobileRef.current.needsUpdate = true;
        
        console.log('✅ Normal map added to optimized mobile material');
      });
    } else if (!usePBR && optimizedMobileRef.current && !safePerformanceConfig.useNormalMaps) {
      // Remove normal map if disabled
      if (optimizedMobileRef.current.normalMap) {
        optimizedMobileRef.current.normalMap = null;
        optimizedMobileRef.current.normalScale.set(0, 0);
        optimizedMobileRef.current.needsUpdate = true;
      }
    }
  }, [usePBR, safePerformanceConfig.useNormalMaps, config.assets.textures.normalMap]);

  // Update the main material ref
  useEffect(() => {
    console.log('🔄 MaterialManager: Updating material reference', {
      variant: materialVariant,
      usePBR,
      previousMaterial: materialRef.current?.type
    });
    
    if (!usePBR) {
      materialRef.current = optimizedMobileRef.current;
      console.log('✅ Using OPTIMIZED mobile material (MeshStandardMaterial)');
    } else {
      materialRef.current = crystalMaterialRef.current;
      console.log('✅ Using full PBR crystal material:', materialVariant);
    }

    if (onMaterialReady) onMaterialReady(materialRef.current);
  }, [materialVariant, materialRef, usePBR, onMaterialReady]);
  
  // Only render PBR material component if PBR is enabled
  if (!usePBR) {
    console.log('🚫 Skipping PBR material component (using optimized mobile instead)');
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
      performanceConfig={safePerformanceConfig}
      onMaterialReady={onMaterialReady}
    />
  );
};

export default MaterialManager;