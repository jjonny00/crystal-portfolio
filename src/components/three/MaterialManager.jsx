// MaterialManager.jsx - UPDATED: Shadow improvements for mobile crystal material
// Creates materials that perform well on mobile while maintaining crystal appearance

import React, { useRef, useEffect, useState } from 'react';
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
  const [hotspotMaterial, setHotspotMaterial] = useState(null);
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

  const crystalConfig = config?.materials?.crystal ?? {};
  const clamp01 = (value) => Math.min(Math.max(value ?? 0, 0), 1);
  const fallbackClearcoat = clamp01(crystalConfig.clearcoat ?? 0.8);
  const fallbackClearcoatRoughness = Math.max(Math.min(crystalConfig.clearcoatRoughness ?? 0.05, 1), 0);
  const fallbackIOR = crystalConfig.ior ?? 2.3;
  const fallbackSpecularIntensity = crystalConfig.specularIntensity ?? 1.0;
  const fallbackSpecularColor = crystalConfig.specularColor ? crystalConfig.specularColor.clone() : new THREE.Color('#ffffff');
  const fallbackReflectivity = clamp01(crystalConfig.reflectivity ?? 0.7);

  const hotspotDebugFlag = safePerformanceConfig.debugCrystalHotspot ?? (import.meta.env.VITE_DEBUG_CRYSTAL_HOTSPOT === 'true');
  const hotspotDebugStepMsRaw = safePerformanceConfig.debugCrystalHotspotStepDuration ?? parseInt(import.meta.env.VITE_DEBUG_CRYSTAL_HOTSPOT_STEP_MS ?? '2500', 10);
  const hotspotDebugStepMs = Number.isFinite(hotspotDebugStepMsRaw) ? hotspotDebugStepMsRaw : 2500;

  const captureMaterialState = (material) => ({
    color: material.color?.clone?.() ?? new THREE.Color('#ffffff'),
    emissive: material.emissive?.clone?.() ?? new THREE.Color('#000000'),
    emissiveIntensity: material.emissiveIntensity,
    metalness: material.metalness,
    roughness: material.roughness,
    envMapIntensity: material.envMapIntensity,
    opacity: material.opacity,
    transparent: material.transparent,
    clearcoat: material.clearcoat,
    clearcoatRoughness: material.clearcoatRoughness,
    specularIntensity: material.specularIntensity,
    specularColor: material.specularColor?.clone?.() ?? new THREE.Color('#ffffff'),
    reflectivity: material.reflectivity,
    ior: material.ior,
    transmission: material.transmission,
    thickness: material.thickness,
    side: material.side
  });

  const restoreMaterialState = (material, state) => {
    if (!state) return;
    material.color?.copy?.(state.color ?? material.color);
    material.emissive?.copy?.(state.emissive ?? material.emissive);
    material.emissiveIntensity = state.emissiveIntensity;
    material.metalness = state.metalness;
    material.roughness = state.roughness;
    material.envMapIntensity = state.envMapIntensity;
    material.opacity = state.opacity;
    material.transparent = state.transparent;
    if (typeof state.clearcoat === 'number') material.clearcoat = state.clearcoat;
    if (typeof state.clearcoatRoughness === 'number') material.clearcoatRoughness = state.clearcoatRoughness;
    if (typeof state.specularIntensity === 'number') material.specularIntensity = state.specularIntensity;
    if (material.specularColor && state.specularColor) material.specularColor.copy(state.specularColor);
    if (typeof state.reflectivity === 'number') material.reflectivity = state.reflectivity;
    if (typeof state.ior === 'number') material.ior = state.ior;
    if (typeof state.transmission === 'number') material.transmission = state.transmission;
    if (typeof state.thickness === 'number') material.thickness = state.thickness;
    if (typeof state.side === 'number') material.side = state.side;
  };

  // OPTIMIZED: Create high-performance mobile material using a trimmed MeshPhysicalMaterial
  useEffect(() => {
    if (isLow && !optimizedMobileRef.current) {
      if (import.meta.env.DEV) console.log('🚀 Creating OPTIMIZED mobile crystal material with shadow improvements');

      // Use MeshPhysicalMaterial so we can keep the clearcoat lobe that brightens direct highlights
      let materialProps = {
        // Match the high-quality dielectric response so hotspots stay bright
        color: new THREE.Color('#1f2391'),
        metalness: 0.05,
        roughness: 0.08,

        // Environment mapping for reflections (key for crystal look!)
        envMapIntensity: 1.0,                // VERY strong environment reflections

        specularIntensity: fallbackSpecularIntensity,
        specularColor: fallbackSpecularColor.clone(),
        reflectivity: fallbackReflectivity,
        clearcoat: fallbackClearcoat * 0.85,
        clearcoatRoughness: Math.max(fallbackClearcoatRoughness, 0.02),
        ior: fallbackIOR,
        transmission: 0,
        thickness: 0,

        // Keep partial transparency for the crystal shell
        transparent: true,
        opacity: 0.82,
        
        // Standard material properties
        side: THREE.DoubleSide,
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
          materialProps.color.set('#f0f8ff');
          materialProps.metalness = 0.02;
          materialProps.roughness = 0.08;
          materialProps.envMapIntensity = 4.0;       // Very strong reflections
          materialProps.emissive.set('#ffffff');     // White emissive
          materialProps.emissiveIntensity = 0.1;     // Subtle
          break;

        case 'gem':
          materialProps.color.set('#6644bb');        // Purple gem
          materialProps.metalness = 0.18;
          materialProps.roughness = 0.08;
          materialProps.envMapIntensity = 2.5;
          materialProps.emissive.set('#220044');     // Purple emissive
          materialProps.emissiveIntensity = 0.3;     // More pronounced
          break;

        case 'holographic':
          materialProps.color.set('#00dddd');        // Cyan
          materialProps.metalness = 0.25;
          materialProps.roughness = 0.06;
          materialProps.envMapIntensity = 3.2;
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
          materialProps.metalness = 0.05;
          materialProps.roughness = 0.1;
          materialProps.envMapIntensity = 1.4;
          materialProps.emissiveIntensity = 0.2;
          break;
      }
      
      // Create the optimized material
      const optimizedMaterial = new THREE.MeshPhysicalMaterial(materialProps);
      
      // CRITICAL: We need to manually set the environment map
      // Three.js won't automatically bind the scene environment to newly created materials
      // We'll set it when the component mounts and environment is available
      optimizedMobileRef.current = optimizedMaterial;
      if (hotspotDebugFlag) setHotspotMaterial(optimizedMaterial);
      
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
  }, [isLow, hotspotDebugFlag, config.materials.crystal.color, config.materials.crystal.emissive, materialVariant, onMaterialReady]);

  // MEDIUM: Create MeshPhysicalMaterial with higher reflectivity
  useEffect(() => {
    if (isMedium && !mediumMaterialRef.current) {
      if (import.meta.env.DEV) console.log('🚀 Creating MEDIUM quality crystal material');

      const materialProps = {
        color: new THREE.Color('#1f2391'),
        metalness: 0.04,
        roughness: 0.08,
        envMapIntensity: 1.5,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        fog: true,
        depthWrite: true,
        depthTest: true,
        shadowSide: THREE.DoubleSide,
        emissive: new THREE.Color('#a7ffdb'),
        emissiveIntensity: 0.1,
        clearcoat: fallbackClearcoat * 0.7,
        clearcoatRoughness: Math.max(fallbackClearcoatRoughness, 0.02),
        ior: fallbackIOR,
        iridescence: 0,
        transmission: 0,
        thickness: 0,
        reflectivity: fallbackReflectivity,
        specularIntensity: fallbackSpecularIntensity,
        specularColor: fallbackSpecularColor.clone(),
        precision: safePerformanceConfig.highPrecision ? 'highp' : 'mediump'
      };

      switch(materialVariant) {
        case 'glass':
          materialProps.color.set('#f0f8ff');
          materialProps.metalness = 0.05;
          materialProps.roughness = 0.09;
          materialProps.envMapIntensity = 3.0;
          materialProps.emissive.set('#ffffff');
          break;
        case 'gem':
          materialProps.color.set('#6644bb');
          materialProps.metalness = 0.18;
          materialProps.roughness = 0.08;
          materialProps.envMapIntensity = 3.0;
          materialProps.emissive.set('#220044');
          break;
        case 'holographic':
          materialProps.color.set('#00dddd');
          materialProps.metalness = 0.25;
          materialProps.roughness = 0.06;
          materialProps.envMapIntensity = 3.5;
          materialProps.emissive.set('#004444');
          break;
        default:
          if (config.materials.crystal.color) {
            materialProps.color.copy(config.materials.crystal.color);
          }
          if (config.materials.crystal.emissive) {
            materialProps.emissive.copy(config.materials.crystal.emissive);
          }
          materialProps.metalness = 0.08;
          materialProps.roughness = 0.1;
          materialProps.envMapIntensity = 2.2;
          break;
      }

      const mediumMat = new THREE.MeshPhysicalMaterial(materialProps);
      mediumMaterialRef.current = mediumMat;
      if (hotspotDebugFlag) setHotspotMaterial(mediumMat);

      if (import.meta.env.DEV) console.log('✅ Medium material created:', {
        variant: materialVariant,
        metalness: mediumMat.metalness,
        roughness: mediumMat.roughness,
        envMapIntensity: mediumMat.envMapIntensity
      });

      if (onMaterialReady) onMaterialReady(mediumMat);
    }
  }, [isMedium, hotspotDebugFlag, materialVariant, config.materials.crystal, onMaterialReady]);

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
          material.color.set('#f0f8ff');
          material.metalness = 0.02;
          material.roughness = 0.08;
          material.envMapIntensity = 3.2;
          material.emissive.set('#ffffff');
          material.emissiveIntensity = Math.max(0.1, currentEmissiveIntensity);
          break;
          
        case 'gem':
          material.color.set('#6644bb');
          material.metalness = 0.18;
          material.roughness = 0.08;
          material.envMapIntensity = 2.6;
          material.emissive.set('#220044');
          material.emissiveIntensity = Math.max(0.3, currentEmissiveIntensity);
          break;
          
        case 'holographic':
          material.color.set('#00dddd');
          material.metalness = 0.25;
          material.roughness = 0.06;
          material.envMapIntensity = 3.2;
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
          material.metalness = 0.05;
          material.roughness = 0.1;
          material.envMapIntensity = 1.5;
          material.emissiveIntensity = Math.max(0.15, currentEmissiveIntensity);
          break;
      }

      material.clearcoat = fallbackClearcoat * 0.85;
      material.clearcoatRoughness = Math.max(fallbackClearcoatRoughness, 0.02);
      material.specularIntensity = fallbackSpecularIntensity;
      material.specularColor.copy(fallbackSpecularColor);
      material.ior = fallbackIOR;
      material.thickness = 0;
      material.reflectivity = fallbackReflectivity;

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
          material.metalness = 0.05;
          material.roughness = 0.09;
          material.envMapIntensity = 3.2;
          material.emissive.set('#ffffff');
          material.emissiveIntensity = Math.max(0.1, currentEmissiveIntensity);
          break;
        case 'gem':
          material.color.set('#6644bb');
          material.metalness = 0.2;
          material.roughness = 0.08;
          material.envMapIntensity = 3.2;
          material.emissive.set('#220044');
          material.emissiveIntensity = Math.max(0.15, currentEmissiveIntensity);
          break;
        case 'holographic':
          material.color.set('#00dddd');
          material.metalness = 0.28;
          material.roughness = 0.06;
          material.envMapIntensity = 3.5;
          material.emissive.set('#004444');
          material.emissiveIntensity = Math.max(0.2, currentEmissiveIntensity);
          break;
        default:
          if (config.materials.crystal.color) material.color.copy(config.materials.crystal.color);
          if (config.materials.crystal.emissive) material.emissive.copy(config.materials.crystal.emissive);
          material.metalness = 0.1;
          material.roughness = 0.1;
          material.envMapIntensity = 2.4;
          break;
      }

      material.reflectivity = fallbackReflectivity;
      material.specularIntensity = fallbackSpecularIntensity;
      material.specularColor.copy(fallbackSpecularColor);
      material.clearcoat = fallbackClearcoat * 0.7;
      material.clearcoatRoughness = Math.max(fallbackClearcoatRoughness, 0.02);
      material.ior = fallbackIOR;
      material.thickness = 0;
      material.opacity = 0.85;
      
      material.shadowSide = THREE.DoubleSide;
      material.needsUpdate = true;
    }
  }, [materialVariant, isMedium, config.materials.crystal]);

  useEffect(() => {
    if (!hotspotDebugFlag) {
      if (hotspotMaterial) setHotspotMaterial(null);
      return;
    }

    if (!(isLow || isMedium)) {
      if (hotspotMaterial) setHotspotMaterial(null);
      return;
    }

    const candidate = isLow ? optimizedMobileRef.current : mediumMaterialRef.current;
    if (candidate && hotspotMaterial !== candidate) {
      setHotspotMaterial(candidate);
    }
  }, [
    hotspotDebugFlag,
    isLow,
    isMedium,
    hotspotMaterial,
    optimizedMobileRef.current,
    mediumMaterialRef.current
  ]);

  useEffect(() => {
    if (!hotspotDebugFlag || typeof window === 'undefined') return undefined;

    const target = (isLow || isMedium) ? hotspotMaterial : null;
    if (!target) return undefined;

    const originalState = captureMaterialState(target);
    let stepIndex = 0;
    let timeoutId;
    let cancelled = false;

    const debugSteps = [
      {
        label: 'baseline (restored)',
        apply: () => {}
      },
      {
        label: 'clearcoat disabled',
        apply: (material) => {
          material.clearcoat = 0;
          material.clearcoatRoughness = Math.max(originalState.clearcoatRoughness ?? 0.05, 0.05);
        }
      },
      {
        label: 'clearcoat boosted',
        apply: (material) => {
          material.clearcoat = Math.min(1, (originalState.clearcoat ?? fallbackClearcoat) * 1.4);
          material.clearcoatRoughness = Math.max(0.01, (originalState.clearcoatRoughness ?? fallbackClearcoatRoughness) * 0.6);
        }
      },
      {
        label: 'specular disabled',
        apply: (material) => {
          material.specularIntensity = 0;
        }
      },
      {
        label: 'specular boosted',
        apply: (material) => {
          material.specularIntensity = (originalState.specularIntensity ?? fallbackSpecularIntensity) * 2.0;
        }
      },
      {
        label: 'env map disabled',
        apply: (material) => {
          material.envMapIntensity = 0;
        }
      },
      {
        label: 'env map boosted',
        apply: (material) => {
          material.envMapIntensity = Math.max(0, (originalState.envMapIntensity ?? 1) * 3.0);
        }
      },
      {
        label: 'roughness high',
        apply: (material) => {
          material.roughness = Math.min(1, (originalState.roughness ?? 0.1) + 0.35);
        }
      },
      {
        label: 'roughness low',
        apply: (material) => {
          material.roughness = Math.max(0.01, (originalState.roughness ?? 0.1) * 0.25);
        }
      },
      {
        label: 'metalness zero',
        apply: (material) => {
          material.metalness = 0;
        }
      },
      {
        label: 'metalness boosted',
        apply: (material) => {
          material.metalness = clamp01((originalState.metalness ?? 0.05) + 0.45);
        }
      },
      {
        label: 'ior set to air',
        apply: (material) => {
          material.ior = 1.0;
        }
      },
      {
        label: 'ior boosted',
        apply: (material) => {
          material.ior = Math.max(1.01, (originalState.ior ?? fallbackIOR) * 1.4);
        }
      },
      {
        label: 'front-side only',
        apply: (material) => {
          material.side = THREE.FrontSide;
        }
      },
      {
        label: 'double-sided restore',
        apply: (material) => {
          material.side = THREE.DoubleSide;
        }
      }
    ];

    const runStep = () => {
      if (cancelled || !target) return;

      restoreMaterialState(target, originalState);

      const step = debugSteps[stepIndex];
      step.apply(target);
      target.needsUpdate = true;

      if (import.meta.env.DEV) {
        console.groupCollapsed(`💡 Crystal hotspot debug → Step ${stepIndex + 1}/${debugSteps.length}: ${step.label}`);
        console.log('material settings', {
          clearcoat: target.clearcoat,
          clearcoatRoughness: target.clearcoatRoughness,
          specularIntensity: target.specularIntensity,
          envMapIntensity: target.envMapIntensity,
          roughness: target.roughness,
          metalness: target.metalness,
          ior: target.ior,
          side: target.side === THREE.DoubleSide ? 'DoubleSide' : target.side === THREE.FrontSide ? 'FrontSide' : target.side
        });
        console.groupEnd();
      }

      stepIndex = (stepIndex + 1) % debugSteps.length;
      timeoutId = window.setTimeout(runStep, hotspotDebugStepMs);
    };

    runStep();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      restoreMaterialState(target, originalState);
      target.needsUpdate = true;
    };
  }, [
    hotspotDebugFlag,
    hotspotDebugStepMs,
    hotspotMaterial,
    isLow,
    isMedium,
    fallbackClearcoat,
    fallbackClearcoatRoughness,
    fallbackIOR,
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