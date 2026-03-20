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

  // OPTIMIZED: Create high-performance mobile material using MeshPhongMaterial
  useEffect(() => {
    if (isLow && !optimizedMobileRef.current) {
      if (import.meta.env.DEV) console.log('🚀 Creating OPTIMIZED mobile crystal material with MeshPhong highlights');
      
      let materialProps = {
        // Keep the low tier inexpensive, but restore crystal cues with Phong highlights/reflections
        color: new THREE.Color('#1f2391'),
        specular: new THREE.Color('#f7fbff'),
        shininess: 100,
        reflectivity: 0.72,
        combine: THREE.MixOperation,

        transparent: true,
        opacity: 0.99,

        side: THREE.DoubleSide,
        fog: true,
        depthWrite: true,
        depthTest: true,
        shadowSide: THREE.DoubleSide,

        // Slight lift to avoid crushed blacks on low-tier lighting
        emissive: new THREE.Color('#a7ffdb'),
        emissiveIntensity: 0.04,

        precision: safePerformanceConfig.highPrecision ? 'highp' : 'mediump'
      };

      // Apply variant-specific properties (optimized versions)
      switch(materialVariant) {
        case 'glass':
          materialProps.color.set('#f0f8ff');
          materialProps.specular.set('#ffffff');
          materialProps.shininess = 120;
          materialProps.reflectivity = 0.8;
          materialProps.emissive.set('#ffffff');
          materialProps.emissiveIntensity = 0.06;
          break;
          
        case 'gem':
          materialProps.color.set('#6644bb');
          materialProps.specular.set('#ffffff');
          materialProps.shininess = 110;
          materialProps.reflectivity = 0.76;
          materialProps.emissive.set('#220044');
          materialProps.emissiveIntensity = 0.08;
          break;
          
        case 'holographic':
          materialProps.color.set('#00dddd');
          materialProps.specular.set('#ffffff');
          materialProps.shininess = 115;
          materialProps.reflectivity = 0.78;
          materialProps.emissive.set('#004444');
          materialProps.emissiveIntensity = 0.1;
          break;
          
        default:
          if (config.materials.crystal.color) {
            materialProps.color.copy(config.materials.crystal.color);
          }
          if (config.materials.crystal.specularColor) {
            materialProps.specular.copy(config.materials.crystal.specularColor);
          }
          if (config.materials.crystal.emissive) {
            materialProps.emissive.copy(config.materials.crystal.emissive);
          }
          materialProps.shininess = 100;
          materialProps.reflectivity = 0.72;
          materialProps.emissiveIntensity = Math.max(materialProps.emissiveIntensity, 0.04);
          break;
      }
      
      const optimizedMaterial = new THREE.MeshPhongMaterial(materialProps);
      
      optimizedMobileRef.current = optimizedMaterial;
      
      if (import.meta.env.DEV) console.log('✅ OPTIMIZED mobile material created with shadow improvements:', {
        variant: materialVariant,
        transparent: optimizedMaterial.transparent,
        shininess: optimizedMaterial.shininess,
        reflectivity: optimizedMaterial.reflectivity,
        specular: optimizedMaterial.specular.getHexString(),
        emissiveIntensity: optimizedMaterial.emissiveIntensity,
        shadowSide: optimizedMaterial.shadowSide
      });
      
      if (onMaterialReady) onMaterialReady(optimizedMaterial);
    }
  }, [isLow, config.materials.crystal.color, config.materials.crystal.emissive, materialVariant, onMaterialReady]);

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
      mediumMaterialRef.current = mediumMat;

      if (import.meta.env.DEV) console.log('✅ Medium material created:', {
        variant: materialVariant,
        metalness: mediumMat.metalness,
        roughness: mediumMat.roughness,
        envMapIntensity: mediumMat.envMapIntensity
      });

      if (onMaterialReady) onMaterialReady(mediumMat);
    }
  }, [isMedium, materialVariant, config.materials.crystal, onMaterialReady]);

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
          shininess: optimizedMobileRef.current.shininess,
          reflectivity: optimizedMobileRef.current.reflectivity,
          specular: optimizedMobileRef.current.specular.getHexString(),
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
              shininess: optimizedMobileRef.current.shininess,
              reflectivity: optimizedMobileRef.current.reflectivity,
              specular: optimizedMobileRef.current.specular.getHexString()
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

      // Note: Color transitions are handled in UnifiedCrystalScene.jsx.
      // Avoid setting material.color or material.emissive here to prevent overrides.
      // Update material properties based on variant
      switch(materialVariant) {
        case 'glass':
          material.specular.set('#ffffff');
          material.shininess = 120;
          material.reflectivity = 0.8;
          material.emissiveIntensity = Math.max(material.emissiveIntensity, 0.06);
          break;
          
        case 'gem':
          material.specular.set('#ffffff');
          material.shininess = 110;
          material.reflectivity = 0.76;
          material.emissiveIntensity = Math.max(material.emissiveIntensity, 0.08);
          break;
          
        case 'holographic':
          material.specular.set('#ffffff');
          material.shininess = 115;
          material.reflectivity = 0.78;
          material.emissiveIntensity = Math.max(material.emissiveIntensity, 0.1);
          break;
          
        default:
          if (config.materials.crystal.specularColor) {
            material.specular.copy(config.materials.crystal.specularColor);
          } else {
            material.specular.set('#f7fbff');
          }
          material.shininess = 100;
          material.reflectivity = 0.72;
          break;
      }
      
      // UPDATED: Ensure shadow settings are maintained
      material.shadowSide = THREE.DoubleSide;
      material.needsUpdate = true;
    }
  }, [materialVariant, isLow, config.materials.crystal]);

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
    }
  }, [materialVariant, isMedium, config.materials.crystal]);

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
