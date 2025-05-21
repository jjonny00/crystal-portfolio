// CrystalMaterial.jsx - Fixed normal map toggling issue
import React, { useEffect } from 'react';
import * as THREE from 'three';

/**
 * Component to create and apply the base crystal material
 * Updated for Three.js compatibility with fixed normal map toggling
 */
const CrystalMaterial = ({ 
  config, 
  materialRef, 
  variant = 'default',
  performanceConfig = {}
}) => {
  // Set default performance settings if not provided
  const {
    useNormalMaps = true,
    textureQuality = 'high',
    usePBR = true
  } = performanceConfig;
  
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
      
      // Store the material
      materialRef.current = material;
      
      // We'll load the normal map in a separate effect
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
        
        // Skip PBR-specific properties if PBR is disabled
        if (!usePBR && (
          key === 'clearcoat' || 
          key === 'clearcoatRoughness' || 
          key === 'iridescence' || 
          key === 'iridescenceIOR' || 
          key === 'iridescenceThicknessRange'
        )) {
          if (key === 'clearcoat' || key === 'iridescence') {
            materialRef.current[key] = 0;
          }
          return;
        }
        
        // Adjust transmission and IOR for non-PBR mode
        if (!usePBR && key === 'transmission') {
          materialRef.current[key] = value * 0.7;
          return;
        }
        
        if (!usePBR && key === 'ior') {
          materialRef.current[key] = Math.min(value, 1.5);
          return;
        }
        
        // Assign the rest
        materialRef.current[key] = value;
      });
      
      // Set color properties
      materialRef.current.color.copy(config.materials.crystal.color);
      materialRef.current.emissive.copy(config.materials.crystal.emissive);
      materialRef.current.attenuationColor.copy(config.materials.crystal.attenuationColor);
      
      if (materialRef.current.specularColor) {
        materialRef.current.specularColor.copy(config.materials.crystal.specularColor);
      }
      
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
          // Apply performance adjustments to default settings
          if (!usePBR) {
            materialRef.current.transmission *= 0.7;
            materialRef.current.ior = Math.min(materialRef.current.ior, 1.5);
            materialRef.current.clearcoat = 0;
            materialRef.current.iridescence = 0;
            materialRef.current.attenuationDistance *= 0.5;
          }
          break;
      }
    };

    // If material already exists, just update it
    if (materialRef.current) {
      updateMaterial();
      return;
    }
    
    // Otherwise create new material
    createMaterial();
    
  }, [config.materials.crystal, variant, materialRef, usePBR]);
  
  // Separate effect for handling normal maps - this ensures they reload when useNormalMaps changes
  useEffect(() => {
    if (!materialRef.current) return;
    
    if (useNormalMaps && config.assets.textures.normalMap) {
      console.log('Loading normal map for crystal material:', config.assets.textures.normalMap);
      
      // Load normal map
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(config.assets.textures.normalMap, (texture) => {
        texture.wrapS = config.materials.textures.normalMap.wrapS;
        texture.wrapT = config.materials.textures.normalMap.wrapT;
        texture.repeat.set(...config.materials.textures.normalMap.repeat);
        
        // Set texture quality based on performance settings
        const mipmapEnabled = textureQuality !== 'low';
        const anisotropy = textureQuality === 'high' ? 4 : (textureQuality === 'medium' ? 2 : 1);
        
        texture.minFilter = mipmapEnabled ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
        texture.generateMipmaps = mipmapEnabled;
        texture.anisotropy = anisotropy;
        texture.colorSpace = THREE.SRGBColorSpace;
        
        // Apply the normal map to the material
        materialRef.current.normalMap = texture;
        materialRef.current.normalScale = new THREE.Vector2(0.3, 0.3);
        materialRef.current.needsUpdate = true;
        
        console.log('Normal map applied to crystal material');
      });
    } else {
      // Remove normal map if disabled
      if (materialRef.current.normalMap) {
        console.log('Removing normal map from crystal material');
        materialRef.current.normalMap = null;
        materialRef.current.normalScale.set(0, 0);
        materialRef.current.needsUpdate = true;
      }
    }
  }, [
    useNormalMaps, 
    config.assets.textures.normalMap, 
    config.materials.textures.normalMap, 
    textureQuality,
    materialRef.current // This ensures the effect runs when the material is created or changed
  ]);
  
  return null; // This component doesn't render anything
};

export default CrystalMaterial;