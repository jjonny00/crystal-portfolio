// MaterialManager.jsx - UPDATED: Shadow improvements for mobile crystal material
// Creates materials that perform well on mobile while maintaining crystal appearance

import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
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
  const { scene } = useThree(); // Get Three.js scene to access environment
  
  // FIXED: Null safety with proper defaults
  const safePerformanceConfig = performanceConfig || {
    usePBR: true,
    useNormalMaps: true,
    textureQuality: 'high',
    renderScale: 1.0
  };
  
  const usePBR = safePerformanceConfig.usePBR !== false;
  
  if (process.env.NODE_ENV === "development") console.log('🎨 MaterialManager: PBR enabled?', usePBR, 'Performance config:', safePerformanceConfig);

  // OPTIMIZED: Create high-performance mobile material using MeshStandardMaterial
  useEffect(() => {
    if (!usePBR && !optimizedMobileRef.current) {
      if (process.env.NODE_ENV === "development") console.log('🚀 Creating OPTIMIZED mobile crystal material with shadow improvements');
      
      // Use MeshStandardMaterial instead of MeshPhysicalMaterial for mobile
      // This removes expensive features like transmission, clearcoat, iridescence
      let materialProps = {
        // AGGRESSIVE: Settings similar to gem variant for strong reflections
        color: new THREE.Color('#1f2391'),   // Purple like gem (shows reflections better than blue)
        metalness: 0.1,                      // MUCH higher metallic (like gem variant)
        roughness: 0.05,                     // VERY smooth (like gem variant)
        
        // Environment mapping for reflections (key for crystal look!)
        envMapIntensity: 4.0,                // VERY strong environment reflections

        specularIntensity: 100.0,                    // Bright highlights
        specularColor: new THREE.Color('#ffffff'), // White highlights
        reflectivity: 1.8,                        // High reflectiveness
        
        // NO transparency - major performance gain!
        transparent: true,
        opacity: 0.96,
        
        // Standard material properties
        side: THREE.FrontSide,               // Only render front faces (perf gain)
        fog: true,
        
        // CRITICAL: Enable depth writing for proper rendering
        depthWrite: true,
        depthTest: true,
        
        // UPDATED: Enhanced shadow settings for better transparent lighting simulation
        shadowSide: THREE.DoubleSide,        // Render shadows on both sides when needed
        
        // Emissive glow to simulate internal light
        emissive: new THREE.Color('#a7ffdb'), // Purple emissive (like gem)
        emissiveIntensity: 0.03,              // More pronounced glow
        
        // Use higher precision only when needed
        precision: safePerformanceConfig.highPrecision ? 'highp' : 'mediump'


      };

      // Apply variant-specific properties (optimized versions)
      switch(materialVariant) {
        case 'glass':
          materialProps.color.set('#f0f8ff');        // Very light blue
          materialProps.metalness = 0.1;             // Slight metallic for reflections
          materialProps.roughness = 0.02;            // Very smooth
          materialProps.envMapIntensity = 4.0;       // Very strong reflections
          materialProps.emissive.set('#ffffff');     // White emissive
          materialProps.emissiveIntensity = 0.1;     // Subtle
          break;
          
        case 'gem':
          materialProps.color.set('#6644bb');        // Purple gem
          materialProps.metalness = 0.5;             // More metallic
          materialProps.roughness = 0.02;            // Very smooth
          materialProps.envMapIntensity = 3.5;       // Strong reflections
          materialProps.emissive.set('#220044');     // Purple emissive
          materialProps.emissiveIntensity = 0.3;     // More pronounced
          break;
          
        case 'holographic':
          materialProps.color.set('#00dddd');        // Cyan
          materialProps.metalness = 0.9;             // Very metallic
          materialProps.roughness = 0.0;             // Mirror-like
          materialProps.envMapIntensity = 5.0;       // Maximum reflections
          materialProps.emissive.set('#004444');     // Cyan emissive
          materialProps.emissiveIntensity = 0.4;     // Strong glow
          break;
          
        default:
          // Use config colors if available, but keep gem-like settings
          if (config.materials.crystal.color) {
            materialProps.color.copy(config.materials.crystal.color);
          }
          if (config.materials.crystal.emissive) {
            materialProps.emissive.copy(config.materials.crystal.emissive);
          }
          // KEEP these high values for visible reflections
          materialProps.metalness = 0.08;        // High metallic
          materialProps.roughness = 0.02;       // Very smooth
          materialProps.envMapIntensity = 40.0;   // Strong reflections
          materialProps.emissiveIntensity = 0.3; // Visible glow
          break;
      }
      
      // Create the optimized material
      const optimizedMaterial = new THREE.MeshStandardMaterial(materialProps);
      
      // CRITICAL: We need to manually set the environment map
      // MeshStandardMaterial doesn't automatically pick it up from the scene
      // We'll set it when the component mounts and environment is available
      optimizedMobileRef.current = optimizedMaterial;
      
      if (process.env.NODE_ENV === "development") console.log('✅ OPTIMIZED mobile material created with shadow improvements:', {
        variant: materialVariant,
        transparent: optimizedMaterial.transparent,
        metalness: optimizedMaterial.metalness,
        roughness: optimizedMaterial.roughness,
        envMapIntensity: optimizedMaterial.envMapIntensity,
        emissiveIntensity: optimizedMaterial.emissiveIntensity,
        shadowSide: optimizedMaterial.shadowSide
      });
      
      if (onMaterialReady) onMaterialReady(optimizedMaterial);
    }
  }, [usePBR, config.materials.crystal.color, config.materials.crystal.emissive, materialVariant, onMaterialReady]);

  // CRITICAL: Set environment map for reflections
  useEffect(() => {
    if (!usePBR && optimizedMobileRef.current && scene) {
      // Check if scene has environment
      if (scene.environment) {
        if (process.env.NODE_ENV === "development") console.log('🌍 Setting environment map for mobile material');
        optimizedMobileRef.current.envMap = scene.environment;
        optimizedMobileRef.current.needsUpdate = true;
        
        // DEBUG: Log material properties to verify settings
        if (process.env.NODE_ENV === "development") console.log('🔍 Mobile material debug:', {
          hasEnvMap: !!optimizedMobileRef.current.envMap,
          metalness: optimizedMobileRef.current.metalness,
          roughness: optimizedMobileRef.current.roughness,
          envMapIntensity: optimizedMobileRef.current.envMapIntensity,
          color: optimizedMobileRef.current.color.getHexString(),
          emissiveIntensity: optimizedMobileRef.current.emissiveIntensity,
          shadowSide: optimizedMobileRef.current.shadowSide
        });
      } else {
        if (process.env.NODE_ENV === "development") console.log('⏳ Waiting for environment to load...');
        // Wait for environment to load
        const checkEnvironment = () => {
          if (scene.environment && optimizedMobileRef.current) {
            if (process.env.NODE_ENV === "development") console.log('🌍 Environment loaded - applying to mobile material');
            optimizedMobileRef.current.envMap = scene.environment;
            optimizedMobileRef.current.needsUpdate = true;
            
            // DEBUG: Log material properties
            if (process.env.NODE_ENV === "development") console.log('🔍 Mobile material debug (delayed):', {
              hasEnvMap: !!optimizedMobileRef.current.envMap,
              metalness: optimizedMobileRef.current.metalness,
              roughness: optimizedMobileRef.current.roughness,
              envMapIntensity: optimizedMobileRef.current.envMapIntensity
            });
          }
        };
        
        // Check periodically for environment
        const intervalId = setInterval(() => {
          if (scene.environment) {
            checkEnvironment();
            clearInterval(intervalId);
          }
        }, 100);
        
        // Clean up after 5 seconds
        setTimeout(() => {
          clearInterval(intervalId);
        }, 5000);
      }
    }
  }, [usePBR, optimizedMobileRef.current, scene]);

  // Update material when variant changes
  useEffect(() => {
    if (!usePBR && optimizedMobileRef.current) {
      if (process.env.NODE_ENV === "development") console.log('🔄 Updating optimized mobile material for variant:', materialVariant);
      
      const material = optimizedMobileRef.current;
      
      // Store current emissive intensity to preserve glow effects
      const currentEmissiveIntensity = material.emissiveIntensity;
      
      // Update material properties based on variant
      switch(materialVariant) {
        case 'glass':
          material.color.set('#f0f8ff');
          material.metalness = 0.1;
          material.roughness = 0.02;
          material.envMapIntensity = 4.0;
          material.emissive.set('#ffffff');
          material.emissiveIntensity = Math.max(0.1, currentEmissiveIntensity);
          break;
          
        case 'gem':
          material.color.set('#6644bb');
          material.metalness = 0.5;
          material.roughness = 0.02;
          material.envMapIntensity = 3.5;
          material.emissive.set('#220044');
          material.emissiveIntensity = Math.max(0.3, currentEmissiveIntensity);
          break;
          
        case 'holographic':
          material.color.set('#00dddd');
          material.metalness = 0.9;
          material.roughness = 0.0;
          material.envMapIntensity = 5.0;
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
          // AGGRESSIVE: Use gem-like settings for strong reflections
          material.metalness = 0.8;              // High metallic
          material.roughness = 0.02;             // Very smooth
          material.envMapIntensity = 15.0;        // Strong reflections
          material.emissiveIntensity = Math.max(0.0, currentEmissiveIntensity);
          break;
      }
      
      // UPDATED: Ensure shadow settings are maintained
      material.shadowSide = THREE.DoubleSide;
      material.needsUpdate = true;
    }
  }, [materialVariant, usePBR, config.materials.crystal]);

  // SIMPLIFIED: Normal map support for mobile (optional)
  useEffect(() => {
    if (!usePBR && optimizedMobileRef.current && safePerformanceConfig.useNormalMaps && config.assets.textures.normalMap) {
      if (process.env.NODE_ENV === "development") console.log('🔧 Adding normal map to optimized mobile material');
      
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
        
        if (process.env.NODE_ENV === "development") console.log('✅ Normal map added to optimized mobile material');
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
    if (process.env.NODE_ENV === "development") console.log('🔄 MaterialManager: Updating material reference', {
      variant: materialVariant,
      usePBR,
      previousMaterial: materialRef.current?.type
    });
    
    if (!usePBR) {
      materialRef.current = optimizedMobileRef.current;
      if (process.env.NODE_ENV === "development") console.log('✅ Using OPTIMIZED mobile material (MeshStandardMaterial) with shadow improvements');
    } else {
      materialRef.current = crystalMaterialRef.current;
      if (process.env.NODE_ENV === "development") console.log('✅ Using full PBR crystal material:', materialVariant);
    }

    if (onMaterialReady) onMaterialReady(materialRef.current);
  }, [materialVariant, materialRef, usePBR, onMaterialReady]);
  
  // Only render PBR material component if PBR is enabled
  if (!usePBR) {
    if (process.env.NODE_ENV === "development") console.log('🚫 Skipping PBR material component (using optimized mobile instead)');
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