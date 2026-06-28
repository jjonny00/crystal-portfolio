// CrystalMaterial.jsx - UPDATED: Better shadow handling for transparent materials
// Creates materials that look great whether PBR is enabled or disabled

import React, { useEffect } from 'react';
import * as THREE from 'three';

/**
 * Enhanced Crystal Material Component
 * Creates high-quality materials that work well in both PBR and non-PBR modes
 * UPDATED: Improved shadow handling for transparent lighting
 */
const CrystalMaterial = ({
  config,
  materialRef,
  variant = 'default',
  performanceConfig = {},
  onMaterialReady = null
}) => {
  // Set default performance settings if not provided
  const {
    useNormalMaps = true,
    textureQuality = 'high',
    pbrQuality = 'high'
  } = performanceConfig;

  const usePBR = pbrQuality !== 'low';
  const isMedium = pbrQuality === 'medium';
  
  // ENHANCED: Create material with better shadow handling for transparent objects
  useEffect(() => {
    const createMaterial = () => {
      const baseConfig = { ...config.materials.crystal };
      
      // ENHANCED: Apply variant-specific overrides with optimized settings
      switch(variant) {
        case 'glass':
          // Glass variant - optimized for both PBR and non-PBR
          baseConfig.color = new THREE.Color('#ffffff');
          baseConfig.transmission = usePBR ? 0.95 : 0.5; // Adaptive transmission
          baseConfig.ior = usePBR ? 1.5 : 1.4;
          baseConfig.metalness = 0.0;
          baseConfig.roughness = usePBR ? 0.05 : 0.08;
          baseConfig.attenuationColor = new THREE.Color('#ffffff');
          baseConfig.attenuationDistance = usePBR ? 0.5 : 0.3;
          baseConfig.clearcoat = usePBR ? 1.0 : 0.8;
          baseConfig.clearcoatRoughness = usePBR ? 0.02 : 0.03;
          baseConfig.iridescence = usePBR ? 0.1 : 0.15;
          baseConfig.iridescenceIOR = 1.5;
          baseConfig.emissive = new THREE.Color('#ffffff');
          baseConfig.emissiveIntensity = 0.03;
          baseConfig.envMapIntensity = usePBR ? 10.5 : 1.2;
          baseConfig.opacity = usePBR ? 0.4 : 0.6;
          break;
          
        case 'gem':
          // Gem variant - rich purple gemstone
          baseConfig.color = new THREE.Color('#7b4bbc');
          baseConfig.transmission = usePBR ? 0.7 : 0.4;
          baseConfig.ior = usePBR ? 2.5 : 2.0;
          baseConfig.metalness = usePBR ? 0.1 : 0.15;
          baseConfig.roughness = usePBR ? 0.05 : 0.08;
          baseConfig.attenuationColor = new THREE.Color('#7b4bbc');
          baseConfig.attenuationDistance = usePBR ? 0.2 : 0.15;
          baseConfig.clearcoat = usePBR ? 0.8 : 0.7;
          baseConfig.clearcoatRoughness = usePBR ? 0.01 : 0.02;
          baseConfig.iridescence = usePBR ? 0.5 : 0.6;
          baseConfig.iridescenceIOR = 1.2;
          baseConfig.emissive = new THREE.Color('#7b4bbc');
          baseConfig.emissiveIntensity = 0.08;
          baseConfig.envMapIntensity = usePBR ? 1.3 : 1.1;
          baseConfig.opacity = usePBR ? 0.7 : 0.8;
          break;
          
        case 'holographic':
          // Holographic variant - futuristic colorful effect
          baseConfig.color = new THREE.Color('#00ffff');
          baseConfig.transmission = usePBR ? 0.6 : 0.4;
          baseConfig.ior = usePBR ? 2.0 : 1.8;
          baseConfig.metalness = usePBR ? 0.3 : 0.5;
          baseConfig.roughness = usePBR ? 0.1 : 0.05;
          baseConfig.attenuationColor = new THREE.Color('#ff00ff');
          baseConfig.attenuationDistance = usePBR ? 0.1 : 0.08;
          baseConfig.clearcoat = usePBR ? 1.0 : 0.9;
          baseConfig.clearcoatRoughness = usePBR ? 0.0 : 0.01;
          baseConfig.iridescence = usePBR ? 1.0 : 0.8;
          baseConfig.iridescenceIOR = usePBR ? 2.0 : 1.8;
          baseConfig.emissive = new THREE.Color('#00ffff');
          baseConfig.emissiveIntensity = 0.15;
          baseConfig.envMapIntensity = usePBR ? 2.0 : 1.5;
          baseConfig.opacity = usePBR ? 0.6 : 0.7;
          break;

        default:
          // Default variant - adaptive settings based on PBR availability
          if (!usePBR) {
            // ENHANCED: Non-PBR optimizations while maintaining visual quality
            baseConfig.transmission = baseConfig.transmission * 0.6;
            baseConfig.ior = Math.min(baseConfig.ior, 2.0);
            baseConfig.clearcoat = baseConfig.clearcoat * 0.8;
            baseConfig.iridescence = baseConfig.iridescence * 0.8;
            baseConfig.attenuationDistance = baseConfig.attenuationDistance * 1.2;
            baseConfig.envMapIntensity = Math.max(baseConfig.envMapIntensity * 0.9, 1.0);
            baseConfig.opacity = Math.min(baseConfig.opacity + 0.1, 0.9);
            
            // ENHANCED: Boost other properties to compensate
            baseConfig.metalness = Math.min(baseConfig.metalness + 0.05, 0.2);
            baseConfig.reflectivity = Math.min(baseConfig.reflectivity + 0.1, 1.0);
          }
          break;
      }

      // Apply medium quality tweaks. Transmission is intentionally NOT reduced here:
      // a more-opaque surface makes the additive internal glow read much brighter
      // (and bloom amplifies it), so medium keeps high's transmission for glow parity.
      if (isMedium && usePBR) {
        if (baseConfig.clearcoat !== undefined) baseConfig.clearcoat *= 0.7;
        if (baseConfig.iridescence !== undefined) baseConfig.iridescence *= 0.5;
      }
      
      // UPDATED: Create material with improved shadow handling for transparent objects
      const materialProps = {
        ...baseConfig,
        
        // Essential properties for crystal appearance
        transparent: true,
        side: THREE.DoubleSide,
        fog: true,
        
        // Depth settings for proper transparency
        depthWrite: true,    // Keep depth writing for proper occlusion
        depthTest: true,     // Keep depth testing
        
        // UPDATED: Enhanced shadow settings for transparent materials
        shadowSide: THREE.DoubleSide,  // Render shadows on both sides for transparency
        
        // ENHANCED: Additional properties for better visual quality
        flatShading: false, // Smooth shading for crystal
        vertexColors: false, // Use material colors
        
        // ENHANCED: Optimize precision based on device capability
        precision: performanceConfig.highPrecision ? 'highp' : 'mediump'
      };
      
      // Create the material
      const material = new THREE.MeshPhysicalMaterial(materialProps);
      
      // ENHANCED: Add properties that might not be in the base config
      if (material.iridescenceThicknessRange) {
        material.iridescenceThicknessRange = [100, 400]; // Good range for rainbow effects
      }
      
      // Store the material
      materialRef.current = material;
      if (onMaterialReady) onMaterialReady(material);
      
      if (import.meta.env.DEV) console.log('✅ Enhanced crystal material created with improved shadow handling:', {
        variant,
        usePBR,
        transmission: material.transmission,
        clearcoat: material.clearcoat,
        iridescence: material.iridescence,
        envMapIntensity: material.envMapIntensity,
        shadowSide: material.shadowSide,
        depthWrite: material.depthWrite
      });
    };
    
    // ENHANCED: Update existing material with better property handling
    const updateMaterial = () => {
      if (!materialRef.current) return;
      
      const material = materialRef.current;
      
      // Store current emissive intensity for dynamic effects
      const currentEmissiveIntensity = material.emissiveIntensity || 0;
      
      // Update core properties
      Object.entries(config.materials.crystal).forEach(([key, value]) => {
        // Skip complex properties that need special handling
        if (key === 'emissive' || key === 'color' || key === 'attenuationColor' || key === 'specularColor') {
          return;
        }
        
        // ENHANCED: Handle PBR-specific properties based on capability
        if (!usePBR && (
          key === 'clearcoat' || 
          key === 'clearcoatRoughness' || 
          key === 'iridescence' || 
          key === 'iridescenceIOR' || 
          key === 'iridescenceThicknessRange'
        )) {
          if (key === 'clearcoat') {
            material[key] = value * 0.8; // Reduced but still visible
          } else if (key === 'iridescence') {
            material[key] = value * 0.8; // Reduced but still colorful
          } else if (key === 'clearcoatRoughness' || key === 'iridescenceIOR') {
            material[key] = value; // Keep these as they're not expensive
          }
          return;
        }
        
        // ENHANCED: Adjust transmission and IOR for non-PBR mode
        if (!usePBR && key === 'transmission') {
          material[key] = value * 0.6; // Reduced transmission
          return;
        }
        
        if (!usePBR && key === 'ior') {
          material[key] = Math.min(value, 2.0); // Capped IOR
          return;
        }
        
        // Assign regular properties
        material[key] = value;
      });
      
      // ENHANCED: Handle color properties with validation
      if (config.materials.crystal.color) {
        material.color.copy(config.materials.crystal.color);
      }
      if (config.materials.crystal.emissive) {
        material.emissive.copy(config.materials.crystal.emissive);
      }
      if (config.materials.crystal.attenuationColor) {
        material.attenuationColor.copy(config.materials.crystal.attenuationColor);
      }
      if (material.specularColor && config.materials.crystal.specularColor) {
        material.specularColor.copy(config.materials.crystal.specularColor);
      }
      
      // Restore or enhance emissive intensity
      material.emissiveIntensity = Math.max(currentEmissiveIntensity, material.emissiveIntensity || 0);
      
      // UPDATED: Ensure shadow settings are maintained
      material.shadowSide = THREE.DoubleSide;
      
      // ENHANCED: Apply variant-specific updates with PBR awareness
      switch(variant) {
        case 'glass':
          material.color.set('#ffffff');
          material.transmission = usePBR ? 0.95 : 0.5;
          material.ior = usePBR ? 1.5 : 1.4;
          material.metalness = 0.0;
          material.roughness = usePBR ? 0.05 : 0.08;
          material.attenuationColor.set('#ffffff');
          material.attenuationDistance = usePBR ? 0.5 : 0.3;
          material.clearcoat = usePBR ? 1.0 : 0.8;
          material.clearcoatRoughness = usePBR ? 0.02 : 0.03;
          material.iridescence = usePBR ? 0.1 : 0.15;
          material.iridescenceIOR = 1.5;
          material.emissive.set('#ffffff');
          material.emissiveIntensity = Math.max(0.03, currentEmissiveIntensity);
          material.envMapIntensity = usePBR ? 1.5 : 1.2;
          break;
          
        case 'gem':
          material.color.set('#7b4bbc');
          material.transmission = usePBR ? 0.7 : 0.4;
          material.ior = usePBR ? 2.5 : 2.0;
          material.metalness = usePBR ? 0.1 : 0.15;
          material.roughness = usePBR ? 0.05 : 0.08;
          material.attenuationColor.set('#7b4bbc');
          material.attenuationDistance = usePBR ? 0.2 : 0.15;
          material.clearcoat = usePBR ? 0.8 : 0.7;
          material.clearcoatRoughness = usePBR ? 0.01 : 0.02;
          material.iridescence = usePBR ? 0.5 : 0.6;
          material.iridescenceIOR = 1.2;
          material.emissive.set('#7b4bbc');
          material.emissiveIntensity = Math.max(0.08, currentEmissiveIntensity);
          material.envMapIntensity = usePBR ? 1.3 : 1.1;
          break;
          
        case 'holographic':
          material.color.set('#00ffff');
          material.transmission = usePBR ? 0.6 : 0.4;
          material.ior = usePBR ? 2.0 : 1.8;
          material.metalness = usePBR ? 0.3 : 0.5;
          material.roughness = usePBR ? 0.1 : 0.05;
          material.attenuationColor.set('#ff00ff');
          material.attenuationDistance = usePBR ? 0.1 : 0.08;
          material.clearcoat = usePBR ? 1.0 : 0.9;
          material.clearcoatRoughness = usePBR ? 0.0 : 0.01;
          material.iridescence = usePBR ? 1.0 : 0.8;
          material.iridescenceIOR = usePBR ? 2.0 : 1.8;
          material.emissive.set('#00ffff');
          material.emissiveIntensity = Math.max(0.15, currentEmissiveIntensity);
          material.envMapIntensity = usePBR ? 2.0 : 1.5;
          break;

        default:
          // Apply performance adjustments to default settings
          if (!usePBR) {
            material.transmission *= 0.6;
            material.ior = Math.min(material.ior, 2.0);
            material.clearcoat *= 0.8;
            material.iridescence *= 0.8;
            material.attenuationDistance *= 1.2;
            material.envMapIntensity = Math.max(material.envMapIntensity * 0.9, 1.0);
            
            // Boost compensating properties
            material.metalness = Math.min(material.metalness + 0.05, 0.2);
            material.reflectivity = Math.min(material.reflectivity + 0.1, 1.0);
          }
          break;
      }

      if (isMedium && usePBR) {
        // Transmission intentionally kept at high's value for glow parity (see note above).
        if (material.clearcoat !== undefined) material.clearcoat *= 0.7;
        if (material.iridescence !== undefined) material.iridescence *= 0.5;
      }
      
      material.needsUpdate = true;
    };

    // Create or update material
    if (materialRef.current) {
      updateMaterial();
    } else {
      createMaterial();
    }
    
    if (onMaterialReady) onMaterialReady(materialRef.current);
    
  }, [config.materials.crystal, variant, materialRef, usePBR, isMedium, useNormalMaps]);
  
  // ENHANCED: Separate effect for handling normal maps with better error handling
  useEffect(() => {
    if (!materialRef.current) return;

    const controller = new AbortController();
    let cancelled = false;

    if (useNormalMaps && config.assets.textures.normalMap) {
      if (import.meta.env.DEV) console.log('📋 Loading enhanced normal map:', config.assets.textures.normalMap);

      // Load normal map with enhanced settings
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        config.assets.textures.normalMap, 
        (texture) => {
          if (cancelled || controller.signal.aborted || !useNormalMaps) {
            texture.dispose();
            return;
          }

          // ENHANCED: Configure texture with better settings
          texture.wrapS = config.materials.textures.normalMap.wrapS;
          texture.wrapT = config.materials.textures.normalMap.wrapT;
          texture.repeat.set(...config.materials.textures.normalMap.repeat);

          // ENHANCED: Set texture quality with performance considerations
          const mipmapEnabled = textureQuality !== 'low';
          let anisotropy = 1;
          
          switch (textureQuality) {
            case 'high':
              anisotropy = usePBR ? 4 : 2; // Reduce anisotropy for non-PBR
              break;
            case 'medium':
              anisotropy = 2;
              break;
            default:
              anisotropy = 1;
          }

          texture.minFilter = mipmapEnabled ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
          texture.generateMipmaps = mipmapEnabled;
          texture.anisotropy = anisotropy;
          texture.colorSpace = THREE.SRGBColorSpace;

          // ENHANCED: Adaptive normal scale based on PBR mode
          const normalScale = usePBR ? new THREE.Vector2(0.02, 0.03) : new THREE.Vector2(0.02, 0.03);
          
          materialRef.current.normalMap = texture;
          materialRef.current.normalScale = normalScale;
          materialRef.current.needsUpdate = true;

          if (import.meta.env.DEV) console.log('✅ Enhanced normal map applied:', {
            usePBR,
            quality: textureQuality,
            anisotropy,
            normalScale: normalScale.toArray()
          });
        },
        undefined, // onProgress
        (error) => {
          if (import.meta.env.DEV) console.error('❌ Failed to load normal map:', error);
        }
      );
    } else {
      // Remove normal map if disabled
      if (materialRef.current.normalMap) {
        if (import.meta.env.DEV) console.log('🗑️ Removing normal map');
        materialRef.current.normalMap = null;
        materialRef.current.normalScale.set(0, 0);
        materialRef.current.needsUpdate = true;
      }
    }

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    useNormalMaps,
    config.assets.textures.normalMap,
    config.materials.textures.normalMap,
    textureQuality,
    usePBR,
    materialRef.current
  ]);
  
  return null; // This component doesn't render anything
};

export default CrystalMaterial;