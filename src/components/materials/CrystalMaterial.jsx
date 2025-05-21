// CrystalMaterial.jsx - Fix for updateMaterial reference error
import React, { useEffect } from 'react';
import * as THREE from 'three';

/**
 * Component to create and apply the base crystal material
 */
const CrystalMaterial = ({ config, materialRef, variant = 'default' }) => {
  // Create and update the material
  useEffect(() => {
    // Create functions INSIDE useEffect to avoid reference errors
    const createMaterial = () => {
      const baseConfig = { ...config.materials.crystal };
      
      // Apply variant-specific overrides
      switch(variant) {
        case 'glass':
          // More transparent, less colorful
          baseConfig.color = new THREE.Color('#ffffff');
          baseConfig.transmission = 0.95;
          baseConfig.ior = 1.5;
          baseConfig.metalness = 0.0;
          baseConfig.roughness = 0.05;
          baseConfig.attenuationColor = new THREE.Color('#ffffff');
          baseConfig.attenuationDistance = 0.5;
          baseConfig.clearcoat = 1.0;
          baseConfig.clearcoatRoughness = 0.02;
          baseConfig.iridescence = 0.1;
          baseConfig.iridescenceIOR = 1.5;
          baseConfig.emissive = new THREE.Color('#ffffff');
          break;
          
        case 'gem':
          // Rich purple gemstone
          baseConfig.color = new THREE.Color('#7b4bbc');
          baseConfig.transmission = 0.7;
          baseConfig.ior = 2.5;
          baseConfig.metalness = 0.1;
          baseConfig.roughness = 0.05;
          baseConfig.attenuationColor = new THREE.Color('#7b4bbc');
          baseConfig.attenuationDistance = 0.2;
          baseConfig.clearcoat = 0.8;
          baseConfig.clearcoatRoughness = 0.01;
          baseConfig.iridescence = 0.5;
          baseConfig.iridescenceIOR = 1.2;
          baseConfig.emissive = new THREE.Color('#7b4bbc');
          break;
          
        case 'holographic':
          // Futuristic, colorful effect
          baseConfig.color = new THREE.Color('#00ffff');
          baseConfig.transmission = 0.6;
          baseConfig.ior = 2.0;
          baseConfig.metalness = 0.3;
          baseConfig.roughness = 0.1;
          baseConfig.attenuationColor = new THREE.Color('#ff00ff');
          baseConfig.attenuationDistance = 0.1;
          baseConfig.clearcoat = 1.0;
          baseConfig.clearcoatRoughness = 0.0;
          baseConfig.iridescence = 1.0;
          baseConfig.iridescenceIOR = 2.0;
          baseConfig.emissive = new THREE.Color('#00ffff');
          break;
          
        default:
          // Use default settings from config
          break;
      }
      
      // Create the material
      const material = new THREE.MeshPhysicalMaterial(baseConfig);
      
      // Add a normal map if available
      if (config.assets.textures.normalMap) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(config.assets.textures.normalMap, (texture) => {
          texture.wrapS = config.materials.textures.normalMap.wrapS;
          texture.wrapT = config.materials.textures.normalMap.wrapT;
          texture.repeat.set(...config.materials.textures.normalMap.repeat);
          
          material.normalMap = texture;
          material.normalScale = new THREE.Vector2(0.3, 0.3);
          material.needsUpdate = true;
        });
      }
      
      // Store the material
      materialRef.current = material;
    };
    
    // Update existing material with new properties
    const updateMaterial = () => {
      if (!materialRef.current) return;
      
      // Important: Make sure emissive intensity is applied
      // This is critical for the glow effect
      const emissiveIntensity = materialRef.current.emissiveIntensity || 0;
      
      Object.entries(config.materials.crystal).forEach(([key, value]) => {
        // Skip properties that shouldn't be directly assigned
        if (key === 'emissive' || key === 'color' || key === 'attenuationColor' || key === 'specularColor') {
          return;
        }
        
        // Assign the rest
        materialRef.current[key] = value;
      });
      
      // Set color properties
      materialRef.current.color.copy(config.materials.crystal.color);
      materialRef.current.emissive.copy(config.materials.crystal.emissive);
      materialRef.current.attenuationColor.copy(config.materials.crystal.attenuationColor);
      materialRef.current.specularColor.copy(config.materials.crystal.specularColor);
      
      // Restore emissive intensity
      materialRef.current.emissiveIntensity = emissiveIntensity;
      
      // Apply variant-specific overrides
      switch(variant) {
        case 'glass':
          materialRef.current.color.set('#ffffff');
          materialRef.current.transmission = 0.95;
          materialRef.current.ior = 1.5;
          materialRef.current.metalness = 0.0;
          materialRef.current.roughness = 0.05;
          materialRef.current.attenuationColor.set('#ffffff');
          materialRef.current.attenuationDistance = 0.5;
          materialRef.current.clearcoat = 1.0;
          materialRef.current.clearcoatRoughness = 0.02;
          materialRef.current.iridescence = 0.1;
          materialRef.current.iridescenceIOR = 1.5;
          materialRef.current.emissive.set('#ffffff');
          break;
          
        case 'gem':
          materialRef.current.color.set('#7b4bbc');
          materialRef.current.transmission = 0.7;
          materialRef.current.ior = 2.5;
          materialRef.current.metalness = 0.1;
          materialRef.current.roughness = 0.05;
          materialRef.current.attenuationColor.set('#7b4bbc');
          materialRef.current.attenuationDistance = 0.2;
          materialRef.current.clearcoat = 0.8;
          materialRef.current.clearcoatRoughness = 0.01;
          materialRef.current.iridescence = 0.5;
          materialRef.current.iridescenceIOR = 1.2;
          materialRef.current.emissive.set('#7b4bbc');
          break;
          
        case 'holographic':
          materialRef.current.color.set('#00ffff');
          materialRef.current.transmission = 0.6;
          materialRef.current.ior = 2.0;
          materialRef.current.metalness = 0.3;
          materialRef.current.roughness = 0.1;
          materialRef.current.attenuationColor.set('#ff00ff');
          materialRef.current.attenuationDistance = 0.1;
          materialRef.current.clearcoat = 1.0;
          materialRef.current.clearcoatRoughness = 0.0;
          materialRef.current.iridescence = 1.0;
          materialRef.current.iridescenceIOR = 2.0;
          materialRef.current.emissive.set('#00ffff');
          break;
          
        default:
          // Keep settings from config
          break;
      }
      
      materialRef.current.needsUpdate = true;
    };

    // If material already exists, just update it
    if (materialRef.current) {
      updateMaterial();
      return;
    }
    
    // Otherwise create new material
    createMaterial();
    
  }, [config.materials.crystal, variant, config.assets.textures.normalMap, config.materials.textures.normalMap]);
  
  return null; // This component doesn't render anything
};

export default CrystalMaterial;