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
  materialRefreshKey = 0,
  performanceProfile = {},
  onMaterialReady = null
}) => {
  const crystalMaterialRef = useRef();
  const optimizedMobileRef = useRef();
  const mediumMaterialRef = useRef();
  const { scene } = useThree(); // Scene for environment access
  const lastLowKeyRef = useRef(null);
  const lastMediumKeyRef = useRef(null);
  
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

  const envKey = scene?.environment?.uuid ?? 'none';
  const materialConfigKey = useMemo(
    () =>
      JSON.stringify({
        color: config.materials.crystal.color?.getHex?.() ?? config.materials.crystal.color,
        emissive: config.materials.crystal.emissive?.getHex?.() ?? config.materials.crystal.emissive,
        roughness: config.materials.crystal.roughness,
        metalness: config.materials.crystal.metalness,
        envMapIntensity: config.materials.crystal.envMapIntensity,
        opacity: config.materials.crystal.opacity,
        transmission: config.materials.crystal.transmission,
        ior: config.materials.crystal.ior,
        clearcoat: config.materials.crystal.clearcoat,
        iridescence: config.materials.crystal.iridescence,
        thickness: config.materials.crystal.thickness
      }),
    [config.materials.crystal]
  );

  const lowKey = `${envKey}:${materialVariant}:${materialConfigKey}`;
  const mediumKey = `${envKey}:${materialVariant}:${materialConfigKey}`;

  const toFiniteNumber = (value, fallback) => {
    if (value === null || value === undefined) return fallback;
    const parsed = typeof value === 'string' ? parseFloat(value) : value;
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const sanitizeOpacity = (value, fallback) => {
    const numeric = toFiniteNumber(value, fallback);
    return clamp(numeric, 0, 1);
  };

  const sanitizeLowMaterial = (material, variant) => {
    if (!material) return;
    material.metalness = clamp(toFiniteNumber(material.metalness, 0.1), 0, 0.9);
    material.roughness = clamp(toFiniteNumber(material.roughness, 0.05), 0.02, 1);
    material.envMapIntensity = clamp(toFiniteNumber(material.envMapIntensity, 1.0), 0, 10);
    material.emissiveIntensity = clamp(toFiniteNumber(material.emissiveIntensity, 0.03), 0, 10);
    material.opacity = sanitizeOpacity(material.opacity, 0.99);
    material.reflectivity = clamp(toFiniteNumber(material.reflectivity, 1.0), 0, 2);
    material.transparent = material.opacity < 1;
    material.needsUpdate = true;

    if (import.meta.env.DEV && variant) {
      console.log('🧪 Low material sanitized:', {
        variant,
        metalness: material.metalness,
        roughness: material.roughness,
        envMapIntensity: material.envMapIntensity,
        emissiveIntensity: material.emissiveIntensity,
        opacity: material.opacity,
        transparent: material.transparent
      });
    }
  };

  const sanitizeMediumMaterial = (material, variant) => {
    if (!material) return;
    material.metalness = clamp(toFiniteNumber(material.metalness, 0.0), 0, 0.9);
    material.roughness = clamp(toFiniteNumber(material.roughness, 0.05), 0.02, 1);
    material.envMapIntensity = clamp(toFiniteNumber(material.envMapIntensity, 1.0), 0, 10);
    material.emissiveIntensity = clamp(toFiniteNumber(material.emissiveIntensity, 0.1), 0, 10);
    material.reflectivity = clamp(toFiniteNumber(material.reflectivity, 1.0), 0, 2);
    material.opacity = sanitizeOpacity(material.opacity, 0.99);
    material.clearcoat = clamp(toFiniteNumber(material.clearcoat, 0), 0, 1);
    material.iridescence = clamp(toFiniteNumber(material.iridescence, 0), 0, 1);
    material.transmission = clamp(toFiniteNumber(material.transmission, 0), 0, 1);
    material.thickness = clamp(toFiniteNumber(material.thickness, 0), 0, 5);
    material.ior = clamp(toFiniteNumber(material.ior, 1.5), 1, 3);
    material.transparent = material.opacity < 1;
    material.needsUpdate = true;

    if (import.meta.env.DEV && variant) {
      console.log('🧪 Medium material sanitized:', {
        variant,
        metalness: material.metalness,
        roughness: material.roughness,
        envMapIntensity: material.envMapIntensity,
        emissiveIntensity: material.emissiveIntensity,
        opacity: material.opacity,
        transparent: material.transparent
      });
    }
  };

  const detectPoisonedFields = (material, fields) => {
    const poisoned = [];
    fields.forEach((field) => {
      const value = material?.[field];
      if (!Number.isFinite(value)) {
        poisoned.push({ field, value });
      }
    });
    return poisoned;
  };
  
  if (import.meta.env.DEV) console.log('🎨 MaterialManager: PBR enabled?', usePBR, 'PBR quality:', pbrQuality, 'Performance config:', safePerformanceConfig);

  // OPTIMIZED: Create high-performance mobile material using MeshStandardMaterial
  useEffect(() => {
    if (!isLow) return;

    if (lowKey === lastLowKeyRef.current && optimizedMobileRef.current) return;
    lastLowKeyRef.current = lowKey;

    if (optimizedMobileRef.current) {
      optimizedMobileRef.current.normalMap?.dispose?.();
      optimizedMobileRef.current.dispose?.();
      optimizedMobileRef.current = null;
    }

    if (!optimizedMobileRef.current) {
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
        side: THREE.DoubleSide,              // Render both sides so overlays mirror crystal behavior
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
      optimizedMaterial.envMap = scene?.environment ?? null;
      
      // CRITICAL: We need to manually set the environment map
      // MeshStandardMaterial doesn't automatically pick it up from the scene
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
      
      sanitizeLowMaterial(optimizedMaterial, materialVariant);
      materialRef.current = optimizedMaterial;
      if (onMaterialReady) onMaterialReady(optimizedMaterial);
    }
  }, [isLow, lowKey, materialVariant, scene?.environment, materialRef, onMaterialReady]);

  // MEDIUM: Create MeshPhysicalMaterial with higher reflectivity
  useEffect(() => {
    if (!isMedium) return;

    if (mediumKey === lastMediumKeyRef.current && mediumMaterialRef.current) return;
    if (import.meta.env.DEV && mediumKey !== lastMediumKeyRef.current) {
      console.log('🔄 Recreating medium material due to envKey change:', {
        envKey,
        materialVariant
      });
    }
    lastMediumKeyRef.current = mediumKey;

    if (mediumMaterialRef.current) {
      if (import.meta.env.DEV) {
        console.log('🧹 Disposing medium material for recreation', { envKey, materialVariant });
      }
      mediumMaterialRef.current.normalMap?.dispose?.();
      mediumMaterialRef.current.dispose?.();
      mediumMaterialRef.current = null;
    }

    if (!mediumMaterialRef.current) {
      if (import.meta.env.DEV) console.log('🚀 Creating MEDIUM quality crystal material');

      const materialProps = {
        color: new THREE.Color('#1f2391'),
        metalness: 0.0,
        roughness: 0.05,
        envMapIntensity: 1.0,
        transparent: true,
        opacity: 0.99,
        side: THREE.DoubleSide,
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
      mediumMat.envMap = scene?.environment ?? null;
      mediumMaterialRef.current = mediumMat;

      if (import.meta.env.DEV) console.log('✅ Medium material created:', {
        variant: materialVariant,
        metalness: mediumMat.metalness,
        roughness: mediumMat.roughness,
        envMapIntensity: mediumMat.envMapIntensity
      });

      sanitizeMediumMaterial(mediumMat, materialVariant);
      materialRef.current = mediumMat;
      if (onMaterialReady) onMaterialReady(mediumMat);
    }
  }, [isMedium, mediumKey, materialVariant, scene?.environment, materialRef, onMaterialReady]);

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

      material.metalness = Math.min(material.metalness, 0.8);
      material.roughness = Math.max(material.roughness, 0.02);
      
      // UPDATED: Ensure shadow settings are maintained
      material.shadowSide = THREE.DoubleSide;
      sanitizeLowMaterial(material);
      requestAnimationFrame(() => invalidate());
      requestAnimationFrame(() => invalidate());
    }
  }, [materialVariant, isLow, config.materials.crystal, invalidate]);

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
      sanitizeMediumMaterial(material);
      requestAnimationFrame(() => invalidate());
      requestAnimationFrame(() => invalidate());
    }
  }, [materialVariant, isMedium, config.materials.crystal, invalidate]);

  useEffect(() => {
    if (!isLow || !optimizedMobileRef.current) return;
    sanitizeLowMaterial(optimizedMobileRef.current);
  }, [isLow, config.materials.crystal]);

  useEffect(() => {
    if (!isMedium || !mediumMaterialRef.current) return;
    sanitizeMediumMaterial(mediumMaterialRef.current);
  }, [isMedium, config.materials.crystal]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const dump = () => {
      const low = optimizedMobileRef.current;
      const medium = mediumMaterialRef.current;
      console.log('🧾 Material dump', {
        pbrQuality,
        low: low
          ? {
              metalness: low.metalness,
              roughness: low.roughness,
              envMapIntensity: low.envMapIntensity,
              opacity: low.opacity,
              transparent: low.transparent,
              emissiveIntensity: low.emissiveIntensity,
              finite: {
                metalness: Number.isFinite(low.metalness),
                roughness: Number.isFinite(low.roughness),
                envMapIntensity: Number.isFinite(low.envMapIntensity),
                opacity: Number.isFinite(low.opacity),
                emissiveIntensity: Number.isFinite(low.emissiveIntensity)
              }
            }
          : null,
        medium: medium
          ? {
              metalness: medium.metalness,
              roughness: medium.roughness,
              envMapIntensity: medium.envMapIntensity,
              opacity: medium.opacity,
              transparent: medium.transparent,
              emissiveIntensity: medium.emissiveIntensity,
              finite: {
                metalness: Number.isFinite(medium.metalness),
                roughness: Number.isFinite(medium.roughness),
                envMapIntensity: Number.isFinite(medium.envMapIntensity),
                opacity: Number.isFinite(medium.opacity),
                emissiveIntensity: Number.isFinite(medium.emissiveIntensity)
              }
            }
          : null
      });
    };

    window.__DUMP_MATERIALS__ = dump;
    return () => {
      if (window.__DUMP_MATERIALS__ === dump) {
        delete window.__DUMP_MATERIALS__;
      }
    };
  }, [pbrQuality]);

  useEffect(() => {
    if (isLow && optimizedMobileRef.current) {
      const poisoned = detectPoisonedFields(optimizedMobileRef.current, [
        'metalness',
        'roughness',
        'envMapIntensity',
        'opacity',
        'emissiveIntensity',
        'reflectivity'
      ]);
      if (poisoned.length) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Low material poisoned; resetting fields:', poisoned);
        }
        sanitizeLowMaterial(optimizedMobileRef.current, materialVariant);
      }
    }
    if (isMedium && mediumMaterialRef.current) {
      const poisoned = detectPoisonedFields(mediumMaterialRef.current, [
        'metalness',
        'roughness',
        'envMapIntensity',
        'opacity',
        'emissiveIntensity',
        'reflectivity',
        'clearcoat',
        'iridescence',
        'transmission',
        'thickness',
        'ior'
      ]);
      if (poisoned.length) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Medium material poisoned; resetting fields:', poisoned);
        }
        sanitizeMediumMaterial(mediumMaterialRef.current, materialVariant);
      }
    }
  }, [isLow, isMedium, materialVariant, config.materials.crystal]);

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
  }, [materialRefreshKey, pbrQuality, materialVariant, materialRef, isLow, isMedium, onMaterialReady]);
  
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
