// MaterialManager.jsx - ENHANCED: Advanced non-PBR materials that closely mimic PBR
// Uses MeshPhysicalMaterial with PBR features disabled but enhanced visual effects

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
  const enhancedBasicMaterialRef = useRef();
  
  const usePBR = performanceConfig.usePBR !== false;
  
  console.log('🎨 MaterialManager: PBR enabled?', usePBR, 'Performance config:', performanceConfig);

  // ENHANCED: Create advanced non-PBR material that mimics PBR appearance
  useEffect(() => {
    if (!usePBR && !enhancedBasicMaterialRef.current) {
      console.log('🔄 Creating enhanced non-PBR material with advanced features');
      
      // Use MeshPhysicalMaterial but disable expensive PBR features
      let materialProps = {
        // Keep transparency and basic properties
        transparent: true,
        side: THREE.DoubleSide,
        fog: true,
        depthWrite: false,
        depthTest: true,
        
        // ENHANCED: Add environment mapping for reflections (key for crystal look)
        envMapIntensity: 1.2,  // Strong reflections
        
        // ENHANCED: Use slight transmission even without full PBR
        transmission: 0.3,     // Reduced from PBR version but still gives glass effect
        
        // ENHANCED: Add clearcoat for surface reflections
        clearcoat: 0.8,        // High clearcoat for crystal-like surface
        clearcoatRoughness: 0.05, // Very smooth clearcoat
        
        // ENHANCED: Add iridescence for prismatic effects
        iridescence: 0.6,      // Moderate iridescence
        iridescenceIOR: 1.3,   // Controls iridescence strength
        
        // Standard material properties
        metalness: 0.1,        // Slight metallic for reflections
        roughness: 0.15,       // Smooth surface
        
        // ENHANCED: Add refraction with simple IOR
        ior: 1.8,              // Simpler than PBR but still gives refraction
        
        // ENHANCED: Add attenuation for depth-based color
        attenuationDistance: 0.2,
        
        // ENHANCED: Reflectivity for additional shine
        reflectivity: 0.9,
      };

      // Apply variant-specific properties with enhanced settings
      switch(materialVariant) {
        case 'glass':
          materialProps = {
            ...materialProps,
            color: new THREE.Color('#ffffff'),
            opacity: 0.6,           // More transparent for glass
            emissive: new THREE.Color('#ffffff'),
            emissiveIntensity: 0.03,
            attenuationColor: new THREE.Color('#ffffff'),
            transmission: 0.5,      // Higher transmission for glass
            clearcoat: 1.0,         // Maximum clearcoat for glass
            clearcoatRoughness: 0.02,
            iridescence: 0.2,       // Subtle iridescence for glass
            metalness: 0.0,         // Glass isn't metallic
            roughness: 0.08,        // Very smooth
            envMapIntensity: 1.5,   // Strong reflections
            ior: 1.5,               // Glass-like refraction
          };
          break;
          
        case 'gem':
          materialProps = {
            ...materialProps,
            color: new THREE.Color('#7b4bbc'),
            opacity: 0.8,
            emissive: new THREE.Color('#7b4bbc'),
            emissiveIntensity: 0.08,
            attenuationColor: new THREE.Color('#7b4bbc'),
            transmission: 0.4,      // Good transmission for gem
            clearcoat: 0.9,         // High clearcoat for gem shine
            clearcoatRoughness: 0.01,
            iridescence: 0.8,       // Strong iridescence for gem
            iridescenceIOR: 1.4,
            metalness: 0.2,         // Slight metallic for gem-like reflections
            roughness: 0.05,        // Very smooth gem surface
            envMapIntensity: 1.3,
            ior: 2.2,               // High refraction for gem
          };
          break;
          
        case 'holographic':
          materialProps = {
            ...materialProps,
            color: new THREE.Color('#00ffff'),
            opacity: 0.7,
            emissive: new THREE.Color('#00ffff'),
            emissiveIntensity: 0.15,
            attenuationColor: new THREE.Color('#ff00ff'),
            transmission: 0.4,      // Good transmission
            clearcoat: 1.0,         // Maximum clearcoat for holographic
            clearcoatRoughness: 0.0,
            iridescence: 1.0,       // Maximum iridescence
            iridescenceIOR: 2.0,    // Strong iridescence effect
            metalness: 0.8,         // High metallic for holographic
            roughness: 0.0,         // Mirror-like surface
            envMapIntensity: 2.0,   // Very strong reflections
            ior: 2.0,               // Strong refraction
          };
          break;
          
        default:
          materialProps = {
            ...materialProps,
            color: config.materials.crystal.color,
            opacity: 0.85,
            emissive: new THREE.Color(config.materials.crystal.emissive),
            emissiveIntensity: 0.1,
            attenuationColor: new THREE.Color(config.materials.crystal.attenuationColor),
            transmission: 0.4,      // Good transmission
            clearcoat: 0.7,         // Good clearcoat
            clearcoatRoughness: 0.03,
            iridescence: 0.7,       // Strong iridescence
            iridescenceIOR: 1.2,
            metalness: 0.1,
            roughness: 0.12,
            envMapIntensity: 1.0,
            ior: 1.9,               // Close to PBR version
          };
          break;
      }
      
      // Create MeshPhysicalMaterial with enhanced settings
      const enhancedMaterial = new THREE.MeshPhysicalMaterial(materialProps);
      enhancedBasicMaterialRef.current = enhancedMaterial;
      
      console.log('✅ Enhanced non-PBR material created:', materialVariant);
      if (onMaterialReady) onMaterialReady(enhancedMaterial);
    }
  }, [usePBR, config.materials.crystal.color, config.materials.crystal.emissive, config.materials.crystal.attenuationColor, materialVariant]);

  // ENHANCED: Update material when variant changes with smooth transitions
  useEffect(() => {
    if (!usePBR && enhancedBasicMaterialRef.current) {
      console.log('🔄 Updating enhanced non-PBR material for variant:', materialVariant);
      
      const material = enhancedBasicMaterialRef.current;
      
      // Store current emissive intensity to preserve glow effects
      const currentEmissiveIntensity = material.emissiveIntensity;
      
      // Update material properties based on variant with enhanced settings
      switch(materialVariant) {
        case 'glass':
          material.color.set('#ffffff');
          material.opacity = 0.6;
          material.emissive.set('#ffffff');
          material.emissiveIntensity = Math.max(0.03, currentEmissiveIntensity);
          material.attenuationColor.set('#ffffff');
          material.transmission = 0.5;
          material.clearcoat = 1.0;
          material.clearcoatRoughness = 0.02;
          material.iridescence = 0.2;
          material.iridescenceIOR = 1.3;
          material.metalness = 0.0;
          material.roughness = 0.08;
          material.envMapIntensity = 1.5;
          material.ior = 1.5;
          break;
          
        case 'gem':
          material.color.set('#7b4bbc');
          material.opacity = 0.8;
          material.emissive.set('#7b4bbc');
          material.emissiveIntensity = Math.max(0.08, currentEmissiveIntensity);
          material.attenuationColor.set('#7b4bbc');
          material.transmission = 0.4;
          material.clearcoat = 0.9;
          material.clearcoatRoughness = 0.01;
          material.iridescence = 0.8;
          material.iridescenceIOR = 1.4;
          material.metalness = 0.2;
          material.roughness = 0.05;
          material.envMapIntensity = 1.3;
          material.ior = 2.2;
          break;
          
        case 'holographic':
          material.color.set('#00ffff');
          material.opacity = 0.7;
          material.emissive.set('#00ffff');
          material.emissiveIntensity = Math.max(0.15, currentEmissiveIntensity);
          material.attenuationColor.set('#ff00ff');
          material.transmission = 0.4;
          material.clearcoat = 1.0;
          material.clearcoatRoughness = 0.0;
          material.iridescence = 1.0;
          material.iridescenceIOR = 2.0;
          material.metalness = 0.8;
          material.roughness = 0.0;
          material.envMapIntensity = 2.0;
          material.ior = 2.0;
          break;
          
        default:
          material.color.copy(config.materials.crystal.color);
          material.opacity = 0.85;
          material.emissive.copy(config.materials.crystal.emissive);
          material.emissiveIntensity = Math.max(0.1, currentEmissiveIntensity);
          material.attenuationColor.copy(config.materials.crystal.attenuationColor);
          material.transmission = 0.4;
          material.clearcoat = 0.7;
          material.clearcoatRoughness = 0.03;
          material.iridescence = 0.7;
          material.iridescenceIOR = 1.2;
          material.metalness = 0.1;
          material.roughness = 0.12;
          material.envMapIntensity = 1.0;
          material.ior = 1.9;
          break;
      }
      
      material.needsUpdate = true;
    }
  }, [materialVariant, usePBR, config.materials.crystal]);

  // ENHANCED: Add normal map support even for non-PBR materials
  useEffect(() => {
    if (!usePBR && enhancedBasicMaterialRef.current && performanceConfig.useNormalMaps && config.assets.textures.normalMap) {
      console.log('🔧 Adding normal map to enhanced non-PBR material');
      
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(config.assets.textures.normalMap, (texture) => {
        texture.wrapS = config.materials.textures.normalMap.wrapS;
        texture.wrapT = config.materials.textures.normalMap.wrapT;
        texture.repeat.set(...config.materials.textures.normalMap.repeat);
        
        // Configure texture quality
        const textureQuality = performanceConfig.textureQuality || 'high';
        const mipmapEnabled = textureQuality !== 'low';
        const anisotropy = textureQuality === 'high' ? 4 : (textureQuality === 'medium' ? 2 : 1);
        
        texture.minFilter = mipmapEnabled ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
        texture.generateMipmaps = mipmapEnabled;
        texture.anisotropy = anisotropy;
        texture.colorSpace = THREE.SRGBColorSpace;
        
        enhancedBasicMaterialRef.current.normalMap = texture;
        enhancedBasicMaterialRef.current.normalScale = new THREE.Vector2(0.3, 0.3);
        enhancedBasicMaterialRef.current.needsUpdate = true;
        
        console.log('✅ Normal map added to enhanced non-PBR material');
      });
    } else if (!usePBR && enhancedBasicMaterialRef.current && !performanceConfig.useNormalMaps) {
      // Remove normal map if disabled
      if (enhancedBasicMaterialRef.current.normalMap) {
        enhancedBasicMaterialRef.current.normalMap = null;
        enhancedBasicMaterialRef.current.normalScale.set(0, 0);
        enhancedBasicMaterialRef.current.needsUpdate = true;
      }
    }
  }, [usePBR, performanceConfig.useNormalMaps, performanceConfig.textureQuality, config.assets.textures.normalMap, config.materials.textures.normalMap]);

  // Update the main material ref whenever the variant or performance config changes
  useEffect(() => {
    console.log('🔄 MaterialManager: Updating material reference', {
      variant: materialVariant,
      usePBR,
      previousMaterial: materialRef.current?.type
    });
    
    if (materialRef.current) {
      console.log('🗑️ Disposing previous material:', materialRef.current.type);
    }
    
    if (!usePBR) {
      materialRef.current = enhancedBasicMaterialRef.current;
      console.log('✅ Using enhanced non-PBR material (advanced features enabled)');
    } else {
      materialRef.current = crystalMaterialRef.current;
      console.log('✅ Using full PBR crystal material:', materialVariant);
    }

    if (onMaterialReady) onMaterialReady(materialRef.current);
  }, [materialVariant, materialRef, usePBR]);
  
  // Only render PBR material component if PBR is enabled
  if (!usePBR) {
    console.log('🚫 Skipping PBR material component (using enhanced non-PBR instead)');
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
      performanceConfig={performanceConfig}
      onMaterialReady={onMaterialReady}
    />
  );
};

export default MaterialManager;