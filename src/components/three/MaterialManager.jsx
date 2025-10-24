// MaterialManager.jsx - UPDATED: Shadow improvements for mobile crystal material
// Creates materials that perform well on mobile while maintaining crystal appearance

import React, { useRef, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import CrystalMaterial from '../materials/CrystalMaterial';
import * as THREE from 'three';

function normalizeCrystalMaterial(material, quality, pmremEnv) {
  if (!material) return;

  material.envMap = pmremEnv;
  material.envMapIntensity =
    quality === 'low' ? 0.8 : quality === 'medium' ? 1.0 : 1.1;

  const floor = quality === 'low' ? 0.12 : quality === 'medium' ? 0.08 : 0.05;
  material.roughness = Math.max(material.roughness ?? floor, floor);

  if (quality === 'low') {
    material.clearcoat = 0.0;
    material.clearcoatRoughness = 0.0;
  } else if (quality === 'medium') {
    material.clearcoat = Math.max(material.clearcoat ?? 0.3, 0.25);
    material.clearcoatRoughness = Math.max(
      material.clearcoatRoughness ?? 0.12,
      0.1
    );
  }

  material.ior = 1.45;
  material.specularIntensity = 1.0;
  if (material.specularColor?.set) material.specularColor.set(0xffffff);
  material.side = THREE.FrontSide;

  if (material.normalScale?.set) {
    const scale = quality === 'low' ? 0.6 : quality === 'medium' ? 0.8 : 1.0;
    material.normalScale.set(
      material.normalScale.x * scale,
      material.normalScale.y * scale
    );
  }

  material.needsUpdate = true;
}

const MaterialManager = ({
  materialVariant,
  config,
  materialRef,
  performanceProfile = {},
  onMaterialReady = null
}) => {
  const crystalMaterialRef = useRef();
  const optimizedMobileRef = useRef();
  const mediumMaterialRef = useRef();
  const pmremEnvRef = useRef(null);
  const { scene } = useThree(); // Get Three.js scene to access environment
  
  // FIXED: Null safety with proper defaults
  const safePerformanceConfig = {
    pbrQuality: 'high',
    usePBR: true,
    useNormalMaps: true,
    textureQuality: 'high',
    renderScale: 1.0,
    ...performanceProfile
  };

  const pbrQuality = safePerformanceConfig.pbrQuality || (safePerformanceConfig.usePBR === false ? 'low' : 'high');
  const isLow = pbrQuality === 'low';
  const isMedium = pbrQuality === 'medium';
  const usePBR = pbrQuality === 'high';
  const qualityTier = performanceProfile?.tier || (isLow ? 'low' : isMedium ? 'medium' : 'high');

  const applyNormalization = useCallback(
    (material) => {
      if (!material) return;
      const env = pmremEnvRef.current || scene.environment || null;
      normalizeCrystalMaterial(material, qualityTier, env);
    },
    [qualityTier, scene]
  );

  const forwardMaterialReady = useCallback(
    (material) => {
      applyNormalization(material);
      if (onMaterialReady) onMaterialReady(material);
    },
    [applyNormalization, onMaterialReady]
  );
  
  if (import.meta.env.DEV) console.log('🎨 MaterialManager: PBR enabled?', usePBR, 'PBR quality:', pbrQuality, 'Performance config:', safePerformanceConfig);

  // OPTIMIZED: Create high-performance mobile material using MeshStandardMaterial
  useEffect(() => {
    if (isLow && !optimizedMobileRef.current) {
      if (import.meta.env.DEV) console.log('🚀 Creating OPTIMIZED mobile crystal material with shadow improvements');
      
      // Use MeshStandardMaterial instead of MeshPhysicalMaterial for mobile
      // This removes expensive features like transmission, clearcoat, iridescence
      let materialProps = {
        // AGGRESSIVE: Settings similar to gem variant for strong reflections
        color: new THREE.Color('#1f2391'),   // Purple like gem (shows reflections better than blue)
        metalness: 0.1,                      // MUCH higher metallic (like gem variant)
        roughness: 0.05,                     // VERY smooth (like gem variant)
        
        // Environment mapping for reflections (key for crystal look!)
        envMapIntensity: 1.0,                // VERY strong environment reflections

        specularIntensity: 1.0,                    // Bright highlights
        specularColor: new THREE.Color('#ffffff'), // White highlights
        reflectivity: 1.8,                        // High reflectiveness
        
        // NO transparency - major performance gain!
        transparent: true,
        opacity: 0.99,
        
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
          materialProps.envMapIntensity = 1.0;   // Strong reflections
          materialProps.emissiveIntensity = 0.3; // Visible glow
          break;
      }
      
      // Create the optimized material
      const optimizedMaterial = new THREE.MeshStandardMaterial(materialProps);

      optimizedMobileRef.current = optimizedMaterial;
      applyNormalization(optimizedMaterial);
      
      if (import.meta.env.DEV) console.log('✅ OPTIMIZED mobile material created with shadow improvements:', {
        variant: materialVariant,
        transparent: optimizedMaterial.transparent,
        metalness: optimizedMaterial.metalness,
        roughness: optimizedMaterial.roughness,
        envMapIntensity: optimizedMaterial.envMapIntensity,
        emissiveIntensity: optimizedMaterial.emissiveIntensity,
        shadowSide: optimizedMaterial.shadowSide
      });
      
      forwardMaterialReady(optimizedMaterial);
    }
  }, [
    isLow,
    config.materials.crystal.color,
    config.materials.crystal.emissive,
    materialVariant,
    applyNormalization,
    forwardMaterialReady
  ]);

  // MEDIUM: Create MeshPhysicalMaterial with higher reflectivity
  useEffect(() => {
    if (isMedium && !mediumMaterialRef.current) {
      if (import.meta.env.DEV) console.log('🚀 Creating MEDIUM quality crystal material');

      const materialProps = {
        color: new THREE.Color('#1f2391'),
        metalness: 0.0,
        roughness: 0.05,
        envMapIntensity: 1.0,
        transparent: true,
        opacity: 0.99,
        side: THREE.FrontSide,
        fog: true,
        depthWrite: true,
        depthTest: true,
        shadowSide: THREE.DoubleSide,
        emissive: new THREE.Color('#a7ffdb'),
        emissiveIntensity: 0.1,
        clearcoat: 0,
        iridescence: 0,
        transmission: 0,
        reflectivity: 1.9,
        specularIntensity: 1,
        specularColor: new THREE.Color('#ffffff'),
        precision: safePerformanceConfig.highPrecision ? 'highp' : 'mediump'
      };

      switch(materialVariant) {
        case 'glass':
          materialProps.color.set('#f0f8ff');
          materialProps.metalness = 0.3;
          materialProps.roughness = 0.05;
          materialProps.envMapIntensity = 5.0;
          materialProps.emissive.set('#ffffff');
          break;
        case 'gem':
          materialProps.color.set('#6644bb');
          materialProps.metalness = 0.6;
          materialProps.roughness = 0.08;
          materialProps.envMapIntensity = 5.0;
          materialProps.emissive.set('#220044');
          break;
        case 'holographic':
          materialProps.color.set('#00dddd');
          materialProps.metalness = 0.9;
          materialProps.roughness = 0.02;
          materialProps.envMapIntensity = 5.5;
          materialProps.emissive.set('#004444');
          break;
        default:
          if (config.materials.crystal.color) {
            materialProps.color.copy(config.materials.crystal.color);
          }
          if (config.materials.crystal.emissive) {
            materialProps.emissive.copy(config.materials.crystal.emissive);
          }
          materialProps.envMapIntensity = 5.0;
          break;
      }

      const mediumMat = new THREE.MeshPhysicalMaterial(materialProps);
      mediumMaterialRef.current = mediumMat;
      applyNormalization(mediumMat);

      if (import.meta.env.DEV) console.log('✅ Medium material created:', {
        variant: materialVariant,
        metalness: mediumMat.metalness,
        roughness: mediumMat.roughness,
        envMapIntensity: mediumMat.envMapIntensity
      });

      forwardMaterialReady(mediumMat);
    }
  }, [
    isMedium,
    materialVariant,
    config.materials.crystal,
    applyNormalization,
    forwardMaterialReady
  ]);

  useEffect(() => {
    if (!scene) return;

    const applyEnvToMaterials = () => {
      const env = scene.environment;
      if (!env) return false;

      pmremEnvRef.current = env;

      if (optimizedMobileRef.current) {
        if (import.meta.env.DEV) console.log('🌍 Normalizing mobile material with PMREM environment');
        applyNormalization(optimizedMobileRef.current);
      }

      if (mediumMaterialRef.current) {
        if (import.meta.env.DEV) console.log('🌍 Normalizing medium material with PMREM environment');
        applyNormalization(mediumMaterialRef.current);
      }

      if (crystalMaterialRef.current) {
        if (import.meta.env.DEV) console.log('🌍 Normalizing high quality material with PMREM environment');
        applyNormalization(crystalMaterialRef.current);
      }

      return true;
    };

    if (applyEnvToMaterials()) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      if (applyEnvToMaterials()) {
        clearInterval(intervalId);
      }
    }, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [scene, applyNormalization]);

  // Update material when variant changes
  useEffect(() => {
    if (isLow && optimizedMobileRef.current) {
      if (import.meta.env.DEV) console.log('🔄 Updating optimized mobile material for variant:', materialVariant);
      
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
          material.envMapIntensity = 1.0;        // Strong reflections
          material.emissiveIntensity = Math.max(0.0, currentEmissiveIntensity);
          break;
      }
      
      // UPDATED: Ensure shadow settings are maintained
      material.shadowSide = THREE.DoubleSide;
      material.needsUpdate = true;
      applyNormalization(material);
    }
  }, [materialVariant, isLow, config.materials.crystal, applyNormalization]);

  // Update medium material when variant changes
  useEffect(() => {
    if (isMedium && mediumMaterialRef.current) {
      if (import.meta.env.DEV) console.log('🔄 Updating medium material for variant:', materialVariant);

      const material = mediumMaterialRef.current;
      const currentEmissiveIntensity = material.emissiveIntensity;

      switch(materialVariant) {
        case 'glass':
          material.color.set('#f0f8ff');
          material.metalness = 0.3;
          material.roughness = 0.05;
          material.envMapIntensity = 5.0;
          material.emissive.set('#ffffff');
          material.emissiveIntensity = Math.max(0.1, currentEmissiveIntensity);
          break;
        case 'gem':
          material.color.set('#6644bb');
          material.metalness = 0.6;
          material.roughness = 0.08;
          material.envMapIntensity = 5.0;
          material.emissive.set('#220044');
          material.emissiveIntensity = Math.max(0.15, currentEmissiveIntensity);
          break;
        case 'holographic':
          material.color.set('#00dddd');
          material.metalness = 0.9;
          material.roughness = 0.02;
          material.envMapIntensity = 5.5;
          material.emissive.set('#004444');
          material.emissiveIntensity = Math.max(0.2, currentEmissiveIntensity);
          break;
        default:
          if (config.materials.crystal.color) material.color.copy(config.materials.crystal.color);
          if (config.materials.crystal.emissive) material.emissive.copy(config.materials.crystal.emissive);
          material.envMapIntensity = 5.0;
          break;
      }

      material.reflectivity = 0.9;
      material.specularIntensity = 1.2;
      material.specularColor.set('#ffffff');
      material.opacity = 0.85;
      
      material.shadowSide = THREE.DoubleSide;
      material.needsUpdate = true;
      applyNormalization(material);
    }
  }, [materialVariant, isMedium, config.materials.crystal, applyNormalization]);

  // SIMPLIFIED: Normal map support for mobile (optional)
  useEffect(() => {
    const target = isLow ? optimizedMobileRef.current : isMedium ? mediumMaterialRef.current : null;
    if (target && safePerformanceConfig.useNormalMaps && config.assets.textures.normalMap) {
      if (import.meta.env.DEV) console.log('🔧 Adding normal map');

      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(config.assets.textures.normalMap, (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(5, 5);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        texture.anisotropy = 1;

        target.normalMap = texture;
        target.normalScale = new THREE.Vector2(0.5, 0.5);
        target.needsUpdate = true;
        applyNormalization(target);

        if (import.meta.env.DEV) console.log('✅ Normal map added');
      });
    } else if (target && !safePerformanceConfig.useNormalMaps) {
      if (target.normalMap) {
        target.normalMap = null;
        target.normalScale.set(0, 0);
        target.needsUpdate = true;
        applyNormalization(target);
      }
    }
  }, [
    isLow,
    isMedium,
    safePerformanceConfig.useNormalMaps,
    config.assets.textures.normalMap,
    applyNormalization
  ]);

  // Update the main material ref
  useEffect(() => {
    if (import.meta.env.DEV) console.log('🔄 MaterialManager: Updating material reference', {
      variant: materialVariant,
      usePBR,
      previousMaterial: materialRef.current?.type
    });

    if (isLow) {
      materialRef.current = optimizedMobileRef.current;
      if (import.meta.env.DEV) console.log('✅ Using OPTIMIZED mobile material');
    } else if (isMedium) {
      materialRef.current = mediumMaterialRef.current;
      if (import.meta.env.DEV) console.log('✅ Using MEDIUM quality material');
    } else {
      materialRef.current = crystalMaterialRef.current;
      if (import.meta.env.DEV) console.log('✅ Using full PBR crystal material:', materialVariant);
    }

    // Store the base color so clones can reference the original
    if (materialRef.current) {
      applyNormalization(materialRef.current);
      materialRef.current.userData = {
        ...(materialRef.current.userData || {}),
        baseColor: materialRef.current.color.clone()
      };
    }

    if (materialRef.current) {
      forwardMaterialReady(materialRef.current);
    }
  }, [
    materialVariant,
    materialRef,
    isLow,
    isMedium,
    applyNormalization,
    forwardMaterialReady
  ]);
  
  // Only render PBR material component if PBR is enabled
  if (!usePBR) {
    if (import.meta.env.DEV) console.log('🚫 Skipping PBR material component (using standard material instead)');
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
      onMaterialReady={forwardMaterialReady}
    />
  );
};

export default React.memo(MaterialManager);