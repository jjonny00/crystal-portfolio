// MaterialManager.jsx - UPDATED: Shadow improvements for mobile crystal material
// Creates materials that perform well on mobile while maintaining crystal appearance

import React, { useRef, useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import CrystalMaterial from '../materials/CrystalMaterial';
import * as THREE from 'three';

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
  
  if (import.meta.env.DEV) console.log('🎨 MaterialManager: PBR enabled?', usePBR, 'PBR quality:', pbrQuality, 'Performance config:', safePerformanceConfig);

  const brightenColor = (color, amount = 0.35) => color.clone().lerp(new THREE.Color('#ffffff'), amount);
  const crystalConfig = config?.materials?.crystal ?? {};
  const baseIor = crystalConfig.ior ?? 2.3;
  const baseSpecularIntensity = crystalConfig.specularIntensity ?? 1.0;
  const baseSpecularColor = useMemo(() => {
    const specColor = crystalConfig.specularColor;
    if (specColor?.isColor) {
      return specColor.clone();
    }

    if (typeof specColor === 'string') {
      return new THREE.Color(specColor);
    }

    return new THREE.Color('#ffffff');
  }, [crystalConfig.specularColor]);
  const baseClearcoat = crystalConfig.clearcoat ?? 0.8;
  const baseClearcoatRoughness = crystalConfig.clearcoatRoughness ?? 0.05;
  const baseReflectivity = THREE.MathUtils.clamp(crystalConfig.reflectivity ?? 0.7, 0, 1);
  const fallbackSpecularIntensity = Math.max(baseSpecularIntensity, 1.6);

  // OPTIMIZED: Create high-performance mobile material using MeshPhysicalMaterial
  useEffect(() => {
    if (isLow && !optimizedMobileRef.current) {
      if (import.meta.env.DEV) console.log('🚀 Creating OPTIMIZED mobile crystal material with shadow improvements');

      // Use MeshPhysicalMaterial to retain specular Fresnel control while keeping heavy features disabled
      let materialProps = {
        // AGGRESSIVE: Settings similar to gem variant for strong reflections
        color: brightenColor(new THREE.Color('#1f2391')),   // Purple like gem (shows reflections better than blue)
        metalness: 0.08,                      // Keep in dielectric range
        roughness: 0.08,                     // Slightly softer for smoother falloff
        
        // Environment mapping for reflections (key for crystal look!)
        envMapIntensity: 1.0,                // VERY strong environment reflections

        specularIntensity: fallbackSpecularIntensity,                    // Bright highlights
        specularColor: baseSpecularColor.clone(), // White highlights
        ior: baseIor,
        reflectivity: baseReflectivity,                        // High reflectiveness

        // NO transmission - keep partially transparent for bright core
        transparent: true,
        opacity: 0.68,
        transmission: 0,
        thickness: 0,

        clearcoat: baseClearcoat,
        clearcoatRoughness: Math.max(baseClearcoatRoughness, 0.03),
        
        // Standard material properties
        side: THREE.DoubleSide,              // Render both sides to preserve internal reflections
        fog: true,
        
        // CRITICAL: Enable depth writing for proper rendering
        depthWrite: true,
        depthTest: true,
        
        // UPDATED: Enhanced shadow settings for better transparent lighting simulation
        shadowSide: THREE.DoubleSide,        // Render shadows on both sides when needed
        
        // Emissive glow to simulate internal light
        emissive: new THREE.Color('#a7ffdb'), // Purple emissive (like gem)
        emissiveIntensity: 0.12,              // More pronounced glow
        
        // Use higher precision only when needed
        precision: safePerformanceConfig.highPrecision ? 'highp' : 'mediump'


      };

      // Apply variant-specific properties (optimized versions)
      switch(materialVariant) {
        case 'glass':
          materialProps.color = brightenColor(new THREE.Color('#f0f8ff'), 0.15);
          materialProps.metalness = 0.05;
          materialProps.roughness = 0.08;
          materialProps.envMapIntensity = 3.0;
          materialProps.emissive.set('#ffffff');
          materialProps.emissiveIntensity = 0.12;
          break;

        case 'gem':
          materialProps.color = brightenColor(new THREE.Color('#6644bb'), 0.4);
          materialProps.metalness = 0.08;
          materialProps.roughness = 0.08;
          materialProps.envMapIntensity = 2.8;
          materialProps.emissive.set('#332266');
          materialProps.emissiveIntensity = 0.18;
          break;

        case 'holographic':
          materialProps.color = brightenColor(new THREE.Color('#00dddd'), 0.25);
          materialProps.metalness = 0.1;
          materialProps.roughness = 0.05;
          materialProps.envMapIntensity = 3.5;
          materialProps.emissive.set('#006666');
          materialProps.emissiveIntensity = 0.22;
          break;

        default:
          // Use config colors if available, but keep gem-like settings
          if (config.materials.crystal.color) {
            materialProps.color.copy(brightenColor(config.materials.crystal.color));
          }
          if (config.materials.crystal.emissive) {
            materialProps.emissive.copy(config.materials.crystal.emissive);
          }
          // KEEP dielectric with soft reflections
          materialProps.metalness = 0.05;
          materialProps.roughness = 0.08;
          materialProps.envMapIntensity = 2.5;
          materialProps.emissiveIntensity = 0.12;
          break;
      }
      
      // Create the optimized material
      const optimizedMaterial = new THREE.MeshPhysicalMaterial(materialProps);
      
      // CRITICAL: We need to manually set the environment map
      // The optimized MeshPhysicalMaterial doesn't automatically pick it up from the scene
      // We'll set it when the component mounts and environment is available
      optimizedMobileRef.current = optimizedMaterial;
      
      if (import.meta.env.DEV) console.log('✅ OPTIMIZED mobile material created with shadow improvements:', {
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
  }, [
    isLow,
    config.materials.crystal.color,
    config.materials.crystal.emissive,
    baseIor,
    baseSpecularIntensity,
    baseSpecularColor,
    baseClearcoat,
    baseClearcoatRoughness,
    baseReflectivity,
    fallbackSpecularIntensity,
    materialVariant,
    onMaterialReady
  ]);

  // MEDIUM: Create MeshPhysicalMaterial with higher reflectivity
  useEffect(() => {
    if (isMedium && !mediumMaterialRef.current) {
      if (import.meta.env.DEV) console.log('🚀 Creating MEDIUM quality crystal material');

      const materialProps = {
        color: brightenColor(new THREE.Color('#1f2391')),
        metalness: 0.08,
        roughness: 0.08,
        envMapIntensity: 2.5,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        fog: true,
        depthWrite: true,
        depthTest: true,
        shadowSide: THREE.DoubleSide,
        emissive: new THREE.Color('#a7ffdb'),
        emissiveIntensity: 0.15,
        clearcoat: 0,
        iridescence: 0,
        transmission: 0,
        reflectivity: baseReflectivity,
        specularIntensity: fallbackSpecularIntensity,
        specularColor: baseSpecularColor.clone(),
        ior: baseIor,
        clearcoat: baseClearcoat,
        clearcoatRoughness: Math.max(baseClearcoatRoughness, 0.03),
        precision: safePerformanceConfig.highPrecision ? 'highp' : 'mediump'
      };

      switch(materialVariant) {
        case 'glass':
          materialProps.color = brightenColor(new THREE.Color('#f0f8ff'), 0.15);
          materialProps.metalness = 0.05;
          materialProps.roughness = 0.08;
          materialProps.envMapIntensity = 3.5;
          materialProps.emissive.set('#ffffff');
          break;
        case 'gem':
          materialProps.color = brightenColor(new THREE.Color('#6644bb'), 0.4);
          materialProps.metalness = 0.08;
          materialProps.roughness = 0.08;
          materialProps.envMapIntensity = 3.0;
          materialProps.emissive.set('#332266');
          break;
        case 'holographic':
          materialProps.color = brightenColor(new THREE.Color('#00dddd'), 0.25);
          materialProps.metalness = 0.1;
          materialProps.roughness = 0.05;
          materialProps.envMapIntensity = 4.0;
          materialProps.emissive.set('#006666');
          break;
        default:
          if (config.materials.crystal.color) {
            materialProps.color.copy(brightenColor(config.materials.crystal.color));
          }
          if (config.materials.crystal.emissive) {
            materialProps.emissive.copy(config.materials.crystal.emissive);
          }
          materialProps.envMapIntensity = 3.0;
          break;
      }

      const mediumMat = new THREE.MeshPhysicalMaterial(materialProps);
      mediumMaterialRef.current = mediumMat;

      if (import.meta.env.DEV) console.log('✅ Medium material created:', {
        variant: materialVariant,
        metalness: mediumMat.metalness,
        roughness: mediumMat.roughness,
        envMapIntensity: mediumMat.envMapIntensity
      });

      if (onMaterialReady) onMaterialReady(mediumMat);
    }
  }, [
    isMedium,
    materialVariant,
    config.materials.crystal,
    baseIor,
    baseSpecularIntensity,
    baseSpecularColor,
    baseClearcoat,
    baseClearcoatRoughness,
    baseReflectivity,
    fallbackSpecularIntensity,
    onMaterialReady
  ]);

  // CRITICAL: Set environment map for reflections
  useEffect(() => {
    if (isLow && optimizedMobileRef.current && scene) {
      // Check if scene has environment
      if (scene.environment) {
        if (import.meta.env.DEV) console.log('🌍 Setting environment map for mobile material');
        optimizedMobileRef.current.envMap = scene.environment;
        optimizedMobileRef.current.needsUpdate = true;
        
        // DEBUG: Log material properties to verify settings
        if (import.meta.env.DEV) console.log('🔍 Mobile material debug:', {
          hasEnvMap: !!optimizedMobileRef.current.envMap,
          metalness: optimizedMobileRef.current.metalness,
          roughness: optimizedMobileRef.current.roughness,
          envMapIntensity: optimizedMobileRef.current.envMapIntensity,
          color: optimizedMobileRef.current.color.getHexString(),
          emissiveIntensity: optimizedMobileRef.current.emissiveIntensity,
          shadowSide: optimizedMobileRef.current.shadowSide
        });
      } else {
        if (import.meta.env.DEV) console.log('⏳ Waiting for environment to load...');
        // Wait for environment to load
        const checkEnvironment = () => {
          if (scene.environment && optimizedMobileRef.current) {
            if (import.meta.env.DEV) console.log('🌍 Environment loaded - applying to mobile material');
            optimizedMobileRef.current.envMap = scene.environment;
            optimizedMobileRef.current.needsUpdate = true;
            
            // DEBUG: Log material properties
            if (import.meta.env.DEV) console.log('🔍 Mobile material debug (delayed):', {
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
  }, [isLow, optimizedMobileRef.current, scene]);

  // Apply environment map for medium material
  useEffect(() => {
    if (isMedium && mediumMaterialRef.current && scene) {
      if (scene.environment) {
        if (import.meta.env.DEV) console.log('🌍 Setting environment map for medium material');
        mediumMaterialRef.current.envMap = scene.environment;
        mediumMaterialRef.current.needsUpdate = true;
      } else {
        const checkEnv = () => {
          if (scene.environment && mediumMaterialRef.current) {
            mediumMaterialRef.current.envMap = scene.environment;
            mediumMaterialRef.current.needsUpdate = true;
          }
        };
        const intervalId = setInterval(() => {
          if (scene.environment) {
            checkEnv();
            clearInterval(intervalId);
          }
        }, 100);
        setTimeout(() => clearInterval(intervalId), 5000);
      }
    }
  }, [isMedium, mediumMaterialRef.current, scene]);

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
          material.color.copy(brightenColor(new THREE.Color('#f0f8ff'), 0.15));
          material.metalness = 0.05;
          material.roughness = 0.08;
          material.envMapIntensity = 3.0;
          material.emissive.set('#ffffff');
          material.emissiveIntensity = Math.max(0.12, currentEmissiveIntensity);
          break;

        case 'gem':
          material.color.copy(brightenColor(new THREE.Color('#6644bb'), 0.4));
          material.metalness = 0.08;
          material.roughness = 0.08;
          material.envMapIntensity = 2.8;
          material.emissive.set('#332266');
          material.emissiveIntensity = Math.max(0.18, currentEmissiveIntensity);
          break;

        case 'holographic':
          material.color.copy(brightenColor(new THREE.Color('#00dddd'), 0.25));
          material.metalness = 0.1;
          material.roughness = 0.05;
          material.envMapIntensity = 3.5;
          material.emissive.set('#006666');
          material.emissiveIntensity = Math.max(0.22, currentEmissiveIntensity);
          break;

        default:
          if (config.materials.crystal.color) {
            material.color.copy(brightenColor(config.materials.crystal.color));
          }
          if (config.materials.crystal.emissive) {
            material.emissive.copy(config.materials.crystal.emissive);
          }
          // AGGRESSIVE: Use gem-like settings for strong reflections
          material.metalness = 0.05;
          material.roughness = 0.08;
          material.envMapIntensity = 2.5;
          material.emissiveIntensity = Math.max(0.12, currentEmissiveIntensity);
          break;
      }

      // UPDATED: Ensure shadow settings are maintained
      material.shadowSide = THREE.DoubleSide;
      material.ior = baseIor;
      material.specularIntensity = fallbackSpecularIntensity;
      material.specularColor.copy(baseSpecularColor);
      material.reflectivity = baseReflectivity;
      material.clearcoat = baseClearcoat;
      material.clearcoatRoughness = Math.max(baseClearcoatRoughness, 0.03);
      material.needsUpdate = true;
    }
  }, [
    materialVariant,
    isLow,
    config.materials.crystal,
    baseIor,
    baseSpecularIntensity,
    baseSpecularColor,
    baseClearcoat,
    baseClearcoatRoughness,
    baseReflectivity,
    fallbackSpecularIntensity
  ]);

  // Update medium material when variant changes
  useEffect(() => {
    if (isMedium && mediumMaterialRef.current) {
      if (import.meta.env.DEV) console.log('🔄 Updating medium material for variant:', materialVariant);

      const material = mediumMaterialRef.current;
      const currentEmissiveIntensity = material.emissiveIntensity;

      switch(materialVariant) {
        case 'glass':
          material.color.copy(brightenColor(new THREE.Color('#f0f8ff'), 0.15));
          material.metalness = 0.05;
          material.roughness = 0.08;
          material.envMapIntensity = 3.5;
          material.emissive.set('#ffffff');
          material.emissiveIntensity = Math.max(0.15, currentEmissiveIntensity);
          break;
        case 'gem':
          material.color.copy(brightenColor(new THREE.Color('#6644bb'), 0.4));
          material.metalness = 0.08;
          material.roughness = 0.08;
          material.envMapIntensity = 3.0;
          material.emissive.set('#332266');
          material.emissiveIntensity = Math.max(0.18, currentEmissiveIntensity);
          break;
        case 'holographic':
          material.color.copy(brightenColor(new THREE.Color('#00dddd'), 0.25));
          material.metalness = 0.1;
          material.roughness = 0.05;
          material.envMapIntensity = 4.0;
          material.emissive.set('#006666');
          material.emissiveIntensity = Math.max(0.22, currentEmissiveIntensity);
          break;
        default:
          if (config.materials.crystal.color) material.color.copy(brightenColor(config.materials.crystal.color));
          if (config.materials.crystal.emissive) material.emissive.copy(config.materials.crystal.emissive);
          material.envMapIntensity = 3.0;
          break;
      }

      material.reflectivity = baseReflectivity;
      material.specularIntensity = fallbackSpecularIntensity;
      material.specularColor.copy(baseSpecularColor);
      material.ior = baseIor;
      material.clearcoat = baseClearcoat;
      material.clearcoatRoughness = Math.max(baseClearcoatRoughness, 0.03);
      material.opacity = 0.75;

      material.shadowSide = THREE.DoubleSide;
      material.needsUpdate = true;
    }
  }, [
    materialVariant,
    isMedium,
    config.materials.crystal,
    baseIor,
    baseSpecularIntensity,
    baseSpecularColor,
    baseClearcoat,
    baseClearcoatRoughness,
    baseReflectivity,
    fallbackSpecularIntensity
  ]);

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

        if (import.meta.env.DEV) console.log('✅ Normal map added');
      });
    } else if (target && !safePerformanceConfig.useNormalMaps) {
      if (target.normalMap) {
        target.normalMap = null;
        target.normalScale.set(0, 0);
        target.needsUpdate = true;
      }
    }
  }, [isLow, isMedium, safePerformanceConfig.useNormalMaps, config.assets.textures.normalMap]);

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
      materialRef.current.userData = {
        ...(materialRef.current.userData || {}),
        baseColor: materialRef.current.color.clone()
      };
    }

    if (onMaterialReady) onMaterialReady(materialRef.current);
  }, [materialVariant, materialRef, isLow, isMedium, onMaterialReady]);
  
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
      onMaterialReady={onMaterialReady}
    />
  );
};

export default React.memo(MaterialManager);