// MaterialManager.jsx - UPDATED: Shadow improvements for mobile crystal material
// Creates materials that perform well on mobile while maintaining crystal appearance

import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import CrystalMaterial from '../materials/CrystalMaterial';
import { getProfileByTier } from '../../utils/deviceProfiles';
import * as THREE from 'three';

const LOW_TIER_COLOR_HSL = { h: 0, s: 0, l: 0 };

// Maps the profile.material `combine` string to the THREE constant (MeshPhong).
const COMBINE_OPERATION = {
  mix: THREE.MixOperation,
  multiply: THREE.MultiplyOperation,
  add: THREE.AddOperation,
};

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

  const boostLowTierColor = (color, { saturationBoost = 0.1, lightnessBoost = 0.05 } = {}) => {
    color.getHSL(LOW_TIER_COLOR_HSL);
    color.setHSL(
      LOW_TIER_COLOR_HSL.h,
      Math.min(1, LOW_TIER_COLOR_HSL.s + saturationBoost),
      Math.min(0.72, LOW_TIER_COLOR_HSL.l + lightnessBoost)
    );
    return color;
  };
  
  // LOW tier crystal material (MeshPhong). Single writer: creates the material if
  // missing, then applies either the spec-driven default baseline or a debug
  // variant override. The default baseline comes from the active tier profile's
  // `material` block (deviceProfiles.js) — the single source of truth for tuning.
  // Hard ceiling: MeshPhong cannot do transmission/refraction/iridescence; this
  // approximates the glass read with envMap reflections + specular + glow.
  useEffect(() => {
    if (!isLow) return;

    const spec = performanceProfile?.material ?? getProfileByTier(pbrQuality)?.material ?? {};

    let material = optimizedMobileRef.current;
    if (!material) {
      if (import.meta.env.DEV) console.log('🚀 Creating OPTIMIZED mobile crystal material (MeshPhong) from profile.material');
      material = new THREE.MeshPhongMaterial({
        // `color` is the pre-boost base; boostLowTierColor lifts it for low-tier lighting.
        color: boostLowTierColor(new THREE.Color(spec.color ?? '#1f2391'), { saturationBoost: 0.1, lightnessBoost: 0.05 }),
        specular: new THREE.Color(spec.specular ?? '#f7fbff'),
        shininess: spec.shininess ?? 100,
        reflectivity: spec.reflectivity ?? 0.72,
        combine: COMBINE_OPERATION[spec.combine] ?? THREE.MixOperation,
        transparent: true,
        opacity: spec.opacity ?? 0.99,
        side: THREE.DoubleSide,
        fog: true,
        depthWrite: true,
        depthTest: true,
        shadowSide: THREE.DoubleSide,
        emissive: new THREE.Color(spec.emissive ?? '#a7ffdb'),
        emissiveIntensity: spec.emissiveIntensity ?? 0.04,
        precision: safePerformanceConfig.highPrecision ? 'highp' : 'mediump',
      });
      optimizedMobileRef.current = material;
    }

    // Variant handling. Debug-only glass/gem/holographic override on top; `default`
    // re-applies the spec scalars. color/emissive are seeded at creation only —
    // runtime per-project transitions in UnifiedCrystalScene own them after that.
    switch (materialVariant) {
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
        material.specular.set(spec.specular ?? '#f7fbff');
        material.shininess = spec.shininess ?? 100;
        material.reflectivity = spec.reflectivity ?? 0.72;
        break;
    }

    material.shadowSide = THREE.DoubleSide;
    material.needsUpdate = true;
    if (onMaterialReady) onMaterialReady(material);
  }, [isLow, materialVariant, pbrQuality, performanceProfile?.material, onMaterialReady]);

  // MEDIUM tier crystal material (MeshPhysicalMaterial — same class as high).
  // Single writer: creates from the active tier profile's `material` block
  // (deviceProfiles.js, the single source of truth) if missing, then applies the
  // spec-driven default baseline or a debug variant override. Seeded from high's
  // reference values; dial down in the profile to claw back FPS. NOTE: `reflectivity`
  // is intentionally NOT set — on MeshPhysicalMaterial it is coupled to `ior` and
  // setting it clobbers IOR (see crystalConfig.js materials.crystal note).
  useEffect(() => {
    if (!isMedium) return;

    const spec = performanceProfile?.material ?? getProfileByTier(pbrQuality)?.material ?? {};

    let material = mediumMaterialRef.current;
    if (!material) {
      if (import.meta.env.DEV) console.log('🚀 Creating MEDIUM crystal material (MeshPhysical) from profile.material');
      const materialProps = {
        color: new THREE.Color(spec.color ?? '#1f2391'),
        emissive: new THREE.Color(spec.emissive ?? '#a7ffdb'),
        emissiveIntensity: spec.emissiveIntensity ?? 0.1,
        metalness: spec.metalness ?? 0.0,
        roughness: spec.roughness ?? 0.05,
        opacity: spec.opacity ?? 0.99,
        transparent: true,
        transmission: spec.transmission ?? 0,
        thickness: spec.thickness ?? 0,
        iridescence: spec.iridescence ?? 0,
        iridescenceIOR: spec.iridescenceIOR ?? 1.3,
        clearcoat: spec.clearcoat ?? 0,
        clearcoatRoughness: spec.clearcoatRoughness ?? 0,
        envMapIntensity: spec.envMapIntensity ?? 1.0,
        specularIntensity: spec.specularIntensity ?? 1.0,
        specularColor: new THREE.Color(spec.specularColor ?? '#ffffff'),
        side: THREE.DoubleSide,
        fog: true,
        depthWrite: true,
        depthTest: true,
        shadowSide: THREE.DoubleSide,
        flatShading: spec.flatShading ?? false,
        precision: safePerformanceConfig.highPrecision ? 'highp' : 'mediump',
      };
      if (spec.ior !== undefined) materialProps.ior = spec.ior;
      if (spec.attenuationColor) materialProps.attenuationColor = new THREE.Color(spec.attenuationColor);
      if (spec.attenuationDistance !== undefined) materialProps.attenuationDistance = spec.attenuationDistance;

      material = new THREE.MeshPhysicalMaterial(materialProps);
      if (spec.iridescenceThicknessRange && material.iridescenceThicknessRange) {
        material.iridescenceThicknessRange = [...spec.iridescenceThicknessRange];
      }
      mediumMaterialRef.current = material;
    }

    // Variant handling. Debug-only glass/gem/holographic override on top; `default`
    // re-applies the spec scalars. color/emissive are seeded at creation only —
    // runtime per-project transitions in UnifiedCrystalScene own them after that.
    switch (materialVariant) {
      case 'glass':
        material.color.set('#f0f8ff');
        material.metalness = 0.3;
        material.roughness = 0.05;
        material.envMapIntensity = 5.0;
        material.emissive.set('#ffffff');
        break;
      case 'gem':
        material.color.set('#6644bb');
        material.metalness = 0.6;
        material.roughness = 0.08;
        material.envMapIntensity = 5.0;
        material.emissive.set('#220044');
        break;
      case 'holographic':
        material.color.set('#00dddd');
        material.metalness = 0.9;
        material.roughness = 0.02;
        material.envMapIntensity = 5.5;
        material.emissive.set('#004444');
        break;
      default:
        material.metalness = spec.metalness ?? 0.0;
        material.roughness = spec.roughness ?? 0.05;
        material.envMapIntensity = spec.envMapIntensity ?? 1.0;
        material.specularIntensity = spec.specularIntensity ?? 1.0;
        if (material.specularColor && spec.specularColor) material.specularColor.set(spec.specularColor);
        material.opacity = spec.opacity ?? 0.99;
        break;
    }

    material.shadowSide = THREE.DoubleSide;
    material.needsUpdate = true;
    if (onMaterialReady) onMaterialReady(material);
  }, [isMedium, materialVariant, pbrQuality, performanceProfile?.material, onMaterialReady]);

  // CRITICAL: Set environment map for reflections
  useEffect(() => {
    if (isLow && optimizedMobileRef.current && scene) {
      // Check if scene has environment
      if (scene.environment) {
        if (import.meta.env.DEV) console.log('🌍 Setting environment map for mobile material');
        optimizedMobileRef.current.envMap = scene.environment;
        // Match high tier's reflection orientation. High reads scene.environment
        // implicitly (so scene.environmentRotation applies); explicit envMap uses
        // the material's own envMapRotation, so copy it for cross-tier parity.
        if (scene.environmentRotation) optimizedMobileRef.current.envMapRotation.copy(scene.environmentRotation);
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
            if (scene.environmentRotation) optimizedMobileRef.current.envMapRotation.copy(scene.environmentRotation);
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
        // Match high tier's reflection orientation (see mobile note above).
        if (scene.environmentRotation) mediumMaterialRef.current.envMapRotation.copy(scene.environmentRotation);
        mediumMaterialRef.current.needsUpdate = true;
      } else {
        const checkEnv = () => {
          if (scene.environment && mediumMaterialRef.current) {
            mediumMaterialRef.current.envMap = scene.environment;
            if (scene.environmentRotation) mediumMaterialRef.current.envMapRotation.copy(scene.environmentRotation);
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

  // (Variant updates for low/medium are now handled inline by their single-writer
  // create effects above, sourced from the tier profile's `material` block.)

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
        target.normalScale = new THREE.Vector2(0.0075, 0.01);
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
